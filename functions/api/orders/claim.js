/**
 * Conversión 1-clic de Orden de Invitado -> Cuenta Supabase vinculada (post-compra).
 * QuoraTec ERP v3.0.0 (QUORATEC).
 */

import {
    calcularSha256Hex,
    constanteTiempoIgualdad,
    esperarPisoTiempo,
    hexABytes,
    jsonSegura,
    leerJsonEstricto,
    obtenerConfigSupabaseEnv,
    supabaseRestRequest,
    validarCamposComunesLicense,
    validarEsquemaPermitido,
} from "../../_shared/security.js";
import { actualizarOrdenMemoria, obtenerOrdenMemoria } from "./_store.js";

const CAMPOS_PERMITIDOS = ["order_ref", "order_token", "email", "password"];
const CAMPOS_PROHIBIDOS_TAMPERING = ["user_id", "role", "is_admin", "status"];

export async function onRequestPost(context) {
    const { request, env } = context;
    const inicioMs = Date.now();

    try {
        const body = await leerJsonEstricto(request, 4096);
        if (!body.ok) {
            return jsonSegura({ ok: false, error: body.error }, body.status);
        }

        const esquema = validarEsquemaPermitido(body.data, CAMPOS_PERMITIDOS, CAMPOS_PROHIBIDOS_TAMPERING);
        if (!esquema.ok) {
            return jsonSegura({ ok: false, error: esquema.error }, esquema.status);
        }

        const { order_ref: orderRef, order_token: orderToken, email, password } = body.data;
        if (validarCamposComunesLicense({ orderRef, email }) || !orderRef || !email) {
            return jsonSegura({ ok: false, error: "INVALID_ORDER_OR_EMAIL" }, 400);
        }
        if (typeof password !== "string" || password.length < 10 || password.length > 128) {
            return jsonSegura({ ok: false, error: "PASSWORD_MIN_10_CHARS_REQUIRED" }, 400);
        }

        const supaCfg = obtenerConfigSupabaseEnv(env);
        let order = null;
        let persisted = false;
        if (supaCfg.configured && supaCfg.serviceRoleKey) {
            const q = `orders?order_ref=eq.${encodeURIComponent(orderRef)}&select=order_ref,order_token_hash,user_id,email`;
            const resGet = await supabaseRestRequest(supaCfg, q, { method: "GET", serviceRole: true });
            if (resGet.ok && Array.isArray(resGet.data) && resGet.data.length > 0) {
                order = resGet.data[0];
                persisted = true;
            }
        } else {
            order = obtenerOrdenMemoria(orderRef);
        }

        let tokenOk = false;
        if (order && typeof orderToken === "string" && orderToken.length >= 20) {
            const supplied = hexABytes(await calcularSha256Hex(orderToken));
            const stored = hexABytes(String(order.order_token_hash || ""));
            if (supplied && stored && constanteTiempoIgualdad(supplied, stored)) {
                tokenOk = true;
            }
        }

        if (!order || !tokenOk) {
            return jsonSegura({ ok: false, error: "INVALID_ORDER_CREDENTIALS" }, 401);
        }

        if (!supaCfg.configured) {
            return jsonSegura({ ok: false, error: "SUPABASE_AUTH_NOT_CONFIGURED" }, 503);
        }

        const signupResp = await fetch(`${supaCfg.url}/auth/v1/signup`, {
            method: "POST",
            headers: {
                apikey: supaCfg.anonKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: String(email).trim().toLowerCase(),
                password,
                data: { origin_order_ref: orderRef },
            }),
        });
        const signupJson = await signupResp.json().catch(() => ({}));
        if (!signupResp.ok || !signupJson?.user?.id) {
            return jsonSegura(
                {
                    ok: false,
                    error: "ACCOUNT_CREATION_FAILED",
                    detail: signupJson?.msg || signupJson?.error_description || "Revisa si este correo ya está registrado.",
                },
                400
            );
        }

        const userId = signupJson.user.id;
        if (persisted) {
            await supabaseRestRequest(supaCfg, `orders?order_ref=eq.${encodeURIComponent(orderRef)}`, {
                method: "PATCH",
                serviceRole: true,
                body: { user_id: userId, checkout_mode: "account", claimed_at: new Date().toISOString() },
            });
        } else {
            actualizarOrdenMemoria(orderRef, { user_id: userId, checkout_mode: "account" });
        }

        return jsonSegura(
            {
                ok: true,
                order_ref: orderRef,
                claimed: true,
                email: String(email).trim().toLowerCase(),
                requires_email_confirmation: !signupJson.access_token,
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
