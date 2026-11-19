/**
 * PayPhone Business — Confirmación Server-to-Server: POST /api/payphone/confirm
 * Valida contra https://pay.payphonetodoesposible.com/api/button/V2/Confirm,
 * verifica statusCode === 3 (Approved) e idempotencia por transactionId,
 * emite .lic Ed25519 v2, envía por Resend y registra comisión de referido (25%-30%).
 */
import {
    jsonSegura,
    leerJsonEstricto,
    validarCamposComunesLicense,
} from "../../_shared/security.js";
import {
    getServiceSupabaseConfig,
    supabaseServiceRest,
    verifyAndIssueLicense,
} from "../../_lib/license_issuer.js";
import { recordApprovedOrderCommission } from "../../_lib/commission_service.js";

const PAYPHONE_CONFIRM_URL = "https://pay.payphonetodoesposible.com/api/button/V2/Confirm";

export async function onRequestPost(context) {
    const { request, env } = context;

    const enabled = String(env?.FF_PAYPHONE_BUSINESS_ENABLED || "").trim().toLowerCase() === "true";
    if (!enabled) {
        return jsonSegura({
            ok: false,
            enabled: false,
            status: "canal_en_activacion",
            message: "PayPhone Business no está habilitado en este entorno.",
        }, 503);
    }

    const token = String(env?.PAYPHONE_TOKEN || "").trim();
    if (!token) {
        return jsonSegura({ ok: false, error: "PAYPHONE_TOKEN_NOT_CONFIGURED" }, 503);
    }

    const body = await leerJsonEstricto(request, 8192);
    if (!body.ok) {
        return jsonSegura({ ok: false, error: body.error }, body.status);
    }

    const transactionId = Number(body.data.id ?? body.data.transactionId);
    const clientTxId = String(body.data.clientTxId ?? body.data.clientTransactionId ?? "").trim();

    if (!Number.isInteger(transactionId) || transactionId <= 0) {
        return jsonSegura({ ok: false, error: "INVALID_TRANSACTION_ID" }, 400);
    }
    if (!clientTxId || validarCamposComunesLicense({ orderRef: clientTxId })) {
        return jsonSegura({ ok: false, error: "INVALID_CLIENT_TX_ID" }, 400);
    }

    const supa = getServiceSupabaseConfig(env);
    if (!supa.configured) {
        return jsonSegura({ ok: false, error: "SUPABASE_SERVICE_NOT_CONFIGURED" }, 503);
    }

    // Idempotencia previa por payphone_transaction_id
    const dupRes = await supabaseServiceRest(
        supa,
        `orders?payphone_transaction_id=eq.${encodeURIComponent(String(transactionId))}&select=id,order_ref,status&limit=1`,
        { method: "GET" },
    );
    if (dupRes.ok && Array.isArray(dupRes.data) && dupRes.data.length > 0 && dupRes.data[0].status === "verificado") {
        const existingIssue = await verifyAndIssueLicense(env, dupRes.data[0].id, {
            voucher_ref: String(transactionId),
            payment_provider: "PAYPHONE_BUSINESS",
        });
        return jsonSegura({
            ok: true,
            idempotent: true,
            transactionId,
            order_ref: dupRes.data[0].order_ref,
            license_key: existingIssue.license?.license_key || null,
        }, 200);
    }

    // Validación server-to-server con PayPhone V2/Confirm
    const confirmResp = await fetch(PAYPHONE_CONFIRM_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: transactionId, clientTxId }),
    });
    const confirmData = await confirmResp.json().catch(() => ({}));
    if (!confirmResp.ok) {
        return jsonSegura({
            ok: false,
            error: "PAYPHONE_CONFIRM_FAILED",
            status: confirmResp.status,
        }, 502);
    }

    if (Number(confirmData.statusCode) !== 3) {
        return jsonSegura({
            ok: false,
            error: "PAYMENT_NOT_APPROVED",
            statusCode: confirmData.statusCode ?? null,
            transactionStatus: confirmData.transactionStatus ?? null,
        }, 400);
    }

    const orderRes = await supabaseServiceRest(
        supa,
        `orders?order_ref=eq.${encodeURIComponent(clientTxId)}&select=*&limit=1`,
        { method: "GET" },
    );
    if (!orderRes.ok || !Array.isArray(orderRes.data) || orderRes.data.length === 0) {
        return jsonSegura({ ok: false, error: "ORDER_NOT_FOUND" }, 404);
    }
    const order = orderRes.data[0];

    const expectedCents = Math.round(Number(order.monto_autorizado_usd) * 100);
    if (confirmData.amount !== undefined && Number(confirmData.amount) !== expectedCents) {
        return jsonSegura({ ok: false, error: "AMOUNT_MISMATCH" }, 403);
    }

    await supabaseServiceRest(supa, `orders?id=eq.${encodeURIComponent(order.id)}`, {
        method: "PATCH",
        body: { payphone_transaction_id: String(transactionId) },
    });

    const issued = await verifyAndIssueLicense(env, order.id, {
        voucher_ref: String(transactionId),
        payment_provider: "PAYPHONE_BUSINESS",
    });
    if (!issued.ok) {
        return jsonSegura({ ok: false, error: issued.error }, issued.status || 500);
    }

    // Registrar comisión sobre cobro neto efectivo (respetando periodo de retención y sale_type)
    let commissionResult = null;
    if (order.referral_code && !issued.idempotent) {
        const netCollectedUsd = confirmData.amount !== undefined
            ? Number(confirmData.amount) / 100
            : Number(order.monto_autorizado_usd);
        commissionResult = await recordApprovedOrderCommission(
            supa,
            env,
            order,
            issued.license,
            netCollectedUsd,
        );
    }

    return jsonSegura({
        ok: true,
        idempotent: issued.idempotent,
        transactionId,
        order_ref: order.order_ref,
        license_key: issued.license?.license_key || null,
        org_token: issued.license?.org_token || null,
        email_sent: issued.email_sent,
        commission: commissionResult,
    }, 200);
}

export async function onRequest(context) {
    if (String(context?.request?.method || "").toUpperCase() === "POST") {
        return onRequestPost(context);
    }
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
