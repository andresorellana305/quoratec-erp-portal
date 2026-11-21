/**
 * Guard de Autenticación JWT y Resolución de Rol para /api/dashboard/**
 * Roles soportados: admin, asesora, contador, cliente.
 */
import {
    jsonSegura,
    obtenerConfigSupabaseEnv,
    obtenerUsuarioSupabaseDesdeToken,
    supabaseRestRequest,
    validarBearerTokenHeader,
} from "../../_shared/security.js";

function mapStaffRoleToDashboardRole(staffRole) {
    if (staffRole === "founder") return "admin";
    if (staffRole === "sales_agent") return "asesora";
    return "cliente";
}

export async function requireDashboardUser(request, env, allowedRoles = null) {
    const bearer = validarBearerTokenHeader(request);
    if (!bearer) {
        return { ok: false, response: jsonSegura({ ok: false, error: "UNAUTHORIZED" }, 401) };
    }

    const supaCfg = obtenerConfigSupabaseEnv(env);
    if (!supaCfg.configured) {
        return { ok: false, response: jsonSegura({ ok: false, error: "AUTH_BACKEND_NOT_CONFIGURED" }, 503) };
    }

    const user = await obtenerUsuarioSupabaseDesdeToken(supaCfg, bearer);
    if (!user) {
        return { ok: false, response: jsonSegura({ ok: false, error: "INVALID_OR_EXPIRED_SESSION" }, 401) };
    }

    let role = "cliente";
    let codigoReferido = null;
    let fullName = user.user_metadata?.full_name || user.email || "Usuario QuoraTec";

    // 1. Resolver rol desde D1 si está enlazado
    if (env?.DB) {
        try {
            const d1User = await env.DB.prepare(
                "SELECT role, codigo_referido, full_name, is_active FROM users WHERE id = ? OR lower(email) = lower(?) LIMIT 1",
            ).bind(user.id, user.email || "").first();
            if (d1User) {
                if (Number(d1User.is_active) === 0) {
                    return { ok: false, response: jsonSegura({ ok: false, error: "ACCOUNT_INACTIVE" }, 403) };
                }
                if (["admin", "asesora", "contador", "cliente"].includes(d1User.role)) {
                    role = d1User.role;
                }
                codigoReferido = d1User.codigo_referido || null;
                fullName = d1User.full_name || fullName;
            }
        } catch {
            // Fallback a staff_roles en Supabase
        }
    }

    // 2. Fallback a staff_roles en Supabase si sigue como cliente
    if (role === "cliente" && supaCfg.serviceRoleKey) {
        const srRes = await supabaseRestRequest(
            supaCfg,
            `staff_roles?user_id=eq.${encodeURIComponent(user.id)}&is_active=eq.true&select=role,referral_code,full_name&limit=1`,
            { method: "GET", serviceRole: true },
        );
        if (srRes.ok && Array.isArray(srRes.data) && srRes.data.length > 0) {
            role = mapStaffRoleToDashboardRole(srRes.data[0].role);
            codigoReferido = srRes.data[0].referral_code || codigoReferido;
            fullName = srRes.data[0].full_name || fullName;
        }
    }

    if (Array.isArray(allowedRoles) && !allowedRoles.includes(role)) {
        return {
            ok: false,
            response: jsonSegura({ ok: false, error: "FORBIDDEN_ROLE", required_roles: allowedRoles }, 403),
        };
    }

    return {
        ok: true,
        bearer,
        user,
        role,
        codigo_referido: codigoReferido ? String(codigoReferido).trim().toUpperCase() : null,
        full_name: fullName,
        supaCfg,
        db: env?.DB || null,
    };
}
