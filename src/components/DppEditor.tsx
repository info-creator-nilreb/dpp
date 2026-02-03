"use client"

import { useState, useEffect, Fragment, useRef } from "react"
import { useRouter } from "next/navigation"
import CountrySelect from "@/components/CountrySelect"
import { useNotification } from "@/components/NotificationProvider"
import InputField from "@/components/InputField"
// StickySaveBar removed - using EditorHeader instead
import { useCapabilities } from "@/hooks/useCapabilities"
import { DPP_SECTIONS } from "@/lib/dpp-sections"
import { useAutoSave } from "@/hooks/useAutoSave"

interface PendingFile {
  id: string
  file: File
  preview?: string
}

interface DppMedia {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  storageUrl: string
  uploadedAt: Date
}

interface Dpp {
  id: string
  name: string
  description: string | null
  category: string
  sku: string | null
  gtin: string | null
  brand: string | null
  countryOfOrigin: string | null
  materials: string | null
  materialSource: string | null
  careInstructions: string | null
  isRepairable: string | null
  sparePartsAvailable: string | null
  lifespan: string | null
  conformityDeclaration: string | null
  disposalInfo: string | null
  takebackOffered: string | null
  takebackContact: string | null
  secondLifeInfo: string | null
  status: string
  organizationId: string
  createdAt: Date
  updatedAt: Date
  organization: {
    id: string
    name: string
  }
  media: DppMedia[]
}

interface DppEditorProps {
  dpp: Dpp
  isNew?: boolean
  onUnsavedChangesChange?: (hasChanges: boolean) => void
  availableCategories?: Array<{ categoryKey: string; label: string }>
  // Optional: If provided, DppEditor won't render StickySaveBar and will use these handlers instead
  onSave?: () => Promise<void>
  onPublish?: () => Promise<void>
  // Optional: Status callbacks for header
  onStatusChange?: (status: "idle" | "saving" | "saved" | "publishing" | "error") => void
  onLastSavedChange?: (date: Date | null) => void
  onErrorChange?: (error: string | null) => void
  // CRITICAL: Callback to update global dpp state after auto-save
  // This ensures tab switches don't reset the draft state
  onDppUpdate?: (updatedDpp: Dpp) => void
}

/**
 * Accordion-Sektion Komponente
 */
function AccordionSection({
  title,
  isOpen,
  onToggle,
  children,
  alwaysOpen = false,
  statusBadge
}: {
  title: string
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
          borderBottom: isOpen && !alwaysOpen ? "1px solid #CDCDCD" : "none",
          cursor: alwaysOpen ? "default" : "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          textAlign: "left",
          borderRadius: "12px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <h2 style={{
            fontSize: "clamp(1.1rem, 3vw, 1.25rem)",
            fontWeight: "700",
            color: "#0A0A0A",
            margin: 0
          }}>
            {title}
          </h2>
          {statusBadge}
        </div>
        {!alwaysOpen && (
          <span style={{
            fontSize: "1.5rem",
            color: "#7A7A7A",
            transition: "transform 0.2s"
          }}>
            {isOpen ? "−" : "+"}
          </span>
        )}
      </button>
      {(isOpen || alwaysOpen) && (
        <div style={{
          padding: "clamp(1.5rem, 4vw, 2rem)",
          position: "relative",
          zIndex: 1
        }}>
          {children}
        </div>
      )}
    </div>
  )
}

/**
 * DPP One-Pager Editor
 * 
 * Strukturiert in 5 fachliche Sektionen (ESPR-orientiert):
 * 1. Basis- & Produktdaten (immer offen, Pflichtfelder)
 * 2. Materialien & Zusammensetzung (einklappbar)
 * 3. Nutzung, Pflege & Lebensdauer (einklappbar)
 * 4. Rechtliches & Konformität (einklappbar)
 * 5. Rücknahme & Second Life (einklappbar)
 */
export default function DppEditor({ 
  dpp: initialDpp, 
  isNew = false, 
  onUnsavedChangesChange, 
  availableCategories: propCategories,
  onSave: externalOnSave,
  onPublish: externalOnPublish,
  onStatusChange,
  onLastSavedChange,
  onErrorChange,
  onDppUpdate
}: DppEditorProps) {
  const router = useRouter()
  const { showNotification } = useNotification()
  
  // State für alle Felder
  const [dpp, setDpp] = useState(initialDpp)
  // CRITICAL: Lokaler Edit-State für Inputs - nur bei dpp.id-Wechsel synchronisieren
  const [name, setName] = useState(initialDpp.name || "")
  const [description, setDescription] = useState(initialDpp.description || "")
  const [category, setCategory] = useState<string>(initialDpp.category || "")
  const [sku, setSku] = useState(initialDpp.sku || "")
  const [gtin, setGtin] = useState(initialDpp.gtin || "")
  const [brand, setBrand] = useState(initialDpp.brand || "")
  const [countryOfOrigin, setCountryOfOrigin] = useState(initialDpp.countryOfOrigin || "")
  const [materials, setMaterials] = useState(initialDpp.materials || "")
  const [materialSource, setMaterialSource] = useState(initialDpp.materialSource || "")
  const [careInstructions, setCareInstructions] = useState(initialDpp.careInstructions || "")
  const [isRepairable, setIsRepairable] = useState(initialDpp.isRepairable || "")
  const [sparePartsAvailable, setSparePartsAvailable] = useState(initialDpp.sparePartsAvailable || "")
  const [lifespan, setLifespan] = useState(initialDpp.lifespan || "")
  const [conformityDeclaration, setConformityDeclaration] = useState(initialDpp.conformityDeclaration || "")
  const [disposalInfo, setDisposalInfo] = useState(initialDpp.disposalInfo || "")
  const [takebackOffered, setTakebackOffered] = useState(initialDpp.takebackOffered || "")
  const [takebackContact, setTakebackContact] = useState(initialDpp.takebackContact || "")
  const [secondLifeInfo, setSecondLifeInfo] = useState(initialDpp.secondLifeInfo || "")
  const [availableCategories, setAvailableCategories] = useState<Array<{ value: string; label: string }>>([])
  const [previousCategory, setPreviousCategory] = useState<string>(initialDpp.category || "")
  const [showCategoryChangeWarning, setShowCategoryChangeWarning] = useState(false)
  const [pendingCategoryChange, setPendingCategoryChange] = useState<string | null>(null)

  // Accordion State (Sektion 1 immer offen)
  const [section2Open, setSection2Open] = useState(false)
  const [section3Open, setSection3Open] = useState(false)
  const [section4Open, setSection4Open] = useState(false)
  const [section5Open, setSection5Open] = useState(false)
  
  // Data Request Form State
  const [dataEntryMode, setDataEntryMode] = useState<"manual" | "request">("manual")
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [requestEmail, setRequestEmail] = useState("")
  const [requestRole, setRequestRole] = useState("")
  const [requestSections, setRequestSections] = useState<string[]>([])
  const [requestMessage, setRequestMessage] = useState("")
  const [requestLoading, setRequestLoading] = useState(false)
  const [dataRequests, setDataRequests] = useState<Array<{
    id: string
    email: string
    partnerRole: string
    sections: string[]
    status: string
    expiresAt: string
    submittedAt: string | null
    createdAt: string
  }>>([])
  
  // Save Status (for header)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "publishing" | "error">("idle")
  const [lastSaved, setLastSaved] = useState<Date | null>(isNew ? null : initialDpp.updatedAt)
  const [saveError, setSaveError] = useState<string | null>(null)
  
  // Track if any field has changed (for auto-save)
  const hasChangesRef = useRef(false)
  const initialDppRef = useRef(initialDpp)
  // CRITICAL: Track if user is typing to prevent state resets during typing
  // This prevents characters from being cut off during auto-save
  const isUserTypingRef = useRef(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Subscription Context für Publishing-Capability
  const [subscriptionCanPublish, setSubscriptionCanPublish] = useState<boolean>(true)
  
  // Load subscription context
  useEffect(() => {
    async function loadSubscriptionContext() {
      try {
        const response = await fetch("/api/subscription/context")
        if (response.ok) {
          const data = await response.json()
          setSubscriptionCanPublish(data.canPublish ?? false)
        }
      } catch (error) {
        console.error("Error loading subscription context:", error)
        // Default to false on error (fail-safe)
        setSubscriptionCanPublish(false)
      }
    }
    loadSubscriptionContext()
  }, [])

  // CRITICAL: Synchronize local states with initialDpp prop
  // This ensures tab switches don't reset the draft state
  // SINGLE SOURCE OF TRUTH: Only update when initialDpp actually changes (not on every render)
  // Pattern: Use a ref to track the last synced version to prevent unnecessary resets
  const lastSyncedDppRef = useRef<string | null>(null)
  
  useEffect(() => {
    // Only sync if:
    // 1. DPP ID changed (new DPP loaded)
    // 2. OR initialDpp was updated from outside (e.g. after save in another component)
    // BUT: Don't sync if we have unsaved local changes (preserve draft)
    // Handle updatedAt as Date, string, or undefined
    const updatedAtValue = initialDpp.updatedAt instanceof Date 
      ? initialDpp.updatedAt.getTime() 
      : typeof initialDpp.updatedAt === 'string' 
        ? new Date(initialDpp.updatedAt).getTime() 
        : (initialDpp.updatedAt as any)?.getTime?.() || 0
    const dppKey = `${initialDpp.id}-${updatedAtValue}`
    
    // Skip if this is the same DPP we already synced (prevents reset on tab switch)
    if (lastSyncedDppRef.current === dppKey) {
      return
    }
    
    // CRITICAL: Synchronization logic
    // - Sync if DPP ID changed (new DPP loaded)
    // - Sync if we don't have unsaved changes (all changes saved)
    // - Don't sync if user is actively typing (prevents characters from being cut off)
    // - Don't sync if we already synced this exact version (prevents unnecessary resets)
    const dppIdChanged = initialDpp.id !== lastSyncedDppRef.current?.split('-')[0]
    const shouldSync = dppIdChanged || (!hasChangesRef.current && !isUserTypingRef.current)
    
    if (shouldSync) {
      // CRITICAL: Update dpp state only when syncing (e.g. on mount or DPP ID change)
      // Inputs write directly to dpp via onDppUpdate, so we only sync from props when needed
      initialDppRef.current = initialDpp
      setDpp(initialDpp)
      
      // Update lastSyncedDppRef to mark this version as synced
      // This prevents unnecessary re-syncing of the same version
      lastSyncedDppRef.current = dppKey
      
      // Reset hasChangesRef when syncing (no unsaved changes at sync time)
      hasChangesRef.current = false
    }
  }, [initialDpp.id, initialDpp.updatedAt, initialDpp]) // Sync when DPP changes

  // Load data requests
  useEffect(() => {
    if (isNew) return

    async function loadDataRequests() {
      try {
        const response = await fetch(`/api/app/dpp/${dpp.id}/data-requests`)
        if (response.ok) {
          const data = await response.json()
          setDataRequests(data.requests || [])
        }
      } catch (error) {
        console.error("Error loading data requests:", error)
      }
    }
    loadDataRequests()
  }, [dpp.id, isNew])
  
  // Warnung beim Verlassen (nur für neue DPPs ohne Speicherung)
  const [showLeaveWarning, setShowLeaveWarning] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  
  // Pending Files für neue DPPs (zwischengespeichert bis zum Speichern)
  // MUST be declared before hasUnsavedChanges and useEffect hooks that use it
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  
  // Prüft ob ungespeicherte Änderungen vorliegen (nur für neue DPPs)
  const hasUnsavedChanges = (): boolean => {
    if (!isNew || lastSaved !== null) return false // Nur für neue DPPs, die noch nicht gespeichert wurden
    
    // Prüfe ob mindestens ein Feld befüllt wurde (außer leere Strings)
    const hasName = name.trim().length > 0
    const hasSku = sku.trim().length > 0
    const hasBrand = brand.trim().length > 0
    const hasCountry = countryOfOrigin.trim().length > 0
    const hasDescription = description && description.trim().length > 0
    const hasMaterials = materials && materials.trim().length > 0
    const hasFiles = pendingFiles.length > 0
    
    return hasName || hasSku || hasBrand || hasCountry || hasDescription || hasMaterials || hasFiles
  }
  
  // Informiere Parent-Komponente über ungespeicherte Änderungen
  useEffect(() => {
    if (isNew && onUnsavedChangesChange) {
      onUnsavedChangesChange(hasUnsavedChanges())
    }
  }, [isNew, name, sku, brand, countryOfOrigin, description, materials, pendingFiles, lastSaved, onUnsavedChangesChange])
  
  // Browser beforeunload Event (für Browser-Navigation)
  useEffect(() => {
    if (!isNew || !hasUnsavedChanges()) return
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = "" // Chrome benötigt returnValue
      return "" // Safari
    }
    
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isNew, name, sku, brand, countryOfOrigin, description, materials, pendingFiles, lastSaved])
  
  // Navigation-Handler: Zeigt Warnung bevor navigiert wird
  const handleNavigationAttempt = (targetUrl: string): void => {
    if (hasUnsavedChanges()) {
      setPendingNavigation(targetUrl)
      setShowLeaveWarning(true)
    } else {
      router.push(targetUrl)
    }
  }
  
  // Prefill-Hints: Welche Felder wurden aus KI-Vorprüfung übernommen
  const [prefilledFields, setPrefilledFields] = useState<Set<string>>(new Set())
  // Welche Felder wurden vom Benutzer bearbeitet (Hints verschwinden dann)
  const [editedFields, setEditedFields] = useState<Set<string>>(new Set())

  // Handler für Kategorienwechsel (mit Reset-Logik)
  const handleCategoryChange = (newCategory: string) => {
    setPreviousCategory(category)
    setCategory(newCategory)
    
    // Reset-Logik: Zurücksetzen aller Template-abhängigen Felder
    // (Die Felder werden beim nächsten Template-Laden neu validiert)
    // Für jetzt: Nur die Kategorie setzen, Validierung erfolgt beim Speichern
  }

  // Lade verfügbare Kategorien beim Mount
  useEffect(() => {
    // Wenn Kategorien als Prop übergeben wurden, verwende diese
    if (propCategories && propCategories.length > 0) {
      const categoryOptions = propCategories.map(cat => ({
        value: cat.categoryKey,
        label: cat.label
      }))
      setAvailableCategories(categoryOptions)
      // Setze erste verfügbare Kategorie als Standard für neue DPPs, wenn noch keine gesetzt ist
      if (isNew && (!category || category === "") && categoryOptions.length > 0) {
        setCategory(categoryOptions[0].value)
        setPreviousCategory(categoryOptions[0].value)
      }
      return
    }

    // Sonst lade Kategorien über API
    async function loadCategories() {
      try {
        const response = await fetch("/api/app/categories")
        if (response.ok) {
          const data = await response.json()
          const categoryOptions = (data.categories || []).map((cat: { categoryKey: string; label: string }) => ({
            value: cat.categoryKey,
            label: cat.label
          }))
          setAvailableCategories(categoryOptions)
          // Setze erste verfügbare Kategorie als Standard für neue DPPs, wenn noch keine gesetzt ist
          if (isNew && (!category || category === "") && categoryOptions.length > 0) {
            setCategory(categoryOptions[0].value)
            setPreviousCategory(categoryOptions[0].value)
          }
        } else {
          console.error("Error loading categories: API returned", response.status)
          // Kein Fallback mehr - wenn keine Kategorien geladen werden können, bleibt die Liste leer
          setAvailableCategories([])
        }
      } catch (error) {
        console.error("Error loading categories:", error)
        // Kein Fallback mehr - wenn keine Kategorien geladen werden können, bleibt die Liste leer
        setAvailableCategories([])
      }
    }
    loadCategories()
  }, [isNew, propCategories])
  
  // Initialisiere previousCategory beim Mount
  useEffect(() => {
    if (!isNew && initialDpp.category) {
      setPreviousCategory(initialDpp.category)
    }
  }, [isNew, initialDpp.category])
  
  // Lade Prefill-Flags aus sessionStorage (nur für neue DPPs)
  useEffect(() => {
    if (isNew) {
      try {
        const prefilledFieldsStr = sessionStorage.getItem("preflightPrefilledFields")
        if (prefilledFieldsStr) {
          const fields = JSON.parse(prefilledFieldsStr)
          setPrefilledFields(new Set(fields))
          // Clear after reading
          sessionStorage.removeItem("preflightPrefilledFields")
        }
      } catch (error) {
        console.error("Error loading prefilled fields:", error)
        sessionStorage.removeItem("preflightPrefilledFields")
      }
    }
  }, [isNew])
  
  // Helper: Prüft ob Feld Prefill-Hint zeigen soll
  const shouldShowPrefillHint = (fieldName: string): boolean => {
    if (!isNew || !prefilledFields.has(fieldName) || editedFields.has(fieldName)) {
      return false
    }
    
    // Check current value
    let currentValue: string | null = null
    switch (fieldName) {
      case "name": currentValue = name; break
      case "description": currentValue = description; break
      case "sku": currentValue = sku; break
      case "gtin": currentValue = gtin; break
      case "brand": currentValue = brand; break
      case "countryOfOrigin": currentValue = countryOfOrigin; break
      case "materials": currentValue = materials; break
      case "materialSource": currentValue = materialSource; break
      case "careInstructions": currentValue = careInstructions; break
      case "lifespan": currentValue = lifespan; break
      case "conformityDeclaration": currentValue = conformityDeclaration; break
      case "disposalInfo": currentValue = disposalInfo; break
      case "takebackContact": currentValue = takebackContact; break
      case "secondLifeInfo": currentValue = secondLifeInfo; break
    }
    
    return currentValue !== null && currentValue.trim().length > 0
  }
  
  // Helper: Markiert Feld als bearbeitet
  const markFieldAsEdited = (fieldName: string) => {
    if (prefilledFields.has(fieldName) && !editedFields.has(fieldName)) {
      setEditedFields(prev => new Set(prev).add(fieldName))
    }
  }

  // Helper: Aktualisiert den zentralen dpp-State und triggert Auto-Save
  // MINIMAL-INVASIV: Ergänzt den bestehenden Mechanismus, ohne andere Logik zu ändern
  const updateDppDraft = (patch: Partial<Dpp>) => {
    setDpp(prev => ({ ...prev, ...patch }))
    hasChangesRef.current = true
    // scheduleSave wird automatisch durch useEffect([dpp]) getriggert
  }

  // Medien werden jetzt über File-Felder in Blöcken verwaltet - keine zentrale Medienverwaltung mehr

  // Auto-Save: Save DPP data as draft
  // CRITICAL: Server is write-only - never reload from server response
  // Client draft (dpp) is the single source of truth
  const performAutoSave = async () => {
    // Skip if no changes (but always save new DPPs)
    if (!hasChangesRef.current && !isNew) {
      return
    }
    
    // CRITICAL: Read from dpp state (single source of truth)
    // All inputs write directly to dpp via onDppUpdate
    setSaveStatus("saving")
    setSaveError(null)
    onStatusChange?.("saving")
    
    try {
      if (isNew) {
        // Neuer DPP: Erstellen - read from local state
        const payload = {
          name: name || "",
          description: description || "",
          category: category || "",
          sku: sku || "",
          gtin: gtin || "",
          brand: brand || "",
          countryOfOrigin: countryOfOrigin || "",
          materials: materials || "",
          materialSource: materialSource || "",
          careInstructions: careInstructions || "",
          isRepairable: isRepairable || "",
          sparePartsAvailable: sparePartsAvailable || "",
          lifespan: lifespan || "",
          conformityDeclaration: conformityDeclaration || "",
          disposalInfo: disposalInfo || "",
          takebackOffered: takebackOffered || "",
          takebackContact: takebackContact || "",
          secondLifeInfo: secondLifeInfo || "",
          organizationId: dpp.organizationId
        }
        
        const response = await fetch("/api/app/dpp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          let errorData
          try {
            errorData = await response.json()
          } catch (parseError) {
            const errorMsg = `Fehler beim Erstellen (Status: ${response.status})`
            setSaveError(errorMsg)
            setSaveStatus("error")
            showNotification(errorMsg, "error")
            return
          }

          const errorMessage = errorData.error === "NO_ORGANIZATION" 
            ? "Sie benötigen eine Organisation. Bitte erstellen Sie zuerst eine Organisation in Ihren Kontoeinstellungen."
            : errorData.error || "Fehler beim Erstellen"
          
          setSaveError(errorMessage)
          setSaveStatus("error")
          showNotification(errorMessage, "error")
          return
        }

        let data
        try {
          data = await response.json()
        } catch (parseError) {
          const errorMsg = "Fehler beim Verarbeiten der Antwort"
          setSaveError(errorMsg)
          setSaveStatus("error")
          showNotification(errorMsg, "error")
          return
        }

        if (!data?.dpp?.id) {
          const errorMsg = "Fehler: DPP-ID fehlt in der Antwort"
          setSaveError(errorMsg)
          setSaveStatus("error")
          showNotification(errorMsg, "error")
          return
        }
        
        // Erfolgreich gespeichert - Update local state mit neuer DPP-ID
        const newDppId = data.dpp.id
        setDpp(prev => ({ ...prev, id: newDppId, status: "DRAFT" }))
        
        // NOTE: Media uploads are now handled as first-class field types within blocks.
        // No implicit media upload at the end of save. Media fields in template blocks
        // handle their own uploads when users interact with them.
        
        // IDENTICAL to DppContentTabV2: Always update lastSaved and propagate status
        const savedDate = new Date()
        setLastSaved(savedDate)
        setSaveStatus("saved")
        onStatusChange?.("saved")
        onLastSavedChange?.(savedDate) // ALWAYS propagate (same as DppContentTabV2)
        hasChangesRef.current = false
        // No notification for auto-save (silent)
        
        // Weiterleitung zur Edit-Seite (nicht zur Liste)
        // Verwende replace, damit Browser-History sauber bleibt
        router.replace(`/app/dpps/${newDppId}`)
      } else {
        // Bestehender DPP: Aktualisieren
        const response = await fetch(`/api/app/dpp/${dpp.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            description,
            category,
            sku,
            gtin,
            brand,
            countryOfOrigin,
            materials,
            materialSource,
            careInstructions,
            isRepairable,
            sparePartsAvailable,
            lifespan,
            conformityDeclaration,
            disposalInfo,
            takebackOffered,
            takebackContact,
            secondLifeInfo
          })
        })

        if (response.ok) {
          // CRITICAL: Server is write-only during editing
          // Do NOT reload or update state from server response
          // The client draft (dpp) is the single source of truth
          
          // Success: Only update status feedback
          const savedDate = new Date()
          setLastSaved(savedDate)
          setSaveStatus("saved")
          onStatusChange?.("saved")
          onLastSavedChange?.(savedDate)
          
          // Reset change tracking
          hasChangesRef.current = false
          
          // CRITICAL: Update initialDppRef with current local states to make them the new reference point
          // This ensures that future changes are compared against the saved state, not the original load
          initialDppRef.current = {
            ...initialDppRef.current,
            name: name || "",
            description: description || "",
            category: category || "",
            sku: sku || "",
            gtin: gtin || "",
            brand: brand || "",
            countryOfOrigin: countryOfOrigin || "",
            materials: materials || "",
            materialSource: materialSource || "",
            careInstructions: careInstructions || "",
            isRepairable: isRepairable || "",
            sparePartsAvailable: sparePartsAvailable || "",
            lifespan: lifespan || "",
            conformityDeclaration: conformityDeclaration || "",
            disposalInfo: disposalInfo || "",
            takebackOffered: takebackOffered || "",
            takebackContact: takebackContact || "",
            secondLifeInfo: secondLifeInfo || ""
          }
          
          // No notification for auto-save (silent)
          // No state updates - client draft remains unchanged
          // No reload - tab switches work with draft state
        } else {
          let errorData
          try {
            errorData = await response.json()
          } catch {
            errorData = { error: "Fehler beim Speichern" }
          }
          const errorMsg = errorData.error || "Fehler beim Speichern"
          setSaveError(errorMsg)
          setSaveStatus("error")
          showNotification(errorMsg, "error")
        }
      }
    } catch (error) {
      const errorMsg = "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut."
      setSaveError(errorMsg)
      setSaveStatus("error")
      onStatusChange?.("error")
      onErrorChange?.(errorMsg)
      // Show error notification for auto-save failures
      showNotification("Auto-Save fehlgeschlagen. Bitte versuchen Sie es erneut.", "error")
    }
  }

  // Manual save handler (for external calls, e.g. from header)
  // This is used when the header needs to trigger a save (e.g. retry after error)
  const handleSave = async () => {
    if (externalOnSave) {
      await externalOnSave()
      return
    }
    await performAutoSave()
  }

  // Auto-Save: Track field changes and trigger save
  // IDENTICAL to DppContentTabV2 for consistent UX across all tabs
  // Single Source of Truth: Same debounce, same behavior, same status updates
  const { scheduleSave } = useAutoSave({
    onSave: performAutoSave,
    enabled: !isNew || (isNew && dpp.id !== "new"), // Only auto-save if DPP exists
    debounceMs: 500, // IDENTICAL to DppContentTabV2 - 500ms catches every change including single characters
    onStatusChange: (status) => {
      // Update local state
      if (status === "saving") {
        setSaveStatus("saving")
      } else if (status === "saved") {
        setSaveStatus("saved")
      } else if (status === "error") {
        setSaveStatus("error")
      }
      // ALWAYS propagate to parent (same as DppContentTabV2)
      onStatusChange?.(status)
    }
  })

  // CRITICAL: Wrapper function for onChange handlers
  // This marks user as typing and prevents state resets during typing
  // Prevents characters from being cut off during auto-save
  const createTypingAwareHandler = (setter: (value: string) => void) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value
      setter(value)
      
      // Mark that user is typing
      isUserTypingRef.current = true
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Reset typing flag after user stops typing for 1500ms
      // CRITICAL: Longer timeout to prevent last character from being cut off
      typingTimeoutRef.current = setTimeout(() => {
        isUserTypingRef.current = false
      }, 1500) // Longer timeout to ensure last character is saved
    }
  }
  
  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  // CRITICAL: Change detection - inputs set hasChangesRef and trigger auto-save
  // Inputs call onDppUpdate (updates dpp) and set hasChangesRef.current = true
  // This effect triggers scheduleSave when dpp changes and hasChangesRef is true
  useEffect(() => {
    if (isNew && dpp.id === "new") return // Skip auto-save for brand new DPPs
    if (!hasChangesRef.current) return // Only save if there are changes
    
    // Trigger auto-save when dpp changes and hasChangesRef is true
    scheduleSave()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dpp]) // React to dpp changes (triggered by onDppUpdate in inputs)

  // Veröffentliche DPP als neue Version
  const handlePublish = async () => {
    // If external handler provided, use it
    if (externalOnPublish) {
      await externalOnPublish()
      return
    }
    
    if (!name.trim()) {
      showNotification("Produktname ist erforderlich für die Veröffentlichung", "error")
      return
    }

    setSaveStatus("publishing")
    setSaveError(null)
    onStatusChange?.("publishing")
    
    try {
      let dppIdToPublish = dpp.id

      // Wenn neu: Erst erstellen, dann veröffentlichen
      if (isNew) {
        const createResponse = await fetch("/api/app/dpp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            description,
            category,
            sku,
            gtin,
            brand,
            countryOfOrigin,
            materials,
            materialSource,
            careInstructions,
            isRepairable,
            sparePartsAvailable,
            lifespan,
            conformityDeclaration,
            disposalInfo,
            takebackOffered,
            takebackContact,
            secondLifeInfo,
            organizationId: dpp.organizationId
          })
        })

        if (!createResponse.ok) {
          const errorData = await createResponse.json()
          const errorMsg = errorData.error || "Fehler beim Erstellen"
          setSaveError(errorMsg)
          setSaveStatus("error")
          showNotification(errorMsg, "error")
          return
        }

        const createData = await createResponse.json()
        dppIdToPublish = createData.dpp.id
        
        // Lade zwischengespeicherte Dateien hoch
        if (pendingFiles.length > 0) {
          try {
            const uploadPromises = pendingFiles.map(async (pendingFile) => {
              const formData = new FormData()
              formData.append("file", pendingFile.file)
              
              const uploadResponse = await fetch(`/api/app/dpp/${dppIdToPublish}/media`, {
                method: "POST",
                body: formData
              })
              
              if (!uploadResponse.ok) {
                console.error(`Fehler beim Hochladen von ${pendingFile.file.name}`)
              }
            })
            
            await Promise.all(uploadPromises)
            setPendingFiles([])
          } catch (uploadError) {
            console.error("Fehler beim Hochladen der zwischengespeicherten Dateien:", uploadError)
          }
        }
      } else {
        // Bestehender DPP: Erst speichern
        const saveResponse = await fetch(`/api/app/dpp/${dpp.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            description,
            category,
            sku,
            gtin,
            brand,
            countryOfOrigin,
            materials,
            materialSource,
            careInstructions,
            isRepairable,
            sparePartsAvailable,
            lifespan,
            conformityDeclaration,
            disposalInfo,
            takebackOffered,
            takebackContact,
            secondLifeInfo
          })
        })

        if (!saveResponse.ok) {
          const errorData = await saveResponse.json()
          const errorMsg = errorData.error || "Fehler beim Speichern"
          setSaveError(errorMsg)
          setSaveStatus("error")
          showNotification(errorMsg, "error")
          return
        }
      }

      // Dann veröffentlichen
      const publishResponse = await fetch(`/api/app/dpp/${dppIdToPublish}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })

      if (publishResponse.ok) {
        const data = await publishResponse.json()
        showNotification(`Produktpass erfolgreich als Version ${data.version.version} veröffentlicht!`, "success")
        
        // Redirect zu Version-Page
        router.replace(`/app/dpps/${dppIdToPublish}/versions/${data.version.version}`)
      } else {
        let errorData
        try {
          errorData = await publishResponse.json()
        } catch {
          errorData = { error: "Fehler beim Veröffentlichen" }
        }
        const errorMessage = errorData.error || errorData.details || "Fehler beim Veröffentlichen"
        setSaveError(errorMessage)
        setSaveStatus("error")
        showNotification(errorMessage, "error")
      }
    } catch (error) {
      const errorMsg = "Ein Fehler ist aufgetreten"
      setSaveError(errorMsg)
      setSaveStatus("error")
      showNotification(errorMsg, "error")
    }
  }

  // Select-Feld Komponente
  const SelectField = ({ id, label, value, onChange, options, required = false, disabled = false }: {
    id: string
    label: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
    options: Array<{ value: string; label: string }>
    required?: boolean
    disabled?: boolean
  }) => (
    <div style={{ marginBottom: "1.5rem" }}>
      <label htmlFor={id} style={{
        display: "block",
        fontSize: "clamp(0.9rem, 2vw, 1rem)",
        fontWeight: "600",
        color: "#0A0A0A",
        marginBottom: "0.5rem"
      }}>
        {label} {required && <span style={{ color: "#24c598" }}>*</span>}
      </label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        style={{
          width: "100%",
          padding: "0.6875rem 2.5rem 0.6875rem clamp(0.75rem, 2vw, 1rem)",
          fontSize: "clamp(0.9rem, 2vw, 1rem)",
          border: "1px solid #CDCDCD",
          borderRadius: "8px",
          backgroundColor: disabled ? "#F5F5F5" : "#FFFFFF",
          color: disabled ? "#7A7A7A" : "#0A0A0A",
          boxSizing: "border-box",
          minHeight: "42px",
          lineHeight: "1.5",
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%237A7A7A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 0.75rem center",
          backgroundSize: "20px 20px"
        }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )

  // Get capabilities for trial banner
  const { isTrial, trialDaysRemaining, subscription } = useCapabilities(
    dpp.id && dpp.id !== "new" ? dpp.id : ""
  );

  // Helper: Get partner role label
  const getPartnerRoleLabel = (role: string): string => {
    const labels: Record<string, string> = {
      "Material supplier": "Materiallieferant",
      "Manufacturer": "Hersteller",
      "Processor / Finisher": "Verarbeiter / Veredler",
      "Recycler": "Recycler",
      "Other": "Sonstiges",
    }
    return labels[role] || role
  }

  // Helper: Get section label
  const getSectionLabel = (section: string): string => {
    const labels: Record<string, string> = {
      [DPP_SECTIONS.MATERIALS]: "Materialien",
      [DPP_SECTIONS.MATERIAL_SOURCE]: "Materialherkunft",
    }
    return labels[section] || section
  }

  // Helper: Determine status badge for materials section
  const getMaterialsSectionStatusBadge = (): React.ReactNode | undefined => {
    const materialsRequests = dataRequests.filter(req => 
      req.sections.includes(DPP_SECTIONS.MATERIALS) || 
      req.sections.includes(DPP_SECTIONS.MATERIAL_SOURCE)
    )
    
    if (materialsRequests.length === 0) return undefined

    const pendingRequests = materialsRequests.filter(req => req.status === "pending")
    const submittedRequests = materialsRequests.filter(req => req.status === "submitted")

    if (submittedRequests.length > 0) {
      return (
        <span style={{
          padding: "0.25rem 0.75rem",
          backgroundColor: "#E6F7E6",
          color: "#00A651",
          borderRadius: "12px",
          fontSize: "0.75rem",
          fontWeight: "600"
        }}>
          Daten übermittelt
        </span>
      )
    }

    if (pendingRequests.length > 0) {
      return (
        <span style={{
          padding: "0.25rem 0.75rem",
          backgroundColor: "#FFF5E6",
          color: "#B8860B",
          borderRadius: "12px",
          fontSize: "0.75rem",
          fontWeight: "600"
        }}>
          Ausstehend
        </span>
      )
    }

    return undefined
  }

  // Helper: Check if a field is requested (and should be read-only)
  const isFieldRequested = (fieldSection: string): boolean => {
    return dataRequests.some(req => 
      req.status === "pending" && req.sections.includes(fieldSection)
    )
  }

  return (
    <Fragment>
    <div>
      <h1 style={{
        fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
        fontWeight: "700",
        color: "#0A0A0A",
        marginBottom: "1rem"
      }}>
        {isNew ? "Neuer Produktpass" : "Produktpass Editor"}
      </h1>

      {/* 1. Basis- & Produktdaten (immer offen, Pflichtfelder) */}
      <AccordionSection
        title="Basis- & Produktdaten"
        isOpen={true}
        onToggle={() => {}}
        alwaysOpen={true}
      >
        <div>
          <SelectField
            id="dpp-category"
            label="Produktkategorie"
            value={category}
            onChange={(e) => {
              const newCategory = e.target.value
              
              // ESPR: Kategorie ist unveränderbar ab Veröffentlichung
              if (dpp.status === "PUBLISHED") {
                return // Ignoriere Änderungsversuch
              }
              
              // SYNCHRONE lokale State-Update
              setCategory(newCategory)
              if (onDppUpdate) {
                onDppUpdate({ ...dpp, category: newCategory }) // SYNCHRONE globaler State-Update
              }
              updateDppDraft({ category: newCategory }) // MINIMAL-INVASIV: Triggert Auto-Save
              
              // Im Draft: Warnung beim Kategorienwechsel
              if (!isNew && previousCategory && newCategory !== previousCategory) {
                setPendingCategoryChange(newCategory)
                setShowCategoryChangeWarning(true)
              } else {
                handleCategoryChange(newCategory)
              }
            }}
            required
            disabled={
              dpp.status === "PUBLISHED" || // ESPR: Unveränderbar nach Veröffentlichung
              (!isNew && availableCategories.length === 0)
            }
            options={availableCategories}
          />
          {dpp.status === "PUBLISHED" && (
            <p style={{
              fontSize: "0.75rem",
              color: "#7A7A7A",
              marginTop: "0.25rem",
              fontStyle: "italic"
            }}>
              Die Kategorie kann nach Veröffentlichung nicht mehr geändert werden (ESPR-konform).
            </p>
          )}
        </div>
        
        {/* Warnung beim Kategorienwechsel */}
        {showCategoryChangeWarning && (
          <div style={{
            marginTop: "1rem",
            padding: "1rem",
            backgroundColor: "#FFF5F5",
            border: "1px solid #24c598",
            borderRadius: "8px"
          }}>
            <p style={{
              fontSize: "0.95rem",
              color: "#0A0A0A",
              marginBottom: "1rem",
              fontWeight: "600"
            }}>
              ⚠️ Kategorienwechsel bestätigen
            </p>
            <p style={{
              fontSize: "0.875rem",
              color: "#7A7A7A",
              marginBottom: "1rem"
            }}>
              Beim Wechsel der Kategorie können bestehende Eingaben verloren gehen, da ein anderes Template angewendet wird.
            </p>
            <div style={{
              display: "flex",
              gap: "0.75rem"
            }}>
              <button
                type="button"
                onClick={() => {
                  handleCategoryChange(pendingCategoryChange!)
                  setShowCategoryChangeWarning(false)
                  setPendingCategoryChange(null)
                }}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#24c598",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Kategorienwechsel bestätigen
              </button>
              <button
                type="button"
                onClick={() => {
                  setCategory(previousCategory) // Zurücksetzen
                  setShowCategoryChangeWarning(false)
                  setPendingCategoryChange(null)
                }}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#F5F5F5",
                  color: "#0A0A0A",
                  border: "1px solid #CDCDCD",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}
        <InputField
          id="dpp-name"
          label="Produktname"
          value={name}
          onChange={(e) => {
            const value = e.target.value
            setName(value) // SYNCHRONE lokale State-Update
            if (onDppUpdate) {
              onDppUpdate({ ...dpp, name: value }) // SYNCHRONE globaler State-Update
            }
            markFieldAsEdited("name")
            hasChangesRef.current = true
          }}
          required
          helperText={shouldShowPrefillHint("name") ? "Aus KI-Vorprüfung übernommen" : undefined}
        />
        <InputField
          id="dpp-description"
          label="Beschreibung"
          value={description}
          onChange={(e) => {
            const value = e.target.value
            setDescription(value) // SYNCHRONE lokale State-Update
            if (onDppUpdate) {
              onDppUpdate({ ...dpp, description: value }) // SYNCHRONE globaler State-Update
            }
            updateDppDraft({ description: value }) // MINIMAL-INVASIV: Triggert Auto-Save
            markFieldAsEdited("description")
          }}
          rows={4}
          helperText={shouldShowPrefillHint("description") ? "Aus KI-Vorprüfung übernommen" : undefined}
        />
        <InputField
          id="dpp-sku"
          label="SKU / Interne ID"
          value={sku}
          onChange={(e) => {
            const value = e.target.value
            setSku(value) // SYNCHRONE lokale State-Update
            if (onDppUpdate) {
              onDppUpdate({ ...dpp, sku: value }) // SYNCHRONE globaler State-Update
            }
            updateDppDraft({ sku: value }) // MINIMAL-INVASIV: Triggert Auto-Save
            markFieldAsEdited("sku")
          }}
          required
          helperText={shouldShowPrefillHint("sku") ? "Aus KI-Vorprüfung übernommen" : undefined}
        />
        <InputField
          id="dpp-gtin"
          label="GTIN / EAN"
          value={gtin}
          onChange={(e) => {
            const value = e.target.value
            setGtin(value) // SYNCHRONE lokale State-Update
            if (onDppUpdate) {
              onDppUpdate({ ...dpp, gtin: value }) // SYNCHRONE globaler State-Update
            }
            updateDppDraft({ gtin: value }) // MINIMAL-INVASIV: Triggert Auto-Save
            markFieldAsEdited("gtin")
          }}
          helperText={shouldShowPrefillHint("gtin") ? "Aus KI-Vorprüfung übernommen" : undefined}
        />
        <InputField
          id="dpp-brand"
          label="Marke / Hersteller"
          value={brand}
          onChange={(e) => {
            const value = e.target.value
            setBrand(value) // SYNCHRONE lokale State-Update
            if (onDppUpdate) {
              onDppUpdate({ ...dpp, brand: value }) // SYNCHRONE globaler State-Update
            }
            updateDppDraft({ brand: value }) // MINIMAL-INVASIV: Triggert Auto-Save
            markFieldAsEdited("brand")
          }}
          required
          helperText={shouldShowPrefillHint("brand") ? "Aus KI-Vorprüfung übernommen" : undefined}
        />
        <CountrySelect
          id="dpp-country-of-origin"
          label="Herstellungsland"
          value={countryOfOrigin}
          onChange={(value) => {
            setCountryOfOrigin(value) // SYNCHRONE lokale State-Update
            if (onDppUpdate) {
              onDppUpdate({ ...dpp, countryOfOrigin: value }) // SYNCHRONE globaler State-Update
            }
            updateDppDraft({ countryOfOrigin: value }) // MINIMAL-INVASIV: Triggert Auto-Save
            markFieldAsEdited("countryOfOrigin")
          }}
          required
          helperText={shouldShowPrefillHint("countryOfOrigin") ? "Aus KI-Vorprüfung übernommen" : undefined}
        />
      </AccordionSection>

      {/* 2. Materialien & Zusammensetzung */}
      <AccordionSection
        title="Materialien & Zusammensetzung"
        isOpen={section2Open}
        onToggle={() => setSection2Open(!section2Open)}
      >
        {/* Data Entry Mode Selection */}
        <div style={{ marginBottom: "2rem", padding: "1rem", backgroundColor: "#F5F5F5", borderRadius: "8px", border: "none" }}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", marginBottom: "0.75rem" }}>
              <input
                type="radio"
                name="dataEntryMode"
                checked={dataEntryMode === "manual"}
                onChange={() => setDataEntryMode("manual")}
                style={{ width: "18px", height: "18px", cursor: "pointer" }}
              />
              <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "#0A0A0A" }}>
                Daten manuell eingeben
              </span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: isNew ? "not-allowed" : "pointer", opacity: isNew ? 0.6 : 1 }}>
              <input
                type="radio"
                name="dataEntryMode"
                checked={dataEntryMode === "request"}
                onChange={() => !isNew && setDataEntryMode("request")}
                disabled={isNew}
                style={{ width: "18px", height: "18px", cursor: isNew ? "not-allowed" : "pointer" }}
              />
              <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "#0A0A0A" }}>
                Daten von Partner anfordern {isNew && <span style={{ fontSize: "0.85rem", color: "#7A7A7A", fontStyle: "italic" }}>(erst nach Speichern verfügbar)</span>}
              </span>
            </label>
          </div>
          {dataEntryMode === "request" && (
            <p style={{ fontSize: "0.85rem", color: "#7A7A7A", margin: 0, fontStyle: "italic" }}>
              Der Partner erhält einen sicheren Link. Kein Konto erforderlich. Der Zugriff ist auf die ausgewählten Sektionen beschränkt.
            </p>
          )}
        </div>

        {dataEntryMode === "manual" ? (
          <>
            <InputField
              id="dpp-materials"
              label="Materialliste"
              value={materials}
              onChange={(e) => {
                const value = e.target.value
                setMaterials(value) // SYNCHRONE lokale State-Update
                if (onDppUpdate) {
                  onDppUpdate({ ...dpp, materials: value }) // SYNCHRONE globaler State-Update
                }
                updateDppDraft({ materials: value }) // MINIMAL-INVASIV: Triggert Auto-Save
                markFieldAsEdited("materials")
              }}
              rows={4}
              helperText={shouldShowPrefillHint("materials") ? "Aus KI-Vorprüfung übernommen" : undefined}
            />
            <InputField
              id="dpp-material-source"
              label="Datenquelle (z. B. Lieferant)"
              value={materialSource}
              onChange={(e) => {
                const value = e.target.value
                setMaterialSource(value) // SYNCHRONE lokale State-Update
                if (onDppUpdate) {
                  onDppUpdate({ ...dpp, materialSource: value }) // SYNCHRONE globaler State-Update
                }
                updateDppDraft({ materialSource: value }) // MINIMAL-INVASIV: Triggert Auto-Save
                markFieldAsEdited("materialSource")
              }}
              helperText={shouldShowPrefillHint("materialSource") ? "Aus KI-Vorprüfung übernommen" : undefined}
            />
          </>
        ) : (
          <div style={{ marginTop: "1rem" }}>
            {isNew ? (
              <div style={{
                padding: "1rem",
                backgroundColor: "#FFF5F5",
                border: "1px solid #FEB2B2",
                borderRadius: "8px",
                marginBottom: "1.5rem",
              }}>
                <p style={{ color: "#C53030", margin: 0, fontSize: "0.9rem" }}>
                  Bitte speichern Sie den DPP zuerst, bevor Sie Daten von Partnern anfordern können.
                </p>
              </div>
            ) : (
              <>
            <SelectField
              id="request-partner-role"
              label="Partner-Rolle"
              value={requestRole}
              onChange={(e) => setRequestRole(e.target.value)}
              options={[
                { value: "", label: "Bitte wählen" },
                { value: "Material supplier", label: "Materiallieferant" },
                { value: "Manufacturer", label: "Hersteller" },
                { value: "Processor / Finisher", label: "Verarbeiter / Veredler" },
                { value: "Recycler", label: "Recycler" },
                { value: "Other", label: "Sonstiges" },
              ]}
              required
            />
            <InputField
              id="request-email"
              label="E-Mail-Adresse"
              type="email"
              value={requestEmail}
              onChange={(e) => setRequestEmail(e.target.value)}
              required
            />
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{
                display: "block",
                fontSize: "0.95rem",
                fontWeight: "600",
                color: "#0A0A0A",
                marginBottom: "0.5rem"
              }}>
                Sektionen für Zugriff <span style={{ color: "#24c598" }}>*</span>
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[
                  { value: DPP_SECTIONS.MATERIALS, label: "Materialien" },
                  { value: DPP_SECTIONS.MATERIAL_SOURCE, label: "Materialherkunft" },
                ].map((section) => (
                  <label key={section.value} style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={requestSections.includes(section.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setRequestSections([...requestSections, section.value])
                        } else {
                          setRequestSections(requestSections.filter((s) => s !== section.value))
                        }
                      }}
                      style={{ width: "18px", height: "18px", cursor: "pointer" }}
                    />
                    <span style={{ fontSize: "0.9rem", color: "#0A0A0A" }}>{section.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <InputField
              id="request-message"
              label="Optionale Nachricht"
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              rows={3}
            />
            <button
              type="button"
              onClick={async () => {
                if (!requestEmail || !requestRole || requestSections.length === 0) {
                  showNotification("Bitte füllen Sie alle Pflichtfelder aus", "error")
                  return
                }

                setRequestLoading(true)
                try {
                  const response = await fetch(`/api/app/dpp/${dpp.id}/data-requests`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      email: requestEmail,
                      partnerRole: requestRole,
                      sections: requestSections,
                      message: requestMessage || null,
                    }),
                  })

                  const data = await response.json()

                  if (!response.ok) {
                    showNotification(data.error || "Fehler beim Senden der Anfrage", "error")
                    return
                  }

                  showNotification("Datenanfrage erfolgreich gesendet", "success")
                  setDataEntryMode("manual")
                  setRequestEmail("")
                  setRequestRole("")
                  setRequestSections([])
                  setRequestMessage("")
                } catch (error) {
                  showNotification("Fehler beim Senden der Anfrage", "error")
                } finally {
                  setRequestLoading(false)
                }
              }}
              disabled={requestLoading}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: requestLoading ? "#7A7A7A" : "#24c598",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: requestLoading ? "not-allowed" : "pointer",
                width: "100%",
              }}
            >
              {requestLoading ? "Wird gesendet..." : "Datenanfrage senden"}
            </button>
              </>
            )}
          </div>
        )}
      </AccordionSection>

      {/* 3. Nutzung, Pflege & Lebensdauer */}
      <AccordionSection
        title="Nutzung, Pflege & Lebensdauer"
        isOpen={section3Open}
        onToggle={() => setSection3Open(!section3Open)}
      >
        <InputField
          id="dpp-care-instructions"
          label="Pflegehinweise"
          value={careInstructions}
          onChange={(e) => {
            const value = e.target.value
            setCareInstructions(value) // SYNCHRONE lokale State-Update
            if (onDppUpdate) {
              onDppUpdate({ ...dpp, careInstructions: value }) // SYNCHRONE globaler State-Update
            }
            updateDppDraft({ careInstructions: value }) // MINIMAL-INVASIV: Triggert Auto-Save
            markFieldAsEdited("careInstructions")
          }}
          rows={3}
          helperText={shouldShowPrefillHint("careInstructions") ? "Aus KI-Vorprüfung übernommen" : undefined}
        />
        <SelectField
          id="dpp-is-repairable"
          label="Reparierbarkeit"
          value={isRepairable}
          onChange={(e) => {
            const value = e.target.value
            setIsRepairable(value) // SYNCHRONE lokale State-Update
            if (onDppUpdate) {
              onDppUpdate({ ...dpp, isRepairable: value }) // SYNCHRONE globaler State-Update
            }
            updateDppDraft({ isRepairable: value }) // MINIMAL-INVASIV: Triggert Auto-Save
            markFieldAsEdited("isRepairable")
          }}
          options={[
            { value: "", label: "Bitte wählen" },
            { value: "YES", label: "Ja" },
            { value: "NO", label: "Nein" }
          ]}
        />
        <SelectField
          id="dpp-spare-parts"
          label="Ersatzteile verfügbar"
          value={sparePartsAvailable}
          onChange={(e) => {
            const value = e.target.value
            setSparePartsAvailable(value) // SYNCHRONE lokale State-Update
            if (onDppUpdate) {
              onDppUpdate({ ...dpp, sparePartsAvailable: value }) // SYNCHRONE globaler State-Update
            }
            updateDppDraft({ sparePartsAvailable: value }) // MINIMAL-INVASIV: Triggert Auto-Save
            markFieldAsEdited("sparePartsAvailable")
          }}
          options={[
            { value: "", label: "Bitte wählen" },
            { value: "YES", label: "Ja" },
            { value: "NO", label: "Nein" }
          ]}
        />
        <InputField
          id="dpp-lifespan"
          label="Lebensdauer"
          value={lifespan}
          onChange={(e) => {
            const value = e.target.value
            setLifespan(value) // SYNCHRONE lokale State-Update
            if (onDppUpdate) {
              onDppUpdate({ ...dpp, lifespan: value }) // SYNCHRONE globaler State-Update
            }
            updateDppDraft({ lifespan: value }) // MINIMAL-INVASIV: Triggert Auto-Save
            markFieldAsEdited("lifespan")
          }}
          helperText={shouldShowPrefillHint("lifespan") ? "Aus KI-Vorprüfung übernommen" : undefined}
        />
      </AccordionSection>

      {/* 4. Rechtliches & Konformität */}
      <AccordionSection
        title="Rechtliches & Konformität"
        isOpen={section4Open}
        onToggle={() => setSection4Open(!section4Open)}
      >
        <InputField
          id="dpp-conformity"
          label="Konformitätserklärung"
          value={conformityDeclaration}
          onChange={(e) => {
            const value = e.target.value
            setConformityDeclaration(value) // SYNCHRONE lokale State-Update
            if (onDppUpdate) {
              onDppUpdate({ ...dpp, conformityDeclaration: value }) // SYNCHRONE globaler State-Update
            }
            updateDppDraft({ conformityDeclaration: value }) // MINIMAL-INVASIV: Triggert Auto-Save
            markFieldAsEdited("conformityDeclaration")
          }}
          rows={4}
          helperText={shouldShowPrefillHint("conformityDeclaration") ? "Aus KI-Vorprüfung übernommen" : undefined}
        />
        <InputField
          id="dpp-disposal"
          label="Hinweise zu Entsorgung / Recycling"
          value={disposalInfo}
          onChange={(e) => {
            const value = e.target.value
            setDisposalInfo(value) // SYNCHRONE lokale State-Update
            if (onDppUpdate) {
              onDppUpdate({ ...dpp, disposalInfo: value }) // SYNCHRONE globaler State-Update
            }
            updateDppDraft({ disposalInfo: value }) // MINIMAL-INVASIV: Triggert Auto-Save
            markFieldAsEdited("disposalInfo")
          }}
          rows={3}
          helperText={shouldShowPrefillHint("disposalInfo") ? "Aus KI-Vorprüfung übernommen" : undefined}
        />
        <div style={{ marginTop: "1.5rem" }}>
          <p style={{
            fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
            color: "#7A7A7A",
            marginBottom: "1rem"
          }}>
            Zertifikate können über File-Felder in Blöcken hochgeladen werden.
          </p>
        </div>
      </AccordionSection>

      {/* 5. Rücknahme & Second Life */}
      <AccordionSection
        title="Rücknahme & Second Life"
        isOpen={section5Open}
        onToggle={() => setSection5Open(!section5Open)}
      >
        <SelectField
          id="dpp-takeback"
          label="Rücknahme angeboten"
          value={takebackOffered}
          onChange={(e) => {
            const value = e.target.value
            setTakebackOffered(value) // SYNCHRONE lokale State-Update
            if (onDppUpdate) {
              onDppUpdate({ ...dpp, takebackOffered: value }) // SYNCHRONE globaler State-Update
            }
            updateDppDraft({ takebackOffered: value }) // MINIMAL-INVASIV: Triggert Auto-Save
            markFieldAsEdited("takebackOffered")
          }}
          options={[
            { value: "", label: "Bitte wählen" },
            { value: "YES", label: "Ja" },
            { value: "NO", label: "Nein" }
          ]}
        />
        {takebackOffered === "YES" && (
          <InputField
            id="dpp-takeback-contact"
            label="Kontakt / URL"
            value={takebackContact}
            onChange={(e) => {
              const value = e.target.value
              setTakebackContact(value) // SYNCHRONE lokale State-Update
              if (onDppUpdate) {
                onDppUpdate({ ...dpp, takebackContact: value }) // SYNCHRONE globaler State-Update
              }
              updateDppDraft({ takebackContact: value }) // MINIMAL-INVASIV: Triggert Auto-Save
              markFieldAsEdited("takebackContact")
            }}
            helperText={shouldShowPrefillHint("takebackContact") ? "Aus KI-Vorprüfung übernommen" : undefined}
          />
        )}
        <InputField
          id="dpp-second-life"
          label="Second-Life-Informationen"
          value={secondLifeInfo}
          onChange={(e) => {
            const value = e.target.value
            setSecondLifeInfo(value) // SYNCHRONE lokale State-Update
            if (onDppUpdate) {
              onDppUpdate({ ...dpp, secondLifeInfo: value }) // SYNCHRONE globaler State-Update
            }
            updateDppDraft({ secondLifeInfo: value }) // MINIMAL-INVASIV: Triggert Auto-Save
            markFieldAsEdited("secondLifeInfo")
          }}
          rows={3}
          helperText={shouldShowPrefillHint("secondLifeInfo") ? "Aus KI-Vorprüfung übernommen" : undefined}
        />
      </AccordionSection>

      {/* Medien werden jetzt ausschließlich über File-Felder in Blöcken hochgeladen */}

      {/* Bottom padding - only if no external handlers (footer pattern) */}
      {!externalOnSave && !externalOnPublish && (
      <div style={{ height: "100px" }} />
      )}
    </div>

    {/* Sticky Save Bar removed - using EditorHeader in DppEditorContent instead */}
    
    {/* Warnung beim Verlassen (nur für neue DPPs) */}
    {isNew && showLeaveWarning && (
      <div style={{
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
        padding: "1rem"
      }}>
        <div style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          padding: "clamp(1.5rem, 4vw, 2rem)",
          maxWidth: "500px",
          width: "100%",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)"
        }}>
          <h3 style={{
            fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
            fontWeight: "700",
            color: "#0A0A0A",
            marginBottom: "1rem"
          }}>
            Seite verlassen?
          </h3>
          <p style={{
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            color: "#7A7A7A",
            marginBottom: "1.5rem",
            lineHeight: "1.6"
          }}>
            Sie haben die Daten noch nicht gespeichert. Beim Verlassen der Seite gehen diese verloren.
          </p>
          <div style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "flex-end"
          }}>
            <button
              onClick={() => {
                setShowLeaveWarning(false)
                setPendingNavigation(null)
              }}
              style={{
                padding: "clamp(0.875rem, 2.5vw, 1rem) clamp(1.5rem, 4vw, 2rem)",
                backgroundColor: "#FFFFFF",
                color: "#0A0A0A",
                border: "1px solid #CDCDCD",
                borderRadius: "8px",
                fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Abbrechen
            </button>
            <button
              onClick={() => {
                setShowLeaveWarning(false)
                if (pendingNavigation) {
                  router.push(pendingNavigation)
                } else {
                  router.back()
                }
                setPendingNavigation(null)
              }}
              style={{
                padding: "clamp(0.875rem, 2.5vw, 1rem) clamp(1.5rem, 4vw, 2rem)",
                backgroundColor: "#24c598",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(36, 197, 152, 0.3)"
              }}
            >
              Trotzdem verlassen
            </button>
          </div>
        </div>
      </div>
    )}
    </Fragment>
  )
}
