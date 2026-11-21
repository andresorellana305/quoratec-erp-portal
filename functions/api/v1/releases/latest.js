/**
 * Espejo /api/v1/releases/latest para QuoraTec ERP de escritorio.
 * GET /api/v1/releases/latest — Devuelve la última versión instalable y su SHA-256.
 */
import { jsonSegura } from "../../../_shared/security.js";
import { getServiceSupabaseConfig, supabaseServiceRest } from "../../../_lib/license_issuer.js";

export async function onRequestGet(context) {
    const { request, env } = context;

    if (env?.DB) {
        try {
            const row = await env.DB.prepare(
                "SELECT version, tag_name, platform, file_name, download_url, sha256, size_bytes, published_at FROM erp_releases WHERE is_latest = 1 ORDER BY published_at DESC LIMIT 1",
            ).first();
            if (row) {
                return jsonSegura({ ok: true, source: "d1", ...row }, 200);
            }
        } catch {
            // Fallback a Supabase o version.json
        }
    }

    const supa = getServiceSupabaseConfig(env);
    if (supa.configured) {
        const res = await supabaseServiceRest(
            supa,
            "app_config_releases?config_key=eq.desktop_release&order=published_at.desc&limit=1&select=version,payload_json,sha256,published_at",
            { method: "GET" },
        );
        if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
            return jsonSegura({
                ok: true,
                source: "supabase",
                version: res.data[0].version,
                sha256: res.data[0].sha256,
                published_at: res.data[0].published_at,
                ...(res.data[0].payload_json || {}),
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
        sha256: "350a7f2cb1ba50a8cea87563b7e773357b5f8e9fa9d0f359401e0e9dc4c9e232",
        download_url: "https://github.com/andresorellana305/quoratec-erp/releases/download/v3.0.0/Setup_QuoraTec_ERP_v3.0.0.exe",
    }, 200);
}

export async function onRequest(context) {
    if (String(context?.request?.method || "").toUpperCase() === "GET") {
        return onRequestGet(context);
    }
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
