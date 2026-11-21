/**
 * GET /api/dashboard/summary
 * Devuelve KPIs, licencias, órdenes o comisiones estrictamente según el rol del usuario autenticado.
 */
import { jsonSegura, supabaseRestRequest } from "../../_shared/security.js";
import { requireDashboardUser } from "./_auth_guard.js";
import { promoteEligibleCommissions } from "../../_lib/commission_service.js";

export async function onRequestGet(context) {
    const { request, env } = context;
    const auth = await requireDashboardUser(request, env);
    if (!auth.ok) return auth.response;

    const { role, user, codigo_referido: refCode, full_name: fullName, supaCfg, bearer, db } = auth;

    if (role === "admin") {
        await promoteEligibleCommissions(supaCfg);
        const monthStart = new Date();
        monthStart.setUTCDate(1);
        monthStart.setUTCHours(0, 0, 0, 0);

        const [ordRes, licRes, commRes] = await Promise.all([
            supabaseRestRequest(
                supaCfg,
                "orders?order=created_at.desc&limit=100&select=id,order_ref,email,ruc_cedula,razon_social,plan_id,monto_autorizado_usd,payment_channel,status,voucher_ref,referral_code,created_at,verified_at",
                { method: "GET", serviceRole: true },
            ),
            supabaseRestRequest(
                supaCfg,
                "licenses?order=issued_at.desc&limit=100&select=id,license_key,org_token,holder_name,holder_ruc,plan_name,max_rucs,max_seats,cloud_gb,hwid_inicial,environment,status,issued_at,expires_at",
                { method: "GET", serviceRole: true },
            ),
            supabaseRestRequest(
                supaCfg,
                "referral_commissions?order=created_at.desc&limit=150&select=id,order_id,referral_code,advisor_name,sale_type,commission_rate,net_collected_usd,commission_usd,status,eligible_at,paid_at,created_at",
                { method: "GET", serviceRole: true },
            ),
        ]);

        const orders = Array.isArray(ordRes.data) ? ordRes.data : [];
        const licenses = Array.isArray(licRes.data) ? licRes.data : [];
        const commissions = Array.isArray(commRes.data) ? commRes.data : [];

        const monthlyRevenueUsd = orders
            .filter((o) => o.status === "verificado" && new Date(o.verified_at || o.created_at) >= monthStart)
            .reduce((acc, o) => acc + Number(o.monto_autorizado_usd || 0), 0);

        return jsonSegura({
            ok: true,
            role: "admin",
            profile: { full_name: fullName, email: user.email },
            kpis: {
                monthly_revenue_usd: Math.round(monthlyRevenueUsd * 100) / 100,
                active_licenses: licenses.filter((l) => l.status === "active" && l.environment === "production").length,
                trial_licenses: licenses.filter((l) => l.environment === "demo" && l.status === "active").length,
                pending_orders: orders.filter((o) => o.status === "pendiente_verificacion").length,
                payable_commissions_usd: Math.round(
                    commissions.filter((c) => c.status === "payable" || c.status === "pending_settlement").reduce((a, c) => a + Number(c.commission_usd || 0), 0) * 100
                ) / 100,
            },
            pending_orders: orders.filter((o) => o.status === "pendiente_verificacion"),
            commissions,
            licenses,
        }, 200);
    }

    if (role === "asesora") {
        await promoteEligibleCommissions(supaCfg);
        if (!refCode) {
            return jsonSegura({ ok: false, error: "REFERRAL_CODE_NOT_ASSIGNED" }, 403);
        }

        const [commRes, refOrdersRes] = await Promise.all([
            supabaseRestRequest(
                supaCfg,
                `referral_commissions?referral_code=eq.${encodeURIComponent(refCode)}&order=created_at.desc&limit=100&select=id,order_id,referral_code,sale_type,commission_rate,net_collected_usd,commission_usd,status,eligible_at,paid_at,created_at`,
                { method: "GET", serviceRole: true },
            ),
            supabaseRestRequest(
                supaCfg,
                `orders?referral_code=eq.${encodeURIComponent(refCode)}&order=created_at.desc&limit=100&select=order_ref,ruc_cedula,razon_social,email,plan_id,monto_autorizado_usd,status,created_at`,
                { method: "GET", serviceRole: true },
            ),
        ]);

        const commissions = Array.isArray(commRes.data) ? commRes.data : [];
        const referredClients = Array.isArray(refOrdersRes.data) ? refOrdersRes.data : [];

        return jsonSegura({
            ok: true,
            role: "asesora",
            profile: {
                full_name: fullName,
                email: user.email,
                codigo_referido: refCode,
                referral_url: `https://erp.quoratec.com/?ref=${encodeURIComponent(refCode)}`,
            },
            kpis: {
                new_sale_rate_pct: 20,
                renewal_rate_pct: 10,
                approved_payable_usd: Math.round(
                    commissions.filter((c) => c.status === "payable").reduce((a, c) => a + Number(c.commission_usd || 0), 0) * 100
                ) / 100,
                pending_usd: Math.round(
                    commissions.filter((c) => c.status === "pending_settlement" || c.status === "pending_payment").reduce((a, c) => a + Number(c.commission_usd || 0), 0) * 100
                ) / 100,
                paid_usd: Math.round(
                    commissions.filter((c) => c.status === "paid").reduce((a, c) => a + Number(c.commission_usd || 0), 0) * 100
                ) / 100,
            },
            commissions,
            referred_clients: referredClients,
        }, 200);
    }

    // Vista Cliente / Contador
    const [ordRes, licRes] = await Promise.all([
        supabaseRestRequest(
            supaCfg,
            `orders?user_id=eq.${encodeURIComponent(user.id)}&order=created_at.desc&select=order_ref,plan_id,estaciones_autorizadas,monto_autorizado_usd,payment_channel,status,created_at`,
            { method: "GET", extraHeaders: { Authorization: `Bearer ${bearer}` } },
        ),
        supabaseRestRequest(
            supaCfg,
            `licenses?user_id=eq.${encodeURIComponent(user.id)}&select=id,license_key,org_token,holder_ruc,holder_name,plan_name,max_rucs,max_seats,cloud_gb,hwid_inicial,status,issued_at,expires_at`,
            { method: "GET", extraHeaders: { Authorization: `Bearer ${bearer}` } },
        ),
    ]);

    let tenants = [];
    let contadorLinks = [];
    if (db) {
        try {
            const tRes = await db.prepare(
                "SELECT ruc_cedula, razon_social, plan_id, is_active FROM tenants_ruc WHERE owner_user_id = ? AND is_active = 1",
            ).bind(user.id).all();
            tenants = Array.isArray(tRes?.results) ? tRes.results : [];
            const cRes = await db.prepare(
                "SELECT tenant_ruc, link_code, status, expires_at FROM contador_access WHERE contador_user_id = ? ORDER BY created_at DESC LIMIT 20",
            ).bind(user.id).all();
            contadorLinks = Array.isArray(cRes?.results) ? cRes.results : [];
        } catch {
            // Silencioso si D1 aún no tiene tablas aplicadas
        }
    }

    return jsonSegura({
        ok: true,
        role,
        profile: { full_name: fullName, email: user.email },
        orders: Array.isArray(ordRes.data) ? ordRes.data : [],
        licenses: Array.isArray(licRes.data) ? licRes.data : [],
        tenants,
        contador_links: contadorLinks,
    }, 200);
}

export async function onRequest(context) {
    if (String(context?.request?.method || "").toUpperCase() === "GET") {
        return onRequestGet(context);
    }
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
