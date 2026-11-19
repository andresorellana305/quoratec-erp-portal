/**
 * Proxy seguro Supabase Auth + Consulta de Órdenes, Licencias y Equipos (+1 PC Adicional).
 * Contraseñas siempre procesadas y cifradas en Supabase Auth (nunca almacenadas en Edge ni cliente).
 */

import {
    esperarPisoTiempo,
    jsonSegura,
    leerJsonEstricto,
    obtenerConfigSupabaseEnv,
    obtenerUsuarioSupabaseDesdeToken,
    supabaseRestRequest,
    validarBearerTokenHeader,
    validarCamposComunesLicense,
    validarEsquemaPermitido,
} from "../../_shared/security.js";

const CAMPOS_PERMITIDOS = ["action", "email", "password"];
const CAMPOS_PROHIBIDOS = ["role", "is_admin", "user_id"];

export async function onRequestPost(context) {
    const { request, env } = context;
    const inicioMs = Date.now();

    try {
        const body = await leerJsonEstricto(request, 4096);
        if (!body.ok) {
            return jsonSegura({ ok: false, error: body.error }, body.status);
        }

        const esquema = validarEsquemaPermitido(body.data, CAMPOS_PERMITIDOS, CAMPOS_PROHIBIDOS);
        if (!esquema.ok) {
            return jsonSegura({ ok: false, error: esquema.error }, esquema.status);
        }

        const { action, email, password } = body.data;
        if (!["login", "signup", "recover", "dashboard"].includes(String(action))) {
            return jsonSegura({ ok: false, error: "INVALID_AUTH_ACTION" }, 400);
        }

        const supaCfg = obtenerConfigSupabaseEnv(env);
        if (!supaCfg.configured) {
            return jsonSegura(
                {
                    ok: false,
                    error: "SUPABASE_AUTH_NOT_CONFIGURED",
                    message: "Configura SUPABASE_URL y SUPABASE_ANON_KEY en Cloudflare Pages para activar Supabase Auth.",
                },
                503
            );
        }

        if (action === "dashboard") {
            const bearer = validarBearerTokenHeader(request);
            const userObj = await obtenerUsuarioSupabaseDesdeToken(supaCfg, bearer);
            if (!userObj) {
                return jsonSegura({ ok: false, error: "UNAUTHORIZED" }, 401);
            }
            const [ordRes, licRes] = await Promise.all([
                supabaseRestRequest(
                    supaCfg,
                    `orders?user_id=eq.${encodeURIComponent(userObj.id)}&order=created_at.desc&select=order_ref,plan_id,estaciones_autorizadas,monto_autorizado_usd,payment_channel,status,voucher_ref,created_at`,
                    { method: "GET", extraHeaders: { Authorization: `Bearer ${bearer}` } }
                ),
                supabaseRestRequest(
                    supaCfg,
                    `licenses?user_id=eq.${encodeURIComponent(userObj.id)}&select=id,license_key,plan_id,ruc_cedula,estaciones_autorizadas,active_status,issued_at,expires_at,license_devices(hwid,etiqueta,es_adicional,linked_at)`,
                    { method: "GET", extraHeaders: { Authorization: `Bearer ${bearer}` } }
                ),
            ]);

            return jsonSegura(
                {
                    ok: true,
                    user: userObj,
                    orders: Array.isArray(ordRes.data) ? ordRes.data : [],
                    licenses: Array.isArray(licRes.data) ? licRes.data : [],
                },
                200
            );
        }

        if (validarCamposComunesLicense({ email }) || !email) {
            return jsonSegura({ ok: false, error: "INVALID_EMAIL" }, 400);
        }
        const cleanEmail = String(email).trim().toLowerCase();

        if (action === "recover") {
            const resp = await fetch(`${supaCfg.url}/auth/v1/recover`, {
                method: "POST",
                headers: { apikey: supaCfg.anonKey, "Content-Type": "application/json" },
                body: JSON.stringify({ email: cleanEmail }),
            });
            // Respuesta uniforme anti-enumeración aunque el correo no exista
            return jsonSegura(
                {
                    ok: resp.status < 500,
                    message: "Si el correo está registrado en QuoraTec ERP, recibirás un enlace oficial de recuperación.",
                },
                200
            );
        }

        if (typeof password !== "string" || password.length < 10 || password.length > 128) {
            return jsonSegura({ ok: false, error: "PASSWORD_MIN_10_CHARS_REQUIRED" }, 400);
        }

        const endpoint = action === "login" ? "/auth/v1/token?grant_type=password" : "/auth/v1/signup";
        const resp = await fetch(`${supaCfg.url}${endpoint}`, {
            method: "POST",
            headers: { apikey: supaCfg.anonKey, "Content-Type": "application/json" },
            body: JSON.stringify({ email: cleanEmail, password }),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
            return jsonSegura(
                {
                    ok: false,
                    error: "AUTH_REJECTED",
                    message: action === "login" ? "Credenciales incorrectas o cuenta pendiente de confirmación." : "No fue posible crear la cuenta.",
                },
                401
            );
        }

        return jsonSegura(
            {
                ok: true,
                access_token: data.access_token || null,
                expires_in: data.expires_in || null,
                user: data.user ? { id: data.user.id, email: data.user.email } : null,
                requires_email_confirmation: action === "signup" && !data.access_token,
            },
            200
        );
    } finally {
        await esperarPisoTiempo(inicioMs, 20);
    }
}

export async function onRequest() {
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
