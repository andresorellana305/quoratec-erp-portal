/**
 * Emisor Criptográfico Remoto de Licencias (.lic) en Servidor Edge (Zero llaves privadas en frontend).
 * POST /api/team/issue-license
 * - mode: 'annual' (SOLO role === 'founder', usa MASTER_ED25519_PRIVATE_KEY)
 * - mode: 'demo'   (support_agent y founder, 15 días, max 1 RUC, max 1 PC, límite 3/día por agente, usa DEMO_ED25519_PRIVATE_KEY)
 * QuoraTec ERP v3.0.0 — Edición 2026 (QuoraTec).
 */

import {
    CATALOGO_OFICIAL_V240,
    esperarPisoTiempo,
    generarTokenCriptografico,
    jsonSegura,
    leerJsonEstricto,
    supabaseRestRequest,
    validarCamposComunesLicense,
    validarEsquemaPermitido,
} from "../../_shared/security.js";
import { signLicenseV2 } from "../../_lib/license_signer.js";
import { uploadStorageObject } from "../../_lib/license_issuer.js";
import {
    contarDemosHoyAgente,
    exigirStaffAutenticado,
    registrarAuditLog,
} from "./_staff_guard.js";

const CAMPOS_PERMITIDOS = [
    "mode",
    "plan_name",
    "holder_name",
    "holder_ruc",
    "hwid_inicial",
    "environment",
    "max_rucs",
    "max_seats",
    "cloud_gb",
    "storage_modes",
    "is_founder",
];

const CAMPOS_PROHIBIDOS = [
    "price",
    "precio",
    "signature",
    "private_key",
    "ttl_days",
    "issued_by",
    "service_role",
    "role",
];

const DEMO_LIMIT_PER_DAY = 3;
const HOLDER_NAME_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9 .,&()\/-]{2,120}$/;
const ALLOWED_STORAGE_MODES = new Set(["local", "hybrid", "cloud", "cloud_dedicated"]);
const SIGNER_COMPAT_PLAN = Object.freeze({
    EMPRENDEDOR: "EMPRENDEDOR",
    COMERCIAL_PRO: "COMERCIAL_PRO",
    CONTADOR: "CONTADOR",
    ESTUDIO_CONTABLE: "ESTUDIO_CONTABLE",
    ENTERPRISE: "ENTERPRISE",
});

function parseStorageModes(rawModes, fallback = ["local"]) {
    const tokens = String(rawModes || "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter((s) => ALLOWED_STORAGE_MODES.has(s));
    return tokens.length > 0 ? Array.from(new Set(tokens)) : fallback;
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const inicioMs = Date.now();

    try {
        const body = await leerJsonEstricto(request, 8192);
        if (!body.ok) {
            return jsonSegura({ ok: false, error: body.error }, body.status);
        }

        const esquema = validarEsquemaPermitido(body.data, CAMPOS_PERMITIDOS, CAMPOS_PROHIBIDOS);
        if (!esquema.ok) {
            return jsonSegura({ ok: false, error: esquema.error }, esquema.status);
        }

        const mode = String(body.data.mode || "").trim().toLowerCase();
        if (!["annual", "demo"].includes(mode)) {
            return jsonSegura({ ok: false, error: "INVALID_EMISSION_MODE" }, 400);
        }

        const auth = await exigirStaffAutenticado(request, env, {
            requireAal2: true,
            allowedRoles: mode === "annual" ? ["founder"] : ["founder", "support_agent"],
        });
        if (!auth.ok) return auth.response;

        const { supaCfg, staff, user } = auth;
        const holderName = String(body.data.holder_name || "").trim();
        const holderRuc = String(body.data.holder_ruc || "").trim();
        const hwidInicial = String(body.data.hwid_inicial || "").trim().toUpperCase();

        if (!HOLDER_NAME_REGEX.test(holderName)) {
            return jsonSegura({ ok: false, error: "INVALID_HOLDER_NAME" }, 400);
        }

        const fieldErr = validarCamposComunesLicense({
            ruc: holderRuc,
            hwid: hwidInicial || undefined,
        });
        if (fieldErr) {
            return jsonSegura({ ok: false, error: fieldErr }, 400);
        }

        const now = new Date();
        let licenseRecord;
        let signerPayloadInput;
        let privateKeyPem;
        let quotaInfo = null;

        if (mode === "demo") {
            if (!hwidInicial) {
                return jsonSegura(
                    { ok: false, error: "DEMO_HWID_REQUIRED", message: "La Demo 15 días requiere Hardware Fingerprint (HWID) del equipo." },
                    400,
                );
            }

            // Control diario estricto por agente (máximo 3 demos/día en hora de Ecuador)
            const quota = await contarDemosHoyAgente(supaCfg, user.id);
            if (!quota.ok) {
                return jsonSegura({ ok: false, error: "DEMO_QUOTA_CHECK_FAILED" }, 503);
            }
            if (staff.role === "support_agent" && quota.count >= DEMO_LIMIT_PER_DAY) {
                return jsonSegura(
                    {
                        ok: false,
                        error: "DEMO_DAILY_QUOTA_EXCEEDED",
                        message: "Tope diario alcanzado: máximo 3 demos de 15 días por agente al día.",
                        quota: { used_today: quota.count, limit_per_day: DEMO_LIMIT_PER_DAY, remaining_today: 0 },
                    },
                    429,
                );
            }

            privateKeyPem = String(env?.DEMO_ED25519_PRIVATE_KEY || "").trim();
            if (!privateKeyPem) {
                return jsonSegura(
                    { ok: false, error: "DEMO_SIGNING_KEY_NOT_CONFIGURED", message: "Configura DEMO_ED25519_PRIVATE_KEY en Cloudflare Pages." },
                    503,
                );
            }

            const licId = generarTokenCriptografico("QTDEMO", 8);
            const orgToken = generarTokenCriptografico("ORG-DEMO", 6);
            const expiresAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 15)).toISOString();

            // Reglas inmutables Demo 15 días: 15 días, máximo 1 RUC, máximo 1 PC
            licenseRecord = {
                issued_by: user.id,
                license_id: licId,
                license_key: licId,
                org_token: orgToken,
                holder_name: holderName,
                holder_ruc: holderRuc,
                ruc_cedula: holderRuc,
                plan_name: "DEMO_15_DIAS",
                plan_id: "COMERCIAL_PRO",
                max_rucs: 1,
                max_seats: 1,
                estaciones_autorizadas: 1,
                cloud_gb: 0,
                storage_modes: ["local"],
                is_founder: false,
                environment: "demo",
                hwid_inicial: hwidInicial,
                issued_at: now.toISOString(),
                expires_at: expiresAt,
                status: "active",
                active_status: "activa",
            };

            signerPayloadInput = {
                license_key: licId,
                plan: "COMERCIAL_PRO",
                org_token: orgToken,
                razon_social: holderName,
                ruc_cedula: holderRuc,
                hwid_inicial: hwidInicial,
                max_rucs: 1,
                max_seats: 1,
                extra_seats: 0,
                cloud_gb: 0,
                storage_modes: ["local"],
                is_founder: false,
                environment: "demo",
                ttl_days: 15,
            };

            quotaInfo = {
                used_today: quota.count + 1,
                limit_per_day: DEMO_LIMIT_PER_DAY,
                remaining_today: Math.max(0, DEMO_LIMIT_PER_DAY - (quota.count + 1)),
            };
        } else {
            // Emisión Anual de Producción / QA — Exclusivo Founder + MASTER_ED25519_PRIVATE_KEY
            const planName = String(body.data.plan_name || "").trim().toUpperCase();
            if (!Object.prototype.hasOwnProperty.call(CATALOGO_OFICIAL_V240.planes, planName)) {
                return jsonSegura({ ok: false, error: "INVALID_PLAN_NAME" }, 400);
            }
            const planMeta = CATALOGO_OFICIAL_V240.planes[planName];
            const reqEnv = String(body.data.environment || "production").trim().toLowerCase();
            if (!["production", "qa_test"].includes(reqEnv)) {
                return jsonSegura({ ok: false, error: "INVALID_ANNUAL_ENVIRONMENT" }, 400);
            }

            if (["EMPRENDEDOR", "COMERCIAL_PRO", "CONTADOR"].includes(planName) && !hwidInicial) {
                return jsonSegura(
                    { ok: false, error: "HWID_REQUIRED_FOR_1PC_PLAN", message: `El plan ${planName} requiere HWID inicial del equipo.` },
                    400,
                );
            }

            privateKeyPem = String(env?.MASTER_ED25519_PRIVATE_KEY || "").trim();
            if (!privateKeyPem) {
                return jsonSegura(
                    { ok: false, error: "MASTER_SIGNING_KEY_NOT_CONFIGURED", message: "Configura MASTER_ED25519_PRIVATE_KEY en Cloudflare Pages." },
                    503,
                );
            }

            const maxRucs = Number.parseInt(String(body.data.max_rucs ?? planMeta.rucsMax), 10);
            const maxSeats = Number.parseInt(String(body.data.max_seats ?? planMeta.estacionesBase), 10);
            const cloudGb = Number.parseInt(String(body.data.cloud_gb ?? planMeta.nubeGbBase), 10);
            if (
                !Number.isInteger(maxRucs) || maxRucs < 1 || maxRucs > 1000 ||
                !Number.isInteger(maxSeats) || maxSeats < 1 || maxSeats > 500 ||
                !Number.isInteger(cloudGb) || cloudGb < 0 || cloudGb > 5000
            ) {
                return jsonSegura({ ok: false, error: "INVALID_CAPACITY_LIMITS" }, 400);
            }

            const storageModes = parseStorageModes(
                body.data.storage_modes,
                cloudGb > 0 ? ["local", "hybrid"] : ["local"],
            );
            const isFounderFlag = Boolean(body.data.is_founder);

            const licId = generarTokenCriptografico("QTLIC", 8);
            const orgToken = generarTokenCriptografico("ORG", 8);
            const expiresAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 365)).toISOString();

            licenseRecord = {
                issued_by: user.id,
                license_id: licId,
                license_key: licId,
                org_token: orgToken,
                holder_name: holderName,
                holder_ruc: holderRuc,
                ruc_cedula: holderRuc,
                plan_name: planName,
                plan_id: planName,
                max_rucs: maxRucs,
                max_seats: maxSeats,
                estaciones_autorizadas: maxSeats,
                cloud_gb: cloudGb,
                storage_modes: storageModes,
                is_founder: isFounderFlag,
                environment: reqEnv,
                hwid_inicial: hwidInicial || null,
                issued_at: now.toISOString(),
                expires_at: expiresAt,
                status: "active",
                active_status: "activa",
            };

            signerPayloadInput = {
                license_key: licId,
                plan: SIGNER_COMPAT_PLAN[planName],
                org_token: orgToken,
                razon_social: holderName,
                ruc_cedula: holderRuc,
                hwid_inicial: hwidInicial,
                max_rucs: maxRucs,
                max_seats: maxSeats,
                extra_seats: Math.max(0, maxSeats - planMeta.estacionesBase),
                cloud_gb: cloudGb,
                storage_modes: storageModes,
                is_founder: isFounderFlag,
                environment: reqEnv,
                ttl_days: 365,
            };
        }

        const envelope = await signLicenseV2(signerPayloadInput, env, {
            issuedAt: now,
            ttlDays: signerPayloadInput.ttl_days,
            privateKeyPem,
        });
        const licJson = JSON.stringify(envelope, null, 2);

        const storagePath = `team-issued/${staff.role}/${licenseRecord.license_id}.lic`;
        const upRes = await uploadStorageObject(
            { url: supaCfg.url, serviceRoleKey: supaCfg.serviceRoleKey },
            "licenses",
            storagePath,
            licJson,
            "application/json",
        );
        if (upRes.ok) {
            licenseRecord.lic_storage_path = storagePath;
        }

        const insRes = await supabaseRestRequest(supaCfg, "licenses", {
            method: "POST",
            serviceRole: true,
            extraHeaders: { Prefer: "return=representation" },
            body: licenseRecord,
        });
        if (!insRes.ok) {
            return jsonSegura({ ok: false, error: "LICENSE_DB_INSERT_FAILED" }, 500);
        }

        await registrarAuditLog(supaCfg, request, staff, {
            action: mode === "demo" ? "ISSUE_DEMO_15D" : "ISSUE_ANNUAL_LICENSE",
            targetTable: "licenses",
            targetId: licenseRecord.license_id,
            environment: licenseRecord.environment,
            metadata: {
                holder_ruc: holderRuc,
                plan_name: licenseRecord.plan_name,
                max_rucs: licenseRecord.max_rucs,
                max_seats: licenseRecord.max_seats,
                is_founder: licenseRecord.is_founder,
            },
        });

        return jsonSegura(
            {
                ok: true,
                mode,
                quota: quotaInfo,
                license: licenseRecord,
                lic_filename: `QuoraTec_${holderRuc}_${licenseRecord.license_id}.lic`,
                lic_envelope: envelope,
            },
            201,
        );
    } finally {
        await esperarPisoTiempo(inicioMs, 20);
    }
}

export async function onRequest() {
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
