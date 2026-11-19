/**
 * Endpoint Reglas Tributarias SRI Ecuador: GET /api/reglas_sri.json
 * Consumido por el Auto-Updater de QuoraTec ERP v3.0.0 de escritorio.
 */
import { jsonSegura } from "../_shared/security.js";
import { getServiceSupabaseConfig, supabaseServiceRest } from "../_lib/license_issuer.js";

const DEFAULT_REGLAS_SRI = Object.freeze({
    schema_version: "2026.11.1",
    app_min_version: "3.0.0",
    updated_at: "2026-11-19T00:00:00Z",
    iva_tarifas_vigentes: [0, 5, 8, 15],
    iva_general_pct: 15,
    iva_construccion_pct: 5,
    iva_turismo_pct: 8,
    rimpe_topes_usd: {
        negocio_popular_max: 20000,
        emprendedor_max: 300000,
    },
    ats_xsd_version: "2026.1",
    auditor_fantasma_efos_activo: true,
    sri_endpoints: {
        recepcion_produccion: "https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl",
        autorizacion_produccion: "https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl",
        recepcion_pruebas: "https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl",
        autorizacion_pruebas: "https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl",
    },
});

export async function onRequestGet(context) {
    const { env } = context;
    const supa = getServiceSupabaseConfig(env);

    if (supa.configured) {
        const res = await supabaseServiceRest(
            supa,
            "app_config_releases?config_key=eq.reglas_sri&order=published_at.desc&limit=1&select=version,payload_json,sha256,published_at",
            { method: "GET" },
        );
        if (res.ok && Array.isArray(res.data) && res.data.length > 0 && res.data[0]?.payload_json) {
            return jsonSegura({
                ok: true,
                source: "supabase",
                version: res.data[0].version,
                sha256: res.data[0].sha256,
                published_at: res.data[0].published_at,
                ...res.data[0].payload_json,
            }, 200);
        }
    }

    return jsonSegura({ ok: true, source: "default", ...DEFAULT_REGLAS_SRI }, 200);
}

export async function onRequest(context) {
    if (String(context?.request?.method || "").toUpperCase() === "GET") {
        return onRequestGet(context);
    }
    return jsonSegura({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
}
