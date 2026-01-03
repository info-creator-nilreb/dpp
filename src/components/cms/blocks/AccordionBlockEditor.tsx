"use client"

/**
 * Accordion Block Editor
 */

import { useState } from "react"

interface AccordionBlockEditorProps {
  content: Record<string, any>
  onChange: (content: Record<string, any>) => void
}

export default function AccordionBlockEditor({
  content,
  onChange
}: AccordionBlockEditorProps) {
  const data = {
    title: content.title || "",
    items: content.items || []
  }

  function updateField(field: string, value: any) {
    onChange({
      ...data,
      [field]: value
    })
  }

  function addItem() {
    updateField("items", [
      ...data.items,
      { question: "", answer: "" }
    ])
  }

  function updateItem(index: number, field: string, value: string) {
    const items = [...data.items]
    items[index] = { ...items[index], [field]: value }
    updateField("items", items)
  }

  function removeItem(index: number) {
    const items = [...data.items]
    items.splice(index, 1)
    updateField("items", items)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Title */}
      <div>
        <label style={{
          display: "block",
          fontSize: "0.875rem",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          Überschrift
        </label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="Accordion-Überschrift"
          style={{
            width: "100%",
            padding: "0.75rem",
            border: "1px solid #E5E5E5",
            borderRadius: "8px",
            fontSize: "0.875rem",
            transition: "all 0.2s"
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#E20074"
            e.target.style.boxShadow = "0 0 0 3px rgba(226, 0, 116, 0.1)"
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#E5E5E5"
            e.target.style.boxShadow = "none"
          }}
          maxLength={200}
        />
      </div>

      {/* Items */}
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
            Fragen & Antworten
          </label>
          <button
            type="button"
            onClick={addItem}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              color: "#E20074",
              backgroundColor: "#FFF5F9",
              border: "1px solid #E20074",
              borderRadius: "8px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#E20074"
              e.currentTarget.style.color = "#FFFFFF"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#FFF5F9"
              e.currentTarget.style.color = "#E20074"
            }}
          >
            + Element hinzufügen
          </button>
        </div>

        {data.items.length === 0 ? (
          <div style={{
            padding: "2rem",
            textAlign: "center",
            backgroundColor: "#F9F9F9",
            border: "1px dashed #E5E5E5",
            borderRadius: "8px",
            color: "#7A7A7A",
            fontSize: "0.875rem"
          }}>
            Keine Elemente. Klicken Sie auf "+ Element hinzufügen"
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {data.items.map((item: any, index: number) => (
              <div key={index} style={{
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
                    Element {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
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
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <input
                    type="text"
                    value={item.question || ""}
                    onChange={(e) => updateItem(index, "question", e.target.value)}
                    placeholder="Frage *"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #E5E5E5",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      transition: "all 0.2s"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#E20074"
                      e.target.style.boxShadow = "0 0 0 3px rgba(226, 0, 116, 0.1)"
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#E5E5E5"
                      e.target.style.boxShadow = "none"
                    }}
                    maxLength={200}
                  />
                  <textarea
                    value={item.answer || ""}
                    onChange={(e) => updateItem(index, "answer", e.target.value)}
                    placeholder="Antwort *"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #E5E5E5",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                      minHeight: "100px",
                      resize: "vertical",
                      fontFamily: "inherit",
                      transition: "all 0.2s"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#E20074"
                      e.target.style.boxShadow = "0 0 0 3px rgba(226, 0, 116, 0.1)"
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#E5E5E5"
                      e.target.style.boxShadow = "none"
                    }}
                    maxLength={2000}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

