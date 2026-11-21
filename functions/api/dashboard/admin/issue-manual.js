/**
 * POST /api/dashboard/admin/issue-manual
 * Crea una orden administrativa directa y emite la licencia Ed25519 (.lic) enviándola por correo.
 */
import {
    jsonSegura,
    leerJsonEstricto,
    supabaseRestRequest,
    validarCamposComunesLicense,
    validarEsquemaPermitido,
} from "../../../_shared/security.js";
import { requireDashboardUser } from "../_auth_guard.js";
import { verifyAndIssueLicense } from "../../../_lib/license_issuer.js";

const CAMPOS_PERMITIDOS = ["email", "ruc_cedula", "razon_social", "plan_id", "days", "estaciones", "environment"];
const PLANES_VALIDOS = ["EMPRENDEDOR", "COMERCIAL_PRO", "CONTADOR", "ESTUDIO_CONTABLE", "ENTERPRISE"];

export async function onRequestPost(context) {
    const { request, env } = context;
    const auth = await requireDashboardUser(request, env, ["admin"]);
    if (!auth.ok) return auth.response;

    const body = await leerJsonEstricto(request, 4096);
    if (!body.ok) return jsonSegura({ ok: false, error: body.error }, body.status);

    const esquema = validarEsquemaPermitido(body.data, CAMPOS_PERMITIDOS, []);
    if (!esquema.ok) return jsonSegura({ ok: false, error: esquema.error }, esquema.status);

    const email = String(body.data.email || "").trim().toLowerCase();
    const rucCedula = String(body.data.ruc_cedula || "").trim();
    const razonSocial = String(body.data.razon_social || "").trim().slice(0, 140);
    const rawPlan = String(body.data.plan_id || "EMPRENDEDOR").trim().toUpperCase();
    const planId = PLANES_VALIDOS.includes(rawPlan) ? rawPlan : "EMPRENDEDOR";
    const days = Math.min(1095, Math.max(1, Number(body.data.days || 365)));
    const estaciones = Math.min(100, Math.max(1, Number(body.data.estaciones || 1)));

    if (!email || validarCamposComunesLicense({ email })) return jsonSegura({ ok: false, error: "INVALID_EMAIL" }, 400);
    if (!/^\d{10}(\d{3})?$/.test(rucCedula)) return jsonSegura({ ok: false, error: "INVALID_RUC_CEDULA" }, 400);
    if (!razonSocial) return jsonSegura({ ok: false, error: "RAZON_SOCIAL_REQUIRED" }, 400);

    const orderId = crypto.randomUUID();
    const orderRef = `QT-ADM-${Date.now().toString(36).toUpperCase()}`;

    const ins = await supabaseRestRequest(auth.supaCfg, "orders", {
        method: "POST",
        serviceRole: true,
        body: {
            id: orderId,
            order_ref: orderRef,
            order_token_hash: crypto.randomUUID().replace(/-/g, ""),
            checkout_mode: "account",
            email,
            ruc_cedula: rucCedula,
            razon_social: razonSocial,
            plan_id: planId,
            estaciones_autorizadas: estaciones,
            monto_autorizado_usd: 0,
            payment_channel: "TRANSFERENCIA",
            status: "pendiente_verificacion",
            voucher_ref: "EMISION-MANUAL-ADMIN",
        },
    });
    if (!ins.ok) {
        return jsonSegura({ ok: false, error: "ORDER_CREATE_FAILED" }, 500);
    }

    const issued = await verifyAndIssueLicense(env, orderId, {
        verified_by: auth.user?.email || "admin",
        validity_days: days,
    });
    if (!issued || issued.ok === false) {
        return jsonSegura({ ok: false, error: issued?.error || "ISSUE_FAILED" }, 500);
    }

    return jsonSegura({
        ok: true,
        order_ref: orderRef,
        license_key: issued.license_key || issued.license?.license_key || orderRef,
        email_sent: Boolean(issued.email_sent ?? true),
    }, 201);
}

export async function onRequest(context) {
    if (String(context?.request?.method || "").toUpperCase() === "POST") return onRequestPost(context);
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
