"use client"

/**
 * Template Editor Content (Client Component)
 * 
 * Editable form for template editing
 * Receives template data as props (no client-side fetching)
 */

import { useState, useEffect, Fragment } from "react"
import { useRouter } from "next/navigation"
import { createNewTemplateVersion } from "./actions"
import ConfirmDialog from "@/components/ConfirmDialog"
import { useNotification } from "@/components/NotificationProvider"

interface TemplateBlock {
  id: string
  name: string
  order: number
  // ENTFERNT: supplierConfig - wird jetzt pro DPP konfiguriert, nicht im Template
  fields: TemplateField[]
}

interface TemplateField {
  id: string
  label: string
  key: string
  type: string
  required: boolean
  config: string | null
  order: number
  isRepeatable?: boolean
}

interface Template {
  id: string
  name: string
  category: string | null
  categoryLabel: string | null
  industry: string | null
  version: number
  status: string
  description: string | null
  effectiveFrom: Date | null
  supersedesVersion: number | null
  blocks: TemplateBlock[]
  updatedAt: Date
}

interface TemplateEditorContentProps {
  template: Template
  canEdit: boolean
}

const fieldTypes = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Mehrzeiliger Text" },
  { value: "number", label: "Zahl" },
  { value: "select", label: "Auswahl" },
  { value: "multi-select", label: "Mehrfachauswahl" },
  { value: "boolean", label: "Ja/Nein" },
  { value: "date", label: "Datum" },
  { value: "url", label: "URL" },
  { value: "file", label: "Datei (alle Typen)" },
  { value: "file-image", label: "Bild (JPG, PNG, WebP)" },
  { value: "file-document", label: "Dokument (PDF)" },
  { value: "file-video", label: "Video" },
  { value: "country", label: "Land (ISO-3166)" },
  { value: "reference", label: "Referenz" }
]

const statusOptions = [
  { value: "draft", label: "Entwurf" },
  { value: "active", label: "Aktiv" },
  { value: "archived", label: "Archiviert" }
]

export default function TemplateEditorContent({ template, canEdit }: TemplateEditorContentProps) {
  const router = useRouter()
  const { showNotification } = useNotification()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [creatingNewVersion, setCreatingNewVersion] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [archiving, setArchiving] = useState(false)

  // CRITICAL: Only drafts can be edited
  const isEditable = template.status === "draft" && canEdit
  const isActive = template.status === "active"
  const isArchived = template.status === "archived"

  const [name, setName] = useState(template.name)
  const [description, setDescription] = useState(template.description || "")
  const [status, setStatus] = useState(template.status)
  
  // CRITICAL: Filter out category fields (ESPR: category is not a field, it's a template property)
  const filteredBlocks = template.blocks.map(block => ({
    ...block,
    // ENTFERNT: supplierConfig - wird jetzt pro DPP konfiguriert
    fields: block.fields.filter(field => {
      const keyLower = field.key?.toLowerCase() || ""
      const labelLower = field.label?.toLowerCase() || ""
      return !keyLower.includes("category") && 
             !keyLower.includes("kategorie") &&
             !labelLower.includes("kategorie") &&
             !labelLower.includes("category")
    })
  }))
  
  const [blocks, setBlocks] = useState<TemplateBlock[]>(filteredBlocks)
  const [editingFieldOptions, setEditingFieldOptions] = useState<string | null>(null) // fieldId that is currently editing options
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  
  // Listen for sidebar collapse state changes
  useEffect(() => {
    const checkSidebar = () => {
      const mainContent = document.querySelector('.super-admin-main-content') as HTMLElement
      if (mainContent) {
        const marginLeft = window.getComputedStyle(mainContent).marginLeft
        setIsSidebarCollapsed(marginLeft === "64px")
      }
    }
    checkSidebar()
    const interval = setInterval(checkSidebar, 100)
    return () => clearInterval(interval)
  }, [])

  // Helper: Generate English key from German label
  // This ensures consistency with DPP column keys (name, description, countryOfOrigin, etc.)
  const generateKeyFromLabel = (label: string): string => {
    if (!label) return ""
    
    // Mapping von deutschen Labels zu englischen Standard-Keys
    // Dies sorgt für Konsistenz mit DPP-Spalten-Keys
    const labelMapping: Record<string, string> = {
      // Basis- & Produktdaten
      "produktname": "name",
      "produkt name": "name",
      "name": "name",
      "beschreibung": "description",
      "description": "description",
      "sku": "sku",
      "sku / interne id": "sku",
      "interne id": "sku",
      "gtin": "gtin",
      "ean": "gtin",
      "gtin / ean": "gtin",
      "marke": "brand",
      "hersteller": "brand",
      "marke / hersteller": "brand",
      "brand": "brand",
      "herstellungsland": "countryOfOrigin",
      "country of origin": "countryOfOrigin",
      "countryoforigin": "countryOfOrigin",
      // Materialien & Zusammensetzung
      "materialliste": "materials",
      "materialien": "materials",
      "materials": "materials",
      "datenquelle": "materialSource",
      "materialquelle": "materialSource",
      "material source": "materialSource",
      // Nutzung, Pflege & Lebensdauer
      "pflegehinweise": "careInstructions",
      "pflege": "careInstructions",
      "care instructions": "careInstructions",
      "lebensdauer": "lifespan",
      "lifespan": "lifespan",
      "reparierbarkeit": "isRepairable",
      "reparierbar": "isRepairable",
      "is repairable": "isRepairable",
      "ersatzteile verfügbar": "sparePartsAvailable",
      "spare parts available": "sparePartsAvailable",
      // Rechtliches & Konformität
      "konformitätserklärung": "conformityDeclaration",
      "conformity declaration": "conformityDeclaration",
      "entsorgungsinformationen": "disposalInfo",
      "disposal info": "disposalInfo",
      // Rücknahme & Second Life
      "rücknahme angeboten": "takebackOffered",
      "takeback offered": "takebackOffered",
      "rücknahmekontakt": "takebackContact",
      "takeback contact": "takebackContact",
      "second life informationen": "secondLifeInfo",
      "second life": "secondLifeInfo",
      "secondlifeinfo": "secondLifeInfo"
    }
    
    // Normalisiere Label für Mapping
    const normalizedLabel = label.toLowerCase().trim()
    
    // Prüfe zuerst direktes Mapping
    if (labelMapping[normalizedLabel]) {
      return labelMapping[normalizedLabel]
    }
    
    // Prüfe Teilstring-Matches (z.B. "Produktname" in "Produktname (Lang)")
    for (const [germanLabel, englishKey] of Object.entries(labelMapping)) {
      if (normalizedLabel.includes(germanLabel) || germanLabel.includes(normalizedLabel)) {
        return englishKey
      }
    }
    
    // Fallback: Generiere Key aus Label (camelCase, englisch-orientiert)
    // Versuche, deutsche Begriffe zu übersetzen
    const translationMap: Record<string, string> = {
      "produkt": "product",
      "name": "name",
      "beschreibung": "description",
      "land": "country",
      "herstellung": "origin",
      "material": "material",
      "quelle": "source",
      "pflege": "care",
      "hinweis": "instruction",
      "lebens": "life",
      "dauer": "span",
      "reparier": "repair",
      "konformität": "conformity",
      "erklärung": "declaration",
      "entsorgung": "disposal",
      "info": "info",
      "rücknahme": "takeback",
      "kontakt": "contact"
    }
    
    // Ersetze bekannte deutsche Begriffe
    let englishKey = normalizedLabel
    for (const [german, english] of Object.entries(translationMap)) {
      englishKey = englishKey.replace(new RegExp(german, "g"), english)
    }
    
    // Generiere camelCase Key
    return englishKey
      .replace(/[äöü]/g, (char) => {
        const map: Record<string, string> = { ä: "ae", ö: "oe", ü: "ue" }
        return map[char] || char
      })
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .replace(/_+/g, "_")
      .replace(/_([a-z])/g, (_, char) => char.toUpperCase())
      .replace(/^[a-z]/, (char) => char.toLowerCase())
  }

  const addBlock = () => {
    setBlocks([...blocks, {
      id: `new-${Date.now()}`,
      name: "",
      order: blocks.length,
      fields: []
    }])
  }

  const updateBlockName = (blockId: string, name: string) => {
    setBlocks(blocks.map(block =>
      block.id === blockId ? { ...block, name } : block
    ))
  }

  // ENTFERNT: updateSupplierConfig - Supplier-Config wird jetzt pro DPP konfiguriert

  const deleteBlock = (blockId: string) => {
    if (blocks.length > 1) {
      setBlocks(blocks.filter(block => block.id !== blockId))
    }
  }

  const addField = (blockId: string) => {
    setBlocks(blocks.map(block =>
      block.id === blockId
        ? {
            ...block,
            fields: [
              ...block.fields,
              {
                id: `new-field-${Date.now()}`,
                label: "",
                key: "",
                type: "text",
                required: false,
                config: null,
                order: block.fields.length,
                isRepeatable: false
              }
            ]
          }
        : block
    ))
  }
  
  // Validate field key to prevent category fields
  const validateFieldKey = (key: string): boolean => {
    const keyLower = key.toLowerCase()
    return !keyLower.includes("category") && !keyLower.includes("kategorie")
  }
  
  // Validate field label to prevent category fields
  const validateFieldLabel = (label: string): boolean => {
    const labelLower = label.toLowerCase()
    return !labelLower.includes("kategorie") && !labelLower.includes("category")
  }

  const updateField = (blockId: string, fieldId: string, updates: Partial<TemplateField>) => {
    setBlocks(blocks.map(block =>
      block.id === blockId
        ? {
            ...block,
            fields: block.fields.map(field =>
              field.id === fieldId ? { ...field, ...updates } : field
            )
          }
        : block
    ))
  }

  const deleteField = (blockId: string, fieldId: string) => {
    setBlocks(blocks.map(block =>
      block.id === blockId
        ? {
            ...block,
            fields: block.fields.filter(field => field.id !== fieldId)
          }
        : block
    ))
  }

  // Helper: Parse select options from config JSON
  const getSelectOptions = (config: string | null): Array<{ value: string; label: string; esprReference?: string }> => {
    if (!config) return []
    try {
      const parsed = JSON.parse(config)
      return parsed.options || []
    } catch {
      return []
    }
  }

  // Helper: Update select options in config
  const updateSelectOptions = (blockId: string, fieldId: string, options: Array<{ value: string; label: string; esprReference?: string }>) => {
    const field = blocks.find(b => b.id === blockId)?.fields.find(f => f.id === fieldId)
    const currentConfig = field?.config ? (typeof field.config === "string" ? JSON.parse(field.config) : field.config) : {}
    const newConfig = { ...currentConfig, options }
    updateField(blockId, fieldId, { config: JSON.stringify(newConfig) })
  }

  // Drag & Drop für Felder
  const handleFieldDragStart = (e: React.DragEvent, blockId: string, fieldId: string) => {
    setDraggedFieldId(fieldId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleFieldDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleFieldDrop = (e: React.DragEvent, targetBlockId: string, targetFieldId: string) => {
    e.preventDefault()
    if (!draggedFieldId) return

    const sourceBlock = blocks.find(b => b.fields.some(f => f.id === draggedFieldId))
    if (!sourceBlock) return

    const sourceField = sourceBlock.fields.find(f => f.id === draggedFieldId)
    if (!sourceField) return

    // Nur innerhalb desselben Blocks verschieben
    if (sourceBlock.id !== targetBlockId) {
      setDraggedFieldId(null)
      return
    }

    const targetFieldIndex = sourceBlock.fields.findIndex(f => f.id === targetFieldId)
    const sourceFieldIndex = sourceBlock.fields.findIndex(f => f.id === draggedFieldId)

    if (targetFieldIndex === -1 || sourceFieldIndex === -1) {
      setDraggedFieldId(null)
      return
    }

    // Felder neu anordnen und order aktualisieren
    const newFields = [...sourceBlock.fields]
    newFields.splice(sourceFieldIndex, 1)
    newFields.splice(targetFieldIndex, 0, sourceField)
    
    // Order-Werte aktualisieren
    newFields.forEach((field, index) => {
      field.order = index
    })

    setBlocks(blocks.map(block =>
      block.id === targetBlockId
        ? { ...block, fields: newFields }
        : block
    ))

    setDraggedFieldId(null)
  }

  const handleFieldDragEnd = () => {
    setDraggedFieldId(null)
  }

  // Block reordering functions
  const moveBlockUp = (blockIndex: number) => {
    // Block 0 (Basis- & Produktdaten) is always fixed, block 1 can only move down
    if (blockIndex <= 1 || blockIndex >= blocks.length) return
    const newBlocks = [...blocks]
    const temp = newBlocks[blockIndex]
    newBlocks[blockIndex] = newBlocks[blockIndex - 1]
    newBlocks[blockIndex - 1] = temp
    // Update order values
    newBlocks.forEach((block, idx) => {
      block.order = idx
    })
    setBlocks(newBlocks)
  }

  const moveBlockDown = (blockIndex: number) => {
    if (blockIndex >= blocks.length - 1) return
    const newBlocks = [...blocks]
    const temp = newBlocks[blockIndex]
    newBlocks[blockIndex] = newBlocks[blockIndex + 1]
    newBlocks[blockIndex + 1] = temp
    // Update order values
    newBlocks.forEach((block, idx) => {
      block.order = idx
    })
    setBlocks(newBlocks)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaved(false)
    setLoading(true)

    try {
      // Validate
      if (!name) {
        showNotification("Name ist erforderlich", "error")
        setLoading(false)
        return
      }

      // Validate blocks
      for (const block of blocks) {
        if (!block.name) {
          showNotification("Alle Blöcke benötigen einen Namen", "error")
          setLoading(false)
          return
        }
      }

      // Validate fields
      for (const block of blocks) {
        for (const field of block.fields) {
          if (!field.label) {
            showNotification("Alle Felder benötigen einen Label", "error")
            setLoading(false)
            return
          }
        }
      }

      // Prepare data - Filter out any category fields (safety check)
      // Generate keys automatically from labels if missing
      // WICHTIG: Status explizit setzen - bei Draft-Templates bleibt "draft", bei aktiven bleibt "active"
      const currentStatus = status || template.status || "draft"
      
      const templateData = {
        name,
        description: description || null,
        status: currentStatus, // Status explizit setzen
        blocks: blocks.map((block, blockIndex) => ({
          name: block.name,
          // ENTFERNT: supplierConfig - wird jetzt pro DPP konfiguriert
          fields: block.fields
            .filter(field => {
              const keyLower = field.key?.toLowerCase() || ""
              const labelLower = field.label?.toLowerCase() || ""
              return !keyLower.includes("category") && 
                     !keyLower.includes("kategorie") &&
                     !labelLower.includes("kategorie") &&
                     !labelLower.includes("category")
            })
                    .map((field, fieldIndex) => ({
                      label: field.label,
                      key: field.key || generateKeyFromLabel(field.label), // Auto-generate if missing
                      type: field.type,
                      required: field.required,
                      isRepeatable: field.isRepeatable || false,
                      config: field.config ? (typeof field.config === "string" ? JSON.parse(field.config) : field.config) : null
                    }))
        }))
      }

      const response = await fetch(`/api/super-admin/templates/${template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateData)
      })

      const data = await response.json()

      if (!response.ok) {
        showNotification(data.error || "Fehler beim Aktualisieren des Templates", "error")
        setLoading(false)
        return
      }
      

      // Aktualisiere den Status-State, falls sich der Status geändert hat
      if (data.template?.status && data.template.status !== status) {
        setStatus(data.template.status)
      }
      
      setSaved(true)
      setLoading(false)
      showNotification("Erfolgreich gespeichert", "success")
      
      // Keep success message visible for 3 seconds before refreshing
      setTimeout(() => {
        setSaved(false)
        router.refresh()
      }, 3000)
    } catch (err: any) {
      showNotification(err.message || "Ein Fehler ist aufgetreten", "error")
      setLoading(false)
    }
  }

  const handleCreateNewVersion = async () => {
    if (!isActive) {
      return
    }

    setCreatingNewVersion(true)
    setError(null)

    try {
      const result = await createNewTemplateVersion(template.id)
      
      if (result?.templateId) {
      // Redirect to new template editor
        showNotification("Neue Version erfolgreich erstellt", "success")
        // Use window.location for a full page reload to ensure fresh data
        window.location.href = `/super-admin/templates/${result.templateId}`
      } else {
        throw new Error("Keine Template-ID zurückgegeben")
      }
    } catch (err: any) {
      setCreatingNewVersion(false)
      showNotification(err.message || "Fehler beim Erstellen der neuen Version", "error")
    }
  }

  const handleArchive = async () => {
    setArchiving(true)
    setError(null)

    try {
      const response = await fetch(`/api/super-admin/templates/${template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          status: "archived"
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Fehler beim Archivieren")
      }

      showNotification("Template erfolgreich archiviert", "success")
      setShowArchiveDialog(false)
      
      // Refresh page to show updated status
      setTimeout(() => {
        router.refresh()
      }, 1000)
    } catch (err: any) {
      showNotification(err.message || "Fehler beim Archivieren", "error")
    } finally {
      setArchiving(false)
    }
  }

  // Show warning and "Create new version" button for active templates
  if (isActive || isArchived) {
    return (
      <div>
        {error && (
          <div style={{
            backgroundColor: "#FFF5F9",
            border: "1px solid #24c598",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "2rem",
            color: "#24c598",
            fontSize: "0.95rem"
          }}>
            {error}
          </div>
        )}

        <div style={{
          backgroundColor: "#FFF5F9",
          border: "1px solid #24c598",
          borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "2rem"
        }}>
          <h3 style={{
            fontSize: "1.25rem",
            fontWeight: "600",
            color: "#24c598",
            marginBottom: "0.5rem"
          }}>
            Template ist {isActive ? "aktiv" : "archiviert"}
          </h3>
          <p style={{
            fontSize: "0.95rem",
            color: "#0A0A0A",
            marginBottom: isActive && canEdit ? "1rem" : "0"
          }}>
            {isActive 
              ? "Aktive Templates sind unveränderlich (ESPR-Konformität). Um Änderungen vorzunehmen, erstellen Sie bitte eine neue Version."
              : "Archivierte Templates sind read-only und können nicht bearbeitet werden."
            }
          </p>
          {isActive && canEdit && (
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handleCreateNewVersion}
              disabled={creatingNewVersion}
              style={{
                padding: "0.75rem 1.5rem",
                  backgroundColor: creatingNewVersion ? "#CDCDCD" : "#24c598",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.95rem",
                fontWeight: "600",
                cursor: creatingNewVersion ? "not-allowed" : "pointer"
              }}
            >
              {creatingNewVersion ? "Wird erstellt..." : "Neue Version erstellen"}
            </button>
              <button
                type="button"
                onClick={() => setShowArchiveDialog(true)}
                disabled={archiving}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: archiving ? "#CDCDCD" : "#7A7A7A",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  cursor: archiving ? "not-allowed" : "pointer"
                }}
              >
                {archiving ? "Wird archiviert..." : "Archivieren"}
              </button>
            </div>
          )}
        </div>

        {/* Template Info (Read-only) */}
        <div style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E5E5E5",
          borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "2rem"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "0.5rem"
          }}>
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                color: "#0A0A0A",
                marginBottom: "0.5rem"
              }}>
                {template.name}
              </h2>
              {template.description && (
                <p style={{
                  fontSize: "0.95rem",
                  color: "#7A7A7A",
                  marginBottom: "0.5rem"
                }}>
                  {template.description}
                </p>
              )}
            </div>
            <div style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#F5F5F5",
              borderRadius: "8px",
              fontSize: "0.875rem",
              fontWeight: "600",
              color: "#0A0A0A",
              whiteSpace: "nowrap",
              marginLeft: "1rem"
            }}>
              Version {template.version}
            </div>
          </div>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            fontSize: "0.875rem",
            color: "#7A7A7A",
            marginBottom: isEditable ? "1rem" : "0"
          }}>
            <span>
              Kategorie: {template.category || "Keine"}
              {template.categoryLabel && ` – ${template.categoryLabel}`}
            </span>
            {template.effectiveFrom && (
              <>
                <span>•</span>
                <span>Gültig ab: {new Date(template.effectiveFrom).toLocaleDateString("de-DE")}</span>
              </>
            )}
            {template.supersedesVersion && (
              <>
                <span>•</span>
                <span>Ersetzt Version {template.supersedesVersion}</span>
              </>
            )}
          </div>
          {isEditable && (
            <div style={{
              marginTop: "1rem",
              padding: "0.75rem",
              backgroundColor: "#FFF5F9",
              border: "1px solid #24c598",
              borderRadius: "8px",
              fontSize: "0.875rem",
              color: "#24c598"
            }}>
              ⚠️ Änderungen gelten nur für zukünftige Produktpässe.
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {template.blocks.map((block) => (
            <div
              key={block.id}
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5E5E5",
                borderRadius: "12px",
                padding: "2rem"
              }}
            >
              <h3 style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                color: "#0A0A0A",
                marginBottom: "1.5rem",
                paddingBottom: "1rem",
                borderBottom: "2px solid #24c598"
              }}>
                {block.name}
              </h3>

              {block.fields.length === 0 ? (
                <p style={{
                  color: "#7A7A7A",
                  fontSize: "0.95rem",
                  fontStyle: "italic"
                }}>
                  Keine Felder in diesem Block
                </p>
              ) : (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: "1rem"
                }}>
                  {block.fields.map((field, fieldIndex) => (
                    <div
                      key={field.id}
                      draggable={isEditable}
                      onDragStart={(e) => isEditable && handleFieldDragStart(e, block.id, field.id)}
                      onDragOver={handleFieldDragOver}
                      onDrop={(e) => isEditable && handleFieldDrop(e, block.id, field.id)}
                      onDragEnd={handleFieldDragEnd}
                      style={{
                        padding: "1rem",
                        backgroundColor: draggedFieldId === field.id ? "#E5F3FF" : "#F9F9F9",
                        border: draggedFieldId === field.id ? "2px solid #24c598" : "1px solid #E5E5E5",
                        borderRadius: "8px",
                        cursor: isEditable ? "move" : "default",
                        opacity: draggedFieldId === field.id ? 0.5 : 1,
                        transition: "all 0.2s"
                      }}
                    >
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        marginBottom: "0.25rem"
                      }}>
                        {isEditable && (
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "move",
                            padding: "0",
                            marginLeft: "-0.25rem"
                          }}>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{ color: "#7A7A7A", flexShrink: 0 }}
                            >
                              <line x1="3" y1="12" x2="21" y2="12" />
                              <line x1="3" y1="6" x2="21" y2="6" />
                              <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                          </div>
                        )}
                      <div style={{
                        fontSize: "0.95rem",
                        fontWeight: "600",
                          color: "#0A0A0A"
                      }}>
                        {field.label}
                        {field.required && (
                          <span style={{
                            fontSize: "0.75rem",
                            color: "#DC2626",
                            fontWeight: "600",
                            marginLeft: "0.25rem"
                          }}>
                            *
                          </span>
                        )}
                      </div>
                      </div>
                      <div style={{
                        display: "inline-block",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "6px",
                        backgroundColor: "#24c598",
                        color: "#FFFFFF",
                        fontSize: "0.75rem",
                        fontWeight: "600"
                      }}>
                        {fieldTypes.find(t => t.value === field.type)?.label || field.type}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <style dangerouslySetInnerHTML={{
        __html: `
        @media (max-width: 768px) {
          .template-editor-footer {
            left: 0 !important;
            padding: 0.75rem 1rem !important;
          }
          .template-editor-field-grid {
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
          }
          .template-editor-field-grid > * {
            width: 100% !important;
            max-width: 100% !important;
          }
          .template-editor-field-grid input,
          .template-editor-field-grid select,
          .template-editor-field-grid label,
          .template-editor-field-grid button {
            width: 100% !important;
            max-width: 100% !important;
          }
          /* ✅ Checkboxen explizit ausnehmen */
          .template-editor-field-grid input[type="checkbox"] {
            width: auto !important;
            max-width: none !important;
          }
          .template-editor-required {
            justify-content: flex-start !important;
            align-self: flex-start !important;
            width: 100% !important;
          }
          
          .block-header-container {
            flex-direction: row !important;
            align-items: center !important;
          }
          .block-actions {
            gap: 0.75rem !important;
            width: auto;
            flex-wrap: wrap;
            margin-top: 0;
          }
          .block-delete {
            margin-top: 0;
            width: auto;
          }
          .block-delete-button {
            width: 32px !important;
            height: 32px !important;
            padding: 0.5rem !important;
            min-width: 32px;
            min-height: 32px;
          }
          @media (min-width: 769px) {
            .block-header-container {
              flex-direction: row !important;
              align-items: center !important;
            }
            .block-actions {
              margin-top: 0 !important;
              width: auto !important;
            }
            .block-delete {
              margin-top: 0 !important;
              width: auto !important;
            }
            .block-delete-button {
              width: 32px !important;
              height: 32px !important;
              padding: 0.5rem !important;
            }
          }
        }
        @media (min-width: 769px) {
          .template-editor-field-grid {
            display: grid;
            grid-template-columns:
              24px
              minmax(220px, 1fr)
              160px
              96px
              120px
              32px;
            gap: 0.75rem;
            align-items: center;
            white-space: nowrap;
            overflow: hidden;
          }
          .template-editor-field-grid > * {
            min-width: 0;
          }
        }
      `
      }} />
      <form onSubmit={handleSubmit}>
      {error && (
        <div style={{
          backgroundColor: "#FFF5F9",
          border: "1px solid #24c598",
          borderRadius: "8px",
          padding: "1rem",
          marginBottom: "2rem",
          color: "#24c598",
          fontSize: "0.95rem"
        }}>
          {error}
        </div>
      )}

      {saved && (
        <div style={{
          backgroundColor: "#F0FDF4",
          border: "1px solid #00A651",
          borderRadius: "8px",
          padding: "1rem",
          marginBottom: "2rem",
          color: "#00A651",
          fontSize: "0.95rem"
        }}>
          Template erfolgreich gespeichert!
        </div>
      )}

      {/* Template-Kontext (Kategorie) - Oberhalb der Basisinformationen */}
      <div style={{
        backgroundColor: "#F8F9FA",
        border: "1px solid #E5E5E5",
        borderRadius: "12px",
        padding: "1rem",
        marginBottom: "2rem"
      }}>
        <style>{`
          @media (min-width: 768px) {
            .template-category-container {
              padding: 1.5rem !important;
            }
            .template-category-row {
              flex-direction: row !important;
              align-items: center !important;
            }
          }
        `}</style>
        <div 
          className="template-category-row"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem"
          }}
        >
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            flex: 1
          }}>
            <div style={{
              fontSize: "0.75rem",
              fontWeight: "600",
              color: "#7A7A7A",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              Kategorie
            </div>
            <div style={{
              fontSize: "1rem",
              fontWeight: "600",
              color: "#0A0A0A"
            }}>
              {template.categoryLabel || template.category || "Keine"}
            </div>
          </div>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem"
          }}>
            <div style={{
              fontSize: "0.75rem",
              fontWeight: "600",
              color: "#7A7A7A",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              Version
            </div>
            <div style={{
              fontSize: "1rem",
              fontWeight: "600",
              color: "#0A0A0A"
            }}>
              {template.version}
            </div>
          </div>
        </div>
        <p style={{
          marginTop: "0.75rem",
          fontSize: "0.75rem",
          color: "#7A7A7A",
          fontStyle: "italic",
          lineHeight: "1.4"
        }}>
          Die Kategorie kann nicht mehr verändert werden, wenn ein Template für eine Kategorie veröffentlicht worden ist.
        </p>
      </div>

      {/* Basic Info */}
      <div style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E5E5E5",
        borderRadius: "12px",
        padding: "2rem",
        marginBottom: "2rem"
      }}>
        <h2 style={{
          fontSize: "1.5rem",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "1.5rem"
        }}>
          Basis-Informationen
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <label htmlFor="name" style={{
              display: "block",
              fontSize: "0.95rem",
              fontWeight: "500",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Template-Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading || !isEditable}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "8px",
                fontSize: "1rem",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div>
            <label htmlFor="description" style={{
              display: "block",
              fontSize: "0.95rem",
              fontWeight: "500",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Beschreibung
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading || !isEditable}
              rows={3}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "8px",
                fontSize: "1rem",
                boxSizing: "border-box",
                fontFamily: "inherit"
              }}
            />
          </div>

          <div>
            <label htmlFor="status" style={{
              display: "block",
              fontSize: "0.95rem",
              fontWeight: "500",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => {
                const newStatus = e.target.value
                setStatus(newStatus)
              }}
              disabled={loading || (!isEditable && template.status !== "draft")}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "8px",
                fontSize: "1rem",
                boxSizing: "border-box",
                backgroundColor: "#FFFFFF"
              }}
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Blocks */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem", marginBottom: "2rem" }}>
        {blocks.map((block, blockIndex) => (
          <div
            key={block.id}
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E5E5",
              borderRadius: "12px",
              padding: "2rem"
            }}
          >
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              marginBottom: "1.5rem"
            }}>
              <div className="block-header-container" style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "0.75rem",
                flexWrap: "wrap",
                paddingBottom: "1rem",
                borderBottom: "2px solid #24c598"
              }}>
                <input
                  type="text"
                  value={block.name}
                  onChange={(e) => updateBlockName(block.id, e.target.value)}
                  placeholder={`Block ${blockIndex + 1} Name`}
                  disabled={loading || !isEditable}
                  style={{
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#0A0A0A",
                    border: "none",
                    padding: "0.5rem 0",
                    outline: "none",
                    flex: 1,
                    minWidth: "200px",
                    wordWrap: "break-word",
                    overflowWrap: "break-word",
                    backgroundColor: "transparent"
                  }}
                />
                {blockIndex === 0 && (
                  <span style={{
                    padding: "0.5rem",
                    fontSize: "0.75rem",
                    color: "#7A7A7A",
                    fontStyle: "italic",
                    flexShrink: 0
                  }}>
                    (Fix)
                  </span>
                )}
                {blocks.length > 1 && blockIndex > 0 && (
                  <div className="block-actions" style={{ 
                    display: "flex", 
                    alignItems: "center",
                    gap: "0.75rem"
                  }}>
                    <div className="block-order-controls" style={{ 
                      display: "flex", 
                      gap: "0.5rem",
                      flexShrink: 0
                    }}>
                      {blockIndex > 1 && (
                      <button
                        type="button"
                        onClick={() => moveBlockUp(blockIndex)}
                        disabled={loading}
                        title="Block nach oben verschieben"
                        style={{
                          padding: "0.5rem",
                          backgroundColor: "#F5F5F5",
                          color: "#0A0A0A",
                          border: "1px solid #CDCDCD",
                          borderRadius: "6px",
                          cursor: loading ? "not-allowed" : "pointer",
                          fontSize: "1rem",
                          width: "32px",
                          height: "32px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        ↑
                      </button>
                      )}
                      <button
                        type="button"
                        onClick={() => moveBlockDown(blockIndex)}
                        disabled={loading || blockIndex === blocks.length - 1}
                        title="Block nach unten verschieben"
                        style={{
                          padding: "0.5rem",
                          backgroundColor: "#F5F5F5",
                          color: "#0A0A0A",
                          border: "1px solid #CDCDCD",
                          borderRadius: "6px",
                          cursor: loading ? "not-allowed" : "pointer",
                          fontSize: "1rem",
                          width: "32px",
                          height: "32px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        ↓
                      </button>
                    </div>
                  {/* ENTFERNT: Supplier Config Icon - wird jetzt pro DPP konfiguriert, nicht im Template */}
                  
                  <div className="block-delete">
                    <button
                      type="button"
                      onClick={() => deleteBlock(block.id)}
                      disabled={loading || !isEditable}
                      title="Block entfernen"
                      className="block-delete-button"
                      style={{
                        padding: "0.5rem",
                        backgroundColor: "transparent",
                        color: "#7A7A7A",
                        border: "1px solid #CDCDCD",
                        borderRadius: "6px",
                        cursor: loading || !isEditable ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "32px",
                        height: "32px",
                        opacity: loading || !isEditable ? 0.5 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!loading && isEditable) {
                          e.currentTarget.style.backgroundColor = "#F5F5F5"
                          e.currentTarget.style.borderColor = "#7A7A7A"
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loading && isEditable) {
                          e.currentTarget.style.backgroundColor = "transparent"
                          e.currentTarget.style.borderColor = "#CDCDCD"
                        }
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                  </div>
                )}
              </div>
            </div>


            {/* Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {block.fields.map((field, fieldIndex) => (
                  <div
                    key={field.id}
                    draggable={isEditable}
                    onDragStart={(e) => isEditable && handleFieldDragStart(e, block.id, field.id)}
                    onDragOver={handleFieldDragOver}
                    onDrop={(e) => isEditable && handleFieldDrop(e, block.id, field.id)}
                    onDragEnd={handleFieldDragEnd}
                    style={{
                      padding: "1rem",
                      backgroundColor: draggedFieldId === field.id ? "#E5F3FF" : "#F9F9F9",
                      border: draggedFieldId === field.id ? "2px solid #24c598" : "1px solid #E5E5E5",
                      borderRadius: "8px",
                      cursor: isEditable ? "move" : "default",
                      opacity: draggedFieldId === field.id ? 0.5 : 1,
                      transition: "all 0.2s",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  >
                    <div 
                      className="template-editor-field-grid"
                      style={{
                        display: "grid",
                        gap: "0.75rem",
                        alignItems: "center",
                        width: "100%",
                        minWidth: 0,
                      }}
                    >
                      {isEditable && (
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "move",
                          padding: "0",
                          marginLeft: "-0.25rem"
                        }}>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ color: "#7A7A7A", flexShrink: 0 }}
                          >
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                          </svg>
                        </div>
                      )}
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => {
                          const newLabel = e.target.value
                          if (validateFieldLabel(newLabel)) {
                            updateField(block.id, field.id, { label: newLabel })
                          } else {
                            showNotification("Das Label 'Kategorie' oder 'Category' ist nicht erlaubt. Die Kategorie ist ein Template-Merkmal und kein Feld.", "error")
                          }
                        }}
                        placeholder="Label"
                        disabled={loading || !isEditable}
                        style={{
                          padding: "0.5rem",
                          border: "1px solid #CDCDCD",
                          borderRadius: "6px",
                          fontSize: "0.95rem",
                          boxSizing: "border-box"
                        }}
                      />
                      <select
                        value={field.type}
                        onChange={(e) => updateField(block.id, field.id, { type: e.target.value })}
                        disabled={loading || !isEditable}
                        style={{
                          padding: "0.5rem",
                          border: "1px solid #CDCDCD",
                          borderRadius: "6px",
                          fontSize: "0.95rem",
                          backgroundColor: "#FFFFFF",
                          boxSizing: "border-box"
                        }}
                      >
                        {fieldTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      <label className="template-editor-required" style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        fontSize: "0.875rem",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        flexShrink: 0
                      }}>
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(block.id, field.id, { required: e.target.checked })}
                          disabled={loading || !isEditable}
                          style={{ flexShrink: 0, width: "16px", height: "16px" }}
                        />
                        <span style={{ whiteSpace: "nowrap" }}>Pflicht</span>
                      </label>
                      <label style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        fontSize: "0.875rem",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        flexShrink: 0
                      }}>
                        <input
                          type="checkbox"
                          checked={field.isRepeatable || false}
                          onChange={(e) => updateField(block.id, field.id, { isRepeatable: e.target.checked })}
                          disabled={loading || !isEditable}
                          style={{ flexShrink: 0, width: "16px", height: "16px" }}
                        />
                        <span style={{ whiteSpace: "nowrap" }}>Wiederholbar</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => deleteField(block.id, field.id)}
                        disabled={loading || !isEditable}
                        title="Feld entfernen"
                        style={{
                          padding: "0.5rem",
                          backgroundColor: "transparent",
                          color: "#7A7A7A",
                          border: "1px solid #CDCDCD",
                          borderRadius: "6px",
                          cursor: loading || !isEditable ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "32px",
                          height: "32px",
                          opacity: loading || !isEditable ? 0.5 : 1,
                          flexShrink: 0,
                          boxSizing: "border-box"
                        }}
                        onMouseEnter={(e) => {
                          if (!loading && isEditable) {
                            e.currentTarget.style.backgroundColor = "#F5F5F5"
                            e.currentTarget.style.borderColor = "#7A7A7A"
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!loading && isEditable) {
                            e.currentTarget.style.backgroundColor = "transparent"
                            e.currentTarget.style.borderColor = "#CDCDCD"
                          }
                        }}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                    {/* Auswahl-Optionen UI für select/multi-select Felder */}
                    {(field.type === "select" || field.type === "multi-select") && (
                      <div style={{
                        marginTop: "1rem",
                        padding: "1rem",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E5E5E5",
                        borderRadius: "8px"
                      }}>
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: editingFieldOptions === field.id ? "0.75rem" : "0"
                        }}>
                          <label style={{
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            color: "#0A0A0A"
                          }}>
                            Auswahloptionen:
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFieldOptions(editingFieldOptions === field.id ? null : field.id)
                            }}
                            style={{
                              padding: "0.375rem 0.75rem",
                              backgroundColor: editingFieldOptions === field.id ? "#7A7A7A" : "#24c598",
                              color: "#FFFFFF",
                              border: "none",
                              borderRadius: "6px",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              cursor: "pointer"
                            }}
                          >
                            {editingFieldOptions === field.id ? "▼ Ausblenden" : "▶ Optionen"}
                          </button>
                        </div>
                        {editingFieldOptions === field.id && (
                        <>
                          <p style={{
                            fontSize: "0.75rem",
                            color: "#7A7A7A",
                            marginBottom: "0.75rem",
                            fontStyle: "italic"
                          }}>
                            Diese Optionen werden bei DPP-Erstellung und CSV-Import validiert.
                          </p>
                          <div style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            marginBottom: "0.75rem"
                          }}>
                            <button
                              type="button"
                              onClick={() => {
                                const options = getSelectOptions(field.config)
                                // Automatisch Key generieren beim Hinzufügen einer neuen Option
                                const newOption = { 
                                  value: generateKeyFromLabel("Neue Option"), 
                                  label: "Neue Option", 
                                  esprReference: undefined 
                                }
                                updateSelectOptions(block.id, field.id, [...options, newOption])
                              }}
                              disabled={loading || !isEditable}
                              style={{
                                padding: "0.375rem 0.75rem",
                                backgroundColor: "#24c598",
                                color: "#FFFFFF",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                cursor: loading ? "not-allowed" : "pointer"
                              }}
                            >
                              + Option hinzufügen
                            </button>
                          </div>
                        </>
                        )}
                        {editingFieldOptions === field.id && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {getSelectOptions(field.config).map((option, optIndex) => (
                            <div key={optIndex} style={{
                              display: "grid",
                              gridTemplateColumns: "1fr auto auto",
                              gap: "0.5rem",
                              alignItems: "center"
                            }}>
                              <input
                                type="text"
                                value={option.label}
                                placeholder="Label (technischer Key wird automatisch generiert)"
                                onChange={(e) => {
                                  const options = getSelectOptions(field.config)
                                  const newLabel = e.target.value
                                  // Automatisch Key aus Label generieren
                                  const newValue = generateKeyFromLabel(newLabel)
                                  options[optIndex] = { ...option, label: newLabel, value: newValue }
                                  updateSelectOptions(block.id, field.id, options)
                                }}
                                disabled={loading || !isEditable}
                                style={{
                                  padding: "0.5rem",
                                  border: "1px solid #CDCDCD",
                                  borderRadius: "6px",
                                  fontSize: "0.875rem"
                                }}
                              />
                              <input
                                type="text"
                                value={option.esprReference || ""}
                                placeholder="ESPR (optional)"
                                onChange={(e) => {
                                  const options = getSelectOptions(field.config)
                                  options[optIndex] = { ...option, esprReference: e.target.value || undefined }
                                  updateSelectOptions(block.id, field.id, options)
                                }}
                                disabled={loading || !isEditable}
                                style={{
                                  padding: "0.5rem",
                                  border: "1px solid #CDCDCD",
                                  borderRadius: "6px",
                                  fontSize: "0.875rem",
                                  width: "120px"
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const options = getSelectOptions(field.config)
                                  options.splice(optIndex, 1)
                                  updateSelectOptions(block.id, field.id, options)
                                }}
                                disabled={loading || !isEditable}
                                style={{
                                  padding: "0.5rem",
                                  backgroundColor: "transparent",
                                  color: "#DC2626",
                                  border: "1px solid #DC2626",
                                  borderRadius: "6px",
                                  fontSize: "0.875rem",
                                  cursor: loading ? "not-allowed" : "pointer",
                                  width: "32px",
                                  height: "32px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center"
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          {getSelectOptions(field.config).length === 0 && (
                            <p style={{
                              fontSize: "0.75rem",
                              color: "#7A7A7A",
                              fontStyle: "italic",
                              padding: "0.5rem"
                            }}>
                              Noch keine Optionen definiert. Klicken Sie auf "+ Option hinzufügen".
                            </p>
                          )}
                        </div>
                        )}
                      </div>
                    )}
                    {field.type === "country" && (
                      <div style={{
                        marginTop: "0.75rem",
                        padding: "0.75rem",
                        backgroundColor: "#F0F9FF",
                        border: "1px solid #B3E5FC",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        color: "#0277BD"
                      }}>
                        ℹ️ Eine vollständige Liste aller Länder (ISO-3166-1 Alpha-2, ~249 Länder) steht den Nutzern bei der DPP-Erstellung zur Auswahl. Länder werden als ISO-Codes (z. B. DE, FR) gespeichert. Das Land wird basierend auf der IP-Adresse des Nutzers an erster Stelle vorgeschlagen.
                      </div>
                    )}
                  </div>
              ))}

              <button
                type="button"
                onClick={() => addField(block.id)}
                disabled={loading || !isEditable}
                style={{
                  padding: "0.75rem 1rem",
                  backgroundColor: "#F9F9F9",
                  color: "#0A0A0A",
                  border: "1px dashed #CDCDCD",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  fontWeight: "500",
                  cursor: loading ? "not-allowed" : "pointer",
                  textAlign: "left"
                }}
              >
                + Feld hinzufügen
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addBlock}
          disabled={loading || !isEditable}
          style={{
            padding: "1rem",
            backgroundColor: "#F9F9F9",
            color: "#0A0A0A",
            border: "2px dashed #CDCDCD",
            borderRadius: "12px",
            fontSize: "1rem",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          + Block hinzufügen
        </button>
      </div>

      {/* Bottom padding für Sticky Footer */}
      <div style={{ height: "120px" }} />
    </form>

    {/* Sticky Footer */}
    <div 
      className="template-editor-footer"
      style={{
        position: "fixed",
        bottom: 0,
        left: isSidebarCollapsed ? "64px" : "280px",
        right: 0,
        backgroundColor: "#FFFFFF",
        borderTop: "2px solid #E5E5E5",
        padding: "1rem",
        boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.05)",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        zIndex: 1000,
        transition: "left 0.3s ease"
      }}
    >
        <style>{`
          @media (min-width: 768px) {
            .template-editor-footer {
              padding: 1rem 1.5rem !important;
              flex-direction: row !important;
              justify-content: space-between !important;
              align-items: center !important;
            }
            .template-footer-info {
              flex-direction: row !important;
              gap: 1.5rem !important;
            }
            .template-footer-actions {
              flex-direction: row !important;
              justify-content: flex-end !important;
            }
          }
        `}</style>
        {/* Status Info - Mobile-first, Desktop horizontal */}
        <div 
          className="template-footer-info"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            fontSize: "0.875rem",
            color: "#7A7A7A"
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            <span>
              Status: <strong style={{ color: "#0A0A0A" }}>{statusOptions.find(s => s.value === status)?.label || status}</strong>
            </span>
            <span>
              Version: <strong style={{ color: "#0A0A0A" }}>v{template.version}</strong>
            </span>
          </div>
          {template.updatedAt && (
            <span style={{ fontSize: "0.75rem" }}>
              Zuletzt gespeichert: {new Date(template.updatedAt).toLocaleString("de-DE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </span>
          )}
          <div style={{
            fontSize: "0.75rem",
            color: "#7A7A7A",
            fontStyle: "italic",
            marginTop: "0.25rem"
          }}>
            ⚠️ Änderungen gelten nur für zukünftige Produktpässe.
          </div>
        </div>
        
        {/* Actions Row - Mobile-first, Desktop horizontal */}
        <div 
          className="template-footer-actions"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            width: "100%"
          }}
        >
            {status === "draft" && isEditable && (
              <button
                type="button"
                onClick={() => setShowDeleteDialog(true)}
                disabled={loading}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: loading ? "#CDCDCD" : "transparent",
                  color: loading ? "#FFFFFF" : "#DC2626",
                  border: `1px solid ${loading ? "#CDCDCD" : "#DC2626"}`,
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                  width: "100%",
                  boxSizing: "border-box"
                }}
              >
                Template löschen
              </button>
            )}
            {status === "draft" && (
              <button
                type="button"
                onClick={() => setShowPublishDialog(true)}
                disabled={loading || !isEditable}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: loading ? "#CDCDCD" : "#10B981",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  cursor: loading || !isEditable ? "not-allowed" : "pointer",
                  width: "100%",
                  boxSizing: "border-box"
                }}
              >
                {loading ? "Wird veröffentlicht..." : "Veröffentlichen"}
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                handleSubmit(e as any)
              }}
              disabled={loading || !isEditable}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: loading || !isEditable ? "#CDCDCD" : "#3B82F6",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.95rem",
                fontWeight: "600",
                cursor: loading || !isEditable ? "not-allowed" : "pointer",
                width: "100%",
                boxSizing: "border-box"
              }}
            >
              {loading ? "Wird gespeichert..." : "Speichern"}
            </button>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Template löschen"
        message="Möchten Sie dieses Template wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        confirmLabel="Löschen"
        cancelLabel="Abbrechen"
        variant="danger"
        onConfirm={async () => {
          setShowDeleteDialog(false)
          setLoading(true)
          try {
            const response = await fetch(`/api/super-admin/templates/${template.id}`, {
              method: "DELETE"
            })
            if (!response.ok) {
              const data = await response.json()
              throw new Error(data.error || "Fehler beim Löschen")
            }
            showNotification("Template erfolgreich gelöscht", "success")
            router.push("/super-admin/templates")
          } catch (err: any) {
            showNotification(err.message || "Fehler beim Löschen des Templates", "error")
            setLoading(false)
          }
        }}
        onCancel={() => setShowDeleteDialog(false)}
      />
      
      {/* Publish Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showPublishDialog}
        title="Template veröffentlichen"
        message="Möchten Sie dieses Template wirklich veröffentlichen? Die bisher aktive Version wird automatisch archiviert."
        confirmLabel="Veröffentlichen"
        cancelLabel="Abbrechen"
        onConfirm={async () => {
          setShowPublishDialog(false)
          setStatus("active")
          // Rufe handleSubmit direkt mit aktivem Status auf
          // Erstelle einen Wrapper, der den Status explizit setzt
          const publishTemplate = async () => {
            setError(null)
            setSaved(false)
            setLoading(true)

            try {
              // Validate
              if (!name) {
                showNotification("Name ist erforderlich", "error")
                setLoading(false)
                return
              }

              // Validate blocks exist
              if (!blocks || blocks.length === 0) {
                showNotification("Ein Template muss mindestens einen Block enthalten, um veröffentlicht werden zu können.", "error")
                setLoading(false)
                return
              }

              // Validate blocks
              for (const block of blocks) {
                if (!block.name) {
                  showNotification("Alle Blöcke benötigen einen Namen", "error")
                  setLoading(false)
                  return
                }
              }

              // Validate fields exist and have content
              let hasFields = false
              for (const block of blocks) {
                const validFields = block.fields.filter(field => {
                  const keyLower = field.key?.toLowerCase() || ""
                  const labelLower = field.label?.toLowerCase() || ""
                  return !keyLower.includes("category") && 
                         !keyLower.includes("kategorie") &&
                         !labelLower.includes("kategorie") &&
                         !labelLower.includes("category")
                })
                
                if (validFields.length > 0) {
                  hasFields = true
                }
                
                for (const field of block.fields) {
                  if (!field.label) {
                    showNotification("Alle Felder benötigen einen Label", "error")
                    setLoading(false)
                    return
                  }
                }
              }

              if (!hasFields) {
                showNotification("Ein Template muss mindestens einen Block mit mindestens einem Feld enthalten, um veröffentlicht werden zu können.", "error")
                setLoading(false)
                return
              }

              // Prepare data mit explizitem Status "active"
              const templateData = {
                name,
                description: description || null,
                status: "active", // Explizit auf "active" setzen
                blocks: blocks.map((block) => ({
                  name: block.name,
                  fields: block.fields
                    .filter(field => {
                      const keyLower = field.key?.toLowerCase() || ""
                      const labelLower = field.label?.toLowerCase() || ""
                      return !keyLower.includes("category") && 
                             !keyLower.includes("kategorie") &&
                             !labelLower.includes("kategorie") &&
                             !labelLower.includes("category")
                    })
                    .map((field) => ({
                      label: field.label,
                      key: field.key || generateKeyFromLabel(field.label), // Auto-generate if missing
                      type: field.type,
                      required: field.required,
                      isRepeatable: field.isRepeatable || false,
                      config: field.config ? (typeof field.config === "string" ? JSON.parse(field.config) : field.config) : null
                    }))
                }))
              }

              const response = await fetch(`/api/super-admin/templates/${template.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(templateData)
              })

              const data = await response.json()

              if (!response.ok) {
                showNotification(data.error || "Fehler beim Veröffentlichen des Templates", "error")
                setLoading(false)
                return
              }

              // Status-State aktualisieren
              setStatus("active")
              
              setSaved(true)
              setLoading(false)
              showNotification("Template erfolgreich veröffentlicht", "success")
              
              // Refresh page to show updated data after short delay
              setTimeout(() => {
                router.refresh()
              }, 1500)
            } catch (err: any) {
              showNotification(err.message || "Ein Fehler ist aufgetreten", "error")
              setLoading(false)
            }
          }

          await publishTemplate()
        }}
        onCancel={() => setShowPublishDialog(false)}
      />
      
      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showArchiveDialog}
        title="Template archivieren"
        message="Möchten Sie dieses Template wirklich archivieren? Es wird nicht mehr für neue DPPs verfügbar sein."
        confirmLabel="Archivieren"
        cancelLabel="Abbrechen"
        onConfirm={handleArchive}
        onCancel={() => setShowArchiveDialog(false)}
      />
    </div>
  )
}
