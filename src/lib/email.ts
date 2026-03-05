import crypto from "crypto"
import { getBaseUrl } from "./getBaseUrl"

// Dynamically import nodemailer only on the server
// This prevents it from being bundled in client-side code
let nodemailer: typeof import("nodemailer") | undefined
function getNodemailer(): typeof import("nodemailer") {
  if (typeof window !== "undefined") {
    throw new Error("Email functions can only be used on the server")
  }
  if (!nodemailer) {
    nodemailer = require("nodemailer")
  }
  // TypeScript type assertion: nodemailer is guaranteed to be set here
  return nodemailer as typeof import("nodemailer")
}

/**
 * E-Mail Template Interface
 */
interface EmailTemplateOptions {
  headline: string
  subline: string
  content: string[]
  ctaText?: string
  ctaUrl?: string
  infoBox?: string
  appName?: string
  baseUrl?: string
}

/**
 * Generiert ein konsistentes E-Mail-Template für alle Transaktions-E-Mails
 * Entspricht den B2B SaaS Design-Prinzipien: clean, minimal, produktorientiert
 */
// Logo-SVG für E-Mails (als CID-Anhang für Gmail/Outlook, sonst Data-URI)
const LOGO_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#24c598" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" stroke="#24c598" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
const LOGO_IMG_SRC_DATA =
  "data:image/svg+xml;base64," + Buffer.from(LOGO_SVG).toString("base64")

/** Inline-Logo-Anhang für E-Mails (cid:logo) – Gmail/Outlook zeigen das Icon so zuverlässig an */
export function getEmailLogoAttachment(): {
  filename: string
  content: Buffer
  cid: string
  contentType?: string
} {
  return {
    filename: "logo.svg",
    content: Buffer.from(LOGO_SVG, "utf8"),
    cid: "logo",
    contentType: "image/svg+xml",
  }
}

interface EmailTemplateOptionsWithCid {
  logoCid?: string
}

function generateEmailTemplate(
  options: EmailTemplateOptions & EmailTemplateOptionsWithCid
): string {
  const appName = options.appName || process.env.APP_NAME || "Easy Pass"
  const baseUrl = options.baseUrl || getBaseUrl()
  const logoSrc = options.logoCid ? `cid:${options.logoCid}` : LOGO_IMG_SRC_DATA

  // Logo-Einheit: Icon (cid für Gmail/Outlook, sonst Data-URI) + „Easy Pass“ – in allen Mails einheitlich
  const logoUnitHtml = `
    <div class="logo-unit" style="display: inline-flex; align-items: center; gap: 8px;">
      <img src="${logoSrc}" width="32" height="32" alt="" style="display: block; border: 0; flex-shrink: 0;" />
      <span class="logo-text" style="font-size: 1.25rem; font-weight: 700; color: #0A0A0A; white-space: nowrap;">${appName}</span>
    </div>
  `
  
  const infoBoxHtml = options.infoBox ? `
    <div style="background-color: #FAFAFA; border: 1px solid #E5E5E5; border-radius: 4px; padding: 16px; margin: 24px 0; font-size: 14px; line-height: 1.5; color: #0A0A0A;">
      ${options.infoBox}
    </div>
  ` : ''
  
  return `
    <!DOCTYPE html>
    <html lang="de">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #0A0A0A;
            background-color: #F5F5F5;
            padding: 0;
            margin: 0;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          .email-wrapper {
            max-width: 640px;
            margin: 0 auto;
            background-color: #FFFFFF;
            padding: 0;
          }
          .email-container {
            padding: 32px 24px;
          }
          @media only screen and (max-width: 640px) {
            .email-container {
              padding: 24px 16px;
            }
          }
          .logo {
            text-align: left;
            margin-bottom: 32px;
          }
          .logo-unit {
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }
          .logo-text {
            font-size: 1.25rem;
            font-weight: 700;
            color: #0A0A0A;
            white-space: nowrap;
          }
          .headline {
            font-size: 24px;
            font-weight: 600;
            line-height: 1.3;
            color: #0A0A0A;
            margin-bottom: 8px;
          }
          .subline {
            font-size: 16px;
            line-height: 1.5;
            color: #7A7A7A;
            margin-bottom: 24px;
          }
          .content {
            font-size: 16px;
            line-height: 1.6;
            color: #0A0A0A;
            margin-bottom: 24px;
          }
          .content p {
            margin-bottom: 16px;
          }
          .content p:last-child {
            margin-bottom: 0;
          }
          .cta-button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #24c598;
            color: #FFFFFF;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 500;
            font-size: 16px;
            margin: 24px 0;
            text-align: center;
            border: none;
          }
          .cta-button:hover {
            background-color: #C1005F;
          }
          .divider {
            height: 1px;
            background-color: #E5E5E5;
            margin: 32px 0;
            border: none;
          }
          .footer {
            font-size: 14px;
            line-height: 1.5;
            color: #7A7A7A;
            text-align: center;
            padding-top: 24px;
          }
          .footer-links {
            margin-bottom: 16px;
          }
          .footer-links a {
            color: #24c598;
            text-decoration: none;
            margin: 0 12px;
          }
          .footer-links a:hover {
            text-decoration: underline;
          }
          .footer-text {
            font-size: 13px;
            color: #9A9A9A;
            margin-top: 16px;
          }
          .link-fallback {
            font-size: 14px;
            color: #7A7A7A;
            word-break: break-all;
            margin-top: 16px;
            padding: 12px;
            background-color: #FAFAFA;
            border-radius: 4px;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <!-- Logo (Icon + Name, 8px Abstand) -->
            <div class="logo">
              ${logoUnitHtml}
            </div>
            
            <!-- Headline -->
            <h1 class="headline">${options.headline}</h1>
            
            <!-- Subline -->
            <p class="subline">${options.subline}</p>
            
            <!-- Content -->
            <div class="content">
              ${options.content.map(paragraph => `<p>${paragraph}</p>`).join('')}
            </div>
            
            ${options.ctaUrl && options.ctaText ? `
            <!-- CTA Button -->
            <div style="text-align: left;">
              <a href="${options.ctaUrl}" class="cta-button">${options.ctaText}</a>
            </div>
            <p class="link-fallback">${options.ctaUrl}</p>
            ` : ''}
            
            <!-- Optional Info Box -->
            ${infoBoxHtml}
            
            <!-- Divider -->
            <hr class="divider">
            
            <!-- Footer -->
            <div class="footer">
              <div class="footer-links">
                <a href="${baseUrl}/login">Login</a>
                <a href="${baseUrl}/help">Hilfe</a>
                <a href="${baseUrl}/legal">Rechtliches</a>
              </div>
              <div class="footer-text">
                ${appName} – Transaktions-E-Mail
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
}

/**
 * Generiert einen sicheren Verifizierungs-Token
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

/**
 * Erstellt einen konfigurierten Nodemailer-Transport
 */
function createEmailTransport() {
  const nm = getNodemailer()
  
  // Wenn SMTP konfiguriert ist, verwende SMTP
  if (process.env.SMTP_HOST) {
    const port = parseInt(process.env.SMTP_PORT || "587")
    const isSecure = port === 465
    
    return nm.createTransport({
      host: process.env.SMTP_HOST,
      port: port,
      secure: isSecure, // true für Port 465 (SSL), false für Port 587 (TLS)
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      // Für Port 587 (TLS) explizit TLS aktivieren
      ...(port === 587 && {
        requireTLS: true,
        tls: {
          rejectUnauthorized: false // Für Development, in Production auf true setzen
        }
      })
    })
  }
  
  // Fallback: Log-Only Mode (für Entwicklung)
  return nm.createTransport({
    jsonTransport: true, // Gibt E-Mail als JSON zurück (für Logging)
  })
}

/**
 * Sendet eine E-Mail-Verifizierungs-E-Mail
 * 
 * Unterstützt:
 * - SMTP (via Umgebungsvariablen: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD)
 * - Log-Only Mode (wenn keine SMTP-Konfiguration vorhanden)
 */
export async function sendVerificationEmail(
  email: string,
  name: string | null,
  verificationToken: string
): Promise<void> {
  // Use getBaseUrl() for better URL resolution (supports VERCEL_URL fallback)
  const baseUrl = getBaseUrl()
  const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`
  const appName = process.env.APP_NAME || "Easy Pass"
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || "noreply@example.com"
  
  const htmlContent = generateEmailTemplate({
    headline: "E-Mail-Adresse verifizieren",
    subline: "Bitte bestätigen Sie Ihre E-Mail-Adresse, um Ihr Konto zu aktivieren.",
    content: [
      `Hallo ${name || email},`,
      `Bitte klicken Sie auf den Button, um Ihre E-Mail-Adresse zu verifizieren. Dieser Link ist 24 Stunden gültig.`
    ],
    ctaText: "E-Mail-Adresse verifizieren",
    ctaUrl: verificationUrl,
    infoBox: "Wenn Sie sich nicht bei " + appName + " registriert haben, können Sie diese E-Mail ignorieren.",
    appName,
    baseUrl,
    logoCid: "logo",
  })
  
  const textContent = `E-Mail-Adresse verifizieren

Hallo ${name || email},

Bitte bestätigen Sie Ihre E-Mail-Adresse, um Ihr Konto zu aktivieren.

Bitte klicken Sie auf den folgenden Link, um Ihre E-Mail-Adresse zu verifizieren:

${verificationUrl}

Dieser Link ist 24 Stunden gültig.

Wenn Sie sich nicht bei ${appName} registriert haben, können Sie diese E-Mail ignorieren.`
  
  try {
    const transport = createEmailTransport()
    
    const mailOptions = {
      from: fromEmail,
      to: email,
      subject: `E-Mail-Adresse verifizieren – ${appName}`,
      text: textContent,
      html: htmlContent,
      attachments: [getEmailLogoAttachment()],
    }
    
    const info = await transport.sendMail(mailOptions)
    
    // Wenn im Log-Mode (JSON Transport), gebe die Info in der Console aus
    if (process.env.SMTP_HOST) {
      console.log(`E-Mail-Verifizierung gesendet an: ${email}`)
    } else {
      console.log(`\n=== E-Mail-Verifizierung (Development Mode) ===`)
      console.log(`An: ${email}`)
      console.log(`Von: ${fromEmail}`)
      console.log(`Verifizierungs-URL: ${verificationUrl}`)
      console.log(`\nFalls ein E-Mail-Service konfiguriert wäre, würde die E-Mail jetzt gesendet werden.`)
      console.log(`Für Produktion: Bitte SMTP_HOST, SMTP_PORT, SMTP_USER und SMTP_PASSWORD in .env konfigurieren`)
      console.log(`================================================\n`)
      // Im Development-Mode wird die E-Mail als JSON geloggt
      if (info && typeof info === 'object' && 'message' in info) {
        console.log(`E-Mail-Daten:`, JSON.stringify(info, null, 2))
      }
    }
  } catch (error) {
    console.error("Fehler beim Senden der E-Mail-Verifizierung:", error)
    // Fehler wird nicht weitergeworfen, damit die Registrierung nicht fehlschlägt
    // In Produktion sollte hier ein Error-Tracking-Service benachrichtigt werden
  }
}

/**
 * Sendet eine Passwort-Reset-E-Mail
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string | null,
  resetToken: string
): Promise<void> {
  const baseUrl = getBaseUrl()
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`
  const appName = process.env.APP_NAME || "Easy Pass"
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || "noreply@example.com"

  const htmlContent = generateEmailTemplate({
    headline: "Passwort zurücksetzen",
    subline: "Sie haben die Zurücksetzung Ihres Passworts angefordert.",
    content: [
      `Hallo ${name || email},`,
      `Bitte klicken Sie auf den Button, um ein neues Passwort festzulegen. Dieser Link ist 1 Stunde gültig.`
    ],
    ctaText: "Passwort zurücksetzen",
    ctaUrl: resetUrl,
    infoBox: "Wenn Sie kein neues Passwort angefordert haben, können Sie diese E-Mail ignorieren. Ihr Passwort bleibt unverändert.",
    appName,
    baseUrl,
    logoCid: "logo",
  })

  const textContent = `Passwort zurücksetzen

Hallo ${name || email},

Sie haben die Zurücksetzung Ihres Passworts für ${appName} angefordert.

Bitte klicken Sie auf den folgenden Link, um ein neues Passwort festzulegen:

${resetUrl}

Wichtig: Dieser Link ist 1 Stunde gültig.

Wenn Sie kein neues Passwort angefordert haben, können Sie diese E-Mail ignorieren. Ihr Passwort bleibt unverändert.`

  try {
    const transport = createEmailTransport()

    const mailOptions = {
      from: fromEmail,
      to: email,
      subject: `Passwort zurücksetzen – ${appName}`,
      text: textContent,
      html: htmlContent,
      attachments: [getEmailLogoAttachment()],
    }

    const info = await transport.sendMail(mailOptions)

    if (process.env.SMTP_HOST) {
      console.log(`Passwort-Reset-E-Mail gesendet an: ${email}`)
    } else {
      console.log(`\n=== Passwort-Reset-E-Mail (Development Mode) ===`)
      console.log(`An: ${email}`)
      console.log(`Von: ${fromEmail}`)
      console.log(`Reset-URL: ${resetUrl}`)
      console.log(`\nFalls ein E-Mail-Service konfiguriert wäre, würde die E-Mail jetzt gesendet werden.`)
      console.log(`Für Produktion: Bitte SMTP_HOST, SMTP_PORT, SMTP_USER und SMTP_PASSWORD in .env konfigurieren`)
      console.log(`================================================\n`)
      if (info && typeof info === 'object' && 'message' in info) {
        console.log(`E-Mail-Daten:`, JSON.stringify(info, null, 2))
      }
    }
  } catch (error) {
    console.error("Fehler beim Senden der Passwort-Reset-E-Mail:", error)
    // Im Development-Mode keinen Fehler werfen, da E-Mail nur geloggt wird
    if (!process.env.SMTP_HOST) {
      console.log("⚠️ E-Mail wurde nicht gesendet, aber Reset-Token wurde generiert.")
      return // Kein Fehler in Development
    }
    throw error // In Production Fehler weiterwerfen
  }
}

/**
 * Sendet einen 2FA-E-Mail-Code (Einmal-Code für Zwei-Faktor-Authentifizierung)
 */
export async function send2FACodeEmail(
  email: string,
  name: string | null,
  code: string
): Promise<void> {
  const appName = process.env.APP_NAME || "Easy Pass"
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || "noreply@example.com"

  const htmlContent = generateEmailTemplate({
    headline: "Ihr 2FA-Code",
    subline: "Verwenden Sie diesen Code zur Anmeldung oder zur Aktivierung der Zwei-Faktor-Authentifizierung.",
    content: [
      `Hallo ${name || email},`,
      `Ihr Einmal-Code lautet:`,
      `<strong style="font-size: 1.5rem; letter-spacing: 0.2em;">${code}</strong>`,
      `Der Code ist 10 Minuten gültig.`,
    ],
    ctaText: "Zum Login",
    ctaUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    infoBox: "Wenn Sie diesen Code nicht angefordert haben, ignorieren Sie diese E-Mail und prüfen Sie Ihr Konto.",
    appName,
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    logoCid: "logo",
  })

  const textContent = `Ihr 2FA-Code

Hallo ${name || email},

Ihr Einmal-Code: ${code}

Der Code ist 10 Minuten gültig.

Wenn Sie diesen Code nicht angefordert haben, ignorieren Sie diese E-Mail.`

  try {
    const transport = createEmailTransport()
    await transport.sendMail({
      from: fromEmail,
      to: email,
      subject: `Ihr 2FA-Code – ${appName}`,
      text: textContent,
      html: htmlContent,
      attachments: [getEmailLogoAttachment()],
    })
    if (process.env.SMTP_HOST) {
      console.log(`2FA-Code-E-Mail gesendet an: ${email}`)
    } else {
      console.log(`[Dev] 2FA-Code an ${email}: ${code}`)
    }
  } catch (error) {
    console.error("Fehler beim Senden der 2FA-Code-E-Mail:", error)
    throw error
  }
}

/**
 * Sendet eine Einladungs-E-Mail
 * 
 * Phase 1: Organisation lädt User per E-Mail ein
 */
export async function sendInvitationEmail(
  email: string,
  organizationId: string,
  invitationToken: string
): Promise<void> {
  const appName = process.env.APP_NAME || "Easy Pass"
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || "noreply@example.com"
  const baseUrl = getBaseUrl()
  
  // Hole Organisationsname
  const { prisma } = await import("@/lib/prisma")
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true },
  })
  
  const organizationName = organization?.name || "eine Organisation"
  const signupUrl = `${baseUrl}/signup/accept-invitation?token=${encodeURIComponent(invitationToken)}`
  
  const htmlContent = generateEmailTemplate({
    headline: `Einladung zu ${organizationName}`,
    subline: `Sie wurden eingeladen, ${organizationName} auf ${appName} beizutreten.`,
    content: [
      "Hallo,",
      `Bitte klicken Sie auf den Button, um sich zu registrieren und der Organisation beizutreten. Diese Einladung ist 7 Tage gültig.`
    ],
    ctaText: "Einladung annehmen",
    ctaUrl: signupUrl,
    infoBox: "Wenn Sie diese Einladung nicht erwartet haben, können Sie diese E-Mail ignorieren.",
    appName,
    baseUrl,
    logoCid: "logo",
  })
  
  const textContent = `Einladung zu ${organizationName}

Hallo,

Sie wurden eingeladen, ${organizationName} auf ${appName} beizutreten.

Klicken Sie auf den folgenden Link, um sich zu registrieren:

${signupUrl}

Diese Einladung ist 7 Tage gültig.

Wenn Sie diese Einladung nicht erwartet haben, können Sie diese E-Mail ignorieren.`
  
  try {
    const transport = createEmailTransport()
    
    const mailOptions = {
      from: fromEmail,
      to: email,
      subject: `Einladung zu ${organizationName} – ${appName}`,
      text: textContent,
      html: htmlContent,
      attachments: [getEmailLogoAttachment()],
    }
    
    const info = await transport.sendMail(mailOptions)
    
    if (process.env.SMTP_HOST) {
      console.log(`Einladungs-E-Mail gesendet an: ${email}`)
    } else {
      console.log(`\n=== Einladungs-E-Mail (Development Mode) ===`)
      console.log(`An: ${email}`)
      console.log(`Von: ${fromEmail}`)
      console.log(`Einladungs-URL: ${signupUrl}`)
      console.log(`\nFalls ein E-Mail-Service konfiguriert wäre, würde die E-Mail jetzt gesendet werden.`)
      console.log(`================================================\n`)
      if (info && typeof info === 'object' && 'message' in info) {
        console.log(`E-Mail-Daten:`, JSON.stringify(info, null, 2))
      }
    }
  } catch (error) {
    console.error("Fehler beim Senden der Einladungs-E-Mail:", error)
    throw error // Wirf Fehler weiter, damit API-Endpoint ihn behandeln kann
  }
}

/**
 * Sendet eine Supplier Data Request E-Mail
 * 
 * Sendet einen Magic Link an einen Partner/Lieferanten, um Daten zu einem DPP beizutragen
 */
export async function sendSupplierDataRequestEmail(
  email: string,
  data: {
    organizationName: string
    productName: string
    partnerRole: string
    contributeUrl: string
  }
): Promise<void> {
  const appName = process.env.APP_NAME || "Easy Pass"
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || "noreply@example.com"
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"
  
  const htmlContent = generateEmailTemplate({
    headline: "Anfrage für Produktdaten",
    subline: `${data.organizationName} benötigt Produktinformationen für ${data.productName} zur Erfüllung der EU Digital Product Passport Anforderungen.`,
    content: [
      "Hallo,",
      "Bitte klicken Sie auf den Button, um die angefragten Informationen bereitzustellen. Kein Konto erforderlich. Dieser Link ist 14 Tage gültig."
    ],
    ctaText: "Daten bereitstellen",
    ctaUrl: data.contributeUrl,
    infoBox: "Wenn Sie diese Anfrage nicht erwartet haben, können Sie diese E-Mail ignorieren.",
    appName,
    baseUrl,
    logoCid: "logo",
  })
  
  const textContent = `Anfrage für Produktdaten

Hallo,

${data.organizationName} benötigt Produktinformationen für ${data.productName} zur Erfüllung der EU Digital Product Passport Anforderungen.

Bitte klicken Sie auf den folgenden Link, um die angefragten Informationen bereitzustellen:

${data.contributeUrl}

Kein Konto erforderlich. Dieser Link ist 14 Tage gültig.

Wenn Sie diese Anfrage nicht erwartet haben, können Sie diese E-Mail ignorieren.`
  
  try {
    const transport = createEmailTransport()
    
    const mailOptions = {
      from: fromEmail,
      to: email,
      subject: `Anfrage für Produktdaten – ${appName}`,
      text: textContent,
      html: htmlContent,
      attachments: [getEmailLogoAttachment()],
    }
    
    const info = await transport.sendMail(mailOptions)
    
    if (process.env.SMTP_HOST) {
      console.log(`Supplier data request email sent to: ${email}`)
    } else {
      console.log(`\n=== Supplier Data Request Email (Development Mode) ===`)
      console.log(`To: ${email}`)
      console.log(`From: ${fromEmail}`)
      console.log(`Contribute URL: ${data.contributeUrl}`)
      console.log(`\nIf an email service were configured, the email would be sent now.`)
      console.log(`For production: Please configure SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASSWORD in .env`)
      console.log(`================================================\n`)
      if (info && typeof info === 'object' && 'message' in info) {
        console.log(`Email data:`, JSON.stringify(info, null, 2))
      }
    }
  } catch (error) {
    console.error("Error sending supplier data request email:", error)
    throw error
  }
}

/**
 * Sendet eine Rechnung per E-Mail (PDF-Anhang) – z. B. bei „Rechnung erneut versenden“ (S-5).
 * Nutzt dasselbe Template wie Einladungs- und Registrierungs-E-Mails (konsistentes Styling).
 */
export async function sendInvoiceResendEmail(
  to: string,
  invoiceNumber: string,
  pdfBuffer: Buffer
): Promise<void> {
  const appName = process.env.APP_NAME || "Easy Pass"
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || "noreply@example.com"
  const fileName = `Rechnung-${invoiceNumber}.pdf`

  const htmlContent = generateEmailTemplate({
    headline: `Ihre Rechnung ${invoiceNumber}`,
    subline: `Anbei erhalten Sie Ihre Rechnung als PDF-Anhang.`,
    content: [
      "mit dieser E-Mail erhalten Sie Ihre Rechnung im Anhang.",
      "Bei Fragen stehen wir Ihnen gerne zur Verfügung.",
      `Mit freundlichen Grüßen,<br>Ihr ${appName}-Team`,
    ],
    infoBox: "Die Rechnung finden Sie im Anhang dieser E-Mail (PDF).",
    appName,
    baseUrl: getBaseUrl(),
    logoCid: "logo",
  })

  const textContent = `Ihre Rechnung ${invoiceNumber}

Anbei erhalten Sie Ihre Rechnung als PDF-Anhang.

Mit freundlichen Grüßen,
Ihr ${appName}-Team`

  const transport = createEmailTransport()
  try {
    const info = await transport.sendMail({
      from: fromEmail,
      to,
      subject: `Ihre Rechnung ${invoiceNumber} – ${appName}`,
      text: textContent,
      html: htmlContent,
      attachments: [
        getEmailLogoAttachment(),
        { filename: fileName, content: pdfBuffer, contentType: "application/pdf" },
      ],
    })

    if (process.env.SMTP_HOST) {
      console.log(`[Rechnung] E-Mail versendet an ${to} (Rechnung ${invoiceNumber}), messageId: ${info.messageId ?? "–"}`)
    } else {
      console.warn(`\n=== Rechnung per E-Mail (Development – NICHT versendet) ===`)
      console.warn(`An: ${to}`)
      console.warn(`Von: ${fromEmail}`)
      console.warn(`Rechnung: ${invoiceNumber}`)
      console.warn(`Für echten Versand SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD in .env setzen.`)
      console.warn(`================================================\n`)
    }
  } catch (error) {
    console.error("[Rechnung] Fehler beim E-Mail-Versand:", error)
    throw error
  }
}

