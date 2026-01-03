"use client"

/**
 * Timeline Block Editor
 */

import { useState } from "react"

interface TimelineBlockEditorProps {
  content: Record<string, any>
  onChange: (content: Record<string, any>) => void
}

export default function TimelineBlockEditor({
  content,
  onChange
}: TimelineBlockEditorProps) {
  const data = {
    title: content.title || "",
    events: content.events || []
  }

  function updateField(field: string, value: any) {
    onChange({
      ...data,
      [field]: value
    })
  }

  function addEvent() {
    updateField("events", [
      ...data.events,
      { date: "", title: "", description: "" }
    ])
  }

  function updateEvent(index: number, field: string, value: string) {
    const events = [...data.events]
    events[index] = { ...events[index], [field]: value }
    updateField("events", events)
  }

  function removeEvent(index: number) {
    const events = [...data.events]
    events.splice(index, 1)
    updateField("events", events)
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
          placeholder="Timeline-Überschrift"
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

      {/* Events */}
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
            Ereignisse
          </label>
          <button
            type="button"
            onClick={addEvent}
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
            + Ereignis hinzufügen
          </button>
        </div>

        {data.events.length === 0 ? (
          <div style={{
            padding: "2rem",
            textAlign: "center",
            backgroundColor: "#F9F9F9",
            border: "1px dashed #E5E5E5",
            borderRadius: "8px",
            color: "#7A7A7A",
            fontSize: "0.875rem"
          }}>
            Keine Ereignisse. Klicken Sie auf "+ Ereignis hinzufügen"
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {data.events.map((event: any, index: number) => (
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
                    Ereignis {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeEvent(index)}
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
                    value={event.date || ""}
                    onChange={(e) => updateEvent(index, "date", e.target.value)}
                    placeholder="Datum (z.B. 2024)"
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
                  />
                  <input
                    type="text"
                    value={event.title || ""}
                    onChange={(e) => updateEvent(index, "title", e.target.value)}
                    placeholder="Titel *"
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
                  <textarea
                    value={event.description || ""}
                    onChange={(e) => updateEvent(index, "description", e.target.value)}
                    placeholder="Beschreibung"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #E5E5E5",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                      minHeight: "80px",
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
                    maxLength={1000}
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

