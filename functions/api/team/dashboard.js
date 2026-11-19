/**
 * Dashboard Remoto de Equipo (Founder + Support Agent con 2FA TOTP aal2).
 * GET /api/team/dashboard
 * QuoraTec ERP v3.0.0 — Edición 2026 (QuoraTec).
 */

import { jsonSegura, supabaseRestRequest } from "../../_shared/security.js";
import {
    WHATSAPP_VIDEO_GUIDES,
    contarDemosHoyAgente,
    exigirStaffAutenticado,
} from "./_staff_guard.js";
import { getActiveCommissionPolicy, promoteEligibleCommissions } from "../../_lib/commission_service.js";

const DEMO_LIMIT_PER_DAY = 3;

export async function onRequestGet(context) {
    const { request, env } = context;
    const auth = await exigirStaffAutenticado(request, env, { requireAal2: true });
    if (!auth.ok) return auth.response;

    const { supaCfg, staff, user } = auth;

    if (staff.role === "founder") {
        await promoteEligibleCommissions(supaCfg);
        const [licRes, auditRes, ticketRes, seatsRes, vaultsRes, commRes, commPolicy] = await Promise.all([
            supabaseRestRequest(
                supaCfg,
                "licenses?order=issued_at.desc&limit=50&select=id,license_id,org_token,holder_name,holder_ruc,plan_name,max_rucs,max_seats,cloud_gb,storage_modes,is_founder,environment,issued_at,expires_at,status",
                { method: "GET", serviceRole: true },
            ),
            supabaseRestRequest(
                supaCfg,
                "audit_logs?order=created_at.desc&limit=50&select=id,actor_role,actor_city,action,target_table,target_id,environment,ip_address,metadata_json,created_at",
                { method: "GET", serviceRole: true },
            ),
            supabaseRestRequest(
                supaCfg,
                "support_tickets?order=created_at.desc&limit=50&select=id,empresa_ruc,client_name,app_version,description,diagnostic_zip_path,status,assigned_to,created_at",
                { method: "GET", serviceRole: true },
            ),
            supabaseRestRequest(
                supaCfg,
                "registered_seats?is_active=eq.true&select=org_token",
                { method: "GET", serviceRole: true },
            ),
            supabaseRestRequest(
                supaCfg,
                "company_vaults?order=updated_at.desc&limit=100&select=org_token,empresa_ruc,storage_mode,used_gb,lock_status,updated_at",
                { method: "GET", serviceRole: true },
            ),
            supabaseRestRequest(
                supaCfg,
                "referral_commissions?order=created_at.desc&limit=100&select=id,order_id,referral_code,advisor_name,sale_type,payment_type,commission_rate,net_collected_usd,base_amount_usd,commission_usd,hold_days,approved_at,eligible_at,status,reversal_reason,paid_at,created_at",
                { method: "GET", serviceRole: true },
            ),
            getActiveCommissionPolicy(supaCfg, env),
        ]);

        const licenses = Array.isArray(licRes.data) ? licRes.data : [];
        const auditLogs = Array.isArray(auditRes.data) ? auditRes.data : [];
        const tickets = Array.isArray(ticketRes.data) ? ticketRes.data : [];
        const activeSeats = Array.isArray(seatsRes.data) ? seatsRes.data : [];
        const vaultsStorage = Array.isArray(vaultsRes.data) ? vaultsRes.data : [];
        const commissions = Array.isArray(commRes.data) ? commRes.data : [];

        return jsonSegura(
            {
                ok: true,
                role: "founder",
                staff,
                summary: {
                    total_licenses: licenses.length,
                    active_licenses: licenses.filter((l) => l.status === "active" && l.environment === "production").length,
                    founder_licenses: licenses.filter((l) => Boolean(l.is_founder)).length,
                    demo_licenses: licenses.filter((l) => l.environment === "demo").length,
                    escalated_tickets: tickets.filter((t) => t.status === "escalated").length,
                    open_tickets: tickets.filter((t) => t.status === "open" || t.status === "in_progress").length,
                    active_seats_total: activeSeats.length,
                    total_cloud_used_gb: vaultsStorage.reduce((acc, v) => acc + Number(v.used_gb || 0), 0),
                    pending_settlement_usd: commissions.filter((c) => c.status === "pending_settlement").reduce((acc, c) => acc + Number(c.commission_usd || 0), 0),
                    payable_commissions_usd: commissions.filter((c) => c.status === "payable").reduce((acc, c) => acc + Number(c.commission_usd || 0), 0),
                    paid_commissions_usd: commissions.filter((c) => c.status === "paid").reduce((acc, c) => acc + Number(c.commission_usd || 0), 0),
                },
                commission_policy: commPolicy,
                licenses,
                audit_logs: auditLogs,
                tickets,
                escalated_tickets: tickets.filter((t) => t.status === "escalated"),
                vaults_storage: vaultsStorage,
                commissions,
            },
            200,
        );
    }

    if (staff.role === "sales_agent") {
        await promoteEligibleCommissions(supaCfg);
        const ownCode = String(staff.referral_code || "").trim().toUpperCase();
        if (!ownCode) {
            return jsonSegura({ ok: false, error: "REFERRAL_CODE_NOT_ASSIGNED" }, 403);
        }
        const commRes = await supabaseRestRequest(
            supaCfg,
            `referral_commissions?referral_code=eq.${encodeURIComponent(ownCode)}&order=created_at.desc&limit=100&select=id,order_id,referral_code,sale_type,payment_type,commission_rate,net_collected_usd,commission_usd,hold_days,approved_at,eligible_at,status,reversal_reason,paid_at,created_at`,
            { method: "GET", serviceRole: true },
        );
        const ownComms = Array.isArray(commRes.data) ? commRes.data : [];
        return jsonSegura(
            {
                ok: true,
                role: "sales_agent",
                staff: { full_name: staff.full_name, city: staff.city, role: staff.role, referral_code: ownCode },
                summary: {
                    total_sales: ownComms.length,
                    pending_settlement_usd: ownComms.filter((c) => c.status === "pending_settlement").reduce((a, c) => a + Number(c.commission_usd || 0), 0),
                    payable_commissions_usd: ownComms.filter((c) => c.status === "payable").reduce((a, c) => a + Number(c.commission_usd || 0), 0),
                    paid_commissions_usd: ownComms.filter((c) => c.status === "paid").reduce((a, c) => a + Number(c.commission_usd || 0), 0),
                },
                commissions: ownComms,
            },
            200,
        );
    }

    // Vista support_agent (Quito / Santo Domingo): Cero exposición de audit_logs ni listado global de licencias
    const [ticketRes, quotaRes] = await Promise.all([
        supabaseRestRequest(
            supaCfg,
            "support_tickets?status=in.(open,in_progress,escalated)&order=created_at.desc&limit=40&select=id,empresa_ruc,client_name,app_version,description,diagnostic_zip_path,status,assigned_to,created_at",
            { method: "GET", serviceRole: true },
        ),
        contarDemosHoyAgente(supaCfg, user.id),
    ]);

    const usedToday = quotaRes.ok ? quotaRes.count : 0;
    return jsonSegura(
        {
            ok: true,
            role: "support_agent",
            staff,
            demo_quota: {
                used_today: usedToday,
                limit_per_day: DEMO_LIMIT_PER_DAY,
                remaining_today: Math.max(0, DEMO_LIMIT_PER_DAY - usedToday),
            },
            tickets: Array.isArray(ticketRes.data) ? ticketRes.data : [],
            video_guides: WHATSAPP_VIDEO_GUIDES,
        },
        200,
    );
}

export async function onRequest(context) {
    if (String(context?.request?.method || "").toUpperCase() === "GET") {
        return onRequestGet(context);
    }
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
