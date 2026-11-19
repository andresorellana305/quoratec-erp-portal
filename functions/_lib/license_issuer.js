/**
 * Servicio central de emisión automática de licencias .lic, almacenamiento en Supabase Storage
 * y entrega por correo electrónico vía Resend — QuoraTec ERP (QuoraTec).
 */

import {
    calcularSha256Hex,
    constanteTiempoIgualdad,
    hexABytes,
} from "../_shared/security.js";
import { signLicenseV2 } from "./license_signer.js";

const DEFAULT_RESEND_FROM = "soporte@quoratec.com";
const LICENSES_BUCKET = "licenses";

function escapeHtml(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function encodeStoragePath(objectPath) {
    return String(objectPath || "")
        .split("/")
        .filter(Boolean)
        .map((seg) => encodeURIComponent(seg))
        .join("/");
}

function toBase64Utf8(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
}

export function getServiceSupabaseConfig(env = {}) {
    const rawUrl = String(env?.SUPABASE_URL || "").trim().replace(/\/+$/, "");
    const serviceRoleKey = String(env?.SUPABASE_SERVICE_ROLE_KEY || "").trim();
    const anonKey = String(env?.SUPABASE_ANON_KEY || "").trim() || serviceRoleKey;
    if (!rawUrl || !serviceRoleKey) {
        return { configured: false, url: null, serviceRoleKey: "", anonKey: "" };
    }
    try {
        const parsed = new URL(rawUrl);
        if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
            return { configured: false, url: null, serviceRoleKey: "", anonKey: "" };
        }
        return { configured: true, url: parsed.origin, serviceRoleKey, anonKey };
    } catch {
        return { configured: false, url: null, serviceRoleKey: "", anonKey: "" };
    }
}

export async function verifyAdminSecret(request, env = {}) {
    const expected = String(env?.ADMIN_APPROVE_SECRET || "");
    const provided = String(request.headers.get("x-admin-secret") || "");
    if (!expected || expected.length < 16 || !provided) {
        return false;
    }
    const expectedHash = hexABytes(await calcularSha256Hex(expected));
    const providedHash = hexABytes(await calcularSha256Hex(provided));
    if (!expectedHash || !providedHash) {
        return false;
    }
    return constanteTiempoIgualdad(providedHash, expectedHash);
}

export async function supabaseServiceRest(supa, path, { method = "GET", body, extraHeaders = {} } = {}) {
    const resp = await fetch(`${supa.url}/rest/v1/${path}`, {
        method,
        headers: {
            apikey: supa.serviceRoleKey,
            Authorization: `Bearer ${supa.serviceRoleKey}`,
            "Content-Type": "application/json",
            ...extraHeaders,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await resp.text();
    let parsed = null;
    try {
        parsed = text ? JSON.parse(text) : null;
    } catch {
        parsed = { raw: text };
    }
    return { ok: resp.ok, status: resp.status, data: parsed };
}

export async function uploadStorageObject(supa, bucket, objectPath, content, contentType = "application/json") {
    const encodedPath = encodeStoragePath(objectPath);
    const resp = await fetch(`${supa.url}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`, {
        method: "POST",
        headers: {
            apikey: supa.serviceRoleKey,
            Authorization: `Bearer ${supa.serviceRoleKey}`,
            "Content-Type": contentType,
            "x-upsert": "true",
        },
        body: content,
    });
    if (!resp.ok) {
        const errText = await resp.text().catch(() => "");
        return { ok: false, status: resp.status, error: errText || `STORAGE_UPLOAD_HTTP_${resp.status}` };
    }
    return { ok: true, status: resp.status, path: objectPath };
}

export async function downloadStorageObject(supa, bucket, objectPath) {
    const encodedPath = encodeStoragePath(objectPath);
    const resp = await fetch(`${supa.url}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`, {
        method: "GET",
        headers: {
            apikey: supa.serviceRoleKey,
            Authorization: `Bearer ${supa.serviceRoleKey}`,
        },
    });
    if (!resp.ok) {
        return { ok: false, status: resp.status, data: null };
    }
    const text = await resp.text();
    return { ok: true, status: resp.status, data: text };
}

export async function createSignedStorageUrl(supa, bucket, objectPath, expiresInSec = 900) {
    const encodedPath = encodeStoragePath(objectPath);
    const resp = await fetch(`${supa.url}/storage/v1/object/sign/${encodeURIComponent(bucket)}/${encodedPath}`, {
        method: "POST",
        headers: {
            apikey: supa.serviceRoleKey,
            Authorization: `Bearer ${supa.serviceRoleKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ expiresIn: expiresInSec }),
    });
    if (!resp.ok) {
        return null;
    }
    const data = await resp.json().catch(() => null);
    const signed = data?.signedURL || data?.signedUrl;
    if (!signed || typeof signed !== "string") {
        return null;
    }
    if (signed.startsWith("http://") || signed.startsWith("https://")) {
        return signed;
    }
    if (signed.startsWith("/storage/v1")) {
        return `${supa.url}${signed}`;
    }
    return `${supa.url}/storage/v1${signed.startsWith("/") ? "" : "/"}${signed}`;
}

function buildLicenseEmailHtml(order, license) {
    const plan = escapeHtml(order.plan_id || license.plan_id);
    const ruc = escapeHtml(order.ruc_cedula || license.ruc_cedula);
    const razon = escapeHtml(order.razon_social || "Cliente QuoraTec");
    const licKey = escapeHtml(license.license_key);
    const expiresAt = escapeHtml(String(license.expires_at || "").slice(0, 10));

    return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>Licencia QuoraTec ERP</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;background:#f9fafb;padding:24px;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:28px;">
    <h2 style="margin-top:0;color:#0f172a;">¡Tu Licencia Oficial de QuoraTec ERP está lista!</h2>
    <p>Estimado/a <strong>${razon}</strong>,</p>
    <p>Confirmamos la verificación de tu pago. Adjunto encontrarás tu archivo de licencia criptográfica (<code>.lic</code>).</p>
    <table style="width:100%;border-collapse:collapse;margin:18px 0;font-size:14px;">
      <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Plan</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;"><strong>${plan}</strong></td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280;">RUC / Cédula</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;"><strong>${ruc}</strong></td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Clave de Licencia</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;"><code>${licKey}</code></td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Vigencia hasta</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;"><strong>${expiresAt}</strong></td></tr>
    </table>
    <h3 style="color:#0f172a;margin-bottom:8px;">Instrucciones de activación</h3>
    <ol style="padding-left:20px;line-height:1.6;">
      <li>Descarga el archivo <code>.lic</code> adjunto a este correo.</li>
      <li>Abre <strong>QuoraTec ERP</strong> en tu computador autorizado.</li>
      <li>Ve a <strong>Configuración &rarr; 4. Plan y Licencia &rarr; Cargar archivo .lic</strong>.</li>
      <li>Selecciona el archivo descargado para activar tu suscripción anual al instante.</li>
    </ol>
    <p style="font-size:12px;color:#6b7280;margin-top:24px;">
      Soporte QuoraTec: soporte@quoratec.com
    </p>
  </div>
</body>
</html>`;
}

async function sendLicenseEmailResend(env, order, license, licJsonContent) {
    const apiKey = String(env?.RESEND_API_KEY || "").trim();
    if (!apiKey) {
        return { sent: false, error: "RESEND_API_KEY_NOT_CONFIGURED" };
    }

    const fromEmail = String(env?.RESEND_FROM_EMAIL || DEFAULT_RESEND_FROM).trim();
    const safeRuc = String(order.ruc_cedula || license.ruc_cedula || "RUC").replace(/[^A-Za-z0-9_-]/g, "");
    const safeKey = String(license.license_key || "LIC").replace(/[^A-Za-z0-9_-]/g, "");

    const payload = {
        from: `QuoraTec ERP - QuoraTec <${fromEmail}>`,
        to: [order.email],
        subject: `Tu Licencia Oficial de QuoraTec ERP (${license.license_key})`,
        html: buildLicenseEmailHtml(order, license),
        attachments: [
            {
                filename: `QuoraTec_ERP_${safeRuc}_${safeKey}.lic`,
                content: toBase64Utf8(licJsonContent),
            },
        ],
    };

    const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        const errText = await resp.text().catch(() => "");
        return { sent: false, status: resp.status, error: errText || `RESEND_HTTP_${resp.status}` };
    }

    const resData = await resp.json().catch(() => ({}));
    return { sent: true, id: resData?.id || null };
}

/**
 * Verifica una orden, dispara la emisión automática en `public.licenses`,
 * firma el archivo `.lic` v2 (Ed25519), lo sube a Storage privado `licenses`
 * y lo envía por correo con Resend de forma idempotente.
 */
export async function verifyAndIssueLicense(env, orderId, metadata = {}) {
    const supa = getServiceSupabaseConfig(env);
    if (!supa.configured) {
        return { ok: false, status: 503, error: "SUPABASE_SERVICE_NOT_CONFIGURED" };
    }

    const cleanOrderId = String(orderId || "").trim();
    if (!cleanOrderId) {
        return { ok: false, status: 400, error: "ORDER_ID_REQUIRED" };
    }

    // a) Verificar que la orden exista en public.orders
    const orderRes = await supabaseServiceRest(
        supa,
        `orders?id=eq.${encodeURIComponent(cleanOrderId)}&select=*&limit=1`,
        { method: "GET" },
    );
    if (!orderRes.ok || !Array.isArray(orderRes.data) || orderRes.data.length === 0) {
        return { ok: false, status: 404, error: "ORDER_NOT_FOUND" };
    }
    const order = orderRes.data[0];

    // Idempotencia: si ya está verificada y ya tiene licencia con lic_storage_path
    if (order.status === "verificado") {
        const existingLicRes = await supabaseServiceRest(
            supa,
            `licenses?order_id=eq.${encodeURIComponent(order.id)}&select=*&limit=1`,
            { method: "GET" },
        );
        if (
            existingLicRes.ok &&
            Array.isArray(existingLicRes.data) &&
            existingLicRes.data.length > 0 &&
            existingLicRes.data[0].lic_storage_path
        ) {
            const existingLic = existingLicRes.data[0];
            return {
                ok: true,
                idempotent: true,
                order,
                license: existingLic,
                lic_storage_path: existingLic.lic_storage_path,
                email_sent: false,
            };
        }
    }

    // b) Actualizar orders.status = 'verificado' (dispara trg_orders_auto_issue_license)
    const nowIso = new Date().toISOString();
    const orderPatch = {
        status: "verificado",
        verified_at: order.verified_at || nowIso,
        updated_at: nowIso,
    };
    if (metadata?.voucher_ref && !order.voucher_ref) {
        orderPatch.voucher_ref = String(metadata.voucher_ref).slice(0, 64);
    }

    const updateOrderRes = await supabaseServiceRest(
        supa,
        `orders?id=eq.${encodeURIComponent(order.id)}`,
        {
            method: "PATCH",
            body: orderPatch,
            extraHeaders: { Prefer: "return=representation" },
        },
    );
    if (!updateOrderRes.ok) {
        return { ok: false, status: 500, error: "ORDER_UPDATE_FAILED", details: updateOrderRes.data };
    }
    const updatedOrder = Array.isArray(updateOrderRes.data) && updateOrderRes.data[0]
        ? updateOrderRes.data[0]
        : { ...order, ...orderPatch };

    // c) Consultar fila recién creada en public.licenses por order_id
    const licRes = await supabaseServiceRest(
        supa,
        `licenses?order_id=eq.${encodeURIComponent(order.id)}&select=*&limit=1`,
        { method: "GET" },
    );
    if (!licRes.ok || !Array.isArray(licRes.data) || licRes.data.length === 0) {
        return { ok: false, status: 500, error: "LICENSE_NOT_ISSUED_BY_TRIGGER" };
    }
    const license = licRes.data[0];

    // d) Firmar archivo .lic en formato JSON v2
    const envelope = await signLicenseV2(env, updatedOrder, license);
    const licJsonContent = JSON.stringify(envelope, null, 2);

    // e) Subir a bucket privado 'licenses' y guardar lic_storage_path
    const storagePath = `${updatedOrder.user_id || "guest"}/${license.license_key}.lic`;
    const uploadRes = await uploadStorageObject(supa, LICENSES_BUCKET, storagePath, licJsonContent, "application/json");
    if (!uploadRes.ok) {
        return { ok: false, status: 500, error: "LICENSE_STORAGE_UPLOAD_FAILED", details: uploadRes.error };
    }

    await supabaseServiceRest(
        supa,
        `licenses?id=eq.${encodeURIComponent(license.id)}`,
        {
            method: "PATCH",
            body: { lic_storage_path: storagePath },
        },
    );
    const updatedLicense = { ...license, lic_storage_path: storagePath };

    // f) Enviar correo automático vía Resend
    const emailRes = await sendLicenseEmailResend(env, updatedOrder, updatedLicense, licJsonContent);

    return {
        ok: true,
        idempotent: false,
        order: updatedOrder,
        license: updatedLicense,
        lic_storage_path: storagePath,
        email_sent: Boolean(emailRes.sent),
        email_id: emailRes.id || null,
        email_error: emailRes.sent ? null : emailRes.error,
    };
}
