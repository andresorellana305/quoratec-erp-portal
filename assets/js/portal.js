/**
 * QuoraTec ERP v3.0.0 (Edición 2026) — Motor Comercial, Add-ons, version.json y Blindaje Web
 * Dominio oficial: https://erp.quoratec.com
 * Desarrollado por QuoraTec (Ecuador).
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

    const URL_PORTAL_DESCARGAS = "https://erp.quoratec.com/#descargas";

    const CONFIG_COMERCIAL = congelarProfundo({
        VERSION: "3.0.0",
        EDICION: "Edición 2026",
        FABRICANTE: "QuoraTec",
        TRIAL_DIAS: 15,
        TRIAL_RUCS: 40,
        TRIAL_MODALIDAD: "Estudio Contable",
        DOMINIO_OFICIAL: "https://erp.quoratec.com",
        URL_DESCARGAS_PORTAL: URL_PORTAL_DESCARGAS,
        API_CONFIG_PATH: "api/config_comercial.json",
        VERSION_JSON_PATH: "version.json",
        PAYPHONE_ACTIVO: false,
        PAYPHONE_ESTADO: "Próximamente / En actualización",
        PAYPHONE_LINKS: {
            EMPRENDEDOR: null,
            COMERCIAL_PRO: null,
            CONTADOR: null,
            ESTUDIO_CONTABLE: null,
            ENTERPRISE: null,
        },
        QR_DEUNA_SRC: "assets/qr-deuna.png",
        QR_DEUNA_SUBPAGE_SRC: "../assets/qr-deuna.png",
        TITULAR_RECAUDO: "QuoraTec — Recaudo Oficial QuoraTec ERP",
        TITULAR_NOTA_BANCO:
            "Canal principal activo: Deuna! y transferencia directa a nombre del recaudo oficial QuoraTec (QuoraTec ERP). Consulta la cuenta vigente por WhatsApp oficial (0996459771).",
        BANCO_RECAUDO: "Banco Pichincha / Deuna!",
        TIPO_CUENTA_RECAUDO: "Recaudo Oficial QuoraTec (Deuna! Directo)",
        NUMERO_CUENTA_RECAUDO: "Solicitar número vigente por WhatsApp Oficial (0996459771)",
        WHATSAPP_NUMERO: "593996459771",
        WHATSAPP_LOCAL: "0996459771",
        WHATSAPP_URL_PREFIX: "https://wa.me/593996459771",
        CORREO_SOPORTE: "soporte@quoratec.com",
        MAILTO_URL_PREFIX: "mailto:soporte@quoratec.com",
        ASUNTO_SOPORTE: "Consulta Soporte Técnico — QuoraTec ERP v3.0.0",
        DOMINIOS_PAYPHONE: ["ppls.me", "payphone.app"],
        GITHUB_RELEASES_PREFIX: "/andresorellana305/quoratec-erp/releases/download/v3.0.0/",
        PAYPHONE_BADGES: "Visa · Mastercard · Diners · Discover · Alia",
        PAYPHONE_GARANTIA: "⏳ PayPhone en mantenimiento: Próximamente / En actualización. Usa Deuna! para activación inmediata.",
        PRECIO_SEAT_EXTRA_USD: 49,
        PRECIO_RUCS_PACK_USD: 59,
        PRECIO_CLOUD_PACK_USD: 59,
        PRECIO_EMPRENDEDOR_NUBE_USD: 29,
        DESCUENTO_FUNDADORES_PCT: 25,
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
        EMPRENDEDOR: {
            id: "EMPRENDEDOR",
            nombre: "Emprendedor",
            nombreComercial: "QuoraTec ERP Emprendedor",
            precioRegularUsd: 69,
            precioUsd: 69,
            rucsMax: 1,
            rucsLabel: "1 RUC/Cédula",
            masivaLabel: "Todas las funcionalidades 100 % desbloqueadas · Modo Local (Nube opc. +$29/10 GB)",
            estacionesBase: 1,
            estacionesLabel: "1 PC",
            nubeGbBase: 0,
            modoLabel: "Modo Local (Nube opcional +$29/año - 10 GB)",
            esEnterprise: false,
            permiteExtraSeats: true,
        },
        COMERCIAL_PRO: {
            id: "COMERCIAL_PRO",
            nombre: "Comercial Pro",
            nombreComercial: "QuoraTec ERP Comercial Pro",
            precioRegularUsd: 149,
            precioUsd: 149,
            rucsMax: 1,
            rucsLabel: "1 RUC",
            masivaLabel: "Todas las funciones 100 % desbloqueadas · POS F2/F4/F8/F12 · Farmacias FIFO · 10 GB",
            estacionesBase: 1,
            estacionesLabel: "1 PC",
            nubeGbBase: 10,
            modoLabel: "Local + Nube Híbrida (10 GB)",
            esEnterprise: false,
            permiteExtraSeats: true,
        },
        CONTADOR: {
            id: "CONTADOR",
            nombre: "Contador",
            nombreComercial: "QuoraTec ERP Contador",
            precioRegularUsd: 239,
            precioUsd: 239,
            rucsMax: 15,
            rucsLabel: "Hasta 15 RUCs",
            masivaLabel: "Todas las funciones desbloqueadas · 15 RUCs · SRI Cédula/RUC · AGP · NIIF · 20 GB",
            estacionesBase: 1,
            estacionesLabel: "1 PC",
            nubeGbBase: 20,
            modoLabel: "Local + Nube Híbrida (20 GB)",
            esEnterprise: false,
            permiteExtraSeats: true,
        },
        ESTUDIO_CONTABLE: {
            id: "ESTUDIO_CONTABLE",
            nombre: "Estudio Contable",
            nombreComercial: "QuoraTec ERP Estudio Contable",
            precioRegularUsd: 449,
            precioUsd: 449,
            rucsMax: 40,
            rucsLabel: "Hasta 40 RUCs",
            masivaLabel: "Todas las funciones desbloqueadas · 40 RUCs · 3 PCs · Nube Total + Híbrido + Oficina (50 GB)",
            estacionesBase: 3,
            estacionesLabel: "3 PCs",
            nubeGbBase: 50,
            modoLabel: "Nube Total + Híbrido + Oficina (50 GB)",
            esEnterprise: true,
            permiteExtraSeats: true,
        },
        ENTERPRISE: {
            id: "ENTERPRISE",
            nombre: "Enterprise",
            nombreComercial: "QuoraTec ERP Enterprise",
            precioRegularUsd: 849,
            precioUsd: 849,
            rucsMax: 100,
            rucsLabel: "Hasta 100 RUCs",
            masivaLabel: "Todas las funciones desbloqueadas · 100 RUCs · 10 PCs · Nube Total Dedicada (150 GB)",
            estacionesBase: 10,
            estacionesLabel: "10 PCs",
            nubeGbBase: 150,
            modoLabel: "Nube Total Dedicada (150 GB)",
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
            archivo: "Setup_QuoraTec_ERP_v3.0.0.exe",
            tamano: "66.2 MB • Instalador Windows x64",
            url: "https://github.com/andresorellana305/quoratec-erp/releases/download/v3.0.0/Setup_QuoraTec_ERP_v3.0.0.exe",
            sha256: "350a7f2cb1ba50a8cea87563b7e773357b5f8e9fa9d0f359401e0e9dc4c9e232",
            sha256Url: "https://github.com/andresorellana305/quoratec-erp/releases/download/v3.0.0/SHA256SUMS.txt",
            comandoSha256: 'certutil -hashfile "Setup_QuoraTec_ERP_v3.0.0.exe" SHA256',
            alternativaId: "windows_zip",
            pasos: [
                "1. Descarga Setup_QuoraTec_ERP_v3.0.0.exe (66.2 MB) o la versión Portable .zip (86.3 MB).",
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
            archivo: "QuoraTec_ERP_v3.0.0_Windows_x64.zip",
            tamano: "86.3 MB • Portable sin instalación",
            url: "https://github.com/andresorellana305/quoratec-erp/releases/download/v3.0.0/QuoraTec_ERP_v3.0.0_Windows_x64.zip",
            sha256: "ca49bcd4eea13b496a618122aa742d5de5c898f176e7eda326ad2d8b33a0c051",
            sha256Url: "https://github.com/andresorellana305/quoratec-erp/releases/download/v3.0.0/SHA256SUMS.txt",
            comandoSha256: 'certutil -hashfile "QuoraTec_ERP_v3.0.0_Windows_x64.zip" SHA256',
            pasos: [
                "1. Descarga y descomprime QuoraTec_ERP_v3.0.0_Windows_x64.zip (86.3 MB) en una carpeta local.",
                "2. Verifica el SHA-256 (ca49bcd4...33a0c051) antes de ejecutar QuoraTec_ERP.exe.",
                "3. Tus datos, claves SRI y firma .p12 quedan cifrados localmente con AES-256-GCM y respaldos .tfbackup.",
            ],
        },
        macos: {
            id: "macos",
            etiqueta: "macOS (.dmg)",
            modalId: "modalDescargaMacos",
            titulo: "Descargar para macOS Universal (Apple Silicon / Intel — 93.6 MB)",
            badge: "IMAGEN OFICIAL MACOS .DMG",
            archivo: "QuoraTec_ERP_v3.0.0_macOS.dmg",
            tamano: "93.6 MB • Imagen de disco macOS",
            url: "https://github.com/andresorellana305/quoratec-erp/releases/download/v3.0.0/QuoraTec_ERP_v3.0.0_macOS.dmg",
            sha256: "374e5ca4444b290662e417403ea0848bb77fe0215243fe52299743d7d8ad24df",
            sha256Url: "https://github.com/andresorellana305/quoratec-erp/releases/download/v3.0.0/SHA256SUMS.txt",
            comandoSha256: "shasum -a 256 QuoraTec_ERP_v3.0.0_macOS.dmg",
            pasos: [
                "1. Abre QuoraTec_ERP_v3.0.0_macOS.dmg (93.6 MB) tras validar su SHA-256 (374e5ca4...d8ad24df) y arrastra a Aplicaciones.",
                "2. La primera vez, haz Control + clic sobre QuoraTec ERP y selecciona Abrir.",
                "3. Disfruta 15 días gratis con todas las funcionalidades 100 % desbloqueadas antes de activar tu licencia anual.",
            ],
        },
        linux: {
            id: "linux",
            etiqueta: "Linux .deb",
            modalId: "modalDescargaLinux",
            titulo: "Descargar para Linux Debian / Ubuntu (.deb — 95.6 MB)",
            badge: "PAQUETE OFICIAL LINUX .DEB",
            archivo: "QuoraTec_ERP_v3.0.0_Linux_amd64.deb",
            tamano: "95.6 MB • Paquete Debian/Ubuntu amd64",
            url: "https://github.com/andresorellana305/quoratec-erp/releases/download/v3.0.0/QuoraTec_ERP_v3.0.0_Linux_amd64.deb",
            sha256: "2c5e48ae14c8dfce3d3e5f975e236a93be663fd138ef6f81dcb9a4ec5c2d052a",
            sha256Url: "https://github.com/andresorellana305/quoratec-erp/releases/download/v3.0.0/SHA256SUMS.txt",
            comandoSha256: "sha256sum QuoraTec_ERP_v3.0.0_Linux_amd64.deb",
            alternativaId: "linux_tar",
            pasos: [
                "1. Verifica el SHA-256 (2c5e48ae...5c2d052a) e instala con: sudo apt install ./QuoraTec_ERP_v3.0.0_Linux_amd64.deb",
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
            archivo: "QuoraTec_ERP_v3.0.0_Linux_x64.tar.gz",
            tamano: "123.3 MB • Distros Linux x64",
            url: "https://github.com/andresorellana305/quoratec-erp/releases/download/v3.0.0/QuoraTec_ERP_v3.0.0_Linux_x64.tar.gz",
            sha256: "b4e5da23885fe7126dabe59a0120ef2fc688ad0a6124407a722bae4429c09b1b",
            sha256Url: "https://github.com/andresorellana305/quoratec-erp/releases/download/v3.0.0/SHA256SUMS.txt",
            comandoSha256: "sha256sum QuoraTec_ERP_v3.0.0_Linux_x64.tar.gz",
            pasos: [
                "1. Valida el SHA-256 (b4e5da23...29c09b1b) y extrae con: tar -xzf QuoraTec_ERP_v3.0.0_Linux_x64.tar.gz",
                "2. Ejecuta QuoraTec_ERP desde la carpeta extraída sin requerir privilegios root.",
                "3. Accede a 15 días gratis con todo desbloqueado o activa tu archivo de licencia .lic.",
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
            url: "https://github.com/andresorellana305/quoratec-erp/releases/download/v3.0.0/SHA256SUMS.txt",
            sha256: "a86675219f227ab4831dfa34e00253fc735e161eef1fd0dc88a40c35f25685ba",
            sha256Url: "https://github.com/andresorellana305/quoratec-erp/releases/download/v3.0.0/SHA256SUMS.txt",
            comandoSha256: "sha256sum -c SHA256SUMS.txt",
            pasos: [
                "1. Descarga SHA256SUMS.txt junto a tu instalador oficial v3.0.0.",
                "2. Verifica que el digest hexadecimal del paquete descargado sea idéntico al publicado en version.json.",
                "3. Canal oficial exclusivo QuoraTec: andresorellana305/quoratec-erp.",
            ],
        },
    });

    const TEXTOS_LEGALES = congelarProfundo({
        terminos: {
            titulo: "Acuerdo de Licencia de Usuario Final y Condiciones de Uso — v3.0.0 (Edición 2026)",
            secciones: [
                {
                    sub: "1. Suscripción Anual (365 Días) — Todas las Funcionalidades Desbloqueadas",
                    txt: "QuoraTec otorga licencia anual de 365 días para QuoraTec ERP — Edición 2026 con todas las funciones 100 % desbloqueadas en los 5 planes: Emprendedor ($69/año, 1 RUC/Cédula, 1 PC, Modo Local), Comercial Pro ($149/año, 1 RUC, 1 PC, Nube Híbrida 10 GB), Contador ($239/año, hasta 15 RUCs, 1 PC, Nube Híbrida 20 GB), Estudio Contable ($449/año, hasta 40 RUCs, 3 PCs, Nube Total + Híbrido + Oficina 50 GB) y Enterprise ($849/año, hasta 100 RUCs, 10 PCs, Nube Dedicada 150 GB). Tras los 15 días gratis o al vencer sin renovar, pasa a Modo Solo Lectura sin borrar datos.",
                },
                {
                    sub: "2. Deslinde Tributario y Responsabilidad Profesional",
                    txt: "QuoraTec ERP actúa como herramienta de asistencia, automatización comercial/contable y prevalidación documental ante el SRI e IESS. La revisión, declaración y cumplimiento tributario final corresponden al contribuyente o su contador; QuoraTec no asume multas, intereses ni contingencias por indisponibilidad o cambios externos de los servidores del SRI o IESS.",
                },
                {
                    sub: "3. Política de Pagos (Deuna!) y Reembolsos",
                    txt: "El canal de pago principal activo es Deuna! (y transferencia bancaria directa); PayPhone se encuentra temporalmente en actualización (Próximamente). Al disponerse de 15 días gratis con todas las funcionalidades desbloqueadas antes de comprar, no proceden devoluciones ni reembolsos una vez emitido el archivo .lic.",
                },
            ],
        },
        privacidad: {
            titulo: "Privacidad Local-First (AES-256-GCM), IA Local y Cumplimiento LOPDP Ecuador",
            secciones: [
                {
                    sub: "1. Cifrado AES-256-GCM y Cero Almacenamiento Central de Credenciales",
                    txt: "Bajo arquitectura Local-First, la base contable SQLite, tus claves del SRI en Línea, certificados de firma electrónica .p12 y el Copiloto IA Local operan cifrados con AES-256-GCM. QuoraTec no recopila, vende ni expone tus credenciales tributarias.",
                },
                {
                    sub: "2. Cumplimiento LOPDP Ecuador y Nube Híbrida / Dedicada",
                    txt: "El tratamiento de datos personales de licenciamiento cumple estrictamente la Ley Orgánica de Protección de Datos Personales (LOPDP) del Ecuador. La sincronización en Nube Híbrida/Dedicada opera bajo políticas aisladas Supabase RLS bajo control directo del titular.",
                },
            ],
        },
        licenciamiento: {
            titulo: "Reembolsos, Traslado .tfbackup y Soporte Oficial QuoraTec",
            secciones: [
                {
                    sub: "1. Actualizaciones Normativas SRI 2026 y Soporte Técnico",
                    txt: "Incluye actualizaciones normativas SRI/IESS (POS F2/F4/F8/F12, FIFO farmacias, Auditor Fantasma, Termómetro RIMPE, Clasificador AGP, NIIF, RDEP, Centralis Engine) durante los 365 días de vigencia, más soporte oficial por WhatsApp (+593 99 645 9771) y correo (soporte@quoratec.com).",
                },
                {
                    sub: "2. Renovación, Modo Solo Lectura y Traslado sin Borrado de Datos",
                    txt: "Si tu licencia o prueba de 15 días expira, conservas acceso en Modo Solo Lectura sin pérdida de datos hasta cargar una nueva llave .lic. Ofrecemos soporte para traslado por cambio o daño de PC mediante respaldo cifrado .tfbackup.",
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
        PERSONAL: "EMPRENDEDOR",
        PERSONAL_PRO: "EMPRENDEDOR",
        CONTADOR_MASTER: "CONTADOR",
        CONTADOR15: "CONTADOR",
        ESTUDIO: "ESTUDIO_CONTABLE",
        ESTUDIO_PRO: "ESTUDIO_CONTABLE",
        EMPRESARIAL: "ESTUDIO_CONTABLE",
        ENTERPRISE_TEAM: "ENTERPRISE",
        ENTERPRISE_CORP: "ENTERPRISE",
        ENTERPRISE_SERVER: "ENTERPRISE",
    });

    const SO_LOOKUP = crearMapaVacio();
    Object.keys(INSTALADORES_SO).forEach((k) => {
        if (esClaveSegura(k)) SO_LOOKUP[k] = INSTALADORES_SO[k];
    });

    let runtimeVersion = CONFIG_COMERCIAL.VERSION;
    let runtimeCorpExtraSeats = 0;
    let estadoModalPago = {
        planId: "CONTADOR",
        extraSeats: 0,
        extraRucsPacks: 0,
        extraCloudPacks: 0,
        emprendedorCloud: false,
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
        return parsed.hostname.toLowerCase() === "erp.quoratec.com";
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
        return "CONTADOR";
    }

    function calcularResumenCheckout() {
        const plan =
            (esClaveSegura(estadoModalPago.planId) && PLAN_LOOKUP[estadoModalPago.planId]) ||
            PLAN_LOOKUP.CONTADOR;
        const extras = Math.max(0, Math.min(50, Number(estadoModalPago.extraSeats || 0)));
        const extraRucs = Math.max(0, Math.min(50, Number(estadoModalPago.extraRucsPacks || 0)));
        const extraCloud = Math.max(0, Math.min(50, Number(estadoModalPago.extraCloudPacks || 0)));
        const optNube = plan.id === "EMPRENDEDOR" && Boolean(estadoModalPago.emprendedorCloud);
        const totalUsd =
            plan.precioUsd +
            extras * CONFIG_COMERCIAL.PRECIO_SEAT_EXTRA_USD +
            extraRucs * CONFIG_COMERCIAL.PRECIO_RUCS_PACK_USD +
            extraCloud * CONFIG_COMERCIAL.PRECIO_CLOUD_PACK_USD +
            (optNube ? CONFIG_COMERCIAL.PRECIO_EMPRENDEDOR_NUBE_USD : 0);
        const estacionesTotales = plan.estacionesBase + extras;
        const rucsTotales = plan.rucsMax + extraRucs * 5;
        const cloudGbTotales = plan.nubeGbBase + (optNube ? 10 : 0) + extraCloud * 50;
        const hwidCorto = extraerCodigoCorto(estadoModalPago.hwidORef);
        const referencia = `QT-${plan.id}-${hwidCorto}`;

        return {
            plan,
            extras,
            extraRucs,
            extraCloud,
            optNube,
            rucsTotales,
            cloudGbTotales,
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
        const mensaje = `Descargar QuoraTec ERP v${runtimeVersion} (Edición 2026) en mi computadora (Windows, macOS o Linux): ${CONFIG_COMERCIAL.URL_DESCARGAS_PORTAL}`;
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
        const { plan, extras, extraRucs, extraCloud, optNube, rucsTotales, cloudGbTotales, montoTexto, estacionesTotales, referencia, hwidORef } = resumen;
        const hwidTexto =
            hwidORef && hwidORef !== "SIN_ESPECIFICAR" ? hwidORef : "[Pegar código QT-XXXXXX-...]";
        const detalleEstaciones =
            extras > 0
                ? `${estacionesTotales} PCs (${plan.estacionesBase} base + ${extras} extra)`
                : estacionesTotales === 1
                  ? "1 PC"
                  : `${estacionesTotales} PCs`;
        const detalleAddons = [
            optNube ? "Nube Emprendedor 10 GB (+$29)" : "",
            extraRucs > 0 ? `+${extraRucs * 5} RUCs Extra` : "",
            extraCloud > 0 ? `+${extraCloud * 50} GB Nube Extra` : "",
        ].filter(Boolean).join(" · ") || "Sin add-ons adicionales";
        const asunto = `[QUORATEC ERP] Activación Licencia Anual ${referencia} (${metodoPago})`;
        const campoComprobante = "• N.º de Comprobante / Autorización bancaria Deuna! (OBLIGATORIO): [Escribir número de transacción]";
        const lineaHwidsAdicionales =
            Number(estacionesTotales) >= 2
                ? "\n• Código HWID PC(s) Adicional(es): [Pegar códigos HWID adicionales]"
                : "";
        const cuerpo =
            `[QUORATEC ERP v${runtimeVersion}] Hola equipo de QuoraTec, envío mi comprobante de pago real para activar mi licencia anual:\n\n` +
            `• Plan seleccionado: ${plan.nombreComercial}\n` +
            `• Capacidad: ${rucsTotales} RUC(s) • ${detalleEstaciones} • ${cloudGbTotales} GB Nube (${detalleAddons})\n` +
            `• Monto USD anual: ${montoTexto} USD / año\n` +
            `• Método de pago: ${metodoPago}\n` +
            `• Referencia de orden: ${referencia}\n` +
            `${campoComprobante}\n` +
            `• Código HWID de tu PC (QuoraTec ERP -> Configuración -> 4. Plan y Licencia): ${hwidTexto}` +
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
            `Hola equipo de QuoraTec (QuoraTec ERP), tengo una consulta técnica o comercial (sin envío de comprobante):` +
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
        const btn = crearEl("a", "whatsapp-float", "💬 Soporte QuoraTec");
        btn.id = "btnFlotanteSoporte";
        const { cuerpo } = construirPlantillaSoporte(`QuoraTec ERP v${runtimeVersion}`, "");
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
            "Incluye 15 días gratis con todas las funcionalidades 100 % desbloqueadas (sin tarjeta). Al expirar, transiciona de forma segura a Modo Solo Lectura sin borrar datos ni respaldos .tfbackup locales."
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

    async function descargarArchivoLicencia(payload, bearerToken) {
        if (typeof window.fetch !== "function") {
            mostrarToastCopia("⚠️ Descarga no disponible en este navegador.");
            return;
        }
        const headers = { "Content-Type": "application/json" };
        if (bearerToken) headers.Authorization = `Bearer ${bearerToken}`;
        try {
            const resp = await fetch(`${obtenerPrefijoRuta()}api/licenses/download`, {
                method: "POST",
                headers,
                credentials: "same-origin",
                body: JSON.stringify(payload || {}),
            });
            if (!resp.ok) {
                const errData = await resp.json().catch(() => ({}));
                mostrarToastCopia(`⚠️ No se pudo descargar la licencia: ${errData.error || `HTTP ${resp.status}`}`);
                return;
            }
            const blob = await resp.blob();
            const disp = String(resp.headers.get("Content-Disposition") || "");
            const match = /filename="?([A-Za-z0-9._-]+)"?/i.exec(disp);
            const filename = match ? match[1] : "QuoraTec_ERP_Licencia.lic";
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
            mostrarToastCopia(`✅ Licencia descargada: ${filename}`);
        } catch {
            mostrarToastCopia("⚠️ Error de red al descargar el archivo .lic.");
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
        const badge = crearEl("span", "modal-badge", `ACTIVACIÓN OFICIAL QUORATEC — QUORATEC ERP v${runtimeVersion}`);
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
        const lblResumenPlan = crearEl("strong", "", "QuoraTec ERP Contador • Hasta 15 RUCs • 1 PC • 20 GB Nube");
        lblResumenPlan.id = "pagoResumenMeta";
        const lblDescVig = crearEl("small", "", "Suscripción anual (365 días) · Todas las funcionalidades 100 % desbloqueadas");
        lblDescVig.style.display = "block";
        lblDescVig.style.color = "#cbd5e1";
        sumLeft.appendChild(lblResumenPlan);
        sumLeft.appendChild(lblDescVig);

        const amountEl = crearEl("div", "checkout-amount", "$239.00");
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
            if (estadoModalPago.planId !== "EMPRENDEDOR") {
                estadoModalPago.emprendedorCloud = false;
            }
            actualizarVistaModalPago();
        });
        gPlan.appendChild(lPlan);
        gPlan.appendChild(selPlan);

        const gHwid = crearEl("div", "field-group");
        const lHwid = crearEl("label", "", "HWID del Equipo * (Obligatorio):");
        lHwid.id = "pagoHwidLabel";
        lHwid.htmlFor = "pagoHwidInput";
        const inHwid = crearEl("input", "mono-input");
        inHwid.type = "text";
        inHwid.id = "pagoHwidInput";
        inHwid.placeholder = "Ej: A1B2-C3D4-E5F6";
        inHwid.maxLength = 32;
        inHwid.addEventListener("input", (e) => {
            const target = e.target;
            if (!(target instanceof HTMLInputElement)) return;
            const limpio = sanitizarIdentificador(target.value);
            target.value = limpio;
            estadoModalPago.hwidORef = limpio;
            actualizarVistaModalPago();
        });
        const hwidHelp = crearEl(
            "small",
            "muted-note",
            "Obligatorio para planes de 1 PC. Cópialo desde: QuoraTec ERP -> Configuración -> 4. Plan y Licencia."
        );
        hwidHelp.id = "pagoHwidHelp";
        gHwid.appendChild(lHwid);
        gHwid.appendChild(inHwid);
        gHwid.appendChild(hwidHelp);

        controlsGrid.appendChild(gPlan);
        controlsGrid.appendChild(gHwid);

        const extraBar = crearEl("div", "extra-seats-bar");
        extraBar.id = "pagoExtraSeatsBar";
        const extraLabel = crearEl(
            "span",
            "",
            "+1 PC Extra ($49/año c/u · compatible con +5 RUCs $59 y +50 GB $59 en Planes):"
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
        const lblEstTotales = crearEl("strong", "", "1 PC total");
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
        const refCodeEl = crearEl("span", "ref-code", "QT-CONTADOR-WEB01");
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
            const planesHwidObligatorio = ["EMPRENDEDOR", "COMERCIAL_PRO", "CONTADOR"];
            if (planesHwidObligatorio.includes(res.plan.id) && (!res.hwidORef || res.hwidORef === "SIN_ESPECIFICAR")) {
                mostrarToastCopia("⚠️ Ingresa el HWID del Equipo (QuoraTec ERP -> Configuración -> 4. Plan y Licencia).");
                const inHwidEl = document.getElementById("pagoHwidInput");
                if (inHwidEl instanceof HTMLInputElement) inHwidEl.focus();
                return;
            }
            btnCrearOrden.disabled = true;
            const resp = await postJsonSeguroApi(
                "api/orders/create",
                {
                    checkout_mode: estadoHibrido.mode === "account" && estadoHibrido.accessToken ? "account" : "guest",
                    plan_id: res.plan.id,
                    extra_seats: res.extras,
                    extra_rucs_packs: res.extraRucs,
                    extra_cloud_packs: res.extraCloud,
                    cloud_opcional_emprendedor: res.optNube,
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
            const orderToken = resp.data?.order_token || `QTTK-${extraerCodigoCorto(rucVal)}${Date.now().toString(36).toUpperCase()}`;
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
        qrImg.alt = "Código QR Oficial Deuna QuoraTec — QuoraTec ERP";
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
            ["Monto USD:", "$239.00", "pagoBankMonto", "Monto USD"],
            ["Referencia:", "QT-CONTADOR-WEB01", "pagoBankRef", "Referencia"],
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
                "Estamos renovando nuestros enlaces de pago con tarjeta en PayPhone para QuoraTec ERP Edición 2026."
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
        const btnSoportePayphoneCorreo = crearEl("a", "btn-support-link", "✉️ soporte@quoratec.com");
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
        const btnSoporteEnterpriseCorreo = crearEl("a", "btn-support-link", "✉️ soporte@quoratec.com");
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
            "✓ 15 días gratis con todas las funcionalidades 100 % desbloqueadas (sin tarjeta).",
            "✓ Fundadores QuoraTec: 25 % DTO vitalicio para los primeros 30 clientes.",
            "✓ Modo Solo Lectura al expirar: tus datos y respaldos .tfbackup nunca se eliminan.",
            "✓ Emisión .lic tras validar pago Deuna! / Transferencia (no reembolsable tras emitirse la llave).",
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
        const { plan, extras, extraRucs, extraCloud, optNube, rucsTotales, cloudGbTotales, montoTexto, estacionesTotales, referencia } = res;

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
            const addonsTxt = [
                optNube ? "+Nube 10 GB" : "",
                extraRucs > 0 ? `+${extraRucs * 5} RUCs` : "",
                extraCloud > 0 ? `+${extraCloud * 50} GB` : "",
            ].filter(Boolean).join(" ");
            elMeta.textContent = `${plan.nombreComercial} • ${rucsTotales} RUC(s) • ${estacionesTotales} PC(s) • ${cloudGbTotales} GB${addonsTxt ? ` (${addonsTxt})` : ""}`;
        }
        if (elMonto) elMonto.textContent = `${montoTexto} USD`;

        const sel = document.getElementById("pagoPlanSelect");
        if (sel instanceof HTMLSelectElement) sel.value = plan.id;

        const hwidRequiere = ["EMPRENDEDOR", "COMERCIAL_PRO", "CONTADOR"].includes(plan.id);
        const hwidLblEl = document.getElementById("pagoHwidLabel");
        const hwidInEl = document.getElementById("pagoHwidInput");
        const hwidHelpEl = document.getElementById("pagoHwidHelp");
        if (hwidLblEl) {
            hwidLblEl.textContent = hwidRequiere ? "HWID del Equipo * (Obligatorio):" : "HWID del Equipo (Opcional):";
        }
        if (hwidInEl instanceof HTMLInputElement) {
            hwidInEl.required = hwidRequiere;
            hwidInEl.placeholder = hwidRequiere ? "Ej: A1B2-C3D4-E5F6" : "Opcional — Ej: A1B2-C3D4-E5F6";
        }
        if (hwidHelpEl) {
            hwidHelpEl.textContent = hwidRequiere
                ? "Obligatorio para planes de 1 PC. Cópialo desde: QuoraTec ERP -> Configuración -> 4. Plan y Licencia."
                : "Opcional: podrás vincular tus equipos con la misma licencia .lic.";
        }

        const extraBar = document.getElementById("pagoExtraSeatsBar");
        const extraIn = document.getElementById("pagoExtraSeatsInput");
        const estTot = document.getElementById("pagoEstacionesTotales");
        if (extraBar instanceof HTMLElement) extraBar.style.display = "flex";
        if (extraIn instanceof HTMLInputElement) extraIn.value = String(extras);
        if (estTot instanceof HTMLElement) estTot.textContent = `${estacionesTotales} PC(s) totales`;

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

    function abrirModalPago(planIdRaw, extraSeatsOverride, addonOpts) {
        asegurarModalPago();
        estadoModalPago.planId = resolverPlan(planIdRaw);
        const opts = addonOpts && typeof addonOpts === "object" ? addonOpts : {};
        estadoModalPago.extraSeats = typeof extraSeatsOverride === "number" ? Math.max(0, Math.min(50, extraSeatsOverride)) : 0;
        estadoModalPago.extraRucsPacks = Number.isFinite(Number(opts.extraRucsPacks)) ? Math.max(0, Math.min(50, Number(opts.extraRucsPacks))) : 0;
        estadoModalPago.extraCloudPacks = Number.isFinite(Number(opts.extraCloudPacks)) ? Math.max(0, Math.min(50, Number(opts.extraCloudPacks))) : 0;
        estadoModalPago.emprendedorCloud = estadoModalPago.planId === "EMPRENDEDOR" && Boolean(opts.emprendedorCloud);
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
        const h3 = crearEl("h3", "", "Marco Legal — QuoraTec ERP (QuoraTec)");
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
                btnPrincipalDl.textContent = `⬇ Probar Gratis ${CONFIG_COMERCIAL.TRIAL_DIAS} Días (100 % Desbloqueado · Solo PC)`;
            } else {
                btnPrincipalDl.textContent = `⬇ Probar Gratis ${CONFIG_COMERCIAL.TRIAL_DIAS} Días (${soInfo.etiqueta} · 100 % Desbloqueado)`;
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
        const docs = Math.max(20, Math.min(2000, Math.round(Number(docsRaw || 350))));
        const pcs = Math.max(1, Math.min(20, Math.round(Number(pcsRaw || 1))));

        const horasManuales = rucs * cfg.HORAS_MANUAL_POR_RUC + docs * cfg.HORAS_MANUAL_POR_COMPROBANTE;
        const horasAhorradasMes = Math.max(1, Math.round(horasManuales * cfg.FACTOR_AUTOMATIZACION));
        const horasAhorradasAnio = horasAhorradasMes * 12;

        let planId = "EMPRENDEDOR";
        let detalle = "1 RUC/Cédula | 1 PC | Modo Local (Nube opc. +$29/año - 10 GB) con todas las herramientas incluidas.";
        if (rucs > 40 || pcs > 3) {
            planId = "ENTERPRISE";
            detalle = "Hasta 100 RUCs | 10 PCs | Nube Total Dedicada (150 GB) + add-ons (+1 PC $49, +5 RUCs $59, +50 GB $59).";
        } else if (rucs > 15 || pcs >= 2) {
            planId = "ESTUDIO_CONTABLE";
            detalle = "Hasta 40 RUCs | 3 PCs | Nube Total + Híbrido + Oficina (50 GB) con todas las herramientas desbloqueadas.";
        } else if (rucs > 1) {
            planId = "CONTADOR";
            detalle = "Hasta 15 RUCs | 1 PC | Local + Nube Híbrida (20 GB) con Descarga Masiva SRI, AGP, NIIF, IA Local y Centralis.";
        } else if (docs >= 120) {
            planId = "COMERCIAL_PRO";
            detalle = "1 RUC | 1 PC | Local + Nube Híbrida (10 GB) ideal para comercios POS y Farmacias FIFO.";
        }

        const planMeta = PLAN_LOOKUP[planId];
        const extraSeats = Math.max(0, pcs - planMeta.estacionesBase);
        const extraRucsPacks = rucs > planMeta.rucsMax ? Math.ceil((rucs - planMeta.rucsMax) / 5) : 0;
        const precioEstimadoUsd =
            planMeta.precioUsd +
            extraSeats * CONFIG_COMERCIAL.PRECIO_SEAT_EXTRA_USD +
            extraRucsPacks * CONFIG_COMERCIAL.PRECIO_RUCS_PACK_USD;

        return {
            rucs,
            docs,
            pcs,
            extraSeats,
            extraRucsPacks,
            precioEstimadoUsd,
            horasAhorradasMes,
            horasAhorradasAnio,
            planId,
            detalle,
        };
    }

    function aplicarManifiestoVersionJson(data) {
        if (!data || typeof data !== "object" || Array.isArray(data)) return;
        if (typeof data.version === "string" && SEMVER_REGEX.test(data.version.trim())) {
            aplicarVersionEnDOM(data.version.trim());
        }
        const notesEl = document.querySelector("[data-release-notes]");
        if (notesEl && typeof data.body === "string" && data.body.trim()) {
            notesEl.textContent = data.body.trim().slice(0, 260);
        }
        const repoEl = document.querySelector("[data-release-repo]");
        if (repoEl && typeof data.html_url === "string") {
            const matchRepo = /^https:\/\/github\.com\/([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)\//i.exec(data.html_url.trim());
            if (matchRepo) repoEl.textContent = matchRepo[1];
        }
        if (!Array.isArray(data.assets)) return;

        function clasificarAssetPorNombre(name) {
            const lower = String(name || "").toLowerCase();
            if (lower.endsWith(".exe")) return "windows";
            if (lower.endsWith(".zip")) return "windows_zip";
            if (lower.endsWith(".dmg")) return "macos";
            if (lower.endsWith(".deb")) return "linux";
            if (lower.endsWith(".tar.gz")) return "linux_tar";
            if (lower === "sha256sums.txt") return "sha256sums";
            return null;
        }

        data.assets.forEach((asset) => {
            if (!asset || typeof asset !== "object") return;
            const osKey = clasificarAssetPorNombre(asset.name);
            if (!osKey || !esClaveSegura(osKey)) return;
            const url = String(asset.browser_download_url || "").trim();
            if (!esUrlDescargaOficialSegura(url)) return;

            const digestRaw = String(asset.digest || "").trim();
            const shaHex = digestRaw.toLowerCase().startsWith("sha256:") ? digestRaw.slice(7).toLowerCase() : "";
            const mbSize = Number.isFinite(Number(asset.size)) && Number(asset.size) > 0
                ? Number(asset.size) < 1024 * 1024
                    ? `${Math.round(Number(asset.size))} B`
                    : `${(Number(asset.size) / (1024 * 1024)).toFixed(1)} MB`
                : "";

            document.querySelectorAll(`[data-asset-name="${osKey}"]`).forEach((el) => {
                el.textContent = String(asset.name || "");
            });
            if (mbSize) {
                document.querySelectorAll(`[data-asset-size="${osKey}"]`).forEach((el) => {
                    el.textContent = el.classList.contains("os-size") && osKey === "windows" ? `${mbSize} · .exe` : mbSize;
                });
            }
            if (/^[a-f0-9]{64}$/.test(shaHex)) {
                document.querySelectorAll(`[data-sha256-value="${osKey}"]`).forEach((el) => {
                    el.textContent = shaHex;
                });
            }
            document.querySelectorAll(`a[data-download-os="${osKey}"]`).forEach((el) => {
                if (el instanceof HTMLAnchorElement) {
                    el.setAttribute("href", url);
                    el.setAttribute("download", String(asset.name || ""));
                }
            });
        });
    }

    function sincronizarConfiguracionPortal() {
        if (window.location.protocol !== "http:" && window.location.protocol !== "https:") return;
        if (typeof window.fetch !== "function") return;
        const prefix = obtenerPrefijoRuta();
        fetch(`${prefix}${CONFIG_COMERCIAL.API_CONFIG_PATH}`, { cache: "no-store", credentials: "same-origin" })
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

        fetch(`${prefix}${CONFIG_COMERCIAL.VERSION_JSON_PATH}`, { cache: "no-store", credentials: "same-origin" })
            .then((resp) => (resp.ok ? resp.json() : null))
            .then((verData) => {
                aplicarManifiestoVersionJson(verData);
            })
            .catch(() => {
                // Mantiene descargas estáticas verificadas si está offline
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
                const extrasDesc = [
                    sim.extraSeats > 0 ? `+${sim.extraSeats} PC` : "",
                    sim.extraRucsPacks > 0 ? `+${sim.extraRucsPacks * 5} RUCs` : "",
                ].filter(Boolean).join(" ");
                const sufijoExtra = extrasDesc
                    ? ` (${extrasDesc} = ${formatearUsd(sim.precioEstimadoUsd)} USD/año)`
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
        const selPlan = document.getElementById("calcPlanSelect");
        const rowEmpNube = document.getElementById("calcEmprendedorNubeRow");
        const chkEmpNube = document.getElementById("calcEmprendedorNubeCheck");
        const inPc = document.getElementById("addonPcInput");
        const inRuc = document.getElementById("addonRucInput");
        const inCloud = document.getElementById("addonCloudInput");
        const btnPcMenos = document.getElementById("addonPcMenos");
        const btnPcMas = document.getElementById("addonPcMas");
        const btnRucMenos = document.getElementById("addonRucMenos");
        const btnRucMas = document.getElementById("addonRucMas");
        const btnCloudMenos = document.getElementById("addonCloudMenos");
        const btnCloudMas = document.getElementById("addonCloudMas");
        const outPcs = document.getElementById("calcTotalPcs");
        const outRucs = document.getElementById("calcTotalRucs");
        const outGb = document.getElementById("calcTotalGb");
        const outNormal = document.getElementById("calcTotalNormal");
        const outFund = document.getElementById("calcTotalFundadores");
        const btnCheckout = document.getElementById("btnCalcAddonsCheckout");
        const btnWp = document.getElementById("btnCalcAddonsWhatsapp");
        if (!(selPlan instanceof HTMLSelectElement)) return;

        function clampInt(val) {
            const n = parseInt(String(val || "0"), 10);
            return Number.isNaN(n) ? 0 : Math.max(0, Math.min(50, n));
        }

        function actualizarAddons() {
            const planId = resolverPlan(selPlan.value);
            const planMeta = PLAN_LOOKUP[planId] || PLAN_LOOKUP.CONTADOR;
            const isEmp = planId === "EMPRENDEDOR";

            if (rowEmpNube instanceof HTMLElement) {
                rowEmpNube.style.display = isEmp ? "flex" : "none";
            }
            const optNube = isEmp && chkEmpNube instanceof HTMLInputElement && chkEmpNube.checked;

            const extraPcs = inPc instanceof HTMLInputElement ? clampInt(inPc.value) : 0;
            const extraRucPacks = inRuc instanceof HTMLInputElement ? clampInt(inRuc.value) : 0;
            const extraCloudPacks = inCloud instanceof HTMLInputElement ? clampInt(inCloud.value) : 0;

            if (inPc instanceof HTMLInputElement) inPc.value = String(extraPcs);
            if (inRuc instanceof HTMLInputElement) inRuc.value = String(extraRucPacks);
            if (inCloud instanceof HTMLInputElement) inCloud.value = String(extraCloudPacks);

            runtimeCorpExtraSeats = extraPcs;

            const totalPcs = planMeta.estacionesBase + extraPcs;
            const totalRucs = planMeta.rucsMax + extraRucPacks * 5;
            const totalGb = planMeta.nubeGbBase + (optNube ? 10 : 0) + extraCloudPacks * 50;
            const totalUsd =
                planMeta.precioUsd +
                (optNube ? CONFIG_COMERCIAL.PRECIO_EMPRENDEDOR_NUBE_USD : 0) +
                extraPcs * CONFIG_COMERCIAL.PRECIO_SEAT_EXTRA_USD +
                extraRucPacks * CONFIG_COMERCIAL.PRECIO_RUCS_PACK_USD +
                extraCloudPacks * CONFIG_COMERCIAL.PRECIO_CLOUD_PACK_USD;
            const totalFundUsd = totalUsd * (1 - CONFIG_COMERCIAL.DESCUENTO_FUNDADORES_PCT / 100);

            if (outPcs) outPcs.textContent = `${totalPcs} PC${totalPcs === 1 ? "" : "s"}`;
            if (outRucs) outRucs.textContent = `${totalRucs} RUC${totalRucs === 1 ? "" : "s"}`;
            if (outGb) outGb.textContent = `${totalGb} GB Nube`;
            if (outNormal) outNormal.textContent = `${formatearUsd(totalUsd)}/año`;
            if (outFund) outFund.textContent = `${formatearUsd(totalFundUsd)}/año`;

            if (btnWp instanceof HTMLAnchorElement) {
                const texto =
                    `[QUORATEC ERP v${runtimeVersion}] Solicito ${planMeta.nombre} (${totalPcs} PCs, ${totalRucs} RUCs, ${totalGb} GB Nube). Tarifa normal ${formatearUsd(totalUsd)}/año · Fundadores (-25 % DTO): ${formatearUsd(totalFundUsd)}/año.`;
                asignarEnlaceSeguro(btnWp, construirUrlWhatsapp(texto), "whatsapp");
            }
            return { planId, extraPcs, extraRucPacks, extraCloudPacks, optNube };
        }

        function bindStepper(btnMinus, btnPlus, inp) {
            if (!(inp instanceof HTMLInputElement)) return;
            if (btnMinus) {
                btnMinus.addEventListener("click", () => {
                    inp.value = String(Math.max(0, clampInt(inp.value) - 1));
                    actualizarAddons();
                });
            }
            if (btnPlus) {
                btnPlus.addEventListener("click", () => {
                    inp.value = String(Math.min(50, clampInt(inp.value) + 1));
                    actualizarAddons();
                });
            }
            inp.addEventListener("input", actualizarAddons);
        }

        selPlan.addEventListener("change", actualizarAddons);
        if (chkEmpNube instanceof HTMLInputElement) {
            chkEmpNube.addEventListener("change", actualizarAddons);
        }
        bindStepper(btnPcMenos, btnPcMas, inPc);
        bindStepper(btnRucMenos, btnRucMas, inRuc);
        bindStepper(btnCloudMenos, btnCloudMas, inCloud);

        if (btnCheckout) {
            btnCheckout.addEventListener("click", (e) => {
                e.preventDefault();
                const st = actualizarAddons();
                abrirModalPago(st.planId, st.extraPcs, {
                    extraRucsPacks: st.extraRucPacks,
                    extraCloudPacks: st.extraCloudPacks,
                    emprendedorCloud: st.optNube,
                });
            });
        }

        actualizarAddons();
    }

    function inicializarPestanasGuiaUso() {
        const tabs = Array.from(document.querySelectorAll("[data-guide-tab]"));
        const panels = Array.from(document.querySelectorAll("[data-guide-panel]"));
        if (!tabs.length || !panels.length) return;

        const TABS_PERMITIDAS = new Set(["rapida", "emprendedor", "comercial", "estudio", "enterprise"]);

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
                    "Por tu seguridad, QuoraTec ERP solo se ejecuta en su pestaña directa oficial."
                )
            );
            const openBtn = crearEl("a", "btn-glow", "Abrir portal oficial de QuoraTec ERP");
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
                        src === `../assets/js/portal.js?v=${CONFIG_COMERCIAL.VERSION}` ||
                        new RegExp(`^(\\.\\.\\/)?assets\\/js\\/portal\\.js\\?v=${CONFIG_COMERCIAL.VERSION.replace(/\./g, "\\.")}&h=[a-f0-9]{8}$`).test(src)) &&
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
                const orderRefVal = iRef.value.trim();
                const orderTokVal = iTok.value.trim();
                const emailVal = sanitizarCorreoInput(iEmail.value);
                const resp = await postJsonSeguroApi("api/orders/status", {
                    order_ref: orderRefVal,
                    order_token: orderTokVal,
                    email: emailVal,
                });
                guestOut.textContent = "";
                if (resp.ok) {
                    guestOut.appendChild(
                        crearEl(
                            "div",
                            "",
                            `Orden ${resp.data.order_ref} • Estado: ${resp.data.status} • Monto: ${formatearUsd(resp.data.monto_autorizado_usd)} • Estaciones: ${resp.data.estaciones_autorizadas} PC(s)`
                        )
                    );
                    if (resp.data.status === "verificado") {
                        const btnDl = crearEl("button", "btn-glow mt-8", "⬇️ Descargar Licencia (.lic)");
                        btnDl.type = "button";
                        btnDl.addEventListener("click", () => {
                            descargarArchivoLicencia({
                                order_ref: resp.data.order_ref || orderRefVal,
                                order_token: orderTokVal,
                                email: emailVal,
                            });
                        });
                        guestOut.appendChild(btnDl);
                    }
                } else {
                    guestOut.textContent = `ℹ️ ${resp.data?.message || "No se encontró una orden activa con esa referencia, token y correo."}`;
                }
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
                        accOut.textContent = "";
                        accOut.appendChild(
                            crearEl(
                                "div",
                                "",
                                `Sesión ${estadoHibrido.userEmail}: ${dash.data.orders.length} orden(es), ${dash.data.licenses.length} licencia(s) activas.`
                            )
                        );
                        (dash.data.orders || []).forEach((ord) => {
                            if (ord && ord.status === "verificado" && ord.order_ref) {
                                const rowOrd = crearEl("div", "flex-wrap-actions mt-8");
                                rowOrd.appendChild(crearEl("span", "", `${ord.order_ref} (${ord.plan_id || ""})`));
                                const btnDlAcc = crearEl("button", "btn-glow", "⬇️ Descargar Licencia (.lic)");
                                btnDlAcc.type = "button";
                                btnDlAcc.addEventListener("click", () => {
                                    descargarArchivoLicencia({ order_ref: ord.order_ref }, estadoHibrido.accessToken);
                                });
                                rowOrd.appendChild(btnDlAcc);
                                accOut.appendChild(rowOrd);
                            }
                        });
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

    function inicializarExploradorSuitesRibbon() {
        const suiteTabs = Array.from(document.querySelectorAll("[data-suite-tab]"));
        const suitePanels = Array.from(document.querySelectorAll("[data-suite-panel]"));
        if (suiteTabs.length && suitePanels.length) {
            const PERMITIDAS = new Set([
                "inicio-sri",
                "comercial-pos",
                "inventario-cartera",
                "contabilidad-niif",
                "impuestos-auditoria",
                "sistema-lan",
            ]);

            function activarSuite(suiteId) {
                const limpia = PERMITIDAS.has(suiteId) ? suiteId : "inicio-sri";
                suiteTabs.forEach((btn) => {
                    const activo = btn.getAttribute("data-suite-tab") === limpia;
                    btn.classList.toggle("is-active", activo);
                    btn.setAttribute("aria-selected", activo ? "true" : "false");
                });
                suitePanels.forEach((panel) => {
                    panel.classList.toggle("is-active", panel.getAttribute("data-suite-panel") === limpia);
                });
            }

            suiteTabs.forEach((btn) => {
                btn.addEventListener("click", () => {
                    activarSuite(btn.getAttribute("data-suite-tab") || "inicio-sri");
                });
            });

            const syncFromHash = () => {
                const h = String(window.location.hash || "").replace(/^#suite-/, "").toLowerCase();
                if (PERMITIDAS.has(h)) activarSuite(h);
            };
            window.addEventListener("hashchange", syncFromHash);
            syncFromHash();
        }

        const heroBtns = Array.from(document.querySelectorAll("[data-hero-view-btn]"));
        const heroScreens = Array.from(document.querySelectorAll("[data-hero-view-panel]"));
        if (heroBtns.length && heroScreens.length) {
            heroBtns.forEach((btn) => {
                btn.addEventListener("click", () => {
                    const target = btn.getAttribute("data-hero-view-btn");
                    heroBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
                    heroScreens.forEach((s) => s.classList.toggle("is-active", s.getAttribute("data-hero-view-panel") === target));
                });
            });
        }
    }

    function inicializarManualOperativoTabs() {
        const tabs = Array.from(document.querySelectorAll("[data-manual-tab]"));
        const panels = Array.from(document.querySelectorAll("[data-manual-panel]"));
        if (!tabs.length || !panels.length) return;

        const PERMITIDAS = new Set([
            "sri-operacion",
            "comercial-pos",
            "inventario-cartera",
            "contabilidad-niif",
            "auditoria-ats",
            "sistema-lan",
        ]);

        function activar(tabId) {
            const limpia = PERMITIDAS.has(tabId) ? tabId : "sri-operacion";
            tabs.forEach((btn) => {
                const activo = btn.getAttribute("data-manual-tab") === limpia;
                btn.classList.toggle("is-active", activo);
                btn.setAttribute("aria-selected", activo ? "true" : "false");
            });
            panels.forEach((panel) => {
                const activo = panel.getAttribute("data-manual-panel") === limpia;
                panel.classList.toggle("is-active", activo);
            });
        }

        tabs.forEach((btn, idx) => {
            btn.addEventListener("click", () => {
                activar(btn.getAttribute("data-manual-tab") || "sri-operacion");
            });
            btn.addEventListener("keydown", (ev) => {
                if (ev.key !== "ArrowRight" && ev.key !== "ArrowLeft" && ev.key !== "Home" && ev.key !== "End") return;
                ev.preventDefault();
                let nextIdx = idx;
                if (ev.key === "ArrowRight") nextIdx = (idx + 1) % tabs.length;
                if (ev.key === "ArrowLeft") nextIdx = (idx - 1 + tabs.length) % tabs.length;
                if (ev.key === "Home") nextIdx = 0;
                if (ev.key === "End") nextIdx = tabs.length - 1;
                const nextBtn = tabs[nextIdx];
                if (nextBtn instanceof HTMLElement) {
                    activar(nextBtn.getAttribute("data-manual-tab") || "sri-operacion");
                    nextBtn.focus();
                }
            });
        });

        activar("sri-operacion");
    }

    function inicializarBuscadorFuncionesGuia() {
        const input = document.getElementById("guiaBuscadorInput");
        const clearBtn = document.getElementById("guiaBuscadorLimpiar");
        const countEl = document.getElementById("guiaBuscadorCount");
        const cards = Array.from(document.querySelectorAll("[data-guide-func-card]"));
        const chipBtns = Array.from(document.querySelectorAll("[data-guide-chip]"));
        if (!(input instanceof HTMLInputElement) || !cards.length) return;

        function normalizarTexto(s) {
            return String(s || "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .trim();
        }

        function filtrar() {
            const q = normalizarTexto(input.value);
            let visibles = 0;
            cards.forEach((card) => {
                if (!(card instanceof HTMLElement)) return;
                const haystack = normalizarTexto(`${card.getAttribute("data-keywords") || ""} ${card.textContent || ""}`);
                const match = !q || haystack.includes(q);
                card.style.display = match ? "flex" : "none";
                if (match) visibles += 1;
            });
            if (countEl) {
                countEl.textContent = visibles === 0
                    ? "0 coincidencias. Prueba: tfbackup, firma .p12, fifo, rimpe, agp, fantasma, centralis, copiloto, ats, rdep o cxc."
                    : `Mostrando ${visibles} de ${cards.length} rutas oficiales de QuoraTec ERP v${runtimeVersion}`;
            }
        }

        input.addEventListener("input", filtrar);
        if (clearBtn) {
            clearBtn.addEventListener("click", () => {
                input.value = "";
                filtrar();
                input.focus();
            });
        }
        chipBtns.forEach((chip) => {
            chip.addEventListener("click", () => {
                input.value = chip.getAttribute("data-guide-chip") || "";
                filtrar();
            });
        });
        filtrar();
    }

    function inicializarSoporteOrdenes() {
        const btn = document.getElementById("btnLookupGuestOrder");
        const inRef = document.getElementById("lookupOrderRef");
        const inTok = document.getElementById("lookupOrderToken");
        const inEmail = document.getElementById("lookupOrderEmail");
        const out = document.getElementById("lookupOrderResult");
        if (btn && inRef instanceof HTMLInputElement && inTok instanceof HTMLInputElement && out) {
            btn.addEventListener("click", async () => {
                const orderRefVal = inRef.value.trim();
                const orderTokVal = inTok.value.trim();
                const emailVal = inEmail instanceof HTMLInputElement ? sanitizarCorreoInput(inEmail.value) : "";
                const resp = await postJsonSeguroApi("api/orders/status", {
                    order_ref: orderRefVal,
                    order_token: orderTokVal,
                    email: emailVal,
                });
                out.textContent = "";
                if (resp.ok) {
                    out.appendChild(
                        crearEl(
                            "div",
                            "",
                            `✅ Orden ${resp.data.order_ref} • Estado: ${resp.data.status} • Plan: ${resp.data.plan_id} (${resp.data.estaciones_autorizadas} PC) • Monto: ${formatearUsd(resp.data.monto_autorizado_usd)}`
                        )
                    );
                    if (resp.data.status === "verificado") {
                        const btnDlSup = crearEl("button", "btn-glow mt-8", "⬇️ Descargar Licencia (.lic)");
                        btnDlSup.type = "button";
                        btnDlSup.addEventListener("click", () => {
                            descargarArchivoLicencia({
                                order_ref: resp.data.order_ref || orderRefVal,
                                order_token: orderTokVal,
                                email: emailVal,
                            });
                        });
                        out.appendChild(btnDlSup);
                    }
                } else {
                    out.textContent = `ℹ️ ${resp.data?.message || "No fue posible consultar la orden en este entorno."}`;
                }
            });
        }
    }

    function asegurarModalAdmin() {
        let overlay = document.getElementById("modalAdminPortal");
        if (overlay) {
            overlay.style.display = "flex";
            return;
        }

        // Clave maestra mantenida exclusivamente en memoria de cierre (nunca en localStorage ni hardcodeada)
        let adminSecretMem = "";

        overlay = crearEl("div", "modal-overlay");
        overlay.id = "modalAdminPortal";
        overlay.style.display = "flex";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");

        const box = crearEl("div", "modal-box");
        const top = crearEl("div", "modal-top");
        top.appendChild(crearEl("h3", "", "Administración — Aprobación de Órdenes"));
        const closeBtn = crearEl("button", "modal-close", "✕");
        closeBtn.type = "button";
        closeBtn.addEventListener("click", () => {
            adminSecretMem = "";
            overlay.style.display = "none";
        });
        top.appendChild(closeBtn);
        box.appendChild(top);

        const body = crearEl("div", "modal-body");
        const authRow = crearEl("div", "hybrid-form-grid");
        const inpSecret = crearEl("input", "text-input");
        inpSecret.type = "password";
        inpSecret.id = "adminApproveSecretInput";
        inpSecret.placeholder = "Clave maestra ADMIN_APPROVE_SECRET";
        inpSecret.autocomplete = "off";
        const btnCargar = crearEl("button", "btn-glow", "🔓 Cargar Órdenes Pendientes");
        btnCargar.type = "button";
        authRow.appendChild(inpSecret);
        authRow.appendChild(btnCargar);

        const adminStatus = crearEl("div", "muted-note mt-8", "Ingresa la clave maestra para consultar órdenes en pendiente_verificacion.");
        const listWrap = crearEl("div", "mt-8");

        async function cargarPendientes() {
            adminSecretMem = inpSecret.value;
            if (!adminSecretMem) {
                adminStatus.textContent = "⚠️ Ingresa la clave maestra.";
                return;
            }
            btnCargar.disabled = true;
            adminStatus.textContent = "Consultando órdenes pendientes...";
            listWrap.textContent = "";
            try {
                const resp = await fetch(`${obtenerPrefijoRuta()}api/admin/pending-orders`, {
                    method: "GET",
                    headers: { "X-Admin-Secret": adminSecretMem },
                    credentials: "same-origin",
                });
                const data = await resp.json().catch(() => ({}));
                if (!resp.ok || !data.ok) {
                    adminStatus.textContent = resp.status === 401 || resp.status === 403
                        ? "⛔ Clave maestra inválida o no autorizada."
                        : `⚠️ Error al consultar: ${data.error || `HTTP ${resp.status}`}`;
                    return;
                }
                const orders = Array.isArray(data.orders) ? data.orders : [];
                adminStatus.textContent = `Órdenes pendientes encontradas: ${orders.length}`;
                if (orders.length === 0) {
                    listWrap.appendChild(crearEl("p", "muted-note", "No hay órdenes en estado pendiente_verificacion."));
                    return;
                }
                orders.forEach((ord) => {
                    const card = crearEl("div", "receipt-upload-box");
                    card.appendChild(
                        crearEl(
                            "strong",
                            "",
                            `${ord.razon_social || "Cliente"} (${ord.ruc_cedula || ""}) — ${ord.plan_id}`
                        )
                    );
                    card.appendChild(
                        crearEl(
                            "div",
                            "muted-note",
                            `Ref: ${ord.order_ref} • Monto: ${formatearUsd(ord.monto_autorizado_usd)} • Correo: ${ord.email || ""}`
                        )
                    );
                    const rowBtns = crearEl("div", "flex-wrap-actions mt-8");
                    if (ord.voucher_signed_url && /^https:\/\//i.test(ord.voucher_signed_url)) {
                        const linkVoucher = crearEl("a", "btn-glass", "🖼️ Ver comprobante");
                        linkVoucher.href = ord.voucher_signed_url;
                        linkVoucher.target = "_blank";
                        linkVoucher.rel = "noopener noreferrer";
                        rowBtns.appendChild(linkVoucher);
                    }
                    const btnAprobar = crearEl("button", "btn-glow", "✅ Aprobar y Enviar .lic");
                    btnAprobar.type = "button";
                    const rowMsg = crearEl("small", "muted-note", "");
                    btnAprobar.addEventListener("click", async () => {
                        btnAprobar.disabled = true;
                        rowMsg.textContent = "Emitiendo y enviando .lic...";
                        try {
                            const appResp = await fetch(`${obtenerPrefijoRuta()}api/orders/approve`, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "X-Admin-Secret": adminSecretMem,
                                },
                                credentials: "same-origin",
                                body: JSON.stringify({ order_id: ord.id }),
                            });
                            const appData = await appResp.json().catch(() => ({}));
                            if (appResp.ok && appData.ok) {
                                rowMsg.textContent = `✅ Emitida (${appData.license_key}) • Correo: ${appData.email_sent ? "enviado" : "pendiente"}`;
                            } else {
                                btnAprobar.disabled = false;
                                rowMsg.textContent = `⚠️ Error: ${appData.error || `HTTP ${appResp.status}`}`;
                            }
                        } catch {
                            btnAprobar.disabled = false;
                            rowMsg.textContent = "⚠️ Error de red al aprobar.";
                        }
                    });
                    rowBtns.appendChild(btnAprobar);
                    card.appendChild(rowBtns);
                    card.appendChild(rowMsg);
                    listWrap.appendChild(card);
                });
            } catch {
                adminStatus.textContent = "⚠️ Error de red al consultar órdenes pendientes.";
            } finally {
                btnCargar.disabled = false;
            }
        }

        btnCargar.addEventListener("click", cargarPendientes);
        body.appendChild(authRow);
        body.appendChild(adminStatus);
        body.appendChild(listWrap);
        box.appendChild(body);
        overlay.appendChild(box);
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                adminSecretMem = "";
                overlay.style.display = "none";
            }
        });
        document.body.appendChild(overlay);
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
        inicializarManualOperativoTabs();
        inicializarExploradorSuitesRibbon();
        inicializarBuscadorFuncionesGuia();
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

        // Menú desplegable "6 Suites ERP ▾" en todas las páginas
        const SUITES_PORTAL = [
            { icon: "⚡", title: "1. Inicio & Portal SRI", desc: "Panel General, Multi-RUC y Sincronización XML/RIDE", href: "index.html#suite-inicio-sri" },
            { icon: "🧾", title: "2. Comercial & Facturación POS .p12", desc: "Atajos F2/F4/F8/F12, Farmacias FIFO y RIDE", href: "index.html#suite-comercial-pos" },
            { icon: "📦", title: "3. Inventario, Kardex & Cartera", desc: "FIFO/Caducidad, Multi-bodega y CxC/CxP", href: "index.html#suite-inventario-cartera" },
            { icon: "📊", title: "4. Contabilidad NIIF & Nómina IESS", desc: "Libro Diario, Balances NIIF, roles y RDEP", href: "index.html#suite-contabilidad-niif" },
            { icon: "🔍", title: "5. Impuestos, Auditoría & Consultas", desc: "Auditor Fantasma, RIMPE, Clasificador AGP y ATS", href: "index.html#suite-impuestos-auditoria" },
            { icon: "🛡️", title: "6. Sistema, IA, Centralis & .tfbackup", desc: "Copiloto IA Local, WhatsApp/Telegram y Red LAN", href: "index.html#suite-sistema-lan" },
        ];

        const navRoot = obtenerPrefijoRuta();
        const currentHash = String(window.location.hash || "");

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

            const header = crearEl("div", "nav-dropdown-header", `6 Suites Reales — QuoraTec ERP v${runtimeVersion} (Edición 2026 · QuoraTec)`);
            const grid = crearEl("div", "nav-dropdown-grid");

            SUITES_PORTAL.forEach((suite) => {
                const link = document.createElement("a");
                const isCurrent = Boolean(currentHash && suite.href.endsWith(currentHash));
                link.href = `${navRoot}${suite.href}`;
                link.className = isCurrent ? "nav-dropdown-item is-current" : "nav-dropdown-item";
                link.setAttribute("role", "menuitem");
                if (isCurrent) link.setAttribute("aria-current", "page");

                const iconSpan = crearEl("span", "nav-dropdown-icon", suite.icon);
                iconSpan.setAttribute("aria-hidden", "true");
                const textWrap = crearEl("span", "nav-dropdown-text");
                textWrap.appendChild(crearEl("span", "nav-dropdown-title", suite.title));
                textWrap.appendChild(crearEl("span", "nav-dropdown-desc", suite.desc));
                link.appendChild(iconSpan);
                link.appendChild(textWrap);
                link.addEventListener("click", () => cerrarDd());
                grid.appendChild(link);
            });

            const footer = crearEl("div", "nav-dropdown-footer");
            const allLink = document.createElement("a");
            allLink.href = `${navRoot}index.html#modulos`;
            allLink.className = "nav-dropdown-all";
            allLink.textContent = "Explorar Mapa de 14 Módulos ➔";
            allLink.addEventListener("click", () => cerrarDd());
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
                    construirPlantillaSoporte(`QuoraTec ERP v${runtimeVersion}`, "")
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

        // Modal Administrativo ligero (en memoria, sin guardar secretos)
        document.querySelectorAll("[data-open-admin-modal]").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                asegurarModalAdmin();
            });
        });
        if (currentHash === "#admin") {
            asegurarModalAdmin();
        }

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

        function inicializarPanelEquipo() {
            const authGate = document.getElementById("teamAuthGate");
            const workspace = document.getElementById("teamWorkspace");
            if (!(authGate instanceof HTMLElement) || !(workspace instanceof HTMLElement)) return;

            const loginForm = document.getElementById("teamLoginForm");
            const emailInput = document.getElementById("teamEmail");
            const passInput = document.getElementById("teamPassword");
            const mfaGate = document.getElementById("teamMfaGate");
            const mfaEnrollBox = document.getElementById("teamMfaEnrollBox");
            const mfaQrImg = document.getElementById("teamMfaQrImg");
            const mfaSecretText = document.getElementById("teamMfaSecretText");
            const mfaWelcome = document.getElementById("teamMfaWelcome");
            const totpForm = document.getElementById("teamTotpForm");
            const totpInput = document.getElementById("teamTotpCode");
            const resetAuthBtn = document.getElementById("teamResetAuthBtn");
            const authStatus = document.getElementById("teamAuthStatus");

            const roleBadge = document.getElementById("teamRoleBadge");
            const staffNameEl = document.getElementById("teamStaffName");
            const staffCityEl = document.getElementById("teamStaffCityRole");
            const refreshBtn = document.getElementById("teamRefreshBtn");
            const logoutBtn = document.getElementById("teamLogoutBtn");
            const globalToast = document.getElementById("teamGlobalToast");

            const founderSection = document.getElementById("teamFounderSection");
            const agentSection = document.getElementById("teamAgentSection");

            const TOKEN_KEY = "qt_team_aal2_token";
            let aal1State = { token: "", factorId: "", challengeId: "" };

            function getAal2Token() {
                try {
                    return sessionStorage.getItem(TOKEN_KEY) || "";
                } catch {
                    return "";
                }
            }

            function setAal2Token(tok) {
                try {
                    if (tok) sessionStorage.setItem(TOKEN_KEY, tok);
                    else sessionStorage.removeItem(TOKEN_KEY);
                } catch {
                    // ignore storage restriction
                }
            }

            function setStatusText(el, msg, isError = false) {
                if (!(el instanceof HTMLElement)) return;
                el.textContent = msg;
                el.hidden = !msg;
                el.classList.toggle("is-error", Boolean(isError));
            }

            function limpiarHijos(el) {
                if (!(el instanceof HTMLElement)) return;
                while (el.firstChild) el.removeChild(el.firstChild);
            }

            function crearCelda(texto, esCode = false) {
                const td = document.createElement("td");
                if (esCode) {
                    const code = document.createElement("code");
                    code.textContent = String(texto ?? "—");
                    td.appendChild(code);
                } else {
                    td.textContent = String(texto ?? "—");
                }
                return td;
            }

            function descargarArchivoLic(filename, envelopeObj) {
                const jsonStr = JSON.stringify(envelopeObj, null, 2);
                const blob = new Blob([jsonStr], { type: "application/json" });
                const objUrl = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = objUrl;
                a.download = filename || "QuoraTec_Licencia.lic";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(objUrl), 4000);
            }

            async function apiTeamFetch(path, { method = "GET", body = null, token = "" } = {}) {
                const headers = { Accept: "application/json" };
                if (body !== null) headers["Content-Type"] = "application/json";
                if (token) headers.Authorization = `Bearer ${token}`;
                const resp = await fetch(path, {
                    method,
                    headers,
                    body: body !== null ? JSON.stringify(body) : undefined,
                });
                const data = await resp.json().catch(() => ({}));
                return { ok: resp.ok, status: resp.status, data };
            }

            function cerrarSesionEquipo(msg = "") {
                setAal2Token("");
                aal1State = { token: "", factorId: "", challengeId: "" };
                workspace.hidden = true;
                if (founderSection) founderSection.hidden = true;
                if (agentSection) agentSection.hidden = true;
                authGate.hidden = false;
                if (mfaGate) mfaGate.hidden = true;
                if (mfaEnrollBox) mfaEnrollBox.hidden = true;
                if (totpInput instanceof HTMLInputElement) totpInput.value = "";
                setStatusText(authStatus, msg, Boolean(msg));
            }

            function renderTickets(tickets, token) {
                const box = document.getElementById("teamTicketsContainer");
                if (!(box instanceof HTMLElement)) return;
                limpiarHijos(box);

                if (!Array.isArray(tickets) || tickets.length === 0) {
                    const empty = document.createElement("p");
                    empty.className = "muted-note";
                    empty.textContent = "Sin tickets registrados por el momento.";
                    box.appendChild(empty);
                    return;
                }

                tickets.forEach((tk) => {
                    const card = document.createElement("div");
                    card.className = "team-item-card";

                    const head = document.createElement("div");
                    head.className = "team-item-head";

                    const title = document.createElement("strong");
                    title.textContent = `${tk.client_name || "Cliente"} · RUC ${tk.empresa_ruc || "N/D"}`;
                    const badge = document.createElement("span");
                    badge.className = "badge-chip";
                    badge.textContent = `${tk.status || "open"} · v${tk.app_version || "3.0.0"}`;
                    head.appendChild(title);
                    head.appendChild(badge);
                    card.appendChild(head);

                    const desc = document.createElement("p");
                    desc.className = "muted-note";
                    desc.textContent = tk.description || "";
                    card.appendChild(desc);

                    const actions = document.createElement("div");
                    actions.className = "team-item-actions";

                    const diagSlot = document.createElement("div");
                    diagSlot.className = "muted-note";

                    if (tk.diagnostic_zip_path) {
                        const btnZip = document.createElement("button");
                        btnZip.type = "button";
                        btnZip.className = "btn-glow team-mini-btn";
                        btnZip.textContent = "Descargar Diagnóstico .zip (URL 60 s)";
                        btnZip.addEventListener("click", async () => {
                            btnZip.disabled = true;
                            diagSlot.textContent = "Generando enlace firmado de 60 segundos...";
                            const res = await apiTeamFetch("/api/team/diagnostic-url", {
                                method: "POST",
                                token,
                                body: { ticket_id: tk.id },
                            });
                            btnZip.disabled = false;
                            if (!res.ok || !res.data?.signed_url) {
                                diagSlot.textContent = res.data?.error || "No se pudo firmar el diagnóstico .zip.";
                                return;
                            }
                            limpiarHijos(diagSlot);
                            const dlLink = document.createElement("a");
                            dlLink.href = res.data.signed_url;
                            dlLink.target = "_blank";
                            dlLink.rel = "noopener noreferrer";
                            dlLink.className = "btn-support-link";
                            dlLink.textContent = `⬇ Descargar ${res.data.filename || "diagnostico.zip"} (expira en 60s)`;
                            diagSlot.appendChild(dlLink);
                        });
                        actions.appendChild(btnZip);
                    }

                    [
                        { status: "in_progress", label: "En Revisión" },
                        { status: "escalated", label: "Escalar a Founder" },
                        { status: "resolved", label: "Marcar Resuelto" },
                    ].forEach((act) => {
                        const btnSt = document.createElement("button");
                        btnSt.type = "button";
                        btnSt.className = "btn-glass team-mini-btn";
                        btnSt.textContent = act.label;
                        btnSt.addEventListener("click", async () => {
                            btnSt.disabled = true;
                            const res = await apiTeamFetch("/api/team/tickets", {
                                method: "POST",
                                token,
                                body: { ticket_id: tk.id, status: act.status },
                            });
                            btnSt.disabled = false;
                            if (res.ok) {
                                setStatusText(globalToast, `Ticket actualizado a ${act.status}.`);
                                cargarDashboardEquipo();
                            } else {
                                setStatusText(globalToast, res.data?.error || "Error actualizando ticket.", true);
                            }
                        });
                        actions.appendChild(btnSt);
                    });

                    card.appendChild(actions);
                    card.appendChild(diagSlot);
                    box.appendChild(card);
                });
            }

            function renderFounderDashboard(payload) {
                const s = payload.summary || {};
                const setTxt = (id, val) => {
                    const el = document.getElementById(id);
                    if (el) el.textContent = String(val ?? 0);
                };
                setTxt("kpiActiveLicenses", s.active_licenses ?? 0);
                setTxt("kpiFounderLicenses", s.founder_licenses ?? 0);
                setTxt("kpiDemoLicenses", s.demo_licenses ?? 0);
                setTxt("kpiEscalatedAndSeats", `${s.escalated_tickets ?? 0} / ${s.active_seats_total ?? 0}`);

                const licBody = document.getElementById("founderLicensesBody");
                if (licBody instanceof HTMLElement) {
                    limpiarHijos(licBody);
                    (payload.licenses || []).forEach((lic) => {
                        const tr = document.createElement("tr");
                        tr.appendChild(crearCelda(lic.license_id, true));
                        tr.appendChild(crearCelda(`${lic.holder_ruc || "—"} · ${lic.holder_name || ""}`));
                        tr.appendChild(
                            crearCelda(
                                `${lic.plan_name || "—"} (${lic.max_rucs || 1} RUC · ${lic.max_seats || 1} PC · ${lic.cloud_gb ?? 0} GB${lic.is_founder ? " · Fundador" : ""})`,
                            ),
                        );
                        tr.appendChild(crearCelda(`${lic.environment || "production"} · ${String(lic.expires_at || "").slice(0, 10)}`));
                        licBody.appendChild(tr);
                    });
                }

                const auditBody = document.getElementById("founderAuditLogsBody");
                if (auditBody instanceof HTMLElement) {
                    limpiarHijos(auditBody);
                    (payload.audit_logs || []).forEach((log) => {
                        const tr = document.createElement("tr");
                        tr.appendChild(crearCelda(String(log.created_at || "").replace("T", " ").slice(0, 19)));
                        tr.appendChild(crearCelda(`${log.actor_role || "—"} (${log.actor_city || "—"})`));
                        tr.appendChild(crearCelda(log.action, true));
                        tr.appendChild(crearCelda(`${log.target_table || ""}:${log.target_id || ""}`));
                        tr.appendChild(crearCelda(log.ip_address || "—"));
                        auditBody.appendChild(tr);
                    });
                }
            }

            function renderAgentDashboard(payload) {
                const quotaBadge = document.getElementById("agentDemoQuotaBadge");
                const q = payload.demo_quota || { used_today: 0, limit_per_day: 3, remaining_today: 3 };
                if (quotaBadge) {
                    quotaBadge.textContent = `Cupo hoy: ${q.used_today} / ${q.limit_per_day} (${q.remaining_today} disponibles)`;
                }

                const guidesList = document.getElementById("teamWhatsappGuidesList");
                if (guidesList instanceof HTMLElement) {
                    limpiarHijos(guidesList);
                    (payload.video_guides || []).forEach((g) => {
                        const item = document.createElement("div");
                        item.className = "team-item-card";

                        const head = document.createElement("div");
                        head.className = "team-item-head";
                        const tit = document.createElement("strong");
                        tit.textContent = g.title;
                        const dur = document.createElement("span");
                        dur.className = "video-duration-pill";
                        dur.textContent = g.duration || "2 min";
                        head.appendChild(tit);
                        head.appendChild(dur);
                        item.appendChild(head);

                        const actions = document.createElement("div");
                        actions.className = "team-item-actions";

                        const btnCopy = document.createElement("button");
                        btnCopy.type = "button";
                        btnCopy.className = "btn-glow team-mini-btn";
                        btnCopy.textContent = "📋 Copiar para WhatsApp";
                        btnCopy.addEventListener("click", async () => {
                            try {
                                await navigator.clipboard.writeText(g.whatsapp_text || g.url);
                                btnCopy.textContent = "✓ Copiado para WhatsApp";
                                setTimeout(() => {
                                    btnCopy.textContent = "📋 Copiar para WhatsApp";
                                }, 2500);
                            } catch {
                                setStatusText(globalToast, g.whatsapp_text || g.url);
                            }
                        });

                        const linkView = document.createElement("a");
                        linkView.href = g.url;
                        linkView.className = "btn-glass team-mini-btn";
                        linkView.textContent = "Abrir Guía";

                        actions.appendChild(btnCopy);
                        actions.appendChild(linkView);
                        item.appendChild(actions);
                        guidesList.appendChild(item);
                    });
                }
            }

            async function cargarDashboardEquipo() {
                const token = getAal2Token();
                if (!token) {
                    cerrarSesionEquipo("");
                    return;
                }
                const res = await apiTeamFetch("/api/team/dashboard", { method: "GET", token });
                if (!res.ok || !res.data?.ok) {
                    cerrarSesionEquipo(res.data?.message || "Sesión expirada o sin 2FA TOTP aal2 válido.");
                    return;
                }

                const d = res.data;
                authGate.hidden = true;
                workspace.hidden = false;

                if (roleBadge) roleBadge.textContent = `2FA TOTP (aal2) · Rol: ${d.role}`;
                if (staffNameEl) staffNameEl.textContent = d.staff?.full_name || "Equipo QuoraTec";
                if (staffCityEl) staffCityEl.textContent = `${d.staff?.city || "Ecuador"} · Perfil activo en staff_roles`;

                if (d.role === "founder") {
                    if (founderSection) founderSection.hidden = false;
                    if (agentSection) agentSection.hidden = true;
                    renderFounderDashboard(d);
                } else {
                    if (founderSection) founderSection.hidden = true;
                    if (agentSection) agentSection.hidden = false;
                    renderAgentDashboard(d);
                }
                renderTickets(d.tickets || [], token);
            }

            if (loginForm instanceof HTMLFormElement) {
                loginForm.addEventListener("submit", async (e) => {
                    e.preventDefault();
                    const email = emailInput instanceof HTMLInputElement ? emailInput.value.trim() : "";
                    const password = passInput instanceof HTMLInputElement ? passInput.value : "";
                    setStatusText(authStatus, "Validando credenciales en Supabase Auth...");
                    const res = await apiTeamFetch("/api/team/auth", {
                        method: "POST",
                        body: { action: "login", email, password },
                    });
                    if (!res.ok || !res.data?.mfa_required) {
                        setStatusText(authStatus, res.data?.message || res.data?.error || "Acceso denegado.", true);
                        return;
                    }

                    aal1State = {
                        token: res.data.aal1_token || "",
                        factorId: res.data.factor_id || "",
                        challengeId: res.data.challenge_id || "",
                    };
                    if (passInput instanceof HTMLInputElement) passInput.value = "";

                    if (mfaWelcome && res.data.staff_preview) {
                        mfaWelcome.textContent = `Hola ${res.data.staff_preview.full_name} (${res.data.staff_preview.city}). Ingresa tu código TOTP de 6 dígitos.`;
                    }
                    if (mfaEnrollBox && !res.data.mfa_enrolled) {
                        mfaEnrollBox.hidden = false;
                        if (mfaQrImg instanceof HTMLImageElement && res.data.qr_code) {
                            mfaQrImg.src = res.data.qr_code;
                        }
                        if (mfaSecretText) {
                            mfaSecretText.textContent = res.data.totp_secret || "—";
                        }
                    } else if (mfaEnrollBox) {
                        mfaEnrollBox.hidden = true;
                    }
                    if (mfaGate) mfaGate.hidden = false;
                    if (totpInput instanceof HTMLInputElement) totpInput.focus();
                    setStatusText(authStatus, "Paso 1 aprobado. Completa el 2FA TOTP (aal2).");
                });
            }

            if (totpForm instanceof HTMLFormElement) {
                totpForm.addEventListener("submit", async (e) => {
                    e.preventDefault();
                    const code = totpInput instanceof HTMLInputElement ? totpInput.value.trim() : "";
                    setStatusText(authStatus, "Verificando 2FA TOTP...");
                    const res = await apiTeamFetch("/api/team/auth", {
                        method: "POST",
                        body: {
                            action: "mfa_verify",
                            aal1_token: aal1State.token,
                            factor_id: aal1State.factorId,
                            challenge_id: aal1State.challengeId,
                            code,
                        },
                    });
                    if (!res.ok || !res.data?.access_token) {
                        setStatusText(authStatus, res.data?.message || res.data?.error || "Código TOTP inválido.", true);
                        return;
                    }
                    setAal2Token(res.data.access_token);
                    aal1State = { token: "", factorId: "", challengeId: "" };
                    setStatusText(authStatus, "");
                    cargarDashboardEquipo();
                });
            }

            if (resetAuthBtn) resetAuthBtn.addEventListener("click", () => cerrarSesionEquipo(""));
            if (logoutBtn) logoutBtn.addEventListener("click", () => cerrarSesionEquipo("Sesión cerrada correctamente."));
            if (refreshBtn) refreshBtn.addEventListener("click", () => cargarDashboardEquipo());

            // Auto-completar valores por plan para el emisor anual del Founder
            const annualPlanSelect = document.getElementById("annualPlanSelect");
            if (annualPlanSelect instanceof HTMLSelectElement) {
                annualPlanSelect.addEventListener("change", () => {
                    const p = PLANES_V240[annualPlanSelect.value];
                    if (!p) return;
                    const rInp = document.getElementById("annualMaxRucs");
                    const sInp = document.getElementById("annualMaxSeats");
                    const cInp = document.getElementById("annualCloudGb");
                    const mSel = document.getElementById("annualStorageModes");
                    if (rInp instanceof HTMLInputElement) rInp.value = String(p.rucsMax);
                    if (sInp instanceof HTMLInputElement) sInp.value = String(p.estacionesBase);
                    if (cInp instanceof HTMLInputElement) cInp.value = String(p.nubeGbBase);
                    if (mSel instanceof HTMLSelectElement) {
                        mSel.value = p.nubeGbBase >= 150 ? "local,hybrid,cloud_dedicated" : p.nubeGbBase > 0 ? "local,hybrid" : "local";
                    }
                });
            }

            // Emisor Anual (Founder)
            const annualForm = document.getElementById("teamAnnualForm");
            if (annualForm instanceof HTMLFormElement) {
                annualForm.addEventListener("submit", async (e) => {
                    e.preventDefault();
                    const resBox = document.getElementById("annualIssueResult");
                    setStatusText(resBox, "Firmando licencia anual en backend...");
                    const payload = {
                        mode: "annual",
                        plan_name: document.getElementById("annualPlanSelect")?.value || "CONTADOR",
                        environment: document.getElementById("annualEnvSelect")?.value || "production",
                        holder_name: document.getElementById("annualHolderName")?.value?.trim() || "",
                        holder_ruc: document.getElementById("annualHolderRuc")?.value?.trim() || "",
                        hwid_inicial: document.getElementById("annualHwid")?.value?.trim() || "",
                        storage_modes: document.getElementById("annualStorageModes")?.value || "local",
                        max_rucs: Number(document.getElementById("annualMaxRucs")?.value || 1),
                        max_seats: Number(document.getElementById("annualMaxSeats")?.value || 1),
                        cloud_gb: Number(document.getElementById("annualCloudGb")?.value || 0),
                        is_founder: Boolean(document.getElementById("annualIsFounder")?.checked),
                    };
                    const res = await apiTeamFetch("/api/team/issue-license", {
                        method: "POST",
                        token: getAal2Token(),
                        body: payload,
                    });
                    if (!res.ok || !res.data?.lic_envelope) {
                        setStatusText(resBox, res.data?.message || res.data?.error || "Error emitiendo licencia.", true);
                        return;
                    }
                    descargarArchivoLic(res.data.lic_filename, res.data.lic_envelope);
                    setStatusText(resBox, `Licencia ${res.data.license?.license_id} emitida y descargada.`);
                    cargarDashboardEquipo();
                });
            }

            // Emisor Demo 15 Días (Support Agent / Founder)
            const demoForm = document.getElementById("teamDemoForm");
            if (demoForm instanceof HTMLFormElement) {
                demoForm.addEventListener("submit", async (e) => {
                    e.preventDefault();
                    const resBox = document.getElementById("demoIssueResult");
                    setStatusText(resBox, "Generando Demo de 15 días en servidor...");
                    const payload = {
                        mode: "demo",
                        holder_name: document.getElementById("demoHolderName")?.value?.trim() || "",
                        holder_ruc: document.getElementById("demoHolderRuc")?.value?.trim() || "",
                        hwid_inicial: document.getElementById("demoHwid")?.value?.trim() || "",
                    };
                    const res = await apiTeamFetch("/api/team/issue-license", {
                        method: "POST",
                        token: getAal2Token(),
                        body: payload,
                    });
                    if (!res.ok || !res.data?.lic_envelope) {
                        setStatusText(resBox, res.data?.message || res.data?.error || "No se pudo emitir la demo.", true);
                        return;
                    }
                    descargarArchivoLic(res.data.lic_filename, res.data.lic_envelope);
                    setStatusText(resBox, `Demo 15 días ${res.data.license?.license_id} emitida y descargada.`);
                    cargarDashboardEquipo();
                });
            }

            // Consulta Solo Lectura por RUC
            const lookupForm = document.getElementById("teamLookupForm");
            if (lookupForm instanceof HTMLFormElement) {
                lookupForm.addEventListener("submit", async (e) => {
                    e.preventDefault();
                    const ruc = document.getElementById("teamLookupRucInput")?.value?.trim() || "";
                    const outBox = document.getElementById("teamLookupResult");
                    if (!(outBox instanceof HTMLElement)) return;
                    limpiarHijos(outBox);
                    const loading = document.createElement("p");
                    loading.className = "muted-note";
                    loading.textContent = "Consultando licencia...";
                    outBox.appendChild(loading);

                    const res = await apiTeamFetch("/api/team/license-lookup", {
                        method: "POST",
                        token: getAal2Token(),
                        body: { holder_ruc: ruc },
                    });
                    limpiarHijos(outBox);
                    if (!res.ok) {
                        const err = document.createElement("p");
                        err.className = "muted-note";
                        err.textContent = res.data?.error || "Error consultando RUC.";
                        outBox.appendChild(err);
                        return;
                    }
                    const list = res.data?.licenses || [];
                    if (list.length === 0) {
                        const none = document.createElement("p");
                        none.className = "muted-note";
                        none.textContent = `No se encontraron licencias para el RUC/Cédula ${ruc}.`;
                        outBox.appendChild(none);
                        return;
                    }
                    const wrap = document.createElement("div");
                    wrap.className = "team-lookup-cards";
                    list.forEach((lic) => {
                        const card = document.createElement("div");
                        card.className = "team-item-card";
                        const h = document.createElement("strong");
                        h.textContent = `${lic.plan_name} · ${lic.status} (${lic.environment})`;
                        const meta = document.createElement("p");
                        meta.className = "muted-note";
                        meta.textContent = `${lic.holder_name} · ID ${lic.license_id} · Máx ${lic.max_rucs} RUCs / ${lic.max_seats} PCs · ${lic.cloud_gb ?? 0} GB · Equipos activos: ${res.data.active_seats_count ?? 0} · Vence: ${String(lic.expires_at || "").slice(0, 10)}`;
                        card.appendChild(h);
                        card.appendChild(meta);
                        wrap.appendChild(card);
                    });
                    outBox.appendChild(wrap);
                });
            }

            if (getAal2Token()) {
                cargarDashboardEquipo();
            }
        }

        inicializarPanelEquipo();
        inicializarAddonsAutoservicio();
        leerParametrosUrlSeguros();
    });

    function inicializarAddonsAutoservicio() {
        const form = document.getElementById("addonsSelfServiceForm");
        if (!form) return;
        const preview = document.getElementById("addonsTotalPreview");
        const resultBox = document.getElementById("addonsResultBox");
        const checkboxes = Array.from(form.querySelectorAll('input[name="addons"]'));

        const updateTotal = () => {
            const total = checkboxes
                .filter((cb) => cb.checked)
                .reduce((acc, cb) => acc + Number(cb.getAttribute("data-addon-usd") || 0), 0);
            if (preview) {
                preview.textContent = `Total seleccionado: $${total.toFixed(2)} USD`;
            }
        };

        checkboxes.forEach((cb) => cb.addEventListener("change", updateTotal));
        updateTotal();

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const selectedAddons = checkboxes.filter((cb) => cb.checked).map((cb) => cb.value);
            if (selectedAddons.length === 0) {
                if (resultBox) {
                    resultBox.textContent = "Selecciona al menos una ampliación (Add-on) para continuar.";
                }
                return;
            }
            const rucOrToken = String(document.getElementById("addonRucOrToken")?.value || "").trim();
            const email = String(document.getElementById("addonEmail")?.value || "").trim();
            const paymentChannel = String(document.getElementById("addonPaymentChannel")?.value || "DEUNA_PERSONAL");
            const voucherRef = String(document.getElementById("addonVoucherRef")?.value || "").trim();

            if (resultBox) {
                resultBox.textContent = "Procesando solicitud de ampliación...";
            }

            try {
                const resp = await fetch("/api/licenses/addons", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ruc_or_token: rucOrToken,
                        email,
                        addons: selectedAddons,
                        payment_channel: paymentChannel,
                        voucher_ref: voucherRef || undefined,
                    }),
                });
                const data = await resp.json().catch(() => ({}));
                if (!resp.ok || !data.ok) {
                    if (resultBox) {
                        resultBox.textContent = `Error: ${data.message || data.error || "No se pudo procesar la ampliación."}`;
                    }
                    return;
                }
                if (data.payphone_url) {
                    window.location.href = data.payphone_url;
                    return;
                }
                if (resultBox) {
                    resultBox.textContent = data.message || `Solicitud registrada (${data.order_ref || data.license_key || "OK"}).`;
                }
            } catch {
                if (resultBox) {
                    resultBox.textContent = "Error de red al conectar con /api/licenses/addons.";
                }
            }
        });
    }

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
