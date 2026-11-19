/**
 * Autenticación RUC + API_KEY para el Puente API Centralis Engine (centralis.quoratec.com)
 * y QuoraTec ERP Desktop (core/centralis_bridge.py).
 */
import { calcularSha256Hex, jsonSegura } from "../_shared/security.js";
import { getServiceSupabaseConfig, supabaseServiceRest } from "./license_issuer.js";

export async function authenticateCentralisRequest(request, env, fallbackRuc = null) {
    const url = new URL(request.url);
    const ruc = String(
        request.headers.get("x-empresa-ruc") ||
        url.searchParams.get("ruc") ||
        fallbackRuc ||
        "",
    ).trim();

    const authHeader = String(request.headers.get("authorization") || "").trim();
    const bearerKey = authHeader.toLowerCase().startsWith("bearer ")
        ? authHeader.slice(7).trim()
        : "";
    const apiKey = String(
        request.headers.get("x-api-key") ||
        bearerKey ||
        "",
    ).trim();

    if (!/^\d{10}(\d{3})?$/.test(ruc)) {
        return { ok: false, response: jsonSegura({ ok: false, error: "INVALID_EMPRESA_RUC" }, 401) };
    }
    if (!apiKey || apiKey.length < 16) {
        return { ok: false, response: jsonSegura({ ok: false, error: "API_KEY_REQUIRED" }, 401) };
    }

    const supa = getServiceSupabaseConfig(env);
    if (!supa.configured) {
        return { ok: false, response: jsonSegura({ ok: false, error: "SUPABASE_SERVICE_NOT_CONFIGURED" }, 503) };
    }

    const apiKeyHash = await calcularSha256Hex(apiKey);
    const keyRes = await supabaseServiceRest(
        supa,
        `centralis_api_keys?empresa_ruc=eq.${encodeURIComponent(ruc)}&api_key_hash=eq.${encodeURIComponent(apiKeyHash)}&is_active=eq.true&select=id,org_token,empresa_ruc&limit=1`,
        { method: "GET" },
    );

    if (!keyRes.ok || !Array.isArray(keyRes.data) || keyRes.data.length === 0) {
        return { ok: false, response: jsonSegura({ ok: false, error: "UNAUTHORIZED_CENTRALIS_KEY" }, 401) };
    }

    const keyRecord = keyRes.data[0];
    return {
        ok: true,
        supa,
        empresa_ruc: keyRecord.empresa_ruc,
        org_token: keyRecord.org_token,
    };
}
