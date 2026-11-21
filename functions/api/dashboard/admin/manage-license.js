/**
 * POST /api/dashboard/admin/manage-license
 * Permite al rol admin extender vigencia o liberar el equipo autorizado (HWID) cuando un cliente cambia de PC.
 */
import {
    jsonSegura,
    leerJsonEstricto,
    supabaseRestRequest,
    validarEsquemaPermitido,
} from "../../../_shared/security.js";
import { requireDashboardUser } from "../_auth_guard.js";

const CAMPOS_PERMITIDOS = ["license_id", "license_key", "action", "extra_days"];

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

    const action = String(body.data.action || "").trim();
    const licId = String(body.data.license_id || "").trim();
    const licKey = String(body.data.license_key || "").trim();
    if (!licId && !licKey) {
        return jsonSegura({ ok: false, error: "LICENSE_ID_OR_KEY_REQUIRED" }, 400);
    }

    const filter = licId ? `id=eq.${encodeURIComponent(licId)}` : `license_key=eq.${encodeURIComponent(licKey)}`;
    const lookup = await supabaseRestRequest(
        auth.supaCfg,
        `licenses?${filter}&select=id,license_key,expires_at,hwid_inicial&limit=1`,
        { method: "GET", serviceRole: true },
    );
    if (!lookup.ok || !Array.isArray(lookup.data) || lookup.data.length === 0) {
        return jsonSegura({ ok: false, error: "LICENSE_NOT_FOUND" }, 404);
    }
    const lic = lookup.data[0];

    if (action === "release_hwid") {
        await supabaseRestRequest(
            auth.supaCfg,
            `licenses?id=eq.${encodeURIComponent(lic.id)}`,
            { method: "PATCH", serviceRole: true, body: { hwid_inicial: null } },
        );
        return jsonSegura({ ok: true, action, license_key: lic.license_key, hwid_released: true }, 200);
    }

    if (action === "extend_validity") {
        const extraDays = Number(body.data.extra_days || 0);
        if (!Number.isInteger(extraDays) || extraDays < 1 || extraDays > 730) {
            return jsonSegura({ ok: false, error: "INVALID_EXTRA_DAYS" }, 400);
        }
        const baseDate = lic.expires_at ? new Date(lic.expires_at) : new Date();
        const nextExp = new Date(Math.max(baseDate.getTime(), Date.now()) + extraDays * 86400 * 1000).toISOString();
        await supabaseRestRequest(
            auth.supaCfg,
            `licenses?id=eq.${encodeURIComponent(lic.id)}`,
            { method: "PATCH", serviceRole: true, body: { expires_at: nextExp, status: "active", active_status: "activa" } },
        );
        return jsonSegura({ ok: true, action, license_key: lic.license_key, expires_at: nextExp }, 200);
    }

    return jsonSegura({ ok: false, error: "UNKNOWN_LICENSE_ACTION" }, 400);
}

export async function onRequest(context) {
    if (String(context?.request?.method || "").toUpperCase() === "POST") {
        return onRequestPost(context);
    }
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
