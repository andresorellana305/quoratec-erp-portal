/**
 * Endpoint Auto-Updater Desktop: GET /api/version
 * Devuelve el manifiesto oficial de versión (desde Supabase app_config_releases o version.json estático).
 */
import { jsonSegura } from "../_shared/security.js";
import { getServiceSupabaseConfig, supabaseServiceRest } from "../_lib/license_issuer.js";

export async function onRequestGet(context) {
    const { request, env } = context;
    const supa = getServiceSupabaseConfig(env);

    if (supa.configured) {
        const res = await supabaseServiceRest(
            supa,
            "app_config_releases?config_key=eq.desktop_release&order=published_at.desc&limit=1&select=version,payload_json,sha256,published_at",
            { method: "GET" },
        );
        if (res.ok && Array.isArray(res.data) && res.data.length > 0 && res.data[0]?.payload_json) {
            return jsonSegura({
                ok: true,
                source: "supabase",
                ...res.data[0].payload_json,
                version: res.data[0].version,
                sha256: res.data[0].sha256,
                published_at: res.data[0].published_at,
            }, 200);
        }
    }

    if (env?.ASSETS) {
        const url = new URL(request.url);
        url.pathname = "/version.json";
        const assetResp = await env.ASSETS.fetch(new Request(url.toString(), { method: "GET" }));
        if (assetResp.ok) {
            const manifest = await assetResp.json().catch(() => null);
            if (manifest) {
                return jsonSegura({ ok: true, source: "manifest", ...manifest }, 200);
            }
        }
    }

    return jsonSegura({
        ok: true,
        source: "fallback",
        version: "3.0.0",
        tag_name: "v3.0.0",
        name: "QuoraTec ERP v3.0.0 — Edición 2026",
    }, 200);
}

export async function onRequest(context) {
    if (String(context?.request?.method || "").toUpperCase() === "GET") {
        return onRequestGet(context);
    }
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
