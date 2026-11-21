/**
 * Espejo /api/v1/health para QuoraTec ERP de escritorio.
 * GET /api/v1/health
 */
import { jsonSegura } from "../../_shared/security.js";

export async function onRequestGet(context) {
    const { env } = context;
    return jsonSegura({
        ok: true,
        service: "quoratec-erp-portal",
        version: "3.0.0",
        status: "healthy",
        d1_configured: Boolean(env?.DB),
        timestamp: new Date().toISOString(),
    }, 200);
}

export async function onRequest(context) {
    if (String(context?.request?.method || "").toUpperCase() === "GET") {
        return onRequestGet(context);
    }
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
