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
  { value: "file", label: "Datei" },
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

  // Helper: Generate key from label
  const generateKeyFromLabel = (label: string): string => {
    if (!label) return ""
    return label
      .toLowerCase()
      .trim()
      .replace(/[äöü]/g, (char) => {
        const map: Record<string, string> = { ä: "ae", ö: "oe", ü: "ue" }
        return map[char] || char
      })
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .replace(/_+/g, "_")
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
                order: block.fields.length
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
    const config = JSON.stringify({ options })
    updateField(blockId, fieldId, { config })
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
        setError("Name ist erforderlich")
        setLoading(false)
        return
      }

      // Validate blocks
      for (const block of blocks) {
        if (!block.name) {
          setError("Alle Blöcke benötigen einen Namen")
          setLoading(false)
          return
        }
      }

      // Validate fields
      for (const block of blocks) {
        for (const field of block.fields) {
          if (!field.label) {
            setError("Alle Felder benötigen einen Label")
            setLoading(false)
            return
          }
        }
      }

      // Prepare data - Filter out any category fields (safety check)
      // Generate keys automatically from labels if missing
      // Verwende IMMER den aktuellen Status-State (nicht template.status als Fallback!)
      console.log("[Template Save] ===== START SAVE =====")
      console.log("[Template Save] Status-State:", status, "Type:", typeof status)
      console.log("[Template Save] Template-Status (DB):", template.status, "Type:", typeof template.status)
      console.log("[Template Save] Status-State === 'active':", status === "active")
      console.log("[Template Save] Status-State === 'draft':", status === "draft")
      
      const currentStatus = status || template.status // Fallback zu template.status nur wenn status undefined/null
      console.log("[Template Save] Finaler Status zum Speichern:", currentStatus)
      
      if (!currentStatus) {
        console.error("[Template Save] FEHLER: Kein Status vorhanden!")
        setError("Status ist erforderlich")
        setLoading(false)
        return
      }
      
      const templateData = {
        name,
        description: description || null,
        status: currentStatus, // Explizit den State verwenden
        blocks: blocks.map((block, blockIndex) => ({
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
            .map((field, fieldIndex) => ({
              label: field.label,
              key: field.key || generateKeyFromLabel(field.label), // Auto-generate if missing
              type: field.type,
              required: field.required,
              config: field.config ? JSON.parse(field.config) : null
            }))
        }))
      }

      console.log("[Template Save] Sende Request mit Daten:", JSON.stringify(templateData, null, 2))
      console.log("[Template Save] Status im Request-Body:", templateData.status)

      const response = await fetch(`/api/super-admin/templates/${template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateData)
      })

      const data = await response.json()
      console.log("[Template Save] Response Status:", response.status)
      console.log("[Template Save] Response Data:", JSON.stringify(data, null, 2))

      if (!response.ok) {
        console.error("[Template Save] FEHLER:", data.error)
        setError(data.error || "Fehler beim Aktualisieren des Templates")
        setLoading(false)
        return
      }
      
      console.log("[Template Save] ===== SAVE ERFOLGREICH =====")

      setSaved(true)
      setLoading(false)
      showNotification("Erfolgreich gespeichert", "success")
      
      // Refresh page to show updated data
      setTimeout(() => {
        router.refresh()
      }, 1000)
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist aufgetreten")
      setLoading(false)
    }
  }

  const handleCreateNewVersion = async () => {
    if (!isActive) {
      console.log("Cannot create new version: template is not active", { status: template.status })
      return
    }

    setCreatingNewVersion(true)
    setError(null)

    try {
      const result = await createNewTemplateVersion(template.id)
      // Redirect to new template editor
      router.push(`/super-admin/templates/${result.templateId}`)
      router.refresh() // Ensure fresh data
    } catch (err: any) {
      console.error("Error creating new version:", err)
      setError(err.message || "Ein Fehler ist aufgetreten")
      setCreatingNewVersion(false)
    }
  }

  // Show warning and "Create new version" button for active templates
  if (isActive || isArchived) {
    return (
      <div>
        {error && (
          <div style={{
            backgroundColor: "#FFF5F9",
            border: "1px solid #E20074",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "2rem",
            color: "#E20074",
            fontSize: "0.95rem"
          }}>
            {error}
          </div>
        )}

        <div style={{
          backgroundColor: "#FFF5F9",
          border: "1px solid #E20074",
          borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "2rem"
        }}>
          <h3 style={{
            fontSize: "1.25rem",
            fontWeight: "600",
            color: "#E20074",
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
            <button
              type="button"
              onClick={handleCreateNewVersion}
              disabled={creatingNewVersion}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: creatingNewVersion ? "#CDCDCD" : "#E20074",
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
              border: "1px solid #E20074",
              borderRadius: "8px",
              fontSize: "0.875rem",
              color: "#E20074"
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
                borderBottom: "2px solid #E20074"
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
                  {block.fields.map((field) => (
                    <div
                      key={field.id}
                      style={{
                        padding: "1rem",
                        backgroundColor: "#F9F9F9",
                        border: "1px solid #E5E5E5",
                        borderRadius: "8px"
                      }}
                    >
                      <div style={{
                        fontSize: "0.95rem",
                        fontWeight: "600",
                        color: "#0A0A0A",
                        marginBottom: "0.25rem"
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
                      <div style={{
                        display: "inline-block",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "6px",
                        backgroundColor: "#E20074",
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
        @media (min-width: 769px) and (max-width: 1200px) {
          .template-editor-field-grid {
            grid-template-columns: 1.5fr 1.5fr 1fr auto auto !important;
            gap: 0.5rem !important;
          }
          .template-editor-field-grid input,
          .template-editor-field-grid select {
            min-width: 0 !important;
            font-size: 0.875rem !important;
          }
          .template-editor-field-grid button {
            padding: 0.375rem 0.5rem !important;
            font-size: 0.75rem !important;
            white-space: nowrap !important;
          }
        }
        @media (min-width: 1400px) {
          .template-editor-field-grid {
            grid-template-columns: 2fr 2fr 1.5fr auto auto !important;
          }
        }
      `
      }} />
      <form onSubmit={handleSubmit}>
      {error && (
        <div style={{
          backgroundColor: "#FFF5F9",
          border: "1px solid #E20074",
          borderRadius: "8px",
          padding: "1rem",
          marginBottom: "2rem",
          color: "#E20074",
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
              {template.category || "Keine"}
              {template.categoryLabel && (
                <span style={{
                  marginLeft: "0.5rem",
                  fontWeight: "400",
                  color: "#7A7A7A"
                }}>
                  – {template.categoryLabel}
                </span>
              )}
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
          Die Kategorie ist Teil der regulatorischen Template-Identität und kann nach Erstellung nicht mehr geändert werden.
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
                console.log("[Template Editor] Status geändert von", status, "zu", newStatus)
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
                borderBottom: "2px solid #E20074"
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
              {block.fields.map((field) => (
                  <div
                    key={field.id}
                    style={{
                      padding: "1rem",
                      backgroundColor: "#F9F9F9",
                      border: "1px solid #E5E5E5",
                      borderRadius: "8px"
                    }}
                  >
                    <div 
                      className="template-editor-field-grid"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(120px, 2fr) minmax(100px, 2fr) minmax(120px, 1fr) auto 32px",
                        gap: "0.75rem",
                        alignItems: "center",
                        width: "100%",
                        boxSizing: "border-box",
                        minWidth: 0,
                        overflow: "hidden"
                      }}
                    >
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => {
                          const newLabel = e.target.value
                          if (validateFieldLabel(newLabel)) {
                            updateField(block.id, field.id, { label: newLabel })
                          } else {
                            setError("Das Label 'Kategorie' oder 'Category' ist nicht erlaubt. Die Kategorie ist ein Template-Merkmal und kein Feld.")
                            setTimeout(() => setError(null), 5000)
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
                        gap: "0.5rem",
                        fontSize: "0.875rem",
                        cursor: "pointer",
                        whiteSpace: "nowrap"
                      }}>
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(block.id, field.id, { required: e.target.checked })}
                          disabled={loading || !isEditable}
                        />
                        Pflicht
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
                              backgroundColor: editingFieldOptions === field.id ? "#7A7A7A" : "#E20074",
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
                                updateSelectOptions(block.id, field.id, [...options, { value: "", label: "", esprReference: "" }])
                              }}
                              disabled={loading || !isEditable}
                              style={{
                                padding: "0.375rem 0.75rem",
                                backgroundColor: "#E20074",
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
                              gridTemplateColumns: "1fr 1fr 1fr auto",
                              gap: "0.5rem",
                              alignItems: "center"
                            }}>
                              <input
                                type="text"
                                value={option.value}
                                placeholder="Value (technisch)"
                                onChange={(e) => {
                                  const options = getSelectOptions(field.config)
                                  options[optIndex] = { ...option, value: e.target.value }
                                  updateSelectOptions(block.id, field.id, options)
                                }}
                                disabled={loading || !isEditable}
                                style={{
                                  padding: "0.5rem",
                                  border: "1px solid #CDCDCD",
                                  borderRadius: "6px",
                                  fontSize: "0.875rem",
                                  fontFamily: "monospace"
                                }}
                              />
                              <input
                                type="text"
                                value={option.label}
                                placeholder="Label (Anzeige)"
                                onChange={(e) => {
                                  const options = getSelectOptions(field.config)
                                  options[optIndex] = { ...option, label: e.target.value }
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
                                placeholder="ESPR-Referenz (optional)"
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
                                  fontSize: "0.875rem"
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
                                  cursor: loading ? "not-allowed" : "pointer"
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
                  backgroundColor: loading ? "#CDCDCD" : "#00A651",
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
              type="submit"
              disabled={loading || !isEditable}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: loading || !isEditable ? "#CDCDCD" : "#E20074",
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
            router.push("/super-admin/templates")
          } catch (err: any) {
            setError(err.message || "Fehler beim Löschen des Templates")
            setLoading(false)
          }
        }}
        onCancel={() => setShowDeleteDialog(false)}
      />
      
      {/* Publish Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showPublishDialog}
        title="Template veröffentlichen"
        message="Möchten Sie dieses Template wirklich veröffentlichen? Nur ein aktives Template pro Kategorie ist erlaubt."
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
                setError("Name ist erforderlich")
                setLoading(false)
                return
              }

              // Validate blocks
              for (const block of blocks) {
                if (!block.name) {
                  setError("Alle Blöcke benötigen einen Namen")
                  setLoading(false)
                  return
                }
              }

      // Validate fields
      for (const block of blocks) {
        for (const field of block.fields) {
          if (!field.label) {
            setError("Alle Felder benötigen einen Label")
            setLoading(false)
            return
          }
        }
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
                      config: field.config ? JSON.parse(field.config) : null
                    }))
                }))
              }

              console.log("[Template Publish] Sende Template mit Status 'active':", templateData.status)

              const response = await fetch(`/api/super-admin/templates/${template.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(templateData)
              })

              const data = await response.json()

              if (!response.ok) {
                setError(data.error || "Fehler beim Veröffentlichen des Templates")
                setLoading(false)
                return
              }

              setSaved(true)
              setLoading(false)
              showNotification("Template erfolgreich veröffentlicht", "success")
              
              // Refresh page to show updated data
              setTimeout(() => {
                router.refresh()
              }, 1000)
            } catch (err: any) {
              setError(err.message || "Ein Fehler ist aufgetreten")
              setLoading(false)
            }
          }

          await publishTemplate()
        }}
        onCancel={() => setShowPublishDialog(false)}
      />
    </div>
  )
}
