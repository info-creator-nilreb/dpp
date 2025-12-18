"use client"

import { useState, useEffect, Fragment } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import DppMediaSection from "@/components/DppMediaSection"
import CountrySelect from "@/components/CountrySelect"
import { useNotification } from "@/components/NotificationProvider"
import InputField from "@/components/InputField"
import StickySaveBar from "@/components/StickySaveBar"

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
  category: "TEXTILE" | "FURNITURE" | "OTHER"
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
}

/**
 * Accordion-Sektion Komponente
 */
function AccordionSection({
  title,
  isOpen,
  onToggle,
  children,
  alwaysOpen = false
}: {
  title: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
  alwaysOpen?: boolean
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
          textAlign: "left"
        }}
      >
        <h2 style={{
          fontSize: "clamp(1.1rem, 3vw, 1.25rem)",
          fontWeight: "700",
          color: "#0A0A0A",
          margin: 0
        }}>
          {title}
        </h2>
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
export default function DppEditor({ dpp: initialDpp, isNew = false }: DppEditorProps) {
  const router = useRouter()
  const { showNotification } = useNotification()
  
  // State für alle Felder
  const [dpp, setDpp] = useState(initialDpp)
  const [name, setName] = useState(initialDpp.name)
  const [description, setDescription] = useState(initialDpp.description || "")
  const [category, setCategory] = useState<"TEXTILE" | "FURNITURE" | "OTHER">(initialDpp.category || "OTHER")
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

  // Accordion State (Sektion 1 immer offen)
  const [section2Open, setSection2Open] = useState(false)
  const [section3Open, setSection3Open] = useState(false)
  const [section4Open, setSection4Open] = useState(false)
  const [section5Open, setSection5Open] = useState(false)
  
  // Save Status für Sticky Save Bar
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "publishing" | "error">("idle")
  const [lastSaved, setLastSaved] = useState<Date | null>(isNew ? null : initialDpp.updatedAt)
  const [saveError, setSaveError] = useState<string | null>(null)
  
  // Pending Files für neue DPPs (zwischengespeichert bis zum Speichern)
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])

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
      console.error("Error refreshing media:", error)
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
        
        // Lade zwischengespeicherte Dateien hoch
        if (pendingFiles.length > 0) {
          try {
            const uploadPromises = pendingFiles.map(async (pendingFile) => {
              const formData = new FormData()
              formData.append("file", pendingFile.file)
              
              const uploadResponse = await fetch(`/api/app/dpp/${newDppId}/media`, {
                method: "POST",
                body: formData
              })
              
              if (!uploadResponse.ok) {
                console.error(`Fehler beim Hochladen von ${pendingFile.file.name}`)
              }
            })
            
            await Promise.all(uploadPromises)
            // Pending files zurücksetzen, da sie jetzt hochgeladen sind
            setPendingFiles([])
            // Medien-Liste aktualisieren
            await refreshMedia()
          } catch (uploadError) {
            console.error("Fehler beim Hochladen der zwischengespeicherten Dateien:", uploadError)
            // Fehler wird ignoriert, da der DPP bereits gespeichert ist
          }
        }
        
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
  const SelectField = ({ id, label, value, onChange, options, required = false }: {
    id: string
    label: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
    options: Array<{ value: string; label: string }>
    required?: boolean
  }) => (
    <div style={{ marginBottom: "1.5rem" }}>
      <label htmlFor={id} style={{
        display: "block",
        fontSize: "clamp(0.9rem, 2vw, 1rem)",
        fontWeight: "600",
        color: "#0A0A0A",
        marginBottom: "0.5rem"
      }}>
        {label} {required && <span style={{ color: "#E20074" }}>*</span>}
      </label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        style={{
          width: "100%",
          padding: "clamp(0.75rem, 2vw, 1rem)",
          fontSize: "clamp(0.9rem, 2vw, 1rem)",
          border: "1px solid #CDCDCD",
          borderRadius: "8px",
          backgroundColor: "#FFFFFF",
          color: "#0A0A0A",
          boxSizing: "border-box"
        }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )

  return (
    <Fragment>
    <div>
      <div style={{
        marginBottom: "1rem"
      }}>
        <Link
          href="/app/dashboard"
          style={{
            color: "#7A7A7A",
            textDecoration: "none",
            fontSize: "clamp(0.9rem, 2vw, 1rem)"
          }}
        >
          ← Zum Dashboard
        </Link>
      </div>
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
        <SelectField
          id="dpp-category"
          label="Produktkategorie"
          value={category}
          onChange={(e) => setCategory(e.target.value as "TEXTILE" | "FURNITURE" | "OTHER")}
          required
          options={[
            { value: "TEXTILE", label: "Textil" },
            { value: "FURNITURE", label: "Möbel" },
            { value: "OTHER", label: "Sonstiges" }
          ]}
        />
        <InputField
          id="dpp-name"
          label="Produktname"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <InputField
          id="dpp-description"
          label="Beschreibung"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
        <InputField
          id="dpp-sku"
          label="SKU / Interne ID"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          required
        />
        <InputField
          id="dpp-gtin"
          label="GTIN / EAN"
          value={gtin}
          onChange={(e) => setGtin(e.target.value)}
        />
        <InputField
          id="dpp-brand"
          label="Marke / Hersteller"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          required
        />
        <CountrySelect
          id="dpp-country-of-origin"
          label="Herstellungsland"
          value={countryOfOrigin}
          onChange={setCountryOfOrigin}
          required
        />
      </AccordionSection>

      {/* 2. Materialien & Zusammensetzung */}
      <AccordionSection
        title="Materialien & Zusammensetzung"
        isOpen={section2Open}
        onToggle={() => setSection2Open(!section2Open)}
      >
        <InputField
          id="dpp-materials"
          label="Materialliste"
          value={materials}
          onChange={(e) => setMaterials(e.target.value)}
          rows={4}
        />
        <InputField
          id="dpp-material-source"
          label="Datenquelle (z. B. Lieferant)"
          value={materialSource}
          onChange={(e) => setMaterialSource(e.target.value)}
        />
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
          onChange={(e) => setCareInstructions(e.target.value)}
          rows={3}
        />
        <SelectField
          id="dpp-is-repairable"
          label="Reparierbarkeit"
          value={isRepairable}
          onChange={(e) => setIsRepairable(e.target.value)}
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
          onChange={(e) => setSparePartsAvailable(e.target.value)}
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
          onChange={(e) => setLifespan(e.target.value)}
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
          onChange={(e) => setConformityDeclaration(e.target.value)}
          rows={4}
        />
        <InputField
          id="dpp-disposal"
          label="Hinweise zu Entsorgung / Recycling"
          value={disposalInfo}
          onChange={(e) => setDisposalInfo(e.target.value)}
          rows={3}
        />
        <div style={{ marginTop: "1.5rem" }}>
          <p style={{
            fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
            color: "#7A7A7A",
            marginBottom: "1rem"
          }}>
            Zertifikate können über den Medien-Upload hochgeladen werden.
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
          onChange={(e) => setTakebackOffered(e.target.value)}
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
            onChange={(e) => setTakebackContact(e.target.value)}
          />
        )}
        <InputField
          id="dpp-second-life"
          label="Second-Life-Informationen"
          value={secondLifeInfo}
          onChange={(e) => setSecondLifeInfo(e.target.value)}
          rows={3}
        />
      </AccordionSection>

      {/* Medien & Dokumente */}
      <div style={{
        backgroundColor: "#FFFFFF",
        padding: "clamp(1.5rem, 4vw, 2rem)",
        borderRadius: "12px",
        border: "1px solid #CDCDCD",
        marginBottom: "2rem"
      }}>
        <h2 style={{
          fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
          fontWeight: "700",
          color: "#0A0A0A",
          marginBottom: "1rem"
        }}>
          Medien & Dokumente
        </h2>
        <DppMediaSection 
          dppId={dpp.id && dpp.id !== "new" ? dpp.id : null} 
          media={dpp.media} 
          onMediaChange={refreshMedia}
          pendingFiles={pendingFiles}
          onPendingFilesChange={setPendingFiles}
        />
      </div>

      {/* Bottom padding für Sticky Save Bar */}
      <div style={{ height: "100px" }} />
    </div>

    {/* Sticky Save Bar */}
    <StickySaveBar
      status={saveStatus}
      lastSaved={lastSaved}
      onSave={handleSave}
      onPublish={handlePublish}
      isNew={isNew}
      canPublish={!!name.trim()}
      error={saveError}
    />
    </Fragment>
  )
}
