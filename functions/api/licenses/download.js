/**
 * Descarga Segura de Archivo .lic (POST y GET) — QuoraTec ERP (QUORATEC).
 * /api/licenses/download
 * Valida acceso vía JWT autenticado (user_id) o modo invitado (order_ref + order_token + email).
 */

import {
    SECURITY_HEADERS,
    calcularSha256Hex,
    constanteTiempoIgualdad,
    esperarPisoTiempo,
    hexABytes,
    jsonSegura,
    leerJsonEstricto,
    obtenerConfigSupabaseEnv,
    obtenerUsuarioSupabaseDesdeToken,
    validarBearerTokenHeader,
    validarCamposComunesLicense,
    validarEsquemaPermitido,
} from "../../_shared/security.js";
import {
    downloadStorageObject,
    getServiceSupabaseConfig,
    supabaseServiceRest,
    uploadStorageObject,
} from "../../_lib/license_issuer.js";
import { signLicenseV2 } from "../../_lib/license_signer.js";

const CAMPOS_PERMITIDOS = ["order_ref", "order_id", "order_token", "email"];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LICENSES_BUCKET = "licenses";

async function handleDownload(request, env, params) {
    const inicioMs = Date.now();

    const orderRef = String(params.order_ref || "").trim();
    const orderId = String(params.order_id || "").trim();
    const orderToken = String(params.order_token || "").trim();
    const email = String(params.email || "").trim().toLowerCase();

    if (!orderRef && !orderId) {
        await esperarPisoTiempo(inicioMs, 20);
        return jsonSegura({ ok: false, error: "ORDER_REF_OR_ID_REQUIRED" }, 400);
    }
    if (orderRef && validarCamposComunesLicense({ orderRef })) {
        await esperarPisoTiempo(inicioMs, 20);
        return jsonSegura({ ok: false, error: "INVALID_ORDER_REF" }, 400);
    }
    if (orderId && !UUID_REGEX.test(orderId)) {
        await esperarPisoTiempo(inicioMs, 20);
        return jsonSegura({ ok: false, error: "INVALID_ORDER_ID" }, 400);
    }

    const supaService = getServiceSupabaseConfig(env);
    if (!supaService.configured) {
        return jsonSegura({ ok: false, error: "SUPABASE_SERVICE_NOT_CONFIGURED" }, 503);
    }

    const supaAuthCfg = obtenerConfigSupabaseEnv(env);
    const bearer = validarBearerTokenHeader(request);
    const userObj = supaAuthCfg.configured && bearer
        ? await obtenerUsuarioSupabaseDesdeToken(supaAuthCfg, bearer)
        : null;

    const filterQuery = orderId
        ? `orders?id=eq.${encodeURIComponent(orderId)}&select=*&limit=1`
        : `orders?order_ref=eq.${encodeURIComponent(orderRef)}&select=*&limit=1`;

    const orderRes = await supabaseServiceRest(supaService, filterQuery, { method: "GET" });
    const order = orderRes.ok && Array.isArray(orderRes.data) && orderRes.data.length > 0
        ? orderRes.data[0]
        : null;

    let autorizado = false;
    if (order) {
        if (userObj && order.user_id && userObj.id === order.user_id) {
            autorizado = true;
        } else if (
            orderToken.length >= 20 &&
            email &&
            !validarCamposComunesLicense({ email })
        ) {
            const suppliedHash = hexABytes(await calcularSha256Hex(orderToken));
            const storedHash = hexABytes(String(order.order_token_hash || ""));
            const suppliedEmailHash = hexABytes(await calcularSha256Hex(email));
            const storedEmailHash = hexABytes(String(order.email || "").trim().toLowerCase());
            if (
                suppliedHash &&
                storedHash &&
                suppliedEmailHash &&
                storedEmailHash &&
                constanteTiempoIgualdad(suppliedHash, storedHash) &&
                constanteTiempoIgualdad(suppliedEmailHash, storedEmailHash)
            ) {
                autorizado = true;
            }
        }
    }

    if (!autorizado || !order) {
        await esperarPisoTiempo(inicioMs, 20);
        return jsonSegura({ ok: false, error: "UNAUTHORIZED_OR_ORDER_UNCONFIRMED" }, 401);
    }

    if (order.status !== "verificado") {
        return jsonSegura({ ok: false, error: "ORDER_NOT_VERIFIED", status: order.status }, 403);
    }

    const licRes = await supabaseServiceRest(
        supaService,
        `licenses?order_id=eq.${encodeURIComponent(order.id)}&select=*&limit=1`,
        { method: "GET" },
    );
    if (!licRes.ok || !Array.isArray(licRes.data) || licRes.data.length === 0) {
        return jsonSegura({ ok: false, error: "LICENSE_NOT_FOUND" }, 404);
    }
    const license = licRes.data[0];

    let storagePath = String(license.lic_storage_path || "").trim();
    let licContent = null;

    if (storagePath) {
        const dl = await downloadStorageObject(supaService, LICENSES_BUCKET, storagePath);
        if (dl.ok && dl.data) {
            licContent = dl.data;
        }
    }

    // Si aún no está en Storage, regenerar y subir
    if (!licContent) {
        const envelope = await signLicenseV2(env, order, license);
        licContent = JSON.stringify(envelope, null, 2);
        storagePath = storagePath || `${order.user_id || "guest"}/${license.license_key}.lic`;
        const up = await uploadStorageObject(supaService, LICENSES_BUCKET, storagePath, licContent, "application/json");
        if (up.ok && !license.lic_storage_path) {
            await supabaseServiceRest(
                supaService,
                `licenses?id=eq.${encodeURIComponent(license.id)}`,
                { method: "PATCH", body: { lic_storage_path: storagePath } },
            );
        }
    }

    const safeRuc = String(order.ruc_cedula || license.ruc_cedula || "RUC").replace(/[^A-Za-z0-9_-]/g, "");
    return new Response(licContent, {
        status: 200,
        headers: {
            ...SECURITY_HEADERS,
            "Content-Type": "application/octet-stream",
            "Content-Disposition": `attachment; filename="QuoraTec_ERP_${safeRuc}.lic"`,
            "Cache-Control": "no-store, no-cache, must-revalidate",
        },
    });
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const body = await leerJsonEstricto(request, 4096);
    if (!body.ok) {
        return jsonSegura({ ok: false, error: body.error }, body.status);
    }
    const esquema = validarEsquemaPermitido(body.data, CAMPOS_PERMITIDOS, []);
    if (!esquema.ok) {
        return jsonSegura({ ok: false, error: esquema.error }, esquema.status);
    }
    return handleDownload(request, env, body.data);
}

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const params = {
        order_ref: url.searchParams.get("order_ref") || "",
        order_id: url.searchParams.get("order_id") || "",
        order_token: url.searchParams.get("order_token") || "",
        email: url.searchParams.get("email") || "",
    };
    return handleDownload(request, env, params);
}
