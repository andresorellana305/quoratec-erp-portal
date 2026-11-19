/**
 * Generación de URL Firmada Temporal (60 segundos) para Descarga de Diagnóstico .zip
 * desde el bucket privado `diagnostics`.
 * POST /api/team/diagnostic-url
 * QuoraTec ERP v3.0.0 — Edición 2026 (QuoraTec).
 */

import {
    esperarPisoTiempo,
    jsonSegura,
    leerJsonEstricto,
    supabaseRestRequest,
    validarEsquemaPermitido,
} from "../../_shared/security.js";
import { exigirStaffAutenticado, registrarAuditLog } from "./_staff_guard.js";

const CAMPOS_PERMITIDOS = ["ticket_id"];
const CAMPOS_PROHIBIDOS = ["path", "bucket", "expires_in", "service_role"];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SIGNED_URL_TTL_SECONDS = 60;

function sanitizeDiagnosticZipPath(rawPath) {
    const clean = String(rawPath || "").trim().replace(/^\/+/, "");
    if (!clean || clean.includes("..") || clean.includes("\\") || clean.includes("\0") || /https?:\/\//i.test(clean)) {
        return null;
    }
    const normalized = clean.startsWith("diagnostics/") ? clean.slice("diagnostics/".length) : clean;
    if (!normalized.toLowerCase().endsWith(".zip") || normalized.length > 220) {
        return null;
    }
    return normalized
        .split("/")
        .filter(Boolean)
        .map((seg) => encodeURIComponent(seg))
        .join("/");
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const inicioMs = Date.now();

    try {
        const body = await leerJsonEstricto(request, 2048);
        if (!body.ok) {
            return jsonSegura({ ok: false, error: body.error }, body.status);
        }

        const esquema = validarEsquemaPermitido(body.data, CAMPOS_PERMITIDOS, CAMPOS_PROHIBIDOS);
        if (!esquema.ok) {
            return jsonSegura({ ok: false, error: esquema.error }, esquema.status);
        }

        const auth = await exigirStaffAutenticado(request, env, { requireAal2: true, allowedRoles: ["founder", "support_agent"] });
        if (!auth.ok) return auth.response;

        const ticketId = String(body.data.ticket_id || "").trim();
        if (!UUID_REGEX.test(ticketId)) {
            return jsonSegura({ ok: false, error: "INVALID_TICKET_ID" }, 400);
        }

        const { supaCfg, staff } = auth;
        const ticketRes = await supabaseRestRequest(
            supaCfg,
            `support_tickets?id=eq.${encodeURIComponent(ticketId)}&select=id,empresa_ruc,diagnostic_zip_path&limit=1`,
            { method: "GET", serviceRole: true },
        );
        if (!ticketRes.ok || !Array.isArray(ticketRes.data) || ticketRes.data.length === 0) {
            return jsonSegura({ ok: false, error: "TICKET_NOT_FOUND" }, 404);
        }

        const ticket = ticketRes.data[0];
        const encodedObjPath = sanitizeDiagnosticZipPath(ticket.diagnostic_zip_path);
        if (!encodedObjPath) {
            return jsonSegura({ ok: false, error: "DIAGNOSTIC_ZIP_UNAVAILABLE" }, 404);
        }

        const signEndpoint = `${supaCfg.url}/storage/v1/object/sign/diagnostics/${encodedObjPath}`;
        const signResp = await fetch(signEndpoint, {
            method: "POST",
            headers: {
                apikey: supaCfg.serviceRoleKey,
                Authorization: `Bearer ${supaCfg.serviceRoleKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ expiresIn: SIGNED_URL_TTL_SECONDS }),
        });

        const signData = await signResp.json().catch(() => ({}));
        const signedRel = signData?.signedURL || signData?.signedUrl;
        if (!signResp.ok || !signedRel) {
            return jsonSegura({ ok: false, error: "DIAGNOSTIC_SIGNING_FAILED" }, 502);
        }

        const fullSignedUrl = `${supaCfg.url}/storage/v1${signedRel.startsWith("/") ? "" : "/"}${signedRel}`;
        const filename = String(ticket.diagnostic_zip_path).split("/").pop() || "diagnostico.zip";

        await registrarAuditLog(supaCfg, request, staff, {
            action: "DIAGNOSTIC_ZIP_SIGNED_60S",
            targetTable: "support_tickets",
            targetId: ticket.id,
            environment: "production",
            metadata: { empresa_ruc: ticket.empresa_ruc, expires_in: SIGNED_URL_TTL_SECONDS },
        });

        return jsonSegura(
            {
                ok: true,
                ticket_id: ticket.id,
                expires_in: SIGNED_URL_TTL_SECONDS,
                filename,
                signed_url: fullSignedUrl,
            },
            200,
        );
    } finally {
        await esperarPisoTiempo(inicioMs, 20);
    }
}

export async function onRequest() {
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
