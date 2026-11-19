/**
 * Puente Centralis Engine — Pedidos Entrantes hacia Caja POS Escritorio
 * POST  /api/v1/orders/incoming -> Encola pedido confirmado desde WhatsApp/Telegram (Centralis)
 * GET   /api/v1/orders/incoming -> Lista pedidos pendientes para la bandeja Proformas / Pedidos Entrantes del POS
 * PATCH /api/v1/orders/incoming -> Marca un pedido como procesado (proforma_created) desde el POS
 */
import { jsonSegura, leerJsonEstricto } from "../../../_shared/security.js";
import { authenticateCentralisRequest } from "../../../_lib/centralis_auth.js";
import { supabaseServiceRest } from "../../../_lib/license_issuer.js";

export async function onRequestPost(context) {
    const { request, env } = context;
    const body = await leerJsonEstricto(request, 65536);
    if (!body.ok) {
        return jsonSegura({ ok: false, error: body.error }, body.status);
    }

    const auth = await authenticateCentralisRequest(request, env, body.data?.empresa_ruc);
    if (!auth.ok) return auth.response;

    const sourceChannel = String(body.data.source_channel || "whatsapp").trim().toLowerCase();
    const externalOrderId = String(body.data.external_order_id || "").trim();
    if (!["whatsapp", "telegram", "portal", "api"].includes(sourceChannel) || !externalOrderId) {
        return jsonSegura({ ok: false, error: "INVALID_SOURCE_OR_EXTERNAL_ORDER_ID" }, 400);
    }

    const payloadJson = {
        customer: body.data.customer || {},
        items: Array.isArray(body.data.items) ? body.data.items : [],
        notes: body.data.notes ? String(body.data.notes).slice(0, 500) : "",
        total_usd: Number(body.data.total_usd || 0),
    };

    const res = await supabaseServiceRest(
        auth.supa,
        "centralis_orders_queue?on_conflict=org_token,source_channel,external_order_id",
        {
            method: "POST",
            extraHeaders: { Prefer: "resolution=ignore-duplicates,return=representation" },
            body: {
                org_token: auth.org_token,
                empresa_ruc: auth.empresa_ruc,
                source_channel: sourceChannel,
                external_order_id: externalOrderId.slice(0, 80),
                payload_json: payloadJson,
                status: "pending",
            },
        },
    );
    if (!res.ok) {
        return jsonSegura({ ok: false, error: "QUEUE_INSERT_FAILED", details: res.data }, 500);
    }

    return jsonSegura({
        ok: true,
        queued: true,
        empresa_ruc: auth.empresa_ruc,
        source_channel: sourceChannel,
        external_order_id: externalOrderId,
        status: "pending",
    }, 201);
}

export async function onRequestGet(context) {
    const { request, env } = context;
    const auth = await authenticateCentralisRequest(request, env);
    if (!auth.ok) return auth.response;

    const res = await supabaseServiceRest(
        auth.supa,
        `centralis_orders_queue?empresa_ruc=eq.${encodeURIComponent(auth.empresa_ruc)}&status=eq.pending&order=created_at.asc&limit=100&select=id,source_channel,external_order_id,payload_json,status,created_at`,
        { method: "GET" },
    );
    if (!res.ok) {
        return jsonSegura({ ok: false, error: "QUEUE_FETCH_FAILED", details: res.data }, 500);
    }

    return jsonSegura({
        ok: true,
        empresa_ruc: auth.empresa_ruc,
        orders: Array.isArray(res.data) ? res.data : [],
    }, 200);
}

export async function onRequestPatch(context) {
    const { request, env } = context;
    const body = await leerJsonEstricto(request, 8192);
    if (!body.ok) {
        return jsonSegura({ ok: false, error: body.error }, body.status);
    }

    const auth = await authenticateCentralisRequest(request, env, body.data?.empresa_ruc);
    if (!auth.ok) return auth.response;

    const queueId = String(body.data.id || "").trim();
    const status = String(body.data.status || "proforma_created").trim();
    const erpProformaNumber = body.data.erp_proforma_number ? String(body.data.erp_proforma_number).trim() : null;

    if (!queueId || !["processing", "proforma_created", "failed", "cancelled"].includes(status)) {
        return jsonSegura({ ok: false, error: "INVALID_QUEUE_UPDATE" }, 400);
    }

    const res = await supabaseServiceRest(
        auth.supa,
        `centralis_orders_queue?id=eq.${encodeURIComponent(queueId)}&empresa_ruc=eq.${encodeURIComponent(auth.empresa_ruc)}`,
        {
            method: "PATCH",
            body: { status, erp_proforma_number: erpProformaNumber },
        },
    );
    if (!res.ok) {
        return jsonSegura({ ok: false, error: "QUEUE_UPDATE_FAILED", details: res.data }, 500);
    }

    return jsonSegura({ ok: true, id: queueId, status, erp_proforma_number: erpProformaNumber }, 200);
}

export async function onRequest(context) {
    const method = String(context?.request?.method || "").toUpperCase();
    if (method === "POST") return onRequestPost(context);
    if (method === "GET") return onRequestGet(context);
    if (method === "PATCH") return onRequestPatch(context);
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
