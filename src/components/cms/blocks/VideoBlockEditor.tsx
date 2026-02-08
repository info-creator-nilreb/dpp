"use client"

/**
 * Video Block Editor
 */

import { useState } from "react"

interface VideoBlockEditorProps {
  content: Record<string, any>
  onChange: (content: Record<string, any>) => void
  dppId?: string
}

export default function VideoBlockEditor({
  content,
  onChange,
  dppId
}: VideoBlockEditorProps) {
  const data = {
    url: content.url || "",
    title: content.title || "",
    description: content.description || "",
    autoplay: content.autoplay || false,
    loop: content.loop || false
  }

  function updateField(field: string, value: any) {
    onChange({
      ...data,
      [field]: value
    })
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* URL */}
      <div>
        <label style={{
          display: "block",
          fontSize: "0.875rem",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          Video-URL <span style={{ color: "#DC2626" }}>*</span>
        </label>
        <input
          type="url"
          value={data.url}
          onChange={(e) => updateField("url", e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
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
            e.target.style.boxShadow = "0 0 0 3px rgba(36, 197, 152, 0.2)"
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#E5E5E5"
            e.target.style.boxShadow = "none"
          }}
        />
        <div style={{
          fontSize: "0.75rem",
          color: "#7A7A7A",
          marginTop: "0.5rem"
        }}>
          Unterstützt: YouTube, Vimeo, direktes Video-URL
        </div>
      </div>

      {/* Title */}
      <div>
        <label style={{
          display: "block",
          fontSize: "0.875rem",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          Titel
        </label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="Video-Titel"
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
            e.target.style.boxShadow = "0 0 0 3px rgba(36, 197, 152, 0.2)"
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#E5E5E5"
            e.target.style.boxShadow = "none"
          }}
          maxLength={200}
        />
      </div>

      {/* Description */}
      <div>
        <label style={{
          display: "block",
          fontSize: "0.875rem",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          Beschreibung
        </label>
        <textarea
          value={data.description}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="Video-Beschreibung"
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
            e.target.style.borderColor = "#24c598"
            e.target.style.boxShadow = "0 0 0 3px rgba(36, 197, 152, 0.2)"
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#E5E5E5"
            e.target.style.boxShadow = "none"
          }}
          maxLength={1000}
        />
      </div>

      {/* Options */}
      <div>
        <label style={{
          display: "block",
          fontSize: "0.875rem",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          Optionen
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
              checked={data.autoplay}
              onChange={(e) => updateField("autoplay", e.target.checked)}
              style={{
                width: "18px",
                height: "18px",
                cursor: "pointer"
              }}
            />
            <span style={{ fontSize: "0.875rem", color: "#0A0A0A" }}>
              Automatisch abspielen
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
              checked={data.loop}
              onChange={(e) => updateField("loop", e.target.checked)}
              style={{
                width: "18px",
                height: "18px",
                cursor: "pointer"
              }}
            />
            <span style={{ fontSize: "0.875rem", color: "#0A0A0A" }}>
              Wiederholen (Loop)
            </span>
          </label>
        </div>
      </div>
    </div>
  )
}

