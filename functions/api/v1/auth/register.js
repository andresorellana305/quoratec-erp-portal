/**
 * Espejo /api/v1/auth/register para QuoraTec ERP de escritorio.
 * POST /api/v1/auth/register — Crea usuario y envía correo HTML de Bienvenida + Prueba Gratis 15 Días.
 */
import {
    jsonSegura,
    leerJsonEstricto,
    obtenerConfigSupabaseEnv,
    validarCamposComunesLicense,
    validarEsquemaPermitido,
} from "../../../_shared/security.js";
import { sendEmailViaResend } from "../../../_lib/license_issuer.js";
import { buildWelcomeTrialEmail } from "../../../utils/email_templates.js";

const CAMPOS_PERMITIDOS = ["email", "password", "full_name", "ruc_cedula"];
const CAMPOS_PROHIBIDOS = ["role", "is_admin", "user_id"];

export async function onRequestPost(context) {
    const { request, env } = context;
    const body = await leerJsonEstricto(request, 4096);
    if (!body.ok) {
        return jsonSegura({ ok: false, error: body.error }, body.status);
    }

    const esquema = validarEsquemaPermitido(body.data, CAMPOS_PERMITIDOS, CAMPOS_PROHIBIDOS);
    if (!esquema.ok) {
        return jsonSegura({ ok: false, error: esquema.error }, esquema.status);
    }

    const { email, password, full_name: fullName = "Cliente QuoraTec", ruc_cedula: rucCedula } = body.data;
    if (validarCamposComunesLicense({ email }) || !email) {
        return jsonSegura({ ok: false, error: "INVALID_EMAIL" }, 400);
    }
    if (typeof password !== "string" || password.length < 10) {
        return jsonSegura({ ok: false, error: "PASSWORD_MIN_10_CHARS" }, 400);
    }
    const cleanEmail = String(email).trim().toLowerCase();

    const supaCfg = obtenerConfigSupabaseEnv(env);
    if (!supaCfg.configured) {
        return jsonSegura({ ok: false, error: "AUTH_BACKEND_NOT_CONFIGURED" }, 503);
    }

    const resp = await fetch(`${supaCfg.url}/auth/v1/signup`, {
        method: "POST",
        headers: {
            apikey: supaCfg.anonKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email: cleanEmail,
            password,
            data: {
                full_name: String(fullName).trim().slice(0, 120),
                ruc_cedula: rucCedula ? String(rucCedula).trim().slice(0, 13) : null,
            },
        }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
        return jsonSegura({ ok: false, error: data?.msg || "SIGNUP_FAILED" }, resp.status >= 400 ? resp.status : 400);
    }

    const welcomeEmail = buildWelcomeTrialEmail({
        razonSocial: String(fullName).trim().slice(0, 120),
        downloadUrl: "https://erp.quoratec.com/descargas.html",
        trialDays: 15,
    });
    const mailRes = await sendEmailViaResend(env, {
        to: [cleanEmail],
        subject: welcomeEmail.subject,
        html: welcomeEmail.html,
        text: welcomeEmail.text,
    });

    return jsonSegura({
        ok: true,
        user: data.user || { email: cleanEmail },
        access_token: data.access_token || null,
        welcome_email_sent: Boolean(mailRes.sent),
    }, 201);
}

export async function onRequest(context) {
    if (String(context?.request?.method || "").toUpperCase() === "POST") {
        return onRequestPost(context);
    }
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
