/**
 * Servicio de Comisiones sobre Cobro Neto Efectivo — QuoraTec ERP v3.0.0.
 * Reglas comerciales:
 *  1. Toda comisión se calcula exclusivamente sobre el monto NETO efectivamente cobrado y aprobado.
 *  2. Distingue sale_type ('new_sale' vs 'renewal') con tasas configurables en gobernanza.
 *  3. Ciclo de vida: pending_payment -> pending_settlement -> payable -> paid | reversed.
 *  4. Periodo de retención/validación (hold_days) antes de marcar como liquidable (payable).
 */

import { supabaseServiceRest } from "./license_issuer.js";

function clampRate(val, fallback) {
    const n = Number(val);
    if (!Number.isFinite(n) || n < 0 || n > 50) return fallback;
    return Math.round(n * 100) / 100;
}

function clampHoldDays(val, fallback) {
    const n = Number(val);
    if (!Number.isInteger(n) || n < 0 || n > 90) return fallback;
    return n;
}

export async function getActiveCommissionPolicy(supa, env = {}) {
    const envNewRate = clampRate(env?.COMMISSION_NEW_SALE_RATE, 20);
    const envRenewalRate = clampRate(env?.COMMISSION_RENEWAL_RATE, 10);
    const envHoldDays = clampHoldDays(env?.COMMISSION_HOLD_DAYS, 7);

    if (supa?.configured) {
        const res = await supabaseServiceRest(
            supa,
            "commission_policies?id=eq.default&select=new_sale_rate,renewal_rate,hold_days,updated_at&limit=1",
            { method: "GET" },
        );
        if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
            const row = res.data[0];
            return {
                new_sale_rate: clampRate(row.new_sale_rate, envNewRate),
                renewal_rate: clampRate(row.renewal_rate, envRenewalRate),
                hold_days: clampHoldDays(row.hold_days, envHoldDays),
                source: "supabase",
            };
        }
    }

    return {
        new_sale_rate: envNewRate,
        renewal_rate: envRenewalRate,
        hold_days: envHoldDays,
        source: "env_default",
    };
}

export function computeNetCommission({ netCollectedUsd, saleType = "new_sale", policy }) {
    const net = Math.round(Number(netCollectedUsd || 0) * 100) / 100;
    if (!Number.isFinite(net) || net <= 0) {
        return { ok: false, error: "INVALID_NET_COLLECTED_AMOUNT" };
    }
    const normalizedSaleType = saleType === "renewal"
        ? "renewal"
        : (saleType === "upgrade" ? "upgrade" : "new_sale");
    const rate = normalizedSaleType === "renewal"
        ? clampRate(policy?.renewal_rate, 10)
        : clampRate(policy?.new_sale_rate, 20);

    const commissionUsd = Math.round(net * (rate / 100) * 100) / 100;
    return {
        ok: true,
        sale_type: normalizedSaleType,
        payment_type: normalizedSaleType === "renewal" ? "renewal" : "first_payment",
        commission_rate: rate,
        net_collected_usd: net,
        commission_usd: commissionUsd,
    };
}

async function resolveSaleType(supa, order) {
    if (order?.sale_type === "renewal" || order?.sale_type === "new_sale" || order?.sale_type === "upgrade") {
        return order.sale_type;
    }
    const ruc = String(order?.ruc_cedula || "").trim();
    if (!supa?.configured || !ruc) {
        return "new_sale";
    }
    const priorRes = await supabaseServiceRest(
        supa,
        `licenses?holder_ruc=eq.${encodeURIComponent(ruc)}&environment=eq.production&order_id=neq.${encodeURIComponent(order.id)}&select=id&limit=1`,
        { method: "GET" },
    );
    if (priorRes.ok && Array.isArray(priorRes.data) && priorRes.data.length > 0) {
        return "renewal";
    }
    return "new_sale";
}

export async function recordPendingPaymentCommission(supa, env, order) {
    if (!supa?.configured || !order?.id || !order?.referral_code) {
        return { ok: false, skipped: true };
    }

    const policy = await getActiveCommissionPolicy(supa, env);
    const saleType = await resolveSaleType(supa, order);
    const netUsd = Number(order.monto_autorizado_usd || 0);
    const calc = computeNetCommission({ netCollectedUsd: netUsd, saleType, policy });
    if (!calc.ok) return calc;

    const res = await supabaseServiceRest(
        supa,
        "referral_commissions?on_conflict=order_id",
        {
            method: "POST",
            extraHeaders: { Prefer: "resolution=ignore-duplicates,return=representation" },
            body: {
                order_id: order.id,
                referral_code: String(order.referral_code).trim().toUpperCase().slice(0, 32),
                sale_type: calc.sale_type,
                payment_type: calc.payment_type,
                commission_rate: calc.commission_rate,
                base_amount_usd: calc.net_collected_usd,
                net_collected_usd: calc.net_collected_usd,
                commission_usd: calc.commission_usd,
                hold_days: policy.hold_days,
                status: "pending_payment",
            },
        },
    );
    return { ok: res.ok, data: res.data };
}

export async function recordApprovedOrderCommission(supa, env, order, license, netCollectedUsd) {
    if (!supa?.configured || !order?.id || !order?.referral_code) {
        return { ok: false, skipped: true };
    }

    // No sobrescribir si ya fue liquidada o revertida
    const existingRes = await supabaseServiceRest(
        supa,
        `referral_commissions?order_id=eq.${encodeURIComponent(order.id)}&select=id,status&limit=1`,
        { method: "GET" },
    );
    if (existingRes.ok && Array.isArray(existingRes.data) && existingRes.data.length > 0) {
        const currentStatus = existingRes.data[0].status;
        if (["pending_settlement", "payable", "paid", "reversed"].includes(currentStatus)) {
            return { ok: true, idempotent: true, status: currentStatus };
        }
    }

    const policy = await getActiveCommissionPolicy(supa, env);
    const saleType = await resolveSaleType(supa, order);
    const calc = computeNetCommission({ netCollectedUsd, saleType, policy });
    if (!calc.ok) return calc;

    const approvedAt = new Date();
    const eligibleAt = new Date(approvedAt.getTime() + policy.hold_days * 86400 * 1000);
    const nextStatus = policy.hold_days === 0 ? "payable" : "pending_settlement";

    const res = await supabaseServiceRest(
        supa,
        "referral_commissions?on_conflict=order_id",
        {
            method: "POST",
            extraHeaders: { Prefer: "resolution=merge-duplicates,return=representation" },
            body: {
                order_id: order.id,
                license_id: license?.id || null,
                referral_code: String(order.referral_code).trim().toUpperCase().slice(0, 32),
                sale_type: calc.sale_type,
                payment_type: calc.payment_type,
                commission_rate: calc.commission_rate,
                base_amount_usd: calc.net_collected_usd,
                net_collected_usd: calc.net_collected_usd,
                commission_usd: calc.commission_usd,
                hold_days: policy.hold_days,
                approved_at: approvedAt.toISOString(),
                eligible_at: eligibleAt.toISOString(),
                status: nextStatus,
            },
        },
    );

    return {
        ok: res.ok,
        status: nextStatus,
        sale_type: calc.sale_type,
        net_collected_usd: calc.net_collected_usd,
        commission_rate: calc.commission_rate,
        commission_usd: calc.commission_usd,
        eligible_at: eligibleAt.toISOString(),
    };
}

export async function promoteEligibleCommissions(supa) {
    if (!supa?.configured) return { ok: false };
    const nowIso = new Date().toISOString();
    const res = await supabaseServiceRest(
        supa,
        `referral_commissions?status=eq.pending_settlement&eligible_at=lte.${encodeURIComponent(nowIso)}`,
        {
            method: "PATCH",
            body: { status: "payable" },
        },
    );
    return { ok: res.ok };
}
