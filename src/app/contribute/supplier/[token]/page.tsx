"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { LoadingSpinner } from "@/components/LoadingSpinner"

/**
 * Beitragsseite für block-basierte Supplier-Einladung (Pflichtdaten).
 * Link aus E-Mail: /contribute/supplier/[token]
 */
export default function ContributeSupplierPage() {
  const params = useParams()
  const token = params.token as string
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading")
  const [error, setError] = useState("")
  const [context, setContext] = useState<{
    dpp: { name: string; organizationName: string }
    partnerRole: string
  } | null>(null)

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setError("Token ist erforderlich")
      return
    }
    const load = async () => {
      try {
        const res = await fetch(`/api/contribute/supplier/${token}`)
        const data = await res.json()
        if (!res.ok) {
          setStatus("error")
          setError(data.error || "Ungültiger oder abgelaufener Link")
          return
        }
        setContext({
          dpp: data.dpp,
          partnerRole: data.partnerRole,
        })
        setStatus("ready")
      } catch {
        setStatus("error")
        setError("Ein Fehler ist aufgetreten")
      }
    }
    load()
  }, [token])

  if (status === "loading") {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <LoadingSpinner message="Lade Einladung..." />
      </div>
    )
  }

  if (status === "error") {
    return (
      <div style={{ maxWidth: "480px", margin: "2rem auto", padding: "2rem", textAlign: "center" }}>
        <p style={{ color: "#991B1B", marginBottom: "1rem" }}>{error}</p>
        <Link href="/" style={{ color: "#24c598", textDecoration: "none" }}>
          Zur Startseite
        </Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: "640px", margin: "2rem auto", padding: "2rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "1rem" }}>
        Einladung zur Datenbereitstellung
      </h1>
      <p style={{ color: "#374151", marginBottom: "1rem" }}>
        {context?.dpp.organizationName} hat Sie eingeladen, Informationen zum Produktpass
        &quot;{context?.dpp.name}&quot; bereitzustellen.
      </p>
      <p style={{ color: "#6B7280", fontSize: "0.875rem" }}>
        Die Beitragsseite für die ausgewählten Felder wird hier angezeigt. Sie können den Link
        aus der E-Mail verwenden, um Ihre Daten einzugeben.
      </p>
      <p style={{ marginTop: "1.5rem" }}>
        <Link href="/" style={{ color: "#24c598", textDecoration: "none", fontWeight: "600" }}>
          ← Zur Startseite
        </Link>
      </p>
    </div>
  )
}
