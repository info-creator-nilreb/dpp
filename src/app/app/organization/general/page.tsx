import { redirect } from "next/navigation"

/**
 * Ehemalige "Allgemeine Einstellungen" – Inhalt wurde in Firmendaten integriert.
 * Redirect für bestehende Lesezeichen/Links.
 */
export default function OrganizationGeneralPage() {
  redirect("/app/organization/company-details")
}
