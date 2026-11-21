/**
 * POST /api/dashboard/admin/advisors
 * Crea o actualiza perfiles de asesoras y su código de referido en D1 sin usar CLI.
 */
import {
    jsonSegura,
    leerJsonEstricto,
    validarCamposComunesLicense,
    validarEsquemaPermitido,
} from "../../../_shared/security.js";
import { requireDashboardUser } from "../_auth_guard.js";

const CAMPOS_PERMITIDOS = ["email", "full_name", "codigo_referido", "is_active"];

export async function onRequestPost(context) {
    const { request, env } = context;
    const auth = await requireDashboardUser(request, env, ["admin"]);
    if (!auth.ok) return auth.response;
    if (!env?.DB) return jsonSegura({ ok: false, error: "D1_NOT_BOUND" }, 503);

    const body = await leerJsonEstricto(request, 4096);
    if (!body.ok) return jsonSegura({ ok: false, error: body.error }, body.status);

    const esquema = validarEsquemaPermitido(body.data, CAMPOS_PERMITIDOS, []);
    if (!esquema.ok) return jsonSegura({ ok: false, error: esquema.error }, esquema.status);

    const email = String(body.data.email || "").trim().toLowerCase();
    const fullName = String(body.data.full_name || "").trim().slice(0, 120);
    const code = String(body.data.codigo_referido || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    const isActive = body.data.is_active === false || Number(body.data.is_active) === 0 ? 0 : 1;

    if (!email || validarCamposComunesLicense({ email })) return jsonSegura({ ok: false, error: "INVALID_EMAIL" }, 400);
    if (!fullName) return jsonSegura({ ok: false, error: "FULL_NAME_REQUIRED" }, 400);
    if (!code || code.length < 3 || code.length > 24) return jsonSegura({ ok: false, error: "INVALID_REFERRAL_CODE" }, 400);

    const existing = await env.DB.prepare("SELECT id FROM users WHERE lower(email) = lower(?) LIMIT 1").bind(email).first();
    const userId = existing?.id || crypto.randomUUID();

    await env.DB.prepare(
        "INSERT OR REPLACE INTO users (id, email, full_name, role, codigo_referido, is_active, updated_at) VALUES (?, ?, ?, 'asesora', ?, ?, datetime('now'))"
    ).bind(userId, email, fullName, code, isActive).run();

    return jsonSegura({ ok: true, advisor: { id: userId, email, full_name: fullName, codigo_referido: code, is_active: isActive } }, 200);
}

export async function onRequest(context) {
    if (String(context?.request?.method || "").toUpperCase() === "POST") return onRequestPost(context);
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
