/**
 * Motor de firma criptográfica Ed25519 (v2) para licencias .lic de QuoraTec ERP.
 * Usa exclusivamente WebCrypto API (`Ed25519`, formato `pkcs8`), compatible con Cloudflare Pages Functions y Node.js.
 */

const PLANES_1_PC = new Set(["EMPRENDEDOR", "COMERCIAL_PRO", "CONTADOR", "PERSONAL_PRO", "CONTADOR_MASTER"]);
const PLANES_MULTI_PC = new Set(["ESTUDIO_CONTABLE", "ENTERPRISE", "ESTUDIO_PRO", "ENTERPRISE_TEAM", "ENTERPRISE_CORP"]);
const PLANES_HWID_OBLIGATORIO = new Set(["EMPRENDEDOR", "COMERCIAL_PRO", "CONTADOR", "PERSONAL_PRO", "CONTADOR_MASTER", "ESTUDIO_PRO"]);
const PLANES_VALIDOS = new Set([...PLANES_1_PC, ...PLANES_MULTI_PC]);

const DEFAULT_SEATS_POR_PLAN = Object.freeze({
    EMPRENDEDOR: 1,
    COMERCIAL_PRO: 1,
    CONTADOR: 1,
    ESTUDIO_CONTABLE: 3,
    ENTERPRISE: 10,
    PERSONAL_PRO: 1,
    CONTADOR_MASTER: 1,
    ESTUDIO_PRO: 2,
    ENTERPRISE_TEAM: 5,
    ENTERPRISE_CORP: 10,
});

/**
 * Codifica un Uint8Array en Base64 URL-safe sin padding (`=`).
 * @param {Uint8Array} bytes
 * @returns {string}
 */
export function toBase64Url(bytes) {
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Decodifica Base64 estándar a Uint8Array.
 * @param {string} b64
 * @returns {Uint8Array}
 */
function fromBase64(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

/**
 * Limpia encabezados PEM PKCS#8, saltos de línea literales (`\\n`) y espacios,
 * e importa la clave privada Ed25519 en WebCrypto.
 * @param {string} pemString
 * @returns {Promise<CryptoKey>}
 */
export async function importEd25519PrivateKey(pemString) {
    if (!pemString || typeof pemString !== "string") {
        throw new Error("ED25519_PRIVATE_KEY_PEM no está configurada en el entorno.");
    }

    const limpio = pemString
        .replace(/\\n/g, "\n")
        .replace(/-----(?:BEGIN|END) PRIVATE KEY-----/g, "")
        .replace(/\s+/g, "");

    if (!limpio) {
        throw new Error("ED25519_PRIVATE_KEY_PEM está vacía tras limpiar encabezados PEM.");
    }

    const pkcs8Der = fromBase64(limpio);
    return crypto.subtle.importKey(
        "pkcs8",
        pkcs8Der,
        { name: "Ed25519" },
        false,
        ["sign"],
    );
}

/**
 * Formatea una fecha UTC como `YYYY-MM-DD`.
 * @param {Date} date
 * @returns {string}
 */
function formatIsoDateUtc(date) {
    return date.toISOString().slice(0, 10);
}

/**
 * Genera un `org_token` de al menos 8 caracteres para planes Multi-PC.
 * @param {string} rawOrgToken
 * @param {string} licenseKey
 * @returns {string}
 */
function resolverOrgToken(rawOrgToken, licenseKey) {
    const explicit = String(rawOrgToken || "").trim();
    if (explicit.length >= 8) {
        return explicit;
    }
    const base = `ORG-${String(licenseKey || "").trim()}`.replace(/[^A-Za-z0-9_-]/g, "");
    if (base.length >= 8) {
        return base;
    }
    const rand = new Uint8Array(6);
    crypto.getRandomValues(rand);
    const hex = Array.from(rand, (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    return `${base}${hex}`.slice(0, Math.max(8, base.length + hex.length));
}

/**
 * Firma una licencia QuoraTec ERP v2 (Ed25519) compatible con `license_manager.py`.
 * Soporta tanto `signLicenseV2(env, order, license, options)` como `signLicenseV2(license, env, options)`.
 *
 * @param {object} arg1 - `env` o `license`
 * @param {object} arg2 - `order` o `env`
 * @param {object} [arg3] - `license` o `options`
 * @param {object} [arg4] - `options`
 * @returns {Promise<{version: number, alg: string, license_id: string, payload: string, signature: string}>}
 */
export async function signLicenseV2(arg1, arg2, arg3, arg4) {
    let env;
    let license;
    let options = {};

    if (arg3 && typeof arg3 === "object" && ("license_key" in arg3 || "plan_id" in (arg2 || {}) || "ruc_cedula" in (arg2 || {}))) {
        env = arg1;
        const order = arg2 || {};
        const licRow = arg3 || {};
        options = arg4 || {};
        license = {
            ...order,
            ...licRow,
            plan: licRow.plan || licRow.plan_id || order.plan_id || order.plan,
            max_seats: licRow.max_seats ?? licRow.estaciones_autorizadas ?? order.estaciones_autorizadas,
            extra_seats: licRow.extra_seats ?? order.extra_seats ?? 0,
            razon_social: licRow.razon_social ?? order.razon_social,
            ruc_cedula: licRow.ruc_cedula ?? order.ruc_cedula,
            hwid_inicial: licRow.hwid_inicial ?? order.hwid_inicial,
            license_key: licRow.license_key,
        };
    } else {
        license = arg1;
        env = arg2;
        options = arg3 || {};
    }

    if (!license || typeof license !== "object") {
        throw new Error("El objeto license es obligatorio.");
    }

    const plan = String(license.plan || "").trim().toUpperCase();
    if (!PLANES_VALIDOS.has(plan)) {
        throw new Error(`Plan no soportado para emisión de licencia: '${plan}'.`);
    }

    const licenseKey = String(license.license_key || "").trim();
    if (!licenseKey) {
        throw new Error("license.license_key es obligatorio.");
    }

    const hwidInicial = String(license.hwid_inicial || "").trim().toUpperCase();
    if (PLANES_HWID_OBLIGATORIO.has(plan) && !hwidInicial) {
        throw new Error(`El plan ${plan} requiere hwid_inicial no vacío.`);
    }

    const ttlDaysRaw = options.ttlDays ?? license.ttl_days ?? 365;
    const ttlDays = Number.parseInt(String(ttlDaysRaw), 10);
    if (!Number.isInteger(ttlDays) || ttlDays < 1 || ttlDays > 3650) {
        throw new Error("ttl_days debe ser un entero entre 1 y 3650.");
    }

    const issuedDate = options.issuedAt instanceof Date ? new Date(options.issuedAt.getTime()) : new Date();
    const expiresDate = new Date(
        Date.UTC(issuedDate.getUTCFullYear(), issuedDate.getUTCMonth(), issuedDate.getUTCDate() + ttlDays),
    );
    const fechaEmision = formatIsoDateUtc(issuedDate);
    const fechaExpiracion = formatIsoDateUtc(expiresDate);

    const maxSeatsRaw = license.max_seats ?? DEFAULT_SEATS_POR_PLAN[plan];
    const maxSeats = Number.parseInt(String(maxSeatsRaw), 10);
    if (!Number.isInteger(maxSeats) || maxSeats < 1) {
        throw new Error("max_seats debe ser un entero positivo.");
    }

    const extraSeats = Number.parseInt(String(license.extra_seats ?? 0), 10) || 0;

    const payload = {
        plan,
        license_id: licenseKey,
        fecha_emision: fechaEmision,
        expires_at: fechaExpiracion,
        fecha_caducidad: fechaExpiracion,
        max_seats: maxSeats,
        extra_seats: extraSeats,
        cliente: String(license.razon_social || license.holder_name || "CLIENTE CORPORATIVO").trim(),
        ruc_titular: String(license.ruc_cedula || license.holder_ruc || "").trim(),
    };

    if (license.environment) {
        payload.environment = String(license.environment).trim();
    }
    if (Number.isInteger(Number(license.max_rucs)) && Number(license.max_rucs) >= 1) {
        payload.max_rucs = Number(license.max_rucs);
    }
    if (license.cloud_gb !== undefined && license.cloud_gb !== null) {
        const cgb = Number(license.cloud_gb);
        if (Number.isFinite(cgb) && cgb >= 0) payload.cloud_gb = cgb;
    }
    if (Array.isArray(license.storage_modes) && license.storage_modes.length > 0) {
        payload.storage_modes = license.storage_modes.map((m) => String(m));
    }
    if (typeof license.is_founder === "boolean") {
        payload.is_founder = license.is_founder;
    }

    if (PLANES_1_PC.has(plan)) {
        payload.hwid = hwidInicial;
    } else if (PLANES_MULTI_PC.has(plan)) {
        payload.org_token = resolverOrgToken(license.org_token, licenseKey);
        payload.tenant_id = licenseKey;
        if (hwidInicial) {
            payload.hwids_autorizados = [hwidInicial];
        }
    }

    const encoder = new TextEncoder();
    const payloadBytes = encoder.encode(JSON.stringify(payload));
    const payloadB64 = toBase64Url(payloadBytes);

    const isDemoEnv = String(license.environment || "").toLowerCase() === "demo";
    const keyPem =
        options.privateKeyPem ||
        (isDemoEnv
            ? env?.DEMO_ED25519_PRIVATE_KEY || env?.ED25519_PRIVATE_KEY_PEM
            : env?.MASTER_ED25519_PRIVATE_KEY || env?.ED25519_PRIVATE_KEY_PEM);
    const privateKey = await importEd25519PrivateKey(keyPem);
    const signatureBuffer = await crypto.subtle.sign(
        { name: "Ed25519" },
        privateKey,
        encoder.encode(payloadB64),
    );
    const signatureB64 = toBase64Url(new Uint8Array(signatureBuffer));

    return {
        version: 2,
        alg: "ED25519",
        license_id: licenseKey,
        payload: payloadB64,
        signature: signatureB64,
    };
}
