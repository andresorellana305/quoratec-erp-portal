/**
 * Espejo /api/v1/tenants para gestión Multi-RUC y Estudio Contable.
 * GET /api/v1/tenants
 */
import {
    jsonSegura,
    obtenerConfigSupabaseEnv,
    obtenerUsuarioSupabaseDesdeToken,
    supabaseRestRequest,
    validarBearerTokenHeader,
} from "../../_shared/security.js";

export async function onRequestGet(context) {
    const { request, env } = context;
    const bearer = validarBearerTokenHeader(request);
    if (!bearer) {
        return jsonSegura({ ok: false, error: "UNAUTHORIZED" }, 401);
    }

    const supaCfg = obtenerConfigSupabaseEnv(env);
    if (!supaCfg.configured) {
        return jsonSegura({ ok: false, error: "AUTH_BACKEND_NOT_CONFIGURED" }, 503);
    }
    const userObj = await obtenerUsuarioSupabaseDesdeToken(supaCfg, bearer);
    if (!userObj) {
        return jsonSegura({ ok: false, error: "INVALID_OR_EXPIRED_SESSION" }, 401);
    }

    let tenants = [];
    let contadorLinks = [];

    if (env?.DB) {
        try {
            const tRes = await env.DB.prepare(
                "SELECT id, org_token, ruc_cedula, razon_social, plan_id, is_active, created_at FROM tenants_ruc WHERE owner_user_id = ? AND is_active = 1 ORDER BY created_at DESC",
            ).bind(userObj.id).all();
            tenants = Array.isArray(tRes?.results) ? tRes.results : [];

            const cRes = await env.DB.prepare(
                "SELECT id, tenant_ruc, link_code, status, bound_at, created_at FROM contador_access WHERE contador_user_id = ? AND status = 'active' ORDER BY bound_at DESC",
            ).bind(userObj.id).all();
            contadorLinks = Array.isArray(cRes?.results) ? cRes.results : [];
        } catch {
            // Fallback a Supabase
        }
    }

    if (tenants.length === 0) {
        const licRes = await supabaseRestRequest(
            supaCfg,
            `licenses?user_id=eq.${encodeURIComponent(userObj.id)}&status=eq.active&select=org_token,holder_ruc,holder_name,plan_name,max_rucs,max_seats,cloud_gb,expires_at`,
            { method: "GET", extraHeaders: { Authorization: `Bearer ${bearer}` } },
        );
        if (licRes.ok && Array.isArray(licRes.data)) {
            tenants = licRes.data.map((l) => ({
                org_token: l.org_token,
                ruc_cedula: l.holder_ruc,
                razon_social: l.holder_name,
                plan_id: l.plan_name,
                max_rucs: l.max_rucs,
                max_seats: l.max_seats,
                cloud_gb: l.cloud_gb,
                expires_at: l.expires_at,
            }));
        }
    }

    return jsonSegura({
        ok: true,
        user_id: userObj.id,
        tenants,
        contador_access: contadorLinks,
    }, 200);
}

export async function onRequest(context) {
    if (String(context?.request?.method || "").toUpperCase() === "GET") {
        return onRequestGet(context);
    }
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
