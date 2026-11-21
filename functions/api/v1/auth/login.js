/**
 * Espejo /api/v1/auth/login para QuoraTec ERP de escritorio.
 * POST /api/v1/auth/login
 */
import {
    jsonSegura,
    leerJsonEstricto,
    obtenerConfigSupabaseEnv,
    validarCamposComunesLicense,
    validarEsquemaPermitido,
} from "../../../_shared/security.js";

const CAMPOS_PERMITIDOS = ["email", "password"];
const CAMPOS_PROHIBIDOS = ["role", "is_admin", "user_id"];

export async function onRequestPost(context) {
    const { request, env } = context;
    const body = await leerJsonEstricto(request, 4096);
    if (!body.ok) {
        return jsonSegura({ ok: false, error: body.error }, body.status);
    }

    const esquema = validarEsquemaPermitido(body.data, CAMPOS_PERMITIDOS, CAMPOS_PROHIBIDOS);
    if (!esquema.ok) {
        return jsonSegura({ ok: false, error: esquema.error }, esquema.status);
    }

    const { email, password } = body.data;
    if (validarCamposComunesLicense({ email }) || !email || typeof password !== "string" || password.length < 8) {
        return jsonSegura({ ok: false, error: "INVALID_CREDENTIALS_FORMAT" }, 400);
    }
    const cleanEmail = String(email).trim().toLowerCase();

    const supaCfg = obtenerConfigSupabaseEnv(env);
    if (!supaCfg.configured) {
        return jsonSegura({ ok: false, error: "AUTH_BACKEND_NOT_CONFIGURED" }, 503);
    }

    const resp = await fetch(`${supaCfg.url}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
            apikey: supaCfg.anonKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: cleanEmail, password }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || !data?.access_token) {
        return jsonSegura({ ok: false, error: "INVALID_CREDENTIALS" }, 401);
    }

    return jsonSegura({
        ok: true,
        access_token: data.access_token,
        refresh_token: data.refresh_token || null,
        expires_in: data.expires_in || 3600,
        user: data.user || { email: cleanEmail },
    }, 200);
}

export async function onRequest(context) {
    if (String(context?.request?.method || "").toUpperCase() === "POST") {
        return onRequestPost(context);
    }
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
