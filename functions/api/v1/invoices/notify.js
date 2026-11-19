/**
 * Puente Centralis Engine — Notificación de RIDE PDF y XML Autorizado por WhatsApp
 * POST /api/v1/invoices/notify
 */
import { jsonSegura, leerJsonEstricto } from "../../../_shared/security.js";
import { authenticateCentralisRequest } from "../../../_lib/centralis_auth.js";
import { supabaseServiceRest } from "../../../_lib/license_issuer.js";

const DEFAULT_CENTRALIS_NOTIFY_URL = "https://centralis.quoratec.com/api/v1/whatsapp/send-invoice";

export async function onRequestPost(context) {
    const { request, env } = context;
    const body = await leerJsonEstricto(request, 262144);
    if (!body.ok) {
        return jsonSegura({ ok: false, error: body.error }, body.status);
    }

    const auth = await authenticateCentralisRequest(request, env, body.data?.empresa_ruc);
    if (!auth.ok) return auth.response;

    const claveAcceso = String(body.data.clave_acceso || "").trim();
    const clienteWhatsapp = String(body.data.cliente_whatsapp || "").trim();
    const secuencial = String(body.data.secuencial || "").trim();

    if (!/^\d{49}$/.test(claveAcceso) || !clienteWhatsapp) {
        return jsonSegura({ ok: false, error: "CLAVE_ACCESO_49_AND_WHATSAPP_REQUIRED" }, 400);
    }

    const centralisUrl = String(env?.CENTRALIS_WEBHOOK_URL || DEFAULT_CENTRALIS_NOTIFY_URL).trim();
    const bridgeSecret = String(env?.CENTRALIS_BRIDGE_SECRET || "").trim();

    const dispatchPayload = {
        empresa_ruc: auth.empresa_ruc,
        org_token: auth.org_token,
        clave_acceso: claveAcceso,
        secuencial,
        cliente_whatsapp: clienteWhatsapp,
        cliente_nombre: String(body.data.cliente_nombre || "Cliente").slice(0, 120),
        total_usd: Number(body.data.total_usd || 0),
        ride_pdf_url: body.data.ride_pdf_url || null,
        xml_autorizado_url: body.data.xml_autorizado_url || null,
        ride_pdf_base64: body.data.ride_pdf_base64 || null,
        xml_autorizado: body.data.xml_autorizado || null,
    };

    let centralisStatus = "dispatched";
    let centralisResponse = null;

    try {
        const headers = { "Content-Type": "application/json" };
        if (bridgeSecret) {
            headers["x-centralis-secret"] = bridgeSecret;
        }
        const resp = await fetch(centralisUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(dispatchPayload),
        });
        centralisResponse = await resp.json().catch(() => ({ status: resp.status }));
        if (!resp.ok) {
            centralisStatus = `upstream_http_${resp.status}`;
        }
    } catch (err) {
        centralisStatus = "upstream_unreachable";
        centralisResponse = { error: String(err?.message || err) };
    }

    await supabaseServiceRest(auth.supa, "audit_logs", {
        method: "POST",
        body: {
            action: "centralis_invoice_notify",
            target_table: "centralis_invoices",
            target_id: claveAcceso,
            environment: "production",
            metadata_json: {
                empresa_ruc: auth.empresa_ruc,
                secuencial,
                cliente_whatsapp: clienteWhatsapp,
                dispatch_status: centralisStatus,
            },
        },
    });

    return jsonSegura({
        ok: centralisStatus === "dispatched",
        dispatch_status: centralisStatus,
        clave_acceso: claveAcceso,
        centralis: centralisResponse,
    }, centralisStatus === "dispatched" ? 200 : 502);
}

export async function onRequest(context) {
    if (String(context?.request?.method || "").toUpperCase() === "POST") {
        return onRequestPost(context);
    }
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
