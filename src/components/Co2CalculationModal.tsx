"use client"

import { useState, useEffect, useRef } from "react"
import type { Co2EmissionsValue, Co2EmissionsCalculationMeta } from "@/lib/co2-emissions-types"
import CountrySelect from "@/components/CountrySelect"
import { useNotification } from "@/components/NotificationProvider"

export type Co2Scope = "material" | "transport" | "packaging" | "combination"

interface Co2CalculationModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (value: Co2EmissionsValue) => void
  loading?: boolean
  /** Vorauswahl Material aus Pflichtfeld „Material“, falls vorhanden */
  initialMaterialFromDpp?: string
}

const SCOPE_OPTIONS: { value: Co2Scope; label: string }[] = [
  { value: "material", label: "Material des Produkts" },
  { value: "transport", label: "Transport des Produkts" },
  { value: "packaging", label: "Verpackung des Produkts" },
  { value: "combination", label: "Alles zusammen (Material, Transport und Verpackung)" },
]

const DISCLAIMER =
  "Dies ist eine Schätzung auf Basis von Standard-Emissionsfaktoren. Der Economic Operator bleibt für die Angabe verantwortlich."

/** Option von API: activity_id (Climatiq) + Anzeigelabel */
export type Co2Option = { activity_id: string; label: string }

/** Mappt Pflichtfeld-Text (z. B. „Baumwolle“, „Holz“) auf Climatiq-kompatible activity_id für Vorauswahl. */
function mapMaterialFieldValueToActivityId(text: string | null | undefined): string {
  if (!text || typeof text !== "string") return ""
  const t = text.toLowerCase().trim()
  if (t.includes("baumwolle") || t.includes("cotton") || t.includes("textil") || t.includes("stoff") || t.includes("textile")) return "textiles-type_textiles"
  if (t.includes("holz") || t.includes("wood")) return "wood_products"
  if (t.includes("kunststoff") || t.includes("plastic") || t.includes("plastik")) return "plastic_materials"
  if (t.includes("metall") || t.includes("metal") || t.includes("stahl")) return "metals-type_steel_section"
  if (t.includes("papier") || t.includes("karton") || t.includes("paper") || t.includes("pappe")) return "paper_and_cardboard"
  if (t.includes("glas") || t.includes("glass")) return "glass"
  if (t.includes("leder") || t.includes("leather")) return "leather"
  if (t.includes("keramik") || t.includes("ceramic")) return "ceramic"
  return ""
}

/**
 * CO₂-Berechnung Modal – Wizard wie Supplier Invitation.
 * Schritt 1: Berechnungsbereich, Schritt 2: Eingaben, Schritt 3: API-Aufruf, Schritt 4: Ergebnis + „Ergebnis übernehmen“.
 */
export default function Co2CalculationModal({
  isOpen,
  onClose,
  onApply,
  loading = false,
  initialMaterialFromDpp,
}: Co2CalculationModalProps) {
  const { showNotification } = useNotification()
  const initialMappedMaterialRef = useRef<string | null>(null)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [scope, setScope] = useState<Co2Scope | "">("")
  const [weightKg, setWeightKg] = useState<string>("")
  const [country, setCountry] = useState<string>("")
  const [transportMode, setTransportMode] = useState<string>("")
  const [materialType, setMaterialType] = useState<string>("")
  const [packagingType, setPackagingType] = useState<string>("")
  const [materialOptions, setMaterialOptions] = useState<Co2Option[]>([])
  const [packagingOptions, setPackagingOptions] = useState<Co2Option[]>([])
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    co2e: number
    unit: string
    breakdown?: { material?: number; transport?: number; packaging?: number }
  } | null>(null)

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = ""
      return
    }
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading && !calculating) onClose()
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, loading, calculating, onClose])

  // Beim Öffnen: Optionen von API laden (Climatiq-kompatibel), State zurücksetzen
  useEffect(() => {
    if (!isOpen) return
    setStep(1)
    setScope("")
    setWeightKg("")
    setCountry("")
    setTransportMode("")
    setPackagingType("")
    setCalculating(false)
    setError(null)
    setResult(null)
    setOptionsLoading(true)
    fetch("/api/app/co2/options", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Optionen nicht geladen"))))
      .then((data: { materials?: Co2Option[]; packaging?: Co2Option[] }) => {
        const materials = data.materials ?? []
        const packaging = data.packaging ?? []
        const initialLabel = initialMaterialFromDpp?.trim()
        const activityIdForInitial = initialLabel ? mapMaterialFieldValueToActivityId(initialLabel) : ""
        let finalMaterials = materials
        let selectedMaterialId = ""
        if (initialLabel && activityIdForInitial) {
          const hasExactMatch = materials.some((m) => m.label.trim().toLowerCase() === initialLabel.toLowerCase())
          if (!hasExactMatch) {
            finalMaterials = [{ activity_id: activityIdForInitial, label: initialLabel }, ...materials]
          }
          selectedMaterialId = activityIdForInitial
        }
        setMaterialOptions(finalMaterials)
        setPackagingOptions(packaging)
        setMaterialType(selectedMaterialId)
        initialMappedMaterialRef.current = selectedMaterialId || null
      })
      .catch(() => {
        setMaterialOptions([])
        setPackagingOptions([])
      })
      .finally(() => setOptionsLoading(false))
  }, [isOpen, initialMaterialFromDpp])

  if (!isOpen) return null

  const handleCalculate = async () => {
    setError(null)
    const w = weightKg.trim() ? parseFloat(weightKg) : 0
    if (w <= 0 || Number.isNaN(w)) {
      setError("Bitte geben Sie ein gültiges Gewicht (kg) ein.")
      return
    }
    setCalculating(true)
    try {
      const res = await fetch("/api/app/co2/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: scope || "material",
          weight_kg: w,
          country: country || undefined,
          transport_mode: transportMode || undefined,
          material_type: materialType || undefined,
          packaging_type: packagingType || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Berechnung fehlgeschlagen")
      }
      setResult({
        co2e: data.co2e ?? 0,
        unit: data.co2e_unit ?? "kg",
        breakdown: data.breakdown,
      })
      setStep(3)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Netzwerkfehler")
    } finally {
      setCalculating(false)
    }
  }

  const handleApply = () => {
    if (!result) return
    const value: Co2EmissionsValue = {
      value: result.co2e,
      unit: "kgCO2e",
      source: "calculated",
      methodology: "Climatiq estimate",
      calculationMeta: {
        provider: "climatiq",
        breakdown: result.breakdown,
      } as Co2EmissionsCalculationMeta,
    }
    onApply(value)
    onClose()
  }

  const canProceedStep1 = scope !== ""
  const canProceedStep2 = weightKg.trim() !== "" && !Number.isNaN(parseFloat(weightKg)) && parseFloat(weightKg) > 0

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "1rem",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading && !calculating) onClose()
      }}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          padding: "2rem",
          maxWidth: "560px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
          <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0A0A0A", margin: "0 0 0.25rem 0" }}>
              CO₂ automatisch berechnen
            </h2>
            <p style={{ fontSize: "0.95rem", color: "#7A7A7A", margin: 0 }}>
              Schritt {step} von 3
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading || calculating}
            style={{
              padding: "0.5rem",
              backgroundColor: "transparent",
              border: "none",
              cursor: loading || calculating ? "not-allowed" : "pointer",
              fontSize: "1.5rem",
              color: "#7A7A7A",
              lineHeight: 1,
              borderRadius: "4px",
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "0.75rem 1rem",
              marginBottom: "1rem",
              backgroundColor: "#FFF5F5",
              border: "1px solid #FCA5A5",
              borderRadius: "8px",
              color: "#991B1B",
              fontSize: "0.9rem",
            }}
          >
            {error}
          </div>
        )}

        {/* Step 1: Scope */}
        {step === 1 && (
          <div>
            <p style={{ fontSize: "0.9rem", color: "#7A7A7A", marginBottom: "1rem", lineHeight: 1.5 }}>
              Wovon soll der CO₂-Fußabdruck geschätzt werden? Wählen Sie den Bereich, der zu Ihrem Produkt passt.
            </p>
            <label style={{ display: "block", fontSize: "0.95rem", fontWeight: "600", color: "#0A0A0A", marginBottom: "0.75rem" }}>
              Bereich auswählen
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {SCOPE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem",
                    border: `1px solid ${scope === opt.value ? "#24c598" : "#E5E5E5"}`,
                    borderRadius: "8px",
                    cursor: "pointer",
                    backgroundColor: scope === opt.value ? "#F0FDF9" : "#FFF",
                  }}
                >
                  <input
                    type="radio"
                    name="scope"
                    value={opt.value}
                    checked={scope === opt.value}
                    onChange={() => setScope(opt.value)}
                  />
                  <span style={{ fontSize: "0.95rem" }}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Inputs */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <p style={{ fontSize: "0.9rem", color: "#7A7A7A", marginBottom: "0", lineHeight: 1.5 }}>
              Geben Sie die Angaben zu Ihrem Produkt ein. Die Schätzung basiert auf diesen Werten.
            </p>

            <div>
              <label htmlFor="co2-weight" style={{ display: "block", fontSize: "0.95rem", fontWeight: "600", color: "#0A0A0A", marginBottom: "0.5rem" }}>
                Gewicht des Produkts (in kg) *
              </label>
              <p style={{ fontSize: "0.8rem", color: "#7A7A7A", marginTop: "0.25rem", marginBottom: "0.5rem", lineHeight: 1.4 }}>
                Das Gesamtgewicht Ihres Produkts in Kilogramm – also das fertige Produkt, so wie es z. B. an den Kunden geht. Relevant für die CO₂-Schätzung von Material und Transport.
              </p>
              <input
                id="co2-weight"
                type="number"
                min={0}
                step="any"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="z. B. 2,5"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #CDCDCD",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {(scope === "material" || scope === "combination") && (
              <div>
                <label htmlFor="co2-material" style={{ display: "block", fontSize: "0.95rem", fontWeight: "600", color: "#0A0A0A", marginBottom: "0.5rem" }}>
                  Material des Produkts
                </label>
                <p style={{ fontSize: "0.8rem", color: "#7A7A7A", marginTop: "0.25rem", marginBottom: "0.5rem", lineHeight: 1.4 }}>
                  Wichtigster Werkstoff, aus dem Ihr Produkt überwiegend besteht. Die Schätzung nutzt materialtypische Emissionsfaktoren.
                </p>
                {initialMaterialFromDpp && (
                  <p style={{ fontSize: "0.8rem", color: "#24c598", marginBottom: "0.5rem", lineHeight: 1.4 }}>
                    Vorauswahl aus dem Pflichtfeld „Material“: „{initialMaterialFromDpp}“. Sie können die Angabe bei Bedarf anpassen.
                  </p>
                )}
                <select
                  id="co2-material"
                  value={materialType}
                  onChange={(e) => {
                    const newValue = e.target.value
                    setMaterialType(newValue)
                    if (initialMappedMaterialRef.current != null && newValue !== "" && newValue !== initialMappedMaterialRef.current) {
                      showNotification(
                        "Die gewählte Materialart weicht von der Angabe im Pflichtfeld „Material“ ab. Bitte prüfen Sie die Konsistenz.",
                        "info"
                      )
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #CDCDCD",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    backgroundColor: "#FFF",
                  }}
                >
                  <option value="">Bitte wählen</option>
                  {materialOptions.map((opt) => (
                    <option key={`${opt.activity_id}-${opt.label}`} value={opt.activity_id}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}

            {(scope === "packaging" || scope === "combination") && (
              <div>
                <label htmlFor="co2-packaging" style={{ display: "block", fontSize: "0.95rem", fontWeight: "600", color: "#0A0A0A", marginBottom: "0.5rem" }}>
                  Art der Verpackung
                </label>
                <p style={{ fontSize: "0.8rem", color: "#7A7A7A", marginTop: "0.25rem", marginBottom: "0.5rem", lineHeight: 1.4 }}>
                  Überwiegendes Verpackungsmaterial – z. B. Karton, Kunststoff oder Gemisch. Fließt in die CO₂-Schätzung der Verpackung ein.
                </p>
                <select
                  id="co2-packaging"
                  value={packagingType}
                  disabled={optionsLoading}
                  onChange={(e) => setPackagingType(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #CDCDCD",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    backgroundColor: "#FFF",
                  }}
                >
                  <option value="">Bitte wählen</option>
                  {packagingOptions.map((opt) => (
                    <option key={`${opt.activity_id}-${opt.label}`} value={opt.activity_id}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}

            {(scope === "transport" || scope === "combination") && (
              <div>
                <label htmlFor="co2-transport" style={{ display: "block", fontSize: "0.95rem", fontWeight: "600", color: "#0A0A0A", marginBottom: "0.5rem" }}>
                  Mit welchem Verkehrsmittel wird das Produkt transportiert?
                </label>
                <p style={{ fontSize: "0.8rem", color: "#7A7A7A", marginTop: "0.25rem", marginBottom: "0.5rem", lineHeight: 1.4 }}>
                  Gemeint ist der typische Transportweg – z. B. vom Hersteller zu Ihnen oder bis zum Kunden (Lkw, Bahn, Schiff oder Flugzeug).
                </p>
                <select
                  id="co2-transport"
                  value={transportMode}
                  onChange={(e) => setTransportMode(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #CDCDCD",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    backgroundColor: "#FFF",
                  }}
                >
                  <option value="">Bitte wählen</option>
                  <option value="road">Lkw / Straße</option>
                  <option value="rail">Bahn / Schiene</option>
                  <option value="sea">Schiff / Seefracht</option>
                  <option value="air">Flugzeug / Luftfracht</option>
                </select>
              </div>
            )}

            <div>
              <CountrySelect
                id="co2-country"
                label="Herkunftsland des Produkts (optional)"
                value={country}
                onChange={(code) => setCountry(code)}
                required={false}
                helperText="Das Land, in dem das Produkt hergestellt wird – also wo es produziert wird, nicht wo es ankommt. Wird für länderspezifische Schätzwerte genutzt (z. B. Strommix)."
              />
            </div>
          </div>
        )}

        {/* Step 2: Loading (während API-Aufruf) */}
        {step === 2 && calculating && (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p style={{ fontSize: "1rem", color: "#0A0A0A", marginBottom: "1rem" }}>Berechnung läuft…</p>
            <div style={{ width: "40px", height: "40px", border: "3px solid #E5E5E5", borderTopColor: "#24c598", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
          </div>
        )}

        {/* Step 3: Result */}
        {step === 3 && result && (
          <div>
            <div
              style={{
                padding: "1.25rem",
                backgroundColor: "#F0FDF9",
                border: "1px solid #24c598",
                borderRadius: "12px",
                marginBottom: "1rem",
              }}
            >
              <div style={{ fontSize: "0.9rem", color: "#7A7A7A", marginBottom: "0.25rem" }}>Geschätzte CO₂e</div>
              <div style={{ fontSize: "1.75rem", fontWeight: "700", color: "#0A0A0A" }}>
                {result.co2e.toFixed(2)} {result.unit} CO₂e
              </div>
              {result.breakdown && (result.breakdown.material !== undefined || result.breakdown.transport !== undefined || result.breakdown.packaging !== undefined) && (
                <div style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "#7A7A7A" }}>
                  {result.breakdown.material != null && <div>Material: {result.breakdown.material.toFixed(2)} kg CO₂e</div>}
                  {result.breakdown.transport != null && <div>Transport: {result.breakdown.transport.toFixed(2)} kg CO₂e</div>}
                  {result.breakdown.packaging != null && <div>Verpackung: {result.breakdown.packaging.toFixed(2)} kg CO₂e</div>}
                </div>
              )}
            </div>
            <p style={{ fontSize: "0.85rem", color: "#7A7A7A", marginBottom: "1rem" }}>
              {DISCLAIMER}
            </p>
            <button
              type="button"
              onClick={handleApply}
              style={{
                width: "100%",
                padding: "0.75rem 1.5rem",
                fontSize: "1rem",
                fontWeight: "600",
                color: "#FFF",
                backgroundColor: "#24c598",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Ergebnis übernehmen
            </button>
          </div>
        )}

        {/* Footer: Back / Next / Calculate */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem", gap: "1rem" }}>
          <div>
            {step > 1 && step < 3 && (
              <button
                type="button"
                onClick={() => setStep((step - 1) as 1 | 2)}
                disabled={calculating}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  color: "#0A0A0A",
                  backgroundColor: "transparent",
                  border: "1px solid #CDCDCD",
                  borderRadius: "8px",
                  cursor: calculating ? "not-allowed" : "pointer",
                }}
              >
                Zurück
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            {step === 1 && (
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                style={{
                  padding: "0.5rem 1.25rem",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  color: "#FFF",
                  backgroundColor: canProceedStep1 ? "#24c598" : "#CDCDCD",
                  border: "none",
                  borderRadius: "8px",
                  cursor: canProceedStep1 ? "pointer" : "not-allowed",
                }}
              >
                Weiter
              </button>
            )}
            {step === 2 && (
              <button
                type="button"
                onClick={handleCalculate}
                disabled={!canProceedStep2 || calculating}
                style={{
                  padding: "0.5rem 1.25rem",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  color: "#FFF",
                  backgroundColor: canProceedStep2 && !calculating ? "#24c598" : "#CDCDCD",
                  border: "none",
                  borderRadius: "8px",
                  cursor: canProceedStep2 && !calculating ? "pointer" : "not-allowed",
                }}
              >
                {calculating ? "Berechne…" : "Berechnen"}
              </button>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
