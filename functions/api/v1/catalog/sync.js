/**
 * Puente Centralis Engine — Sincronización de Catálogo, Precios y Stock
 * GET  /api/v1/catalog/sync  -> Expone catálogo, precios (detalle/mayor) y stock al bot WhatsApp/Telegram
 * POST /api/v1/catalog/sync  -> Recibe actualización de catálogo desde core/centralis_bridge.py (Desktop)
 */
import { jsonSegura, leerJsonEstricto } from "../../../_shared/security.js";
import { authenticateCentralisRequest } from "../../../_lib/centralis_auth.js";
import { supabaseServiceRest } from "../../../_lib/license_issuer.js";

export async function onRequestGet(context) {
    const { request, env } = context;
    const auth = await authenticateCentralisRequest(request, env);
    if (!auth.ok) return auth.response;

    const res = await supabaseServiceRest(
        auth.supa,
        `centralis_catalog_items?empresa_ruc=eq.${encodeURIComponent(auth.empresa_ruc)}&activo=eq.true&order=nombre.asc&limit=1000&select=sku,nombre,precio_detalle,precio_mayor,iva_pct,stock_disponible,updated_at`,
        { method: "GET" },
    );
    if (!res.ok) {
        return jsonSegura({ ok: false, error: "CATALOG_FETCH_FAILED", details: res.data }, 500);
    }

    return jsonSegura({
        ok: true,
        empresa_ruc: auth.empresa_ruc,
        org_token: auth.org_token,
        count: Array.isArray(res.data) ? res.data.length : 0,
        items: Array.isArray(res.data) ? res.data : [],
    }, 200);
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const body = await leerJsonEstricto(request, 262144);
    if (!body.ok) {
        return jsonSegura({ ok: false, error: body.error }, body.status);
    }

    const auth = await authenticateCentralisRequest(request, env, body.data?.empresa_ruc || body.data?.ruc);
    if (!auth.ok) return auth.response;

    const rawItems = Array.isArray(body.data?.items)
        ? body.data.items
        : (Array.isArray(body.data?.productos) ? body.data.productos : []);
    if (rawItems.length === 0 || rawItems.length > 500) {
        return jsonSegura({ ok: false, error: "ITEMS_ARRAY_1_TO_500_REQUIRED" }, 400);
    }

    const nowIso = new Date().toISOString();
    const rows = rawItems.map((item) => ({
        org_token: auth.org_token,
        empresa_ruc: auth.empresa_ruc,
        sku: String(item.sku || "").trim().slice(0, 64),
        nombre: String(item.nombre || "").trim().slice(0, 200),
        precio_detalle: Number(item.precio_detalle || 0),
        precio_mayor: Number(item.precio_mayor || item.precio_detalle || 0),
        iva_pct: Number(item.iva_pct ?? 15),
        stock_disponible: Number(item.stock_disponible || 0),
        activo: item.activo !== false,
        updated_at: nowIso,
    })).filter((r) => r.sku && r.nombre);

    const res = await supabaseServiceRest(
        auth.supa,
        "centralis_catalog_items?on_conflict=empresa_ruc,sku",
        {
            method: "POST",
            extraHeaders: { Prefer: "resolution=merge-duplicates" },
            body: rows,
        },
    );
    if (!res.ok) {
        return jsonSegura({ ok: false, error: "CATALOG_UPSERT_FAILED", details: res.data }, 500);
    }

    return jsonSegura({
        ok: true,
        empresa_ruc: auth.empresa_ruc,
        synced_count: rows.length,
        updated_at: nowIso,
    }, 200);
}

export async function onRequest(context) {
    const method = String(context?.request?.method || "").toUpperCase();
    if (method === "GET") return onRequestGet(context);
    if (method === "POST") return onRequestPost(context);
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
