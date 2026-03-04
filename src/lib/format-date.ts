/**
 * Einheitliches Datumsformat dd.mm.yyyy für die Anzeige (z. B. Abrechnung, Rechnungen).
 */
const DE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
}

export function formatDateDDMMYYYY(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate
  return d.toLocaleDateString("de-DE", DE_OPTIONS)
}

/** Datum + Zeit im Format dd.mm.yyyy, HH:mm für Super-Admin u. a. */
export function formatDateTimeDDMMYYYY(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate
  const datePart = d.toLocaleDateString("de-DE", DE_OPTIONS)
  const timePart = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
  return `${datePart}, ${timePart}`
}
