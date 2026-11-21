/**
 * POST /api/dashboard/admin/approve-order
 * Permite al rol admin aprobar una orden pendiente (Deuna!/Transferencia),
 * firmar automáticamente su archivo .lic (Ed25519), acreditar la comisión de la asesora
 * y enviar los correos corporativos correspondientes (o rechazar con motivo).
 */
import {
    jsonSegura,
    leerJsonEstricto,
    supabaseRestRequest,
    validarEsquemaPermitido,
} from "../../../_shared/security.js";
import { requireDashboardUser } from "../_auth_guard.js";
import { sendEmailViaResend, verifyAndIssueLicense } from "../../../_lib/license_issuer.js";
import { recordApprovedOrderCommission } from "../../../_lib/commission_service.js";
import { buildAdvisorCommissionEmail } from "../../../utils/email_templates.js";

const CAMPOS_PERMITIDOS = ["order_id", "order_ref", "action", "rejection_reason"];

export async function onRequestPost(context) {
    const { request, env } = context;
    const auth = await requireDashboardUser(request, env, ["admin"]);
    if (!auth.ok) return auth.response;

    const body = await leerJsonEstricto(request, 4096);
    if (!body.ok) {
        return jsonSegura({ ok: false, error: body.error }, body.status);
    }
    const esquema = validarEsquemaPermitido(body.data, CAMPOS_PERMITIDOS, []);
    if (!esquema.ok) {
        return jsonSegura({ ok: false, error: esquema.error }, esquema.status);
    }

    const action = String(body.data.action || "approve").trim().toLowerCase();
    const orderId = String(body.data.order_id || "").trim();
    const orderRef = String(body.data.order_ref || "").trim();
    if (!orderId && !orderRef) {
        return jsonSegura({ ok: false, error: "ORDER_ID_OR_REF_REQUIRED" }, 400);
    }

    const filter = orderId ? `id=eq.${encodeURIComponent(orderId)}` : `order_ref=eq.${encodeURIComponent(orderRef)}`;
    const lookup = await supabaseRestRequest(
        auth.supaCfg,
        `orders?${filter}&select=*&limit=1`,
        { method: "GET", serviceRole: true },
    );
    if (!lookup.ok || !Array.isArray(lookup.data) || lookup.data.length === 0) {
        return jsonSegura({ ok: false, error: "ORDER_NOT_FOUND" }, 404);
    }
    const order = lookup.data[0];

    if (action === "reject") {
        const reason = String(body.data.rejection_reason || "Comprobante no verificado").trim().slice(0, 200);
        await supabaseRestRequest(
            auth.supaCfg,
            `orders?id=eq.${encodeURIComponent(order.id)}`,
            {
                method: "PATCH",
                serviceRole: true,
                body: { status: "rechazado", updated_at: new Date().toISOString() },
            },
        );
        return jsonSegura({ ok: true, action: "reject", order_ref: order.order_ref, status: "rechazado", reason }, 200);
    }

    const issued = await verifyAndIssueLicense(env, order.id, { approved_by: auth.user.email || "admin" });
    if (!issued.ok) {
        return jsonSegura({ ok: false, error: issued.error }, issued.status || 500);
    }

    let commission = null;
    if (issued.order?.referral_code && !issued.idempotent) {
        commission = await recordApprovedOrderCommission(
            { configured: true, url: auth.supaCfg.url, serviceRoleKey: auth.supaCfg.serviceRoleKey },
            env,
            issued.order,
            issued.license,
            Number(issued.order.monto_autorizado_usd),
        );

        // Notificar por correo a la asesora si existe en D1
        if (commission?.ok && auth.db) {
            try {
                const adv = await auth.db.prepare(
                    "SELECT email, full_name FROM users WHERE upper(codigo_referido) = upper(?) AND is_active = 1 LIMIT 1",
                ).bind(issued.order.referral_code).first();
                if (adv?.email) {
                    const mail = buildAdvisorCommissionEmail({
                        advisorName: adv.full_name || "Asesora Comercial",
                        referralCode: issued.order.referral_code,
                        orderRef: issued.order.order_ref,
                        saleType: commission.sale_type,
                        netCollectedUsd: commission.net_collected_usd,
                        commissionRate: commission.commission_rate,
                        commissionUsd: commission.commission_usd,
                        status: commission.status,
                    });
                    await sendEmailViaResend(env, { to: [adv.email], subject: mail.subject, html: mail.html, text: mail.text });
                }
            } catch {
                // No bloquear aprobación si falla notificación secundaria
            }
        }
    }

    return jsonSegura({
        ok: true,
        action: "approve",
        idempotent: issued.idempotent,
        order_ref: issued.order.order_ref,
        license_key: issued.license.license_key,
        email_sent: issued.email_sent,
        commission,
    }, 200);
}

export async function onRequest(context) {
    if (String(context?.request?.method || "").toUpperCase() === "POST") {
        return onRequestPost(context);
    }
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
