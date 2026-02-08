"use client"

/**
 * Quick Poll Block Editor
 * 
 * Styling konsistent mit anderen CMS-Komponenten (AccordionBlockEditor, TextBlockEditor)
 */

import { QuickPollBlockContent } from "@/lib/cms/types"

interface QuickPollBlockEditorProps {
  content: Record<string, any>
  onChange: (content: QuickPollBlockContent) => void
}

export default function QuickPollBlockEditor({
  content,
  onChange
}: QuickPollBlockEditorProps) {
  const data: QuickPollBlockContent = {
    question: content.question || "",
    options: content.options || [],
    allowMultiple: content.allowMultiple || false,
    showResults: content.showResults || false,
    completionMessage: content.completionMessage || "Vielen Dank für Ihre Teilnahme!"
  }

  function updateField(field: keyof QuickPollBlockContent, value: any) {
    onChange({
      ...data,
      [field]: value
    })
  }

  function addOption() {
    const newOption = {
      id: `opt_${Date.now()}`,
      label: ""
    }
    updateField("options", [...data.options, newOption])
  }

  function updateOption(index: number, field: string, value: string) {
    const options = [...data.options]
    options[index] = { ...options[index], [field]: value }
    updateField("options", options)
  }

  function removeOption(index: number) {
    const options = [...data.options]
    options.splice(index, 1)
    updateField("options", options)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Question */}
      <div>
        <label style={{
          display: "block",
          fontSize: "0.875rem",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          Frage <span style={{ color: "#24c598" }}>*</span>
        </label>
        <input
          type="text"
          value={data.question}
          onChange={(e) => updateField("question", e.target.value)}
          placeholder="Frage eingeben"
          style={{
            width: "100%",
            padding: "0.75rem",
            border: "1px solid #E5E5E5",
            borderRadius: "8px",
            fontSize: "0.875rem",
            transition: "all 0.2s"
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#24c598"
            e.target.style.boxShadow = "0 0 0 3px rgba(36, 197, 152, 0.1)"
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#E5E5E5"
            e.target.style.boxShadow = "none"
          }}
          maxLength={300}
        />
      </div>

      {/* Options */}
      <div>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem"
        }}>
          <label style={{
            display: "block",
            fontSize: "0.875rem",
            fontWeight: "600",
            color: "#0A0A0A"
          }}>
            Optionen <span style={{ color: "#24c598" }}>*</span> (mindestens 2)
          </label>
          <button
            type="button"
            onClick={addOption}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              color: "#24c598",
              backgroundColor: "#ECFDF5",
              border: "1px solid #24c598",
              borderRadius: "8px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#24c598"
              e.currentTarget.style.color = "#FFFFFF"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ECFDF5"
              e.currentTarget.style.color = "#24c598"
            }}
          >
            + Option hinzufügen
          </button>
        </div>

        {data.options.length === 0 ? (
          <div style={{
            padding: "2rem",
            textAlign: "center",
            backgroundColor: "#F9F9F9",
            border: "1px dashed #E5E5E5",
            borderRadius: "8px",
            color: "#7A7A7A",
            fontSize: "0.875rem"
          }}>
            Fügen Sie mindestens 2 Optionen hinzu
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {data.options.map((option, index) => (
              <div key={option.id || index} style={{
                padding: "1rem",
                border: "1px solid #E5E5E5",
                borderRadius: "8px",
                backgroundColor: "#FFFFFF"
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "0.75rem"
                }}>
                  <span style={{
                    fontSize: "0.75rem",
                    fontWeight: "500",
                    color: "#7A7A7A"
                  }}>
                    Option {index + 1}
                  </span>
                  {data.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      style={{
                        padding: "0.5rem",
                        color: "#DC2626",
                        backgroundColor: "transparent",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#FEF2F2"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent"
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={option.label}
                  onChange={(e) => updateOption(index, "label", e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #E5E5E5",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#24c598"
                    e.target.style.boxShadow = "0 0 0 3px rgba(36, 197, 152, 0.1)"
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#E5E5E5"
                    e.target.style.boxShadow = "none"
                  }}
                  maxLength={200}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings */}
      <div>
        <label style={{
          display: "block",
          fontSize: "0.875rem",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "0.75rem"
        }}>
          Einstellungen
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            cursor: "pointer"
          }}>
            <input
              type="checkbox"
              checked={data.allowMultiple}
              onChange={(e) => updateField("allowMultiple", e.target.checked)}
              style={{
                width: "18px",
                height: "18px",
                cursor: "pointer",
                accentColor: "#24c598"
              }}
            />
            <span style={{
              fontSize: "0.875rem",
              color: "#0A0A0A"
            }}>
              Mehrfachauswahl erlauben
            </span>
          </label>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            cursor: "pointer"
          }}>
            <input
              type="checkbox"
              checked={data.showResults}
              onChange={(e) => updateField("showResults", e.target.checked)}
              style={{
                width: "18px",
                height: "18px",
                cursor: "pointer",
                accentColor: "#24c598"
              }}
            />
            <span style={{
              fontSize: "0.875rem",
              color: "#0A0A0A"
            }}>
              Ergebnisse anzeigen
            </span>
          </label>
        </div>
      </div>

      {/* Completion Message */}
      <div>
        <label style={{
          display: "block",
          fontSize: "0.875rem",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          Dankesnachricht
        </label>
        <input
          type="text"
          value={data.completionMessage || ""}
          onChange={(e) => updateField("completionMessage" as any, e.target.value)}
          placeholder="Vielen Dank für Ihre Teilnahme!"
          style={{
            width: "100%",
            padding: "0.75rem",
            border: "1px solid #E5E5E5",
            borderRadius: "8px",
            fontSize: "0.875rem",
            transition: "all 0.2s"
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#24c598"
            e.target.style.boxShadow = "0 0 0 3px rgba(36, 197, 152, 0.1)"
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#E5E5E5"
            e.target.style.boxShadow = "none"
          }}
          maxLength={200}
        />
        <p style={{
          fontSize: "0.75rem",
          color: "#7A7A7A",
          marginTop: "0.5rem",
          marginBottom: 0
        }}>
          Diese Nachricht wird nach dem Absenden der Umfrage angezeigt
        </p>
      </div>
    </div>
  )
}

