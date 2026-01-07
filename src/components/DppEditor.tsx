"use client"

import React, { useState, useEffect, Fragment } from "react"
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
  
  // State für alle Felder
  const [dpp, setDpp] = useState(initialDpp)
  const [name, setName] = useState(initialDpp.name)
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

  // Template State
  interface TemplateBlock {
    id: string
    name: string
    order: number
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

  // Accordion State (Sektion 1 immer offen)
  const [section2Open, setSection2Open] = useState(false)
  const [section3Open, setSection3Open] = useState(false)
  const [section4Open, setSection4Open] = useState(false)
  const [section5Open, setSection5Open] = useState(false)
  
  // Data Request Form State
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
          const response = await fetch(`/api/app/dpp/template-by-category?category=${encodeURIComponent(category)}`, {
            cache: "force-cache" // Cache für bessere Performance
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
      const response = await fetch(`/api/app/dpp/${dpp.id}/media`)
      if (response.ok) {
        const data = await response.json()
        setDpp(prev => ({ ...prev, media: data.media }))
      }
    } catch (error) {
    }
  }

  // Speichere DPP-Daten (Draft Save)
  const handleSave = async () => {
    setSaveStatus("saving")
    setSaveError(null)
    
    try {
      if (isNew) {
        // Neuer DPP: Erstellen
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
          // Erfolgreich gespeichert
          setLastSaved(new Date())
          setSaveStatus("saved")
          showNotification("Entwurf gespeichert", "success")
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
    if (!name.trim()) {
      showNotification("Produktname ist erforderlich für die Veröffentlichung", "error")
      return
    }

    setSaveStatus("publishing")
    setSaveError(null)
    
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
              }
            })
            
            await Promise.all(uploadPromises)
            setPendingFiles([])
          } catch (uploadError) {
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
        <TrialBanner
          organizationId={dpp.organizationId}
          trialEndDate={subscription.trialExpiresAt}
        />
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

      {/* Template-Blöcke (dynamisch basierend auf Template) */}
      {template && !templateLoading && (
        <TemplateBlocksSection
          template={template}
          dppId={dpp.id && dpp.id !== "new" ? dpp.id : null}
          media={dpp.media}
          onMediaChange={refreshMedia}
        />
      )}

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
          <LoadingSpinner message="Vorlage wird geladen..." />
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

      {/* Bottom padding für Sticky Save Bar */}
      <div style={{ height: "120px" }} />
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
    </>
  )
}
