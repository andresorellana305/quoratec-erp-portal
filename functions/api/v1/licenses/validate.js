/**
 * Espejo /api/v1/licenses/validate para QuoraTec ERP de escritorio.
 * POST /api/v1/licenses/validate — Validación online de licencia + HWID + plan.
 */
import {
    CATALOGO_OFICIAL_V240,
    calcularHmacSha256Hex,
    constanteTiempoIgualdad,
    hexABytes,
    jsonSegura,
    leerJsonEstricto,
    validarCamposComunesLicense,
    validarEsquemaPermitido,
} from "../../../_shared/security.js";
import { getServiceSupabaseConfig, supabaseServiceRest } from "../../../_lib/license_issuer.js";

const CAMPOS_PERMITIDOS = ["license_key", "hwid", "ruc", "plan_id", "estaciones_autorizadas"];

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

    const { license_key: licenseKey, hwid, ruc, plan_id: planId = "CONTADOR", estaciones_autorizadas: estAut = 1 } = body.data;
    const errCampos = validarCamposComunesLicense({ hwid, ruc, licenseKey });
    if (errCampos || !hwid || !ruc || !licenseKey) {
        return jsonSegura({ ok: false, valid: false, error: "INVALID_LICENSE_PARAMS" }, 400);
    }

    // 1. Si Supabase está configurado, validar estado real en tabla licenses
    const supa = getServiceSupabaseConfig(env);
    if (supa.configured) {
        const licRes = await supabaseServiceRest(
            supa,
            `licenses?license_key=eq.${encodeURIComponent(String(licenseKey).trim())}&holder_ruc=eq.${encodeURIComponent(String(ruc).trim())}&select=license_key,org_token,plan_name,max_rucs,max_seats,cloud_gb,hwid_inicial,status,expires_at&limit=1`,
            { method: "GET" },
        );
        if (licRes.ok && Array.isArray(licRes.data) && licRes.data.length > 0) {
            const lic = licRes.data[0];
            const notExpired = !lic.expires_at || new Date(lic.expires_at).getTime() > Date.now();
            const hwidOk = !lic.hwid_inicial || Number(lic.max_seats || 1) > 1 || lic.hwid_inicial === hwid;
            if (lic.status === "active" && notExpired && hwidOk) {
                return jsonSegura({
                    ok: true,
                    valid: true,
                    version: "3.0.0",
                    plan_id: lic.plan_name,
                    org_token: lic.org_token,
                    max_rucs: lic.max_rucs,
                    max_seats: lic.max_seats,
                    cloud_gb: lic.cloud_gb,
                    expires_at: lic.expires_at,
                }, 200);
            }
            return jsonSegura({
                ok: false,
                valid: false,
                error: !hwidOk ? "HWID_MISMATCH" : "LICENSE_INACTIVE_OR_EXPIRED",
            }, 401);
        }
    }

    // 2. Fallback HMAC offline-compatible (idéntico a /api/license/verify)
    if (typeof env?.LICENSE_HMAC_SECRET !== "string" || env.LICENSE_HMAC_SECRET.length < 32) {
        return jsonSegura({ ok: false, valid: false, error: "VERIFICATION_UNCONFIRMED" }, 401);
    }
    const planMeta = Object.prototype.hasOwnProperty.call(CATALOGO_OFICIAL_V240.planes, planId)
        ? CATALOGO_OFICIAL_V240.planes[planId]
        : null;
    const estNum = Number(estAut);
    const partes = String(licenseKey).split("-");
    if (!planMeta || !Number.isInteger(estNum) || estNum < 1 || partes.length !== 3) {
        return jsonSegura({ ok: false, valid: false, error: "VERIFICATION_UNCONFIRMED" }, 401);
    }
    const [, tokenPrefix, suppliedTagHex] = partes;
    const expectedFullHex = await calcularHmacSha256Hex(
        env.LICENSE_HMAC_SECRET,
        `${hwid}:${ruc}:${tokenPrefix}:${planMeta.id}:${estNum}`,
    );
    const expectedTagHex = expectedFullHex.slice(0, 32).toUpperCase();
    if (!hexABytes(expectedFullHex) || !constanteTiempoIgualdad(new TextEncoder().encode(suppliedTagHex), new TextEncoder().encode(expectedTagHex))) {
        return jsonSegura({ ok: false, valid: false, error: "VERIFICATION_UNCONFIRMED" }, 401);
    }

    return jsonSegura({
        ok: true,
        valid: true,
        version: "3.0.0",
        plan_id: planMeta.id,
        estaciones_autorizadas: estNum,
    }, 200);
}

export async function onRequest(context) {
    if (String(context?.request?.method || "").toUpperCase() === "POST") {
        return onRequestPost(context);
    }
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
