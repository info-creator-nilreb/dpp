"use client"

import React, { useState, useEffect, useCallback, Fragment } from "react"
import { useRouter } from "next/navigation"
import DppMediaSection from "@/components/DppMediaSection"
import CountrySelect from "@/components/CountrySelect"
import { useNotification } from "@/components/NotificationProvider"
import InputField from "@/components/InputField"
import StickySaveBar from "@/components/StickySaveBar"
import { TrialBanner } from "@/components/TrialBanner"
import { useCapabilities } from "@/hooks/useCapabilities"
import { DPP_SECTIONS } from "@/lib/permissions-constants"
import TemplateBlocksSection from "@/components/TemplateBlocksSection"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import SupplierInviteButton from "@/components/SupplierInviteButton"
import SupplierInviteModal from "@/components/SupplierInviteModal"
import ConfirmDialog from "@/components/ConfirmDialog"

interface PendingFile {
  id: string
  file: File
  preview?: string
  blockId?: string
  fieldId?: string
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
      // Clippt die Header-Hintergrundfarbe sauber in die abgerundeten Ecken
      overflow: "hidden",
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
          borderRadius: alwaysOpen ? "12px 12px 0px 0px" : "0px",
          cursor: alwaysOpen ? "default" : "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          textAlign: "left"
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
          zIndex: 1,
          // Stelle sicher, dass der Content-Bereich unten keine Rundung hat
          borderRadius: alwaysOpen ? "0px 0px 0px 0px" : "0px"
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
export default function DppEditor({ dpp: initialDpp, isNew = false, onUnsavedChangesChange, availableCategories: propCategories }: DppEditorProps) {
  const router = useRouter()
  const { showNotification } = useNotification()
  
  // Debug: Log initialDpp beim ersten Render
  console.log("[DppEditor] Component mounted with initialDpp:", {
    id: initialDpp?.id,
    name: initialDpp?.name,
    hasFieldValues: !!(initialDpp as any)?._fieldValues,
    hasFieldInstances: !!(initialDpp as any)?._fieldInstances,
    fieldValuesCount: Object.keys((initialDpp as any)?._fieldValues || {}).length,
    fieldInstancesCount: Object.keys((initialDpp as any)?._fieldInstances || {}).length
  })
  
  // State für alle Felder
  const [dpp, setDpp] = useState(initialDpp)
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

  // Update state when initialDpp prop changes (z.B. nach asynchronem Laden)
  // WICHTIG: Dieser useEffect muss auch beim ersten Laden ausgeführt werden
  useEffect(() => {
    // Prüfe, ob initialDpp gültig ist
    if (initialDpp && initialDpp.id) {
      // Aktualisiere State immer, wenn sich die ID geändert hat ODER beim ersten Laden
      const isFirstLoad = !dpp.id || dpp.id === "new" || dpp.id !== initialDpp.id
      
      if (isFirstLoad) {
        console.log("[DppEditor] Initializing/updating state from initialDpp:", {
          id: initialDpp.id,
          name: initialDpp.name,
          description: initialDpp.description,
          hasFieldValues: !!(initialDpp as any)._fieldValues,
          hasFieldInstances: !!(initialDpp as any)._fieldInstances
        })
        setDpp(initialDpp)
        setName(initialDpp.name || "")
        setDescription(initialDpp.description || "")
        setCategory(initialDpp.category || "")
        setSku(initialDpp.sku || "")
        setGtin(initialDpp.gtin || "")
        setBrand(initialDpp.brand || "")
        setCountryOfOrigin(initialDpp.countryOfOrigin || "")
        setMaterials(initialDpp.materials || "")
        setMaterialSource(initialDpp.materialSource || "")
        setCareInstructions(initialDpp.careInstructions || "")
        setIsRepairable(initialDpp.isRepairable || "")
        setSparePartsAvailable(initialDpp.sparePartsAvailable || "")
        setLifespan(initialDpp.lifespan || "")
        setConformityDeclaration(initialDpp.conformityDeclaration || "")
        setDisposalInfo(initialDpp.disposalInfo || "")
        setTakebackOffered(initialDpp.takebackOffered || "")
        setTakebackContact(initialDpp.takebackContact || "")
        setSecondLifeInfo(initialDpp.secondLifeInfo || "")
        setPreviousCategory(initialDpp.category || "")
        
        // Lade Feldwerte aus DppContent, falls vorhanden
        if ((initialDpp as any)._fieldValues || (initialDpp as any)._fieldInstances) {
          console.log("[DppEditor] Loading field values from DppContent (initialDpp)")
          if ((initialDpp as any)._fieldValues) {
            const loadedFieldValues = (initialDpp as any)._fieldValues
            setFieldValues(loadedFieldValues)
            console.log("[DppEditor] Loaded field values:", Object.keys(loadedFieldValues).length, "fields")
            console.log("[DppEditor] Field value keys:", Object.keys(loadedFieldValues))
            console.log("[DppEditor] Field values:", loadedFieldValues)
          }
          if ((initialDpp as any)._fieldInstances) {
            setFieldInstances((initialDpp as any)._fieldInstances)
            console.log("[DppEditor] Loaded field instances:", Object.keys((initialDpp as any)._fieldInstances).length, "repeatable fields", Object.keys((initialDpp as any)._fieldInstances))
          }
        } else {
          console.log("[DppEditor] No _fieldValues or _fieldInstances in initialDpp, will load from API if needed")
          // Fallback: Lade Feldwerte direkt von der API (nur wenn DPP bereits existiert)
          if (initialDpp.id && initialDpp.id !== "new") {
            loadFieldValuesFromContent(initialDpp.id)
          }
        }
      }
    }
  }, [initialDpp?.id, dpp.id]) // Reagiere auf ID-Änderung und initiales Laden

  // Lade Feldwerte aus DppContent für bestehende DPPs
  const loadFieldValuesFromContent = useCallback(async (dppId: string) => {
    if (!dppId || dppId === "new") return
    
    try {
      console.log("[DppEditor] Loading field values from API for DPP:", dppId)
      const response = await fetch(`/api/app/dpp/${dppId}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.fieldValues) {
          console.log("[DppEditor] Loaded field values from API:", Object.keys(data.fieldValues).length, "fields")
          setFieldValues(data.fieldValues)
        }
        if (data.fieldInstances) {
          console.log("[DppEditor] Loaded field instances from API:", Object.keys(data.fieldInstances).length, "repeatable fields")
          setFieldInstances(data.fieldInstances)
        }
      }
    } catch (error) {
      console.error("[DppEditor] Error loading field values:", error)
    }
  }, [])

  // Lade Feldwerte beim ersten Laden eines bestehenden DPPs
  useEffect(() => {
    if (dpp.id && dpp.id !== "new" && !isNew) {
      // Prüfe, ob Werte bereits im initialDpp vorhanden sind
      if ((initialDpp as any)._fieldValues || (initialDpp as any)._fieldInstances) {
        // Werte wurden bereits im ersten useEffect geladen
        return
      }
      // Fallback: Lade Werte direkt von der API
      loadFieldValuesFromContent(dpp.id)
    }
  }, [dpp.id, isNew, initialDpp, loadFieldValuesFromContent]) // Nur einmal ausführen, wenn DPP-ID vorhanden ist

  // Template State
  interface TemplateBlock {
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
    }>
  }
  const [template, setTemplate] = useState<{
    id: string
    name: string
    blocks: TemplateBlock[]
  } | null>(null)
  const [templateLoading, setTemplateLoading] = useState(false)
  
  // Supplier-Config State (pro DPP/Block)
  const [blockSupplierConfigs, setBlockSupplierConfigs] = useState<Record<string, {
    enabled: boolean
    mode: "input" | "declaration" | null
    allowedRoles?: string[]
  }>>({})
  const [supplierConfigLoading, setSupplierConfigLoading] = useState(false)
  
  // Field Instances State (für wiederholbare Felder)
  const [fieldInstances, setFieldInstances] = useState<Record<string, Array<{
    instanceId: string
    values: Record<string, string | string[]>
  }>>>((initialDpp as any)?._fieldInstances || {})
  
  // Field Values State (für normale template-basierte Felder)
  const [fieldValues, setFieldValues] = useState<Record<string, string | string[]>>((initialDpp as any)?._fieldValues || {})

  // Accordion State (Sektion 1 immer offen)
  const [section2Open, setSection2Open] = useState(false)
  const [section3Open, setSection3Open] = useState(false)
  const [section4Open, setSection4Open] = useState(false)
  const [section5Open, setSection5Open] = useState(false)
  
  // Supplier Invite Modal State
  const [showSupplierInviteModal, setShowSupplierInviteModal] = useState(false)
  const [showSaveRequiredDialog, setShowSaveRequiredDialog] = useState(false)
  const [supplierInviteLoading, setSupplierInviteLoading] = useState(false)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [dataRequests, setDataRequests] = useState<Array<{
    id: string
    email: string
    partnerRole: string
    blockIds?: string | string[] // New template-based (kann String oder Array sein)
    fieldInstances?: Array<{ fieldId: string; instanceId: string; label: string }> // Field-level assignments
    supplierMode?: string // "input" | "declaration"
    sections?: string[] // Legacy support
    status: string
    expiresAt: string
    submittedAt: string | null
    createdAt: string
  }>>([])
  
  // Save Status für Sticky Save Bar
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "publishing" | "error">("idle")
  const [lastSaved, setLastSaved] = useState<Date | null>(isNew ? null : initialDpp.updatedAt)
  const [saveError, setSaveError] = useState<string | null>(null)
  
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
        // Default to false on error (fail-safe)
        setSubscriptionCanPublish(false)
      }
    }
    loadSubscriptionContext()
  }, [])

  // Load template for DPP (auch für neue DPPs basierend auf Kategorie)
  // Optimiert: Lädt Template sofort parallel, wenn Kategorie vorhanden ist
  useEffect(() => {
    if (!category) {
      setTemplate(null)
      setTemplateLoading(false)
      return
    }

    // Sofort mit dem Laden beginnen (nicht blockieren)
    let cancelled = false
    
    async function loadTemplate() {
      setTemplateLoading(true)
      try {
        if (isNew) {
          // Für neue DPPs: Template basierend auf Kategorie laden
          // WICHTIG: no-store verwenden, um sicherzustellen, dass immer das aktuelle aktive Template geladen wird
          const response = await fetch(`/api/app/dpp/template-by-category?category=${encodeURIComponent(category)}`, {
            cache: "no-store" // Immer neueste Version laden, da Templates sich ändern können
          })
          if (cancelled) return
          
          if (response.ok) {
            const data = await response.json()
            if (cancelled) return
            
            if (data.template) {
              setTemplate(data.template)
            } else {
              setTemplate(null)
            }
          } else {
            setTemplate(null)
          }
        } else {
          // Für bestehende DPPs: Template über DPP-ID laden
          const response = await fetch(`/api/app/dpp/${dpp.id}/template`)
          if (cancelled) return
          
          if (response.ok) {
            const data = await response.json()
            if (cancelled) return
            setTemplate(data.template)
          } else {
            setTemplate(null)
          }
        }
      } catch (error) {
        if (cancelled) return
        setTemplate(null)
      } finally {
        if (!cancelled) {
          setTemplateLoading(false)
        }
      }
    }
    
    loadTemplate()
    
    // Cleanup: verhindere State-Updates wenn Component unmounted oder category sich ändert
    return () => {
      cancelled = true
    }
  }, [dpp.id, category, isNew])

  // Load supplier configs for existing DPPs
  useEffect(() => {
    if (isNew || !dpp.id || dpp.id === "new") return

    async function loadSupplierConfigs() {
      setSupplierConfigLoading(true)
      try {
        const response = await fetch(`/api/app/dpp/${dpp.id}/supplier-config`)
        if (response.ok) {
          const data = await response.json()
          const configs: Record<string, {
            enabled: boolean
            mode: "input" | "declaration" | null
            allowedRoles?: string[]
          }> = {}
          
          if (data.configs && Array.isArray(data.configs)) {
            data.configs.forEach((config: any) => {
              configs[config.blockId] = {
                enabled: config.enabled,
                mode: config.mode || null,
                allowedRoles: config.allowedRoles || []
              }
            })
          }
          
          setBlockSupplierConfigs(configs)
        }
      } catch (error) {
        console.error("Error loading supplier configs:", error)
      } finally {
        setSupplierConfigLoading(false)
      }
    }
    loadSupplierConfigs()
  }, [dpp.id, isNew])

  // Globaler Check: Sicherstellen, dass body.style.overflow korrekt ist, wenn keine Modals offen sind
  useEffect(() => {
    // Wenn beide Modals geschlossen sind, overflow sofort zurücksetzen
    if (!showSaveRequiredDialog && !showSupplierInviteModal) {
      if (typeof document !== "undefined") {
        // Sofort zurücksetzen (ohne Timeout, damit Interaktionen sofort funktionieren)
        document.body.style.overflow = ""
      }
    }
  }, [showSaveRequiredDialog, showSupplierInviteModal])

  // Load data requests (auch für neue DPPs, wenn dpp.id bereits existiert)
  useEffect(() => {
    if (!dpp.id || dpp.id === "new") {
      console.log("[DppEditor] loadDataRequests skipped - dpp.id:", dpp.id)
      return
    }

    async function loadDataRequests() {
      try {
        console.log("[DppEditor] Loading data requests for dpp.id:", dpp.id)
        const response = await fetch(`/api/app/dpp/${dpp.id}/data-requests`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
          }
        })
        if (response.ok) {
          const data = await response.json()
          console.log("[DppEditor] Loaded data requests:", data.requests?.length || 0, data.requests)
          setDataRequests(data.requests || [])
        } else {
          console.error("[DppEditor] Failed to load data requests:", response.status, response.statusText)
        }
      } catch (error) {
        console.error("[DppEditor] Error loading data requests:", error)
      }
    }
    loadDataRequests()
  }, [dpp.id])
  
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
          // Kein Fallback mehr - wenn keine Kategorien geladen werden können, bleibt die Liste leer
          setAvailableCategories([])
        }
      } catch (error) {
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

  // Aktualisiere Medien-Liste nach Upload/Delete
  const refreshMedia = async () => {
    if (!dpp.id || dpp.id === "new") return
    try {
      const response = await fetch(`/api/app/dpp/${dpp.id}/media`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      })
      if (response.ok) {
        const data = await response.json()
        setDpp(prev => ({ ...prev, media: data.media || [] }))
      }
    } catch (error) {
      console.error("[DppEditor] Error refreshing media:", error)
    }
  }

  // Lade Medien beim ersten Laden eines bestehenden DPPs (falls nicht bereits geladen)
  useEffect(() => {
    if (!isNew && dpp.id && dpp.id !== "new") {
      // Prüfe, ob Medien bereits geladen wurden (aus initialDpp)
      // Wenn initialDpp.media leer ist oder nicht existiert, lade sie nach
      if (!initialDpp.media || initialDpp.media.length === 0) {
        refreshMedia()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dpp.id, isNew]) // Nur beim ersten Laden ausführen

  // Auto-Save für Supplier-Invite (ohne Redirect)
  const handleAutoSaveForSupplierInvite = async (): Promise<string | null> => {
    // Minimale Validierung: name muss vorhanden sein
    if (!name.trim()) {
      showNotification("Bitte geben Sie einen Produktnamen ein, bevor Sie Partner einbinden können", "error")
      return null
    }

    setIsAutoSaving(true)
    setSaveError(null)
    
    try {
      const payload = {
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
          const errorMsg = `Fehler beim Speichern (Status: ${response.status})`
          setSaveError(errorMsg)
          showNotification(errorMsg, "error")
          return null
        }

        const errorMessage = errorData.error === "NO_ORGANIZATION" 
          ? "Sie benötigen eine Organisation. Bitte erstellen Sie zuerst eine Organisation in Ihren Kontoeinstellungen."
          : errorData.error || "Fehler beim Speichern"
        
        setSaveError(errorMessage)
        showNotification(errorMessage, "error")
        return null
      }

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        const errorMsg = "Fehler beim Verarbeiten der Antwort"
        setSaveError(errorMsg)
        showNotification(errorMsg, "error")
        return null
      }

      if (!data?.dpp?.id) {
        const errorMsg = "Fehler: DPP-ID fehlt in der Antwort"
        setSaveError(errorMsg)
        showNotification(errorMsg, "error")
        return null
      }
      
      // Erfolgreich gespeichert - Update local state mit neuer DPP-ID
      const newDppId = data.dpp.id
      console.log("[DppEditor] Auto-save successful, new ID:", newDppId)
      setDpp(prev => ({ ...prev, id: newDppId, status: "DRAFT" }))
      setLastSaved(new Date())
      setSaveStatus("saved")
      
      // Speichere Supplier-Configs, falls vorhanden
      if (Object.keys(blockSupplierConfigs).length > 0) {
        try {
          await Promise.all(
            Object.entries(blockSupplierConfigs).map(([blockId, config]) =>
              fetch(`/api/app/dpp/${newDppId}/supplier-config`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  blockId,
                  enabled: config.enabled,
                  mode: config.mode || "input",
                  allowedRoles: config.allowedRoles || []
                })
              })
            )
          )
        } catch (error) {
          console.error("Error saving supplier configs:", error)
        }
      }
      
      // Lade data requests nach dem Auto-Save
      try {
        const requestsResponse = await fetch(`/api/app/dpp/${newDppId}/data-requests`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
          }
        })
        if (requestsResponse.ok) {
          const requestsData = await requestsResponse.json()
          console.log("[DppEditor] After auto-save - Loaded data requests:", requestsData.requests?.length || 0, requestsData.requests)
          setDataRequests(requestsData.requests || [])
        }
      } catch (error) {
        console.error("[DppEditor] Error loading data requests after auto-save:", error)
      }

      showNotification("DPP gespeichert. Partner können jetzt eingebunden werden.", "success")
      return newDppId
    } catch (error) {
      const errorMsg = "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut."
      setSaveError(errorMsg)
      showNotification(errorMsg, "error")
      return null
    } finally {
      setIsAutoSaving(false)
    }
  }

  // Globaler Check: Sicherstellen, dass body.style.overflow korrekt ist, wenn keine Modals offen sind
  useEffect(() => {
    // Wenn beide Modals geschlossen sind, overflow zurücksetzen
    if (!showSaveRequiredDialog && !showSupplierInviteModal) {
      if (typeof document !== "undefined") {
        // Sofort zurücksetzen (ohne Timeout, damit Interaktionen sofort funktionieren)
        document.body.style.overflow = ""
      }
    }
  }, [showSaveRequiredDialog, showSupplierInviteModal])

  // Handler für Supplier-Invite-Button Click
  const handleSupplierInviteClick = () => {
    // Sicherstellen, dass kein anderes Modal offen ist
    if (showSaveRequiredDialog || showSupplierInviteModal) {
      return
    }

    // Prüfe ob DPP bereits gespeichert ist
    if (isNew || !dpp.id || dpp.id === "new") {
      // DPP muss zuerst gespeichert werden
      setShowSaveRequiredDialog(true)
    } else {
      // DPP bereits gespeichert → Modal direkt öffnen
      setShowSupplierInviteModal(true)
    }
  }

  // Handler für Auto-Save-Bestätigung
  const handleConfirmAutoSave = async () => {
    // Dialog erst schließen, wenn Auto-Save erfolgreich ist
    // (sonst könnte der Dialog zu früh geschlossen werden und overflow bleibt hängen)
    const newDppId = await handleAutoSaveForSupplierInvite()
    
    if (newDppId) {
      // Auto-Save erfolgreich → Dialog schließen und Modal öffnen
      setShowSaveRequiredDialog(false)
      setShowSupplierInviteModal(true)
    } else {
      // Bei Fehler Dialog offen lassen, damit Benutzer es erneut versuchen kann
      // showSaveRequiredDialog bleibt true
    }
  }

  // Generische Funktion: Mappt Template-Feld-Keys auf DPP-Felder
  // Unterstützt verschiedene Varianten (z.B. "produktname" -> "name", "ean" -> "gtin")
  const mapTemplateKeyToDppField = (templateKey: string): string | null => {
    const normalizedKey = templateKey.toLowerCase().trim()
    
    // Mapping von Template-Keys zu DPP-Feldnamen
    const keyMapping: Record<string, string> = {
      // Name-Varianten
      "produktname": "name",
      "name": "name",
      "productname": "name",
      
      // Beschreibung
      "beschreibung": "description",
      "description": "description",
      
      // SKU
      "sku": "sku",
      
      // GTIN/EAN
      "ean": "gtin",
      "gtin": "gtin",
      
      // Brand
      "brand": "brand",
      "marke": "brand",
      "hersteller": "brand",
      
      // Country
      "herstellungsland": "countryOfOrigin",
      "countryoforigin": "countryOfOrigin",
      "country": "countryOfOrigin",
      
      // Materials
      "material": "materials",
      "materials": "materials",
      "materialien": "materials",
      
      // Material Source
      "materialsource": "materialSource",
      "materialquelle": "materialSource",
      "datenquelle": "materialSource",
      
      // Care Instructions
      "careinstructions": "careInstructions",
      "pflegehinweise": "careInstructions",
      "pflege": "careInstructions",
      
      // Repairability
      "isrepairable": "isRepairable",
      "reparierbarkeit": "isRepairable",
      "reparierbar": "isRepairable",
      
      // Spare Parts
      "sparepartsavailable": "sparePartsAvailable",
      "ersatzteile": "sparePartsAvailable",
      
      // Lifespan
      "lifespan": "lifespan",
      "lebensdauer": "lifespan",
      
      // Conformity
      "conformitydeclaration": "conformityDeclaration",
      "konformiataetserklaerung": "conformityDeclaration",
      "konformität": "conformityDeclaration",
      
      // Disposal
      "disposalinfo": "disposalInfo",
      "entsorgung": "disposalInfo",
      
      // Takeback
      "takebackoffered": "takebackOffered",
      "ruecknahme_angeboten": "takebackOffered",
      "rücknahme": "takebackOffered",
      
      // Takeback Contact
      "takebackcontact": "takebackContact",
      "ruecknahme_kontakt": "takebackContact",
      
      // Second Life
      "secondlifeinfo": "secondLifeInfo",
      "secondlife": "secondLifeInfo",
    }
    
    return keyMapping[normalizedKey] || null
  }
  
  // Extrahiere DPP-Feldwerte aus fieldValues und State
  // Priorität: fieldValues (Template-Felder) > State (direkte Felder)
  const extractDppFieldValue = (dppFieldName: string): string => {
    // 1. Versuche aus fieldValues zu extrahieren (durchsuche alle Template-Keys)
    if (fieldValues) {
      for (const [templateKey, value] of Object.entries(fieldValues)) {
        const mappedField = mapTemplateKeyToDppField(templateKey)
        if (mappedField === dppFieldName && value) {
          const stringValue = Array.isArray(value) ? value.join(", ") : String(value)
          if (stringValue.trim()) {
            return stringValue.trim()
          }
        }
      }
    }
    
    // 2. Fallback auf State-Werte
    switch (dppFieldName) {
      case "name": return name.trim()
      case "description": return description?.trim() || ""
      case "sku": return sku.trim()
      case "gtin": return gtin.trim()
      case "brand": return brand.trim()
      case "countryOfOrigin": return countryOfOrigin.trim()
      case "materials": return materials?.trim() || ""
      case "materialSource": return materialSource?.trim() || ""
      case "careInstructions": return careInstructions?.trim() || ""
      case "isRepairable": return isRepairable?.trim() || ""
      case "sparePartsAvailable": return sparePartsAvailable?.trim() || ""
      case "lifespan": return lifespan?.trim() || ""
      case "conformityDeclaration": return conformityDeclaration?.trim() || ""
      case "disposalInfo": return disposalInfo?.trim() || ""
      case "takebackOffered": return takebackOffered?.trim() || ""
      case "takebackContact": return takebackContact?.trim() || ""
      case "secondLifeInfo": return secondLifeInfo?.trim() || ""
      default: return ""
    }
  }

  // Speichere DPP-Daten (Draft Save)
  const handleSave = async () => {
    setSaveStatus("saving")
    setSaveError(null)
    
    try {
      if (isNew) {
        // Neuer DPP: Erstellen
        // Template-Version-Binding: Sende templateId (die Template.id wird als templateVersionId gespeichert)
        if (!template) {
          const errorMsg = "Kein Template geladen. Bitte wählen Sie eine Kategorie aus."
          setSaveError(errorMsg)
          setSaveStatus("error")
          showNotification(errorMsg, "error")
          return
        }
        
        // Extrahiere alle DPP-Feldwerte automatisch (aus fieldValues oder State)
        const extractedName = extractDppFieldValue("name")
        
        // Validierung: name muss vorhanden sein
        if (!extractedName) {
          const errorMsg = "Produktname ist erforderlich"
          setSaveError(errorMsg)
          setSaveStatus("error")
          showNotification(errorMsg, "error")
          return
        }
        
        const payload = {
          name: extractedName,
          description: extractDppFieldValue("description") || null,
          category,
          sku: extractDppFieldValue("sku") || null,
          gtin: extractDppFieldValue("gtin") || null,
          brand: extractDppFieldValue("brand") || null,
          countryOfOrigin: extractDppFieldValue("countryOfOrigin") || null,
          materials: extractDppFieldValue("materials") || null,
          materialSource: extractDppFieldValue("materialSource") || null,
          careInstructions: extractDppFieldValue("careInstructions") || null,
          isRepairable: extractDppFieldValue("isRepairable") || null,
          sparePartsAvailable: extractDppFieldValue("sparePartsAvailable") || null,
          lifespan: extractDppFieldValue("lifespan") || null,
          conformityDeclaration: extractDppFieldValue("conformityDeclaration") || null,
          disposalInfo: extractDppFieldValue("disposalInfo") || null,
          takebackOffered: extractDppFieldValue("takebackOffered") || null,
          takebackContact: extractDppFieldValue("takebackContact") || null,
          secondLifeInfo: extractDppFieldValue("secondLifeInfo") || null,
          organizationId: dpp.organizationId,
          templateId: template.id, // Template-Version-Binding: Speichere Template-ID
          fieldValues: fieldValues, // Template-basierte Feldwerte mit übergeben
          fieldInstances: fieldInstances // Wiederholbare Feld-Instanzen mit übergeben
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
        console.log("[DppEditor] DPP saved successfully, new ID:", newDppId)
        setDpp(prev => ({ ...prev, id: newDppId, status: "DRAFT" }))
        
        // Speichere template-basierte Feldwerte in dppContent
        // WICHTIG: Auch wenn fieldValues leer ist, müssen die Blöcke initialisiert werden,
        // damit sie beim nächsten Laden vorhanden sind
        try {
          console.log("[DppEditor] Saving content for new DPP with fieldValues:", Object.keys(fieldValues).length, "fields:", Object.keys(fieldValues))
          console.log("[DppEditor] New DPP - Field values detail:", JSON.stringify(fieldValues, null, 2))
          console.log("[DppEditor] New DPP - Field instances:", Object.keys(fieldInstances).length, "repeatable fields:", Object.keys(fieldInstances))
          
          const contentPayload = {
            fieldValues: fieldValues || {},
            fieldInstances: fieldInstances || {}
          }
          console.log("[DppEditor] New DPP - Content payload:", JSON.stringify(contentPayload, null, 2))
          
          const contentResponse = await fetch(`/api/app/dpp/${newDppId}/content`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(contentPayload)
          })
          
          console.log("[DppEditor] New DPP - Content API response status:", contentResponse.status)
          
          if (!contentResponse.ok) {
            const errorText = await contentResponse.text()
            console.error("[DppEditor] Error saving content for new DPP:", errorText)
            // Fehler beim Speichern von Content ist nicht kritisch, benachrichtige aber
            showNotification("DPP gespeichert, aber einige Feldwerte konnten nicht gespeichert werden", "error")
          } else {
            const responseData = await contentResponse.json()
            console.log("[DppEditor] Content saved successfully for new DPP, response:", responseData)
          }
        } catch (contentError) {
          console.error("[DppEditor] Error saving content for new DPP:", contentError)
          // Fehler beim Speichern von Content ist nicht kritisch
        }
        
        // Lade zwischengespeicherte Dateien hoch (inkl. Template-Feld-Dateien)
        if (pendingFiles.length > 0) {
          try {
            console.log("[DppEditor] Uploading", pendingFiles.length, "pending files after save")
            const uploadPromises = pendingFiles.map(async (pendingFile) => {
              const formData = new FormData()
              formData.append("file", pendingFile.file)
              // Wenn blockId und fieldId vorhanden, mit übergeben
              if (pendingFile.blockId) {
                formData.append("blockId", pendingFile.blockId)
              }
              if (pendingFile.fieldId) {
                formData.append("fieldId", pendingFile.fieldId)
              }
              
              const uploadResponse = await fetch(`/api/app/dpp/${newDppId}/media`, {
                method: "POST",
                body: formData
              })
              
              if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json()
                throw new Error(errorData.error || "Fehler beim Hochladen")
              }
            })
            
            await Promise.all(uploadPromises)
            setPendingFiles([])
            // Lade Medien neu, um hochgeladene Dateien anzuzeigen
            await refreshMedia()
            console.log("[DppEditor] All pending files uploaded successfully")
          } catch (uploadError: any) {
            console.error("[DppEditor] Error uploading pending files:", uploadError)
            showNotification("DPP gespeichert, aber einige Dateien konnten nicht hochgeladen werden", "error")
          }
        }
        
        // Speichere Supplier-Configs, falls vorhanden (auch für neue DPPs)
        if (Object.keys(blockSupplierConfigs).length > 0) {
          try {
            await Promise.all(
              Object.entries(blockSupplierConfigs).map(([blockId, config]) =>
                fetch(`/api/app/dpp/${newDppId}/supplier-config`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    blockId,
                    enabled: config.enabled,
                    mode: config.mode || "input",
                    allowedRoles: config.allowedRoles || []
                  })
                })
              )
            )
          } catch (error) {
            // Fehler beim Speichern der Configs ist nicht kritisch
            console.error("Error saving supplier configs:", error)
          }
        }
        
        // Lade data requests nach dem Speichern (wichtig für neue DPPs)
        try {
          const requestsResponse = await fetch(`/api/app/dpp/${newDppId}/data-requests`, {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache",
              "Pragma": "no-cache"
            }
          })
          if (requestsResponse.ok) {
            const requestsData = await requestsResponse.json()
            console.log("[DppEditor] After save - Loaded data requests:", requestsData.requests?.length || 0, requestsData.requests)
            setDataRequests(requestsData.requests || [])
          }
        } catch (error) {
          console.error("[DppEditor] Error loading data requests after save:", error)
        }
        
        // NOTE: Media uploads are now handled as first-class field types within blocks.
        // No implicit media upload at the end of save. Media fields in template blocks
        // handle their own uploads when users interact with them.
        
        setLastSaved(new Date())
        setSaveStatus("saved")
        showNotification("Entwurf gespeichert", "success")
        
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
          // Speichere template-basierte Feldwerte in dppContent
          // WICHTIG: Auch wenn fieldValues leer ist, müssen die Blöcke initialisiert werden,
          // damit sie beim nächsten Laden vorhanden sind
          try {
            console.log("[DppEditor] Saving content with fieldValues:", Object.keys(fieldValues).length, "fields:", Object.keys(fieldValues))
            console.log("[DppEditor] Field values detail:", JSON.stringify(fieldValues, null, 2))
            console.log("[DppEditor] Field instances:", Object.keys(fieldInstances).length, "repeatable fields:", Object.keys(fieldInstances))
            
            const contentPayload = {
              fieldValues: fieldValues || {},
              fieldInstances: fieldInstances || {}
            }
            console.log("[DppEditor] Content payload:", JSON.stringify(contentPayload, null, 2))
            
            const contentResponse = await fetch(`/api/app/dpp/${dpp.id}/content`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(contentPayload)
            })
            
            console.log("[DppEditor] Content API response status:", contentResponse.status)
            
            if (!contentResponse.ok) {
              const errorText = await contentResponse.text()
              console.error("[DppEditor] Error saving content:", errorText)
              // Fehler beim Speichern von Content ist nicht kritisch, benachrichtige aber
              showNotification("DPP gespeichert, aber einige Feldwerte konnten nicht gespeichert werden", "error")
            } else {
              const responseData = await contentResponse.json()
              console.log("[DppEditor] Content saved successfully, response:", responseData)
            }
          } catch (contentError) {
            console.error("[DppEditor] Error saving content:", contentError)
            // Fehler beim Speichern von Content ist nicht kritisch
          }
          
          // Erfolgreich gespeichert
          setLastSaved(new Date())
          setSaveStatus("saved")
          showNotification("Entwurf gespeichert", "success")
          // Aktualisiere Medienliste, um sicherzustellen, dass alle hochgeladenen Medien angezeigt werden
          await refreshMedia()
          // Bleibe auf der Seite, kein Redirect
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
      showNotification(errorMsg, "error")
    }
  }

  // Veröffentliche DPP als neue Version
  const handlePublish = async () => {
    // Verwende generische Extraktion auch für Publishing
    const extractedName = extractDppFieldValue("name")
    const extractedSku = extractDppFieldValue("sku")
    
    // Validierung: name und sku müssen vorhanden sein
    if (!extractedName) {
      showNotification("Produktname ist erforderlich für die Veröffentlichung", "error")
      return
    }
    
    if (!extractedSku) {
      showNotification("SKU / Interne ID ist erforderlich für die Veröffentlichung", "error")
      return
    }

    setSaveStatus("publishing")
    setSaveError(null)
    
    try {
      let dppIdToPublish = dpp.id

      // Wenn neu: Erst erstellen, dann veröffentlichen
      if (isNew) {
        if (!template) {
          const errorMsg = "Kein Template geladen. Bitte wählen Sie eine Kategorie aus."
          setSaveError(errorMsg)
          setSaveStatus("error")
          showNotification(errorMsg, "error")
          return
        }
        
        const createResponse = await fetch("/api/app/dpp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: extractedName,
            description: extractDppFieldValue("description") || null,
            category,
            sku: extractedSku,
            gtin: extractDppFieldValue("gtin") || null,
            brand: extractDppFieldValue("brand") || null,
            countryOfOrigin: extractDppFieldValue("countryOfOrigin") || null,
            materials: extractDppFieldValue("materials") || null,
            materialSource: extractDppFieldValue("materialSource") || null,
            careInstructions: extractDppFieldValue("careInstructions") || null,
            isRepairable: extractDppFieldValue("isRepairable") || null,
            sparePartsAvailable: extractDppFieldValue("sparePartsAvailable") || null,
            lifespan: extractDppFieldValue("lifespan") || null,
            conformityDeclaration: extractDppFieldValue("conformityDeclaration") || null,
            disposalInfo: extractDppFieldValue("disposalInfo") || null,
            takebackOffered: extractDppFieldValue("takebackOffered") || null,
            takebackContact: extractDppFieldValue("takebackContact") || null,
            secondLifeInfo: extractDppFieldValue("secondLifeInfo") || null,
            organizationId: dpp.organizationId,
            templateId: template.id
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
              }
            })
            
            await Promise.all(uploadPromises)
            setPendingFiles([])
          } catch (uploadError) {
          }
        }
      } else {
        // Bestehender DPP: Erst speichern
        // Verwende auch hier die generische Extraktion
        const saveResponse = await fetch(`/api/app/dpp/${dpp.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: extractDppFieldValue("name"),
            description: extractDppFieldValue("description") || null,
            category,
            sku: extractDppFieldValue("sku") || null,
            gtin: extractDppFieldValue("gtin") || null,
            brand: extractDppFieldValue("brand") || null,
            countryOfOrigin: extractDppFieldValue("countryOfOrigin") || null,
            materials: extractDppFieldValue("materials") || null,
            materialSource: extractDppFieldValue("materialSource") || null,
            careInstructions: extractDppFieldValue("careInstructions") || null,
            isRepairable: extractDppFieldValue("isRepairable") || null,
            sparePartsAvailable: extractDppFieldValue("sparePartsAvailable") || null,
            lifespan: extractDppFieldValue("lifespan") || null,
            conformityDeclaration: extractDppFieldValue("conformityDeclaration") || null,
            disposalInfo: extractDppFieldValue("disposalInfo") || null,
            takebackOffered: extractDppFieldValue("takebackOffered") || null,
            takebackContact: extractDppFieldValue("takebackContact") || null,
            secondLifeInfo: extractDppFieldValue("secondLifeInfo") || null
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
          cursor: disabled ? "not-allowed" : "pointer",
          MozAppearance: "none",
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23000' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right clamp(0.75rem, 2vw, 1rem) center"
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

  // Helper: Determine status badge for materials section (updated for blockIds)
  const getMaterialsSectionStatusBadge = (): React.ReactNode | undefined => {
    // Filter requests by blockIds or legacy sections
    const materialsRequests = dataRequests.filter(req => {
      if (req.blockIds && req.blockIds.length > 0) {
        // New template-based: Check if any supplier-enabled block is requested
        return req.blockIds.length > 0
      }
      // Legacy sections-based: Check for materials sections
      if (req.sections && req.sections.length > 0) {
        return req.sections.includes(DPP_SECTIONS.MATERIALS) || 
      req.sections.includes(DPP_SECTIONS.MATERIAL_SOURCE)
      }
      return false
    })
    
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
  // Updated for blockIds-based requests (legacy sections support for backward compatibility)
  const isFieldRequested = (fieldSection: string): boolean => {
    return dataRequests.some(req => {
      if (req.status !== "pending") return false
      // New template-based: blockIds are handled at block level, not field level
      // Legacy sections-based: Check if field's section is requested
      if (req.sections && req.sections.length > 0) {
        return req.sections.includes(fieldSection)
      }
      return false
    })
  }

  return (
    <>
    <div>
      <h1 style={{
        fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
        fontWeight: "700",
        color: "#0A0A0A",
        marginBottom: "1rem"
      }}>
        {isNew ? "Neuer Produktpass" : "Produktpass Editor"}
      </h1>

      {/* Trial Banner */}
      {!isNew && isTrial && subscription?.trialExpiresAt && (
        <div style={{ marginBottom: "20px" }}>
          <TrialBanner
            organizationId={dpp.organizationId}
            trialEndDate={subscription.trialExpiresAt}
          />
        </div>
      )}

      {/* Kategorie-Auswahl (immer sichtbar, für Template-Auswahl benötigt) */}
      <div style={{
        backgroundColor: "#FFFFFF",
        padding: "clamp(1.5rem, 4vw, 2rem)",
        borderRadius: "12px",
        border: "1px solid #CDCDCD",
        marginBottom: "1.5rem"
      }}>
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
        </div>

      {/* Globaler Lieferanten-Button */}
      {template && !templateLoading && (
        <SupplierInviteButton
          onClick={handleSupplierInviteClick}
          supplierEnabledBlocksCount={template.blocks.filter(
            block => block.order > 0 && blockSupplierConfigs[block.id]?.enabled === true
          ).length}
        />
      )}

      {/* Save-Required Dialog für Supplier-Invite */}
      <ConfirmDialog
        isOpen={showSaveRequiredDialog}
        title="DPP muss zuerst gespeichert werden"
        message="Um Partner einzubinden, muss der DPP zuerst als Entwurf gespeichert werden. Möchten Sie den DPP jetzt speichern?"
        confirmLabel={isAutoSaving ? "Wird gespeichert..." : "Jetzt speichern"}
        cancelLabel="Abbrechen"
        onConfirm={handleConfirmAutoSave}
        onCancel={() => {
          if (!isAutoSaving) {
            setShowSaveRequiredDialog(false)
          }
        }}
        variant="default"
        disabled={isAutoSaving}
      />

      {/* Template-Blöcke (dynamisch basierend auf Template) */}
      {template && !templateLoading && (() => {
        // Extrahiere Supplier-Informationen für Felder
        // Prüfe, welche Felder von welchem Beteiligten bereitgestellt wurden
        // TEIL 6: Erweitert um confirmed Status und mode (input/declaration)
        const supplierFieldInfo: Record<string, { partnerRole: string; confirmed?: boolean; mode?: "input" | "declaration" }> = {}
        
        // Lade Bestätigungsstatus aus localStorage (temporär, später in DB)
        const getConfirmedFields = (): Set<string> => {
          if (!dpp.id || dpp.id === "new") return new Set()
          try {
            const stored = localStorage.getItem(`dpp-${dpp.id}-confirmed-fields`)
            return stored ? new Set(JSON.parse(stored)) : new Set()
          } catch {
            return new Set()
          }
        }
        
        const confirmedFields = getConfirmedFields()
        
        // Durchsuche alle submitted dataRequests
        const submittedRequests = dataRequests.filter(req => req.status === "submitted")
        console.log("[DppEditor] Supplier Field Info - dataRequests:", dataRequests.length, "submittedRequests:", submittedRequests.length, dataRequests)
        
        submittedRequests.forEach(req => {
          console.log("[DppEditor] Processing submitted request:", req.id, "partnerRole:", req.partnerRole, "supplierMode:", req.supplierMode, "blockIds:", req.blockIds, "fieldInstances:", req.fieldInstances)
          
          // WICHTIG: Prüfe, welche Felder tatsächlich vom Supplier befüllt wurden
          // Dazu prüfen wir, welche Felder in fieldValues vorhanden sind, die zu den Supplier-Blöcken gehören
          const blockIdsArray = req.blockIds ? (Array.isArray(req.blockIds) ? req.blockIds : req.blockIds.split(",")) : []
          const isDeclarationMode = req.supplierMode === "declaration"
          
          // Helper: Übersetze Rolle ins Deutsche
          const roleLabel = getPartnerRoleLabel(req.partnerRole)
          
          // Wenn fieldInstances vorhanden sind, markiere nur diese spezifischen Felder
          if (req.fieldInstances && Array.isArray(req.fieldInstances) && req.fieldInstances.length > 0) {
            console.log("[DppEditor] Processing fieldInstances:", req.fieldInstances.length)
            req.fieldInstances.forEach(fi => {
              // Finde das Feld im Template, um den field.key zu bekommen
              template.blocks.forEach(block => {
                block.fields.forEach(field => {
                  if (field.id === fi.fieldId) {
                    // Für input mode: Nur wenn Feld tatsächlich einen Wert hat (vom Supplier befüllt)
                    // Für declaration mode: IMMER anzeigen wenn zugewiesen und submitted (geprüfte Daten sind bereits vorhanden)
                    const hasValue = fieldValues[field.key] !== undefined && fieldValues[field.key] !== null && fieldValues[field.key] !== ""
                    const shouldShow = isDeclarationMode ? true : hasValue
                    
                    if (shouldShow) {
                      // Nur wenn noch keine Info vorhanden ist (erster Beteiligter hat Vorrang)
                      if (!supplierFieldInfo[field.key]) {
                        // Für declaration mode: confirmed ist IMMER true wenn submitted
                        // Für input mode: confirmed kommt aus localStorage
                        const isConfirmed = isDeclarationMode ? true : confirmedFields.has(field.key)
                        
                        supplierFieldInfo[field.key] = { 
                          partnerRole: roleLabel,
                          confirmed: isConfirmed,
                          mode: isDeclarationMode ? "declaration" : "input"
                        }
                        console.log("[DppEditor] Added supplier info for field:", field.key, "role:", roleLabel, "confirmed:", isConfirmed, "mode:", req.supplierMode, "hasValue:", hasValue, "shouldShow:", shouldShow)
                      }
                    } else {
                      console.log("[DppEditor] Skipping field (no value):", field.key)
                    }
                  }
                })
              })
            })
          } else if (blockIdsArray.length > 0) {
            // Wenn blockIds vorhanden sind, prüfe nur Felder, die tatsächlich Werte haben
            console.log("[DppEditor] Processing blockIds:", blockIdsArray)
            template.blocks.forEach(block => {
              if (blockIdsArray.includes(block.id)) {
                block.fields.forEach(field => {
                  // Für input mode: Nur wenn Feld tatsächlich einen Wert hat (vom Supplier befüllt)
                  // Für declaration mode: IMMER anzeigen wenn zugewiesen und submitted (geprüfte Daten sind bereits vorhanden)
                  const hasValue = fieldValues[field.key] !== undefined && fieldValues[field.key] !== null && fieldValues[field.key] !== ""
                  const shouldShow = isDeclarationMode ? true : hasValue
                  
                  if (shouldShow) {
                    // Nur wenn noch keine Info vorhanden ist (erster Beteiligter hat Vorrang)
                    if (!supplierFieldInfo[field.key]) {
                      // Für declaration mode: confirmed ist IMMER true wenn submitted
                      // Für input mode: confirmed kommt aus localStorage
                      const isConfirmed = isDeclarationMode ? true : confirmedFields.has(field.key)
                      
                      supplierFieldInfo[field.key] = { 
                        partnerRole: roleLabel,
                        confirmed: isConfirmed,
                        mode: isDeclarationMode ? "declaration" : "input"
                      }
                      console.log("[DppEditor] Added supplier info for field:", field.key, "role:", roleLabel, "confirmed:", isConfirmed, "mode:", req.supplierMode, "from block:", block.id, "hasValue:", hasValue, "shouldShow:", shouldShow)
                    }
                  } else {
                    console.log("[DppEditor] Skipping field (no value):", field.key, "from block:", block.id)
                  }
                })
              }
            })
          }
        })
        
        console.log("[DppEditor] Final supplierFieldInfo:", supplierFieldInfo)
        const templateFields = template.blocks.flatMap(block => block.fields.map(f => ({ key: f.key, id: f.id, label: f.label, blockId: block.id })))
        console.log("[DppEditor] Template fields:", templateFields)
        console.log("[DppEditor] Looking for fields with keys:", Object.keys(supplierFieldInfo))
        templateFields.forEach(f => {
          if (supplierFieldInfo[f.key]) {
            console.log("[DppEditor] MATCH FOUND - Field", f.key, "has supplier info:", supplierFieldInfo[f.key])
          }
        })
        
        // TEIL 6: Bestätigungsfunktion
        const handleSupplierInfoConfirm = (fieldKey: string) => {
          if (!dpp.id || dpp.id === "new") return
          try {
            const stored = localStorage.getItem(`dpp-${dpp.id}-confirmed-fields`)
            const confirmedFields = stored ? new Set(JSON.parse(stored)) : new Set<string>()
            confirmedFields.add(fieldKey)
            localStorage.setItem(`dpp-${dpp.id}-confirmed-fields`, JSON.stringify(Array.from(confirmedFields)))
            // In production: API call to save confirmation status
            // Trigger re-render by reloading (temporary)
            window.location.reload()
          } catch (error) {
            console.error("[DppEditor] Error confirming supplier info:", error)
          }
        }
        
        // Debug: Log Medien vor Übergabe an TemplateBlocksSection
        const mediaDetails = dpp.media.map((m: any) => ({
          id: m.id,
          fileName: m.fileName,
          fileType: m.fileType,
          blockId: m.blockId,
          fieldId: m.fieldId,
          storageUrl: m.storageUrl,
          hasBlockId: !!m.blockId,
          hasFieldId: !!m.fieldId,
          blockIdType: typeof m.blockId,
          fieldIdType: typeof m.fieldId,
          blockIdValue: m.blockId,
          fieldIdValue: m.fieldId,
          isImage: m.fileType?.startsWith("image/")
        }))
        console.log("[DppEditor] Passing media to TemplateBlocksSection:", {
          mediaCount: dpp.media.length,
          mediaDetails: mediaDetails
        })
        
        return (
          <TemplateBlocksSection
            template={template}
            dppId={dpp.id && dpp.id !== "new" ? dpp.id : null}
            media={dpp.media}
            onMediaChange={refreshMedia}
            blockSupplierConfigs={blockSupplierConfigs}
            fieldInstances={fieldInstances}
            onFieldInstancesChange={(fieldKey, instances) => {
              setFieldInstances(prev => ({
                ...prev,
                [fieldKey]: instances
              }))
              // TODO: Speichere Instanzen in DppContent
            }}
            fieldValues={fieldValues}
            supplierFieldInfo={supplierFieldInfo}
            onSupplierInfoConfirm={handleSupplierInfoConfirm}
            onFieldValueChange={(templateKey, value) => {
            // WICHTIG: fieldKey ist der Template-Feld-Key (kann deutsch oder englisch sein)
            // Wir speichern den Wert mit dem Template-Key
            // Für Kompatibilität speichern wir auch den englischen Key, falls Mapping existiert
            
            // Mapping von Template-Keys zu englischen Keys (für Fallback-Mechanismus)
            const englishKeyMapping: Record<string, string> = {
              // Alte deutsche Keys → englische Keys
              "produktname": "name",
              "beschreibung": "description",
              "herstellungsland": "countryOfOrigin",
              "ean": "gtin",
              // Neue englische Keys bleiben gleich
              "name": "name",
              "description": "description",
              "countryOfOrigin": "countryOfOrigin",
              "gtin": "gtin",
              "sku": "sku",
              "brand": "brand"
            }
            
            const englishKey = englishKeyMapping[templateKey.toLowerCase()] || templateKey
            
            setFieldValues(prev => {
              // Speichere mit Template-Key (für Content-API)
              const updated = {
                ...prev,
                [templateKey]: value
              }
              
              // Speichere auch mit englischem Key (für Fallback-Mechanismus und Konsistenz)
              if (englishKey !== templateKey) {
                updated[englishKey] = value
              }
              
              console.log("[DppEditor] Field value updated in state:", templateKey, "=", value, "| also saved as:", englishKey !== templateKey ? englishKey : "same")
              console.log("[DppEditor] Updated fieldValues keys:", Object.keys(updated))
              
              return updated
            })
          }}
          onEditSupplierConfig={(blockId) => {
            // Öffne Modal für Bearbeitung/Anzeige (Block-spezifisch)
            // TODO: Block-Vorselektion im Modal implementieren
            setShowSupplierInviteModal(true)
          }}
          pendingFiles={pendingFiles}
          onPendingFileAdd={(pendingFile) => {
            setPendingFiles(prev => [...prev, pendingFile])
          }}
          onPendingFileRemove={(fileId) => {
            setPendingFiles(prev => prev.filter(pf => pf.id !== fileId))
          }}
          onSupplierConfigUpdate={async (blockId, enabled, mode) => {
            // Für neue DPPs: Config im State speichern, wird beim Speichern übernommen
            if (isNew || !dpp.id || dpp.id === "new") {
              setBlockSupplierConfigs(prev => ({
                ...prev,
                [blockId]: {
                  enabled,
                  mode: mode || "input",
                  allowedRoles: []
                }
              }))
              showNotification(
                enabled ? "Verantwortung zugewiesen (wird beim Speichern übernommen)" : "Verantwortung entfernt",
                "success"
              )
              return
            }

            try {
              const response = await fetch(`/api/app/dpp/${dpp.id}/supplier-config`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  blockId,
                  enabled,
                  mode: mode || "input",
                  allowedRoles: []
                })
              })

              if (response.ok) {
                // API gibt { success: true } zurück, verwende die gesendeten Werte
                setBlockSupplierConfigs(prev => ({
                  ...prev,
                  [blockId]: {
                    enabled,
                    mode: mode || "input",
                    allowedRoles: []
                  }
                }))
                showNotification(
                  enabled ? "Verantwortung zugewiesen" : "Verantwortung entfernt",
                  "success"
                )
              } else {
                const errorData = await response.json()
                showNotification(errorData.error || "Fehler beim Aktualisieren", "error")
              }
            } catch (error: any) {
              showNotification(error.message || "Fehler beim Aktualisieren", "error")
            }
          }}
        />
        )
      })()}

      {/* Hinweis wenn gar kein Template vorhanden (nur wenn wirklich keine Templates existieren) */}
      {!template && !templateLoading && category && propCategories && propCategories.length === 0 && (
          <div style={{
          backgroundColor: "#FFFFFF",
          padding: "clamp(2rem, 5vw, 4rem)",
          borderRadius: "12px",
          border: "1px solid #CDCDCD",
          textAlign: "center",
          marginBottom: "2rem"
        }}>
          <p style={{
            color: "#0A0A0A",
            fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
            fontWeight: "600",
            marginBottom: "1rem"
          }}>
            Keine Vorlage verfügbar
          </p>
          <p style={{
            color: "#7A7A7A",
            fontSize: "clamp(0.95rem, 2vw, 1.1rem)",
            marginBottom: "1.5rem"
          }}>
            Es gibt noch keine Vorlage zur Erstellung eines Digitalen Produktpasses.
          </p>
          <p style={{
            color: "#7A7A7A",
            fontSize: "clamp(0.9rem, 2vw, 1rem)"
          }}>
            Bitte kontaktieren Sie einen Administrator, um eine Vorlage zu erstellen.
          </p>
        </div>
      )}

      {/* Lade-Zustand */}
      {templateLoading && (
      <div style={{
        backgroundColor: "#FFFFFF",
          padding: "clamp(2rem, 5vw, 4rem)",
        borderRadius: "12px",
        border: "1px solid #CDCDCD",
          textAlign: "center",
        marginBottom: "2rem"
      }}>
          <LoadingSpinner message={isNew ? "Vorlage wird geladen..." : "Digitaler Produktpass wird geladen..."} />
      </div>
      )}

      {/* Alte feste Sektionen - ENTFERNT: Nur Templates bilden die Basis
      Die folgenden Sektionen wurden entfernt, da nur Templates die Basis für die Befüllung bilden.
      Falls benötigt, können sie aus der Git-Historie wiederhergestellt werden.
      Alle alten AccordionSection-Komponenten (Basis- & Produktdaten, Materialien, Nutzung, Rechtliches, Rücknahme)
      wurden entfernt und durch TemplateBlocksSection ersetzt.
      */}

      {/* Medien & Dokumente (Legacy - ENTFERNT: Nur Templates bilden die Basis)
      Die folgenden Sektionen wurden entfernt, da nur Templates die Basis für die Befüllung bilden.
      Falls benötigt, können sie aus der Git-Historie wiederhergestellt werden.
      */}

      {/* Bottom padding für Sticky Save Bar + Floating Control */}
      {/* Save Bar: ~140px + Floating Button: ~80px (mit Badge) + Extra: 20px = 240px */}
      <div style={{ height: "180px" }} />
    </div>

    {/* Sticky Save Bar - nur anzeigen wenn Vorlage geladen ist */}
    {!templateLoading && (template || !isNew) && (
    <StickySaveBar
      status={saveStatus}
      lastSaved={lastSaved}
      onSave={handleSave}
      onPublish={handlePublish}
      isNew={isNew}
      canPublish={!!name.trim()}
      subscriptionCanPublish={subscriptionCanPublish}
      error={saveError}
    />
    )}
    
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
                boxShadow: "0 4px 12px rgba(226, 0, 116, 0.3)"
              }}
            >
              Trotzdem verlassen
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Lieferant einladen Modal */}
    {/* Supplier Invite Modal */}
    {template && (
      <SupplierInviteModal
        isOpen={showSupplierInviteModal}
        onClose={() => setShowSupplierInviteModal(false)}
        template={template}
        dppId={dpp.id && dpp.id !== "new" ? dpp.id : null}
        blockSupplierConfigs={blockSupplierConfigs}
        existingInvites={(() => {
          const mapped = dataRequests.map(req => {
            let blockIdsArray: string[] | undefined = undefined
            if (req.blockIds) {
              if (Array.isArray(req.blockIds)) {
                blockIdsArray = req.blockIds
              } else if (typeof req.blockIds === 'string') {
                blockIdsArray = req.blockIds.split(",")
              }
            }
            return {
              id: req.id,
              email: req.email,
              partnerRole: req.partnerRole || "Other",
              blockIds: blockIdsArray,
              fieldInstances: req.fieldInstances || undefined,
              supplierMode: (req as any).supplierMode || undefined,
              status: req.status,
              emailSentAt: (req as any).emailSentAt || null
            }
          })
          console.log("[DppEditor] Mapping existingInvites - dpp.id:", dpp.id, "dataRequests.length:", dataRequests.length, "mapped.length:", mapped.length)
          return mapped
        })()}
        onSubmit={async (invite) => {
          if (!dpp.id || dpp.id === "new") {
            showNotification("Bitte speichern Sie den DPP zuerst, um Partner einbinden zu können", "error")
            return
          }

          setSupplierInviteLoading(true)
          try {
            const response = await fetch(`/api/app/dpp/${dpp.id}/data-requests`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: invite.email,
                partnerRole: invite.role || "Other",
                mode: invite.mode || "contribute", // "contribute" = beisteuern, "review" = prüfen & bestätigen
                blockIds: invite.selectedBlocks,
                fieldInstances: invite.selectedFieldInstances,
                message: invite.message || null,
                sendEmail: invite.sendEmail !== false // Default: true (für Backward Compatibility)
              })
            })

            const data = await response.json()

            if (!response.ok) {
              throw new Error(data.error || "Fehler beim Erstellen der Einladung")
            }

            // Prüfe, ob E-Mail versendet wurde
            if (data.emailSent === false || data.emailError) {
              const errorMsg = data.emailError 
                ? `Einladung erstellt, aber E-Mail konnte nicht versendet werden: ${data.emailError}` 
                : "Einladung erstellt, aber E-Mail konnte nicht versendet werden"
              showNotification(errorMsg, "error")
            } else {
              // Nur Erfolgsmeldung anzeigen, wenn E-Mail erfolgreich versendet wurde
              // (Das Modal zeigt bereits eine Erfolgsmeldung)
            }

            // Multi-Invite-Flow: Modal bleibt offen, Notification wird im Modal angezeigt
            // Notification wird bereits im Modal angezeigt, hier nur für Fallback
            
            // Reload data requests für aktualisierte Liste (mit no-cache für neueste Daten)
            const requestsResponse = await fetch(`/api/app/dpp/${dpp.id}/data-requests`, {
              cache: "no-store",
              headers: {
                "Cache-Control": "no-cache"
              }
            })
            if (requestsResponse.ok) {
              const requestsData = await requestsResponse.json()
              console.log("[DppEditor] Reloaded data requests:", requestsData.requests?.length || 0, requestsData.requests)
              setDataRequests(requestsData.requests || [])
            }
          } catch (error: any) {
            showNotification(error.message || "Fehler beim Erstellen der Einladung", "error")
          } finally {
            setSupplierInviteLoading(false)
          }
        }}
        onInviteSuccess={() => {
          // Reload data requests nach erfolgreicher Einladung (mit no-cache für neueste Daten)
          if (dpp.id && dpp.id !== "new") {
            fetch(`/api/app/dpp/${dpp.id}/data-requests`, {
              cache: "no-store",
              headers: {
                "Cache-Control": "no-cache"
              }
            })
              .then(res => res.json())
              .then(data => {
                console.log("[DppEditor] onInviteSuccess - Reloaded data requests:", data.requests?.length || 0, data.requests)
                setDataRequests(data.requests || [])
              })
              .catch((err) => {
                console.error("[DppEditor] Error reloading data requests:", err)
              })
          }
        }}
        onSendPendingInvites={async () => {
          if (!dpp.id || dpp.id === "new") {
            showNotification("Bitte speichern Sie den DPP zuerst", "error")
            return
          }

          setSupplierInviteLoading(true)
          try {
            const response = await fetch(`/api/app/dpp/${dpp.id}/data-requests/send-pending`, {
              method: "POST",
            })

            const data = await response.json()

            if (!response.ok) {
              throw new Error(data.error || "Fehler beim Versenden der E-Mails")
            }

            showNotification(
              data.message || `${data.sentCount} E-Mail${data.sentCount > 1 ? "s" : ""} erfolgreich versendet`,
              "success"
            )

            // Reload data requests (mit no-cache für neueste Daten)
            if (dpp.id && dpp.id !== "new") {
              fetch(`/api/app/dpp/${dpp.id}/data-requests`, {
                cache: "no-store",
                headers: {
                  "Cache-Control": "no-cache"
                }
              })
                .then(res => res.json())
                .then(requestsData => {
                  console.log("[DppEditor] onSendPendingInvites - Reloaded data requests:", requestsData.requests?.length || 0, requestsData.requests)
                  setDataRequests(requestsData.requests || [])
                })
                .catch((err) => {
                  console.error("[DppEditor] Error reloading data requests:", err)
                })
            }
          } catch (error: any) {
            showNotification(error.message || "Fehler beim Versenden der E-Mails", "error")
          } finally {
            setSupplierInviteLoading(false)
          }
        }}
        onRemoveInvite={async (inviteId: string) => {
          if (!dpp.id || dpp.id === "new") {
            showNotification("Bitte speichern Sie den DPP zuerst", "error")
            return
          }

          setSupplierInviteLoading(true)
          try {
            const response = await fetch(`/api/app/dpp/${dpp.id}/data-requests?requestId=${inviteId}`, {
              method: "DELETE"
            })

            const data = await response.json()

            if (!response.ok) {
              throw new Error(data.error || "Fehler beim Entfernen des Beteiligten")
            }

            showNotification("Beteiligter erfolgreich entfernt", "success")

            // Reload data requests (mit no-cache für neueste Daten)
            const requestsResponse = await fetch(`/api/app/dpp/${dpp.id}/data-requests`, {
              cache: "no-store",
              headers: {
                "Cache-Control": "no-cache"
              }
            })
            if (requestsResponse.ok) {
              const requestsData = await requestsResponse.json()
              console.log("[DppEditor] onRemoveInvite - Reloaded data requests:", requestsData.requests?.length || 0, requestsData.requests)
              setDataRequests(requestsData.requests || [])
            }
          } catch (error: any) {
            showNotification(error.message || "Fehler beim Entfernen des Beteiligten", "error")
          } finally {
            setSupplierInviteLoading(false)
          }
        }}
        loading={supplierInviteLoading}
        fieldInstances={fieldInstances}
      />
    )}

    </>
  )
}

