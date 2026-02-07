"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import DppEditorTabs from "@/components/dpp/DppEditorTabs"
import EditorHeader from "@/components/dpp/EditorHeader"
import { LoadingSpinner } from "@/components/LoadingSpinner"

interface NewDppContentProps {
  availableCategories: Array<{ categoryKey: string; label: string }>
  initialOrganizations?: Array<{ id: string; name: string }>
}

interface PrefillData {
  name?: string
  description?: string
  category?: string
  sku?: string
  gtin?: string
  brand?: string
  countryOfOrigin?: string
  materials?: string
  materialSource?: string
  careInstructions?: string
  isRepairable?: boolean | null
  sparePartsAvailable?: boolean | null
  lifespan?: string
  conformityDeclaration?: string
  disposalInfo?: string
  takebackOffered?: boolean | null
  takebackContact?: string
  secondLifeInfo?: string
}

const categoryValues = ["TEXTILE", "FURNITURE", "OTHER"] as const
type CategoryType = (typeof categoryValues)[number]

function buildEmptyDpp(
  organizations: Array<{ id: string; name: string }>,
  availableCategories: Array<{ categoryKey: string; label: string }>,
  prefillData: PrefillData | null
) {
  // Kein Template vor Auswahl: Kategorie nur bei Prefill setzen, sonst leer („Bitte auswählen“)
  const cat =
    prefillData?.category && availableCategories.some((c) => c.categoryKey === prefillData.category)
      ? prefillData.category
      : ""
  return {
    id: "new",
    name: prefillData?.name ?? "",
    description: prefillData?.description ?? null,
    category: cat,
    sku: prefillData?.sku ?? null,
    gtin: prefillData?.gtin ?? null,
    brand: prefillData?.brand ?? null,
    countryOfOrigin: prefillData?.countryOfOrigin ?? null,
    materials: prefillData?.materials ?? null,
    materialSource: prefillData?.materialSource ?? null,
    careInstructions: prefillData?.careInstructions ?? null,
    isRepairable:
      prefillData?.isRepairable != null ? String(prefillData.isRepairable) : null,
    sparePartsAvailable:
      prefillData?.sparePartsAvailable != null ? String(prefillData.sparePartsAvailable) : null,
    lifespan: prefillData?.lifespan ?? null,
    conformityDeclaration: prefillData?.conformityDeclaration ?? null,
    disposalInfo: prefillData?.disposalInfo ?? null,
    takebackOffered:
      prefillData?.takebackOffered != null ? String(prefillData.takebackOffered) : null,
    takebackContact: prefillData?.takebackContact ?? null,
    secondLifeInfo: prefillData?.secondLifeInfo ?? null,
    status: "DRAFT",
    organizationId: organizations[0]?.id ?? "",
    createdAt: new Date(),
    updatedAt: new Date(),
    organization: {
      id: organizations[0]?.id ?? "",
      name: organizations[0]?.name ?? "",
    },
    media: [],
    _fieldValues: {} as Record<string, string | string[]>,
    _fieldInstances: {} as Record<string, Array<{ instanceId: string; values: Record<string, string | string[]> }>>,
  }
}

export default function NewDppContent({
  availableCategories,
  initialOrganizations = [],
}: NewDppContentProps) {
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>(initialOrganizations)
  const [loading, setLoading] = useState(initialOrganizations.length === 0)
  const [prefillData, setPrefillData] = useState<PrefillData | null>(null)
  const [showLeaveWarning, setShowLeaveWarning] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const [dpp, setDpp] = useState<any>(() =>
    buildEmptyDpp(initialOrganizations, availableCategories, null)
  )
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "publishing" | "error">("idle")
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [editorStatus, setEditorStatus] = useState<"draft" | "published" | "published_with_hints" | "error">("draft")
  const [subscriptionCanPublish, setSubscriptionCanPublish] = useState(true)
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id ?? "")
  const [userId, setUserId] = useState("")
  const [availableFeatures, setAvailableFeatures] = useState<string[]>([])

  useEffect(() => {
    if (initialOrganizations.length > 0) {
      setOrganizations(initialOrganizations)
      setLoading(false)
      setOrganizationId(initialOrganizations[0].id)
      return
    }
    async function load() {
      try {
        const res = await fetch("/api/app/organizations", { cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          const orgs = data.organizations ?? []
          setOrganizations(orgs)
          if (orgs.length > 0) setOrganizationId(orgs[0].id)
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [initialOrganizations.length])

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("preflightPrefillData")
      if (raw) {
        const data = JSON.parse(raw) as PrefillData
        setPrefillData(data)
        sessionStorage.removeItem("preflightPrefillData")
      }
    } catch {
      sessionStorage.removeItem("preflightPrefillData")
    }
  }, [])

  useEffect(() => {
    if (organizations.length > 0 && dpp?.id === "new") {
      setDpp((prev: any) =>
        buildEmptyDpp(organizations, availableCategories, prefillData ?? null)
      )
    }
  }, [organizations.length, availableCategories.length])

  useEffect(() => {
    if (!hasUnsavedChanges) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
      return ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [hasUnsavedChanges])

  useEffect(() => {
    if (organizationId && dpp?.id) {
      Promise.all([
        fetch("/api/app/account", { cache: "no-store" }),
        fetch(`/api/app/capabilities/check?organizationId=${organizationId}`, { cache: "no-store" }),
      ]).then(([accountRes, capRes]) => {
        if (accountRes.ok) {
          accountRes.json().then((data) => setUserId(data.id ?? ""))
        }
        if (capRes.ok) {
          capRes.json().then((data) => setAvailableFeatures(data.features ?? []))
        }
      })
    }
  }, [organizationId, dpp?.id])

  // Trial-Status für EditorHeader (Trial Notice): /api/app/capabilities/check liefert keine Subscription
  useEffect(() => {
    if (!organizationId) return
    fetch("/api/app/subscription/status", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.canPublish === "boolean") {
          setSubscriptionCanPublish(data.canPublish)
        }
      })
      .catch(() => {})
  }, [organizationId])

  const normalizeDppFromApi = (raw: any, fieldValues: Record<string, string | string[]>, fieldInstances: Record<string, any[]>) => ({
    ...raw,
    category: categoryValues.includes((raw?.category as CategoryType) ?? "OTHER") ? (raw.category as CategoryType) : "OTHER",
    createdAt: raw?.createdAt ? new Date(raw.createdAt) : new Date(),
    updatedAt: raw?.updatedAt ? new Date(raw.updatedAt) : new Date(),
    media: (raw?.media ?? []).map((m: any) => ({ ...m, uploadedAt: m.uploadedAt ? new Date(m.uploadedAt) : new Date() })),
    _fieldValues: fieldValues ?? {},
    _fieldInstances: fieldInstances ?? {},
  })

  const handleSave = async (): Promise<any> => {
    setSaveStatus("saving")
    setSaveError(null)
    try {
      if (dpp.id === "new" || !dpp.id) {
        const body: Record<string, unknown> = {
          name: dpp.name?.trim() || "",
          description: dpp.description ?? null,
          category: dpp.category,
          sku: dpp.sku ?? null,
          gtin: dpp.gtin ?? null,
          brand: dpp.brand ?? null,
          countryOfOrigin: dpp.countryOfOrigin ?? null,
          materials: dpp.materials ?? null,
          materialSource: dpp.materialSource ?? null,
          careInstructions: dpp.careInstructions ?? null,
          isRepairable: dpp.isRepairable ?? null,
          sparePartsAvailable: dpp.sparePartsAvailable ?? null,
          lifespan: dpp.lifespan ?? null,
          conformityDeclaration: dpp.conformityDeclaration ?? null,
          disposalInfo: dpp.disposalInfo ?? null,
          takebackOffered: dpp.takebackOffered ?? null,
          takebackContact: dpp.takebackContact ?? null,
          secondLifeInfo: dpp.secondLifeInfo ?? null,
        }
        if (dpp._fieldValues && Object.keys(dpp._fieldValues).length > 0) body.fieldValues = dpp._fieldValues
        if (dpp._fieldInstances && Object.keys(dpp._fieldInstances).length > 0) body.fieldInstances = dpp._fieldInstances

        const createRes = await fetch("/api/app/dpp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (!createRes.ok) {
          const err = await createRes.json().catch(() => ({ error: "Fehler beim Erstellen" }))
          throw new Error(err.error || "Fehler beim Erstellen")
        }
        const { dpp: created } = await createRes.json()
        const newId = created.id
        const dppRes = await fetch(`/api/app/dpp/${newId}`, { cache: "no-store" })
        if (!dppRes.ok) throw new Error("DPP konnte nicht geladen werden")
        const dppData = await dppRes.json()
        const normalized = normalizeDppFromApi(dppData.dpp, dppData.fieldValues ?? {}, dppData.fieldInstances ?? {})
        setDpp(normalized)
        setLastSaved(new Date())
        setSaveStatus("saved")
        setOrganizationId(normalized.organizationId)
        return normalized
      }

      const putRes = await fetch(`/api/app/dpp/${dpp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: dpp.name,
          description: dpp.description,
          category: dpp.category,
          sku: dpp.sku,
          gtin: dpp.gtin,
          brand: dpp.brand,
          countryOfOrigin: dpp.countryOfOrigin,
          materials: dpp.materials,
          materialSource: dpp.materialSource,
          careInstructions: dpp.careInstructions,
          isRepairable: dpp.isRepairable,
          sparePartsAvailable: dpp.sparePartsAvailable,
          lifespan: dpp.lifespan,
          conformityDeclaration: dpp.conformityDeclaration,
          disposalInfo: dpp.disposalInfo,
          takebackOffered: dpp.takebackOffered,
          takebackContact: dpp.takebackContact,
          secondLifeInfo: dpp.secondLifeInfo,
        }),
      })
      if (!putRes.ok) {
        const err = await putRes.json().catch(() => ({ error: "Fehler beim Speichern" }))
        throw new Error(err.error || "Fehler beim Speichern")
      }
      const savedDate = new Date()
      setLastSaved(savedDate)
      setSaveStatus("saved")
      const dppRes = await fetch(`/api/app/dpp/${dpp.id}`, { cache: "no-store" })
      if (dppRes.ok) {
        const dppData = await dppRes.json()
        const normalized = normalizeDppFromApi(dppData.dpp, dppData.fieldValues ?? {}, dppData.fieldInstances ?? {})
        setDpp(normalized)
        return normalized
      }
      return dpp
    } catch (e: any) {
      setSaveError(e?.message ?? "Fehler")
      setSaveStatus("error")
      throw e
    }
  }

  const handlePublish = async () => {
    let currentId = dpp?.id
    if (currentId === "new" || !currentId) {
      const saved = await handleSave()
      currentId = saved?.id
      if (!currentId) return
    }
    setSaveStatus("publishing")
    setSaveError(null)
    try {
      const res = await fetch(`/api/app/dpp/${currentId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Fehler beim Veröffentlichen" }))
        throw new Error(err.error || "Fehler beim Veröffentlichen")
      }
      setEditorStatus("published")
      setSaveStatus("saved")
      setLastSaved(new Date())
      const dppRes = await fetch(`/api/app/dpp/${currentId}`, { cache: "no-store" })
      if (dppRes.ok) {
        const dppData = await dppRes.json()
        setDpp(normalizeDppFromApi(dppData.dpp, dppData.fieldValues ?? {}, dppData.fieldInstances ?? {}))
      }
    } catch (e: any) {
      setSaveError(e?.message ?? "Fehler")
      setSaveStatus("error")
      throw e
    }
  }

  const canPublish = !!dpp?.name?.trim()

  if (loading) {
    return (
      <div style={{ backgroundColor: "#FFF", borderRadius: "12px", border: "1px solid #CDCDCD", padding: "2rem" }}>
        <LoadingSpinner message="Daten werden geladen..." />
      </div>
    )
  }

  if (organizations.length === 0) {
    return (
      <div style={{ backgroundColor: "#FFF", padding: "clamp(2rem, 5vw, 4rem)", borderRadius: "12px", border: "1px solid #CDCDCD", textAlign: "center" }}>
        <p style={{ color: "#7A7A7A", fontSize: "clamp(1rem, 2.5vw, 1.2rem)", marginBottom: "1rem" }}>
          Um einen Produktpass zu erstellen, benötigen Sie eine Organisation.
        </p>
        <p style={{ color: "#7A7A7A", fontSize: "clamp(0.9rem, 2vw, 1rem)", marginBottom: "1.5rem" }}>
          Bitte erstellen Sie zuerst eine Organisation in Ihren Kontoeinstellungen.
        </p>
        <a
          href="/app/account"
          style={{
            display: "inline-block",
            backgroundColor: "#24c598",
            color: "#FFF",
            padding: "clamp(0.875rem, 2.5vw, 1rem) clamp(1.5rem, 4vw, 2rem)",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
          }}
        >
          Zu Kontoeinstellungen
        </a>
      </div>
    )
  }

  if (availableCategories.length === 0) {
    return (
      <div style={{ backgroundColor: "#FFF", padding: "clamp(2rem, 5vw, 4rem)", borderRadius: "12px", border: "1px solid #CDCDCD", textAlign: "center" }}>
        <p style={{ color: "#7A7A7A", fontSize: "clamp(1rem, 2.5vw, 1.2rem)", marginBottom: "1rem" }}>Keine Templates verfügbar</p>
        <p style={{ color: "#7A7A7A", fontSize: "clamp(0.9rem, 2vw, 1rem)" }}>
          Es sind derzeit keine veröffentlichten Templates verfügbar.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="h-screen flex flex-col bg-white">
        <EditorHeader
          status={editorStatus}
          lastSaved={lastSaved}
          onPublish={handlePublish}
          isNew={dpp?.id === "new"}
          canPublish={canPublish}
          subscriptionCanPublish={subscriptionCanPublish}
          error={saveError}
          isProcessing={saveStatus === "publishing"}
          hints={[]}
          autoSaveStatus={saveStatus === "saving" ? "saving" : saveStatus === "saved" ? "saved" : saveStatus === "error" ? "error" : "idle"}
          onRetrySave={saveStatus === "error" ? handleSave : undefined}
        />
        <div
          style={{
            marginBottom: "1rem",
            padding: "0 1.5rem",
            paddingTop: subscriptionCanPublish ? "16px" : "1.5rem",
            flexShrink: 0,
            marginTop: subscriptionCanPublish ? "16px" : "24px",
          }}
        >
          <Link
            href="/app/create"
            style={{ color: "#7A7A7A", textDecoration: "none", fontSize: "clamp(0.9rem, 2vw, 1rem)" }}
            onClick={(e) => {
              if (hasUnsavedChanges) {
                e.preventDefault()
                setPendingNavigation("/app/create")
                setShowLeaveWarning(true)
              }
            }}
          >
            ← Zurück zur Übersicht
          </Link>
        </div>
        <div className="flex-1 overflow-hidden min-h-0">
          <DppEditorTabs
            dpp={dpp}
            organizationId={organizationId}
            userId={userId}
            availableFeatures={availableFeatures}
            availableCategories={availableCategories}
            onSave={handleSave}
            onPublish={handlePublish}
            onStatusChange={setSaveStatus}
            onLastSavedChange={setLastSaved}
            onErrorChange={setSaveError}
            onDppUpdate={(updatedDpp) => {
              setDpp(updatedDpp)
              setHasUnsavedChanges(true)
            }}
          />
        </div>
      </div>
      {showLeaveWarning && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "1rem",
          }}
        >
          <div style={{ backgroundColor: "#FFF", borderRadius: "12px", padding: "clamp(1.5rem, 4vw, 2rem)", maxWidth: "500px", width: "100%", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
            <h3 style={{ fontSize: "clamp(1.25rem, 3vw, 1.5rem)", fontWeight: 700, color: "#0A0A0A", marginBottom: "1rem" }}>Seite verlassen?</h3>
            <p style={{ fontSize: "clamp(0.9rem, 2vw, 1rem)", color: "#7A7A7A", marginBottom: "1.5rem", lineHeight: 1.6 }}>
              Sie haben die Daten noch nicht gespeichert. Beim Verlassen der Seite gehen diese verloren.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => { setShowLeaveWarning(false); setPendingNavigation(null) }}
                style={{ padding: "clamp(0.875rem, 2.5vw, 1rem) clamp(1.5rem, 4vw, 2rem)", backgroundColor: "#FFF", color: "#0A0A0A", border: "1px solid #CDCDCD", borderRadius: "8px", fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)", fontWeight: 600, cursor: "pointer" }}
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLeaveWarning(false)
                  if (pendingNavigation) router.push(pendingNavigation)
                  setPendingNavigation(null)
                }}
                style={{ padding: "clamp(0.875rem, 2.5vw, 1rem) clamp(1.5rem, 4vw, 2rem)", backgroundColor: "#24c598", color: "#FFF", border: "none", borderRadius: "8px", fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)", fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 12px rgba(36, 197, 152, 0.3)" }}
              >
                Trotzdem verlassen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
