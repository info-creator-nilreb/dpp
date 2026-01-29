"use client"

/**
 * Text Block Editor
 * 
 * Shopify-Style Editor mit Rich-Text-Optionen
 */

import { useState, useRef, useEffect } from "react"

interface TextBlockEditorProps {
  content: Record<string, any>
  onChange: (content: Record<string, any>) => void
}

export default function TextBlockEditor({
  content,
  onChange
}: TextBlockEditorProps) {
  const [selectedText, setSelectedText] = useState("")
  const [localContent, setLocalContent] = useState({
    heading: content.heading || "",
    text: content.text || "",
    alignment: content.alignment || "left",
    fontSize: content.fontSize || "medium",
    fontWeight: content.fontWeight || "normal",
    fontStyle: content.fontStyle || "normal",
    textDecoration: content.textDecoration || "none"
  })
  const isUserTypingRef = useRef(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Update local content only when block.id changes (different block)
  // Don't update while user is typing
  useEffect(() => {
    if (!isUserTypingRef.current) {
      setLocalContent({
        heading: content.heading || "",
        text: content.text || "",
        alignment: content.alignment || "left",
        fontSize: content.fontSize || "medium",
        fontWeight: content.fontWeight || "normal",
        fontStyle: content.fontStyle || "normal",
        textDecoration: content.textDecoration || "none"
      })
    }
  }, [content.heading, content.alignment, content.fontSize, content.fontWeight, content.fontStyle, content.textDecoration]) // Exclude text to prevent overwriting while typing

  const data = localContent

  function updateField(field: string, value: any) {
    const newContent = {
      ...data,
      [field]: value
    }
    setLocalContent(newContent)
    
    // Mark that user is typing for text fields
    // CRITICAL: Longer timeout to prevent last character from being cut off
    if (field === "text") {
      isUserTypingRef.current = true
      
      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Set new timeout - longer to ensure last character is saved
      typingTimeoutRef.current = setTimeout(() => {
        isUserTypingRef.current = false
      }, 1500) // Longer timeout to ensure last character is saved
    }
    
    onChange(newContent)
  }
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Heading */}
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
          value={data.heading}
          onChange={(e) => updateField("heading", e.target.value)}
          placeholder="Überschrift eingeben"
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
            e.target.style.boxShadow = "0 0 0 3px rgba(226, 0, 116, 0.1)"
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#E5E5E5"
            e.target.style.boxShadow = "none"
          }}
          maxLength={200}
        />
      </div>

      {/* Text Formatting Options */}
      <div>
        <label style={{
          display: "block",
          fontSize: "0.875rem",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          Formatierung
        </label>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "0.75rem"
        }}>
          {/* Font Size */}
          <div>
            <label style={{
              display: "block",
              fontSize: "0.75rem",
              color: "#7A7A7A",
              marginBottom: "0.25rem"
            }}>
              Schriftgröße
            </label>
            <select
              value={data.fontSize}
              onChange={(e) => updateField("fontSize", e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #E5E5E5",
                borderRadius: "8px",
                fontSize: "0.875rem",
                backgroundColor: "#FFFFFF",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#24c598"
                e.target.style.boxShadow = "0 0 0 3px rgba(226, 0, 116, 0.1)"
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#E5E5E5"
                e.target.style.boxShadow = "none"
              }}
            >
              <option value="small">Klein</option>
              <option value="medium">Mittel</option>
              <option value="large">Groß</option>
            </select>
          </div>

          {/* Alignment */}
          <div>
            <label style={{
              display: "block",
              fontSize: "0.75rem",
              color: "#7A7A7A",
              marginBottom: "0.25rem"
            }}>
              Ausrichtung
            </label>
            <div style={{
              display: "flex",
              gap: "0.5rem"
            }}>
              {[
                { value: "left", icon: "←" },
                { value: "center", icon: "↔" },
                { value: "right", icon: "→" }
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateField("alignment", option.value)}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    border: `1px solid ${data.alignment === option.value ? "#24c598" : "#E5E5E5"}`,
                    borderRadius: "8px",
                    fontSize: "1rem",
                    fontWeight: data.alignment === option.value ? "600" : "400",
                    color: data.alignment === option.value ? "#24c598" : "#0A0A0A",
                    backgroundColor: data.alignment === option.value ? "#FFF5F9" : "#FFFFFF",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {option.icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Text Style Buttons */}
        <div style={{
          display: "flex",
          gap: "0.5rem",
          marginTop: "0.75rem"
        }}>
          <button
            type="button"
            onClick={() => updateField("fontWeight", data.fontWeight === "bold" ? "normal" : "bold")}
            style={{
              padding: "0.5rem 1rem",
              border: `1px solid ${data.fontWeight === "bold" ? "#24c598" : "#E5E5E5"}`,
              borderRadius: "8px",
              fontSize: "0.875rem",
              fontWeight: data.fontWeight === "bold" ? "700" : "400",
              color: data.fontWeight === "bold" ? "#24c598" : "#0A0A0A",
              backgroundColor: data.fontWeight === "bold" ? "#FFF5F9" : "#FFFFFF",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <strong>F</strong>
          </button>
          <button
            type="button"
            onClick={() => updateField("fontStyle", data.fontStyle === "italic" ? "normal" : "italic")}
            style={{
              padding: "0.5rem 1rem",
              border: `1px solid ${data.fontStyle === "italic" ? "#24c598" : "#E5E5E5"}`,
              borderRadius: "8px",
              fontSize: "0.875rem",
              fontStyle: data.fontStyle === "italic" ? "italic" : "normal",
              color: data.fontStyle === "italic" ? "#24c598" : "#0A0A0A",
              backgroundColor: data.fontStyle === "italic" ? "#FFF5F9" : "#FFFFFF",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={() => updateField("textDecoration", data.textDecoration === "underline" ? "none" : "underline")}
            style={{
              padding: "0.5rem 1rem",
              border: `1px solid ${data.textDecoration === "underline" ? "#24c598" : "#E5E5E5"}`,
              borderRadius: "8px",
              fontSize: "0.875rem",
              textDecoration: data.textDecoration === "underline" ? "underline" : "none",
              color: data.textDecoration === "underline" ? "#24c598" : "#0A0A0A",
              backgroundColor: data.textDecoration === "underline" ? "#FFF5F9" : "#FFFFFF",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <u>U</u>
          </button>
        </div>
      </div>

      {/* Text Content */}
      <div>
        <label style={{
          display: "block",
          fontSize: "0.875rem",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          Text <span style={{ color: "#DC2626" }}>*</span>
        </label>
        <textarea
          value={localContent.text}
          onChange={(e) => {
            const newValue = e.target.value
            setLocalContent(prev => ({ ...prev, text: newValue }))
            updateField("text", newValue)
          }}
          placeholder="Text eingeben"
          style={{
            width: "100%",
            padding: "0.75rem",
            border: "1px solid #E5E5E5",
            borderRadius: "8px",
            fontSize: data.fontSize === "small" ? "0.75rem" : data.fontSize === "large" ? "1.125rem" : "0.875rem",
            minHeight: "150px",
            resize: "vertical",
            fontFamily: "inherit",
            fontWeight: data.fontWeight,
            fontStyle: data.fontStyle,
            textDecoration: data.textDecoration,
            textAlign: data.alignment,
            transition: "all 0.2s"
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#24c598"
            e.target.style.boxShadow = "0 0 0 3px rgba(226, 0, 116, 0.1)"
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#E5E5E5"
            e.target.style.boxShadow = "none"
          }}
          maxLength={5000}
        />
        <div style={{
          fontSize: "0.75rem",
          color: "#7A7A7A",
          marginTop: "0.5rem",
          textAlign: "right"
        }}>
          {data.text.length} / 5000 Zeichen
        </div>
      </div>
    </div>
  )
}
