"use client"

/**
 * Template Editor Content (Client Component)
 * 
 * Editable form for template editing
 * Receives template data as props (no client-side fetching)
 */

import { useState } from "react"
import { useRouter } from "next/navigation"

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
  industry: string | null
  version: number
  status: string
  description: string | null
  effectiveFrom: Date | null
  supersedesVersion: number | null
  blocks: TemplateBlock[]
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
  { value: "reference", label: "Referenz" }
]

const statusOptions = [
  { value: "draft", label: "Entwurf" },
  { value: "active", label: "Aktiv" },
  { value: "archived", label: "Archiviert" }
]

export default function TemplateEditorContent({ template, canEdit }: TemplateEditorContentProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [creatingNewVersion, setCreatingNewVersion] = useState(false)

  // CRITICAL: Only drafts can be edited
  const isEditable = template.status === "draft" && canEdit
  const isActive = template.status === "active"
  const isArchived = template.status === "archived"

  const [name, setName] = useState(template.name)
  const [description, setDescription] = useState(template.description || "")
  const [status, setStatus] = useState(template.status)
  const [blocks, setBlocks] = useState<TemplateBlock[]>(template.blocks)

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
        description: description || null,
        status,
        blocks: blocks.map((block, blockIndex) => ({
          name: block.name,
          fields: block.fields.map((field, fieldIndex) => ({
            label: field.label,
            key: field.key,
            type: field.type,
            required: field.required,
            config: field.config ? JSON.parse(field.config) : null
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
        setError(data.error || "Fehler beim Aktualisieren des Templates")
        setLoading(false)
        return
      }

      setSaved(true)
      setLoading(false)
      
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
      console.log("Creating new version for template:", template.id)
      const response = await fetch(`/api/super-admin/templates/${template.id}/new-version`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unbekannter Fehler" }))
        console.error("API error:", errorData)
        setError(errorData.error || `Fehler beim Erstellen der neuen Version (${response.status})`)
        setCreatingNewVersion(false)
        return
      }

      const data = await response.json()
      console.log("New version created:", data.template?.id)

      // Redirect to new template editor
      if (data.template?.id) {
        router.push(`/super-admin/templates/${data.template.id}`)
      } else {
        setError("Ungültige Antwort vom Server")
        setCreatingNewVersion(false)
      }
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
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            fontSize: "0.875rem",
            color: "#7A7A7A",
            marginBottom: "0.5rem"
          }}>
            <span>Kategorie: {template.category || "Keine"}</span>
            <span>•</span>
            <span>Version {template.version}</span>
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
                        fontSize: "0.75rem",
                        color: "#7A7A7A",
                        fontFamily: "monospace",
                        marginBottom: "0.5rem"
                      }}>
                        {field.key}
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
              onChange={(e) => setStatus(e.target.value)}
              disabled={loading || !isEditable}
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

          <div style={{
            fontSize: "0.875rem",
            color: "#7A7A7A"
          }}>
            <div>Kategorie: {template.category || "Keine"}</div>
            <div>Version: {template.version}</div>
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
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem"
            }}>
              <input
                type="text"
                value={block.name}
                onChange={(e) => updateBlockName(block.id, e.target.value)}
                placeholder={`Block ${blockIndex + 1} Name`}
                disabled={loading || !isEditable}
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
                  <button
                    type="button"
                    onClick={() => deleteBlock(block.id)}
                    disabled={loading || !isEditable}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#DC2626",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    cursor: loading ? "not-allowed" : "pointer"
                  }}
                >
                  Block löschen
                </button>
              )}
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
                        disabled={loading || !isEditable}
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
                        disabled={loading || !isEditable}
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
                          disabled={loading || !isEditable}
                        />
                        Pflicht
                      </label>
                      <button
                        type="button"
                        onClick={() => deleteField(block.id, field.id)}
                        disabled={loading || !isEditable}
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

      {/* Submit */}
      <div style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: "1rem"
      }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: loading ? "#CDCDCD" : "#E20074",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "8px",
            fontSize: "0.95rem",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Wird gespeichert..." : "Änderungen speichern"}
        </button>
      </div>
    </form>
  )
}
