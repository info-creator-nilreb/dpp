import crypto from "crypto"

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
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/verify-email?token=${verificationToken}`
  const appName = process.env.APP_NAME || "T-Pass"
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || "noreply@example.com"
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #0A0A0A;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #FFFFFF;
            border: 1px solid #CDCDCD;
            border-radius: 12px;
            padding: 2rem;
          }
          .button {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            background-color: #E20074;
            color: #FFFFFF;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 1rem 0;
          }
          .footer {
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid #CDCDCD;
            font-size: 0.85rem;
            color: #7A7A7A;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 style="color: #0A0A0A; margin-bottom: 1rem;">E-Mail-Adresse verifizieren</h1>
          <p>Hallo ${name || email},</p>
          <p>vielen Dank für Ihre Registrierung bei ${appName}!</p>
          <p>Bitte klicken Sie auf den folgenden Button, um Ihre E-Mail-Adresse zu verifizieren:</p>
          <a href="${verificationUrl}" class="button">E-Mail-Adresse verifizieren</a>
          <p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
          <p style="word-break: break-all; color: #7A7A7A; font-size: 0.9rem;">${verificationUrl}</p>
          <p style="margin-top: 2rem;">Dieser Link ist 24 Stunden gültig.</p>
          <div class="footer">
            <p>Wenn Sie sich nicht bei ${appName} registriert haben, können Sie diese E-Mail ignorieren.</p>
          </div>
        </div>
      </body>
    </html>
  `
  
  const textContent = `
Hallo ${name || email},

vielen Dank für Ihre Registrierung bei ${appName}!

Bitte klicken Sie auf den folgenden Link, um Ihre E-Mail-Adresse zu verifizieren:

${verificationUrl}

Dieser Link ist 24 Stunden gültig.

Wenn Sie sich nicht bei ${appName} registriert haben, können Sie diese E-Mail ignorieren.
  `
  
  try {
    const transport = createEmailTransport()
    
    const mailOptions = {
      from: fromEmail,
      to: email,
      subject: `E-Mail-Adresse verifizieren - ${appName}`,
      text: textContent,
      html: htmlContent,
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
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/reset-password?token=${resetToken}`
  const appName = process.env.APP_NAME || "T-Pass"
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || "noreply@example.com"

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #0A0A0A;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #FFFFFF;
            border: 1px solid #CDCDCD;
            border-radius: 12px;
            padding: 2rem;
          }
          .button {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            background-color: #E20074;
            color: #FFFFFF;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 1rem 0;
          }
          .footer {
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid #CDCDCD;
            font-size: 0.85rem;
            color: #7A7A7A;
          }
          .warning {
            background-color: #FFF3CD;
            border: 1px solid #FFE69C;
            border-radius: 6px;
            padding: 1rem;
            margin: 1rem 0;
            color: #856404;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 style="color: #0A0A0A; margin-bottom: 1rem;">Passwort zurücksetzen</h1>
          <p>Hallo ${name || email},</p>
          <p>Sie haben die Zurücksetzung Ihres Passworts für ${appName} angefordert.</p>
          <p>Bitte klicken Sie auf den folgenden Button, um ein neues Passwort festzulegen:</p>
          <a href="${resetUrl}" class="button">Passwort zurücksetzen</a>
          <p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
          <p style="word-break: break-all; color: #7A7A7A; font-size: 0.9rem;">${resetUrl}</p>
          <div class="warning">
            <strong>Wichtig:</strong> Dieser Link ist 1 Stunde gültig. Wenn Sie kein neues Passwort angefordert haben, können Sie diese E-Mail ignorieren.
          </div>
          <div class="footer">
            <p>Wenn Sie diese E-Mail nicht angefordert haben, können Sie sie sicher ignorieren. Ihr Passwort bleibt unverändert.</p>
          </div>
        </div>
      </body>
    </html>
  `

  const textContent = `
Hallo ${name || email},

Sie haben die Zurücksetzung Ihres Passworts für ${appName} angefordert.

Bitte klicken Sie auf den folgenden Link, um ein neues Passwort festzulegen:

${resetUrl}

Wichtig: Dieser Link ist 1 Stunde gültig.

Wenn Sie kein neues Passwort angefordert haben, können Sie diese E-Mail ignorieren. Ihr Passwort bleibt unverändert.
  `

  try {
    const transport = createEmailTransport()

    const mailOptions = {
      from: fromEmail,
      to: email,
      subject: `Passwort zurücksetzen - ${appName}`,
      text: textContent,
      html: htmlContent,
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
 * Sendet eine Einladungs-E-Mail
 * 
 * Phase 1: Organisation lädt User per E-Mail ein
 */
export async function sendInvitationEmail(
  email: string,
  organizationId: string,
  invitationToken: string
): Promise<void> {
  const appName = process.env.APP_NAME || "T-Pass"
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || "noreply@example.com"
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"
  
  // Hole Organisationsname
  const { prisma } = await import("@/lib/prisma")
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true },
  })
  
  const organizationName = organization?.name || "eine Organisation"
  const signupUrl = `${baseUrl}/signup?invitation=${invitationToken}`
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #0A0A0A;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #FFFFFF;
            border: 1px solid #CDCDCD;
            border-radius: 12px;
            padding: 2rem;
          }
          .button {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            background-color: #E20074;
            color: #FFFFFF;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 1rem 0;
          }
          .footer {
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid #CDCDCD;
            font-size: 0.85rem;
            color: #7A7A7A;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 style="color: #0A0A0A; margin-bottom: 1rem;">Einladung zu ${organizationName}</h1>
          <p>Hallo,</p>
          <p>Sie wurden eingeladen, ${organizationName} auf ${appName} beizutreten.</p>
          <p>Klicken Sie auf den folgenden Button, um sich zu registrieren und der Organisation beizutreten:</p>
          <a href="${signupUrl}" class="button">Einladung annehmen</a>
          <p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
          <p style="word-break: break-all; color: #7A7A7A; font-size: 0.9rem;">${signupUrl}</p>
          <p style="margin-top: 2rem;">Diese Einladung ist 7 Tage gültig.</p>
          <div class="footer">
            <p>Wenn Sie diese Einladung nicht erwartet haben, können Sie diese E-Mail ignorieren.</p>
          </div>
        </div>
      </body>
    </html>
  `
  
  const textContent = `
Hallo,

Sie wurden eingeladen, ${organizationName} auf ${appName} beizutreten.

Klicken Sie auf den folgenden Link, um sich zu registrieren:

${signupUrl}

Diese Einladung ist 7 Tage gültig.

Wenn Sie diese Einladung nicht erwartet haben, können Sie diese E-Mail ignorieren.
  `
  
  try {
    const transport = createEmailTransport()
    
    const mailOptions = {
      from: fromEmail,
      to: email,
      subject: `Einladung zu ${organizationName} - ${appName}`,
      text: textContent,
      html: htmlContent,
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
  const appName = process.env.APP_NAME || "T-Pass"
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || "noreply@example.com"
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #0A0A0A;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #FFFFFF;
            border: 1px solid #CDCDCD;
            border-radius: 12px;
            padding: 2rem;
          }
          .button {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            background-color: #E20074;
            color: #FFFFFF;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 1rem 0;
          }
          .footer {
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid #CDCDCD;
            font-size: 0.85rem;
            color: #7A7A7A;
          }
          .benefits {
            margin: 1.5rem 0;
            padding-left: 0;
          }
          .benefits li {
            margin: 0.5rem 0;
            list-style: none;
            padding-left: 1.5rem;
            position: relative;
          }
          .benefits li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #E20074;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 style="color: #0A0A0A; margin-bottom: 1rem;">Request for product data for EU Digital Product Passport</h1>
          <p>Hello,</p>
          <p><strong>${data.organizationName}</strong> is requesting product information for <strong>${data.productName}</strong>.</p>
          <p>This data is needed to comply with EU Digital Product Passport requirements.</p>
          <ul class="benefits">
            <li>No account required</li>
            <li>Only specific data fields</li>
            <li>Takes approximately 3–5 minutes</li>
          </ul>
          <p>Please click the button below to provide the requested information:</p>
          <a href="${data.contributeUrl}" class="button">Provide data now</a>
          <p style="margin-top: 2rem; font-size: 0.9rem; color: #7A7A7A;">Or copy this link into your browser:</p>
          <p style="word-break: break-all; color: #7A7A7A; font-size: 0.85rem;">${data.contributeUrl}</p>
          <div class="footer">
            <p>This link expires in 14 days.</p>
            <p>If you did not expect this request, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
    </html>
  `
  
  const textContent = `Request for product data for EU Digital Product Passport

Hello,

${data.organizationName} is requesting product information for ${data.productName}.

This data is needed to comply with EU Digital Product Passport requirements.

What you can do:
✓ No account required
✓ Only specific data fields
✓ Takes approximately 3–5 minutes

Please click the link below to provide the requested information:

${data.contributeUrl}

This link expires in 14 days.

If you did not expect this request, you can safely ignore this email.
  `
  
  try {
    const transport = createEmailTransport()
    
    const mailOptions = {
      from: fromEmail,
      to: email,
      subject: "Request for product data for EU Digital Product Passport",
      text: textContent,
      html: htmlContent,
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

