/**
 * Espejo /api/v1/tenants/link-code — Genera código de enlace de 8 caracteres para Estudio Contable.
 * POST /api/v1/tenants/link-code
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

const CAMPOS_PERMITIDOS = ["ruc_cedula"];
const ALFABETO_CODE = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generarCodigo8() {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    let out = "";
    for (let i = 0; i < 8; i += 1) {
        out += ALFABETO_CODE[bytes[i] % ALFABETO_CODE.length];
    }
    return out;
}

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
    if (validarCamposComunesLicense({ ruc: rucCedula }) || !rucCedula) {
        return jsonSegura({ ok: false, error: "INVALID_RUC_CEDULA" }, 400);
    }

    const linkCode = generarCodigo8();
    const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

    if (env?.DB) {
        const id = crypto.randomUUID();
        await env.DB.prepare(
            "INSERT INTO contador_access (id, contador_user_id, tenant_ruc, link_code, status, expires_at) VALUES (?, ?, ?, ?, 'pending', ?)",
        ).bind(id, userObj.id, rucCedula, linkCode, expiresAt).run();
    }

    return jsonSegura({
        ok: true,
        tenant_ruc: rucCedula,
        link_code: linkCode,
        status: "pending",
        expires_at: expiresAt,
    }, 201);
}

export async function onRequest(context) {
    if (String(context?.request?.method || "").toUpperCase() === "POST") {
        return onRequestPost(context);
    }
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
