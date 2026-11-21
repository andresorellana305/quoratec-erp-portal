/**
 * Espejo /api/v1/tenants/bind-external — Vincula un RUC externo a un Estudio Contable mediante código de 8 caracteres.
 * POST /api/v1/tenants/bind-external
 */
import {
    jsonSegura,
    leerJsonEstricto,
    obtenerConfigSupabaseEnv,
    obtenerUsuarioSupabaseDesdeToken,
    validarBearerTokenHeader,
    validarCamposComunesLicense,
    validarEsquemaPermitido,
} from "../../../_shared/security.js";

const CAMPOS_PERMITIDOS = ["ruc_cedula", "link_code"];
const LINK_CODE_REGEX = /^[A-Z0-9]{8}$/;

export async function onRequestPost(context) {
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

    const body = await leerJsonEstricto(request, 2048);
    if (!body.ok) {
        return jsonSegura({ ok: false, error: body.error }, body.status);
    }
    const esquema = validarEsquemaPermitido(body.data, CAMPOS_PERMITIDOS, []);
    if (!esquema.ok) {
        return jsonSegura({ ok: false, error: esquema.error }, esquema.status);
    }

    const rucCedula = String(body.data.ruc_cedula || "").trim();
    const linkCode = String(body.data.link_code || "").trim().toUpperCase();

    if (validarCamposComunesLicense({ ruc: rucCedula }) || !rucCedula) {
        return jsonSegura({ ok: false, error: "INVALID_RUC_CEDULA" }, 400);
    }
    if (!LINK_CODE_REGEX.test(linkCode)) {
        return jsonSegura({ ok: false, error: "INVALID_LINK_CODE_8_CHARS" }, 400);
    }

    const boundAt = new Date().toISOString();

    if (env?.DB) {
        const existing = await env.DB.prepare(
            "SELECT id, status, expires_at FROM contador_access WHERE tenant_ruc = ? AND link_code = ? LIMIT 1",
        ).bind(rucCedula, linkCode).first();

        if (!existing) {
            return jsonSegura({ ok: false, error: "LINK_CODE_NOT_FOUND" }, 404);
        }
        if (existing.expires_at && new Date(existing.expires_at).getTime() < Date.now()) {
            return jsonSegura({ ok: false, error: "LINK_CODE_EXPIRED" }, 410);
        }

        await env.DB.prepare(
            "UPDATE contador_access SET contador_user_id = ?, status = 'active', bound_at = ? WHERE id = ?",
        ).bind(userObj.id, boundAt, existing.id).run();
    }

    return jsonSegura({
        ok: true,
        bound: true,
        tenant_ruc: rucCedula,
        link_code: linkCode,
        status: "active",
        bound_at: boundAt,
    }, 200);
}

export async function onRequest(context) {
    if (String(context?.request?.method || "").toUpperCase() === "POST") {
        return onRequestPost(context);
    }
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
