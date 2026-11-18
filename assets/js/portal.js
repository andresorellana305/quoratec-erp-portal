/**
 * TributaFlow ERP v3.0.0 (Edición 2026) — Motor Comercial, Detección Multiplataforma y Blindaje Web
 * Dominio oficial: https://tributaflow.quoratec.com
 * Desarrollado por QUORATEC (Ecuador).
 */
(function () {
    "use strict";

    const CLAVES_PROHIBIDAS = new Set(["__proto__", "constructor", "prototype"]);
    const SEMVER_REGEX = /^\d+\.\d+\.\d+$/;
    const HEX_ALFANUM_REGEX = /^[A-Z0-9-]{1,32}$/;

    function esClaveSegura(clave) {
        return typeof clave === "string" && !CLAVES_PROHIBIDAS.has(clave);
    }

    function crearMapaVacio() {
        return Object.create(null);
    }

    function congelarProfundo(objeto) {
        if (!objeto || typeof objeto !== "object") return objeto;
        Object.getOwnPropertyNames(objeto).forEach((prop) => {
            const valor = objeto[prop];
            if (valor && typeof valor === "object") {
                congelarProfundo(valor);
            }
        });
        return Object.freeze(objeto);
    }

    const URL_PORTAL_DESCARGAS = "https://tributaflow.quoratec.com/#descargas";

    const CONFIG_COMERCIAL = congelarProfundo({
        VERSION: "3.0.0",
        EDICION: "Edición 2026",
        FABRICANTE: "QUORATEC",
        TRIAL_DIAS: 7,
        TRIAL_RUCS: 60,
        TRIAL_MODALIDAD: "Estudio Contable Pro",
        DOMINIO_OFICIAL: "https://tributaflow.quoratec.com",
        URL_DESCARGAS_PORTAL: URL_PORTAL_DESCARGAS,
        API_CONFIG_PATH: "api/config_comercial.json",
        PAYPHONE_ACTIVO: false,
        PAYPHONE_ESTADO: "Próximamente / En actualización",
        PAYPHONE_LINKS: {
            PERSONAL_PRO: null,
            CONTADOR_MASTER: null,
            ESTUDIO_PRO: null,
            ENTERPRISE_TEAM: null,
            ENTERPRISE_CORP: null,
        },
        QR_DEUNA_SRC: "assets/qr-deuna.png",
        QR_DEUNA_SUBPAGE_SRC: "../assets/qr-deuna.png",
        TITULAR_RECAUDO: "QUORATEC — Recaudo Oficial TributaFlow ERP",
        TITULAR_NOTA_BANCO:
            "Canal principal activo: Deuna! y transferencia directa a nombre del recaudo oficial QUORATEC (TributaFlow ERP). Consulta la cuenta vigente por WhatsApp oficial (0996459771).",
        BANCO_RECAUDO: "Banco Pichincha / Deuna!",
        TIPO_CUENTA_RECAUDO: "Recaudo Oficial QUORATEC (Deuna! Directo)",
        NUMERO_CUENTA_RECAUDO: "Solicitar número vigente por WhatsApp Oficial (0996459771)",
        WHATSAPP_NUMERO: "593996459771",
        WHATSAPP_LOCAL: "0996459771",
        WHATSAPP_URL_PREFIX: "https://wa.me/593996459771",
        CORREO_SOPORTE: "soportetributaflow@quoratec.com",
        MAILTO_URL_PREFIX: "mailto:soportetributaflow@quoratec.com",
        ASUNTO_SOPORTE: "Consulta Soporte Técnico — TributaFlow ERP v3.0.0",
        DOMINIOS_PAYPHONE: ["ppls.me", "payphone.app"],
        GITHUB_RELEASES_PREFIX: "/andresorellana305/tributaflow-portal/releases/download/v3.0.0/",
        PAYPHONE_BADGES: "Visa · Mastercard · Diners · Discover · Alia",
        PAYPHONE_GARANTIA: "⏳ PayPhone en mantenimiento: Próximamente / En actualización. Usa Deuna! para activación inmediata.",
        PRECIO_SEAT_EXTRA_USD: 150,
        SIMULADOR_AHORRO: {
            HORAS_MANUAL_POR_RUC: 0.45,
            HORAS_MANUAL_POR_COMPROBANTE: 0.022,
            FACTOR_AUTOMATIZACION: 0.82,
        },
        DEMO_RUC_PRINCIPAL: "1790012345001",
        DEMO_RAZON_PRINCIPAL: "EMPRESA DEMOSTRACIÓN S.A.",
        DEMO_RUC_SECUNDARIO: "0999999999001",
    });

    const PLANES_V240 = congelarProfundo({
        PERSONAL_PRO: {
            id: "PERSONAL_PRO",
            nombre: "Personal Pro",
            nombreComercial: "TF Personal Pro",
            precioRegularUsd: 89,
            precioUsd: 69,
            rucsMax: 3,
            rucsLabel: "Hasta 3 RUCs",
            masivaLabel: "Local SQLite AES-256-GCM • SRI/RIDE/XML • POS .p12",
            estacionesBase: 1,
            estacionesLabel: "1 PC",
            modoLabel: "Local-First SQLite AES-256-GCM • Solo Deuna!",
            esEnterprise: false,
            permiteExtraSeats: false,
        },
        CONTADOR_MASTER: {
            id: "CONTADOR_MASTER",
            nombre: "Contador Master",
            nombreComercial: "TF Contador Master",
            precioRegularUsd: 199,
            precioUsd: 159,
            rucsMax: 25,
            rucsLabel: "Hasta 25 RUCs",
            masivaLabel: "Lote Multi-RUC + ATS Oficial + Form. 103/104",
            estacionesBase: 1,
            estacionesLabel: "1 PC",
            modoLabel: "Local-First AES-256-GCM (Sin Nube Oficina+Casa)",
            esEnterprise: false,
            permiteExtraSeats: false,
        },
        ESTUDIO_PRO: {
            id: "ESTUDIO_PRO",
            nombre: "Estudio Contable Pro",
            nombreComercial: "TF Estudio Pro",
            precioRegularUsd: 449,
            precioUsd: 379,
            rucsMax: 60,
            rucsLabel: "Hasta 60 RUCs",
            masivaLabel: "Nube Opcional Oficina+Casa + Contabilidad NIIF + EFOS",
            estacionesBase: 2,
            estacionesLabel: "Hasta 2 PCs (Oficina + Casa)",
            modoLabel: "Local AES-256-GCM + Nube Selectiva Supabase RLS",
            esEnterprise: false,
            permiteExtraSeats: false,
        },
        ENTERPRISE_TEAM: {
            id: "ENTERPRISE_TEAM",
            nombre: "Enterprise Team ERP",
            nombreComercial: "TF Enterprise Team ERP",
            precioRegularUsd: 1190,
            precioUsd: 890,
            rucsMax: -1,
            rucsLabel: "RUCs Ilimitados",
            masivaLabel: "Módulos ERP Completos: POS, Kardex, CxC/CxP, NIIF, ATS",
            estacionesBase: 5,
            estacionesLabel: "5 PCs",
            modoLabel: "Red LAN + Nube Selectiva Oficina+Casa (5 PCs)",
            esEnterprise: true,
            permiteExtraSeats: false,
        },
        ENTERPRISE_CORP: {
            id: "ENTERPRISE_CORP",
            nombre: "Enterprise Corp ERP",
            nombreComercial: "TF Enterprise Corp ERP",
            precioRegularUsd: 1890,
            precioUsd: 1490,
            rucsMax: -1,
            rucsLabel: "RUCs Ilimitados",
            masivaLabel: "Multi-sucursal y multi-bodega en vivo (+$150/PC extra)",
            estacionesBase: 10,
            estacionesLabel: "10+ PCs escalables (+$150/PC extra)",
            modoLabel: "Multi-Sucursal y Multi-Bodega en Vivo + Red LAN/Nube",
            esEnterprise: true,
            permiteExtraSeats: true,
        },
    });

    const INSTALADORES_SO = congelarProfundo({
        windows: {
            id: "windows",
            etiqueta: "Windows (.exe)",
            modalId: "modalDescargaWindows",
            titulo: "Descargar para Windows 10 / 11 x64 (Instalador .exe — 66.2 MB)",
            badge: "INSTALADOR OFICIAL WINDOWS .EXE",
            archivo: "Setup_TributaFlow_ERP_v3.0.0.exe",
            tamano: "66.2 MB • Instalador Windows x64",
            url: "https://github.com/andresorellana305/tributaflow-portal/releases/download/v3.0.0/Setup_TributaFlow_ERP_v3.0.0.exe",
            sha256: "350a7f2cb1ba50a8cea87563b7e773357b5f8e9fa9d0f359401e0e9dc4c9e232",
            sha256Url: "https://github.com/andresorellana305/tributaflow-portal/releases/download/v3.0.0/SHA256SUMS.txt",
            comandoSha256: 'certutil -hashfile "Setup_TributaFlow_ERP_v3.0.0.exe" SHA256',
            alternativaId: "windows_zip",
            pasos: [
                "1. Descarga Setup_TributaFlow_ERP_v3.0.0.exe (66.2 MB) o la versión Portable .zip (86.3 MB).",
                "2. Verifica el SHA-256 oficial (350a7f2c...c4c9e232) con certutil antes de ejecutar.",
                "3. Ante Windows SmartScreen (ejecutable nuevo): haz clic en 'Más información' ➔ 'Ejecutar de todas formas'.",
            ],
        },
        windows_zip: {
            id: "windows_zip",
            etiqueta: "Windows Portable (.zip)",
            modalId: "modalDescargaWindowsZip",
            titulo: "Descargar para Windows 10 / 11 x64 (Portable .zip — 86.3 MB)",
            badge: "PORTABLE WINDOWS .ZIP",
            archivo: "TributaFlow_ERP_v3.0.0_Windows_x64.zip",
            tamano: "86.3 MB • Portable sin instalación",
            url: "https://github.com/andresorellana305/tributaflow-portal/releases/download/v3.0.0/TributaFlow_ERP_v3.0.0_Windows_x64.zip",
            sha256: "ca49bcd4eea13b496a618122aa742d5de5c898f176e7eda326ad2d8b33a0c051",
            sha256Url: "https://github.com/andresorellana305/tributaflow-portal/releases/download/v3.0.0/SHA256SUMS.txt",
            comandoSha256: 'certutil -hashfile "TributaFlow_ERP_v3.0.0_Windows_x64.zip" SHA256',
            pasos: [
                "1. Descarga y descomprime TributaFlow_ERP_v3.0.0_Windows_x64.zip (86.3 MB) en una carpeta local.",
                "2. Verifica el SHA-256 (ca49bcd4...33a0c051) antes de ejecutar TributaFlow_ERP.exe.",
                "3. Tus datos, claves SRI y firma .p12 quedan cifrados localmente con AES-256-GCM.",
            ],
        },
        macos: {
            id: "macos",
            etiqueta: "macOS (.dmg)",
            modalId: "modalDescargaMacos",
            titulo: "Descargar para macOS Universal (Apple Silicon / Intel — 93.6 MB)",
            badge: "IMAGEN OFICIAL MACOS .DMG",
            archivo: "TributaFlow_ERP_v3.0.0_macOS.dmg",
            tamano: "93.6 MB • Imagen de disco macOS",
            url: "https://github.com/andresorellana305/tributaflow-portal/releases/download/v3.0.0/TributaFlow_ERP_v3.0.0_macOS.dmg",
            sha256: "374e5ca4444b290662e417403ea0848bb77fe0215243fe52299743d7d8ad24df",
            sha256Url: "https://github.com/andresorellana305/tributaflow-portal/releases/download/v3.0.0/SHA256SUMS.txt",
            comandoSha256: "shasum -a 256 TributaFlow_ERP_v3.0.0_macOS.dmg",
            pasos: [
                "1. Abre TributaFlow_ERP_v3.0.0_macOS.dmg (93.6 MB) tras validar su SHA-256 (374e5ca4...d8ad24df) y arrastra a Aplicaciones.",
                "2. La primera vez, haz Control + clic sobre TributaFlow ERP y selecciona Abrir.",
                "3. Disfruta 7 días de evaluación gratuita con hasta 60 RUCs antes de activar tu suscripción anual.",
            ],
        },
        linux: {
            id: "linux",
            etiqueta: "Linux .deb",
            modalId: "modalDescargaLinux",
            titulo: "Descargar para Linux Debian / Ubuntu (.deb — 95.6 MB)",
            badge: "PAQUETE OFICIAL LINUX .DEB",
            archivo: "TributaFlow_ERP_v3.0.0_Linux_amd64.deb",
            tamano: "95.6 MB • Paquete Debian/Ubuntu amd64",
            url: "https://github.com/andresorellana305/tributaflow-portal/releases/download/v3.0.0/TributaFlow_ERP_v3.0.0_Linux_amd64.deb",
            sha256: "2c5e48ae14c8dfce3d3e5f975e236a93be663fd138ef6f81dcb9a4ec5c2d052a",
            sha256Url: "https://github.com/andresorellana305/tributaflow-portal/releases/download/v3.0.0/SHA256SUMS.txt",
            comandoSha256: "sha256sum TributaFlow_ERP_v3.0.0_Linux_amd64.deb",
            alternativaId: "linux_tar",
            pasos: [
                "1. Verifica el SHA-256 (2c5e48ae...5c2d052a) e instala con: sudo apt install ./TributaFlow_ERP_v3.0.0_Linux_amd64.deb",
                "2. Para otras distros (Fedora/Arch), usa el paquete genérico .tar.gz (123.3 MB).",
                "3. Opera con bóveda Local-First SQLite AES-256-GCM y transición segura a Solo Lectura al expirar.",
            ],
        },
        linux_tar: {
            id: "linux_tar",
            etiqueta: "Linux Genérico (.tar.gz)",
            modalId: "modalDescargaLinuxTar",
            titulo: "Descargar para Linux Genérico x64 (.tar.gz — 123.3 MB)",
            badge: "ARCHIVO LINUX .TAR.GZ",
            archivo: "TributaFlow_ERP_v3.0.0_Linux_x64.tar.gz",
            tamano: "123.3 MB • Distros Linux x64",
            url: "https://github.com/andresorellana305/tributaflow-portal/releases/download/v3.0.0/TributaFlow_ERP_v3.0.0_Linux_x64.tar.gz",
            sha256: "b4e5da23885fe7126dabe59a0120ef2fc688ad0a6124407a722bae4429c09b1b",
            sha256Url: "https://github.com/andresorellana305/tributaflow-portal/releases/download/v3.0.0/SHA256SUMS.txt",
            comandoSha256: "sha256sum TributaFlow_ERP_v3.0.0_Linux_x64.tar.gz",
            pasos: [
                "1. Valida el SHA-256 (b4e5da23...29c09b1b) y extrae con: tar -xzf TributaFlow_ERP_v3.0.0_Linux_x64.tar.gz",
                "2. Ejecuta TributaFlow_ERP desde la carpeta extraída sin requerir privilegios root.",
                "3. Accede a 7 días gratis con hasta 60 RUCs o activa tu archivo de licencia .lic.",
            ],
        },
        sha256sums: {
            id: "sha256sums",
            etiqueta: "SHA256SUMS.txt",
            modalId: "modalDescargaSha256",
            titulo: "Manifiesto Oficial de Sumas SHA-256 (v3.0.0)",
            badge: "VERIFICACIÓN SHA-256",
            archivo: "SHA256SUMS.txt",
            tamano: "Manifiesto Maestro v3.0.0 (111 B)",
            url: "https://github.com/andresorellana305/tributaflow-portal/releases/download/v3.0.0/SHA256SUMS.txt",
            sha256: "a86675219f227ab4831dfa34e00253fc735e161eef1fd0dc88a40c35f25685ba",
            sha256Url: "https://github.com/andresorellana305/tributaflow-portal/releases/download/v3.0.0/SHA256SUMS.txt",
            comandoSha256: "sha256sum -c SHA256SUMS.txt",
            pasos: [
                "1. Descarga SHA256SUMS.txt junto a tu instalador oficial v3.0.0.",
                "2. Verifica que el digest hexadecimal del paquete descargado sea idéntico al publicado.",
                "3. Canal oficial exclusivo QUORATEC: andresorellana305/tributaflow-portal.",
            ],
        },
    });

    const TEXTOS_LEGALES = congelarProfundo({
        terminos: {
            titulo: "Acuerdo de Licencia de Usuario Final y Condiciones de Uso — v3.0.0 (Edición 2026)",
            secciones: [
                {
                    sub: "1. Suscripción Anual (365 Días) y Política de Expiración Segura",
                    txt: "QUORATEC otorga una licencia anual de 365 días para TributaFlow ERP — Edición 2026 vinculada al identificador HWID: Personal Pro ($69/año, 1 PC, 3 RUCs), Contador Master ($159/año, 1 PC, 25 RUCs), Estudio Contable Pro ($379/año, 2 PCs Oficina+Casa, 60 RUCs), Enterprise Team ERP ($890/año, 5 PCs, RUCs ilimitados) y Enterprise Corp ERP ($1,490/año, 10+ PCs, RUCs ilimitados). Tras la prueba gratuita de 7 días o al vencer el año sin renovar, el sistema pasa a Modo Solo Lectura sin borrar datos locales.",
                },
                {
                    sub: "2. Deslinde Tributario y Responsabilidad Profesional",
                    txt: "TributaFlow ERP actúa como herramienta de asistencia, automatización contable y prevalidación documental ante el SRI. La revisión, declaración y cumplimiento tributario final corresponden al contribuyente o su contador; QUORATEC no asume multas, intereses ni contingencias por indisponibilidad o cambios externos de los servidores del SRI.",
                },
                {
                    sub: "3. Política de Pagos (Deuna!) y Reembolsos",
                    txt: "El canal de pago principal activo es Deuna! (y transferencia bancaria directa); PayPhone se encuentra temporalmente en actualización (Próximamente). Al disponerse de una prueba gratuita funcional de 7 días antes de comprar, no proceden devoluciones ni reembolsos una vez emitido el archivo .lic.",
                },
            ],
        },
        privacidad: {
            titulo: "Privacidad Local-First (AES-256-GCM) y Cumplimiento LOPDP Ecuador",
            secciones: [
                {
                    sub: "1. Cifrado AES-256-GCM y Cero Almacenamiento Central de Credenciales",
                    txt: "Bajo arquitectura Local-First, la base contable SQLite, tus claves del SRI en Línea y certificados de firma electrónica .p12 se cifran exclusivamente en tu equipo con AES-256-GCM. QUORATEC no recopila, almacena ni tiene acceso a tus credenciales tributarias.",
                },
                {
                    sub: "2. Cumplimiento LOPDP Ecuador y Nube Selectiva Oficina + Casa",
                    txt: "El tratamiento de datos personales de licenciamiento cumple estrictamente la Ley Orgánica de Protección de Datos Personales (LOPDP) del Ecuador. La sincronización selectiva Oficina + Casa vía Supabase RLS es opcional desde Estudio Contable Pro y bajo control directo del titular.",
                },
            ],
        },
        licenciamiento: {
            titulo: "Reembolsos, Traslado de Licencia y Soporte Oficial QUORATEC",
            secciones: [
                {
                    sub: "1. Actualizaciones Normativas SRI 2026 y Soporte Técnico",
                    txt: "Incluye actualizaciones normativas SRI (POS .p12, ATS, Form. 103/104, NIIF, EFOS) durante los 365 días de vigencia, más soporte oficial por WhatsApp (+593 99 645 9771) y correo (soportetributaflow@quoratec.com).",
                },
                {
                    sub: "2. Renovación, Modo Solo Lectura y Traslado sin Borrado de Datos",
                    txt: "Si tu licencia o prueba de 7 días expira, conservas acceso en Modo Solo Lectura sin pérdida de datos hasta cargar una nueva llave .lic. Ofrecemos soporte para traslado por cambio o daño de PC mediante respaldo .tfbkp.",
                },
            ],
        },
    });

    const PAYPHONE_URLS_OFICIALES = Object.freeze(
        Object.values(CONFIG_COMERCIAL.PAYPHONE_LINKS).filter((u) => typeof u === "string" && u.length > 0)
    );
    const URLS_DESCARGA_OFICIALES = Object.freeze(
        Object.values(INSTALADORES_SO).map((s) => s.url)
    );

    const PLAN_LOOKUP = crearMapaVacio();
    Object.keys(PLANES_V240).forEach((k) => {
        if (esClaveSegura(k)) PLAN_LOOKUP[k] = PLANES_V240[k];
    });

    const PLAN_ALIASES = crearMapaVacio();
    Object.assign(PLAN_ALIASES, {
        PERSONAL: "PERSONAL_PRO",
        CONTADOR: "CONTADOR_MASTER",
        CONTADOR15: "CONTADOR_MASTER",
        ESTUDIO: "ESTUDIO_PRO",
        EMPRESARIAL: "ESTUDIO_PRO",
        ENTERPRISE: "ENTERPRISE_CORP",
        ENTERPRISE_SERVER: "ENTERPRISE_CORP",
    });

    const SO_LOOKUP = crearMapaVacio();
    Object.keys(INSTALADORES_SO).forEach((k) => {
        if (esClaveSegura(k)) SO_LOOKUP[k] = INSTALADORES_SO[k];
    });

    let runtimeVersion = CONFIG_COMERCIAL.VERSION;
    let runtimeCorpExtraSeats = 1;
    let estadoModalPago = {
        planId: "ESTUDIO_PRO",
        extraSeats: 0,
        hwidORef: "",
    };

    const telemetriaInterna = {
        blockedUrls: 0,
        blockedMutations: 0,
        lastBlockedReason: "",
        lastBlockedValue: "",
        frameBlocked: false,
    };

    function registrarBloqueoSeguridad(razon, valor) {
        telemetriaInterna.blockedUrls += 1;
        telemetriaInterna.lastBlockedReason = String(razon || "INTEGRITY_CHECK");
        telemetriaInterna.lastBlockedValue = String(valor || "").slice(0, 140);
        window.__TF_LAST_BLOCKED_URL__ = telemetriaInterna.lastBlockedValue;
    }

    /* ======================================================================
       Validación estricta de URLs (Cero bypass por subdominio falso o esquema)
       ====================================================================== */
    function contieneCaracterControlOSchemeMalo(url) {
        if (typeof url !== "string") return true;
        const limpio = url.trim();
        if (!limpio || /[\u0000-\u001F\u007F\\]/.test(limpio)) return true;
        const lower = limpio.toLowerCase();
        return (
            lower.startsWith("javascript:") ||
            lower.startsWith("data:") ||
            lower.startsWith("vbscript:") ||
            lower.startsWith("file:")
        );
    }

    function parsearHttpsEstricta(url) {
        if (contieneCaracterControlOSchemeMalo(url)) return null;
        try {
            const parsed = new URL(url.trim());
            if (parsed.protocol !== "https:") return null;
            if (parsed.username !== "" || parsed.password !== "" || parsed.port !== "") {
                return null;
            }
            return parsed;
        } catch {
            return null;
        }
    }

    function esUrlPayphoneSegura(url) {
        const parsed = parsearHttpsEstricta(url);
        if (!parsed) return false;
        const host = parsed.hostname.toLowerCase();
        if (!CONFIG_COMERCIAL.DOMINIOS_PAYPHONE.includes(host)) return false;
        return PAYPHONE_URLS_OFICIALES.includes(url.trim());
    }

    function esUrlWhatsappSegura(url) {
        const parsed = parsearHttpsEstricta(url);
        if (!parsed) return false;
        if (parsed.hostname.toLowerCase() !== "wa.me") return false;
        return parsed.pathname === `/${CONFIG_COMERCIAL.WHATSAPP_NUMERO}`;
    }

    function esUrlWhatsappShareSegura(url) {
        const parsed = parsearHttpsEstricta(url);
        if (!parsed) return false;
        if (parsed.hostname.toLowerCase() !== "wa.me") return false;
        if (parsed.pathname !== "/" && parsed.pathname !== "") return false;
        const textParam = String(parsed.searchParams.get("text") || "");
        return (
            textParam.includes(CONFIG_COMERCIAL.URL_DESCARGAS_PORTAL) &&
            !textParam.toLowerCase().includes("github.com")
        );
    }

    function esUrlCorreoSegura(url) {
        if (contieneCaracterControlOSchemeMalo(url)) return false;
        const trimmed = url.trim();
        const prefijo = CONFIG_COMERCIAL.MAILTO_URL_PREFIX;
        if (!trimmed.startsWith(prefijo)) return false;
        const siguiente = trimmed.charAt(prefijo.length);
        if (siguiente !== "" && siguiente !== "?") return false;
        try {
            const parsed = new URL(trimmed);
            return (
                parsed.protocol === "mailto:" &&
                parsed.pathname.toLowerCase() === CONFIG_COMERCIAL.CORREO_SOPORTE
            );
        } catch {
            return false;
        }
    }

    function esUrlDescargaOficialSegura(url) {
        const parsed = parsearHttpsEstricta(url);
        if (!parsed) return false;
        if (parsed.hostname.toLowerCase() !== "github.com") return false;
        if (!parsed.pathname.startsWith(CONFIG_COMERCIAL.GITHUB_RELEASES_PREFIX)) return false;
        return URLS_DESCARGA_OFICIALES.includes(url.trim());
    }

    function esUrlPortalOficialSegura(url) {
        const parsed = parsearHttpsEstricta(url);
        if (!parsed) return false;
        return parsed.hostname.toLowerCase() === "tributaflow.quoratec.com";
    }

    function validarDestinoSeguro(url, tipo = "auto") {
        if (contieneCaracterControlOSchemeMalo(url)) return false;
        const limpio = String(url).trim();
        if (tipo === "payphone") return esUrlPayphoneSegura(limpio);
        if (tipo === "whatsapp") return esUrlWhatsappSegura(limpio);
        if (tipo === "whatsapp_share") return esUrlWhatsappShareSegura(limpio);
        if (tipo === "correo") return esUrlCorreoSegura(limpio);
        if (tipo === "download_release") return esUrlDescargaOficialSegura(limpio);
        if (tipo === "portal") return esUrlPortalOficialSegura(limpio);
        return (
            esUrlPayphoneSegura(limpio) ||
            esUrlWhatsappSegura(limpio) ||
            esUrlWhatsappShareSegura(limpio) ||
            esUrlCorreoSegura(limpio) ||
            esUrlDescargaOficialSegura(limpio) ||
            esUrlPortalOficialSegura(limpio)
        );
    }

    function asignarEnlaceSeguro(anchorEl, url, tipo) {
        if (!(anchorEl instanceof HTMLAnchorElement)) return false;
        anchorEl.setAttribute("data-tf-canal-seguro", tipo);
        if (!validarDestinoSeguro(url, tipo)) {
            anchorEl.removeAttribute("href");
            registrarBloqueoSeguridad("ASSIGN_INVALID_URL", url);
            mostrarToastCopia("⛔ Canal bloqueado por verificación de integridad.");
            return false;
        }
        anchorEl.setAttribute("href", url);
        if (tipo === "whatsapp" || tipo === "whatsapp_share" || tipo === "portal") {
            anchorEl.target = "_blank";
            anchorEl.rel = "noopener noreferrer";
        } else {
            anchorEl.removeAttribute("target");
            anchorEl.removeAttribute("rel");
        }
        return true;
    }

    /* ======================================================================
       Detección inteligente por Sistema Operativo (NO por pantalla táctil)
       ====================================================================== */
    function detectarInfoSistemaOperativo(envOverride) {
        const hasOverride = envOverride && typeof envOverride === "object";
        const nav = hasOverride
            ? envOverride
            : {
                  userAgent: navigator.userAgent || "",
                  platform: navigator.platform || "",
                  maxTouchPoints: Number(navigator.maxTouchPoints || 0),
                  uaDataPlatform:
                      navigator.userAgentData && navigator.userAgentData.platform
                          ? String(navigator.userAgentData.platform)
                          : "",
                  uaDataMobile: Boolean(navigator.userAgentData && navigator.userAgentData.mobile),
              };

        const ua = String(nav.userAgent || "").toLowerCase();
        const plat = String(nav.platform || "").toLowerCase();
        const uadPlat = String(nav.uaDataPlatform || "").toLowerCase();
        const touch = Number(nav.maxTouchPoints || 0);
        const uadMobile = Boolean(nav.uaDataMobile);

        // Windows SIEMPRE soportado (incluye laptops táctiles, 2-en-1, doble pantalla y tablets Windows)
        const esWindows =
            (/windows|win32|win64|wow64/.test(ua) || /win/.test(plat) || uadPlat === "windows") &&
            !/windows phone|iemobile/.test(ua);
        if (esWindows) {
            return congelarProfundo({
                id: "windows",
                etiqueta: "Windows",
                esMovil: false,
                soportado: true,
                instaladorId: "windows",
            });
        }

        // Android (smartphones y tablets, con o sin teclado externo)
        if (/android/.test(ua) || uadPlat === "android" || (/linux/.test(ua) && uadMobile)) {
            return congelarProfundo({
                id: "android",
                etiqueta: "Android",
                esMovil: true,
                soportado: false,
                instaladorId: null,
            });
        }

        // iPadOS (incluye iPad en "Solicitar sitio web para computadoras": Macintosh + maxTouchPoints > 1)
        const esIpad =
            /ipad/.test(ua) ||
            /ipad/.test(plat) ||
            uadPlat === "ipados" ||
            ((/macintosh|macintel|mac os x/.test(ua) || /mac/.test(plat)) && touch > 1);
        if (esIpad) {
            return congelarProfundo({
                id: "ipados",
                etiqueta: "iPadOS",
                esMovil: true,
                soportado: false,
                instaladorId: null,
            });
        }

        // iOS (iPhone / iPod)
        if (/iphone|ipod|crios|fxios/.test(ua) || uadPlat === "ios") {
            return congelarProfundo({
                id: "ios",
                etiqueta: "iOS",
                esMovil: true,
                soportado: false,
                instaladorId: null,
            });
        }

        // macOS de escritorio
        if (/macintosh|mac os x/.test(ua) || /mac/.test(plat) || uadPlat === "macos") {
            return congelarProfundo({
                id: "macos",
                etiqueta: "macOS",
                esMovil: false,
                soportado: true,
                instaladorId: "macos",
            });
        }

        // Linux de escritorio
        if (
            (/linux|x11|ubuntu|debian|fedora/.test(ua) || /linux/.test(plat) || uadPlat === "linux") &&
            !uadMobile
        ) {
            return congelarProfundo({
                id: "linux",
                etiqueta: "Linux",
                esMovil: false,
                soportado: true,
                instaladorId: "linux",
            });
        }

        if (/mobile|tablet|windows phone|iemobile/.test(ua) || uadMobile) {
            return congelarProfundo({
                id: "mobile",
                etiqueta: "Sistema Móvil",
                esMovil: true,
                soportado: false,
                instaladorId: null,
            });
        }

        return congelarProfundo({
            id: "windows",
            etiqueta: "Windows",
            esMovil: false,
            soportado: true,
            instaladorId: "windows",
        });
    }

    function detectarSistemaOperativo(envOverride) {
        return detectarInfoSistemaOperativo(envOverride).id;
    }

    function esSistemaOperativoSoportado(soIdOrEnv) {
        if (typeof soIdOrEnv === "string") {
            return Boolean(esClaveSegura(soIdOrEnv) && SO_LOOKUP[soIdOrEnv]);
        }
        return detectarInfoSistemaOperativo(soIdOrEnv).soportado;
    }

    /* ======================================================================
       Utilidades comerciales y sanitización estricta
       ====================================================================== */
    function sanitizarIdentificador(valor) {
        return String(valor || "")
            .toUpperCase()
            .replace(/[^A-Z0-9-]/g, "")
            .slice(0, 32);
    }

    function sanitizarNombrePlano(valor) {
        return String(valor || "")
            .replace(/[<>"'`\\]/g, "")
            .trim()
            .slice(0, 64);
    }

    function extraerCodigoCorto(valor) {
        const limpio = String(valor || "")
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "");
        return limpio.slice(0, 8) || "WEB01";
    }

    function formatearUsd(monto) {
        return `$${Number(monto).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    function obtenerPrefijoRuta() {
        return document.body && document.body.getAttribute("data-root") ? "../" : "";
    }

    function obtenerSrcQrDeuna() {
        return obtenerPrefijoRuta() === "../"
            ? CONFIG_COMERCIAL.QR_DEUNA_SUBPAGE_SRC
            : CONFIG_COMERCIAL.QR_DEUNA_SRC;
    }

    function resolverPlan(planRaw) {
        const norm = String(planRaw || "")
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9_]/g, "");
        if (esClaveSegura(norm) && PLAN_LOOKUP[norm]) {
            return norm;
        }
        if (esClaveSegura(norm) && PLAN_ALIASES[norm]) {
            const aliasTarget = PLAN_ALIASES[norm];
            if (PLAN_LOOKUP[aliasTarget]) return aliasTarget;
        }
        return "ESTUDIO_PRO";
    }

    function calcularResumenCheckout() {
        const plan =
            (esClaveSegura(estadoModalPago.planId) && PLAN_LOOKUP[estadoModalPago.planId]) ||
            PLAN_LOOKUP.ESTUDIO_PRO;
        const extras = plan.permiteExtraSeats
            ? Math.max(0, Math.min(50, Number(estadoModalPago.extraSeats || 0)))
            : 0;
        const totalUsd = plan.precioUsd + extras * CONFIG_COMERCIAL.PRECIO_SEAT_EXTRA_USD;
        const estacionesTotales = plan.estacionesBase + extras;
        const hwidCorto = extraerCodigoCorto(estadoModalPago.hwidORef);
        const referencia = `TF-${plan.id}-${hwidCorto}`;

        return {
            plan,
            extras,
            totalUsd,
            montoTexto: formatearUsd(totalUsd),
            estacionesTotales,
            referencia,
            hwidORef: estadoModalPago.hwidORef || "SIN_ESPECIFICAR",
            urlPayphone: null,
        };
    }

    function crearEl(tag, className, text) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (text !== undefined && text !== null) el.textContent = text;
        return el;
    }

    function mostrarToastCopia(texto) {
        let toast = document.getElementById("tfCopyToast");
        if (!toast) {
            toast = crearEl("div", "copy-toast");
            toast.id = "tfCopyToast";
            toast.setAttribute("role", "status");
            toast.setAttribute("aria-live", "polite");
            document.body.appendChild(toast);
        }
        toast.textContent = String(texto || "");
        toast.style.display = "block";
        clearTimeout(toast._timerId);
        toast._timerId = setTimeout(() => {
            toast.style.display = "none";
        }, 2500);
    }

    function copiarAlPortapapeles(valor, etiqueta) {
        const limpio = String(valor || "").trim();
        if (!limpio) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard
                .writeText(limpio)
                .then(() => mostrarToastCopia(`✓ ${etiqueta} copiado: ${limpio}`))
                .catch(() => mostrarToastCopia(`${etiqueta}: ${limpio}`));
        } else {
            mostrarToastCopia(`${etiqueta}: ${limpio}`);
        }
    }

    function construirUrlWhatsapp(texto) {
        return `https://wa.me/${CONFIG_COMERCIAL.WHATSAPP_NUMERO}?text=${encodeURIComponent(texto)}`;
    }

    function construirUrlWhatsappShareDesktop() {
        const mensaje = `Descargar TributaFlow ERP v${runtimeVersion} (Edición 2026) en mi computadora (Windows, macOS o Linux): ${CONFIG_COMERCIAL.URL_DESCARGAS_PORTAL}`;
        return `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    }

    function construirUrlMailto(asunto, cuerpo) {
        return (
            `mailto:${CONFIG_COMERCIAL.CORREO_SOPORTE}` +
            `?subject=${encodeURIComponent(asunto)}` +
            `&body=${encodeURIComponent(cuerpo)}`
        );
    }

    function construirPlantillaComprobante(resumen, metodoPago) {
        const { plan, extras, montoTexto, estacionesTotales, referencia, hwidORef } = resumen;
        const hwidTexto =
            hwidORef && hwidORef !== "SIN_ESPECIFICAR" ? hwidORef : "[Pegar código TF-XXXXXX-...]";
        const detalleEstaciones =
            extras > 0
                ? `${estacionesTotales} PCs (${plan.estacionesBase} base + ${extras} adicionales)`
                : estacionesTotales === 1
                  ? "1 PC"
                  : `${estacionesTotales} PCs`;
        const asunto = `[TRIBUTAFLOW ERP] Activación Licencia Anual ${referencia} (${metodoPago})`;
        const campoComprobante = "• N.º de Comprobante / Autorización bancaria Deuna! (OBLIGATORIO): [Escribir número de transacción]";
        const lineaHwidsAdicionales =
            Number(estacionesTotales) >= 2
                ? "\n• Código HWID PC(s) Adicional(es): [Pegar códigos HWID adicionales]"
                : "";
        const cuerpo =
            `[TRIBUTAFLOW ERP v${runtimeVersion}] Hola equipo de QUORATEC, envío mi comprobante de pago real para activar mi licencia anual:\n\n` +
            `• Plan seleccionado: ${plan.nombreComercial}\n` +
            `• Monto USD anual: ${montoTexto} USD / año\n` +
            `• Estaciones autorizadas: ${detalleEstaciones}\n` +
            `• Método de pago: ${metodoPago}\n` +
            `• Referencia de orden: ${referencia}\n` +
            `${campoComprobante}\n` +
            `• Código HWID de tu PC (TributaFlow ERP -> Activar Licencia): ${hwidTexto}` +
            `${lineaHwidsAdicionales}\n\n` +
            `Datos para emisión de licencia (.lic):\n` +
            `• RUC o Cédula: [Escribir RUC/Cédula]\n` +
            `• Nombre / Razón Social: [Escribir nombre o empresa]\n` +
            `• Correo para recibir tu archivo .lic: [Escribir correo]\n\n` +
            `⚠️ Adjunta la captura o PDF del comprobante. El archivo .lic se emite solo tras verificar el abono real (no reembolsable tras su emisión).`;
        return { asunto, cuerpo };
    }

    function construirPlantillaSoporte(planNombre, referencia) {
        const asunto = CONFIG_COMERCIAL.ASUNTO_SOPORTE;
        const detallePlan = planNombre ? `\n• Plan consultado: ${sanitizarNombrePlano(planNombre)}` : "";
        const detalleRef = referencia ? `\n• Referencia de consulta: ${sanitizarIdentificador(referencia)}` : "";
        const cuerpo =
            `${asunto}\n\n` +
            `Hola equipo de QUORATEC (TributaFlow ERP), tengo una consulta técnica o comercial (sin envío de comprobante):` +
            `${detallePlan}${detalleRef}\n` +
            `• Detalle de mi consulta: [Escribir consulta técnica o comercial]`;
        return { asunto, cuerpo };
    }

    function vincularCopiaCorreo(anchorEl, obtenerPlantillaFn) {
        if (!(anchorEl instanceof HTMLAnchorElement) || anchorEl.dataset.copyMailBound === "1") return;
        anchorEl.dataset.copyMailBound = "1";
        anchorEl.addEventListener("click", () => {
            const { asunto, cuerpo } = obtenerPlantillaFn();
            const respaldo = `Para: ${CONFIG_COMERCIAL.CORREO_SOPORTE}\nAsunto: ${asunto}\n\n${cuerpo}`;
            copiarAlPortapapeles(respaldo, `Plantilla (${CONFIG_COMERCIAL.CORREO_SOPORTE})`);
        });
    }

    /* ======================================================================
       Modales: Checkout, Descarga PC (Windows/macOS/Linux), Móvil Bloqueado, Legal
       ====================================================================== */
    function cerrarModal(id) {
        const el = document.getElementById(id);
        if (el instanceof HTMLElement) el.style.display = "none";
    }

    function asegurarBotonFlotanteSoporte() {
        if (document.getElementById("btnFlotanteSoporte")) return;
        const btn = crearEl("a", "whatsapp-float", "💬 Soporte QUORATEC");
        btn.id = "btnFlotanteSoporte";
        const { cuerpo } = construirPlantillaSoporte(`TributaFlow ERP v${runtimeVersion}`, "");
        asignarEnlaceSeguro(btn, construirUrlWhatsapp(cuerpo), "whatsapp");
        document.body.appendChild(btn);
    }

    function asegurarModalMovilBloqueado() {
        if (document.getElementById("modalMovilBloqueado")) return;

        const overlay = crearEl("div", "modal-overlay");
        overlay.id = "modalMovilBloqueado";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-labelledby", "modalMovilTitulo");

        const box = crearEl("div", "modal-box modal-narrow");
        const top = crearEl("div", "modal-top");
        const tw = crearEl("div");
        tw.appendChild(crearEl("span", "modal-badge", `INSTALACIÓN EN COMPUTADORA v${runtimeVersion}`));
        const h3 = crearEl("h3", "", "Descarga Disponible para PC (Windows, macOS o Linux)");
        h3.id = "modalMovilTitulo";
        tw.appendChild(h3);

        const btnClose = crearEl("button", "btn-close", "×");
        btnClose.type = "button";
        btnClose.setAttribute("aria-label", "Cerrar aviso de descarga en móvil");
        btnClose.addEventListener("click", () => cerrarModal("modalMovilBloqueado"));
        top.appendChild(tw);
        top.appendChild(btnClose);

        const content = crearEl("div", "modal-content");
        const heroBox = crearEl("div", "mobile-block-hero");
        const osPill = crearEl("span", "mobile-os-pill", "Sistema detectado: Dispositivo móvil");
        osPill.id = "modalMovilOsPill";
        const msg = crearEl(
            "p",
            "",
            "Tu dispositivo utiliza un sistema móvil (Android / iOS / iPadOS) que no admite instaladores de computadora. Puedes explorar toda la web, comparar planes y activar tu licencia desde aquí, o guardar el enlace oficial para abrirlo en tu PC Windows, macOS o Linux."
        );
        heroBox.appendChild(osPill);
        heroBox.appendChild(msg);

        const urlChip = crearEl("div", "mobile-url-chip", CONFIG_COMERCIAL.URL_DESCARGAS_PORTAL);
        urlChip.id = "modalMovilUrlChip";

        const actions = crearEl("div", "mobile-actions-stack");
        const btnWpShare = crearEl("a", "btn-wp-confirm", "📲 Enviar enlace a mi WhatsApp");
        btnWpShare.id = "btnMovilEnviarWp";
        asignarEnlaceSeguro(btnWpShare, construirUrlWhatsappShareDesktop(), "whatsapp_share");

        const btnCopyUrl = crearEl("button", "btn-email-confirm", "📋 Copiar enlace oficial");
        btnCopyUrl.type = "button";
        btnCopyUrl.id = "btnMovilCopiarEnlace";
        btnCopyUrl.addEventListener("click", () => {
            copiarAlPortapapeles(CONFIG_COMERCIAL.URL_DESCARGAS_PORTAL, "Enlace oficial");
        });

        actions.appendChild(btnWpShare);
        actions.appendChild(btnCopyUrl);

        content.appendChild(heroBox);
        content.appendChild(urlChip);
        content.appendChild(actions);

        box.appendChild(top);
        box.appendChild(content);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    }

    function abrirModalMovilBloqueado(soInfo) {
        asegurarModalMovilBloqueado();
        const osPill = document.getElementById("modalMovilOsPill");
        if (osPill instanceof HTMLElement) {
            const nombreOs = (soInfo && soInfo.etiqueta) || "Dispositivo Móvil";
            osPill.textContent = `Sistema detectado: ${nombreOs} (Solo explorador web y activación)`;
        }
        const btnWpShare = document.getElementById("btnMovilEnviarWp");
        if (btnWpShare instanceof HTMLAnchorElement) {
            asignarEnlaceSeguro(btnWpShare, construirUrlWhatsappShareDesktop(), "whatsapp_share");
        }
        const modal = document.getElementById("modalMovilBloqueado");
        if (modal instanceof HTMLElement) modal.style.display = "flex";
    }

    function asegurarModalDescargaSO(soMeta) {
        if (!soMeta || document.getElementById(soMeta.modalId)) return;

        const overlay = crearEl("div", "modal-overlay");
        overlay.id = soMeta.modalId;
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");

        const box = crearEl("div", "modal-box modal-narrow");
        const top = crearEl("div", "modal-top");
        const tw = crearEl("div");
        tw.appendChild(crearEl("span", "modal-badge", soMeta.badge));
        tw.appendChild(crearEl("h3", "", soMeta.titulo));

        const btnClose = crearEl("button", "btn-close", "×");
        btnClose.type = "button";
        btnClose.setAttribute("aria-label", `Cerrar descarga ${soMeta.id}`);
        btnClose.addEventListener("click", () => cerrarModal(soMeta.modalId));
        top.appendChild(tw);
        top.appendChild(btnClose);

        const content = crearEl("div", "modal-content");
        const metaBox = crearEl("div", "bank-rows");
        const r1 = crearEl("div", "bank-row");
        r1.appendChild(crearEl("span", "", "Instalador:"));
        r1.appendChild(crearEl("strong", "mono", soMeta.archivo));
        const r2 = crearEl("div", "bank-row");
        r2.appendChild(crearEl("span", "", "Versión / Paquete:"));
        r2.appendChild(crearEl("strong", "", `v${runtimeVersion} • ${soMeta.tamano}`));
        metaBox.appendChild(r1);
        metaBox.appendChild(r2);

        const shaBox = crearEl("div", "os-sha-box");
        const shaHead = crearEl("div", "os-sha-head");
        shaHead.appendChild(crearEl("span", "os-sha-label", "Verificación SHA-256 Oficial:"));
        const btnCopySha = crearEl("button", "btn-sha-copy", "📋 Copiar SHA-256");
        btnCopySha.type = "button";
        btnCopySha.addEventListener("click", () => {
            copiarAlPortapapeles(soMeta.sha256, `SHA-256 ${soMeta.etiqueta}`);
        });
        shaHead.appendChild(btnCopySha);
        const shaCode = crearEl("code", "os-sha-code", soMeta.sha256);
        shaCode.setAttribute("data-modal-sha256", soMeta.id);
        const verifyCmd = crearEl("code", "os-verify-cmd", soMeta.comandoSha256);
        shaBox.appendChild(shaHead);
        shaBox.appendChild(shaCode);
        shaBox.appendChild(verifyCmd);

        const lista = crearEl("ul", "plan-list");
        soMeta.pasos.forEach((p) => lista.appendChild(crearEl("li", "ok", p)));

        const notaEdicion = crearEl(
            "div",
            "enterprise-lan-notice",
            "Incluye 7 días de evaluación gratuita con hasta 60 RUCs (modalidad Estudio Contable Pro, sin tarjeta). Al expirar, transiciona de forma segura a Modo Solo Lectura sin borrar datos locales hasta activar tu archivo .lic."
        );

        const btnDownload = crearEl("a", "btn-glow", `⬇ Descargar ${soMeta.archivo}`);
        btnDownload.setAttribute("data-download-direct", soMeta.id);
        btnDownload.setAttribute("download", soMeta.archivo);
        asignarEnlaceSeguro(btnDownload, soMeta.url, "download_release");

        content.appendChild(metaBox);
        content.appendChild(shaBox);
        content.appendChild(lista);
        content.appendChild(notaEdicion);
        content.appendChild(btnDownload);

        box.appendChild(top);
        box.appendChild(content);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    }

    function abrirModalDescargaSO(soId) {
        const soInfo = detectarInfoSistemaOperativo();
        if (soInfo.esMovil || !soInfo.soportado) {
            abrirModalMovilBloqueado(soInfo);
            return;
        }
        const clave =
            soId && soId !== "auto" && esClaveSegura(soId) && SO_LOOKUP[soId]
                ? soId
                : soInfo.instaladorId || "windows";
        const soMeta = SO_LOOKUP[clave] || INSTALADORES_SO.windows;
        asegurarModalDescargaSO(soMeta);
        const modal = document.getElementById(soMeta.modalId);
        if (modal instanceof HTMLElement) modal.style.display = "flex";
    }

    const estadoHibrido = {
        mode: "guest",
        gateway: "DEUNA_PERSONAL",
        accessToken: null,
        userEmail: null,
        lastOrder: null,
    };

    function sanitizarCorreoInput(val) {
        return String(val || "").trim().toLowerCase().slice(0, 120);
    }

    function sanitizarRazonInput(val) {
        return String(val || "").replace(/[<>`"'$]/g, "").slice(0, 120);
    }

    async function calcularSha256Archivo(fileObj) {
        if (!fileObj || typeof fileObj.arrayBuffer !== "function") return null;
        if (typeof crypto === "undefined" || !crypto.subtle) return null;
        try {
            const buf = await fileObj.arrayBuffer();
            const digest = await crypto.subtle.digest("SHA-256", buf);
            return Array.from(new Uint8Array(digest))
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("");
        } catch {
            return null;
        }
    }

    async function postJsonSeguroApi(endpoint, payload, bearerToken) {
        if (typeof window.fetch !== "function") {
            return { ok: false, offline: true, error: "FETCH_UNAVAILABLE" };
        }
        const headers = { "Content-Type": "application/json" };
        if (bearerToken) headers.Authorization = `Bearer ${bearerToken}`;
        try {
            const resp = await fetch(`${obtenerPrefijoRuta()}${endpoint.replace(/^\//, "")}`, {
                method: "POST",
                headers,
                credentials: "same-origin",
                body: JSON.stringify(payload),
            });
            const data = await resp.json().catch(() => ({}));
            return { ok: resp.ok, status: resp.status, data };
        } catch {
            return { ok: false, offline: true, error: "NETWORK_UNAVAILABLE" };
        }
    }

    function asegurarModalPago() {
        if (document.getElementById("modalPago")) return;

        const overlay = crearEl("div", "modal-overlay");
        overlay.id = "modalPago";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");

        const box = crearEl("div", "modal-box");
        const top = crearEl("div", "modal-top");
        const titleWrap = crearEl("div");
        const badge = crearEl("span", "modal-badge", `ACTIVACIÓN OFICIAL QUORATEC — TRIBUTAFLOW ERP v${runtimeVersion}`);
        badge.id = "pagoModalBadge";
        const h3 = crearEl("h3", "", "Adquirir Plan Anual");
        h3.id = "pagoModalTitulo";
        titleWrap.appendChild(badge);
        titleWrap.appendChild(h3);

        const btnClose = crearEl("button", "btn-close", "×");
        btnClose.type = "button";
        btnClose.setAttribute("aria-label", "Cerrar modal de pago");
        btnClose.addEventListener("click", () => cerrarModal("modalPago"));
        top.appendChild(titleWrap);
        top.appendChild(btnClose);

        const content = crearEl("div", "modal-content");

        const summary = crearEl("div", "checkout-summary");
        const sumLeft = crearEl("div");
        const lblResumenPlan = crearEl("strong", "", "TF Estudio Pro • Hasta 60 RUCs • Hasta 2 PCs (Oficina + Casa)");
        lblResumenPlan.id = "pagoResumenMeta";
        const lblDescVig = crearEl("small", "", "Suscripción anual (365 días) + Actualizaciones SRI 2026 incluidas");
        lblDescVig.style.display = "block";
        lblDescVig.style.color = "#cbd5e1";
        sumLeft.appendChild(lblResumenPlan);
        sumLeft.appendChild(lblDescVig);

        const amountEl = crearEl("div", "checkout-amount", "$379.00");
        amountEl.id = "pagoMontoTotal";
        summary.appendChild(sumLeft);
        summary.appendChild(amountEl);

        const controlsGrid = crearEl("div", "checkout-controls-grid");

        const gPlan = crearEl("div", "field-group");
        const lPlan = crearEl("label", "", "Plan Seleccionado:");
        lPlan.htmlFor = "pagoPlanSelect";
        const selPlan = crearEl("select", "text-input");
        selPlan.id = "pagoPlanSelect";
        Object.values(PLANES_V240).forEach((p) => {
            const opt = document.createElement("option");
            opt.value = p.id;
            opt.textContent = `${p.nombre} — ${formatearUsd(p.precioUsd)} USD/año`;
            selPlan.appendChild(opt);
        });
        selPlan.addEventListener("change", () => {
            estadoModalPago.planId = resolverPlan(selPlan.value);
            const planSel = PLAN_LOOKUP[estadoModalPago.planId];
            if (!planSel || !planSel.permiteExtraSeats) {
                estadoModalPago.extraSeats = 0;
            }
            actualizarVistaModalPago();
        });
        gPlan.appendChild(lPlan);
        gPlan.appendChild(selPlan);

        const gHwid = crearEl("div", "field-group");
        const lHwid = crearEl("label", "", "HWID del Equipo (o RUC/Empresa si aún no instalas):");
        lHwid.htmlFor = "pagoHwidInput";
        const inHwid = crearEl("input", "mono-input");
        inHwid.type = "text";
        inHwid.id = "pagoHwidInput";
        inHwid.placeholder = `Ej: A1B2-C3D4-E5F6 o RUC ${CONFIG_COMERCIAL.DEMO_RUC_PRINCIPAL}`;
        inHwid.maxLength = 32;
        inHwid.addEventListener("input", (e) => {
            const target = e.target;
            if (!(target instanceof HTMLInputElement)) return;
            const limpio = sanitizarIdentificador(target.value);
            target.value = limpio;
            estadoModalPago.hwidORef = limpio;
            actualizarVistaModalPago();
        });
        gHwid.appendChild(lHwid);
        gHwid.appendChild(inHwid);

        controlsGrid.appendChild(gPlan);
        controlsGrid.appendChild(gHwid);

        const extraBar = crearEl("div", "extra-seats-bar");
        extraBar.id = "pagoExtraSeatsBar";
        const extraLabel = crearEl(
            "span",
            "",
            "Estaciones adicionales +1 PC sin límite (+$150.00/año c/u sobre 10 base):"
        );
        const stepper = crearEl("div", "seats-stepper");
        const btnMenos = crearEl("button", "", "−");
        btnMenos.type = "button";
        btnMenos.setAttribute("aria-label", "Restar estación adicional");
        const numInput = crearEl("input", "mono-input");
        numInput.type = "number";
        numInput.id = "pagoExtraSeatsInput";
        numInput.min = "0";
        numInput.max = "50";
        numInput.value = "0";
        numInput.style.width = "68px";
        numInput.style.textAlign = "center";
        numInput.setAttribute("aria-label", "Cantidad de PCs adicionales");
        const btnMas = crearEl("button", "", "+");
        btnMas.type = "button";
        btnMas.setAttribute("aria-label", "Sumar estación adicional");
        const lblEstTotales = crearEl("strong", "", "10 PCs totales");
        lblEstTotales.id = "pagoEstacionesTotales";

        btnMenos.addEventListener("click", () => {
            estadoModalPago.extraSeats = Math.max(0, estadoModalPago.extraSeats - 1);
            actualizarVistaModalPago();
        });
        btnMas.addEventListener("click", () => {
            estadoModalPago.extraSeats = Math.min(50, estadoModalPago.extraSeats + 1);
            actualizarVistaModalPago();
        });
        numInput.addEventListener("input", () => {
            const parsed = parseInt(numInput.value || "0", 10);
            estadoModalPago.extraSeats = Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(50, parsed));
            actualizarVistaModalPago();
        });

        stepper.appendChild(btnMenos);
        stepper.appendChild(numInput);
        stepper.appendChild(btnMas);
        stepper.appendChild(lblEstTotales);
        extraBar.appendChild(extraLabel);
        extraBar.appendChild(stepper);

        const refBanner = crearEl("div", "ref-banner");
        const refLeft = crearEl("div");
        refLeft.appendChild(crearEl("span", "", "Referencia Única de Pago: "));
        const refCodeEl = crearEl("span", "ref-code", "TF-ESTUDIO_PRO-WEB01");
        refCodeEl.id = "pagoReferenciaTexto";
        refLeft.appendChild(refCodeEl);
        const btnCopyRef = crearEl("button", "btn-copy-mini", "📋 Copiar Referencia");
        btnCopyRef.type = "button";
        btnCopyRef.addEventListener("click", () => {
            copiarAlPortapapeles(calcularResumenCheckout().referencia, "Referencia de Pago");
        });
        refBanner.appendChild(refLeft);
        refBanner.appendChild(btnCopyRef);

        // Selector Híbrido: Modo Invitado (order_token) vs Cuenta Supabase + 4 Pasarelas
        const hybridTabs = crearEl("div", "hybrid-tabs-bar");
        const tabGuestBtn = crearEl("button", "hybrid-tab-btn is-active", "⚡ Compra Rápida (Invitado)");
        tabGuestBtn.type = "button";
        tabGuestBtn.id = "hybridTabGuestBtn";
        const tabAccountBtn = crearEl("button", "hybrid-tab-btn", "🔐 Usar / Crear Cuenta Supabase");
        tabAccountBtn.type = "button";
        tabAccountBtn.id = "hybridTabAccountBtn";
        hybridTabs.appendChild(tabGuestBtn);
        hybridTabs.appendChild(tabAccountBtn);

        const hybridGuestPanel = crearEl("div", "hybrid-panel");
        hybridGuestPanel.id = "hybridGuestPanel";
        hybridGuestPanel.appendChild(
            crearEl(
                "small",
                "muted-note",
                "Modo Invitado sin contraseña previa: ingresa tu Correo, RUC/Cédula y Nombre/Razón Social para generar tu order_token criptográfico único."
            )
        );
        const guestFields = crearEl("div", "hybrid-form-grid");
        const mkField = (id, label, placeholder, type = "text", maxLen = 120) => {
            const g = crearEl("div", "field-group");
            const l = crearEl("label", "", label);
            l.htmlFor = id;
            const inp = crearEl("input", "text-input");
            inp.type = type;
            inp.id = id;
            inp.placeholder = placeholder;
            inp.maxLength = maxLen;
            g.appendChild(l);
            g.appendChild(inp);
            return { g, inp };
        };
        const fEmail = mkField("checkoutEmailInput", "Correo Electrónico *", "contador@estudio.ec", "email", 120);
        const fRuc = mkField("checkoutRucInput", "RUC / Cédula Ecuador *", "1790012345001", "text", 13);
        const fRazon = mkField("checkoutRazonInput", "Nombre o Razón Social *", "ESTUDIO CONTABLE DEMO S.A.", "text", 120);
        fEmail.inp.addEventListener("input", () => {
            fEmail.inp.value = sanitizarCorreoInput(fEmail.inp.value);
        });
        fRuc.inp.addEventListener("input", () => {
            fRuc.inp.value = fRuc.inp.value.replace(/\D/g, "").slice(0, 13);
        });
        fRazon.inp.addEventListener("input", () => {
            fRazon.inp.value = sanitizarRazonInput(fRazon.inp.value);
        });
        guestFields.appendChild(fEmail.g);
        guestFields.appendChild(fRuc.g);
        guestFields.appendChild(fRazon.g);
        hybridGuestPanel.appendChild(guestFields);

        const hybridAccountBox = crearEl("div", "hybrid-panel");
        hybridAccountBox.id = "hybridAccountPanel";
        hybridAccountBox.style.display = "none";
        hybridAccountBox.appendChild(
            crearEl(
                "small",
                "muted-note",
                "Autenticación segura Supabase Auth (contraseñas cifradas en servidor). Consulta órdenes, licencias y equipos +1 PC Adicional."
            )
        );
        const accBtnRow = crearEl("div", "flex-wrap-actions");
        const accStatusText = crearEl("span", "muted-note", "Sesión no iniciada");
        accStatusText.id = "checkoutAccountStatus";
        const btnOpenSupaAuth = crearEl("button", "btn-glass", "🔐 Iniciar Sesión / Crear Cuenta Supabase");
        btnOpenSupaAuth.type = "button";
        btnOpenSupaAuth.addEventListener("click", () => {
            asegurarModalCuenta("account");
        });
        accBtnRow.appendChild(btnOpenSupaAuth);
        accBtnRow.appendChild(accStatusText);
        hybridAccountBox.appendChild(accBtnRow);

        tabGuestBtn.addEventListener("click", () => {
            estadoHibrido.mode = "guest";
            tabGuestBtn.classList.add("is-active");
            tabAccountBtn.classList.remove("is-active");
            hybridAccountBox.style.display = "none";
        });
        tabAccountBtn.addEventListener("click", () => {
            estadoHibrido.mode = "account";
            tabAccountBtn.classList.add("is-active");
            tabGuestBtn.classList.remove("is-active");
            hybridAccountBox.style.display = "flex";
        });

        // Selector de 4 Pasarelas (2 Activas ahora + 2 Próximamente con Feature Flags)
        const gatewayGrid = crearEl("div", "gateway-selector-grid");
        const gatewaysMeta = [
            { id: "DEUNA_PERSONAL", title: "Deuna! Personal (Pichincha)", badge: "Activo · 0 %", cls: "active is-selected", disabled: false },
            { id: "TRANSFERENCIA", title: "Transferencia Bancaria", badge: "Activo · Ecuador", cls: "active", disabled: false },
            { id: "DEUNA_NEGOCIOS", title: "Deuna! Negocios API", badge: "Próximamente", cls: "soon is-soon", disabled: true },
            { id: "PAYPHONE_BUSINESS", title: "PayPhone Business", badge: "Próximamente", cls: "soon is-soon", disabled: true },
        ];
        const gatewayButtons = [];
        gatewaysMeta.forEach((gw) => {
            const btnGw = crearEl("button", `gateway-option-card ${gw.cls}`);
            btnGw.type = "button";
            btnGw.disabled = gw.disabled;
            btnGw.setAttribute("data-gateway-id", gw.id);
            const tag = crearEl("span", `gateway-status-tag ${gw.disabled ? "soon" : "active"}`, gw.badge);
            const lbl = crearEl("strong", "", gw.title);
            btnGw.appendChild(tag);
            btnGw.appendChild(lbl);
            if (!gw.disabled) {
                btnGw.addEventListener("click", () => {
                    estadoHibrido.gateway = gw.id;
                    gatewayButtons.forEach((b) => b.classList.remove("is-selected"));
                    btnGw.classList.add("is-selected");
                });
            }
            gatewayButtons.push(btnGw);
            gatewayGrid.appendChild(btnGw);
        });

        const orderActionRow = crearEl("div", "flex-wrap-actions mt-8");
        const btnCrearOrden = crearEl("button", "btn-glow", "🛡️ Generar Orden Oficial y Token de Seguimiento ➔");
        btnCrearOrden.type = "button";
        btnCrearOrden.id = "btnCrearOrdenHibrida";
        orderActionRow.appendChild(btnCrearOrden);

        const orderResultBox = crearEl("div", "receipt-upload-box");
        orderResultBox.id = "checkoutOrderResultBox";
        orderResultBox.style.display = "none";

        const receiptUploadWrap = crearEl("div", "receipt-upload-box");
        receiptUploadWrap.appendChild(
            crearEl("strong", "", "Subir Referencia o Comprobante Deuna! / Transferencia (estado: pendiente_verificacion)")
        );
        const recGrid = crearEl("div", "hybrid-form-grid");
        const fVoucher = mkField("checkoutVoucherInput", "Nº de Comprobante / Referencia *", "PICH-998877", "text", 40);
        const fFileWrap = crearEl("div", "field-group");
        const fFileLbl = crearEl("label", "", "Adjuntar Imagen / PDF (opcional)");
        fFileLbl.htmlFor = "checkoutReceiptFile";
        const fFile = document.createElement("input");
        fFile.type = "file";
        fFile.id = "checkoutReceiptFile";
        fFile.accept = ".png,.jpg,.jpeg,.webp,.pdf";
        fFile.className = "text-input";
        fFileWrap.appendChild(fFileLbl);
        fFileWrap.appendChild(fFile);
        recGrid.appendChild(fVoucher.g);
        recGrid.appendChild(fFileWrap);

        const btnEnviarComprobanteApi = crearEl("button", "btn-open-checkout", "📤 Registrar Comprobante (Pendiente de Verificación)");
        btnEnviarComprobanteApi.type = "button";
        btnEnviarComprobanteApi.id = "btnEnviarComprobanteApi";
        const receiptApiFeedback = crearEl("small", "muted-note", "");
        receiptApiFeedback.id = "checkoutReceiptFeedback";

        receiptUploadWrap.appendChild(recGrid);
        receiptUploadWrap.appendChild(btnEnviarComprobanteApi);
        receiptUploadWrap.appendChild(receiptApiFeedback);

        btnCrearOrden.addEventListener("click", async () => {
            const emailVal = sanitizarCorreoInput(fEmail.inp.value);
            const rucVal = String(fRuc.inp.value || "").trim();
            const razonVal = sanitizarRazonInput(fRazon.inp.value).trim();
            if (!emailVal || !emailVal.includes("@") || !/^\d{10}(\d{3})?$/.test(rucVal) || razonVal.length < 2) {
                mostrarToastCopia("⚠️ Completa Correo válido, RUC/Cédula (10 o 13 dígitos) y Razón Social.");
                return;
            }
            const res = calcularResumenCheckout();
            btnCrearOrden.disabled = true;
            const resp = await postJsonSeguroApi(
                "api/orders/create",
                {
                    checkout_mode: estadoHibrido.mode === "account" && estadoHibrido.accessToken ? "account" : "guest",
                    plan_id: res.plan.id,
                    extra_seats: res.extras,
                    email: emailVal,
                    ruc_cedula: rucVal,
                    razon_social: razonVal,
                    payment_channel: estadoHibrido.gateway,
                    hwid_inicial: res.hwidORef !== "SIN_ESPECIFICAR" ? res.hwidORef : undefined,
                },
                estadoHibrido.mode === "account" ? estadoHibrido.accessToken : null
            );
            btnCrearOrden.disabled = false;

            const orderRef = resp.data?.order_ref || res.referencia;
            const orderToken = resp.data?.order_token || `TFTK-${extraerCodigoCorto(rucVal)}${Date.now().toString(36).toUpperCase()}`;
            estadoHibrido.lastOrder = {
                order_ref: orderRef,
                order_token: orderToken,
                email: emailVal,
                offline: !resp.ok,
            };

            orderResultBox.textContent = "";
            orderResultBox.style.display = "flex";
            orderResultBox.appendChild(
                crearEl(
                    "span",
                    "order-status-pill",
                    resp.ok ? "⏳ Estado: pendiente_verificacion (Orden Registrada)" : "ℹ️ Referencia Generada (Modo Estático)"
                )
            );
            const tokRow = crearEl("div", "bank-row");
            tokRow.appendChild(crearEl("span", "", `Orden: ${orderRef} • Token: ${orderToken}`));
            const btnCopyTok = crearEl("button", "btn-copy-mini", "Copiar Token");
            btnCopyTok.type = "button";
            btnCopyTok.addEventListener("click", () => copiarAlPortapapeles(`${orderRef} | ${orderToken}`, "Orden y Token"));
            tokRow.appendChild(btnCopyTok);
            orderResultBox.appendChild(tokRow);

            if (estadoHibrido.mode === "guest") {
                const claimWrap = crearEl("div", "flex-wrap-actions mt-8");
                const claimPass = document.createElement("input");
                claimPass.type = "password";
                claimPass.placeholder = "Contraseña (mín. 10 chars) para crear cuenta después";
                claimPass.className = "text-input";
                claimPass.style.flex = "1 1 220px";
                const btnClaim = crearEl("button", "btn-glass", "✨ Crear Cuenta y Vincular Orden (1 Clic)");
                btnClaim.type = "button";
                btnClaim.addEventListener("click", async () => {
                    if (claimPass.value.length < 10) {
                        mostrarToastCopia("⚠️ La contraseña debe tener al menos 10 caracteres.");
                        return;
                    }
                    const clResp = await postJsonSeguroApi("api/orders/claim", {
                        order_ref: orderRef,
                        order_token: orderToken,
                        email: emailVal,
                        password: claimPass.value,
                    });
                    if (clResp.ok) {
                        mostrarToastCopia("✅ Cuenta Supabase creada y orden vinculada.");
                    } else {
                        mostrarToastCopia(`ℹ️ ${clResp.data?.error || "Activa SUPABASE_URL en Cloudflare Pages para vincular en la nube."}`);
                    }
                });
                claimWrap.appendChild(claimPass);
                claimWrap.appendChild(btnClaim);
                orderResultBox.appendChild(claimWrap);
            }
        });

        const MIMES_COMPROBANTE = new Set(["image/png", "image/jpeg", "image/webp", "application/pdf"]);
        const MAX_COMPROBANTE_BYTES = 5 * 1024 * 1024;
        fFile.addEventListener("change", () => {
            const candidate = fFile.files && fFile.files[0] ? fFile.files[0] : null;
            if (!candidate) return;
            if (!MIMES_COMPROBANTE.has(String(candidate.type || "").toLowerCase()) || candidate.size <= 0 || candidate.size > MAX_COMPROBANTE_BYTES) {
                fFile.value = "";
                mostrarToastCopia("⛔ Comprobante rechazado: solo PNG, JPG, WEBP o PDF de hasta 5 MB.");
            }
        });

        btnEnviarComprobanteApi.addEventListener("click", async () => {
            const voucher = String(fVoucher.inp.value || "").trim().toUpperCase();
            if (!/^[A-Z0-9-]{4,40}$/.test(voucher)) {
                mostrarToastCopia("⚠️ Ingresa un número de comprobante válido (4-40 caracteres alfanuméricos).");
                return;
            }
            const fileObj = fFile.files && fFile.files[0] ? fFile.files[0] : null;
            if (fileObj && (!MIMES_COMPROBANTE.has(String(fileObj.type || "").toLowerCase()) || fileObj.size <= 0 || fileObj.size > MAX_COMPROBANTE_BYTES)) {
                mostrarToastCopia("⛔ Archivo inválido: solo PNG, JPG, WEBP o PDF hasta 5 MB.");
                return;
            }
            const fileSha = fileObj ? await calcularSha256Archivo(fileObj) : null;
            const orderInfo = estadoHibrido.lastOrder;
            if (!orderInfo) {
                mostrarToastCopia("⚠️ Primero haz clic en 'Generar Orden Oficial y Token' arriba.");
                return;
            }
            const resp = await postJsonSeguroApi(
                "api/orders/receipt",
                {
                    order_ref: orderInfo.order_ref,
                    order_token: orderInfo.order_token,
                    voucher_ref: voucher,
                    banco_origen: estadoHibrido.gateway === "TRANSFERENCIA" ? "Transferencia Ecuador" : "Deuna! / Banco Pichincha",
                    comprobante_nombre: fileObj ? sanitizarNombrePlano(fileObj.name).replace(/\s+/g, "_") : undefined,
                    comprobante_mime: fileObj && fileObj.type ? fileObj.type.toLowerCase() : undefined,
                    comprobante_sha256: fileSha || undefined,
                    comprobante_size_bytes: fileObj ? fileObj.size : undefined,
                },
                estadoHibrido.accessToken
            );
            receiptApiFeedback.textContent = resp.ok
                ? `✅ Comprobante ${voucher} registrado en estado pendiente_verificacion.`
                : `📲 Modo estático: envía tu comprobante ${voucher} por WhatsApp (0996459771) usando los botones inferiores.`;
        });

        const channelsGrid = crearEl("div", "payment-channels-grid");

        // Columna 1: Deuna! / Transferencia Directa (QR protegido exclusivamente dentro del modal)
        const boxDeuna = crearEl("div", "pay-box pay-deuna");
        boxDeuna.appendChild(crearEl("h4", "", "1. Deuna! / Transferencia Bancaria Directa (0 % Comisión)"));

        const deunaLayout = crearEl("div", "deuna-layout");
        const qrWrap = crearEl("div", "qr-preview-wrap");
        const qrImg = document.createElement("img");
        qrImg.id = "pagoQrDeunaImg";
        qrImg.src = obtenerSrcQrDeuna();
        qrImg.alt = "Código QR Oficial Deuna QUORATEC — TributaFlow ERP";
        qrWrap.appendChild(qrImg);

        const stepsList = crearEl("ul", "deuna-steps");
        stepsList.id = "pagoDeunaPasos";
        deunaLayout.appendChild(qrWrap);
        deunaLayout.appendChild(stepsList);

        const bankRows = crearEl("div", "bank-rows");
        const rowsMeta = [
            ["Titular:", CONFIG_COMERCIAL.TITULAR_RECAUDO, "pagoBankTitular", "Titular"],
            ["Banco:", CONFIG_COMERCIAL.BANCO_RECAUDO, "pagoBankBanco", "Banco"],
            ["Cuenta:", CONFIG_COMERCIAL.NUMERO_CUENTA_RECAUDO, "pagoBankCuenta", "Datos Cuenta"],
            ["Monto USD:", "$299.00", "pagoBankMonto", "Monto USD"],
            ["Referencia:", "TF-ESTUDIO_PRO-WEB01", "pagoBankRef", "Referencia"],
        ];
        rowsMeta.forEach(([labelTxt, initVal, idVal, copyLabel]) => {
            const row = crearEl("div", "bank-row");
            const left = crearEl("span", "", `${labelTxt} `);
            const strong = crearEl("strong", "", initVal);
            strong.id = idVal;
            left.appendChild(strong);
            const btnC = crearEl("button", "btn-copy-mini", "Copiar");
            btnC.type = "button";
            btnC.addEventListener("click", () => {
                copiarAlPortapapeles(strong.textContent, copyLabel);
            });
            row.appendChild(left);
            row.appendChild(btnC);
            bankRows.appendChild(row);
        });

        const deunaActions = crearEl("div", "checkout-actions-row");
        const btnWp = crearEl("a", "btn-wp-confirm", "📲 Enviar Comprobante por WhatsApp");
        btnWp.id = "btnEnviarComprobanteWp";
        const btnCorreoDeuna = crearEl("a", "btn-email-confirm", "📧 Enviar Comprobante por Correo");
        btnCorreoDeuna.id = "btnEnviarComprobanteCorreo";
        vincularCopiaCorreo(btnCorreoDeuna, () =>
            construirPlantillaComprobante(calcularResumenCheckout(), "Deuna! / Banco Pichincha")
        );
        deunaActions.appendChild(btnWp);
        deunaActions.appendChild(btnCorreoDeuna);

        const deunaSupportBar = crearEl("div", "support-inline-bar");
        deunaSupportBar.appendChild(crearEl("span", "", "¿Dudas antes de pagar?"));
        const deunaSupportLinks = crearEl("div", "support-inline-links");
        const btnSoporteDeunaWp = crearEl("a", "btn-support-link", "💬 Soporte Oficial (WhatsApp)");
        btnSoporteDeunaWp.id = "btnSoporteDeunaWp";
        const btnSoporteDeunaCorreo = crearEl("a", "btn-support-link", "✉️ Soporte Oficial (Correo)");
        btnSoporteDeunaCorreo.id = "btnSoporteDeunaCorreo";
        vincularCopiaCorreo(btnSoporteDeunaCorreo, () => {
            const r = calcularResumenCheckout();
            return construirPlantillaSoporte(r.plan.nombreComercial, r.referencia);
        });
        deunaSupportLinks.appendChild(btnSoporteDeunaWp);
        deunaSupportLinks.appendChild(btnSoporteDeunaCorreo);
        deunaSupportBar.appendChild(deunaSupportLinks);

        boxDeuna.appendChild(deunaLayout);
        boxDeuna.appendChild(crearEl("p", "deuna-titular-note", CONFIG_COMERCIAL.TITULAR_NOTA_BANCO));
        boxDeuna.appendChild(bankRows);
        boxDeuna.appendChild(deunaActions);
        boxDeuna.appendChild(deunaSupportBar);

        // Columna 2: PayPhone (En actualización temporal) / Bloque Corporativo Enterprise
        const boxCard = crearEl("div", "pay-box pay-card");
        const cardTitle = crearEl("h4", "", "2. Tarjeta (PayPhone) — Próximamente / En actualización");
        cardTitle.id = "pagoCardTitulo";

        const payphonePanel = crearEl("div", "payphone-paused-box");
        payphonePanel.id = "pagoPayphonePanel";
        payphonePanel.style.display = "flex";
        payphonePanel.style.flexDirection = "column";
        payphonePanel.style.gap = "12px";

        const badgeSoon = crearEl("span", "badge-soon", "Próximamente / En actualización");
        payphonePanel.appendChild(badgeSoon);

        payphonePanel.appendChild(
            crearEl(
                "p",
                "",
                "Estamos renovando nuestros enlaces de pago con tarjeta en PayPhone para TributaFlow ERP Edición 2026."
            )
        );
        const badgesWrap = crearEl("div", "pay-badges");
        ["Visa", "Mastercard", "Diners", "Discover", "Alia"].forEach((marca) => {
            badgesWrap.appendChild(crearEl("span", "pay-badge-pill", marca));
        });
        badgesWrap.setAttribute("aria-label", CONFIG_COMERCIAL.PAYPHONE_BADGES);
        payphonePanel.appendChild(badgesWrap);

        const btnPayphone = crearEl(
            "button",
            "btn-payphone-disabled",
            "⏳ PayPhone — Próximamente / En actualización"
        );
        btnPayphone.type = "button";
        btnPayphone.disabled = true;
        btnPayphone.setAttribute("aria-disabled", "true");
        btnPayphone.id = "btnPagarPayphoneModal";
        payphonePanel.appendChild(btnPayphone);

        payphonePanel.appendChild(crearEl("div", "pay-security-note", CONFIG_COMERCIAL.PAYPHONE_GARANTIA));

        const payphoneSupportBar = crearEl("div", "support-inline-bar");
        payphoneSupportBar.appendChild(crearEl("span", "", "¿Asistencia para activar con Deuna!?"));
        const payphoneSupportLinks = crearEl("div", "support-inline-links");
        const btnSoportePayphoneWp = crearEl("a", "btn-support-link", "💬 Contactar Soporte Oficial");
        btnSoportePayphoneWp.id = "btnSoportePayphoneWp";
        const btnSoportePayphoneCorreo = crearEl("a", "btn-support-link", "✉️ soportetributaflow@quoratec.com");
        btnSoportePayphoneCorreo.id = "btnSoportePayphoneCorreo";
        vincularCopiaCorreo(btnSoportePayphoneCorreo, () => {
            const r = calcularResumenCheckout();
            return construirPlantillaSoporte(r.plan.nombreComercial, r.referencia);
        });
        payphoneSupportLinks.appendChild(btnSoportePayphoneWp);
        payphoneSupportLinks.appendChild(btnSoportePayphoneCorreo);
        payphoneSupportBar.appendChild(payphoneSupportLinks);
        payphonePanel.appendChild(payphoneSupportBar);

        const lanPanel = crearEl("div", "enterprise-lan-notice");
        lanPanel.id = "pagoEnterpriseLanPanel";
        lanPanel.style.display = "none";
        const lanTexto = crearEl("p", "", "");
        lanTexto.id = "pagoEnterpriseLanTexto";
        const lanSupportBar = crearEl("div", "support-inline-bar");
        lanSupportBar.style.marginTop = "10px";
        lanSupportBar.appendChild(crearEl("span", "", "Asesoría corporativa previa:"));
        const lanSupportLinks = crearEl("div", "support-inline-links");
        const btnSoporteEnterpriseWp = crearEl("a", "btn-support-link", "💬 Contactar Soporte Oficial");
        btnSoporteEnterpriseWp.id = "btnSoporteEnterpriseWp";
        const btnSoporteEnterpriseCorreo = crearEl("a", "btn-support-link", "✉️ soportetributaflow@quoratec.com");
        btnSoporteEnterpriseCorreo.id = "btnSoporteEnterpriseCorreo";
        vincularCopiaCorreo(btnSoporteEnterpriseCorreo, () => {
            const r = calcularResumenCheckout();
            return construirPlantillaSoporte(r.plan.nombreComercial, r.referencia);
        });
        lanSupportLinks.appendChild(btnSoporteEnterpriseWp);
        lanSupportLinks.appendChild(btnSoporteEnterpriseCorreo);
        lanSupportBar.appendChild(lanSupportLinks);
        lanPanel.appendChild(lanTexto);
        lanPanel.appendChild(lanSupportBar);

        boxCard.appendChild(cardTitle);
        boxCard.appendChild(payphonePanel);
        boxCard.appendChild(lanPanel);

        channelsGrid.appendChild(boxDeuna);
        channelsGrid.appendChild(boxCard);

        const rulesBox = crearEl("div", "rules-box");
        [
            "✓ 7 días de prueba gratis con hasta 60 RUCs (Estudio Contable Pro, sin tarjeta).",
            "✓ Modo Solo Lectura al expirar: tus datos locales nunca se eliminan ni secuestran.",
            "✓ Actualizaciones SRI Edición 2026 (POS .p12, NIIF, EFOS, ATS, Form. 103/104).",
            "✓ Emisión .lic tras validar pago Deuna! (no reembolsable tras emitirse la llave).",
        ].forEach((regla) => rulesBox.appendChild(crearEl("div", "", regla)));

        content.appendChild(summary);
        content.appendChild(controlsGrid);
        content.appendChild(extraBar);
        content.appendChild(hybridTabs);
        content.appendChild(hybridGuestPanel);
        content.appendChild(hybridAccountBox);
        content.appendChild(gatewayGrid);
        content.appendChild(orderActionRow);
        content.appendChild(orderResultBox);
        content.appendChild(refBanner);
        content.appendChild(channelsGrid);
        content.appendChild(receiptUploadWrap);
        content.appendChild(rulesBox);

        box.appendChild(top);
        box.appendChild(content);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        actualizarVistaModalPago();
    }

    function actualizarVistaModalPago() {
        const res = calcularResumenCheckout();
        const { plan, extras, montoTexto, estacionesTotales, referencia } = res;

        const elTitulo = document.getElementById("pagoModalTitulo");
        const elBadge = document.getElementById("pagoModalBadge");
        const elMeta = document.getElementById("pagoResumenMeta");
        const elMonto = document.getElementById("pagoMontoTotal");
        if (elTitulo) elTitulo.textContent = `${plan.nombre} — Suscripción Anual`;
        if (elBadge) {
            elBadge.textContent = plan.esEnterprise
                ? `ACTIVACIÓN CORPORATIVA DEUNA / TRANSFERENCIA v${runtimeVersion}`
                : `CHECKOUT OFICIAL DEUNA! / TRANSFERENCIA QUORATEC v${runtimeVersion}`;
        }
        if (elMeta) {
            elMeta.textContent = `${plan.nombreComercial} • ${plan.rucsLabel} • ${estacionesTotales} PC(s)`;
        }
        if (elMonto) elMonto.textContent = `${montoTexto} USD`;

        const sel = document.getElementById("pagoPlanSelect");
        if (sel instanceof HTMLSelectElement) sel.value = plan.id;

        const extraBar = document.getElementById("pagoExtraSeatsBar");
        const extraIn = document.getElementById("pagoExtraSeatsInput");
        const estTot = document.getElementById("pagoEstacionesTotales");
        if (extraBar instanceof HTMLElement) extraBar.style.display = plan.permiteExtraSeats ? "flex" : "none";
        if (extraIn instanceof HTMLInputElement) extraIn.value = String(extras);
        if (estTot instanceof HTMLElement) estTot.textContent = `${estacionesTotales} PCs totales`;

        const elRef = document.getElementById("pagoReferenciaTexto");
        const elBankMonto = document.getElementById("pagoBankMonto");
        const elBankRef = document.getElementById("pagoBankRef");
        if (elRef) elRef.textContent = referencia;
        if (elBankMonto) elBankMonto.textContent = `${montoTexto} USD`;
        if (elBankRef) elBankRef.textContent = referencia;

        const qrImg = document.getElementById("pagoQrDeunaImg");
        if (qrImg instanceof HTMLImageElement) qrImg.src = obtenerSrcQrDeuna();

        const pasosUl = document.getElementById("pagoDeunaPasos");
        if (pasosUl instanceof HTMLElement) {
            pasosUl.textContent = "";
            [
                "1. Abre Deuna! o Banca Móvil Banco Pichincha.",
                "2. Escanea el QR de la izquierda.",
                `3. Ingresa ${montoTexto} USD exactos y la referencia ${referencia}.`,
                "4. Envía tu comprobante por WhatsApp o correo para emitir tu archivo .lic.",
            ].forEach((txt) => pasosUl.appendChild(crearEl("li", "", txt)));
        }

        const deunaTemplate = construirPlantillaComprobante(res, "Deuna! / Banco Pichincha");
        asignarEnlaceSeguro(
            document.getElementById("btnEnviarComprobanteWp"),
            construirUrlWhatsapp(deunaTemplate.cuerpo),
            "whatsapp"
        );
        asignarEnlaceSeguro(
            document.getElementById("btnEnviarComprobanteCorreo"),
            construirUrlMailto(deunaTemplate.asunto, deunaTemplate.cuerpo),
            "correo"
        );

        const soporteTemplate = construirPlantillaSoporte(plan.nombreComercial, referencia);
        const soporteWpUrl = construirUrlWhatsapp(soporteTemplate.cuerpo);
        const soporteCorreoUrl = construirUrlMailto(soporteTemplate.asunto, soporteTemplate.cuerpo);
        ["btnSoporteDeunaWp", "btnSoportePayphoneWp", "btnSoporteEnterpriseWp"].forEach((id) => {
            asignarEnlaceSeguro(document.getElementById(id), soporteWpUrl, "whatsapp");
        });
        ["btnSoporteDeunaCorreo", "btnSoportePayphoneCorreo", "btnSoporteEnterpriseCorreo"].forEach((id) => {
            asignarEnlaceSeguro(document.getElementById(id), soporteCorreoUrl, "correo");
        });

        const payphonePanel = document.getElementById("pagoPayphonePanel");
        const lanPanel = document.getElementById("pagoEnterpriseLanPanel");
        const lanTexto = document.getElementById("pagoEnterpriseLanTexto");
        const cardTitle = document.getElementById("pagoCardTitulo");

        if (plan.esEnterprise && payphonePanel instanceof HTMLElement && lanPanel instanceof HTMLElement) {
            if (cardTitle) cardTitle.textContent = "2. Activación Corporativa Red LAN / Nube (Deuna! / Transferencia)";
            payphonePanel.style.display = "none";
            lanPanel.style.display = "block";
            if (lanTexto) {
                lanTexto.textContent =
                    `El plan ${plan.nombreComercial} (${montoTexto} USD / año para ${estacionesTotales} PCs) ` +
                    `se activa con 0 % comisión mediante QR Deuna! o Transferencia Bancaria Directa QUORATEC usando la referencia ${referencia}.`;
            }
        } else if (payphonePanel instanceof HTMLElement && lanPanel instanceof HTMLElement) {
            if (cardTitle) cardTitle.textContent = "2. Tarjeta (PayPhone) — Próximamente / En actualización";
            payphonePanel.style.display = "flex";
            lanPanel.style.display = "none";
        }
    }

    function abrirModalPago(planIdRaw, extraSeatsOverride) {
        asegurarModalPago();
        estadoModalPago.planId = resolverPlan(planIdRaw);
        const plan = PLAN_LOOKUP[estadoModalPago.planId];
        if (!plan || !plan.permiteExtraSeats) {
            estadoModalPago.extraSeats = 0;
        } else if (typeof extraSeatsOverride === "number") {
            estadoModalPago.extraSeats = Math.max(0, Math.min(50, extraSeatsOverride));
        }
        actualizarVistaModalPago();
        const modal = document.getElementById("modalPago");
        if (modal instanceof HTMLElement) modal.style.display = "flex";
    }

    function asegurarModalLegal() {
        if (document.getElementById("modalLegal")) return;
        const overlay = crearEl("div", "modal-overlay");
        overlay.id = "modalLegal";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");

        const box = crearEl("div", "modal-box modal-narrow");
        const top = crearEl("div", "modal-top");
        const h3 = crearEl("h3", "", "Marco Legal — TributaFlow ERP (QUORATEC)");
        h3.id = "modalLegalTitulo";
        const btnClose = crearEl("button", "btn-close", "×");
        btnClose.type = "button";
        btnClose.setAttribute("aria-label", "Cerrar modal legal");
        btnClose.addEventListener("click", () => cerrarModal("modalLegal"));
        top.appendChild(h3);
        top.appendChild(btnClose);

        const cuerpo = crearEl("div", "modal-content");
        cuerpo.id = "modalLegalCuerpo";

        box.appendChild(top);
        box.appendChild(cuerpo);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    }

    function abrirModalLegal(clave) {
        asegurarModalLegal();
        if (!esClaveSegura(clave) || !Object.prototype.hasOwnProperty.call(TEXTOS_LEGALES, clave)) return;
        const doc = TEXTOS_LEGALES[clave];
        const tituloEl = document.getElementById("modalLegalTitulo");
        const cuerpo = document.getElementById("modalLegalCuerpo");
        if (!doc || !(cuerpo instanceof HTMLElement)) return;
        if (tituloEl) tituloEl.textContent = doc.titulo;
        cuerpo.textContent = "";
        doc.secciones.forEach((sec) => {
            cuerpo.appendChild(crearEl("h4", "", sec.sub));
            cuerpo.appendChild(crearEl("p", "", sec.txt));
        });
        const modal = document.getElementById("modalLegal");
        if (modal instanceof HTMLElement) modal.style.display = "flex";
    }

    /* ======================================================================
       Hidratación centralizada de versión, descargas y widgets interactivos
       ====================================================================== */
    function aplicarVersionEnDOM(versionStr) {
        if (typeof versionStr !== "string" || !SEMVER_REGEX.test(versionStr.trim())) return;
        runtimeVersion = versionStr.trim();

        document.querySelectorAll("[data-app-version]").forEach((el) => {
            el.textContent = runtimeVersion;
        });
        document.querySelectorAll("[data-app-version-tag]").forEach((el) => {
            el.textContent = `v${runtimeVersion}`;
        });
        document.querySelectorAll("[data-trial-days]").forEach((el) => {
            el.textContent = `${CONFIG_COMERCIAL.TRIAL_DIAS} días`;
        });
    }

    function hidratarDescargasPorSistemaOperativo() {
        const soInfo = detectarInfoSistemaOperativo();

        document.querySelectorAll(".os-card[data-os]").forEach((card) => {
            if (!soInfo.esMovil && card.getAttribute("data-os") === soInfo.instaladorId) {
                card.classList.add("os-card-active");
                const sizeEl = card.querySelector(".os-size");
                if (sizeEl && !sizeEl.dataset.recMarked) {
                    sizeEl.dataset.recMarked = "1";
                    sizeEl.textContent = `${sizeEl.textContent} • Recomendado`;
                }
            }
        });

        const btnPrincipalDl = document.getElementById("btnDescargaDetectada");
        if (btnPrincipalDl instanceof HTMLElement) {
            if (soInfo.esMovil || !soInfo.soportado) {
                btnPrincipalDl.textContent = `⬇ Descarga Gratuita ${CONFIG_COMERCIAL.TRIAL_DIAS} Días (Solo PC)`;
            } else {
                btnPrincipalDl.textContent = `⬇ Descarga Gratuita ${CONFIG_COMERCIAL.TRIAL_DIAS} Días (${soInfo.etiqueta} v${runtimeVersion})`;
            }
        }
        const btnPaginaDl = document.getElementById("btnDescargaPaginaPrincipal");
        if (btnPaginaDl instanceof HTMLElement) {
            if (soInfo.esMovil || !soInfo.soportado) {
                btnPaginaDl.textContent = `⬇ Instalador Oficial (Solo Windows/macOS/Linux PC)`;
            } else {
                btnPaginaDl.textContent = `⬇ Descargar para ${soInfo.etiqueta} (v${runtimeVersion})`;
            }
        }

        // Neutraliza cualquier enlace directo en móviles/iPadOS y en escritorio vincula al release oficial v3.0.0
        document.querySelectorAll("[data-download-os]").forEach((el) => {
            if (el instanceof HTMLAnchorElement) {
                if (soInfo.esMovil || !soInfo.soportado) {
                    el.setAttribute("href", "#descargas");
                    el.removeAttribute("download");
                    el.removeAttribute("data-tf-canal-seguro");
                } else {
                    const targetOs = el.getAttribute("data-download-os");
                    const key =
                        targetOs && targetOs !== "auto" && esClaveSegura(targetOs) && SO_LOOKUP[targetOs]
                            ? targetOs
                            : soInfo.instaladorId || "windows";
                    const meta = SO_LOOKUP[key];
                    if (meta && esUrlDescargaOficialSegura(meta.url)) {
                        el.setAttribute("href", meta.url);
                        el.setAttribute("download", meta.archivo);
                        el.setAttribute("data-tf-canal-seguro", "download_release");
                        el.removeAttribute("target");
                        el.removeAttribute("rel");
                    }
                }
            }
        });

        document.querySelectorAll("[data-sha256-value]").forEach((el) => {
            const key = el.getAttribute("data-sha256-value");
            if (key && esClaveSegura(key) && SO_LOOKUP[key]) {
                el.textContent = SO_LOOKUP[key].sha256;
            }
        });

        document.querySelectorAll("[data-sha256-copy]").forEach((btn) => {
            if (btn instanceof HTMLElement && !btn.dataset.shaBound) {
                btn.dataset.shaBound = "1";
                btn.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const key = btn.getAttribute("data-sha256-copy");
                    if (key && esClaveSegura(key) && SO_LOOKUP[key]) {
                        copiarAlPortapapeles(SO_LOOKUP[key].sha256, `SHA-256 ${SO_LOOKUP[key].etiqueta}`);
                    }
                });
            }
        });
    }

    let runtimeSimCfg = { ...CONFIG_COMERCIAL.SIMULADOR_AHORRO };
    let refrescarSimuladorHook = null;

    function calcularEstimacionSimulador(rucsRaw, docsRaw, pcsOrCfg, cfgOverride) {
        const hasCfgAsThird = pcsOrCfg && typeof pcsOrCfg === "object";
        const pcsRaw = hasCfgAsThird ? 1 : pcsOrCfg;
        const cfg = hasCfgAsThird ? pcsOrCfg : cfgOverride && typeof cfgOverride === "object" ? cfgOverride : runtimeSimCfg;

        const rucs = Math.max(1, Math.min(300, Math.round(Number(rucsRaw || 12))));
        const docs = Math.max(20, Math.min(2000, Math.round(Number(docsRaw || 250))));
        const pcs = Math.max(1, Math.min(15, Math.round(Number(pcsRaw || 1))));

        // Modelo proporcional realista: gestión fija por RUC + procesamiento XML/RIDE/ATS sobre cartera total
        const horasManuales = rucs * cfg.HORAS_MANUAL_POR_RUC + docs * cfg.HORAS_MANUAL_POR_COMPROBANTE;
        const horasAhorradasMes = Math.max(1, Math.round(horasManuales * cfg.FACTOR_AUTOMATIZACION));
        const horasAhorradasAnio = horasAhorradasMes * 12;

        let planId = "PERSONAL_PRO";
        let detalle = "Hasta 3 RUCs · 1 PC — Sincronización SRI/RIDE/XML y bóveda local cifrada AES-256.";
        if (pcs >= 10) {
            planId = "ENTERPRISE_CORP";
            detalle =
                "RUCs ilimitados · 10+ PCs escalables (+$150/PC extra) — Multi-sucursal y multi-bodega en vivo, Red LAN y Nube Oficina+Casa.";
        } else if (rucs > 60 || pcs >= 3) {
            planId = "ENTERPRISE_TEAM";
            detalle =
                "RUCs ilimitados · 5 PCs — Módulos ERP completos (POS .p12, Kardex, CxC/CxP, NIIF, EFOS, ATS, Form. 103/104).";
        } else if (rucs > 25 || pcs === 2) {
            planId = "ESTUDIO_PRO";
            detalle =
                "Hasta 60 RUCs · Hasta 2 PCs (Oficina + Casa) — Sincronización opcional en la nube vía Supabase RLS, Contabilidad NIIF y EFOS.";
        } else if (rucs > 3) {
            planId = "CONTADOR_MASTER";
            detalle = "Hasta 25 RUCs · 1 PC — Lote Multi-RUC y Generador/Validador oficial ATS, Form. 103 y 104.";
        }

        const extraSeats = planId === "ENTERPRISE_CORP" ? Math.max(0, pcs - 10) : 0;
        const planMeta = PLAN_LOOKUP[planId];
        const precioEstimadoUsd = planMeta.precioUsd + extraSeats * CONFIG_COMERCIAL.PRECIO_SEAT_EXTRA_USD;

        return {
            rucs,
            docs,
            pcs,
            extraSeats,
            precioEstimadoUsd,
            horasAhorradasMes,
            horasAhorradasAnio,
            planId,
            detalle,
        };
    }

    function sincronizarConfiguracionPortal() {
        if (window.location.protocol !== "http:" && window.location.protocol !== "https:") return;
        if (typeof window.fetch !== "function") return;
        const urlApi = `${obtenerPrefijoRuta()}${CONFIG_COMERCIAL.API_CONFIG_PATH}`;
        fetch(urlApi, { cache: "no-store", credentials: "same-origin" })
            .then((resp) => (resp.ok ? resp.json() : null))
            .then((data) => {
                if (!data || typeof data !== "object" || Array.isArray(data)) return;
                if (
                    Object.prototype.hasOwnProperty.call(data, "simulador_ahorro") &&
                    data.simulador_ahorro &&
                    typeof data.simulador_ahorro === "object"
                ) {
                    const s = data.simulador_ahorro;
                    const hRuc = Number(s.horas_manual_por_ruc);
                    const hDoc = Number(s.horas_manual_por_comprobante);
                    const fAuto = Number(s.factor_automatizacion);
                    if (
                        Number.isFinite(hRuc) && hRuc > 0 && hRuc <= 2 &&
                        Number.isFinite(hDoc) && hDoc > 0 && hDoc <= 0.1 &&
                        Number.isFinite(fAuto) && fAuto > 0 && fAuto <= 0.95
                    ) {
                        runtimeSimCfg = {
                            HORAS_MANUAL_POR_RUC: hRuc,
                            HORAS_MANUAL_POR_COMPROBANTE: hDoc,
                            FACTOR_AUTOMATIZACION: fAuto,
                        };
                        if (typeof refrescarSimuladorHook === "function") {
                            refrescarSimuladorHook();
                        }
                    }
                }
                if (Object.prototype.hasOwnProperty.call(data, "version")) {
                    aplicarVersionEnDOM(data.version);
                    hidratarDescargasPorSistemaOperativo();
                }
            })
            .catch(() => {
                // Respaldo embebido congelado en CONFIG_COMERCIAL si está offline
            });
    }

    function inicializarSimuladorAhorro() {
        const rucsRange = document.getElementById("simRucsRange");
        const docsRange = document.getElementById("simDocsRange");
        if (!(rucsRange instanceof HTMLInputElement) || !(docsRange instanceof HTMLInputElement)) return;
        const pcsRange = document.getElementById("simPcsRange");

        const rucsVal = document.getElementById("simRucsVal");
        const docsVal = document.getElementById("simDocsVal");
        const pcsVal = document.getElementById("simPcsVal");
        const horasMesEl = document.getElementById("simHorasMes");
        const horasAnioEl = document.getElementById("simHorasAnio");
        const planNombreEl = document.getElementById("simPlanNombre");
        const planDetalleEl = document.getElementById("simPlanDetalle");
        const btnComprarEl = document.getElementById("simBtnAdquirirPlan");
        const presetBtns = document.querySelectorAll("[data-sim-rucs]");

        function actualizarSimulador() {
            const pcsInput = pcsRange instanceof HTMLInputElement ? pcsRange.value : 1;
            const sim = calcularEstimacionSimulador(rucsRange.value, docsRange.value, pcsInput);

            if (rucsVal) {
                rucsVal.textContent = sim.rucs === 1 ? "1 contribuyente" : sim.rucs >= 300 ? "300+ RUCs" : `${sim.rucs} RUCs`;
            }
            if (docsVal) docsVal.textContent = `${sim.docs} comp./mes`;
            if (pcsVal) pcsVal.textContent = sim.pcs === 1 ? "1 PC" : sim.pcs >= 15 ? "15+ PCs" : `${sim.pcs} PCs`;

            const planMeta = PLAN_LOOKUP[sim.planId];
            if (horasMesEl) horasMesEl.textContent = `${sim.horasAhorradasMes} h/mes`;
            if (horasAnioEl) horasAnioEl.textContent = `${sim.horasAhorradasAnio} h/año`;
            if (planNombreEl) {
                const sufijoExtra =
                    sim.extraSeats > 0
                        ? ` (${10 + sim.extraSeats} PCs = ${formatearUsd(sim.precioEstimadoUsd)} USD/año)`
                        : ` — ${formatearUsd(planMeta.precioUsd)} USD/año`;
                planNombreEl.textContent = `${planMeta.nombre}${sufijoExtra}`;
            }
            if (planDetalleEl) {
                planDetalleEl.textContent = sim.detalle;
            }
            if (btnComprarEl instanceof HTMLElement) {
                btnComprarEl.setAttribute("data-checkout-plan", planMeta.id);
                if (sim.extraSeats > 0) {
                    btnComprarEl.setAttribute("data-checkout-extra-seats", String(sim.extraSeats));
                } else {
                    btnComprarEl.removeAttribute("data-checkout-extra-seats");
                }
                btnComprarEl.textContent = `💳 Adquirir ${planMeta.nombre} (${formatearUsd(sim.precioEstimadoUsd)})`;
            }

            presetBtns.forEach((btn) => {
                const targetRucs = Number(btn.getAttribute("data-sim-rucs") || 0);
                const targetPcs = Number(btn.getAttribute("data-sim-pcs") || 1);
                btn.classList.toggle("is-active", targetRucs === sim.rucs && targetPcs === sim.pcs);
            });
        }

        refrescarSimuladorHook = actualizarSimulador;

        rucsRange.addEventListener("input", actualizarSimulador);
        docsRange.addEventListener("input", actualizarSimulador);
        if (pcsRange instanceof HTMLInputElement) {
            pcsRange.addEventListener("input", actualizarSimulador);
        }
        presetBtns.forEach((btn) => {
            btn.addEventListener("click", () => {
                rucsRange.value = String(Math.max(1, Math.min(300, Number(btn.getAttribute("data-sim-rucs") || 12))));
                docsRange.value = String(Math.max(20, Math.min(2000, Number(btn.getAttribute("data-sim-docs") || 250))));
                if (pcsRange instanceof HTMLInputElement) {
                    pcsRange.value = String(Math.max(1, Math.min(15, Number(btn.getAttribute("data-sim-pcs") || 1))));
                }
                actualizarSimulador();
            });
        });

        actualizarSimulador();
    }

    function inicializarCalculadoraAddonCorp() {
        const inputAddon = document.getElementById("corpAddonInput");
        const btnMenos = document.getElementById("corpAddonMenos");
        const btnMas = document.getElementById("corpAddonMas");
        const lblTotal = document.getElementById("corpAddonTotal");
        const lblPcs = document.getElementById("corpAddonPcs");
        const btnWp = document.getElementById("btnCorpAddonWhatsapp");
        const btnCheckout = document.getElementById("btnCorpAddonCheckout");
        if (!(inputAddon instanceof HTMLInputElement)) return;

        function actualizarAddon() {
            const cant = Math.max(1, Math.min(50, Number(inputAddon.value || 1)));
            runtimeCorpExtraSeats = cant;
            inputAddon.value = String(cant);
            const totalUsd = 1490 + cant * CONFIG_COMERCIAL.PRECIO_SEAT_EXTRA_USD;
            const totalPcs = 10 + cant;
            if (lblTotal) lblTotal.textContent = `${formatearUsd(totalUsd)} USD/año`;
            if (lblPcs) lblPcs.textContent = `${totalPcs} PCs (${10} base + ${cant} adicional${cant > 1 ? "es" : ""})`;
            if (btnWp instanceof HTMLAnchorElement) {
                const texto =
                    `[TRIBUTAFLOW ENTERPRISE CORP v${runtimeVersion}] Solicito cotización/activación de +${cant} estación(es) adicional(es) (+1 PC = $150/año c/u). Total estimado: ${totalPcs} PCs (${formatearUsd(totalUsd)} USD/año).`;
                asignarEnlaceSeguro(btnWp, construirUrlWhatsapp(texto), "whatsapp");
            }
        }

        if (btnMenos) {
            btnMenos.addEventListener("click", () => {
                inputAddon.value = String(Math.max(1, Number(inputAddon.value || 1) - 1));
                actualizarAddon();
            });
        }
        if (btnMas) {
            btnMas.addEventListener("click", () => {
                inputAddon.value = String(Math.min(50, Number(inputAddon.value || 1) + 1));
                actualizarAddon();
            });
        }
        inputAddon.addEventListener("input", actualizarAddon);
        if (btnCheckout) {
            btnCheckout.addEventListener("click", (e) => {
                e.preventDefault();
                abrirModalPago("ENTERPRISE_CORP", runtimeCorpExtraSeats);
            });
        }

        actualizarAddon();
    }

    function inicializarPestanasGuiaUso() {
        const tabs = Array.from(document.querySelectorAll("[data-guide-tab]"));
        const panels = Array.from(document.querySelectorAll("[data-guide-panel]"));
        if (!tabs.length || !panels.length) return;

        const TABS_PERMITIDAS = new Set(["rapida", "1pc", "2pcs", "lan", "corp"]);

        function activarTab(tabId) {
            const idLimpio = TABS_PERMITIDAS.has(tabId) ? tabId : "rapida";
            tabs.forEach((t) => {
                const activo = t.getAttribute("data-guide-tab") === idLimpio;
                t.classList.toggle("is-active", activo);
                t.setAttribute("aria-selected", activo ? "true" : "false");
            });
            panels.forEach((p) => {
                const activo = p.getAttribute("data-guide-panel") === idLimpio;
                p.classList.toggle("is-active", activo);
            });
        }

        tabs.forEach((btn) => {
            btn.addEventListener("click", () => {
                const target = btn.getAttribute("data-guide-tab") || "rapida";
                activarTab(target);
            });
        });

        const hash = String(window.location.hash || "")
            .replace(/^#tab-/, "")
            .replace(/^#/, "")
            .toLowerCase();
        activarTab(TABS_PERMITIDAS.has(hash) ? hash : "rapida");
    }

    /* ======================================================================
       Guardia Anti-Hacking en Tiempo de Ejecución (Clickjacking, XSS DOM, Clobbering)
       ====================================================================== */
    function activarGuardiaAntiClickjacking() {
        let enFrame = false;
        try {
            enFrame = window.self !== window.top;
        } catch {
            enFrame = true;
        }
        if (!enFrame) return false;

        telemetriaInterna.frameBlocked = true;
        const body = document.body;
        if (body instanceof HTMLElement) {
            body.textContent = "";
            const wrap = crearEl("div", "tf-frame-block-screen");
            wrap.appendChild(crearEl("h2", "", "Vista bloqueada por protección anti-clickjacking"));
            wrap.appendChild(
                crearEl(
                    "p",
                    "",
                    "Por tu seguridad, TributaFlow ERP solo se ejecuta en su pestaña directa oficial."
                )
            );
            const openBtn = crearEl("a", "btn-glow", "Abrir portal oficial de TributaFlow ERP");
            asignarEnlaceSeguro(openBtn, CONFIG_COMERCIAL.DOMINIO_OFICIAL, "portal");
            wrap.appendChild(openBtn);
            body.appendChild(wrap);
        }
        return true;
    }

    function sanitizarNodoInyectado(nodo) {
        if (!(nodo instanceof HTMLElement)) return;
        const tag = nodo.tagName.toUpperCase();
        if (["SCRIPT", "IFRAME", "OBJECT", "EMBED", "BASE", "FORM"].includes(tag)) {
            if (tag === "SCRIPT") {
                const src = nodo.getAttribute("src") || "";
                const permitidoLocal =
                    (src === "assets/js/portal.js" ||
                        src === "../assets/js/portal.js" ||
                        src === `assets/js/portal.js?v=${CONFIG_COMERCIAL.VERSION}` ||
                        src === `../assets/js/portal.js?v=${CONFIG_COMERCIAL.VERSION}`) &&
                    !nodo.textContent.trim();
                if (permitidoLocal) return;
            }
            nodo.remove();
            telemetriaInterna.blockedMutations += 1;
            registrarBloqueoSeguridad("DISALLOWED_TAG", tag);
            return;
        }

        if (tag === "META" && (nodo.getAttribute("http-equiv") || "").toLowerCase() === "refresh") {
            nodo.remove();
            telemetriaInterna.blockedMutations += 1;
            registrarBloqueoSeguridad("META_REFRESH", "blocked");
            return;
        }

        // Eliminar atributos de eventos inline (onclick, onerror, onload, etc.)
        Array.from(nodo.attributes).forEach((attr) => {
            const nombre = attr.name.toLowerCase();
            if (nombre.startsWith("on")) {
                nodo.removeAttribute(attr.name);
                telemetriaInterna.blockedMutations += 1;
                registrarBloqueoSeguridad("INLINE_HANDLER", nombre);
            }
        });

        if (nodo instanceof HTMLAnchorElement) {
            const href = nodo.getAttribute("href");
            if (href && contieneCaracterControlOSchemeMalo(href)) {
                nodo.removeAttribute("href");
                telemetriaInterna.blockedMutations += 1;
                registrarBloqueoSeguridad("DANGEROUS_HREF", href);
            } else if (href && nodo.hasAttribute("data-tf-canal-seguro")) {
                const tipo = nodo.getAttribute("data-tf-canal-seguro") || "auto";
                if (!validarDestinoSeguro(href, tipo)) {
                    nodo.removeAttribute("href");
                    nodo.setAttribute("data-tf-blocked", "1");
                    telemetriaInterna.blockedMutations += 1;
                    registrarBloqueoSeguridad("TAMPERED_OFFICIAL_HREF", href);
                }
            }
        }

        if (nodo instanceof HTMLImageElement) {
            const src = nodo.getAttribute("src") || "";
            if (src && contieneCaracterControlOSchemeMalo(src) && !src.startsWith("data:image/")) {
                nodo.removeAttribute("src");
                telemetriaInterna.blockedMutations += 1;
                registrarBloqueoSeguridad("DANGEROUS_IMG_SRC", src);
            }
        }
    }

    function iniciarGuardiaMutacionDOM() {
        if (window.__TF_MUTATION_GUARD__) return;
        window.__TF_MUTATION_GUARD__ = true;

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((m) => {
                if (m.type === "childList") {
                    m.addedNodes.forEach((node) => {
                        if (node instanceof HTMLElement) {
                            sanitizarNodoInyectado(node);
                            node.querySelectorAll("*").forEach((desc) => sanitizarNodoInyectado(desc));
                        }
                    });
                } else if (m.type === "attributes" && m.target instanceof HTMLElement) {
                    sanitizarNodoInyectado(m.target);
                }
            });
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["href", "src", "action", "formaction", "onclick", "onerror", "onload", "srcdoc"],
        });
    }

    function leerParametrosUrlSeguros() {
        let searchStr = "";
        try {
            searchStr = String(window.location.search || "");
        } catch {
            return;
        }
        const params = new URLSearchParams(searchStr);
        // Ignora intencionalmente ?url=, ?redirect=, ?payphone=, ?next=, ?whatsapp=
        const rawDevice = params.get("device_id") || params.get("hwid") || "";
        const deviceId = sanitizarIdentificador(rawDevice);
        if (deviceId && HEX_ALFANUM_REGEX.test(deviceId)) {
            estadoModalPago.hwidORef = deviceId;
            const inHwid = document.getElementById("pagoHwidInput");
            if (inHwid instanceof HTMLInputElement) inHwid.value = deviceId;
        }
        const rawTier = params.get("tier") || params.get("plan") || "";
        const rawNorm = String(rawTier).trim().toUpperCase().replace(/[^A-Z0-9_]/g, "");
        if (rawNorm && esClaveSegura(rawNorm) && (PLAN_LOOKUP[rawNorm] || PLAN_ALIASES[rawNorm])) {
            abrirModalPago(rawNorm);
        }
    }

    function inicializarTemaVisual() {
        const rootEl = document.documentElement;
        const btn = document.getElementById("themeToggleBtn");
        let saved = "dark";
        try {
            if (typeof window.localStorage !== "undefined") {
                const raw = window.localStorage.getItem("tf_theme");
                if (raw === "light" || raw === "dark") saved = raw;
            }
        } catch {
            saved = "dark";
        }

        function aplicarTema(tema) {
            if (tema === "light") {
                rootEl.setAttribute("data-theme", "light");
                if (btn) btn.textContent = "🌙";
            } else {
                rootEl.removeAttribute("data-theme");
                if (btn) btn.textContent = "☀️";
            }
            try {
                if (typeof window.localStorage !== "undefined") {
                    window.localStorage.setItem("tf_theme", tema);
                }
            } catch {
                // Silencioso en contextos restringidos
            }
        }

        aplicarTema(saved);
        if (btn instanceof HTMLElement && !btn.dataset.themeBound) {
            btn.dataset.themeBound = "1";
            btn.addEventListener("click", () => {
                const isLight = rootEl.getAttribute("data-theme") === "light";
                aplicarTema(isLight ? "dark" : "light");
            });
        }
    }

    function inicializarSelectorFacturacion() {
        const btns = document.querySelectorAll("[data-billing-view]");
        if (!btns.length) return;

        function actualizarVistaTarifas(mode) {
            btns.forEach((b) => b.classList.toggle("is-active", b.getAttribute("data-billing-view") === mode));
            document.querySelectorAll("[data-plan-price]").forEach((el) => {
                const planId = el.getAttribute("data-plan-price");
                const plan = planId && esClaveSegura(planId) ? PLAN_LOOKUP[planId] : null;
                if (!plan) return;
                el.textContent = "";
                if (mode === "monthly") {
                    const mensual = (plan.precioUsd / 12).toFixed(2);
                    el.appendChild(document.createTextNode(`$${mensual} `));
                    el.appendChild(crearEl("span", "period", "/ mes*"));
                } else {
                    el.appendChild(document.createTextNode(`${formatearUsd(plan.precioUsd).replace(".00", "")} `));
                    el.appendChild(crearEl("span", "period", "/ año"));
                }
            });
        }

        btns.forEach((b) => {
            b.addEventListener("click", () => actualizarVistaTarifas(b.getAttribute("data-billing-view") || "annual"));
        });
    }

    function asegurarModalCuenta(tabInicial) {
        let modal = document.getElementById("modalCuentaHibrida");
        if (!modal) {
            const overlay = crearEl("div", "modal-overlay");
            overlay.id = "modalCuentaHibrida";
            overlay.setAttribute("role", "dialog");
            overlay.setAttribute("aria-modal", "true");

            const box = crearEl("div", "modal-box");
            const top = crearEl("div", "modal-top");
            const tw = crearEl("div");
            tw.appendChild(crearEl("span", "modal-badge", "PORTAL CLIENTES & INVITADOS — SUPABASE AUTH"));
            tw.appendChild(crearEl("h3", "", "Mi Cuenta, Órdenes y Equipos (+1 PC Adicional)"));
            const btnX = crearEl("button", "btn-close", "×");
            btnX.type = "button";
            btnX.setAttribute("aria-label", "Cerrar modal de cuenta");
            btnX.addEventListener("click", () => cerrarModal("modalCuentaHibrida"));
            top.appendChild(tw);
            top.appendChild(btnX);

            const content = crearEl("div", "modal-content");
            const tabs = crearEl("div", "hybrid-tabs-bar");
            const bGuest = crearEl("button", "hybrid-tab-btn is-active", "🔍 Consultar Orden (Invitado)");
            bGuest.type = "button";
            const bAcc = crearEl("button", "hybrid-tab-btn", "🔐 Mi Cuenta (Supabase Auth)");
            bAcc.type = "button";
            tabs.appendChild(bGuest);
            tabs.appendChild(bAcc);

            const pGuest = crearEl("div", "hybrid-panel");
            const gGrid = crearEl("div", "hybrid-form-grid");
            const iRef = crearEl("input", "mono-input");
            iRef.placeholder = "Referencia TF-...";
            const iTok = crearEl("input", "mono-input");
            iTok.placeholder = "Token TFTK-...";
            const iEmail = crearEl("input", "text-input");
            iEmail.type = "email";
            iEmail.placeholder = "Correo de compra";
            gGrid.appendChild(iRef);
            gGrid.appendChild(iTok);
            gGrid.appendChild(iEmail);
            const bLookup = crearEl("button", "btn-glow", "Consultar Estado sin Contraseña");
            bLookup.type = "button";
            const guestOut = crearEl("div", "muted-note", "");
            bLookup.addEventListener("click", async () => {
                const resp = await postJsonSeguroApi("api/orders/status", {
                    order_ref: iRef.value.trim(),
                    order_token: iTok.value.trim(),
                    email: sanitizarCorreoInput(iEmail.value),
                });
                guestOut.textContent = resp.ok
                    ? `Orden ${resp.data.order_ref} • Estado: ${resp.data.status} • Monto: ${formatearUsd(resp.data.monto_autorizado_usd)} • Estaciones: ${resp.data.estaciones_autorizadas} PC(s)`
                    : `ℹ️ ${resp.data?.message || "No se encontró una orden activa con esa referencia, token y correo."}`;
            });
            pGuest.appendChild(gGrid);
            pGuest.appendChild(bLookup);
            pGuest.appendChild(guestOut);

            const pAcc = crearEl("div", "hybrid-panel");
            pAcc.style.display = "none";
            const aGrid = crearEl("div", "hybrid-form-grid");
            const aEmail = crearEl("input", "text-input");
            aEmail.type = "email";
            aEmail.placeholder = "correo@estudio.ec";
            const aPass = crearEl("input", "text-input");
            aPass.type = "password";
            aPass.placeholder = "Contraseña (mín. 10 caracteres)";
            aGrid.appendChild(aEmail);
            aGrid.appendChild(aPass);

            const aActions = crearEl("div", "flex-wrap-actions");
            const bLogin = crearEl("button", "btn-glow", "Iniciar Sesión");
            bLogin.type = "button";
            const bSignup = crearEl("button", "btn-glass", "Crear Cuenta");
            bSignup.type = "button";
            const bRecover = crearEl("button", "btn-glass", "Recuperar Clave");
            bRecover.type = "button";
            aActions.appendChild(bLogin);
            aActions.appendChild(bSignup);
            aActions.appendChild(bRecover);

            const accOut = crearEl("div", "muted-note", "Las contraseñas se cifran exclusivamente en Supabase Auth.");
            async function runAuth(action) {
                const resp = await postJsonSeguroApi("api/auth/supabase", {
                    action,
                    email: sanitizarCorreoInput(aEmail.value),
                    password: action === "recover" ? undefined : aPass.value,
                });
                if (resp.ok && resp.data?.access_token) {
                    estadoHibrido.accessToken = resp.data.access_token;
                    estadoHibrido.userEmail = resp.data.user?.email || aEmail.value;
                    const stLbl = document.getElementById("checkoutAccountStatus");
                    if (stLbl) stLbl.textContent = `Sesión activa: ${estadoHibrido.userEmail}`;
                    const dash = await postJsonSeguroApi("api/auth/supabase", { action: "dashboard" }, estadoHibrido.accessToken);
                    if (dash.ok) {
                        accOut.textContent = `Sesión ${estadoHibrido.userEmail}: ${dash.data.orders.length} orden(es), ${dash.data.licenses.length} licencia(s) activas (+1 PC Adicional incluido en detalle).`;
                    } else {
                        accOut.textContent = `Sesión iniciada correctamente como ${estadoHibrido.userEmail}.`;
                    }
                } else {
                    accOut.textContent = resp.data?.message || `ℹ️ ${resp.data?.error || "Configura SUPABASE_URL y SUPABASE_ANON_KEY para habilitar Supabase Auth."}`;
                }
            }
            bLogin.addEventListener("click", () => runAuth("login"));
            bSignup.addEventListener("click", () => runAuth("signup"));
            bRecover.addEventListener("click", () => runAuth("recover"));

            pAcc.appendChild(aGrid);
            pAcc.appendChild(aActions);
            pAcc.appendChild(accOut);

            function setAccTab(which) {
                const isAcc = which === "account";
                bGuest.classList.toggle("is-active", !isAcc);
                bAcc.classList.toggle("is-active", isAcc);
                pGuest.style.display = isAcc ? "none" : "flex";
                pAcc.style.display = isAcc ? "flex" : "none";
            }
            bGuest.addEventListener("click", () => setAccTab("guest"));
            bAcc.addEventListener("click", () => setAccTab("account"));

            content.appendChild(tabs);
            content.appendChild(pGuest);
            content.appendChild(pAcc);
            box.appendChild(top);
            box.appendChild(content);
            overlay.appendChild(box);
            overlay._setAccTab = setAccTab;
            document.body.appendChild(overlay);
            modal = overlay;
        }
        if (typeof modal._setAccTab === "function") {
            modal._setAccTab(tabInicial === "account" ? "account" : "guest");
        }
        if (modal instanceof HTMLElement) modal.style.display = "flex";
    }

    function inicializarSoporteOrdenes() {
        const btn = document.getElementById("btnLookupGuestOrder");
        const inRef = document.getElementById("lookupOrderRef");
        const inTok = document.getElementById("lookupOrderToken");
        const inEmail = document.getElementById("lookupOrderEmail");
        const out = document.getElementById("lookupOrderResult");
        if (btn && inRef instanceof HTMLInputElement && inTok instanceof HTMLInputElement && out) {
            btn.addEventListener("click", async () => {
                const resp = await postJsonSeguroApi("api/orders/status", {
                    order_ref: inRef.value.trim(),
                    order_token: inTok.value.trim(),
                    email: inEmail instanceof HTMLInputElement ? sanitizarCorreoInput(inEmail.value) : "",
                });
                out.textContent = resp.ok
                    ? `✅ Orden ${resp.data.order_ref} • Estado: ${resp.data.status} • Plan: ${resp.data.plan_id} (${resp.data.estaciones_autorizadas} PC) • Monto: ${formatearUsd(resp.data.monto_autorizado_usd)}`
                    : `ℹ️ ${resp.data?.message || "No fue posible consultar la orden en este entorno."}`;
            });
        }
    }

    /* ======================================================================
       Inicialización Principal
       ====================================================================== */
    document.addEventListener("DOMContentLoaded", () => {
        if (activarGuardiaAntiClickjacking()) {
            return;
        }

        iniciarGuardiaMutacionDOM();
        aplicarVersionEnDOM(CONFIG_COMERCIAL.VERSION);
        inicializarTemaVisual();

        asegurarModalPago();
        asegurarModalLegal();
        asegurarBotonFlotanteSoporte();
        hidratarDescargasPorSistemaOperativo();
        sincronizarConfiguracionPortal();
        inicializarSimuladorAhorro();
        inicializarCalculadoraAddonCorp();
        inicializarSelectorFacturacion();
        inicializarPestanasGuiaUso();
        inicializarSoporteOrdenes();

        // Fallback seguro CSP para logotipos SVG -> PNG
        document.querySelectorAll("img[data-fallback]").forEach((img) => {
            if (!(img instanceof HTMLImageElement)) return;
            img.addEventListener("error", () => {
                const fb = img.getAttribute("data-fallback");
                if (fb && !contieneCaracterControlOSchemeMalo(fb) && img.getAttribute("src") !== fb) {
                    img.setAttribute("src", fb);
                }
            });
        });

        // Menú desplegable "9 Módulos ▾" en todas las páginas
        const MODULOS_PORTAL = [
            { icon: "📊", title: "1. Panel General", desc: "Tablero KPIs, vencimientos y cupo ético", href: "modulos/panel-general.html" },
            { icon: "🏢", title: "2. Mis Contribuyentes", desc: "Multi-RUC, SQLite HWID y respaldo .tfbkp", href: "modulos/mis-contribuyentes.html" },
            { icon: "⚡", title: "3. Sincronizar SRI", desc: "Árbol contable jerárquico XML y RIDE", href: "modulos/sincronizar-sri.html" },
            { icon: "📥", title: "4. Importar Comprobantes", desc: "Claves .txt del SRI y lotes XML masivos", href: "modulos/importar-comprobantes.html" },
            { icon: "🕵️", title: "5. Auditor Fantasma SRI", desc: "Cruce preventivo contra empresas fantasma", href: "modulos/auditor-fantasma.html" },
            { icon: "🔎", title: "6. Búsqueda RUC / Cédula", desc: "Consulta tributaria directa sin bloqueos", href: "modulos/busqueda-ruc.html" },
            { icon: "📚", title: "7. Consulta Masiva", desc: "Verificación en lote y exportación Excel/CSV", href: "modulos/consulta-masiva.html" },
            { icon: "📑", title: "8. Generador y Validador ATS", desc: "XML ATS oficial, XSD y clave contingencia", href: "modulos/generador-ats.html" },
            { icon: "🔐", title: "9. Ajustes, Red LAN y Blindaje", desc: "Permisos ✓/🔒, estaciones TCP/IP y UNC", href: "modulos/ajustes-seguridad.html" },
        ];

        const navRoot = obtenerPrefijoRuta();
        const currentPage = (window.location.pathname || "").split("/").pop() || "";

        function esModoMovilNav() {
            return window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
        }

        function cerrarDropdowns(excluir) {
            document.querySelectorAll("[data-nav-dropdown]").forEach((dd) => {
                if (dd === excluir) return;
                if (typeof dd._closeNavDropdown === "function") {
                    dd._closeNavDropdown();
                } else {
                    dd.classList.remove("is-open");
                    const btn = dd.querySelector(".nav-dropdown-trigger");
                    if (btn) btn.setAttribute("aria-expanded", "false");
                }
            });
        }

        document.querySelectorAll("[data-nav-dropdown]").forEach((dd) => {
            const trigger = dd.querySelector(".nav-dropdown-trigger");
            const panel = dd.querySelector(".nav-dropdown-panel");
            if (!(trigger instanceof HTMLElement) || !(panel instanceof HTMLElement)) return;

            const header = crearEl("div", "nav-dropdown-header", "Suite Completa — 9 Módulos TributaFlow ERP v3.0.0");
            const grid = crearEl("div", "nav-dropdown-grid");

            MODULOS_PORTAL.forEach((mod) => {
                const link = document.createElement("a");
                const isCurrent = Boolean(currentPage && mod.href.endsWith("/" + currentPage));
                link.href = `${navRoot}${mod.href}`;
                link.className = isCurrent ? "nav-dropdown-item is-current" : "nav-dropdown-item";
                link.setAttribute("role", "menuitem");
                if (isCurrent) link.setAttribute("aria-current", "page");

                const iconSpan = crearEl("span", "nav-dropdown-icon", mod.icon);
                iconSpan.setAttribute("aria-hidden", "true");
                const textWrap = crearEl("span", "nav-dropdown-text");
                textWrap.appendChild(crearEl("span", "nav-dropdown-title", mod.title));
                textWrap.appendChild(crearEl("span", "nav-dropdown-desc", mod.desc));
                link.appendChild(iconSpan);
                link.appendChild(textWrap);
                grid.appendChild(link);
            });

            const footer = crearEl("div", "nav-dropdown-footer");
            const allLink = document.createElement("a");
            allLink.href = `${navRoot}index.html#modulos`;
            allLink.className = "nav-dropdown-all";
            allLink.textContent = "Ver resumen completo en portada ➔";
            footer.appendChild(allLink);

            panel.textContent = "";
            panel.appendChild(header);
            panel.appendChild(grid);
            panel.appendChild(footer);

            let hoverCloseTimer = null;
            let pinnedByClick = false;
            let lastHoverOpenTs = 0;

            function abrirDd(pinned) {
                if (hoverCloseTimer) {
                    clearTimeout(hoverCloseTimer);
                    hoverCloseTimer = null;
                }
                cerrarDropdowns(dd);
                dd.classList.add("is-open");
                trigger.setAttribute("aria-expanded", "true");
                if (pinned) pinnedByClick = true;
            }

            function cerrarDd() {
                if (hoverCloseTimer) {
                    clearTimeout(hoverCloseTimer);
                    hoverCloseTimer = null;
                }
                dd.classList.remove("is-open");
                trigger.setAttribute("aria-expanded", "false");
                pinnedByClick = false;
            }

            dd._closeNavDropdown = cerrarDd;

            dd.addEventListener("mouseenter", () => {
                if (esModoMovilNav()) return;
                if (hoverCloseTimer) {
                    clearTimeout(hoverCloseTimer);
                    hoverCloseTimer = null;
                }
                if (!dd.classList.contains("is-open")) {
                    lastHoverOpenTs = Date.now();
                    abrirDd(false);
                }
            });

            dd.addEventListener("mouseleave", () => {
                if (esModoMovilNav() || pinnedByClick) return;
                hoverCloseTimer = setTimeout(cerrarDd, 160);
            });

            trigger.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                const isOpen = dd.classList.contains("is-open");
                if (!esModoMovilNav() && isOpen && !pinnedByClick && Date.now() - lastHoverOpenTs < 400) {
                    pinnedByClick = true;
                    return;
                }
                if (isOpen) {
                    cerrarDd();
                } else {
                    abrirDd(true);
                }
            });
        });

        // Blindaje y copia en enlaces estáticos de Soporte Oficial y enlaces externos
        document.querySelectorAll('[data-support-link="whatsapp"]').forEach((el) => {
            if (el instanceof HTMLAnchorElement) {
                el.setAttribute("data-tf-canal-seguro", "whatsapp");
                el.setAttribute("rel", "noopener noreferrer");
            }
        });
        document.querySelectorAll('[data-support-link="correo"]').forEach((el) => {
            if (el instanceof HTMLAnchorElement) {
                el.setAttribute("data-tf-canal-seguro", "correo");
                vincularCopiaCorreo(el, () =>
                    construirPlantillaSoporte(`TributaFlow ERP v${runtimeVersion}`, "")
                );
            }
        });
        document.querySelectorAll('a[target="_blank"]').forEach((el) => {
            if (el instanceof HTMLAnchorElement) {
                el.setAttribute("rel", "noopener noreferrer");
            }
        });

        if (!window.__TF_GUARDIAN_ENLACES__) {
            window.__TF_GUARDIAN_ENLACES__ = true;
            document.addEventListener(
                "click",
                (e) => {
                    const target = e.target;
                    if (!(target instanceof Element)) return;
                    const link = target.closest("a");
                    if (!(link instanceof HTMLAnchorElement)) return;

                    const hrefRaw = link.getAttribute("href") || "";
                    if (contieneCaracterControlOSchemeMalo(hrefRaw)) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        registrarBloqueoSeguridad("DANGEROUS_CLICK_SCHEME", hrefRaw);
                        mostrarToastCopia("⛔ Enlace peligroso neutralizado por seguridad.");
                        return;
                    }

                    if (link.hasAttribute("data-tf-canal-seguro")) {
                        const tipo = link.getAttribute("data-tf-canal-seguro") || "auto";
                        if (!validarDestinoSeguro(hrefRaw, tipo)) {
                            e.preventDefault();
                            e.stopImmediatePropagation();
                            registrarBloqueoSeguridad("TAMPERED_CHANNEL_CLICK", hrefRaw);
                            mostrarToastCopia("⛔ Enlace bloqueado por seguridad: canal oficial no verificado.");
                        }
                    }
                },
                true
            );
        }

        // Menú hamburguesa móvil accesible
        const navToggle = document.getElementById("navToggle");
        const navMenu = document.getElementById("navMenu");
        if (navToggle instanceof HTMLElement && navMenu instanceof HTMLElement) {
            navToggle.addEventListener("click", (e) => {
                e.stopPropagation();
                const isOpen = navMenu.classList.toggle("is-open");
                navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
                if (!isOpen) cerrarDropdowns();
            });

            navMenu.querySelectorAll("a, .nav-cta").forEach((el) => {
                el.addEventListener("click", () => {
                    cerrarDropdowns();
                    navMenu.classList.remove("is-open");
                    navToggle.setAttribute("aria-expanded", "false");
                });
            });
        }

        document.addEventListener("click", (e) => {
            const target = e.target;
            if (!(target instanceof Element)) return;
            if (!target.closest("[data-nav-dropdown]")) {
                cerrarDropdowns();
            }
            if (navMenu && navToggle && !target.closest("#navMenu") && !target.closest("#navToggle")) {
                navMenu.classList.remove("is-open");
                navToggle.setAttribute("aria-expanded", "false");
            }
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                cerrarDropdowns();
                if (navMenu) navMenu.classList.remove("is-open");
                if (navToggle) navToggle.setAttribute("aria-expanded", "false");
                document.querySelectorAll(".modal-overlay").forEach((m) => {
                    if (m instanceof HTMLElement) m.style.display = "none";
                });
            }
        });

        // Checkout modal (solo botones explícitos con data-checkout-plan)
        document.querySelectorAll("[data-checkout-plan]").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                const extraAttr = btn.getAttribute("data-checkout-extra-seats");
                const extraOverride = extraAttr !== null ? Number(extraAttr) : undefined;
                abrirModalPago(btn.getAttribute("data-checkout-plan"), Number.isFinite(extraOverride) ? extraOverride : undefined);
            });
        });

        // Modal Cuenta / Consulta Invitado Supabase
        document.querySelectorAll("[data-open-account-modal]").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                asegurarModalCuenta("guest");
            });
        });

        // Triggers de descarga por SO (desktop -> modal instalador; móvil/iPadOS -> bloqueo amigable sin GitHub)
        document.querySelectorAll("[data-download-os]").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                abrirModalDescargaSO(btn.getAttribute("data-download-os") || "auto");
            });
        });

        // Modales legales
        document.querySelectorAll("[data-legal]").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                abrirModalLegal(btn.getAttribute("data-legal"));
            });
        });

        // Botón rápido volver arriba en footer unificado
        document.querySelectorAll("[data-scroll-top]").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
            });
        });

        window.addEventListener("click", (e) => {
            if (e.target instanceof HTMLElement && e.target.classList.contains("modal-overlay")) {
                e.target.style.display = "none";
            }
        });

        leerParametrosUrlSeguros();
    });

    if (!Object.prototype.hasOwnProperty.call(window, "__TF_SECURITY__")) {
        Object.defineProperty(window, "__TF_SECURITY__", {
            value: congelarProfundo({
                CONFIG_COMERCIAL,
                PLANES_V240,
                INSTALADORES_SO,
                TEXTOS_LEGALES,
                validarDestinoSeguro,
                esUrlPayphoneSegura,
                esUrlWhatsappSegura,
                esUrlWhatsappShareSegura,
                esUrlCorreoSegura,
                esUrlDescargaOficialSegura,
                esUrlPortalOficialSegura,
                asignarEnlaceSeguro,
                detectarSistemaOperativo,
                detectarInfoSistemaOperativo,
                esSistemaOperativoSoportado,
                sanitizarIdentificador,
                resolverPlan,
                calcularEstimacionSimulador,
                abrirModalDescargaSO,
                abrirModalPago,
                obtenerTelemetria: () => Object.freeze({ ...telemetriaInterna }),
            }),
            writable: false,
            configurable: false,
            enumerable: true,
        });
    }
})();
