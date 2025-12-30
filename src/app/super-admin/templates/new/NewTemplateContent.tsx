"use client"

/**
 * New Template Content (Client Component)
 * 
 * Form to create a new template
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Block {
  id: string
  name: string
  fields: Field[]
}

interface Field {
  id: string
  label: string
  key: string
  type: string
  required: boolean
  config: any | null
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
  { value: "reference", label: "Referenz" }
]

const categories = [
  { value: "FURNITURE", label: "Möbel" },
  { value: "TEXTILE", label: "Textilien" },
  { value: "OTHER", label: "Sonstige" }
]

interface ExistingTemplate {
  id: string
  name: string
  category: string | null
  version: number
  blocks: Array<{
    id: string
    name: string
    order: number
    fields: Array<{
      id: string
      label: string
      key: string
      type: string
      required: boolean
      regulatoryRequired: boolean
      config: string | null
      order: number
    }>
  }>
}

interface NewTemplateContentProps {
  existingTemplates: ExistingTemplate[]
}

// Canonical block names (must match DPP structure)
const CANONICAL_BLOCKS = [
  "Basis- & Produktdaten",
  "Materialien & Zusammensetzung",
  "Nutzung, Pflege & Lebensdauer",
  "Rechtliches & Konformität",
  "Rücknahme & Second Life"
]

export default function NewTemplateContent({ existingTemplates }: NewTemplateContentProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(true) // Show dialog on mount
  const [creationMode, setCreationMode] = useState<"from-existing" | "empty" | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [categoryLocked, setCategoryLocked] = useState(false) // Lock category after selection
  
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [industry, setIndustry] = useState("")
  const [description, setDescription] = useState("")
  const [blocks, setBlocks] = useState<Block[]>([])

  const addBlock = () => {
    setBlocks([...blocks, {
      id: Date.now().toString(),
      name: "",
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
                id: Date.now().toString(),
                label: "",
                key: "",
                type: "text",
                required: false,
                config: null
              }
            ]
          }
        : block
    ))
  }

  const updateField = (blockId: string, fieldId: string, updates: Partial<Field>) => {
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

  // Initialize blocks based on creation mode
  const initializeFromTemplate = (template: ExistingTemplate) => {
    setName(`${template.name} (Kopie)`)
    setCategory(template.category || "")
    setCategoryLocked(true) // Lock category after selection
    setDescription("") // Don't copy description, let user set new one
    
    // Clone blocks and fields
    const clonedBlocks: Block[] = template.blocks.map(block => ({
      id: `block-${Date.now()}-${Math.random()}`,
      name: block.name,
      fields: block.fields.map(field => ({
        id: `field-${Date.now()}-${Math.random()}`,
        label: field.label,
        key: field.key,
        type: field.type,
        required: field.required,
        config: field.config ? JSON.parse(field.config) : null
      }))
    }))
    setBlocks(clonedBlocks)
    setShowDialog(false)
  }

  const initializeEmpty = () => {
    // Category must be set before creating empty template
    // This function is called after category is selected in dialog
    // Create 5 canonical blocks
    const canonicalBlocks: Block[] = CANONICAL_BLOCKS.map((blockName, index) => ({
      id: `block-${Date.now()}-${index}`,
      name: blockName,
      fields: []
    }))
    setBlocks(canonicalBlocks)
    setShowDialog(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validate
      if (!name || !category) {
        setError("Name und Kategorie sind erforderlich")
        setLoading(false)
        return
      }

      // Validate blocks (must have at least one)
      if (blocks.length === 0) {
        setError("Mindestens ein Block ist erforderlich")
        setLoading(false)
        return
      }

      // Validate blocks
      for (const block of blocks) {
        if (!block.name || block.name.trim() === "") {
          setError("Alle Blöcke benötigen einen Namen")
          setLoading(false)
          return
        }
      }

      // Validate fields
      for (const block of blocks) {
        for (const field of block.fields) {
          if (!field.label || !field.key) {
            setError("Alle Felder benötigen einen Label und Key")
            setLoading(false)
            return
          }
        }
      }

      // Prepare data
      const templateData = {
        name,
        category,
        industry: industry || null,
        description: description || null,
        blocks: blocks.map(block => ({
          name: block.name,
          fields: block.fields.map(field => ({
            label: field.label,
            key: field.key,
            type: field.type,
            required: field.required,
            config: field.config
          }))
        }))
      }

      const response = await fetch("/api/super-admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateData)
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Fehler beim Erstellen des Templates")
        setLoading(false)
        return
      }

      // Redirect to template editor
      router.push(`/super-admin/templates/${data.template.id}`)
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist aufgetreten")
      setLoading(false)
    }
  }

  // Show dialog until user chooses a mode
  if (showDialog) {
    return (
      <div style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E5E5E5",
        borderRadius: "12px",
        padding: "2rem",
        maxWidth: "600px",
        margin: "0 auto"
      }}>
        <h2 style={{
          fontSize: "1.5rem",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "1rem"
        }}>
          Template-Erstellung
        </h2>
        <p style={{
          fontSize: "0.95rem",
          color: "#7A7A7A",
          marginBottom: "2rem"
        }}>
          Wählen Sie, wie Sie das neue Template erstellen möchten:
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
          {/* Option A: From Existing */}
          <div style={{
            border: creationMode === "from-existing" ? "2px solid #E20074" : "2px solid #E5E5E5",
            borderRadius: "8px",
            padding: "1.5rem",
            cursor: "pointer",
            transition: "all 0.2s",
            backgroundColor: creationMode === "from-existing" ? "#FFF5F9" : "#FFFFFF"
          }}
          onClick={() => setCreationMode("from-existing")}
          onMouseEnter={(e) => {
            if (creationMode !== "from-existing") {
              e.currentTarget.style.borderColor = "#E20074"
            }
          }}
          onMouseLeave={(e) => {
            if (creationMode !== "from-existing") {
              e.currentTarget.style.borderColor = "#E5E5E5"
            }
          }}>
            <h3 style={{
              fontSize: "1.1rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Von bestehender Vorlage erstellen
            </h3>
            <p style={{
              fontSize: "0.9rem",
              color: "#7A7A7A",
              marginBottom: creationMode === "from-existing" ? "1rem" : "0"
            }}>
              Klont die Block-Struktur eines vorhandenen aktiven Templates
            </p>
            {creationMode === "from-existing" && (
              <div>
                <label htmlFor="template-select" style={{
                  display: "block",
                  fontSize: "0.95rem",
                  fontWeight: "500",
                  color: "#0A0A0A",
                  marginBottom: "0.5rem"
                }}>
                  Vorlage auswählen *
                </label>
                <select
                  id="template-select"
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
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
                  <option value="">Bitte wählen...</option>
                  {existingTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.category}) - Version {template.version}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Option B: Empty */}
          <div style={{
            border: creationMode === "empty" ? "2px solid #E20074" : "2px solid #E5E5E5",
            borderRadius: "8px",
            padding: "1.5rem",
            cursor: "pointer",
            transition: "all 0.2s",
            backgroundColor: creationMode === "empty" ? "#FFF5F9" : "#FFFFFF"
          }}
          onClick={() => setCreationMode("empty")}
          onMouseEnter={(e) => {
            if (creationMode !== "empty") {
              e.currentTarget.style.borderColor = "#E20074"
            }
          }}
          onMouseLeave={(e) => {
            if (creationMode !== "empty") {
              e.currentTarget.style.borderColor = "#E5E5E5"
            }
          }}>
            <h3 style={{
              fontSize: "1.1rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Leeres Template erstellen
            </h3>
            <p style={{
              fontSize: "0.9rem",
              color: "#7A7A7A"
            }}>
              Erstellt ein neues Template mit den 5 kanonischen Blöcken (ohne Felder)
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
          <Link
            href="/super-admin/templates"
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#FFFFFF",
              color: "#0A0A0A",
              border: "1px solid #CDCDCD",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "0.95rem",
              fontWeight: "600",
              display: "inline-block"
            }}
          >
            Abbrechen
          </Link>
          <button
            type="button"
            onClick={() => {
              if (creationMode === "from-existing") {
                if (!selectedTemplateId) {
                  setError("Bitte wählen Sie eine Vorlage aus")
                  return
                }
                const selectedTemplate = existingTemplates.find(t => t.id === selectedTemplateId)
                if (selectedTemplate) {
                  initializeFromTemplate(selectedTemplate)
                }
              } else if (creationMode === "empty") {
                initializeEmpty()
              } else {
                setError("Bitte wählen Sie eine Option aus")
              }
            }}
            disabled={!creationMode || (creationMode === "from-existing" && !selectedTemplateId)}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: creationMode && (creationMode === "empty" || selectedTemplateId) ? "#E20074" : "#CDCDCD",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.95rem",
              fontWeight: "600",
              cursor: creationMode && (creationMode === "empty" || selectedTemplateId) ? "pointer" : "not-allowed"
            }}
          >
            Weiter
          </button>
        </div>

        {error && (
          <div style={{
            backgroundColor: "#FFF5F9",
            border: "1px solid #E20074",
            borderRadius: "8px",
            padding: "1rem",
            marginTop: "1rem",
            color: "#E20074",
            fontSize: "0.95rem"
          }}>
            {error}
          </div>
        )}
      </div>
    )
  }

  return (
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
              disabled={loading}
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
            <label htmlFor="category" style={{
              display: "block",
              fontSize: "0.95rem",
              fontWeight: "500",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Kategorie * (Pflichteingabefeld, nicht änderbar nach Erstellung)
            </label>
            <input
              id="category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value.toUpperCase())}
              required
              disabled={loading || categoryLocked}
              placeholder="z.B. FURNITURE, TEXTILE, OTHER"
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "8px",
                fontSize: "1rem",
                boxSizing: "border-box",
                backgroundColor: categoryLocked ? "#F5F5F5" : "#FFFFFF",
                textTransform: "uppercase",
                cursor: categoryLocked ? "not-allowed" : "text"
              }}
            />
            <p style={{
              fontSize: "0.75rem",
              color: "#7A7A7A",
              marginTop: "0.25rem"
            }}>
              {categoryLocked ? "Kategorie ist nach Erstellung nicht änderbar." : "Gültige Kategorien: FURNITURE, TEXTILE, OTHER"}
            </p>
          </div>

          <div>
            <label htmlFor="industry" style={{
              display: "block",
              fontSize: "0.95rem",
              fontWeight: "500",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Branche (optional)
            </label>
            <input
              id="industry"
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              disabled={loading}
              placeholder="z.B. furniture, textile"
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
              Beschreibung (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
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
            <div className="new-template-block-header-container" style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              marginBottom: "1.5rem"
            }}>
              <input
                type="text"
                value={block.name}
                onChange={(e) => updateBlockName(block.id, e.target.value)}
                placeholder={`Block ${blockIndex + 1} Name`}
                disabled={loading}
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  color: "#0A0A0A",
                  border: "none",
                  borderBottom: "2px solid #E20074",
                  padding: "0.5rem 0",
                  outline: "none",
                  width: "100%",
                  maxWidth: "500px"
                }}
              />
              {blocks.length > 1 && (
                <div className="new-template-block-actions" style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  width: "100%"
                }}>
                  <div className="new-template-block-delete" style={{ width: "100%" }}>
                    <button
                      type="button"
                      onClick={() => deleteBlock(block.id)}
                      disabled={loading}
                      title="Block löschen"
                      className="new-template-block-delete-button"
                      style={{
                        padding: "0.625rem",
                        backgroundColor: "#DC2626",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        cursor: loading ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        width: "100%",
                        minWidth: "48px",
                        minHeight: "48px"
                      }}
                    >
                      <span className="new-template-block-delete-text">Block löschen</span>
                      <svg
                        className="new-template-block-delete-icon"
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

            {/* Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {block.fields.map((field, fieldIndex) => (
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
                    display: "grid",
                    gridTemplateColumns: "2fr 2fr 1fr auto auto",
                    gap: "1rem",
                    alignItems: "center"
                  }}>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateField(block.id, field.id, { label: e.target.value })}
                      placeholder="Label"
                      disabled={loading}
                      style={{
                        padding: "0.5rem",
                        border: "1px solid #CDCDCD",
                        borderRadius: "6px",
                        fontSize: "0.95rem",
                        boxSizing: "border-box"
                      }}
                    />
                    <input
                      type="text"
                      value={field.key}
                      onChange={(e) => updateField(block.id, field.id, { key: e.target.value })}
                      placeholder="Key (z.B. productName)"
                      disabled={loading}
                      style={{
                        padding: "0.5rem",
                        border: "1px solid #CDCDCD",
                        borderRadius: "6px",
                        fontSize: "0.95rem",
                        fontFamily: "monospace",
                        boxSizing: "border-box"
                      }}
                    />
                    <select
                      value={field.type}
                      onChange={(e) => updateField(block.id, field.id, { type: e.target.value })}
                      disabled={loading}
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
                    <label style={{
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
                        disabled={loading}
                      />
                      Pflicht
                    </label>
                    <button
                      type="button"
                      onClick={() => deleteField(block.id, field.id)}
                      disabled={loading}
                      style={{
                        padding: "0.5rem 0.75rem",
                        backgroundColor: "transparent",
                        color: "#DC2626",
                        border: "1px solid #DC2626",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                        cursor: loading ? "not-allowed" : "pointer",
                        whiteSpace: "nowrap",
                        boxSizing: "border-box"
                      }}
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => addField(block.id)}
                disabled={loading}
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
          disabled={loading}
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

      {/* Submit */}
      <div style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: "clamp(0.75rem, 2vw, 1rem)",
        flexWrap: "wrap",
        marginTop: "clamp(1.5rem, 4vw, 2rem)",
        paddingTop: "clamp(1rem, 3vw, 1.5rem)"
      }}
      className="template-submit-container"
      >
        <Link
          href="/super-admin/templates"
          style={{
            padding: "clamp(0.625rem, 1.5vw, 0.75rem) clamp(1rem, 2.5vw, 1.5rem)",
            backgroundColor: "#FFFFFF",
            color: "#0A0A0A",
            border: "1px solid #CDCDCD",
            borderRadius: "8px",
            textDecoration: "none",
            fontSize: "clamp(0.875rem, 2vw, 0.95rem)",
            fontWeight: "600",
            display: "inline-block",
            whiteSpace: "nowrap",
            flexShrink: 0
          }}
        >
          Abbrechen
        </Link>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "clamp(0.625rem, 1.5vw, 0.75rem) clamp(1rem, 2.5vw, 1.5rem)",
            backgroundColor: loading ? "#CDCDCD" : "#E20074",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "8px",
            fontSize: "clamp(0.875rem, 2vw, 0.95rem)",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
            transition: "background-color 0.2s"
          }}
        >
          {loading ? "Wird erstellt..." : "Template erstellen"}
        </button>
        <style jsx>{`
          @media (max-width: 640px) {
            .template-submit-container {
              flex-direction: column-reverse !important;
              width: 100% !important;
            }
            .template-submit-container > * {
              width: 100% !important;
              text-align: center !important;
            }
          }
          @media (max-width: 768px) {
            .new-template-block-header-container {
              flex-direction: column !important;
              align-items: flex-start !important;
            }
            .new-template-block-actions {
              margin-top: 0.5rem;
            }
            .new-template-block-delete {
              width: 100% !important;
            }
            .new-template-block-delete-button {
              width: 100% !important;
            }
            .new-template-block-delete-text {
              display: none !important;
            }
            .new-template-block-delete-icon {
              display: block !important;
            }
          }
          @media (min-width: 769px) {
            .new-template-block-header-container {
              flex-direction: row !important;
              justify-content: space-between !important;
              align-items: center !important;
            }
            .new-template-block-actions {
              margin-top: 0 !important;
              width: auto !important;
            }
            .new-template-block-delete {
              width: auto !important;
            }
            .new-template-block-delete-button {
              width: auto !important;
              padding: 0.5rem 1rem !important;
            }
            .new-template-block-delete-text {
              display: inline !important;
            }
            .new-template-block-delete-icon {
              display: none !important;
            }
          }
        `}</style>
      </div>
    </form>
  )
}

