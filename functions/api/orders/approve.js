/**
 * Endpoint Administrativo de Aprobación de Orden y Emisión Automática de Licencia .lic.
 * POST /api/orders/approve — Protegido con X-Admin-Secret en tiempo constante.
 */

import {
    jsonSegura,
    leerJsonEstricto,
    validarCamposComunesLicense,
    validarEsquemaPermitido,
} from "../../_shared/security.js";
import {
    getServiceSupabaseConfig,
    supabaseServiceRest,
    verifyAdminSecret,
    verifyAndIssueLicense,
} from "../../_lib/license_issuer.js";

const CAMPOS_PERMITIDOS = ["order_id", "order_ref"];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function onRequestPost(context) {
    const { request, env } = context;

    const authorized = await verifyAdminSecret(request, env);
    if (!authorized) {
        return jsonSegura({ ok: false, error: "UNAUTHORIZED" }, 401);
    }

    const body = await leerJsonEstricto(request, 4096);
    if (!body.ok) {
        return jsonSegura({ ok: false, error: body.error }, body.status);
    }

    const esquema = validarEsquemaPermitido(body.data, CAMPOS_PERMITIDOS, []);
    if (!esquema.ok) {
        return jsonSegura({ ok: false, error: esquema.error }, esquema.status);
    }

    const orderIdRaw = String(body.data.order_id || "").trim();
    const orderRefRaw = String(body.data.order_ref || "").trim();

    if (!orderIdRaw && !orderRefRaw) {
        return jsonSegura({ ok: false, error: "ORDER_ID_OR_REF_REQUIRED" }, 400);
    }
    if (orderIdRaw && !UUID_REGEX.test(orderIdRaw)) {
        return jsonSegura({ ok: false, error: "INVALID_ORDER_ID" }, 400);
    }
    if (orderRefRaw && validarCamposComunesLicense({ orderRef: orderRefRaw })) {
        return jsonSegura({ ok: false, error: "INVALID_ORDER_REF" }, 400);
    }

    const supa = getServiceSupabaseConfig(env);
    if (!supa.configured) {
        return jsonSegura({ ok: false, error: "SUPABASE_SERVICE_NOT_CONFIGURED" }, 503);
    }

    let targetOrderId = orderIdRaw;
    if (!targetOrderId && orderRefRaw) {
        const lookup = await supabaseServiceRest(
            supa,
            `orders?order_ref=eq.${encodeURIComponent(orderRefRaw)}&select=id&limit=1`,
            { method: "GET" },
        );
        if (!lookup.ok || !Array.isArray(lookup.data) || lookup.data.length === 0) {
            return jsonSegura({ ok: false, error: "ORDER_NOT_FOUND" }, 404);
        }
        targetOrderId = lookup.data[0].id;
    }

    const result = await verifyAndIssueLicense(env, targetOrderId, { approved_by: "admin" });
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
        email_error: result.email_error || null,
    }, 200);
}
