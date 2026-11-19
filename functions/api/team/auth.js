/**
 * Autenticación Exclusiva de Equipo + Enrollment / Challenge 2FA TOTP (aal2).
 * POST /api/team/auth
 * QuoraTec ERP v3.0.0 — Edición 2026 (QuoraTec).
 */

import {
    esperarPisoTiempo,
    jsonSegura,
    leerJsonEstricto,
    obtenerConfigSupabaseEnv,
    validarCamposComunesLicense,
    validarEsquemaPermitido,
} from "../../_shared/security.js";
import {
    extraerNivelAal,
    obtenerPerfilStaffActivo,
    registrarAuditLog,
    verificarUsuarioAuthSupabase,
    exigirStaffAutenticado,
} from "./_staff_guard.js";

const CAMPOS_PERMITIDOS = ["action", "email", "password", "aal1_token", "factor_id", "challenge_id", "code"];
const CAMPOS_PROHIBIDOS = ["role", "user_id", "is_admin", "service_role", "staff_role"];
const TOTP_CODE_REGEX = /^\d{6}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function onRequestPost(context) {
    const { request, env } = context;
    const inicioMs = Date.now();

    try {
        const body = await leerJsonEstricto(request, 8192);
        if (!body.ok) {
            return jsonSegura({ ok: false, error: body.error }, body.status);
        }

        const esquema = validarEsquemaPermitido(body.data, CAMPOS_PERMITIDOS, CAMPOS_PROHIBIDOS);
        if (!esquema.ok) {
            return jsonSegura({ ok: false, error: esquema.error }, esquema.status);
        }

        const action = String(body.data.action || "").trim();
        if (!["login", "mfa_verify", "session_check"].includes(action)) {
            return jsonSegura({ ok: false, error: "INVALID_TEAM_AUTH_ACTION" }, 400);
        }

        if (action === "session_check") {
            const auth = await exigirStaffAutenticado(request, env, { requireAal2: true });
            if (!auth.ok) return auth.response;
            return jsonSegura({ ok: true, aal: auth.aal, staff: auth.staff, user: auth.user }, 200);
        }

        const supaCfg = obtenerConfigSupabaseEnv(env);
        if (!supaCfg.configured || !supaCfg.serviceRoleKey) {
            return jsonSegura(
                {
                    ok: false,
                    error: "TEAM_BACKEND_NOT_CONFIGURED",
                    message: "Configura SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY para autenticación del equipo.",
                },
                503,
            );
        }

        if (action === "login") {
            const email = String(body.data.email || "").trim().toLowerCase();
            const password = String(body.data.password || "");
            if (!email || validarCamposComunesLicense({ email }) || password.length < 8 || password.length > 128) {
                return jsonSegura({ ok: false, error: "INVALID_CREDENTIALS_FORMAT" }, 400);
            }

            const signResp = await fetch(`${supaCfg.url}/auth/v1/token?grant_type=password`, {
                method: "POST",
                headers: { apikey: supaCfg.anonKey, "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const signData = await signResp.json().catch(() => ({}));
            if (!signResp.ok || !signData?.access_token || !signData?.user?.id) {
                return jsonSegura({ ok: false, error: "INVALID_TEAM_CREDENTIALS", message: "Credenciales inválidas." }, 401);
            }

            const staff = await obtenerPerfilStaffActivo(supaCfg, signData.user.id);
            if (!staff) {
                return jsonSegura(
                    { ok: false, error: "STAFF_ACCESS_DENIED", message: "Usuario no autorizado en el equipo QuoraTec." },
                    403,
                );
            }

            const aalToken = signData.access_token;
            const factorsResp = await fetch(`${supaCfg.url}/auth/v1/factors`, {
                method: "GET",
                headers: { apikey: supaCfg.anonKey, Authorization: `Bearer ${aalToken}` },
            });
            const factorsList = factorsResp.ok ? await factorsResp.json().catch(() => []) : [];
            const verifiedTotp = Array.isArray(factorsList)
                ? factorsList.find((f) => f.factor_type === "totp" && f.status === "verified")
                : null;

            if (verifiedTotp) {
                const chalResp = await fetch(`${supaCfg.url}/auth/v1/factors/${encodeURIComponent(verifiedTotp.id)}/challenge`, {
                    method: "POST",
                    headers: { apikey: supaCfg.anonKey, Authorization: `Bearer ${aalToken}`, "Content-Type": "application/json" },
                    body: "{}",
                });
                const chalData = await chalResp.json().catch(() => ({}));
                if (!chalResp.ok || !chalData?.id) {
                    return jsonSegura({ ok: false, error: "MFA_CHALLENGE_FAILED" }, 502);
                }
                return jsonSegura(
                    {
                        ok: true,
                        mfa_required: true,
                        mfa_enrolled: true,
                        factor_id: verifiedTotp.id,
                        challenge_id: chalData.id,
                        aal1_token: aalToken,
                        staff_preview: { full_name: staff.full_name, city: staff.city, role: staff.role },
                    },
                    200,
                );
            }

            // Enrolamiento TOTP inicial obligatorio para miembros sin 2FA configurado
            const enrollResp = await fetch(`${supaCfg.url}/auth/v1/factors`, {
                method: "POST",
                headers: { apikey: supaCfg.anonKey, Authorization: `Bearer ${aalToken}`, "Content-Type": "application/json" },
                body: JSON.stringify({ factor_type: "totp", friendly_name: `QuoraTec_${staff.role}_${staff.city}` }),
            });
            const enrollData = await enrollResp.json().catch(() => ({}));
            if (!enrollResp.ok || !enrollData?.id) {
                return jsonSegura({ ok: false, error: "MFA_ENROLL_FAILED" }, 502);
            }

            return jsonSegura(
                {
                    ok: true,
                    mfa_required: true,
                    mfa_enrolled: false,
                    factor_id: enrollData.id,
                    qr_code: enrollData?.totp?.qr_code || null,
                    totp_secret: enrollData?.totp?.secret || null,
                    aal1_token: aalToken,
                    staff_preview: { full_name: staff.full_name, city: staff.city, role: staff.role },
                },
                200,
            );
        }

        // action === "mfa_verify"
        const aal1Token = String(body.data.aal1_token || "").trim();
        const factorId = String(body.data.factor_id || "").trim();
        let challengeId = String(body.data.challenge_id || "").trim();
        const code = String(body.data.code || "").trim();

        if (!aal1Token || aal1Token.length < 20 || !UUID_REGEX.test(factorId) || !TOTP_CODE_REGEX.test(code)) {
            return jsonSegura({ ok: false, error: "INVALID_TOTP_PAYLOAD" }, 400);
        }

        const userObj = await verificarUsuarioAuthSupabase(supaCfg, aal1Token);
        if (!userObj) {
            return jsonSegura({ ok: false, error: "INVALID_AAL1_TOKEN" }, 401);
        }
        const staff = await obtenerPerfilStaffActivo(supaCfg, userObj.id);
        if (!staff) {
            return jsonSegura({ ok: false, error: "STAFF_ACCESS_DENIED" }, 403);
        }

        if (!challengeId) {
            const chalResp = await fetch(`${supaCfg.url}/auth/v1/factors/${encodeURIComponent(factorId)}/challenge`, {
                method: "POST",
                headers: { apikey: supaCfg.anonKey, Authorization: `Bearer ${aal1Token}`, "Content-Type": "application/json" },
                body: "{}",
            });
            const chalData = await chalResp.json().catch(() => ({}));
            if (!chalResp.ok || !chalData?.id) {
                return jsonSegura({ ok: false, error: "MFA_CHALLENGE_FAILED" }, 502);
            }
            challengeId = chalData.id;
        } else if (!UUID_REGEX.test(challengeId)) {
            return jsonSegura({ ok: false, error: "INVALID_CHALLENGE_ID" }, 400);
        }

        const verifyResp = await fetch(`${supaCfg.url}/auth/v1/factors/${encodeURIComponent(factorId)}/verify`, {
            method: "POST",
            headers: { apikey: supaCfg.anonKey, Authorization: `Bearer ${aal1Token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ challenge_id: challengeId, code }),
        });
        const verifyData = await verifyResp.json().catch(() => ({}));
        if (!verifyResp.ok || !verifyData?.access_token) {
            return jsonSegura({ ok: false, error: "INVALID_TOTP_CODE", message: "Código 2FA TOTP incorrecto o expirado." }, 401);
        }

        const level = extraerNivelAal(verifyData.access_token, userObj);
        if (level.aal !== "aal2" || !level.hasTotp) {
            return jsonSegura({ ok: false, error: "AAL2_NOT_ATTAINED" }, 403);
        }

        await registrarAuditLog(supaCfg, request, staff, {
            action: "TEAM_MFA_LOGIN_AAL2",
            targetTable: "staff_roles",
            targetId: staff.user_id,
            environment: "production",
            metadata: { factor_id: factorId },
        });

        return jsonSegura(
            {
                ok: true,
                aal: "aal2",
                access_token: verifyData.access_token,
                expires_in: verifyData.expires_in || 3600,
                staff,
                user: { id: userObj.id, email: String(userObj.email || "").toLowerCase() },
            },
            200,
        );
    } finally {
        await esperarPisoTiempo(inicioMs, 20);
    }
}

export async function onRequest() {
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
