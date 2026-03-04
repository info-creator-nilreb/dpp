/**
 * Rechnungs-PDF-Erstellung (minimalistisch, im Stil der App).
 * Oben links: Easy Product Pass Logo (App-Logo). Kein Kundenlogo.
 */

import PDFDocument from "pdfkit"
import { getBaseUrl } from "@/lib/getBaseUrl"
import { formatDateDDMMYYYY } from "@/lib/format-date"

// Design (angelehnt an design-tokens.ts)
const STYLE = {
  primary: "#0A0A0A",
  secondary: "#7A7A7A",
  accent: "#24c598",
  border: "#E5E5E5",
  fontSize: { small: 9, body: 10, heading: 12 },
  margin: 50,
  tablePadding: 6,
  /** Abstand zwischen den Zeilen im Block oben rechts (Rechnung / Datum / Zeitraum) */
  headerRightLineHeight: 16,
}

/** Pfad zum Easy-Product-Pass-Logo (öffentlich, z. B. /icon oder /logo-invoice.png). */
const EASY_PASS_LOGO_PATH = "/icon"

export interface InvoicePdfOrg {
  name: string
  legalName?: string | null
  invoiceAddressStreet?: string | null
  invoiceAddressZip?: string | null
  invoiceAddressCity?: string | null
  invoiceAddressCountry?: string | null
}

export interface InvoicePdfLine {
  description: string
  quantity: number
  unitAmount: number
  amount: number
  isOverage?: boolean
}

export interface InvoicePdfData {
  invoiceNumber: string
  periodStart: Date | string
  periodEnd: Date | string
  createdAt: Date | string
  netAmount: number
  taxAmount: number
  totalAmount: number
  currency: string
  lines: InvoicePdfLine[]
  organization: InvoicePdfOrg
}

function formatCents(cents: number, currency: string): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: currency || "EUR",
  }).format(cents / 100)
}

/** Lädt Bild-URL (absolut oder relativ zur App) und gibt Buffer zurück, sonst null. */
async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const fullUrl = url.startsWith("http") ? url : `${getBaseUrl()}${url.startsWith("/") ? "" : "/"}${url}`
    const res = await fetch(fullUrl, { cache: "no-store" })
    if (!res.ok) return null
    const arrayBuffer = await res.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch {
    return null
  }
}

/**
 * Erzeugt ein minimalistisches Rechnungs-PDF als Buffer.
 * Oben links: Easy Product Pass Logo (nur App-Logo, kein Kundenlogo).
 */
export async function buildInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  const org = data.organization
  const logoUrl = `${getBaseUrl()}${EASY_PASS_LOGO_PATH}`
  const logoBuffer = await fetchImageBuffer(logoUrl)

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: STYLE.margin, size: "A4" })
    const chunks: Buffer[] = []
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    let yLeft = STYLE.margin
    const logoWidth = 80
    const logoHeight = 32
    // Abstand Icon–Text einheitlich wie in E-Mails/Sidebar (8px ≈ 6pt; etwas reduziert für Rechnung)
    const logoTextGap = 4

    // Easy Product Pass Logo + Text „easy pass“ (oben links)
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, STYLE.margin, yLeft, { width: logoWidth, height: logoHeight, fit: [logoWidth, logoHeight] })
      } catch {
        // Ungültiges Bildformat – überspringen
      }
      doc.fontSize(STYLE.fontSize.heading).fillColor(STYLE.primary)
      doc.text("easy pass", STYLE.margin + logoWidth + logoTextGap, yLeft + 8)
      yLeft += logoHeight + 8
    } else {
      doc.fontSize(STYLE.fontSize.heading).fillColor(STYLE.primary)
      doc.text("easy pass", STYLE.margin, yLeft)
      yLeft += 24
    }

    // Block oben rechts: Rechnung, Rechnungsdatum, Zeitraum – mit festen Abständen, keine Überlagerung
    const yRightStart = STYLE.margin
    const rightX = 350
    const rightWidth = 200
    doc.fontSize(STYLE.fontSize.heading).fillColor(STYLE.primary)
    doc.text(`Rechnung ${data.invoiceNumber}`, rightX, yRightStart, { width: rightWidth, align: "right" })
    doc.fontSize(STYLE.fontSize.body).fillColor(STYLE.secondary)
    doc.text(`Rechnungsdatum: ${formatDateDDMMYYYY(data.createdAt)}`, rightX, yRightStart + STYLE.headerRightLineHeight, { width: rightWidth, align: "right" })
    doc.text(`Zeitraum: ${formatDateDDMMYYYY(data.periodStart)} – ${formatDateDDMMYYYY(data.periodEnd)}`, rightX, yRightStart + 2 * STYLE.headerRightLineHeight, { width: rightWidth, align: "right" })

    // Empfänger (Rechnungsadresse der Organisation)
    const recipientLines: string[] = []
    const legalName = org.legalName || org.name
    recipientLines.push(legalName)
    if (org.invoiceAddressStreet) recipientLines.push(org.invoiceAddressStreet)
    const zipCity = [org.invoiceAddressZip, org.invoiceAddressCity].filter(Boolean).join(" ")
    if (zipCity) recipientLines.push(zipCity)
    if (org.invoiceAddressCountry) recipientLines.push(org.invoiceAddressCountry)

    let y = Math.max(yLeft, STYLE.margin + 50)
    doc.fontSize(STYLE.fontSize.body).fillColor(STYLE.primary)
    recipientLines.forEach((line) => {
      doc.text(line, STYLE.margin, y)
      y += 14
    })
    y += 20

    // Tabellenkopf
    doc.fontSize(STYLE.fontSize.small).fillColor(STYLE.secondary)
    doc.text("Position", STYLE.margin, y)
    doc.text("Menge", 320, y)
    doc.text("Einzelpreis", 380, y)
    doc.text("Betrag", 460, y, { width: 100, align: "right" })
    y += STYLE.tablePadding + 12
    doc.moveTo(STYLE.margin, y).lineTo(550, y).strokeColor(STYLE.border).stroke()
    y += STYLE.tablePadding

    doc.fillColor(STYLE.primary).fontSize(STYLE.fontSize.body)
    for (const line of data.lines) {
      const desc = line.isOverage ? `${line.description} (Zusatznutzung)` : line.description
      doc.text(desc, STYLE.margin, y, { width: 300 })
      doc.text(String(line.quantity), 320, y)
      doc.text(formatCents(line.unitAmount, data.currency), 380, y)
      doc.text(formatCents(line.amount, data.currency), 460, y, { width: 100, align: "right" })
      y += 18
    }
    y += 10
    doc.moveTo(STYLE.margin, y).lineTo(550, y).strokeColor(STYLE.border).stroke()
    y += 16

    // Summen (rechts)
    const sumX = 380
    doc.fontSize(STYLE.fontSize.body).fillColor(STYLE.secondary)
    doc.text("Nettobetrag:", sumX, y)
    doc.text(formatCents(data.netAmount, data.currency), 460, y, { width: 100, align: "right" })
    y += 14
    doc.text("MwSt:", sumX, y)
    doc.text(formatCents(data.taxAmount, data.currency), 460, y, { width: 100, align: "right" })
    y += 14
    doc.fontSize(STYLE.fontSize.heading).fillColor(STYLE.primary)
    doc.text("Gesamtbetrag:", sumX, y)
    doc.text(formatCents(data.totalAmount, data.currency), 460, y, { width: 100, align: "right" })
    y += 28

    // Footer
    doc.fontSize(STYLE.fontSize.small).fillColor(STYLE.secondary)
    doc.text(
      "Vielen Dank für Ihr Vertrauen. Bei Fragen wenden Sie sich bitte an den Support.",
      STYLE.margin,
      doc.page.height - STYLE.margin - 30,
      { width: 500, align: "center" }
    )

    doc.end()
  })
}
