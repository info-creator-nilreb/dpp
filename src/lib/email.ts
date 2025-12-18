import crypto from "crypto"
import nodemailer from "nodemailer"

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
  // Wenn SMTP konfiguriert ist, verwende SMTP
  if (process.env.SMTP_HOST) {
    const port = parseInt(process.env.SMTP_PORT || "587")
    const isSecure = port === 465
    
    return nodemailer.createTransport({
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
  return nodemailer.createTransport({
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

