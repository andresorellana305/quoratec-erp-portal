/**
 * PayPhone Business — Preparar Transacción: POST /api/payphone/prepare
 * Controlado por FF_PAYPHONE_BUSINESS_ENABLED, PAYPHONE_TOKEN y PAYPHONE_STORE_ID.
 */
import {
    calcularCotizacionAutoritativa,
    calcularSha256Hex,
    jsonSegura,
    leerJsonEstricto,
    validarCamposComunesLicense,
    validarEsquemaPermitido,
} from "../../_shared/security.js";
import { getServiceSupabaseConfig, supabaseServiceRest } from "../../_lib/license_issuer.js";

const PAYPHONE_PREPARE_URL = "https://pay.payphonetodoesposible.com/api/button/Prepare";

const CAMPOS_PERMITIDOS = [
    "plan_id",
    "ruc_cedula",
    "razon_social",
    "email",
    "extra_seats",
    "hwid",
    "referral_code",
    "apply_founder_discount",
    "sale_type",
];

const CAMPOS_PROHIBIDOS_TAMPERING = [
    "amount",
    "amount_cents",
    "amountWithoutTax",
    "amountWithTax",
    "tax",
    "price",
    "precio",
    "monto",
    "discount",
    "descuento",
    "commission_rate",
    "commission_usd",
    "net_collected_usd",
    "hold_days",
    "status",
    "is_paid",
    "bypass_payment",
];

export async function onRequestPost(context) {
    const { request, env } = context;

    const enabled = String(env?.FF_PAYPHONE_BUSINESS_ENABLED || "").trim().toLowerCase() === "true";
    if (!enabled) {
        return jsonSegura({
            ok: false,
            enabled: false,
            status: "canal_en_activacion",
            message: "PayPhone Business se encuentra en activación. Utiliza Deuna! Personal o Transferencia Bancaria Directa.",
        }, 503);
    }

    const token = String(env?.PAYPHONE_TOKEN || "").trim();
    const storeId = String(env?.PAYPHONE_STORE_ID || "").trim();
    if (!token || !storeId) {
        return jsonSegura({ ok: false, error: "PAYPHONE_CREDENTIALS_NOT_CONFIGURED" }, 503);
    }

    const body = await leerJsonEstricto(request, 8192);
    if (!body.ok) {
        return jsonSegura({ ok: false, error: body.error }, body.status);
    }

    const esquema = validarEsquemaPermitido(body.data, CAMPOS_PERMITIDOS, CAMPOS_PROHIBIDOS_TAMPERING);
    if (!esquema.ok) {
        return jsonSegura({ ok: false, error: esquema.error }, esquema.status);
    }

    const {
        plan_id: planId,
        ruc_cedula: rucCedula,
        razon_social: razonSocial,
        email,
        extra_seats: extraSeats = 0,
        hwid,
        referral_code: referralCodeRaw,
        apply_founder_discount: applyFounder = false,
    } = body.data;

    const errCampos = validarCamposComunesLicense({ rucCedula, email, hwid });
    if (errCampos) {
        return jsonSegura({ ok: false, error: errCampos }, 400);
    }
    if (!razonSocial || String(razonSocial).trim().length < 2) {
        return jsonSegura({ ok: false, error: "RAZON_SOCIAL_REQUIRED" }, 400);
    }

    const cotizacion = calcularCotizacionAutoritativa(planId, extraSeats);
    if (!cotizacion.ok) {
        return jsonSegura({ ok: false, error: cotizacion.error }, 400);
    }

    let totalUsd = cotizacion.montoAutoritativoUsd;
    if (applyFounder === true) {
        totalUsd = Math.round(totalUsd * 0.75 * 100) / 100;
    }

    const amountCents = Math.round(totalUsd * 100);
    const amountWithoutTax = amountCents;
    const amountWithTax = 0;
    const tax = 0;

    const randBytes = new Uint8Array(4);
    crypto.getRandomValues(randBytes);
    const randHex = Array.from(randBytes, (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    const clientTransactionId = `QT-PP-${Date.now().toString(36).toUpperCase()}-${randHex}`;

    const supa = getServiceSupabaseConfig(env);
    if (supa.configured) {
        const orderTokenHash = await calcularSha256Hex(`${clientTransactionId}:${email}:${rucCedula}`);
        const insertRes = await supabaseServiceRest(supa, "orders", {
            method: "POST",
            body: {
                order_ref: clientTransactionId,
                order_token_hash: orderTokenHash,
                checkout_mode: "guest",
                email: String(email).trim().toLowerCase(),
                ruc_cedula: String(rucCedula).trim(),
                razon_social: String(razonSocial).trim(),
                plan_id: cotizacion.plan.id,
                extra_seats: cotizacion.extraSeats,
                estaciones_autorizadas: cotizacion.estacionesAutorizadas,
                monto_autorizado_usd: totalUsd,
                payment_channel: "PAYPHONE_BUSINESS",
                status: "pendiente_verificacion",
                hwid_inicial: hwid || null,
                referral_code: referralCodeRaw ? String(referralCodeRaw).trim().toUpperCase().slice(0, 32) : null,
            },
        });
        if (!insertRes.ok) {
            return jsonSegura({ ok: false, error: "ORDER_PERSIST_FAILED" }, 500);
        }
    }

    const preparePayload = {
        amount: amountCents,
        amountWithoutTax,
        amountWithTax,
        tax,
        currency: "USD",
        clientTransactionId,
        storeId,
        reference: `QuoraTec ERP ${cotizacion.plan.id} (${rucCedula})`,
        responseUrl: "https://erp.quoratec.com/planes.html?payphone=return",
        cancellationUrl: "https://erp.quoratec.com/planes.html?payphone=cancel",
    };

    const ppResp = await fetch(PAYPHONE_PREPARE_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(preparePayload),
    });

    const ppData = await ppResp.json().catch(() => ({}));
    if (!ppResp.ok) {
        return jsonSegura({
            ok: false,
            error: "PAYPHONE_PREPARE_FAILED",
            status: ppResp.status,
        }, 502);
    }

    return jsonSegura({
        ok: true,
        clientTransactionId,
        currency: "USD",
        amount_cents: amountCents,
        amountWithoutTax,
        amountWithTax,
        tax,
        payWithCard: ppData.payWithCard || ppData.paymentId || null,
        payWithPayPhone: ppData.payWithPayPhone || null,
        paymentId: ppData.paymentId || null,
    }, 200);
}

export async function onRequest(context) {
    if (String(context?.request?.method || "").toUpperCase() === "POST") {
        return onRequestPost(context);
    }
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
