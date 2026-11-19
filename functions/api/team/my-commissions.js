/**
 * Consulta de Comisiones Propias para Asesora / Vendedora (sales_agent) — 2FA TOTP aal2 obligatorio.
 * GET /api/team/my-commissions
 * Regla estricta: una sales_agent solo puede consultar las comisiones asociadas a su propio referral_code.
 */
import { jsonSegura, supabaseRestRequest } from "../../_shared/security.js";
import { exigirStaffAutenticado } from "./_staff_guard.js";
import { promoteEligibleCommissions } from "../../_lib/commission_service.js";

export async function onRequestGet(context) {
    const { request, env } = context;
    const auth = await exigirStaffAutenticado(request, env, {
        requireAal2: true,
        allowedRoles: ["sales_agent", "founder"],
    });
    if (!auth.ok) return auth.response;

    const { supaCfg, staff } = auth;
    await promoteEligibleCommissions(supaCfg);

    const ownCode = String(staff.referral_code || "").trim().toUpperCase();
    if (staff.role === "sales_agent" && !ownCode) {
        return jsonSegura({ ok: false, error: "REFERRAL_CODE_NOT_ASSIGNED" }, 403);
    }

    const filter = staff.role === "founder" && !ownCode
        ? "order=created_at.desc&limit=100"
        : `referral_code=eq.${encodeURIComponent(ownCode)}&order=created_at.desc&limit=100`;

    const res = await supabaseRestRequest(
        supaCfg,
        `referral_commissions?${filter}&select=id,order_id,referral_code,sale_type,payment_type,commission_rate,net_collected_usd,commission_usd,hold_days,approved_at,eligible_at,status,reversal_reason,paid_at,created_at`,
        { method: "GET", serviceRole: true },
    );
    if (!res.ok) {
        return jsonSegura({ ok: false, error: "COMMISSIONS_QUERY_FAILED" }, 500);
    }

    const rows = Array.isArray(res.data) ? res.data : [];
    return jsonSegura({
        ok: true,
        role: staff.role,
        referral_code: ownCode || null,
        summary: {
            total_records: rows.length,
            pending_payment_usd: rows.filter((c) => c.status === "pending_payment").reduce((a, c) => a + Number(c.commission_usd || 0), 0),
            pending_settlement_usd: rows.filter((c) => c.status === "pending_settlement").reduce((a, c) => a + Number(c.commission_usd || 0), 0),
            payable_usd: rows.filter((c) => c.status === "payable").reduce((a, c) => a + Number(c.commission_usd || 0), 0),
            paid_usd: rows.filter((c) => c.status === "paid").reduce((a, c) => a + Number(c.commission_usd || 0), 0),
            reversed_count: rows.filter((c) => c.status === "reversed").length,
        },
        commissions: rows,
    }, 200);
}

export async function onRequest(context) {
    if (String(context?.request?.method || "").toUpperCase() === "GET") {
        return onRequestGet(context);
    }
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
