/**
 * Webhook de Confirmación Automática PayPhone — QuoraTec ERP (QUORATEC).
 * POST /api/webhooks/payphone
 * Valida estado aprobado (statusCode === 3 o transactionStatus === 'Approved'),
 * verifica monto contra la orden en Supabase y ejecuta verifyAndIssueLicense.
 */

import {
    jsonSegura,
    leerJsonEstricto,
    validarCamposComunesLicense,
    verificarFirmaHmacRequest,
} from "../../_shared/security.js";
import {
    getServiceSupabaseConfig,
    supabaseServiceRest,
    verifyAndIssueLicense,
} from "../../_lib/license_issuer.js";

export async function onRequestPost(context) {
    const { request, env } = context;

    const body = await leerJsonEstricto(request, 16384);
    if (!body.ok) {
        return jsonSegura({ ok: false, error: body.error }, body.status);
    }

    // Si el webhook incluye firma HMAC y PAYPHONE_WEBHOOK_SECRET está configurado, verificarla
    if (env?.PAYPHONE_WEBHOOK_SECRET && String(env.PAYPHONE_WEBHOOK_SECRET).length >= 32) {
        const sigHeader = request.headers.get("x-signature-256");
        if (sigHeader) {
            const firma = await verificarFirmaHmacRequest(request, body.raw, env.PAYPHONE_WEBHOOK_SECRET);
            if (!firma.ok) {
                return jsonSegura({ ok: false, error: firma.error }, firma.status);
            }
        }
    }

    const data = body.data;
    const statusCode = Number(data.statusCode ?? data.status_code);
    const transactionStatus = String(data.transactionStatus ?? data.transaction_status ?? "").trim();
    const isApproved = statusCode === 3 || transactionStatus === "Approved";

    if (!isApproved) {
        return jsonSegura({
            ok: false,
            error: "PAYMENT_NOT_APPROVED",
            statusCode: Number.isFinite(statusCode) ? statusCode : null,
            transactionStatus: transactionStatus || null,
        }, 400);
    }

    const clientTxId = String(data.clientTransactionId ?? data.client_transaction_id ?? "").trim();
    if (!clientTxId || validarCamposComunesLicense({ orderRef: clientTxId })) {
        return jsonSegura({ ok: false, error: "INVALID_CLIENT_TRANSACTION_ID" }, 400);
    }

    const supa = getServiceSupabaseConfig(env);
    if (!supa.configured) {
        return jsonSegura({ ok: false, error: "SUPABASE_SERVICE_NOT_CONFIGURED" }, 503);
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

    // Validar monto si PayPhone lo incluye en el payload (en centavos)
    const rawAmount = data.amount ?? data.amount_cents;
    if (rawAmount !== undefined && rawAmount !== null) {
        const amountCents = Number(rawAmount);
        const expectedCents = Math.round(Number(order.monto_autorizado_usd) * 100);
        if (!Number.isInteger(amountCents) || amountCents !== expectedCents) {
            return jsonSegura({ ok: false, error: "AMOUNT_MISMATCH" }, 403);
        }
    }

    const txId = String(data.transactionId ?? data.transaction_id ?? "").trim();
    const result = await verifyAndIssueLicense(env, order.id, {
        voucher_ref: txId || clientTxId,
        payment_provider: "PAYPHONE",
    });

    if (!result.ok) {
        return jsonSegura({ ok: false, error: result.error }, result.status || 500);
    }

    return jsonSegura({
        ok: true,
        idempotent: result.idempotent,
        order_id: result.order.id,
        order_ref: result.order.order_ref,
        license_key: result.license.license_key,
        lic_storage_path: result.lic_storage_path,
        email_sent: result.email_sent,
    }, 200);
}
