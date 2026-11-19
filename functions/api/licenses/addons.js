/**
 * Módulo de Ampliaciones / Add-ons en Autoservicio: POST /api/licenses/addons
 * Permite a clientes activos ingresar RUC titular u org_token y adquirir:
 *  - PC_EXTRA (+1 PC Extra, $49/año)
 *  - RUCS_PACK_5 (+5 RUCs Extra, $59/año)
 *  - CLOUD_PACK_50 (+50 GB Nube Extra, $59/año)
 *  - NUBE_10GB (Activar Nube Remota 10 GB, $29/año)
 */
import {
    calcularSha256Hex,
    jsonSegura,
    leerJsonEstricto,
    validarCamposComunesLicense,
    validarEsquemaPermitido,
} from "../../_shared/security.js";
import { getServiceSupabaseConfig, supabaseServiceRest } from "../../_lib/license_issuer.js";

const CAMPOS_PERMITIDOS = ["ruc_or_token", "email", "addons", "payment_channel", "voucher_ref"];
const CAMPOS_PROHIBIDOS_TAMPERING = [
    "price",
    "precio",
    "amount",
    "amount_usd",
    "monto",
    "discount",
    "descuento",
    "status",
    "commission_rate",
    "commission_usd",
    "net_collected_usd",
];

const ADDON_CATALOG = Object.freeze({
    PC_EXTRA: Object.freeze({ id: "PC_EXTRA", label: "+1 PC Extra", usd: 49, seatsDelta: 1, rucsDelta: 0, cloudDelta: 0 }),
    RUCS_PACK_5: Object.freeze({ id: "RUCS_PACK_5", label: "+5 RUCs Extra", usd: 59, seatsDelta: 0, rucsDelta: 5, cloudDelta: 0 }),
    CLOUD_PACK_50: Object.freeze({ id: "CLOUD_PACK_50", label: "+50 GB Nube Extra", usd: 59, seatsDelta: 0, rucsDelta: 0, cloudDelta: 50 }),
    NUBE_10GB: Object.freeze({ id: "NUBE_10GB", label: "Activar Nube Remota 10 GB", usd: 29, seatsDelta: 0, rucsDelta: 0, cloudDelta: 10 }),
});

export async function onRequestPost(context) {
    const { request, env } = context;
    const body = await leerJsonEstricto(request, 8192);
    if (!body.ok) {
        return jsonSegura({ ok: false, error: body.error }, body.status);
    }

    const esquema = validarEsquemaPermitido(body.data, CAMPOS_PERMITIDOS, CAMPOS_PROHIBIDOS_TAMPERING);
    if (!esquema.ok) {
        return jsonSegura({ ok: false, error: esquema.error }, esquema.status);
    }

    const {
        ruc_or_token: rucOrTokenRaw,
        email: emailRaw,
        addons,
        payment_channel: paymentChannelRaw = "DEUNA_PERSONAL",
        voucher_ref: voucherRefRaw,
    } = body.data;

    const rucOrToken = String(rucOrTokenRaw || "").trim();
    const email = String(emailRaw || "").trim().toLowerCase();
    const paymentChannel = String(paymentChannelRaw || "DEUNA_PERSONAL").trim().toUpperCase();

    if (!rucOrToken || rucOrToken.length < 8 || rucOrToken.length > 80) {
        return jsonSegura({ ok: false, error: "INVALID_RUC_OR_ORG_TOKEN" }, 400);
    }
    const errEmail = validarCamposComunesLicense({ email });
    if (errEmail) {
        return jsonSegura({ ok: false, error: errEmail }, 400);
    }
    if (!Array.isArray(addons) || addons.length === 0 || addons.length > 10) {
        return jsonSegura({ ok: false, error: "ADDONS_ARRAY_REQUIRED" }, 400);
    }

    let totalUsd = 0;
    let seatsDelta = 0;
    let rucsDelta = 0;
    let cloudDelta = 0;
    const resolvedAddons = [];

    for (const rawId of addons) {
        const key = String(rawId || "").trim().toUpperCase();
        const item = ADDON_CATALOG[key];
        if (!item) {
            return jsonSegura({ ok: false, error: `UNKNOWN_ADDON_${key}` }, 400);
        }
        totalUsd += item.usd;
        seatsDelta += item.seatsDelta;
        rucsDelta += item.rucsDelta;
        cloudDelta += item.cloudDelta;
        resolvedAddons.push(item.id);
    }

    if (paymentChannel === "PAYPHONE_BUSINESS" && String(env?.FF_PAYPHONE_BUSINESS_ENABLED || "").toLowerCase() !== "true") {
        return jsonSegura({
            ok: false,
            enabled: false,
            error: "PAYPHONE_CHANNEL_IN_ACTIVATION",
            message: "PayPhone Business se encuentra en activación. Utiliza Deuna! Personal o Transferencia Bancaria Directa.",
        }, 503);
    }

    const supa = getServiceSupabaseConfig(env);
    if (!supa.configured) {
        return jsonSegura({ ok: false, error: "SUPABASE_SERVICE_NOT_CONFIGURED" }, 503);
    }

    const isRuc = /^\d{10}(\d{3})?$/.test(rucOrToken);
    const queryFilter = isRuc
        ? `holder_ruc=eq.${encodeURIComponent(rucOrToken)}`
        : `org_token=eq.${encodeURIComponent(rucOrToken)}`;

    const licRes = await supabaseServiceRest(
        supa,
        `licenses?${queryFilter}&status=eq.active&order=issued_at.desc&limit=1&select=*`,
        { method: "GET" },
    );
    if (!licRes.ok || !Array.isArray(licRes.data) || licRes.data.length === 0) {
        return jsonSegura({
            ok: false,
            error: "ACTIVE_LICENSE_NOT_FOUND",
            message: "No se encontró una licencia activa asociada a ese RUC u org_token.",
        }, 404);
    }

    const lic = licRes.data[0];
    const projectedQuotas = {
        org_token: lic.org_token,
        holder_ruc: lic.holder_ruc,
        plan_id: lic.plan_name || lic.plan_id,
        current: {
            max_rucs: Number(lic.max_rucs || 1),
            max_seats: Number(lic.max_seats || 1),
            cloud_gb: Number(lic.cloud_gb || 0),
        },
        projected: {
            max_rucs: Number(lic.max_rucs || 1) + rucsDelta,
            max_seats: Number(lic.max_seats || 1) + seatsDelta,
            cloud_gb: Number(lic.cloud_gb || 0) + cloudDelta,
        },
    };

    const randBytes = new Uint8Array(4);
    crypto.getRandomValues(randBytes);
    const randHex = Array.from(randBytes, (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    const orderRef = `QT-ADDON-${Date.now().toString(36).toUpperCase()}-${randHex}`;
    const tokenHash = await calcularSha256Hex(`${orderRef}:${email}:${lic.org_token}`);

    const orderInsert = await supabaseServiceRest(supa, "orders", {
        method: "POST",
        extraHeaders: { Prefer: "return=representation" },
        body: {
            order_ref: orderRef,
            order_token_hash: tokenHash,
            checkout_mode: "guest",
            email,
            ruc_cedula: lic.holder_ruc,
            razon_social: `${lic.holder_name} [ADDON: ${resolvedAddons.join(",")}]`,
            plan_id: lic.plan_name && lic.plan_name !== "DEMO_15_DIAS" ? lic.plan_name : "COMERCIAL_PRO",
            extra_seats: seatsDelta,
            extra_rucs_packs: Math.floor(rucsDelta / 5),
            extra_cloud_packs: Math.floor(cloudDelta / 50),
            cloud_opcional_emprendedor: resolvedAddons.includes("NUBE_10GB"),
            estaciones_autorizadas: projectedQuotas.projected.max_seats,
            monto_autorizado_usd: totalUsd,
            payment_channel: ["DEUNA_PERSONAL", "TRANSFERENCIA", "PAYPHONE_BUSINESS"].includes(paymentChannel)
                ? paymentChannel
                : "DEUNA_PERSONAL",
            status: "pendiente_verificacion",
            voucher_ref: voucherRefRaw ? String(voucherRefRaw).trim().slice(0, 64) : null,
        },
    });

    if (!orderInsert.ok) {
        return jsonSegura({ ok: false, error: "ADDON_ORDER_CREATE_FAILED" }, 500);
    }

    return jsonSegura({
        ok: true,
        order_ref: orderRef,
        amount_usd: totalUsd,
        addons: resolvedAddons,
        quotas: projectedQuotas,
        status: "pendiente_verificacion",
        message: `Ampliación registrada (${orderRef}) por $${totalUsd.toFixed(2)} USD. Al confirmar el pago, se emitirá y enviará tu .lic actualizado a ${email}.`,
    }, 201);
}

export async function onRequest(context) {
    if (String(context?.request?.method || "").toUpperCase() === "POST") {
        return onRequestPost(context);
    }
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
