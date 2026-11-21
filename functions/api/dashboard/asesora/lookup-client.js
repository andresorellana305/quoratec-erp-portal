/**
 * GET /api/dashboard/asesora/lookup-client
 * Permite a una asesora consultar el estado de licencia/prueba de un cliente por Cédula/RUC o correo
 * y reenviarle su enlace de descarga .lic (sin acceso a llaves privadas ni cambio de precios).
 */
import { jsonSegura, supabaseRestRequest } from "../../../_shared/security.js";
import { requireDashboardUser } from "../_auth_guard.js";
import { sendEmailViaResend } from "../../../_lib/license_issuer.js";
import { buildOrderLicenseEmail } from "../../../utils/email_templates.js";

export async function onRequestGet(context) {
    const { request, env } = context;
    const auth = await requireDashboardUser(request, env, ["asesora", "admin"]);
    if (!auth.ok) return auth.response;

    const url = new URL(request.url);
    const q = String(url.searchParams.get("q") || "").trim();
    const resend = url.searchParams.get("resend") === "1";

    if (!q || q.length < 5 || q.length > 120) {
        return jsonSegura({ ok: false, error: "QUERY_Q_REQUIRED" }, 400);
    }

    const isRuc = /^\d{10}(\d{3})?$/.test(q);
    let licRows = [];
    let orderRows = [];

    if (isRuc) {
        const [licRes, ordRes] = await Promise.all([
            supabaseRestRequest(
                auth.supaCfg,
                `licenses?holder_ruc=eq.${encodeURIComponent(q)}&order=issued_at.desc&limit=5&select=license_key,holder_name,holder_ruc,plan_name,environment,status,issued_at,expires_at`,
                { method: "GET", serviceRole: true },
            ),
            supabaseRestRequest(
                auth.supaCfg,
                `orders?ruc_cedula=eq.${encodeURIComponent(q)}&order=created_at.desc&limit=5&select=order_ref,email,ruc_cedula,razon_social,plan_id,status,created_at`,
                { method: "GET", serviceRole: true },
            ),
        ]);
        licRows = Array.isArray(licRes.data) ? licRes.data : [];
        orderRows = Array.isArray(ordRes.data) ? ordRes.data : [];
    } else {
        const cleanEmail = q.toLowerCase();
        const ordRes = await supabaseRestRequest(
            auth.supaCfg,
            `orders?email=eq.${encodeURIComponent(cleanEmail)}&order=created_at.desc&limit=5&select=order_ref,email,ruc_cedula,razon_social,plan_id,status,created_at`,
            { method: "GET", serviceRole: true },
        );
        orderRows = Array.isArray(ordRes.data) ? ordRes.data : [];
        if (orderRows.length > 0 && orderRows[0].ruc_cedula) {
            const licRes = await supabaseRestRequest(
                auth.supaCfg,
                `licenses?holder_ruc=eq.${encodeURIComponent(orderRows[0].ruc_cedula)}&order=issued_at.desc&limit=5&select=license_key,holder_name,holder_ruc,plan_name,environment,status,issued_at,expires_at`,
                { method: "GET", serviceRole: true },
            );
            licRows = Array.isArray(licRes.data) ? licRes.data : [];
        }
    }

    let resent = false;
    if (resend && licRows.length > 0 && orderRows.length > 0 && orderRows[0].email) {
        const lic = licRows[0];
        const ord = orderRows[0];
        const mail = buildOrderLicenseEmail({
            razonSocial: lic.holder_name || ord.razon_social,
            rucCedula: lic.holder_ruc || ord.ruc_cedula,
            planId: lic.plan_name || ord.plan_id,
            orderRef: ord.order_ref,
            licenseKey: lic.license_key,
            expiresAt: lic.expires_at,
            downloadUrl: `https://erp.quoratec.com/api/licenses/download?license_key=${encodeURIComponent(lic.license_key)}`,
        });
        const mailRes = await sendEmailViaResend(env, {
            to: [ord.email],
            subject: mail.subject,
            html: mail.html,
            text: mail.text,
        });
        resent = Boolean(mailRes.sent);
    }

    return jsonSegura({
        ok: true,
        query: q,
        licenses: licRows,
        orders: orderRows,
        resent_email: resent,
    }, 200);
}

export async function onRequest(context) {
    if (String(context?.request?.method || "").toUpperCase() === "GET") {
        return onRequestGet(context);
    }
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
