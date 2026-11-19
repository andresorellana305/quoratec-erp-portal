/**
 * Consulta Segura Anti-Enumeración de Estado de Orden por order_token (Invitado) o Sesión Supabase.
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
    obtenerUsuarioSupabaseDesdeToken,
    supabaseRestRequest,
    validarBearerTokenHeader,
    validarCamposComunesLicense,
    validarEsquemaPermitido,
} from "../../_shared/security.js";
import { obtenerOrdenMemoria } from "./_store.js";

const CAMPOS_PERMITIDOS = ["order_ref", "order_token", "email"];
const RESPUESTA_ORDEN_NO_VERIFICABLE = Object.freeze({
    ok: false,
    code: "ORDER_UNCONFIRMED",
    message: "No fue posible verificar la orden con las credenciales proporcionadas.",
});

export async function onRequestPost(context) {
    const { request, env } = context;
    const inicioMs = Date.now();

    try {
        const body = await leerJsonEstricto(request, 4096);
        if (!body.ok) {
            return jsonSegura({ ok: false, error: body.error }, body.status);
        }

        const esquema = validarEsquemaPermitido(body.data, CAMPOS_PERMITIDOS, []);
        if (!esquema.ok) {
            return jsonSegura({ ok: false, error: esquema.error }, esquema.status);
        }

        const { order_ref: orderRef, order_token: orderToken, email } = body.data;
        if (validarCamposComunesLicense({ orderRef }) || !orderRef) {
            return jsonSegura(RESPUESTA_ORDEN_NO_VERIFICABLE, 401);
        }

        const supaCfg = obtenerConfigSupabaseEnv(env);
        const bearer = validarBearerTokenHeader(request);
        const userObj = supaCfg.configured && bearer ? await obtenerUsuarioSupabaseDesdeToken(supaCfg, bearer) : null;

        let order = null;
        if (supaCfg.configured && supaCfg.serviceRoleKey) {
            const q = `orders?order_ref=eq.${encodeURIComponent(orderRef)}&select=order_ref,order_token_hash,checkout_mode,user_id,email,plan_id,estaciones_autorizadas,monto_autorizado_usd,payment_channel,status,voucher_ref,razon_social,ruc_cedula,created_at,updated_at`;
            const resGet = await supabaseRestRequest(supaCfg, q, { method: "GET", serviceRole: true });
            if (resGet.ok && Array.isArray(resGet.data) && resGet.data.length > 0) {
                order = resGet.data[0];
            }
        } else {
            order = obtenerOrdenMemoria(orderRef);
        }

        let autorizado = false;
        if (order) {
            if (userObj && order.user_id && userObj.id === order.user_id) {
                autorizado = true;
            } else if (
                typeof orderToken === "string" &&
                orderToken.length >= 20 &&
                typeof email === "string" &&
                !validarCamposComunesLicense({ email: email.trim().toLowerCase() })
            ) {
                const suppliedHash = hexABytes(await calcularSha256Hex(orderToken));
                const storedHash = hexABytes(String(order.order_token_hash || ""));
                const suppliedEmailHash = hexABytes(await calcularSha256Hex(email.trim().toLowerCase()));
                const storedEmailHash = hexABytes(await calcularSha256Hex(String(order.email || "").trim().toLowerCase()));
                if (
                    suppliedHash &&
                    storedHash &&
                    suppliedEmailHash &&
                    storedEmailHash &&
                    constanteTiempoIgualdad(suppliedHash, storedHash) &&
                    constanteTiempoIgualdad(suppliedEmailHash, storedEmailHash)
                ) {
                    autorizado = true;
                }
            }
        }

        if (!autorizado || !order) {
            return jsonSegura(RESPUESTA_ORDEN_NO_VERIFICABLE, 401);
        }

        return jsonSegura(
            {
                ok: true,
                order_ref: order.order_ref,
                checkout_mode: order.checkout_mode,
                plan_id: order.plan_id,
                estaciones_autorizadas: order.estaciones_autorizadas,
                monto_autorizado_usd: Number(order.monto_autorizado_usd),
                payment_channel: order.payment_channel,
                status: order.status,
                voucher_ref: order.voucher_ref,
                razon_social: order.razon_social,
                ruc_cedula: order.ruc_cedula,
                can_claim_account: !order.user_id,
                created_at: order.created_at,
                updated_at: order.updated_at,
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
