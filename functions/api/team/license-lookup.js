/**
 * Consulta de Licencia por RUC/Cédula (Solo Lectura — Staff aal2).
 * POST /api/team/license-lookup
 * QuoraTec ERP v3.0.0 — Edición 2026 (QuoraTec).
 */

import {
    esperarPisoTiempo,
    jsonSegura,
    leerJsonEstricto,
    supabaseRestRequest,
    validarCamposComunesLicense,
    validarEsquemaPermitido,
} from "../../_shared/security.js";
import { exigirStaffAutenticado, registrarAuditLog } from "./_staff_guard.js";

const CAMPOS_PERMITIDOS = ["holder_ruc"];
const CAMPOS_PROHIBIDOS = ["pin_hash", "service_role", "private_key"];

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

        const ruc = String(body.data.holder_ruc || "").trim();
        if (!ruc || validarCamposComunesLicense({ ruc })) {
            return jsonSegura({ ok: false, error: "INVALID_RUC_CEDULA" }, 400);
        }

        const { supaCfg, staff } = auth;
        const licRes = await supabaseRestRequest(
            supaCfg,
            `licenses?or=(holder_ruc.eq.${encodeURIComponent(ruc)},ruc_cedula.eq.${encodeURIComponent(ruc)})&order=issued_at.desc&limit=10&select=license_id,org_token,holder_name,holder_ruc,plan_name,max_rucs,max_seats,cloud_gb,storage_modes,is_founder,environment,issued_at,expires_at,status`,
            { method: "GET", serviceRole: true },
        );

        const rows = Array.isArray(licRes.data) ? licRes.data : [];
        let activeSeatsCount = 0;
        if (rows.length > 0 && rows[0].org_token) {
            const seatRes = await supabaseRestRequest(
                supaCfg,
                `registered_seats?org_token=eq.${encodeURIComponent(rows[0].org_token)}&is_active=eq.true&select=id,pc_name,last_seen_at`,
                { method: "GET", serviceRole: true },
            );
            activeSeatsCount = Array.isArray(seatRes.data) ? seatRes.data.length : 0;
        }

        await registrarAuditLog(supaCfg, request, staff, {
            action: "LICENSE_RUC_LOOKUP_READONLY",
            targetTable: "licenses",
            targetId: ruc,
            environment: "production",
            metadata: { results_found: rows.length },
        });

        return jsonSegura(
            {
                ok: true,
                read_only: true,
                holder_ruc: ruc,
                active_seats_count: activeSeatsCount,
                licenses: rows,
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
