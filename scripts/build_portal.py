#!/usr/bin/env python3
"""Compilador modular estático para QuoraTec ERP (erp.quoratec.com).

Centraliza <head>, <header>, pre-footer CTA, <footer> y scripts desde templates/base.html,
resuelve rutas relativas por profundidad de directorio, calcula hashes SRI SHA-384 sobre
bytes LF (\n) y genera las 21 páginas HTML estáticas con saltos de línea LF estrictos.

Uso:
    python scripts/build_portal.py          # Renderiza y escribe los HTML en LF
    python scripts/build_portal.py --check  # Verifica sin escribir (0 drift, 0 CRLF, SRI exacto)
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import html
import json
import re
import sys
from pathlib import Path
from typing import Any

PORTAL_DIR = Path(__file__).resolve().parent.parent
TEMPLATES_DIR = PORTAL_DIR / "templates"
BASE_TEMPLATE_PATH = TEMPLATES_DIR / "base.html"
PAGES_MANIFEST_PATH = TEMPLATES_DIR / "pages.json"
CONFIG_PATH = PORTAL_DIR / "api" / "config_comercial.json"

CSS_ASSET = PORTAL_DIR / "assets" / "css" / "portal.css"
JS_ASSET = PORTAL_DIR / "assets" / "js" / "portal.js"

UNRESOLVED_PLACEHOLDER_RX = re.compile(r"\{\{[A-Z0-9_]+\}\}")


def _to_lf_bytes(raw: bytes) -> bytes:
    return raw.replace(b"\r\n", b"\n")


def _read_lf_text(path: Path) -> str:
    return path.read_text(encoding="utf-8").replace("\r\n", "\n")


def _sri_sha384_lf(path: Path) -> tuple[str, str]:
    lf_bytes = _to_lf_bytes(path.read_bytes())
    digest = hashlib.sha384(lf_bytes).digest()
    return ("sha384-" + base64.b64encode(digest).decode("ascii"), digest.hex()[:8])


def _compute_root_prefix(output_rel: str) -> str:
    depth = len(Path(output_rel).parts) - 1
    return "../" * depth


def _render_nav_cta(mode: str, root_prefix: str) -> str:
    if mode == "checkout":
        return '<button type="button" class="nav-cta" data-checkout-plan="ESTUDIO_CONTABLE">Adquirir Licencia</button>'
    if mode == "link":
        return f'<a href="{root_prefix}planes.html" class="nav-cta">Ver Planes y Pagar</a>'
    raise ValueError(f"Modo nav_cta no soportado: {mode!r}")


def render_all_pages(cfg: dict[str, Any], base_html: str, pages: list[dict[str, Any]]) -> dict[Path, str]:
    version = str(cfg.get("version") or "").strip()
    edition = str(cfg.get("edicion") or "Edición 2026").strip()
    company = str(cfg.get("empresa") or "QuoraTec").strip()
    soporte = cfg.get("canal_soporte", {})
    wa_base = str(soporte.get("whatsapp_url") or "https://wa.me/593996459771").strip()
    wa_display = str(soporte.get("whatsapp_display") or "0996459771").strip()
    support_email = str(soporte.get("correo") or "soporte@quoratec.com").strip()

    if not version:
        raise ValueError("api/config_comercial.json no define 'version'")

    whatsapp_url = f"{wa_base}?text=Consulta%20Soporte%20T%C3%A9cnico%20%E2%80%94%20QuoraTec%20ERP"
    mailto_url = f"mailto:{support_email}?subject=Consulta%20Soporte%20T%C3%A9cnico%20%E2%80%94%20QuoraTec%20ERP"

    css_sri, css_hash = _sri_sha384_lf(CSS_ASSET)
    js_sri, js_hash = _sri_sha384_lf(JS_ASSET)

    rendered: dict[Path, str] = {}
    for entry in pages:
        output_rel = entry["output"]
        partial_path = TEMPLATES_DIR / entry["template"]
        if not partial_path.is_file():
            raise FileNotFoundError(f"Falta plantilla parcial: {partial_path}")

        root_prefix = _compute_root_prefix(output_rel)
        active_nav = entry.get("active_nav", "")
        pre_footer = entry.get("pre_footer", {})
        actions_lines = [f"                    {line}" for line in pre_footer.get("actions", [])]
        canonical_url = (
            "https://erp.quoratec.com/"
            if output_rel == "index.html"
            else f"https://erp.quoratec.com/{output_rel}"
        )
        jsonld_obj = {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": f"QuoraTec ERP {edition}",
            "softwareVersion": version,
            "operatingSystem": "Windows 10, Windows 11, macOS, Linux",
            "applicationCategory": "BusinessApplication",
            "url": canonical_url,
            "downloadUrl": "https://erp.quoratec.com/descargas.html",
            "description": entry["description"],
            "publisher": {"@type": "Organization", "name": company, "email": support_email},
            "offers": {
                "@type": "AggregateOffer",
                "priceCurrency": "USD",
                "lowPrice": "69.00",
                "highPrice": "849.00",
                "offerCount": 5,
            },
        }
        software_jsonld = json.dumps(jsonld_obj, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c")

        replacements = {
            "{{TITLE}}": html.escape(entry["title"], quote=True),
            "{{DESCRIPTION}}": html.escape(entry["description"], quote=True),
            "{{CANONICAL_URL}}": canonical_url,
            "{{SOFTWARE_JSONLD}}": software_jsonld,
            "{{BODY_ATTRS}}": f' data-root="{root_prefix}"' if root_prefix else "",
            "{{ACTIVE_MODULOS}}": " active" if active_nav == "modulos" else "",
            "{{ACTIVE_PLANES}}": ' class="active"' if active_nav == "planes" else "",
            "{{ACTIVE_DESCARGAS}}": ' class="active"' if active_nav == "descargas" else "",
            "{{ACTIVE_GUIA}}": ' class="active"' if active_nav == "guia" else "",
            "{{ACTIVE_SOPORTE}}": ' class="active"' if active_nav == "soporte" else "",
            "{{ACTIVE_POLITICAS}}": ' class="active"' if active_nav == "politicas" else "",
            "{{NAV_CTA}}": _render_nav_cta(entry.get("nav_cta", "link"), root_prefix),
            "{{DOWNLOADS_HREF}}": "#descargas" if output_rel == "index.html" else f"{root_prefix}index.html#descargas",
            "{{MAIN_CONTENT}}": _read_lf_text(partial_path).rstrip("\n"),
            "{{PRE_FOOTER_TITLE}}": pre_footer.get("title", ""),
            "{{PRE_FOOTER_DESC}}": pre_footer.get("description", ""),
            "{{PRE_FOOTER_ACTIONS}}": "\n".join(actions_lines),
            "{{ROOT}}": root_prefix,
            "{{VERSION}}": version,
            "{{EDITION}}": edition,
            "{{COMPANY}}": company,
            "{{CSS_SRI}}": css_sri,
            "{{CSS_HASH}}": css_hash,
            "{{JS_SRI}}": js_sri,
            "{{JS_HASH}}": js_hash,
            "{{WHATSAPP_URL}}": whatsapp_url,
            "{{WHATSAPP_DISPLAY}}": wa_display,
            "{{SUPPORT_EMAIL}}": support_email,
            "{{MAILTO_URL}}": mailto_url,
        }

        html_out = base_html
        # Primera pasada para bloques que a su vez contienen {{ROOT}} o {{VERSION}}
        for key, val in replacements.items():
            html_out = html_out.replace(key, val)
        # Segunda pasada para asegurar resolución completa de {{ROOT}} dentro de actions/partials
        for key in ("{{ROOT}}", "{{VERSION}}", "{{EDITION}}", "{{COMPANY}}"):
            html_out = html_out.replace(key, replacements[key])

        leftovers = UNRESOLVED_PLACEHOLDER_RX.findall(html_out)
        if leftovers:
            raise ValueError(f"Placeholders sin resolver en {output_rel}: {leftovers}")

        rendered[PORTAL_DIR / output_rel] = html_out.replace("\r\n", "\n")

    return rendered


def main() -> int:
    parser = argparse.ArgumentParser(description="Compila o valida las 22 páginas HTML del portal QuoraTec ERP.")
    parser.add_argument("--check", action="store_true", help="Verifica sin modificar disco (LF + SRI + cero drift).")
    args = parser.parse_args()

    cfg = json.loads(_read_lf_text(CONFIG_PATH))
    base_html = _read_lf_text(BASE_TEMPLATE_PATH)
    pages = json.loads(_read_lf_text(PAGES_MANIFEST_PATH))

    rendered = render_all_pages(cfg, base_html, pages)

    if args.check:
        mismatches: list[str] = []
        crlf_files: list[str] = []
        for asset in (CSS_ASSET, JS_ASSET, CONFIG_PATH, BASE_TEMPLATE_PATH, PAGES_MANIFEST_PATH):
            if b"\r\n" in asset.read_bytes():
                crlf_files.append(asset.relative_to(PORTAL_DIR).as_posix())
        for out_path, expected_html in rendered.items():
            rel = out_path.relative_to(PORTAL_DIR).as_posix()
            if not out_path.is_file():
                mismatches.append(f"Falta archivo compilado: {rel}")
                continue
            disk_bytes = out_path.read_bytes()
            if b"\r\n" in disk_bytes:
                crlf_files.append(rel)
            if disk_bytes.decode("utf-8") != expected_html:
                mismatches.append(f"Desfase plantilla vs salida compilada en: {rel}")
        if crlf_files or mismatches:
            for item in crlf_files:
                print(f"[FAIL CRLF] {item}", file=sys.stderr)
            for item in mismatches:
                print(f"[FAIL DRIFT] {item}", file=sys.stderr)
            return 1
        print(f"build_portal --check OK: {len(rendered)} páginas verificadas en LF y 100 % sincronizadas con templates/.")
        return 0

    for asset in (CSS_ASSET, JS_ASSET):
        raw = asset.read_bytes()
        if b"\r\n" in raw:
            asset.write_bytes(_to_lf_bytes(raw))

    for out_path, html_out in rendered.items():
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(html_out, encoding="utf-8", newline="\n")

    print(f"build_portal OK: {len(rendered)} páginas compiladas con LF (\\n) y SRI SHA-384 actualizado.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
