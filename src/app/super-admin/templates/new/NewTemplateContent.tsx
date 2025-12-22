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

export default function NewTemplateContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [industry, setIndustry] = useState("")
  const [description, setDescription] = useState("")
  const [blocks, setBlocks] = useState<Block[]>([
    {
      id: "1",
      name: "Produktinformationen",
      fields: []
    }
  ])

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
              Kategorie *
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              disabled={loading}
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
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
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
                <button
                  type="button"
                  onClick={() => deleteBlock(block.id)}
                  disabled={loading}
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
        gap: "1rem"
      }}>
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
          {loading ? "Wird erstellt..." : "Template erstellen"}
        </button>
      </div>
    </form>
  )
}

