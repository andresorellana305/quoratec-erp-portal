/**
 * POST /api/dashboard/admin/issue-manual
 * Emite una licencia Ed25519 manual/cortesía desde el panel administrativo y la envía por correo.
 */
import {
    jsonSegura,
    leerJsonEstricto,
    supabaseRestRequest,
    validarCamposComunesLicense,
    validarEsquemaPermitido,
} from "../../../_shared/security.js";
import { requireDashboardUser } from "../_auth_guard.js";
import { issueSignedLicenseV2, sendEmailViaResend } from "../../../_lib/license_issuer.js";

const CAMPOS_PERMITIDOS = ["email", "ruc_cedula", "razon_social", "plan_id", "days", "estaciones", "environment"];
const PLANES_VALIDOS = ["EMPRENDEDOR", "COMERCIAL_PRO", "CONTADOR", "ESTUDIO_CONTABLE", "ENTERPRISE", "DEMO_15_DIAS"];

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
    const planId = String(body.data.plan_id || "EMPRENDEDOR").trim().toUpperCase();
    const days = Math.min(1095, Math.max(1, Number(body.data.days || 365)));
    const estaciones = Math.min(100, Math.max(1, Number(body.data.estaciones || 1)));
    const environment = body.data.environment === "demo" || planId === "DEMO_15_DIAS" ? "demo" : "production";

    if (!email || validarCamposComunesLicense({ email })) return jsonSegura({ ok: false, error: "INVALID_EMAIL" }, 400);
    if (!/^\d{10}(\d{3})?$/.test(rucCedula)) return jsonSegura({ ok: false, error: "INVALID_RUC_CEDULA" }, 400);
    if (!razonSocial) return jsonSegura({ ok: false, error: "RAZON_SOCIAL_REQUIRED" }, 400);
    if (!PLANES_VALIDOS.includes(planId)) return jsonSegura({ ok: false, error: "INVALID_PLAN" }, 400);

    const issued = await issueSignedLicenseV2(env, {
        ruc_cedula: rucCedula,
        razon_social: razonSocial,
        email,
        plan_id: planId,
        estaciones_autorizadas: estaciones,
        days,
        environment,
    });
    if (!issued.ok) {
        return jsonSegura({ ok: false, error: issued.error || "ISSUE_FAILED" }, 500);
    }

    await supabaseRestRequest(auth.supaCfg, "licenses", {
        method: "POST",
        serviceRole: true,
        body: {
            license_id: issued.license_id,
            license_key: issued.license_key,
            org_token: issued.org_token,
            holder_name: razonSocial,
            holder_ruc: rucCedula,
            ruc_cedula: rucCedula,
            plan_name: planId,
            plan_id: planId,
            max_rucs: issued.max_rucs || 1,
            max_seats: estaciones,
            estaciones_autorizadas: estaciones,
            cloud_gb: issued.cloud_gb || 0,
            environment,
            status: "active",
            active_status: "activa",
            expires_at: issued.expires_at,
        },
    });

    const mailRes = await sendEmailViaResend(env, {
        to: [email],
        subject: `Tu Licencia Oficial QuoraTec ERP (${planId}) — ${razonSocial}`,
        html: `<p>Hola <strong>${razonSocial}</strong>,</p><p>Se ha emitido tu licencia <strong>${issued.license_key}</strong> para el RUC/Cédula <strong>${rucCedula}</strong> (Plan: ${planId}, vigencia ${days} días).</p><p>Descárgala en <a href="https://erp.quoratec.com/api/licenses/download?license_key=${encodeURIComponent(issued.license_key)}">Descargar archivo .lic</a>.</p>`,
        text: `Licencia QuoraTec ERP: ${issued.license_key} | RUC: ${rucCedula} | Plan: ${planId} | Vigencia: ${days} días.`,
    });

    return jsonSegura({
        ok: true,
        license_key: issued.license_key,
        expires_at: issued.expires_at,
        email_sent: Boolean(mailRes?.sent),
    }, 201);
}

export async function onRequest(context) {
    if (String(context?.request?.method || "").toUpperCase() === "POST") return onRequestPost(context);
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
