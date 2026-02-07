"use client"

import { useState, useEffect } from "react"
import TemplateBlockField from "@/components/TemplateBlockField"
import RepeatableFieldGroup from "@/components/RepeatableFieldGroup"
import type { Co2EmissionsValue } from "@/lib/co2-emissions-types"

// Connection/Network Icon für Block-Ebene (Datenherkunft / Verantwortung)
// Minimalistisches Link/Network-Icon: "Dieser Block ist extern angebunden"
const ConnectionIcon = ({ size = 17, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, display: "block" }}
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
)

// Accordion-Sektion Komponente (kopiert aus DppEditor für Wiederverwendbarkeit)
function AccordionSection({
  title,
  isOpen,
  onToggle,
  children,
  alwaysOpen = false,
  statusBadge
}: {
  title: string | React.ReactNode
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
  alwaysOpen?: boolean
  statusBadge?: React.ReactNode
}) {
  return (
    <div style={{
      backgroundColor: "#FFFFFF",
      borderRadius: "12px",
      border: "1px solid #CDCDCD",
      marginBottom: "1.5rem",
      overflow: "visible",
      position: "relative"
    }}>
      <button
        type="button"
        onClick={alwaysOpen ? undefined : onToggle}
        disabled={alwaysOpen}
        style={{
          width: "100%",
          padding: "clamp(1rem, 3vw, 1.25rem)",
          backgroundColor: alwaysOpen ? "#F5F5F5" : "transparent",
          border: "none",
          borderBottom: isOpen && !alwaysOpen ? "1px solid #CDCDCD" : (alwaysOpen ? "1px solid #CDCDCD" : "none"),
          borderRadius: alwaysOpen ? "12px 12px 0 0" : "12px 12px 0 0",
          cursor: alwaysOpen ? "default" : "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          textAlign: "left",
          position: "relative"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 0 }}>
          {typeof title === "string" ? (
            <h2 style={{
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              fontWeight: "600",
              color: "#0A0A0A",
              margin: 0
            }}>
              {title}
            </h2>
          ) : (
            title
          )}
          {statusBadge}
        </div>
        {!alwaysOpen && (
          <span style={{
            fontSize: "1.5rem",
            color: "#7A7A7A",
            transition: "transform 0.2s",
            flexShrink: 0,
            marginLeft: "1rem"
          }}>
            {isOpen ? "−" : "+"}
          </span>
        )}
      </button>
      {(isOpen || alwaysOpen) && (
        <div style={{
          padding: "clamp(1.5rem, 4vw, 2rem)",
          position: "relative",
          zIndex: 1,
          backgroundColor: alwaysOpen ? "#FFFFFF" : "transparent",
          borderRadius: alwaysOpen ? "0 0 12px 12px" : "0"
        }}>
          {children}
        </div>
      )}
    </div>
  )
}

interface TemplateBlocksSectionProps {
  template: {
    id: string
    name: string
    blocks: Array<{
      id: string
      name: string
      order: number
      // ENTFERNT: supplierConfig - wird jetzt pro DPP konfiguriert
      fields: Array<{
        id: string
        label: string
        key: string
        type: string
        required: boolean
        config: any
        order: number
        isRepeatable?: boolean
      }>
    }>
  }
  dppId: string | null
  media: Array<{
    id: string
    fileName: string
    fileType: string
    storageUrl: string
    blockId?: string | null
    fieldId?: string | null
  }>
  onMediaChange: () => void
  // ENTFERNT: onInviteSupplier - wird jetzt über globales Modal gehandhabt
  blockSupplierConfigs?: Record<string, {
    enabled: boolean
    mode: "input" | "declaration" | null
    allowedRoles?: string[]
  }> // Supplier-Configs pro Block (von DPP)
  /** Wenn false, wird die Zuweisung im Block-Header nicht angezeigt (konfigurierbar unter /super-admin/pricing) */
  supplierInvitationEnabled?: boolean
  fieldInstances?: Record<string, Array<{
    instanceId: string
    values: Record<string, string | string[] | Co2EmissionsValue>
  }>> // Instanzen für wiederholbare Felder (fieldKey -> instances[])
  onFieldInstancesChange?: (fieldKey: string, instances: Array<{
    instanceId: string
    values: Record<string, string | string[] | Co2EmissionsValue>
  }>) => void
  fieldValues?: Record<string, string | string[] | Co2EmissionsValue> // Werte für normale Felder (fieldKey -> value)
  onFieldValueChange?: (fieldKey: string, value: string | string[] | Co2EmissionsValue) => void // Callback für Feldwert-Änderungen
  onSupplierConfigUpdate?: (blockId: string, enabled: boolean, mode?: "input" | "declaration") => void
  onEditSupplierConfig?: (blockId: string) => void // Öffnet Modal für Bearbeitung/Anzeige
  pendingFiles?: Array<{
    id: string
    file: File
    preview?: string
    blockId?: string
    fieldId?: string
  }> // Pending files für neue DPPs
  onPendingFileAdd?: (file: { id: string; file: File; preview?: string; blockId?: string; fieldId?: string }) => void
  onPendingFileRemove?: (fileId: string) => void
  supplierFieldInfo?: Record<string, { partnerRole: string; confirmed?: boolean; mode?: "input" | "declaration" }> // fieldKey -> supplierInfo
  onSupplierInfoConfirm?: (fieldKey: string) => void // Callback für Bestätigung
  /** Premium: CO₂-Berechnung für co2_emissions-Felder anzeigen (nur im Entwurf) */
  co2CalculationEnabled?: boolean
  /** Read-only/veröffentlicht: kein Berechnen-Button, kein Premium-Hinweis */
  readOnly?: boolean
  /** Öffnet CO₂-Berechnungs-Modal für dieses Feld (fieldKey) */
  onOpenCo2Calculate?: (fieldKey: string) => void
}

/**
 * Rendert Template-Blöcke dynamisch
 */
export default function TemplateBlocksSection({
  template,
  dppId,
  media,
  onMediaChange,
  blockSupplierConfigs = {},
  supplierInvitationEnabled = true,
  fieldInstances = {},
  onFieldInstancesChange,
  fieldValues = {},
  onFieldValueChange,
  onSupplierConfigUpdate,
  onEditSupplierConfig,
  pendingFiles = [],
  onPendingFileAdd,
  onPendingFileRemove,
  supplierFieldInfo = {},
  onSupplierInfoConfirm,
  co2CalculationEnabled = false,
  readOnly = false,
  onOpenCo2Calculate,
}: TemplateBlocksSectionProps) {
  // Debug: Log fieldValues beim ersten Render
  console.log("[TemplateBlocksSection] Component mounted with fieldValues:", Object.keys(fieldValues).length, "fields", Object.keys(fieldValues))
  console.log("[TemplateBlocksSection] supplierFieldInfo received:", supplierFieldInfo, "keys:", Object.keys(supplierFieldInfo))
  
  // WICHTIG: Bidirektionales Mapping zwischen englischen Keys (aus fieldValues State) und Template-Feld-Keys
  // 
  // Problem: 
  // - Neue Templates haben englische Keys (name, description, etc.) dank generateKeyFromLabel
  // - Alte Templates haben deutsche Keys (produktname, beschreibung, etc.)
  // - fieldValues State verwendet englische Keys (für Konsistenz mit DPP-Spalten)
  // - Content wird mit Template-Keys gespeichert (field.key)
  //
  // Lösung:
  // - Beim Laden: mappe englische Keys → Template-Keys (für Anzeige)
  // - Beim Speichern: Template-Keys werden direkt verwendet (onFieldValueChange bekommt field.key)
  // - Der fieldValues State speichert beide: englische Keys UND Template-Keys für Kompatibilität
  
  const createFieldKeyMapping = () => {
    // Mapping: englischer Key → Template-Feld-Key
    const englishToTemplate: Record<string, string> = {}
    // Reverse Mapping: Template-Feld-Key → englischer Key
    const templateToEnglish: Record<string, string> = {}
    
    // Standard-Mapping für bekannte Felder (unabhängig von Template)
    const standardMapping: Record<string, string> = {
      "name": "name", // Fallback: wenn Template auch "name" verwendet
      "description": "description",
      "sku": "sku",
      "gtin": "gtin",
      "brand": "brand",
      "countryOfOrigin": "countryOfOrigin"
    }
    
    // Durchsuche alle Template-Felder und erstelle Mapping basierend auf Labels UND Keys
    template.blocks.forEach(block => {
      block.fields.forEach(field => {
        const labelLower = field.label.toLowerCase()
        const fieldKeyLower = field.key.toLowerCase()
        
        // Prüfe ob Template-Key bereits englisch ist (neue Templates)
        // Dann sind keine Mappings nötig
        if (standardMapping[fieldKeyLower]) {
          englishToTemplate[fieldKeyLower] = field.key
          templateToEnglish[field.key] = fieldKeyLower
          return
        }
        
        // Mapping für alte deutsche Keys basierend auf Labels
        if (labelLower.includes("produktname") || (labelLower.includes("name") && !labelLower.includes("firma"))) {
          englishToTemplate["name"] = field.key
          templateToEnglish[field.key] = "name"
        }
        if (labelLower.includes("beschreibung") || labelLower.includes("description")) {
          englishToTemplate["description"] = field.key
          templateToEnglish[field.key] = "description"
        }
        if (labelLower.includes("herstellungsland") || labelLower.includes("country")) {
          englishToTemplate["countryOfOrigin"] = field.key
          templateToEnglish[field.key] = "countryOfOrigin"
        }
        if (labelLower.includes("marke") || labelLower.includes("hersteller") || labelLower.includes("brand")) {
          englishToTemplate["brand"] = field.key
          templateToEnglish[field.key] = "brand"
        }
        if (labelLower.includes("gtin") || labelLower.includes("ean") || fieldKeyLower.includes("ean")) {
          englishToTemplate["gtin"] = field.key
          templateToEnglish[field.key] = "gtin"
        }
        // sku bleibt gleich
        if (fieldKeyLower === "sku") {
          englishToTemplate["sku"] = field.key
          templateToEnglish[field.key] = "sku"
        }
      })
    })
    
    return { englishToTemplate, templateToEnglish }
  }
  
  const { englishToTemplate, templateToEnglish } = createFieldKeyMapping()
  
  // Mappe fieldValues zu Template-Keys (für Anzeige)
  // WICHTIG: fieldValues können sowohl englische Keys (aus Fallback) als auch Template-Keys (aus dppContent) enthalten
  // Wir müssen beide Fälle unterstützen:
  // 1. Alte DPPs mit englischen Keys (aus Fallback) → mappe zu Template-Keys
  // 2. Neue DPPs mit Template-Keys (direkt aus dppContent) → verwende direkt
  const mappedFieldValues = Object.keys(fieldValues).reduce((acc, key) => {
    // Prüfe zuerst, ob dieser Key bereits ein Template-Key ist (direkter Match)
    const isTemplateKey = template.blocks.some(block => 
      block.fields.some(field => field.key === key)
    )
    
    if (isTemplateKey) {
      // Key ist bereits ein Template-Key → verwende direkt
      acc[key] = fieldValues[key]
    } else {
      // Key ist ein englischer Key → mappe zu Template-Key
      const templateKey = englishToTemplate[key]
      if (templateKey) {
        acc[templateKey] = fieldValues[key]
      } else {
        // Kein Mapping gefunden → versuche Key direkt (könnte auch Template-Key sein, der noch nicht im Template ist)
        acc[key] = fieldValues[key]
      }
    }
    return acc
  }, {} as Record<string, string | string[]>)
  
  // WICHTIG: Erweitere mappedFieldValues um Reverse-Mapping (Template-Key → englischer Key)
  // Dies stellt sicher, dass Werte auch gefunden werden, wenn sie mit englischen Keys gespeichert sind
  // aber das Template deutsche Keys verwendet
  Object.keys(templateToEnglish).forEach(templateKey => {
    const englishKey = templateToEnglish[templateKey]
    // Wenn Template-Key noch nicht in mappedFieldValues, aber englischer Key in fieldValues
    if (!mappedFieldValues[templateKey] && fieldValues[englishKey]) {
      mappedFieldValues[templateKey] = fieldValues[englishKey]
    }
  })
  
  // DEBUG: Zeige welche Werte gemappt wurden
  if (Object.keys(fieldValues).length > 0) {
    console.log("[TemplateBlocksSection] Mapping fieldValues:")
    console.log("  Original keys:", Object.keys(fieldValues))
    console.log("  Mapped keys:", Object.keys(mappedFieldValues))
    console.log("  Template field keys:", template.blocks.flatMap(b => b.fields.map(f => f.key)))
  }
  
  // State für Accordion-Öffnung (erster Block immer offen)
  const [openBlocks, setOpenBlocks] = useState<Set<string>>(
    new Set([template.blocks[0]?.id])
  )

  // Mobile: nur "Zugewiesen" anzeigen, Blocktitel vollständig sichtbar
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)")
    const handler = () => setIsMobile(mql.matches)
    handler()
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [])

  const toggleBlock = (blockId: string) => {
    setOpenBlocks(prev => {
      const next = new Set(prev)
      if (next.has(blockId)) {
        next.delete(blockId)
      } else {
        next.add(blockId)
      }
      return next
    })
  }

  // Find supplier-enabled blocks (basierend auf DPP-Config, nicht Template-Config)
  const supplierEnabledBlocks = template.blocks.filter(
    block => blockSupplierConfigs[block.id]?.enabled === true
  )

  return (
    <>
      {/* ENTFERNT: Alter "Lieferant einladen" Button - wird jetzt über globalen SupplierInviteButton gehandhabt */}

      {template.blocks.map((block) => {
        const isOpen = openBlocks.has(block.id)
        const isFirstBlock = block.order === 0
        const isSupplierEnabled = blockSupplierConfigs[block.id]?.enabled === true
        const supplierConfig = blockSupplierConfigs[block.id]
        
        return (
          <AccordionSection
            key={block.id}
            title={
              <div 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "1.5rem", 
                  width: "100%",
                  position: "relative"
                }}
              >
                <span style={{ 
                  flex: 1, 
                  minWidth: 0,
                  fontSize: "clamp(0.9rem, 2vw, 1rem)",
                  fontWeight: "600",
                  color: "#0A0A0A",
                  wordBreak: "break-word"
                }}>
                  {block.name}
                </span>
                {/* Block-Ebene: Zuweisung nur wenn supplier_invitation unter /super-admin/pricing aktiviert */}
                {!isFirstBlock && supplierInvitationEnabled && onSupplierConfigUpdate && (
                  <>
                    {isSupplierEnabled ? (
                      // Zustand B: Verantwortung zugewiesen - Klick entfernt die Verantwortung (span statt button, da innerhalb Accordion-Button)
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (onSupplierConfigUpdate) {
                            onSupplierConfigUpdate(block.id, false, "input")
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            e.stopPropagation()
                            if (onSupplierConfigUpdate) {
                              onSupplierConfigUpdate(block.id, false, "input")
                            }
                          }
                        }}
                        title="Verantwortung entfernen - Klick entfernt die Zuweisung"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.25rem 0.5rem",
                          backgroundColor: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "#24c598",
                          fontSize: "0.813rem",
                          fontWeight: "400",
                          marginLeft: "1.5rem",
                          transition: "color 0.2s ease",
                          flexShrink: 0
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#DC2626"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "#24c598"
                        }}
                      >
                        <ConnectionIcon size={17} color="currentColor" />
                        <span style={{ opacity: 0.85 }}>{isMobile ? "Zugewiesen" : "Verantwortung zugewiesen"}</span>
                      </span>
                    ) : (
                      // Zustand A: Keine externe Verantwortung (span statt button, da innerhalb Accordion-Button)
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (onSupplierConfigUpdate) {
                            onSupplierConfigUpdate(block.id, true, "input")
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            e.stopPropagation()
                            if (onSupplierConfigUpdate) {
                              onSupplierConfigUpdate(block.id, true, "input")
                            }
                          }
                        }}
                        title="Verantwortung zuweisen\nExterne Partner können ausgewählte Informationen ergänzen oder bestätigen."
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "0.25rem",
                          backgroundColor: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "#7A7A7A",
                          marginLeft: "1.5rem",
                          marginRight: "1rem",
                          transition: "color 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#24c598"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "#7A7A7A"
                        }}
                      >
                        <ConnectionIcon size={17} color="currentColor" />
                      </span>
                    )}
                  </>
                )}
              </div>
            }
            isOpen={isOpen}
            onToggle={() => toggleBlock(block.id)}
            alwaysOpen={isFirstBlock}
          >
            {(() => {
              const isBasisdatenBlock = block.name && (block.name.includes("Basis") || block.name.includes("Produktdaten"))
              const firstImageFieldKey = block.fields.find(
                (f) => f.type === "file-image" || (f.type && String(f.type).startsWith("file-image"))
              )?.key
              return block.fields.map((field) => {
              // Wiederholbare Felder: Verwende RepeatableFieldGroup
              if (field.isRepeatable) {
                return (
                  <RepeatableFieldGroup
                    key={field.id}
                    field={field}
                    blockId={block.id}
                    dppId={dppId}
                    instances={fieldInstances[field.key] || []}
                    onInstancesChange={(instances) => {
                      if (onFieldInstancesChange) {
                        onFieldInstancesChange(field.key, instances)
                      }
                    }}
                    media={media}
                    onMediaChange={onMediaChange}
                  />
                )
              }
              
              // Normale Felder: Verwende TemplateBlockField
              // Verwende mappedFieldValues für Anzeige (unterstützt sowohl englische als auch deutsche Keys)
              // WICHTIG: onFieldValueChange wird mit field.key aufgerufen (Template-Key, nicht englischer Key)
              // Der DppEditor muss dann beide Keys im fieldValues State speichern
              // Prüfe zuerst mappedFieldValues (korrekt gemappt), dann fieldValues direkt (falls Key bereits Template-Key ist)
              const fieldValue = mappedFieldValues[field.key] || fieldValues[field.key] || (field.type === "boolean" ? "false" : "")
              
              // Debug-Log für alle Felder, um Mapping-Probleme zu identifizieren
              const supplierInfo = supplierFieldInfo[field.key] || null
              console.log(`[TemplateBlocksSection] Rendering field ${field.key} (${field.label}): supplierInfo:`, supplierInfo, "available keys:", Object.keys(supplierFieldInfo))
              if (fieldValue && fieldValue !== "" && fieldValue !== "false") {
                console.log(`[TemplateBlocksSection] Rendering field ${field.key} (${field.label}): found value:`, fieldValue, "| mapped:", !!mappedFieldValues[field.key], "| direct:", !!fieldValues[field.key])
              } else {
                // Auch Log wenn kein Wert gefunden (für Debugging)
                console.log(`[TemplateBlocksSection] Rendering field ${field.key} (${field.label}): NO VALUE | mapped:`, !!mappedFieldValues[field.key], "| direct:", !!fieldValues[field.key])
              }
              return (
                <TemplateBlockField
                  key={field.id}
                  field={field}
                  blockId={block.id}
                  blockName={block.name}
                  dppId={dppId}
                  value={fieldValue}
                  onChange={(value) => {
                    console.log("[TemplateBlocksSection] Field value changed:", field.key, "(" + field.label + ")", "=", value)
                    if (onFieldValueChange) {
                      onFieldValueChange(field.key, value)
                    } else {
                      console.warn("[TemplateBlocksSection] onFieldValueChange is not defined!")
                    }
                  }}
                  media={media}
                  onMediaChange={onMediaChange}
                  pendingFiles={pendingFiles}
                  onPendingFileAdd={onPendingFileAdd}
                  onPendingFileRemove={onPendingFileRemove}
                  supplierInfo={supplierInfo}
                  onSupplierInfoConfirm={onSupplierInfoConfirm}
                  readOnly={readOnly}
                  showCo2CalculateButton={field.type === "co2_emissions" && co2CalculationEnabled && !readOnly && !!onOpenCo2Calculate}
                  onOpenCo2Calculate={field.type === "co2_emissions" && onOpenCo2Calculate ? () => onOpenCo2Calculate(field.key) : undefined}
                  showCo2PremiumHint={field.type === "co2_emissions" && !co2CalculationEnabled && !readOnly}
                  showHeroHint={isBasisdatenBlock && firstImageFieldKey === field.key}
                />
              )
            })
            })()}
          </AccordionSection>
        )
      })}
    </>
  )
}

