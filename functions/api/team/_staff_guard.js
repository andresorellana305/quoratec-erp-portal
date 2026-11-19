/**
 * Guard de Seguridad RBAC + 2FA TOTP Obligatorio (aal2) para el Panel Remoto de Equipo (/equipo.html).
 * QuoraTec ERP v3.0.0 — Edición 2026 (QuoraTec).
 *
 * Reglas:
 * 1. Valida el JWT contra Supabase Auth (/auth/v1/user) antes de confiar en sus claims.
 * 2. Exige sesión TOTP MFA verificada (aal === 'aal2') para cualquier operación del panel.
 * 3. Verifica registro activo en `public.staff_roles` con role en ['founder', 'support_agent'].
 * 4. Registra toda acción crítica en la bitácora inmutable `public.audit_logs`.
 */

import {
    jsonSegura,
    obtenerConfigSupabaseEnv,
    supabaseRestRequest,
    validarBearerTokenHeader,
} from "../../_shared/security.js";

export const VALID_STAFF_ROLES = new Set(["founder", "support_agent", "sales_agent"]);

export const WHATSAPP_VIDEO_GUIDES = Object.freeze([
    Object.freeze({
        id: "vid-1",
        duration: "2 min",
        title: "1. Instalación y activación de licencia (.lic)",
        url: "https://erp.quoratec.com/guia-uso.html#video-tutoriales",
        whatsapp_text:
            "Hola 👋 Aquí tienes la guía rápida de 2 minutos para instalar QuoraTec ERP y cargar tu archivo .lic: https://erp.quoratec.com/guia-uso.html#video-tutoriales",
    }),
    Object.freeze({
        id: "vid-2",
        duration: "2 min",
        title: "2. Configuración de Firma Electrónica .p12 y POS",
        url: "https://erp.quoratec.com/modulos/facturador-pos.html",
        whatsapp_text:
            "Hola 👋 Te comparto los pasos para cargar tu firma .p12 y usar los atajos rápidos F2/F4/F8/F12 en el POS: https://erp.quoratec.com/modulos/facturador-pos.html",
    }),
    Object.freeze({
        id: "vid-3",
        duration: "2 min",
        title: "3. Sincronización masiva SRI por Cédula o RUC",
        url: "https://erp.quoratec.com/modulos/sincronizar-sri.html",
        whatsapp_text:
            "Hola 👋 Revisa cómo descargar tus XML y RIDE PDF del SRI en lote organizados por mes: https://erp.quoratec.com/modulos/sincronizar-sri.html",
    }),
    Object.freeze({
        id: "vid-4",
        duration: "2 min",
        title: "4. Bandeja de Documentos (4 Pasos), Retenciones y ATS",
        url: "https://erp.quoratec.com/modulos/bandeja-documentos.html",
        whatsapp_text:
            "Hola 👋 Así contabilizas compras y generas retenciones 49 dígitos + ATS en 4 pasos: https://erp.quoratec.com/modulos/bandeja-documentos.html",
    }),
    Object.freeze({
        id: "vid-5",
        duration: "2 min",
        title: "5. Inventario Multi-Bodega y Farmacias FIFO (Caducidad)",
        url: "https://erp.quoratec.com/modulos/inventario-kardex.html",
        whatsapp_text:
            "Hola 👋 Guía rápida de 2 minutos para control de lotes FIFO, fechas de caducidad y múltiples bodegas: https://erp.quoratec.com/modulos/inventario-kardex.html",
    }),
    Object.freeze({
        id: "vid-6",
        duration: "2 min",
        title: "6. Auditor Fantasma, Termómetro RIMPE y Clasificador AGP",
        url: "https://erp.quoratec.com/modulos/auditor-fantasma.html",
        whatsapp_text:
            "Hola 👋 Detecta proveedores fantasmas (EFOS) y controla tu cupo RIMPE en 2 minutos: https://erp.quoratec.com/modulos/auditor-fantasma.html",
    }),
    Object.freeze({
        id: "vid-7",
        duration: "2 min",
        title: "7. Contabilidad NIIF Automática y Nómina IESS / RDEP",
        url: "https://erp.quoratec.com/modulos/contabilidad-niif.html",
        whatsapp_text:
            "Hola 👋 Genera roles de pago IESS, décimos, RDEP y estados financieros NIIF desde aquí: https://erp.quoratec.com/modulos/contabilidad-niif.html",
    }),
    Object.freeze({
        id: "vid-8",
        duration: "2 min",
        title: "8. Copiloto IA Local, Centralis Engine y Backups .tfbackup",
        url: "https://erp.quoratec.com/modulos/ajustes-seguridad.html",
        whatsapp_text:
            "Hola 👋 Activa tu Copiloto IA Local, pedidos WhatsApp/Telegram con Centralis Engine y respaldos .tfbackup: https://erp.quoratec.com/modulos/ajustes-seguridad.html",
    }),
]);

export function decodeJwtPayloadUnsafe(token) {
    try {
        const parts = String(token || "").split(".");
        if (parts.length !== 3) return null;
        const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
        const json = new TextDecoder().decode(Uint8Array.from(atob(padded), (c) => c.charCodeAt(0)));
        const obj = JSON.parse(json);
        return obj && typeof obj === "object" ? obj : null;
    } catch {
        return null;
    }
}

export async function verificarUsuarioAuthSupabase(supaCfg, bearerToken) {
    if (!supaCfg?.configured || !bearerToken) return null;
    try {
        const resp = await fetch(`${supaCfg.url}/auth/v1/user`, {
            method: "GET",
            headers: {
                apikey: supaCfg.anonKey,
                Authorization: `Bearer ${bearerToken}`,
            },
        });
        if (!resp.ok) return null;
        const user = await resp.json();
        if (!user || typeof user.id !== "string") return null;
        return user;
    } catch {
        return null;
    }
}

export function extraerNivelAal(jwtToken, userObj) {
    const claims = decodeJwtPayloadUnsafe(jwtToken);
    if (!claims || (userObj && claims.sub !== userObj.id)) {
        return { aal: "aal1", hasTotp: false };
    }
    const aal = String(claims.aal || "").toLowerCase();
    const amrList = Array.isArray(claims.amr) ? claims.amr : [];
    const hasTotp = amrList.some((item) => String(item?.method || "").toLowerCase() === "totp");
    return { aal: aal || "aal1", hasTotp };
}

export async function obtenerPerfilStaffActivo(supaCfg, userId) {
    if (!supaCfg?.configured || !supaCfg?.serviceRoleKey || !userId) return null;
    const res = await supabaseRestRequest(
        supaCfg,
        `staff_roles?user_id=eq.${encodeURIComponent(userId)}&is_active=eq.true&select=user_id,full_name,city,role,referral_code,is_active&limit=1`,
        { method: "GET", serviceRole: true },
    );
    if (!res.ok || !Array.isArray(res.data) || res.data.length === 0) return null;
    const row = res.data[0];
    if (!row.is_active || !VALID_STAFF_ROLES.has(row.role)) return null;
    return row;
}

/**
 * Requiere sesión Supabase autenticada + 2FA TOTP (aal2) + perfil activo en `staff_roles`.
 */
export async function exigirStaffAutenticado(request, env, { requireAal2 = true, allowedRoles = null } = {}) {
    const supaCfg = obtenerConfigSupabaseEnv(env);
    if (!supaCfg.configured || !supaCfg.serviceRoleKey) {
        return {
            ok: false,
            response: jsonSegura(
                {
                    ok: false,
                    error: "TEAM_BACKEND_NOT_CONFIGURED",
                    message: "Configura SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY en el servidor.",
                },
                503,
            ),
        };
    }

    const bearer = validarBearerTokenHeader(request);
    if (!bearer) {
        return { ok: false, response: jsonSegura({ ok: false, error: "UNAUTHORIZED" }, 401) };
    }

    const userObj = await verificarUsuarioAuthSupabase(supaCfg, bearer);
    if (!userObj) {
        return { ok: false, response: jsonSegura({ ok: false, error: "INVALID_OR_EXPIRED_SESSION" }, 401) };
    }

    const staff = await obtenerPerfilStaffActivo(supaCfg, userObj.id);
    if (!staff) {
        return {
            ok: false,
            response: jsonSegura(
                { ok: false, error: "STAFF_ACCESS_DENIED", message: "Cuenta no autorizada o inactiva en staff_roles." },
                403,
            ),
        };
    }

    const { aal, hasTotp } = extraerNivelAal(bearer, userObj);
    if (requireAal2 && (aal !== "aal2" || !hasTotp)) {
        return {
            ok: false,
            response: jsonSegura(
                {
                    ok: false,
                    error: "MFA_AAL2_REQUIRED",
                    message: "Se requiere verificación obligatoria de 2FA TOTP (aal2) para acceder al panel de equipo.",
                },
                403,
            ),
        };
    }

    if (allowedRoles && !allowedRoles.includes(staff.role)) {
        return {
            ok: false,
            response: jsonSegura(
                { ok: false, error: "INSUFFICIENT_STAFF_ROLE", message: "Tu rol no tiene privilegios para esta operación." },
                403,
            ),
        };
    }

    return {
        ok: true,
        supaCfg,
        bearer,
        user: { id: userObj.id, email: String(userObj.email || "").toLowerCase() },
        staff,
        aal,
    };
}

export function inicioDiaEcuadorIsoUtc() {
    // Ecuador continental = UTC-5 todo el año (sin horario de verano)
    const ahora = new Date();
    const ecMs = ahora.getTime() - 5 * 3600 * 1000;
    const ecDate = new Date(ecMs);
    const midnightEcUtcMs = Date.UTC(ecDate.getUTCFullYear(), ecDate.getUTCMonth(), ecDate.getUTCDate(), 5, 0, 0, 0);
    return new Date(midnightEcUtcMs).toISOString();
}

export async function contarDemosHoyAgente(supaCfg, userId) {
    const startIso = inicioDiaEcuadorIsoUtc();
    const res = await supabaseRestRequest(
        supaCfg,
        `licenses?issued_by=eq.${encodeURIComponent(userId)}&environment=eq.demo&issued_at=gte.${encodeURIComponent(startIso)}&select=id`,
        { method: "GET", serviceRole: true },
    );
    if (!res.ok || !Array.isArray(res.data)) {
        return { ok: false, count: 0 };
    }
    return { ok: true, count: res.data.length };
}

export async function registrarAuditLog(supaCfg, request, staff, { action, targetTable, targetId = null, environment = "production", metadata = {} }) {
    if (!supaCfg?.configured || !supaCfg?.serviceRoleKey) return;
    const ipAddress = String(request?.headers?.get("cf-connecting-ip") || request?.headers?.get("x-forwarded-for") || "").split(",")[0].trim().slice(0, 64) || null;
    const userAgent = String(request?.headers?.get("user-agent") || "").slice(0, 180) || null;

    await supabaseRestRequest(supaCfg, "audit_logs", {
        method: "POST",
        serviceRole: true,
        extraHeaders: { Prefer: "return=minimal" },
        body: {
            actor_user_id: staff?.user_id || null,
            actor_role: staff?.role || null,
            actor_city: staff?.city || null,
            action: String(action || "UNKNOWN").slice(0, 80),
            target_table: String(targetTable || "system").slice(0, 64),
            target_id: targetId ? String(targetId).slice(0, 128) : null,
            environment: environment ? String(environment).slice(0, 32) : null,
            ip_address: ipAddress,
            user_agent: userAgent,
            metadata_json: metadata && typeof metadata === "object" ? metadata : {},
        },
    });
}
