/**
 * POST /api/dashboard/admin/manage-license
 * Permite al rol admin extender vigencia, liberar HWID, suspender, reactivar, revocar o editar plan/vencimiento.
 */
import {
    jsonSegura,
    leerJsonEstricto,
    supabaseRestRequest,
    validarEsquemaPermitido,
} from "../../../_shared/security.js";
import { requireDashboardUser } from "../_auth_guard.js";

const CAMPOS_PERMITIDOS = ["license_id", "license_key", "action", "extra_days", "status", "plan_name", "expires_at", "max_seats", "max_rucs"];
const PLANES_VALIDOS = ["EMPRENDEDOR", "COMERCIAL_PRO", "CONTADOR", "ESTUDIO_CONTABLE", "ENTERPRISE", "DEMO_15_DIAS"];

export async function onRequestPost(context) {
    const { request, env } = context;
    const auth = await requireDashboardUser(request, env, ["admin"]);
    if (!auth.ok) return auth.response;

    const body = await leerJsonEstricto(request, 4096);
    if (!body.ok) return jsonSegura({ ok: false, error: body.error }, body.status);

    const esquema = validarEsquemaPermitido(body.data, CAMPOS_PERMITIDOS, []);
    if (!esquema.ok) return jsonSegura({ ok: false, error: esquema.error }, esquema.status);

    const action = String(body.data.action || "").trim();
    const licId = String(body.data.license_id || "").trim();
    const licKey = String(body.data.license_key || "").trim();
    if (!licId && !licKey) return jsonSegura({ ok: false, error: "LICENSE_ID_OR_KEY_REQUIRED" }, 400);

    const filter = licId ? `id=eq.${encodeURIComponent(licId)}` : `license_key=eq.${encodeURIComponent(licKey)}`;
    const lookup = await supabaseRestRequest(
        auth.supaCfg,
        `licenses?${filter}&select=id,license_key,expires_at,hwid_inicial,status,plan_name&limit=1`,
        { method: "GET", serviceRole: true },
    );
    if (!lookup.ok || !Array.isArray(lookup.data) || lookup.data.length === 0) {
        return jsonSegura({ ok: false, error: "LICENSE_NOT_FOUND" }, 404);
    }
    const lic = lookup.data[0];

    if (action === "release_hwid") {
        await supabaseRestRequest(auth.supaCfg, `licenses?id=eq.${encodeURIComponent(lic.id)}`, {
            method: "PATCH", serviceRole: true, body: { hwid_inicial: null },
        });
        return jsonSegura({ ok: true, action, license_key: lic.license_key, hwid_released: true }, 200);
    }

    if (action === "extend_validity") {
        const extraDays = Number(body.data.extra_days || 0);
        if (!Number.isInteger(extraDays) || extraDays < 1 || extraDays > 1095) {
            return jsonSegura({ ok: false, error: "INVALID_EXTRA_DAYS" }, 400);
        }
        const baseDate = lic.expires_at ? new Date(lic.expires_at) : new Date();
        const nextExp = new Date(Math.max(baseDate.getTime(), Date.now()) + extraDays * 86400 * 1000).toISOString();
        await supabaseRestRequest(auth.supaCfg, `licenses?id=eq.${encodeURIComponent(lic.id)}`, {
            method: "PATCH", serviceRole: true, body: { expires_at: nextExp, status: "active", active_status: "activa" },
        });
        return jsonSegura({ ok: true, action, license_key: lic.license_key, expires_at: nextExp }, 200);
    }

    if (action === "set_status") {
        const st = String(body.data.status || "").trim();
        if (!["active", "read_only", "revoked"].includes(st)) {
            return jsonSegura({ ok: false, error: "INVALID_STATUS" }, 400);
        }
        const activeStatusMap = { active: "activa", read_only: "solo_lectura", revoked: "revocada" };
        await supabaseRestRequest(auth.supaCfg, `licenses?id=eq.${encodeURIComponent(lic.id)}`, {
            method: "PATCH", serviceRole: true, body: { status: st, active_status: activeStatusMap[st] },
        });
        return jsonSegura({ ok: true, action, license_key: lic.license_key, status: st }, 200);
    }

    if (action === "update_details") {
        const patch = {};
        if (body.data.plan_name && PLANES_VALIDOS.includes(String(body.data.plan_name))) {
            patch.plan_name = String(body.data.plan_name);
            patch.plan_id = String(body.data.plan_name);
        }
        if (body.data.expires_at) {
            const parsed = new Date(body.data.expires_at);
            if (!Number.isNaN(parsed.getTime())) patch.expires_at = parsed.toISOString();
        }
        if (Number.isInteger(Number(body.data.max_seats)) && Number(body.data.max_seats) >= 1) {
            patch.max_seats = Number(body.data.max_seats);
            patch.estaciones_autorizadas = Number(body.data.max_seats);
        }
        if (Number.isInteger(Number(body.data.max_rucs)) && Number(body.data.max_rucs) >= 1) {
            patch.max_rucs = Number(body.data.max_rucs);
        }
        if (Object.keys(patch).length === 0) {
            return jsonSegura({ ok: false, error: "NO_FIELDS_TO_UPDATE" }, 400);
        }
        await supabaseRestRequest(auth.supaCfg, `licenses?id=eq.${encodeURIComponent(lic.id)}`, {
            method: "PATCH", serviceRole: true, body: patch,
        });
        return jsonSegura({ ok: true, action, license_key: lic.license_key, updated: patch }, 200);
    }

    return jsonSegura({ ok: false, error: "UNKNOWN_LICENSE_ACTION" }, 400);
}

export async function onRequest(context) {
    if (String(context?.request?.method || "").toUpperCase() === "POST") return onRequestPost(context);
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
