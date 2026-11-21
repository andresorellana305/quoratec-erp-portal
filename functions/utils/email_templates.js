/**
 * Motor Centralizado de Correos Corporativos HTML — QuoraTec (erp.quoratec.com / quoratec.com)
 * Diseño responsive de 600px compatible con Gmail y Outlook (tablas, estilos inline,
 * colores #0B1120, #0EA5E9, #F8FAFC, bordes 1px, isotipo SVG QuoraTec y pie soporte@quoratec.com)
 * con versión texto plano de respaldo.
 */

const QUORATEC_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="36" height="36" style="display:block;"><rect x="4" y="4" width="56" height="56" rx="14" fill="#0B1120" stroke="#0EA5E9" stroke-width="3.5"/><path d="M 45.2 27.5 A 14.5 14.5 0 1 0 42.5 41.8" fill="none" stroke="#0EA5E9" stroke-width="5.5" stroke-linecap="round"/><line x1="36.5" y1="36.5" x2="47" y2="47" stroke="#0EA5E9" stroke-width="5.5" stroke-linecap="round"/><circle cx="48.5" cy="48.5" r="4" fill="#0EA5E9"/></svg>`;

function escapeHtml(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function wrapCorporateLayout({ preheader, title, bodyHtml }) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:Arial,Helvetica,sans-serif;color:#0B1120;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader || title)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F8FAFC;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#FFFFFF;border:1px solid #CBD5E1;border-radius:8px;overflow:hidden;">
          <!-- Cabecera Corporativa -->
          <tr>
            <td style="background-color:#0B1120;padding:20px 24px;border-bottom:1px solid #1E293B;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="44" valign="middle">${QUORATEC_LOGO_SVG}</td>
                  <td valign="middle" style="padding-left:12px;">
                    <div style="font-size:18px;font-weight:bold;color:#F8FAFC;line-height:1.2;">QuoraTec ERP</div>
                    <div style="font-size:12px;color:#0EA5E9;line-height:1.3;">erp.quoratec.com · Edición 2026</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Contenido -->
          <tr>
            <td style="padding:24px;background-color:#FFFFFF;color:#0B1120;font-size:14px;line-height:1.6;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Pie Institucional -->
          <tr>
            <td style="padding:18px 24px;background-color:#F8FAFC;border-top:1px solid #E2E8F0;font-size:12px;color:#475569;line-height:1.5;">
              <strong>QuoraTec</strong> — Soluciones Empresariales y Contables (quoratec.com)<br>
              Soporte Oficial: <a href="mailto:soporte@quoratec.com" style="color:#0EA5E9;text-decoration:none;">soporte@quoratec.com</a> · Portal: <a href="https://erp.quoratec.com" style="color:#0EA5E9;text-decoration:none;">https://erp.quoratec.com</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 1. Correo de Bienvenida + Prueba Gratis 15 Días
 */
export function buildWelcomeTrialEmail({
    razonSocial = "Emprendedor / Contador",
    downloadUrl = "https://erp.quoratec.com/descargas.html",
    trialDays = 15,
} = {}) {
    const safeName = escapeHtml(razonSocial);
    const safeUrl = escapeHtml(downloadUrl);
    const subject = `Bienvenido a QuoraTec ERP — Tu Prueba Gratis de ${trialDays} Días está lista`;
    const bodyHtml = `
      <h2 style="margin:0 0 12px 0;font-size:20px;color:#0B1120;">¡Bienvenido a QuoraTec ERP, ${safeName}!</h2>
      <p style="margin:0 0 14px 0;">Tu cuenta ha sido creada exitosamente. Ya puedes descargar el instalador oficial y disfrutar de <strong>${trialDays} días gratis con el 100 % de funciones desbloqueadas</strong> (sin tarjeta).</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
        <tr>
          <td style="background-color:#0EA5E9;border-radius:6px;">
            <a href="${safeUrl}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:bold;color:#FFFFFF;text-decoration:none;">⬇ Descargar Instalador Oficial</a>
          </td>
        </tr>
      </table>
      <p style="margin:0;color:#475569;">Si necesitas asistencia para instalar o activar tu prueba, escríbenos a soporte@quoratec.com.</p>
    `;
    const text = [
        `¡Bienvenido a QuoraTec ERP, ${razonSocial}!`,
        ``,
        `Tu cuenta ha sido creada. Disfruta de ${trialDays} días gratis con todas las funciones desbloqueadas.`,
        `Descarga el instalador oficial aquí: ${downloadUrl}`,
        ``,
        `Soporte QuoraTec: soporte@quoratec.com`,
    ].join("\n");

    return {
        subject,
        html: wrapCorporateLayout({ preheader: subject, title: subject, bodyHtml }),
        text,
    };
}

/**
 * 2. Correo de Confirmación de Orden y Entrega de Licencia .lic
 */
export function buildOrderLicenseEmail({
    razonSocial = "Cliente QuoraTec",
    rucCedula = "",
    planId = "COMERCIAL_PRO",
    orderRef = "",
    licenseKey = "",
    expiresAt = "",
    downloadUrl = "https://erp.quoratec.com/descargas.html",
} = {}) {
    const safeRazon = escapeHtml(razonSocial);
    const safeRuc = escapeHtml(rucCedula);
    const safePlan = escapeHtml(planId);
    const safeRef = escapeHtml(orderRef);
    const safeKey = escapeHtml(licenseKey);
    const safeExp = escapeHtml(String(expiresAt || "").slice(0, 10));
    const safeUrl = escapeHtml(downloadUrl);

    const subject = `Tu Licencia Oficial QuoraTec ERP (${licenseKey || orderRef})`;
    const bodyHtml = `
      <h2 style="margin:0 0 12px 0;font-size:20px;color:#0B1120;">¡Tu Licencia Oficial de QuoraTec ERP está lista!</h2>
      <p style="margin:0 0 14px 0;">Estimado/a <strong>${safeRazon}</strong>, confirmamos tu pago aprobado. Adjunto encontrarás tu archivo de licencia <code>.lic</code> listo para activar.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #CBD5E1;border-collapse:collapse;margin:16px 0;font-size:13px;">
        <tr style="background-color:#F8FAFC;"><td style="padding:10px;border-bottom:1px solid #E2E8F0;color:#475569;">Orden</td><td style="padding:10px;border-bottom:1px solid #E2E8F0;"><strong>${safeRef || "Confirmada"}</strong></td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #E2E8F0;color:#475569;">Plan Anual</td><td style="padding:10px;border-bottom:1px solid #E2E8F0;"><strong>${safePlan}</strong></td></tr>
        <tr style="background-color:#F8FAFC;"><td style="padding:10px;border-bottom:1px solid #E2E8F0;color:#475569;">Cédula / RUC</td><td style="padding:10px;border-bottom:1px solid #E2E8F0;"><strong>${safeRuc}</strong></td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #E2E8F0;color:#475569;">Clave de Licencia</td><td style="padding:10px;border-bottom:1px solid #E2E8F0;"><code>${safeKey}</code></td></tr>
        <tr style="background-color:#F8FAFC;"><td style="padding:10px;color:#475569;">Vigencia hasta</td><td style="padding:10px;"><strong>${safeExp}</strong></td></tr>
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0;">
        <tr>
          <td style="background-color:#0EA5E9;border-radius:6px;">
            <a href="${safeUrl}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:bold;color:#FFFFFF;text-decoration:none;">⬇ Descargar / Activar en QuoraTec ERP</a>
          </td>
        </tr>
      </table>
      <p style="margin:0;color:#475569;">En QuoraTec ERP ve a <strong>Configuración → 4. Plan y Licencia → Cargar archivo .lic</strong>.</p>
    `;
    const text = [
        `¡Tu Licencia Oficial de QuoraTec ERP está lista!`,
        `Titular: ${razonSocial}`,
        `Plan: ${planId} | Cédula/RUC: ${rucCedula}`,
        `Orden: ${orderRef} | Licencia: ${licenseKey}`,
        `Vigencia hasta: ${String(expiresAt || "").slice(0, 10)}`,
        `Descarga / Activación: ${downloadUrl}`,
        `Soporte QuoraTec: soporte@quoratec.com`,
    ].join("\n");

    return {
        subject,
        html: wrapCorporateLayout({ preheader: subject, title: subject, bodyHtml }),
        text,
    };
}

/**
 * 3. Correo de Notificación de Comisión Ganada para Asesora
 */
export function buildAdvisorCommissionEmail({
    advisorName = "Asesora Comercial",
    referralCode = "",
    orderRef = "",
    saleType = "new_sale",
    netCollectedUsd = 0,
    commissionRate = 20,
    commissionUsd = 0,
    status = "pending_settlement",
} = {}) {
    const safeAdvisor = escapeHtml(advisorName);
    const safeCode = escapeHtml(referralCode);
    const safeRef = escapeHtml(orderRef);
    const safeType = saleType === "renewal" ? "Renovación Anual (10 %)" : "Venta / Upgrade (20 %)";
    const netStr = `$${Number(netCollectedUsd || 0).toFixed(2)} USD`;
    const commStr = `$${Number(commissionUsd || 0).toFixed(2)} USD`;
    const subject = `Nueva Comisión Registrada (${commStr}) — Código ${referralCode}`;

    const bodyHtml = `
      <h2 style="margin:0 0 12px 0;font-size:20px;color:#0B1120;">¡Has generado una nueva comisión, ${safeAdvisor}!</h2>
      <p style="margin:0 0 14px 0;">Un cliente completó un pago aprobado utilizando tu código de referido <strong>${safeCode}</strong>.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #CBD5E1;border-collapse:collapse;margin:16px 0;font-size:13px;">
        <tr style="background-color:#F8FAFC;"><td style="padding:10px;border-bottom:1px solid #E2E8F0;color:#475569;">Orden</td><td style="padding:10px;border-bottom:1px solid #E2E8F0;"><strong>${safeRef}</strong></td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #E2E8F0;color:#475569;">Tipo</td><td style="padding:10px;border-bottom:1px solid #E2E8F0;">${escapeHtml(safeType)}</td></tr>
        <tr style="background-color:#F8FAFC;"><td style="padding:10px;border-bottom:1px solid #E2E8F0;color:#475569;">Cobro Neto Aprobado</td><td style="padding:10px;border-bottom:1px solid #E2E8F0;">${escapeHtml(netStr)}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #E2E8F0;color:#475569;">Comisión (${escapeHtml(String(commissionRate))} %)</td><td style="padding:10px;border-bottom:1px solid #E2E8F0;"><strong style="color:#0EA5E9;">${escapeHtml(commStr)}</strong></td></tr>
        <tr style="background-color:#F8FAFC;"><td style="padding:10px;color:#475569;">Estado</td><td style="padding:10px;"><code>${escapeHtml(status)}</code></td></tr>
      </table>
      <p style="margin:0;color:#475569;">Podrás consultar el estado de liquidación en tu panel de Asesora.</p>
    `;
    const text = [
        `¡Has generado una nueva comisión, ${advisorName}!`,
        `Código: ${referralCode} | Orden: ${orderRef}`,
        `Tipo: ${safeType} | Cobro Neto: ${netStr}`,
        `Comisión (${commissionRate}%): ${commStr} | Estado: ${status}`,
        `Soporte QuoraTec: soporte@quoratec.com`,
    ].join("\n");

    return {
        subject,
        html: wrapCorporateLayout({ preheader: subject, title: subject, bodyHtml }),
        text,
    };
}

/**
 * 4. Correo de Código OTP de Seguridad / Recuperación de Contraseña (10 min)
 */
export function buildOtpSecurityEmail({
    otpCode = "000000",
    purpose = "Recuperación de contraseña",
    expiresMinutes = 10,
} = {}) {
    const safeOtp = escapeHtml(otpCode);
    const safePurpose = escapeHtml(purpose);
    const subject = `Código de Seguridad QuoraTec: ${otpCode} (válido por ${expiresMinutes} min)`;

    const bodyHtml = `
      <h2 style="margin:0 0 12px 0;font-size:20px;color:#0B1120;">Código de Verificación de Seguridad</h2>
      <p style="margin:0 0 14px 0;">Recibimos una solicitud de <strong>${safePurpose}</strong> en QuoraTec ERP. Usa el siguiente código de un solo uso:</p>
      <div style="margin:18px 0;padding:16px;background-color:#0B1120;border:1px solid #0EA5E9;border-radius:6px;text-align:center;">
        <span style="font-family:monospace;font-size:28px;font-weight:bold;letter-spacing:6px;color:#F8FAFC;">${safeOtp}</span>
      </div>
      <p style="margin:0;color:#475569;">Este código expira en <strong>${expiresMinutes} minutos</strong>. Si no solicitaste esta acción, ignora este mensaje.</p>
    `;
    const text = [
        `Código de Seguridad QuoraTec (${purpose}): ${otpCode}`,
        `Este código expira en ${expiresMinutes} minutos.`,
        `Si no solicitaste esta acción, ignora este mensaje.`,
        `Soporte QuoraTec: soporte@quoratec.com`,
    ].join("\n");

    return {
        subject,
        html: wrapCorporateLayout({ preheader: subject, title: subject, bodyHtml }),
        text,
    };
}
