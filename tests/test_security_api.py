"""Suite defensiva estática, de cadena de suministro SRI y de seguridad Edge/API v3.0.0 (Edición 2026).

Ejecutable completamente offline dentro o fuera del sandbox (Node.js + Python stdlib).
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
from pathlib import Path
import py_compile
import re
import secrets
import subprocess
import sys
import time
import urllib.error
import urllib.request

PORTAL_DIR = Path(__file__).resolve().parent.parent

PAYPHONE_OFICIALES = {
    "PERSONAL_PRO": None,
    "CONTADOR_MASTER": None,
    "ESTUDIO_PRO": None,
    "ENTERPRISE_TEAM": None,
    "ENTERPRISE_CORP": None,
}

SHA256_OFICIALES = {
    "windows": (
        "https://github.com/andresorellana305/tributaflow-portal/releases/download/v3.0.0/Setup_TributaFlow_ERP_v3.0.0.exe",
        "350a7f2cb1ba50a8cea87563b7e773357b5f8e9fa9d0f359401e0e9dc4c9e232",
    ),
    "windows_zip": (
        "https://github.com/andresorellana305/tributaflow-portal/releases/download/v3.0.0/TributaFlow_ERP_v3.0.0_Windows_x64.zip",
        "ca49bcd4eea13b496a618122aa742d5de5c898f176e7eda326ad2d8b33a0c051",
    ),
    "macos": (
        "https://github.com/andresorellana305/tributaflow-portal/releases/download/v3.0.0/TributaFlow_ERP_v3.0.0_macOS.dmg",
        "374e5ca4444b290662e417403ea0848bb77fe0215243fe52299743d7d8ad24df",
    ),
    "linux": (
        "https://github.com/andresorellana305/tributaflow-portal/releases/download/v3.0.0/TributaFlow_ERP_v3.0.0_Linux_amd64.deb",
        "2c5e48ae14c8dfce3d3e5f975e236a93be663fd138ef6f81dcb9a4ec5c2d052a",
    ),
    "linux_tar": (
        "https://github.com/andresorellana305/tributaflow-portal/releases/download/v3.0.0/TributaFlow_ERP_v3.0.0_Linux_x64.tar.gz",
        "b4e5da23885fe7126dabe59a0120ef2fc688ad0a6124407a722bae4429c09b1b",
    ),
    "sha256sums": (
        "https://github.com/andresorellana305/tributaflow-portal/releases/download/v3.0.0/SHA256SUMS.txt",
        "a86675219f227ab4831dfa34e00253fc735e161eef1fd0dc88a40c35f25685ba",
    ),
}

HTML_FILES = sorted(
    [p.relative_to(PORTAL_DIR).as_posix() for p in PORTAL_DIR.glob("*.html")]
    + [p.relative_to(PORTAL_DIR).as_posix() for p in (PORTAL_DIR / "modulos").glob("*.html")]
)


def _assert(cond: bool, msg: str) -> None:
    if not cond:
        raise AssertionError(msg)


def _sign_body(secret: str, raw_body: str, ts: int | None = None) -> tuple[int, str]:
    ts_val = int(time.time()) if ts is None else ts
    sig = hmac.new(secret.encode("utf-8"), f"{ts_val}.{raw_body}".encode("utf-8"), hashlib.sha256).hexdigest()
    return ts_val, f"sha256={sig}"


class _EdgeClient:
    """Cliente dual: HTTP loopback (si permitido) o puente stdio Web-Standard en sandbox."""

    def __init__(self, proc: subprocess.Popen[str], base_url: str | None) -> None:
        self.proc = proc
        self.base_url = base_url

    def request(
        self,
        method: str,
        path: str,
        raw_body: str = "",
        headers: dict[str, str] | None = None,
        content_type: str | None = "application/json",
    ) -> tuple[int, dict[str, str], str]:
        req_headers = {"X-Forwarded-For": "203.0.113.99"}
        if content_type and method != "GET":
            req_headers["Content-Type"] = content_type
        if headers:
            req_headers.update(headers)

        if self.base_url:
            data = None if method == "GET" else raw_body.encode("utf-8")
            req = urllib.request.Request(f"{self.base_url}{path}", data=data, headers=req_headers, method=method)
            try:
                with urllib.request.urlopen(req, timeout=5) as resp:
                    return resp.status, {k.lower(): v for k, v in resp.headers.items()}, resp.read().decode("utf-8")
            except urllib.error.HTTPError as err:
                return err.code, {k.lower(): v for k, v in err.headers.items()}, err.read().decode("utf-8")

        assert self.proc.stdin is not None and self.proc.stdout is not None
        payload = json.dumps({"method": method, "path": path, "headers": req_headers, "body": raw_body})
        self.proc.stdin.write(payload + "\n")
        self.proc.stdin.flush()
        line = self.proc.stdout.readline()
        _assert(bool(line), "El proceso harness stdio terminó inesperadamente")
        resp = json.loads(line)
        return int(resp["status"]), {k.lower(): v for k, v in resp["headers"].items()}, resp["body"]

    def post(
        self,
        path: str,
        raw_body: str,
        headers: dict[str, str] | None = None,
        content_type: str = "application/json",
    ) -> tuple[int, dict[str, str], str]:
        return self.request("POST", path, raw_body=raw_body, headers=headers, content_type=content_type)

    def get(self, path: str) -> tuple[int, dict[str, str], str]:
        return self.request("GET", path, content_type=None)


def test_1_static_commercial_and_supply_chain() -> None:
    print("[1/4] Verificación comercial v3.0.0 (Edición 2026), SRI SHA-384, SHA-256 binarios y cero secretos...")
    _assert(len(HTML_FILES) == 15, f"Se esperaban 15 páginas HTML, encontradas: {len(HTML_FILES)}")

    # 1. Config JSON comercial + version.json + SHA-256
    cfg = json.loads((PORTAL_DIR / "api" / "config_comercial.json").read_text(encoding="utf-8"))
    _assert(cfg.get("version") == "3.0.0", f"version inválida: {cfg.get('version')}")
    _assert(cfg.get("trial_dias") == 7, f"trial_dias esperado 7, recibido: {cfg.get('trial_dias')}")
    _assert(cfg.get("trial_rucs") == 60, f"trial_rucs esperado 60, recibido: {cfg.get('trial_rucs')}")
    _assert(cfg.get("trial_modalidad") == "ESTUDIO_PRO", "trial_modalidad esperada ESTUDIO_PRO")
    _assert(cfg.get("payphone_habilitado") is False, "PayPhone debe estar pausado en v3.0.0")
    _assert(cfg.get("payphone_links") == PAYPHONE_OFICIALES, "PayPhone JSON debe permanecer pausado (None)")
    _assert(cfg.get("canal_soporte", {}).get("correo") == "soportetributaflow@quoratec.com", "Email alterado")
    _assert(cfg.get("canal_soporte", {}).get("whatsapp_numero") == "593996459771", "WhatsApp alterado")

    ver_json = json.loads((PORTAL_DIR / "version.json").read_text(encoding="utf-8"))
    _assert(ver_json.get("version") == "3.0.0" and ver_json.get("tag_name") == "v3.0.0", "version.json inválido")

    descargas = cfg.get("descargas", {})
    for os_key, (expected_url, expected_sha) in SHA256_OFICIALES.items():
        node = descargas.get(os_key, {})
        _assert(node.get("url") == expected_url, f"URL descarga inválida para {os_key}: {node.get('url')}")
        _assert(node.get("sha256") == expected_sha, f"SHA-256 inválido para {os_key}: {node.get('sha256')}")

    # 2. SRI SHA-384 + reglas CSP/Referrer en los 13 HTML + index.html releases/SHA-256
    css_sri = "sha384-" + base64.b64encode(hashlib.sha384((PORTAL_DIR / "assets" / "css" / "portal.css").read_bytes()).digest()).decode()
    js_sri = "sha384-" + base64.b64encode(hashlib.sha384((PORTAL_DIR / "assets" / "js" / "portal.js").read_bytes()).digest()).decode()

    legacy_ban = [
        re.compile(r"\b14\s*d[ií]as\b|\b14d\b|\b15\s+d[ií]as\b", re.I),
        re.compile(r"\b2\s+RUCs?\b", re.I),
        re.compile(r"\b15\s+l[ií]neas\b|\b50\s+l[ií]neas\b|\b200\s+l[ií]neas\b", re.I),
        re.compile(r"\bEd25519\b|\bRSA-2048\b", re.I),
        re.compile(r"no-referrer|releases/latest", re.I),
        re.compile("Fausto" + r"\s+" + ".*?" + "Orellana", re.I),
        re.compile(r"2\.[45]\.0|TributaFlow Pro", re.I),
    ]

    for rel in HTML_FILES:
        html = (PORTAL_DIR / rel).read_text(encoding="utf-8")
        _assert('name="referrer" content="strict-origin-when-cross-origin"' in html, f"Referrer-Policy incorrecto en {rel}")
        _assert(css_sri in html, f"Falta SRI sha384 exacto de portal.css en {rel}")
        _assert(js_sri in html, f"Falta SRI sha384 exacto de portal.js en {rel}")
        _assert("'unsafe-inline'" not in html, f"unsafe-inline prohibido en {rel}")
        _assert("soportetributaflow@quoratec.com" in html, f"Correo soporte faltante en {rel}")
        _assert("593996459771" in html and "0996459771" in html, f"WhatsApp soporte faltante en {rel}")
        for pat in legacy_ban:
            hits = pat.findall(html)
            _assert(not hits, f"Texto legado prohibido en {rel}: {hits[:3]}")

    idx_html = (PORTAL_DIR / "index.html").read_text(encoding="utf-8")
    for _, (expected_url, expected_sha) in SHA256_OFICIALES.items():
        _assert(expected_url in idx_html, f"Enlace release v3.0.0 faltante en index.html: {expected_url}")
        _assert(expected_sha in idx_html, f"Hash SHA-256 faltante en index.html: {expected_sha}")

    # 3. Sin sourcemaps (.map) ni secretos embebidos en el repositorio
    maps = list(PORTAL_DIR.rglob("*.map"))
    _assert(not maps, f"Se detectaron sourcemaps (.map) prohibidos: {maps}")

    secret_rx = re.compile("|".join(["-----" + r"BEGIN [A-Z ]*PRIVATE KEY-----", "sk_" + "live_", "AIza" + r"[0-9A-Za-z_-]{35}"]))
    for path in PORTAL_DIR.rglob("*"):
        if path.is_file() and path.suffix in {".html", ".js", ".mjs", ".css", ".json", ".py"}:
            txt = path.read_text(encoding="utf-8")
            _assert(not secret_rx.search(txt), f"Posible secreto embebido en {path}")

    # Frontend OWASP checks: cero service_role ni sinks innerHTML/eval en cliente; SEO sitemap/robots
    frontend_files = [*(PORTAL_DIR / rel for rel in HTML_FILES), PORTAL_DIR / "assets" / "js" / "portal.js", PORTAL_DIR / "api" / "config_comercial.json"]
    for ff in frontend_files:
        ftxt = ff.read_text(encoding="utf-8")
        _assert("service_role" not in ftxt.lower(), f"Posible exposición de service_role en frontend: {ff}")
        _assert("innerhtml" not in ftxt.lower(), f"Uso inseguro de innerHTML en frontend: {ff}")
    _assert((PORTAL_DIR / "robots.txt").is_file() and "sitemap.xml" in (PORTAL_DIR / "robots.txt").read_text(encoding="utf-8"), "Falta robots.txt válido")
    sitemap_txt = (PORTAL_DIR / "sitemap.xml").read_text(encoding="utf-8")
    _assert(sitemap_txt.count("<loc>") == 15, f"sitemap.xml debe listar 15 URLs, encontradas: {sitemap_txt.count('<loc>')}")

    # 4. Cabeceras _headers
    headers_txt = (PORTAL_DIR / "_headers").read_text(encoding="utf-8")
    for req_h in [
        "Strict-Transport-Security: max-age=63072000; includeSubDomains; preload",
        "X-Frame-Options: DENY",
        "X-Content-Type-Options: nosniff",
        "Referrer-Policy: strict-origin-when-cross-origin",
        "frame-ancestors 'none'",
    ]:
        _assert(req_h in headers_txt, f"Falta cabecera en _headers: {req_h}")

    # 5. Arquitectura modular de plantillas + saltos de línea LF estrictos
    build_script = PORTAL_DIR / "scripts" / "build_portal.py"
    _assert(build_script.is_file(), "Falta scripts/build_portal.py")
    build_check = subprocess.run([sys.executable, str(build_script), "--check"], capture_output=True, text=True, check=False)
    _assert(build_check.returncode == 0, f"Desfase en plantillas modulares o CRLF: {build_check.stderr or build_check.stdout}")

    print("    -> OK: 15 HTML con SRI SHA-384, plantillas modulares LF, reglas v3.0.0, SHA-256 reales y cero secretos.")


def test_2_syntax_all_scripts() -> None:
    print("[2/4] Validación sintáctica JS (node --check) y Python (py_compile)...")
    js_files = [
        PORTAL_DIR / "assets" / "js" / "portal.js",
        PORTAL_DIR / "functions" / "_shared" / "security.js",
        PORTAL_DIR / "functions" / "_middleware.js",
        PORTAL_DIR / "functions" / "api" / "webhook" / "payphone.js",
        PORTAL_DIR / "functions" / "api" / "webhook" / "deuna-business.js",
        PORTAL_DIR / "functions" / "api" / "license" / "activate.js",
        PORTAL_DIR / "functions" / "api" / "license" / "verify.js",
        PORTAL_DIR / "functions" / "api" / "orders" / "_store.js",
        PORTAL_DIR / "functions" / "api" / "orders" / "create.js",
        PORTAL_DIR / "functions" / "api" / "orders" / "receipt.js",
        PORTAL_DIR / "functions" / "api" / "orders" / "status.js",
        PORTAL_DIR / "functions" / "api" / "orders" / "claim.js",
        PORTAL_DIR / "functions" / "api" / "auth" / "supabase.js",
        PORTAL_DIR / "tests" / "edge_harness.mjs",
    ]
    for jf in js_files:
        proc = subprocess.run(["node", "--check", str(jf)], capture_output=True, text=True, check=False)
        _assert(proc.returncode == 0, f"Syntax error en {jf}: {proc.stderr}")

    py_scripts = [*(PORTAL_DIR / "tests").glob("*.py"), PORTAL_DIR / "scripts" / "build_portal.py"]
    for pf in py_scripts:
        py_compile.compile(str(pf), doraise=True)
    print(f"    -> OK: {len(js_files)} archivos JS/MJS y {len(py_scripts)} scripts Python compilados sin errores.")


def test_3_edge_security_and_anti_tampering(client: _EdgeClient, payphone_secret: str, license_secret: str) -> None:
    print("[3/4] Pruebas de seguridad Edge HTTP, HMAC, Anti-Tampering y Fuzzing...")

    # A) Headers HSTS/CSP/Referrer en GET / y métodos HTTP inválidos
    st_get, hdrs, _ = client.get("/")
    _assert(st_get == 200, f"GET / falló: {st_get}")
    _assert("max-age=63072000" in hdrs.get("strict-transport-security", ""), "HSTS faltante")
    _assert(hdrs.get("x-frame-options") == "DENY", "X-Frame-Options faltante")
    _assert(hdrs.get("x-content-type-options") == "nosniff", "X-Content-Type-Options faltante")
    _assert(hdrs.get("referrer-policy") == "strict-origin-when-cross-origin", "Referrer-Policy faltante")
    _assert("frame-ancestors 'none'" in hdrs.get("content-security-policy", ""), "CSP frame-ancestors faltante")

    st_del, _, _ = client.request("DELETE", "/api/webhook/payphone", "")
    _assert(st_del == 405, f"Método DELETE debió retornar 405, retornó {st_del}")

    st_ct, _, _ = client.post("/api/webhook/payphone", "{}", content_type="text/plain")
    _assert(st_ct == 415, f"Content-Type text/plain debió retornar 415, retornó {st_ct}")

    # B) PayPhone webhook — ataques de autenticación, replay y precio manipulado
    valid_webhook = json.dumps({
        "transaction_id": "PP-TX-900001",
        "client_transaction_id": "TF-ESTUDIO_PRO-AB12",
        "plan_id": "ESTUDIO_PRO",
        "amount_cents": 37900,
        "currency": "USD",
        "status_code": 3,
        "hwid": "A1B2-C3D4-E5F6",
        "extra_seats": 0,
    })

    # Sin firma -> 401
    st, _, _ = client.post("/api/webhook/payphone", valid_webhook)
    _assert(st == 401, f"Webhook sin firma debió devolver 401, devolvió {st}")

    # Firma expirada (>300s) -> 401
    old_ts, old_sig = _sign_body(payphone_secret, valid_webhook, ts=int(time.time()) - 900)
    st, _, _ = client.post("/api/webhook/payphone", valid_webhook, {"X-Timestamp": str(old_ts), "X-Signature-256": old_sig})
    _assert(st == 401, f"Webhook expirado debió devolver 401, devolvió {st}")

    # Precio adulterado (pagar $1 por Estudio Pro) aunque tenga firma -> 403
    tampered_price = json.dumps({
        "transaction_id": "PP-TX-900002",
        "client_transaction_id": "TF-ESTUDIO_PRO-AB12",
        "plan_id": "ESTUDIO_PRO",
        "amount_cents": 100,
        "currency": "USD",
        "status_code": 3,
        "hwid": "A1B2-C3D4-E5F6",
    })
    ts, sig = _sign_body(payphone_secret, tampered_price)
    st, _, txt = client.post("/api/webhook/payphone", tampered_price, {"X-Timestamp": str(ts), "X-Signature-256": sig})
    _assert(st == 403 and "TAMPERING" in txt, f"Tampering de precio no rechazado con 403: {st} {txt}")

    # Inyección de campos de privilegio (price/discount/trial_days) -> 403
    priv_esc = json.dumps({
        "transaction_id": "PP-TX-900003",
        "client_transaction_id": "TF-ESTUDIO_PRO-AB12",
        "plan_id": "ESTUDIO_PRO",
        "amount_cents": 37900,
        "currency": "USD",
        "status_code": 3,
        "hwid": "A1B2-C3D4-E5F6",
        "price": 0.01,
    })
    ts, sig = _sign_body(payphone_secret, priv_esc)
    st, _, _ = client.post("/api/webhook/payphone", priv_esc, {"X-Timestamp": str(ts), "X-Signature-256": sig})
    _assert(st == 403, f"Campo manipulado price=0.01 debió devolver 403, devolvió {st}")

    # Prototype Pollution JSON crudo -> 403
    proto_raw = '{"__proto__":{"isAdmin":true},"plan_id":"PERSONAL_PRO"}'
    ts, sig = _sign_body(payphone_secret, proto_raw)
    st, _, _ = client.post("/api/webhook/payphone", proto_raw, {"X-Timestamp": str(ts), "X-Signature-256": sig})
    _assert(st == 403, f"Prototype Pollution debió devolver 403, devolvió {st}")

    # Webhook legítimo firmado -> 200 y luego replay del mismo TX -> 409
    ts, sig = _sign_body(payphone_secret, valid_webhook)
    st, hdrs, txt = client.post("/api/webhook/payphone", valid_webhook, {"X-Timestamp": str(ts), "X-Signature-256": sig})
    _assert(st == 200 and '"monto_verificado_usd":379' in txt, f"Webhook válido falló: {st} {txt}")
    _assert("no-store" in hdrs.get("cache-control", ""), "Cache-Control no-store ausente en respuesta API")

    st_replay, _, _ = client.post("/api/webhook/payphone", valid_webhook, {"X-Timestamp": str(ts), "X-Signature-256": sig})
    _assert(st_replay == 409, f"Replay de transacción PayPhone debió devolver 409, devolvió {st_replay}")

    # C) Fuzzing de inyecciones en /api/license/activate (XSS, SQLi, NoSQLi, SSRF, Path Traversal)
    fuzz_payloads = [
        ("XSS", {"plan_id": "PERSONAL_PRO", "order_ref": "TF-XSS1", "hwid": "<script>alert(1)</script>", "ruc": "1790012345001", "email": "a@b.ec", "payment_channel": "DEUNA", "voucher_ref": "VOUCH1"}),
        ("SQLi", {"plan_id": "PERSONAL_PRO", "order_ref": "TF-SQL1", "hwid": "A1B2' OR '1'='1", "ruc": "1790012345001", "email": "a@b.ec", "payment_channel": "DEUNA", "voucher_ref": "VOUCH1"}),
        ("NoSQLi", {"plan_id": "PERSONAL_PRO", "order_ref": "TF-NOSQL", "hwid": "ABCD-1234", "ruc": "1790012345001", "email": "a$gt@b.ec", "payment_channel": "DEUNA", "voucher_ref": "VOUCH1"}),
        ("SSRF", {"plan_id": "PERSONAL_PRO", "order_ref": "TF-SSRF1", "hwid": "http://169.254.169.254/latest", "ruc": "1790012345001", "email": "a@b.ec", "payment_channel": "DEUNA", "voucher_ref": "VOUCH1"}),
        ("PathTraversal", {"plan_id": "PERSONAL_PRO", "order_ref": "TF-PT1", "hwid": "../../etc/passwd", "ruc": "1790012345001", "email": "a@b.ec", "payment_channel": "DEUNA", "voucher_ref": "VOUCH1"}),
    ]
    for attack_name, payload in fuzz_payloads:
        raw = json.dumps(payload)
        ts, sig = _sign_body(license_secret, raw)
        st, _, _ = client.post("/api/license/activate", raw, {"X-Timestamp": str(ts), "X-Signature-256": sig})
        _assert(st == 403, f"Ataque {attack_name} no fue bloqueado con HTTP 403: recibido {st}")

    # Activación Enterprise Corp válida con +2 PC extra -> monto servidor $1,790 (1490 + 300)
    corp_req = json.dumps({
        "plan_id": "ENTERPRISE_CORP",
        "order_ref": "TF-CORP-9988",
        "hwid": "CORP-HOST-01",
        "ruc": "1790012345001",
        "email": "ti@empresa.com.ec",
        "payment_channel": "TRANSFERENCIA",
        "voucher_ref": "PICH-998877",
        "extra_seats": 2,
    })
    ts, sig = _sign_body(license_secret, corp_req)
    st, _, txt = client.post("/api/license/activate", corp_req, {"X-Timestamp": str(ts), "X-Signature-256": sig})
    _assert(st == 200, f"Activación Enterprise Corp válida falló: {st} {txt}")
    corp_json = json.loads(txt)
    _assert(corp_json["monto_autorizado_usd"] == 1790, f"Monto esperado 1790, recibido {corp_json['monto_autorizado_usd']}")
    _assert(corp_json["estaciones_autorizadas"] == 12, f"Estaciones esperadas 12, recibidas {corp_json['estaciones_autorizadas']}")

    # D) Anti-enumeración en /api/license/verify
    good_verify = json.dumps({
        "license_key": corp_json["license_key"],
        "hwid": "CORP-HOST-01",
        "ruc": "1790012345001",
        "plan_id": "ENTERPRISE_CORP",
        "estaciones_autorizadas": 12,
    })
    st, _, txt = client.post("/api/license/verify", good_verify)
    _assert(st == 200 and '"valid":true' in txt, f"Verificación de llave válida falló: {st} {txt}")

    wrong_cases = [
        {"license_key": "TFLIC-00000000-00000000000000000000000000000000", "hwid": "CORP-HOST-01", "ruc": "1790012345001", "plan_id": "ENTERPRISE_CORP", "estaciones_autorizadas": 12},
        {"license_key": corp_json["license_key"], "hwid": "OTRO-EQUIPO-99", "ruc": "1790012345001", "plan_id": "ENTERPRISE_CORP", "estaciones_autorizadas": 12},
        {"license_key": corp_json["license_key"], "hwid": "CORP-HOST-01", "ruc": "0999999999001", "plan_id": "ENTERPRISE_CORP", "estaciones_autorizadas": 12},
        {"license_key": corp_json["license_key"], "hwid": "CORP-HOST-01", "ruc": "1790012345001", "plan_id": "PERSONAL_PRO", "estaciones_autorizadas": 1},
    ]
    responses = []
    for case in wrong_cases:
        st_w, _, txt_w = client.post("/api/license/verify", json.dumps(case))
        responses.append((st_w, txt_w))
    _assert(all(st_w == 401 for st_w, _ in responses), f"Se esperaba HTTP 401 uniforme, recibido: {responses}")
    _assert(len({txt_w for _, txt_w in responses}) == 1, f"Enumeración detectada entre respuestas inválidas: {responses}")

    # E) Checkout Híbrido (/api/orders/*), Feature Flags Próximamente y Supabase Auth
    hdr_ip_e = {"X-Forwarded-For": "203.0.113.105"}
    st_soon_gw, _, txt_soon_gw = client.post(
        "/api/orders/create",
        json.dumps({"checkout_mode": "guest", "plan_id": "ESTUDIO_PRO", "email": "inv@estudio.ec", "ruc_cedula": "1790012345001", "razon_social": "ESTUDIO PRUEBA", "payment_channel": "DEUNA_NEGOCIOS"}),
        headers=hdr_ip_e,
    )
    _assert(st_soon_gw == 400 and "GATEWAY_FEATURE_DISABLED_SOON" in txt_soon_gw, f"Pasarela Próximamente debió rechazarse: {st_soon_gw} {txt_soon_gw}")

    st_ord_tamper, _, _ = client.post(
        "/api/orders/create",
        json.dumps({"checkout_mode": "guest", "plan_id": "ESTUDIO_PRO", "email": "inv@estudio.ec", "ruc_cedula": "1790012345001", "razon_social": "ESTUDIO PRUEBA", "payment_channel": "DEUNA_PERSONAL", "price": 1}),
        headers=hdr_ip_e,
    )
    _assert(st_ord_tamper == 403, f"Price tampering en orden invitado no rechazado con 403: {st_ord_tamper}")

    st_ord_ok, _, txt_ord_ok = client.post(
        "/api/orders/create",
        json.dumps({"checkout_mode": "guest", "plan_id": "ENTERPRISE_CORP", "extra_seats": 2, "email": "inv@estudio.ec", "ruc_cedula": "1790012345001", "razon_social": "CORP PRUEBA SA", "payment_channel": "DEUNA_PERSONAL"}),
        headers=hdr_ip_e,
    )
    _assert(st_ord_ok == 201, f"Creación orden invitado falló: {st_ord_ok} {txt_ord_ok}")
    ord_json = json.loads(txt_ord_ok)
    _assert(ord_json.get("status") == "pendiente_verificacion" and ord_json.get("monto_autorizado_usd") == 1790, f"Orden inválida: {ord_json}")
    _assert(bool(ord_json.get("order_token")), "Falta order_token criptográfico en modo invitado")

    st_rec_bad, _, _ = client.post(
        "/api/orders/receipt",
        json.dumps({"order_ref": ord_json["order_ref"], "order_token": "TFTK-TOKEN-INCORRECTO-000000", "voucher_ref": "DEUNA-9988"}),
        headers=hdr_ip_e,
    )
    _assert(st_rec_bad == 401, f"Subida de comprobante con token inválido debió dar 401: {st_rec_bad}")

    st_rec_mime, _, _ = client.post(
        "/api/orders/receipt",
        json.dumps({"order_ref": ord_json["order_ref"], "order_token": ord_json["order_token"], "voucher_ref": "DEUNA-9988", "comprobante_mime": "image/svg+xml"}),
        headers=hdr_ip_e,
    )
    _assert(st_rec_mime == 400, f"Archivo comprobante SVG peligroso debió rechazarse con 400: {st_rec_mime}")

    st_rec_size, _, _ = client.post(
        "/api/orders/receipt",
        json.dumps({"order_ref": ord_json["order_ref"], "order_token": ord_json["order_token"], "voucher_ref": "DEUNA-9988", "comprobante_size_bytes": 6 * 1024 * 1024}),
        headers=hdr_ip_e,
    )
    _assert(st_rec_size == 400, f"Archivo comprobante > 5 MB debió rechazarse con 400: {st_rec_size}")

    st_rec_ok, _, txt_rec_ok = client.post(
        "/api/orders/receipt",
        json.dumps({"order_ref": ord_json["order_ref"], "order_token": ord_json["order_token"], "voucher_ref": "DEUNA-9988", "banco_origen": "Banco Pichincha", "comprobante_mime": "image/png", "comprobante_size_bytes": 102400}),
        headers=hdr_ip_e,
    )
    _assert(st_rec_ok == 200 and json.loads(txt_rec_ok).get("status") == "pendiente_verificacion", f"Receipt falló: {st_rec_ok} {txt_rec_ok}")

    st_st_bad, _, _ = client.post("/api/orders/status", json.dumps({"order_ref": ord_json["order_ref"], "order_token": "TFTK-INVALIDO-1234567890", "email": "inv@estudio.ec"}), headers=hdr_ip_e)
    _assert(st_st_bad == 401, f"Consulta estado con token inválido debió dar 401: {st_st_bad}")

    st_st_wrong_mail, _, _ = client.post("/api/orders/status", json.dumps({"order_ref": ord_json["order_ref"], "order_token": ord_json["order_token"], "email": "otro@estudio.ec"}), headers=hdr_ip_e)
    _assert(st_st_wrong_mail == 401, f"Consulta invitado con correo distinto debió dar 401: {st_st_wrong_mail}")

    st_st_ok, _, txt_st_ok = client.post("/api/orders/status", json.dumps({"order_ref": ord_json["order_ref"], "order_token": ord_json["order_token"], "email": "inv@estudio.ec"}), headers=hdr_ip_e)
    _assert(st_st_ok == 200 and json.loads(txt_st_ok).get("voucher_ref") == "DEUNA-9988", f"Status orden invitado falló: {st_st_ok} {txt_st_ok}")

    st_dn_wh, _, _ = client.post("/api/webhook/deuna-business", json.dumps({"order_ref": ord_json["order_ref"]}), headers=hdr_ip_e)
    _assert(st_dn_wh == 503, f"Webhook Deuna! Negocios debió devolver 503 Próximamente cuando FF=false: {st_dn_wh}")

    st_auth_cfg, _, _ = client.post("/api/auth/supabase", json.dumps({"action": "login", "email": "a@b.ec", "password": "Password1234"}), headers=hdr_ip_e)
    _assert(st_auth_cfg == 503, f"Supabase Auth sin env vars debió devolver 503 seguro: {st_auth_cfg}")

    print("    -> OK: HMAC, Anti-Tampering, XSS/SQLi/NoSQLi/SSRF/PathTraversal, Checkout Híbrido y Anti-Enumeración aprobados.")


def test_4_rate_limiting(client: _EdgeClient) -> None:
    print("[4/4] Prueba de Rate Limiting (HTTP 429) ante ráfaga automatizada...")
    got_429 = False
    retry_after = None
    probe_body = json.dumps({"license_key": "TFLIC-00000000-00000000000000000000000000000000", "hwid": "RATE-TEST-1", "ruc": "1790012345001"})
    for idx in range(30):
        st, hdrs, _ = client.post(
            "/api/license/verify",
            probe_body,
            headers={"X-Forwarded-For": "203.0.113.250"},
        )
        if st == 429:
            got_429 = True
            retry_after = hdrs.get("retry-after")
            break
    _assert(got_429 and retry_after, "La ráfaga de 30 solicitudes no activó HTTP 429 con Retry-After")
    print(f"    -> OK: Rate Limit activado (HTTP 429, Retry-After={retry_after}s tras intento {idx + 1}).")


def main() -> int:
    use_http = "--http" in sys.argv[1:]
    payphone_secret = secrets.token_hex(32)
    license_secret = secrets.token_hex(32)

    test_1_static_commercial_and_supply_chain()
    test_2_syntax_all_scripts()

    env = dict(os.environ)
    env["PAYPHONE_WEBHOOK_SECRET"] = payphone_secret
    env["LICENSE_HMAC_SECRET"] = license_secret
    env["EDGE_HARNESS_PORT"] = "0"
    env["TF_RATE_LIMIT_MAX"] = "25"

    cmd = ["node", str(PORTAL_DIR / "tests" / "edge_harness.mjs")]
    if not use_http:
        cmd.append("--stdio")

    proc = subprocess.Popen(
        cmd,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
        env=env,
    )
    try:
        ready_line = proc.stdout.readline().strip() if proc.stdout else ""
        if use_http:
            _assert(ready_line.startswith("EDGE_HARNESS_READY "), f"Harness HTTP falló al iniciar: {ready_line}")
            client = _EdgeClient(proc, ready_line.split(" ", 1)[1])
        else:
            _assert(ready_line == "EDGE_HARNESS_STDIO_READY", f"Harness stdio falló al iniciar: {ready_line}")
            client = _EdgeClient(proc, None)

        test_3_edge_security_and_anti_tampering(client, payphone_secret, license_secret)
        test_4_rate_limiting(client)
    finally:
        proc.kill()
        proc.wait(timeout=3)

    print("SUITE SEGURIDAD EDGE & CADENA DE SUMINISTRO v3.0.0: ALL PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
