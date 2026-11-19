/**
 * Triaje de Tickets de Soporte (Staff aal2).
 * POST /api/team/tickets
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

const CAMPOS_PERMITIDOS = ["ticket_id", "status"];
const CAMPOS_PROHIBIDOS = ["assigned_to", "user_id", "role"];
const VALID_STATUSES = new Set(["open", "in_progress", "escalated", "resolved", "closed"]);
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

        const auth = await exigirStaffAutenticado(request, env, { requireAal2: true });
        if (!auth.ok) return auth.response;

        const ticketId = String(body.data.ticket_id || "").trim();
        const nextStatus = String(body.data.status || "").trim();
        if (!UUID_REGEX.test(ticketId) || !VALID_STATUSES.has(nextStatus)) {
            return jsonSegura({ ok: false, error: "INVALID_TICKET_OR_STATUS" }, 400);
        }

        const { supaCfg, staff, user } = auth;
        const updRes = await supabaseRestRequest(
            supaCfg,
            `support_tickets?id=eq.${encodeURIComponent(ticketId)}`,
            {
                method: "PATCH",
                serviceRole: true,
                extraHeaders: { Prefer: "return=representation" },
                body: {
                    status: nextStatus,
                    assigned_to: user.id,
                    updated_at: new Date().toISOString(),
                },
            },
        );
        if (!updRes.ok || !Array.isArray(updRes.data) || updRes.data.length === 0) {
            return jsonSegura({ ok: false, error: "TICKET_NOT_FOUND_OR_UPDATE_FAILED" }, 404);
        }

        await registrarAuditLog(supaCfg, request, staff, {
            action: "SUPPORT_TICKET_STATUS_UPDATED",
            targetTable: "support_tickets",
            targetId: ticketId,
            environment: "production",
            metadata: { new_status: nextStatus },
        });

        return jsonSegura({ ok: true, ticket: updRes.data[0] }, 200);
    } finally {
        await esperarPisoTiempo(inicioMs, 20);
    }
}

export async function onRequest() {
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
