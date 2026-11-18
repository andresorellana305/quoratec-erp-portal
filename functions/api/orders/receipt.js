/**
 * Registro de Comprobante / Referencia Deuna! o Transferencia -> estado pendiente_verificacion.
 * TributaFlow ERP v3.0.0 (QUORATEC).
 */

import {
    calcularSha256Hex,
    constanteTiempoIgualdad,
    esperarPisoTiempo,
    hexABytes,
    jsonSegura,
    leerJsonEstricto,
    obtenerConfigSupabaseEnv,
    obtenerUsuarioSupabaseDesdeToken,
    supabaseRestRequest,
    validarBearerTokenHeader,
    validarCamposComunesLicense,
    validarEsquemaPermitido,
} from "../../_shared/security.js";
import { actualizarOrdenMemoria, obtenerOrdenMemoria } from "./_store.js";

const CAMPOS_PERMITIDOS = [
    "order_ref",
    "order_token",
    "voucher_ref",
    "banco_origen",
    "comprobante_nombre",
    "comprobante_mime",
    "comprobante_sha256",
    "comprobante_size_bytes",
];

const CAMPOS_PROHIBIDOS_TAMPERING = ["status", "is_paid", "monto", "price", "user_id"];
const VOUCHER_REGEX = /^[A-Z0-9-]{4,40}$/i;
const BANCO_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 ._\-\/!]{2,60}$/;
const FILE_NAME_REGEX = /^[A-Za-z0-9._-]{3,90}$/;
const MIME_PERMITIDOS = new Set(["image/png", "image/jpeg", "image/webp", "application/pdf"]);
const SHA256_REGEX = /^[a-f0-9]{64}$/i;

export async function onRequestPost(context) {
    const { request, env } = context;
    const inicioMs = Date.now();

    try {
        const body = await leerJsonEstricto(request, 16384);
        if (!body.ok) {
            return jsonSegura({ ok: false, error: body.error }, body.status);
        }

        const esquema = validarEsquemaPermitido(body.data, CAMPOS_PERMITIDOS, CAMPOS_PROHIBIDOS_TAMPERING);
        if (!esquema.ok) {
            return jsonSegura({ ok: false, error: esquema.error }, esquema.status);
        }

        const {
            order_ref: orderRef,
            order_token: orderToken,
            voucher_ref: voucherRef,
            banco_origen: bancoOrigen = "Deuna! / Banco Pichincha",
            comprobante_nombre: compNombre,
            comprobante_mime: compMime,
            comprobante_sha256: compSha,
            comprobante_size_bytes: compSize,
        } = body.data;

        const errRef = validarCamposComunesLicense({ orderRef });
        if (errRef || !orderRef || !VOUCHER_REGEX.test(String(voucherRef || "").trim())) {
            return jsonSegura({ ok: false, error: "INVALID_ORDER_OR_VOUCHER_REF" }, 400);
        }
        if (!BANCO_REGEX.test(String(bancoOrigen))) {
            return jsonSegura({ ok: false, error: "INVALID_BANK_NAME" }, 400);
        }
        if (compNombre !== undefined && !FILE_NAME_REGEX.test(String(compNombre))) {
            return jsonSegura({ ok: false, error: "INVALID_ATTACHMENT_NAME" }, 400);
        }
        if (compMime !== undefined && !MIME_PERMITIDOS.has(String(compMime).toLowerCase())) {
            return jsonSegura({ ok: false, error: "UNSUPPORTED_ATTACHMENT_MIME" }, 400);
        }
        if (compSha !== undefined && !SHA256_REGEX.test(String(compSha))) {
            return jsonSegura({ ok: false, error: "INVALID_ATTACHMENT_SHA256" }, 400);
        }
        if (compSize !== undefined && (!Number.isInteger(compSize) || compSize <= 0 || compSize > 5 * 1024 * 1024)) {
            return jsonSegura({ ok: false, error: "INVALID_ATTACHMENT_SIZE" }, 400);
        }

        const supaCfg = obtenerConfigSupabaseEnv(env);
        const bearer = validarBearerTokenHeader(request);
        const userObj = supaCfg.configured && bearer ? await obtenerUsuarioSupabaseDesdeToken(supaCfg, bearer) : null;

        let order = null;
        let persisted = false;
        if (supaCfg.configured && supaCfg.serviceRoleKey) {
            const q = `orders?order_ref=eq.${encodeURIComponent(orderRef)}&select=*`;
            const resGet = await supabaseRestRequest(supaCfg, q, { method: "GET", serviceRole: true });
            if (resGet.ok && Array.isArray(resGet.data) && resGet.data.length > 0) {
                order = resGet.data[0];
                persisted = true;
            }
        } else {
            order = obtenerOrdenMemoria(orderRef);
        }

        let autorizado = false;
        if (order) {
            if (userObj && order.user_id && userObj.id === order.user_id) {
                autorizado = true;
            } else if (typeof orderToken === "string" && orderToken.length >= 20) {
                const suppliedHash = hexABytes(await calcularSha256Hex(orderToken));
                const storedHash = hexABytes(String(order.order_token_hash || ""));
                if (suppliedHash && storedHash && constanteTiempoIgualdad(suppliedHash, storedHash)) {
                    autorizado = true;
                }
            }
        }

        if (!autorizado) {
            return jsonSegura({ ok: false, error: "ORDER_NOT_VERIFIED_OR_NOT_FOUND" }, 401);
        }

        const patch = {
            voucher_ref: String(voucherRef).trim().toUpperCase(),
            banco_origen: String(bancoOrigen).trim(),
            comprobante_nombre: compNombre ? String(compNombre).trim() : order.comprobante_nombre,
            comprobante_mime: compMime ? String(compMime).toLowerCase() : order.comprobante_mime,
            comprobante_sha256: compSha ? String(compSha).toLowerCase() : order.comprobante_sha256,
            status: "pendiente_verificacion",
            updated_at: new Date().toISOString(),
        };

        if (persisted) {
            const up = await supabaseRestRequest(
                supaCfg,
                `orders?order_ref=eq.${encodeURIComponent(orderRef)}`,
                { method: "PATCH", serviceRole: true, body: patch }
            );
            if (!up.ok) {
                return jsonSegura({ ok: false, error: "RECEIPT_UPDATE_FAILED" }, 502);
            }
        } else {
            actualizarOrdenMemoria(orderRef, patch);
        }

        return jsonSegura(
            {
                ok: true,
                persisted,
                order_ref: orderRef,
                status: "pendiente_verificacion",
                voucher_ref: patch.voucher_ref,
                updated_at: patch.updated_at,
            },
            200
        );
    } finally {
        await esperarPisoTiempo(inicioMs, 20);
    }
}

export async function onRequest() {
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
