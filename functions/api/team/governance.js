/**
 * Gobernanza Privada del Fundador (2FA TOTP aal2 obligatorio): POST /api/team/governance
 * Acciones:
 *  - revoke_license: revoca licencia / org_token
 *  - expand_license: amplía cupos (max_rucs, max_seats, cloud_gb) de un org_token
 *  - publish_release: publica reglas_sri.json o desktop_release (.exe)
 *  - settle_commission: liquida comisiones de vendedora/referido
 */
import { jsonSegura, leerJsonEstricto, supabaseRestRequest } from "../../_shared/security.js";
import { exigirStaffAutenticado } from "./_staff_guard.js";

export async function onRequestPost(context) {
    const { request, env } = context;
    const auth = await exigirStaffAutenticado(request, env, { requireAal2: true, allowedRoles: ["founder"] });
    if (!auth.ok) return auth.response;

    const { supaCfg, staff, user } = auth;
    if (staff.role !== "founder") {
        return jsonSegura({ ok: false, error: "FOUNDER_ROLE_REQUIRED" }, 403);
    }

    const body = await leerJsonEstricto(request, 32768);
    if (!body.ok) {
        return jsonSegura({ ok: false, error: body.error }, body.status);
    }

    const action = String(body.data.action || "").trim();
    const nowIso = new Date().toISOString();

    if (action === "revoke_license") {
        const orgToken = String(body.data.org_token || "").trim();
        if (!orgToken) {
            return jsonSegura({ ok: false, error: "ORG_TOKEN_REQUIRED" }, 400);
        }
        const res = await supabaseRestRequest(
            supaCfg,
            `licenses?org_token=eq.${encodeURIComponent(orgToken)}`,
            {
                method: "PATCH",
                serviceRole: true,
                body: { status: "revoked", active_status: "revocada" },
            },
        );
        if (!res.ok) {
            return jsonSegura({ ok: false, error: "REVOKE_FAILED", details: res.data }, 500);
        }
        await supabaseRestRequest(supaCfg, "audit_logs", {
            method: "POST",
            serviceRole: true,
            body: {
                actor_user_id: user.id,
                actor_role: staff.role,
                actor_city: staff.city,
                action: "founder_revoke_license",
                target_table: "licenses",
                target_id: orgToken,
                environment: "production",
                metadata_json: { reason: body.data.reason || "manual_governance" },
            },
        });
        return jsonSegura({ ok: true, action, org_token: orgToken, status: "revoked" }, 200);
    }

    if (action === "expand_license") {
        const orgToken = String(body.data.org_token || "").trim();
        if (!orgToken) {
            return jsonSegura({ ok: false, error: "ORG_TOKEN_REQUIRED" }, 400);
        }
        const patch = {};
        if (Number.isInteger(body.data.max_rucs) && body.data.max_rucs >= 1) patch.max_rucs = body.data.max_rucs;
        if (Number.isInteger(body.data.max_seats) && body.data.max_seats >= 1) {
            patch.max_seats = body.data.max_seats;
            patch.estaciones_autorizadas = body.data.max_seats;
        }
        if (Number.isInteger(body.data.cloud_gb) && body.data.cloud_gb >= 0) patch.cloud_gb = body.data.cloud_gb;

        if (Object.keys(patch).length === 0) {
            return jsonSegura({ ok: false, error: "NO_QUOTA_FIELDS_PROVIDED" }, 400);
        }

        const res = await supabaseRestRequest(
            supaCfg,
            `licenses?org_token=eq.${encodeURIComponent(orgToken)}`,
            { method: "PATCH", serviceRole: true, body: patch },
        );
        if (!res.ok) {
            return jsonSegura({ ok: false, error: "EXPAND_FAILED", details: res.data }, 500);
        }
        await supabaseRestRequest(supaCfg, "audit_logs", {
            method: "POST",
            serviceRole: true,
            body: {
                actor_user_id: user.id,
                actor_role: staff.role,
                actor_city: staff.city,
                action: "founder_expand_license",
                target_table: "licenses",
                target_id: orgToken,
                environment: "production",
                metadata_json: patch,
            },
        });
        return jsonSegura({ ok: true, action, org_token: orgToken, updated: patch }, 200);
    }

    if (action === "publish_release") {
        const configKey = String(body.data.config_key || "").trim();
        const version = String(body.data.version || "").trim();
        const payloadJson = body.data.payload_json;
        const sha256 = body.data.sha256 ? String(body.data.sha256).trim() : null;

        if (!["reglas_sri", "desktop_release"].includes(configKey) || !version || typeof payloadJson !== "object") {
            return jsonSegura({ ok: false, error: "INVALID_RELEASE_PAYLOAD" }, 400);
        }

        const res = await supabaseRestRequest(supaCfg, "app_config_releases", {
            method: "POST",
            serviceRole: true,
            body: {
                config_key: configKey,
                version,
                payload_json: payloadJson,
                sha256,
                published_by: user.id,
                published_at: nowIso,
            },
        });
        if (!res.ok) {
            return jsonSegura({ ok: false, error: "RELEASE_PUBLISH_FAILED", details: res.data }, 500);
        }
        return jsonSegura({ ok: true, action, config_key: configKey, version, published_at: nowIso }, 201);
    }

    if (action === "update_commission_policy") {
        const newSaleRate = Number(body.data.new_sale_rate);
        const renewalRate = Number(body.data.renewal_rate);
        const holdDays = Number(body.data.hold_days);

        if (
            !Number.isFinite(newSaleRate) || newSaleRate < 0 || newSaleRate > 50 ||
            !Number.isFinite(renewalRate) || renewalRate < 0 || renewalRate > 50 ||
            !Number.isInteger(holdDays) || holdDays < 0 || holdDays > 90
        ) {
            return jsonSegura({ ok: false, error: "INVALID_COMMISSION_POLICY_PARAMS" }, 400);
        }

        const res = await supabaseRestRequest(
            supaCfg,
            "commission_policies?on_conflict=id",
            {
                method: "POST",
                serviceRole: true,
                extraHeaders: { Prefer: "resolution=merge-duplicates,return=representation" },
                body: {
                    id: "default",
                    new_sale_rate: Math.round(newSaleRate * 100) / 100,
                    renewal_rate: Math.round(renewalRate * 100) / 100,
                    hold_days: holdDays,
                    updated_by: user.id,
                    updated_at: nowIso,
                },
            },
        );
        if (!res.ok) {
            return jsonSegura({ ok: false, error: "POLICY_UPDATE_FAILED", details: res.data }, 500);
        }
        await supabaseRestRequest(supaCfg, "audit_logs", {
            method: "POST",
            serviceRole: true,
            body: {
                actor_user_id: user.id,
                actor_role: staff.role,
                actor_city: staff.city,
                action: "founder_update_commission_policy",
                target_table: "commission_policies",
                target_id: "default",
                environment: "production",
                metadata_json: { new_sale_rate: newSaleRate, renewal_rate: renewalRate, hold_days: holdDays },
            },
        });
        return jsonSegura({ ok: true, action, policy: { new_sale_rate: newSaleRate, renewal_rate: renewalRate, hold_days: holdDays } }, 200);
    }

    if (action === "settle_commission") {
        const commissionId = String(body.data.commission_id || "").trim();
        const overrideHold = body.data.override_hold === true;
        const reason = String(body.data.reason || "").trim();
        if (!commissionId) {
            return jsonSegura({ ok: false, error: "COMMISSION_ID_REQUIRED" }, 400);
        }

        const checkRes = await supabaseRestRequest(
            supaCfg,
            `referral_commissions?id=eq.${encodeURIComponent(commissionId)}&select=id,status,eligible_at,commission_usd&limit=1`,
            { method: "GET", serviceRole: true },
        );
        if (!checkRes.ok || !Array.isArray(checkRes.data) || checkRes.data.length === 0) {
            return jsonSegura({ ok: false, error: "COMMISSION_NOT_FOUND" }, 404);
        }
        const row = checkRes.data[0];
        if (row.status === "paid") {
            return jsonSegura({ ok: true, idempotent: true, commission_id: commissionId, status: "paid" }, 200);
        }
        if (row.status === "reversed" || row.status === "pending_payment") {
            return jsonSegura({ ok: false, error: `CANNOT_SETTLE_STATUS_${row.status.toUpperCase()}` }, 400);
        }

        const isHoldElapsed = !row.eligible_at || new Date(row.eligible_at).getTime() <= Date.now();
        if (row.status === "pending_settlement" && !isHoldElapsed && !overrideHold) {
            return jsonSegura({
                ok: false,
                error: "HOLD_PERIOD_NOT_ELAPSED",
                eligible_at: row.eligible_at,
                message: "La comisión aún está en periodo de validación/retención. Espera a eligible_at o envía override_hold=true con motivo.",
            }, 409);
        }
        if (overrideHold && reason.length < 4) {
            return jsonSegura({ ok: false, error: "OVERRIDE_REASON_REQUIRED" }, 400);
        }

        const res = await supabaseRestRequest(
            supaCfg,
            `referral_commissions?id=eq.${encodeURIComponent(commissionId)}`,
            {
                method: "PATCH",
                serviceRole: true,
                body: { status: "paid", paid_at: nowIso },
            },
        );
        if (!res.ok) {
            return jsonSegura({ ok: false, error: "COMMISSION_SETTLE_FAILED", details: res.data }, 500);
        }
        await supabaseRestRequest(supaCfg, "audit_logs", {
            method: "POST",
            serviceRole: true,
            body: {
                actor_user_id: user.id,
                actor_role: staff.role,
                actor_city: staff.city,
                action: "founder_settle_commission",
                target_table: "referral_commissions",
                target_id: commissionId,
                environment: "production",
                metadata_json: { commission_usd: row.commission_usd, override_hold: overrideHold, reason: reason || null },
            },
        });
        return jsonSegura({ ok: true, action, commission_id: commissionId, status: "paid", paid_at: nowIso }, 200);
    }

    if (action === "reverse_commission") {
        const commissionId = String(body.data.commission_id || "").trim();
        const reason = String(body.data.reason || "payment_reversed").trim().slice(0, 200);
        if (!commissionId) {
            return jsonSegura({ ok: false, error: "COMMISSION_ID_REQUIRED" }, 400);
        }
        const res = await supabaseRestRequest(
            supaCfg,
            `referral_commissions?id=eq.${encodeURIComponent(commissionId)}`,
            {
                method: "PATCH",
                serviceRole: true,
                body: { status: "reversed", reversal_reason: reason },
            },
        );
        if (!res.ok) {
            return jsonSegura({ ok: false, error: "COMMISSION_REVERSE_FAILED", details: res.data }, 500);
        }
        await supabaseRestRequest(supaCfg, "audit_logs", {
            method: "POST",
            serviceRole: true,
            body: {
                actor_user_id: user.id,
                actor_role: staff.role,
                actor_city: staff.city,
                action: "founder_reverse_commission",
                target_table: "referral_commissions",
                target_id: commissionId,
                environment: "production",
                metadata_json: { reason },
            },
        });
        return jsonSegura({ ok: true, action, commission_id: commissionId, status: "reversed", reason }, 200);
    }

    return jsonSegura({ ok: false, error: "UNKNOWN_GOVERNANCE_ACTION" }, 400);
}

export async function onRequest(context) {
    if (String(context?.request?.method || "").toUpperCase() === "POST") {
        return onRequestPost(context);
    }
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
