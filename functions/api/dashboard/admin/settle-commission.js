/**
 * POST /api/dashboard/admin/settle-commission
 * Permite al rol admin marcar comisiones aprobadas de una asesora como liquidadas/pagadas.
 */
import {
    jsonSegura,
    leerJsonEstricto,
    supabaseRestRequest,
    validarEsquemaPermitido,
} from "../../../_shared/security.js";
import { requireDashboardUser } from "../_auth_guard.js";

const CAMPOS_PERMITIDOS = ["commission_id", "asesor_code", "override_hold"];

export async function onRequestPost(context) {
    const { request, env } = context;
    const auth = await requireDashboardUser(request, env, ["admin"]);
    if (!auth.ok) return auth.response;

    const body = await leerJsonEstricto(request, 4096);
    if (!body.ok) {
        return jsonSegura({ ok: false, error: body.error }, body.status);
    }
    const esquema = validarEsquemaPermitido(body.data, CAMPOS_PERMITIDOS, []);
    if (!esquema.ok) {
        return jsonSegura({ ok: false, error: esquema.error }, esquema.status);
    }

    const commissionId = String(body.data.commission_id || "").trim();
    const asesorCode = String(body.data.asesor_code || "").trim().toUpperCase();
    const overrideHold = body.data.override_hold === true;
    const nowIso = new Date().toISOString();

    if (!commissionId && !asesorCode) {
        return jsonSegura({ ok: false, error: "COMMISSION_ID_OR_ASESOR_CODE_REQUIRED" }, 400);
    }

    const filter = commissionId
        ? `id=eq.${encodeURIComponent(commissionId)}`
        : `referral_code=eq.${encodeURIComponent(asesorCode)}&status=${overrideHold ? "in.(payable,pending_settlement)" : "eq.payable"}`;

    const res = await supabaseRestRequest(
        auth.supaCfg,
        `referral_commissions?${filter}`,
        {
            method: "PATCH",
            serviceRole: true,
            extraHeaders: { Prefer: "return=representation" },
            body: { status: "paid", paid_at: nowIso },
        },
    );
    if (!res.ok) {
        return jsonSegura({ ok: false, error: "SETTLE_COMMISSION_FAILED" }, 500);
    }

    const settledRows = Array.isArray(res.data) ? res.data : [];
    return jsonSegura({
        ok: true,
        settled_count: settledRows.length,
        paid_at: nowIso,
    }, 200);
}

export async function onRequest(context) {
    if (String(context?.request?.method || "").toUpperCase() === "POST") {
        return onRequestPost(context);
    }
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
