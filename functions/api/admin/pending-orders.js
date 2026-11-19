/**
 * Listado Administrativo de Órdenes Pendientes de Verificación.
 * GET /api/admin/pending-orders — Protegido con X-Admin-Secret en tiempo constante.
 */

import { jsonSegura } from "../../_shared/security.js";
import {
    createSignedStorageUrl,
    getServiceSupabaseConfig,
    supabaseServiceRest,
    verifyAdminSecret,
} from "../../_lib/license_issuer.js";

const SIGNED_URL_TTL_SEC = 900; // 15 minutos

export async function onRequestGet(context) {
    const { request, env } = context;

    const authorized = await verifyAdminSecret(request, env);
    if (!authorized) {
        return jsonSegura({ ok: false, error: "UNAUTHORIZED" }, 401);
    }

    const supa = getServiceSupabaseConfig(env);
    if (!supa.configured) {
        return jsonSegura({ ok: false, error: "SUPABASE_SERVICE_NOT_CONFIGURED" }, 503);
    }

    const res = await supabaseServiceRest(
        supa,
        "orders?status=eq.pendiente_verificacion&order=created_at.desc&select=*",
        { method: "GET" },
    );
    if (!res.ok) {
        return jsonSegura({ ok: false, error: "PENDING_ORDERS_QUERY_FAILED" }, 500);
    }

    const orders = Array.isArray(res.data) ? res.data : [];
    const vouchersBucket = String(env?.VOUCHERS_BUCKET || "vouchers").trim() || "vouchers";

    const enriched = await Promise.all(
        orders.map(async (order) => {
            const voucherPath = String(order.voucher_path || order.comprobante_path || "").trim();
            let voucherSignedUrl = null;
            if (voucherPath) {
                voucherSignedUrl = await createSignedStorageUrl(
                    supa,
                    vouchersBucket,
                    voucherPath,
                    SIGNED_URL_TTL_SEC,
                );
            }
            return {
                id: order.id,
                order_ref: order.order_ref,
                checkout_mode: order.checkout_mode,
                email: order.email,
                ruc_cedula: order.ruc_cedula,
                razon_social: order.razon_social,
                plan_id: order.plan_id,
                extra_seats: order.extra_seats,
                estaciones_autorizadas: order.estaciones_autorizadas,
                monto_autorizado_usd: order.monto_autorizado_usd,
                payment_channel: order.payment_channel,
                status: order.status,
                voucher_ref: order.voucher_ref || null,
                banco_origen: order.banco_origen || null,
                voucher_path: voucherPath || null,
                voucher_signed_url: voucherSignedUrl,
                hwid_inicial: order.hwid_inicial || null,
                created_at: order.created_at,
                updated_at: order.updated_at,
            };
        }),
    );

    return jsonSegura({
        ok: true,
        count: enriched.length,
        orders: enriched,
    }, 200);
}
