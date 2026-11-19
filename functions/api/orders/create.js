/**
 * Creación de Orden Híbrida (Invitado + Cuenta Supabase) — QuoraTec ERP v3.0.0.
 * Calcula montos autoritativos en servidor, bloquea pasarelas con feature flag desactivado
 * ("Próximamente") y emite order_token criptográfico para consulta sin contraseña.
 */

import {
    calcularCotizacionAutoritativa,
    calcularSha256Hex,
    generarTokenCriptografico,
    jsonSegura,
    leerJsonEstricto,
    obtenerConfigSupabaseEnv,
    obtenerEstadoPasarelasEnv,
    obtenerUsuarioSupabaseDesdeToken,
    supabaseRestRequest,
    validarBearerTokenHeader,
    validarCamposComunesLicense,
    validarEsquemaPermitido,
} from "../../_shared/security.js";
import { guardarOrdenMemoria } from "./_store.js";

const CAMPOS_PERMITIDOS = [
    "checkout_mode",
    "plan_id",
    "extra_seats",
    "extra_rucs_packs",
    "extra_cloud_packs",
    "cloud_opcional_emprendedor",
    "email",
    "ruc_cedula",
    "razon_social",
    "payment_channel",
    "hwid_inicial",
    "referral_code",
    "sale_type",
];

const CAMPOS_PROHIBIDOS_TAMPERING = [
    "price",
    "precio",
    "amount",
    "amount_usd",
    "monto",
    "monto_autorizado_usd",
    "discount",
    "descuento",
    "status",
    "is_paid",
    "bypass_payment",
    "user_id",
    "order_token",
    "order_token_hash",
    "commission_rate",
    "commission_usd",
    "net_collected_usd",
    "hold_days",
    "eligible_at",
    "approved_at",
    "list_price_usd",
];

const RAZON_SOCIAL_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9 .,&()\/-]{2,120}$/;

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
        checkout_mode: checkoutMode = "guest",
        plan_id: planId,
        extra_seats: extraSeats = 0,
        extra_rucs_packs: extraRucsPacks = 0,
        extra_cloud_packs: extraCloudPacks = 0,
        cloud_opcional_emprendedor: cloudOptEmp = false,
        email,
        ruc_cedula: rucCedula,
        razon_social: razonSocial,
        payment_channel: paymentChannel = "DEUNA_PERSONAL",
        hwid_inicial: hwidInicial,
    } = body.data;

    if (!["guest", "account"].includes(String(checkoutMode))) {
        return jsonSegura({ ok: false, error: "INVALID_CHECKOUT_MODE" }, 400);
    }

    const pasarelas = obtenerEstadoPasarelasEnv(env);
    if (!Object.prototype.hasOwnProperty.call(pasarelas, String(paymentChannel))) {
        return jsonSegura({ ok: false, error: "UNKNOWN_PAYMENT_CHANNEL" }, 400);
    }
    if (!pasarelas[String(paymentChannel)]) {
        return jsonSegura(
            {
                ok: false,
                error: "GATEWAY_FEATURE_DISABLED_SOON",
                message: "Esta pasarela figurará activa próximamente mediante feature flag en servidor. Usa Deuna! Personal o Transferencia Bancaria.",
            },
            400
        );
    }

    const razonLimpia = String(razonSocial || "").trim();
    if (!RAZON_SOCIAL_REGEX.test(razonLimpia)) {
        return jsonSegura({ ok: false, error: "INVALID_RAZON_SOCIAL" }, 400);
    }

    const errCampos = validarCamposComunesLicense({
        email: String(email || "").trim(),
        ruc: String(rucCedula || "").trim(),
        hwid: hwidInicial ? String(hwidInicial).trim() : undefined,
    });
    if (errCampos || !email || !rucCedula) {
        return jsonSegura({ ok: false, error: errCampos || "MISSING_REQUIRED_FIELDS" }, 400);
    }

    const cotizacion = calcularCotizacionAutoritativa(planId, extraSeats, extraRucsPacks, extraCloudPacks, cloudOptEmp);
    if (!cotizacion.ok) {
        return jsonSegura({ ok: false, error: cotizacion.error }, 400);
    }

    const PLANES_HWID_OBLIGATORIO = new Set(["EMPRENDEDOR", "COMERCIAL_PRO", "CONTADOR"]);
    const hwidClean = hwidInicial ? String(hwidInicial).trim().toUpperCase() : "";
    if (PLANES_HWID_OBLIGATORIO.has(cotizacion.plan.id) && !hwidClean) {
        return jsonSegura(
            {
                ok: false,
                error: "HWID_REQUIRED_FOR_PLAN",
                message: `El plan ${cotizacion.plan.id} requiere el HWID del Equipo inicial (QuoraTec ERP -> Configuración -> 4. Plan y Licencia).`,
            },
            400
        );
    }

    const supaCfg = obtenerConfigSupabaseEnv(env);
    let userObj = null;
    if (checkoutMode === "account") {
        const bearer = validarBearerTokenHeader(request);
        if (!supaCfg.configured) {
            return jsonSegura({ ok: false, error: "SUPABASE_AUTH_NOT_CONFIGURED" }, 503);
        }
        userObj = await obtenerUsuarioSupabaseDesdeToken(supaCfg, bearer);
        if (!userObj) {
            return jsonSegura({ ok: false, error: "ACCOUNT_SESSION_REQUIRED" }, 401);
        }
    }

    const suffix = generarTokenCriptografico("QT", 6).replace("QT-", "").slice(0, 10);
    const orderRef = `QT-${cotizacion.plan.id}-${suffix}`;
    const orderToken = generarTokenCriptografico("QTTK", 24);
    const orderTokenHash = await calcularSha256Hex(orderToken);
    const nowIso = new Date().toISOString();

    const record = {
        order_ref: orderRef,
        order_token_hash: orderTokenHash,
        checkout_mode: checkoutMode,
        user_id: userObj ? userObj.id : null,
        email: String(email).trim().toLowerCase(),
        ruc_cedula: String(rucCedula).trim(),
        razon_social: razonLimpia,
        plan_id: cotizacion.plan.id,
        extra_seats: cotizacion.extraSeats,
        estaciones_autorizadas: cotizacion.estacionesAutorizadas,
        monto_autorizado_usd: cotizacion.montoAutoritativoUsd,
        payment_channel: String(paymentChannel),
        status: "pendiente_verificacion",
        voucher_ref: null,
        banco_origen: null,
        comprobante_nombre: null,
        comprobante_mime: null,
        comprobante_sha256: null,
        hwid_inicial: hwidClean || null,
        created_at: nowIso,
        updated_at: nowIso,
    };

    let persisted = false;
    if (supaCfg.configured && supaCfg.serviceRoleKey) {
        const resSupa = await supabaseRestRequest(supaCfg, "orders", {
            method: "POST",
            serviceRole: true,
            extraHeaders: { Prefer: "return=representation" },
            body: record,
        });
        if (!resSupa.ok) {
            return jsonSegura({ ok: false, error: "ORDER_PERSISTENCE_FAILED" }, 502);
        }
        persisted = true;
    } else {
        guardarOrdenMemoria(record);
    }

    return jsonSegura(
        {
            ok: true,
            version: "3.0.0",
            persisted,
            checkout_mode: checkoutMode,
            order_ref: orderRef,
            order_token: orderToken,
            status: "pendiente_verificacion",
            plan_id: cotizacion.plan.id,
            estaciones_autorizadas: cotizacion.estacionesAutorizadas,
            monto_autorizado_usd: cotizacion.montoAutoritativoUsd,
            payment_channel: String(paymentChannel),
            can_claim_account: checkoutMode === "guest",
            created_at: nowIso,
        },
        201
    );
}

export async function onRequest() {
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
