/**
 * Webhook Scaffold Deuna! Negocios API — QuoraTec ERP v3.0.0.
 * Protegido por Feature Flag FF_DEUNA_NEGOCIOS_ENABLED=false ("Próximamente")
 * y verificación HMAC-SHA256 + anti-tampering cuando se active en producción.
 */

import {
    calcularCotizacionAutoritativa,
    jsonSegura,
    leerJsonEstricto,
    obtenerEstadoPasarelasEnv,
    validarCamposComunesLicense,
    validarEsquemaPermitido,
    verificarFirmaHmacRequest,
} from "../../_shared/security.js";

const CAMPOS_PERMITIDOS = ["transaction_id", "order_ref", "plan_id", "amount_cents", "currency", "status_code", "extra_seats"];
const CAMPOS_PROHIBIDOS = ["price", "precio", "amount", "amount_usd", "status", "is_paid", "bypass_payment"];

export async function onRequestPost(context) {
    const { request, env } = context;

    const flags = obtenerEstadoPasarelasEnv(env);
    if (!flags.DEUNA_NEGOCIOS) {
        return jsonSegura(
            {
                ok: false,
                error: "DEUNA_NEGOCIOS_DISABLED",
                estado: "Próximamente",
                required_env_vars: [
                    "FF_DEUNA_NEGOCIOS_ENABLED",
                    "DEUNA_BUSINESS_API_KEY",
                    "DEUNA_BUSINESS_CLIENT_ID",
                    "DEUNA_BUSINESS_SECRET",
                    "DEUNA_WEBHOOK_SECRET",
                ],
            },
            503
        );
    }

    const body = await leerJsonEstricto(request, 8192);
    if (!body.ok) return jsonSegura({ ok: false, error: body.error }, body.status);

    const firma = await verificarFirmaHmacRequest(request, body.raw, env?.DEUNA_WEBHOOK_SECRET);
    if (!firma.ok) return jsonSegura({ ok: false, error: firma.error }, firma.status);

    const esquema = validarEsquemaPermitido(body.data, CAMPOS_PERMITIDOS, CAMPOS_PROHIBIDOS);
    if (!esquema.ok) return jsonSegura({ ok: false, error: esquema.error }, esquema.status);

    const { order_ref: orderRef, plan_id: planId, amount_cents: amountCents, currency, extra_seats: extraSeats = 0 } = body.data;
    if (currency !== "USD" || validarCamposComunesLicense({ orderRef })) {
        return jsonSegura({ ok: false, error: "INVALID_ORDER_PAYLOAD" }, 400);
    }

    const cotizacion = calcularCotizacionAutoritativa(planId, extraSeats);
    if (!cotizacion.ok) return jsonSegura({ ok: false, error: cotizacion.error }, 400);

    const expectedCents = Math.round(cotizacion.montoAutoritativoUsd * 100);
    if (!Number.isInteger(amountCents) || amountCents !== expectedCents) {
        return jsonSegura({ ok: false, error: "AMOUNT_MISMATCH_TAMPERING" }, 403);
    }

    return jsonSegura(
        {
            ok: true,
            gateway: "DEUNA_NEGOCIOS",
            order_ref: orderRef,
            monto_verificado_usd: cotizacion.montoAutoritativoUsd,
        },
        200
    );
}

export async function onRequest() {
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
