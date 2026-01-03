"use client"

/**
 * Image Block Editor
 * 
 * Editor für einfache Bild-Blöcke
 */

import { useState } from "react"
import FileUploadArea from "@/components/FileUploadArea"
import { useNotification } from "@/components/NotificationProvider"

interface ImageBlockEditorProps {
  content: Record<string, any>
  onChange: (content: Record<string, any>) => void
  dppId?: string
}

export default function ImageBlockEditor({
  content,
  onChange,
  dppId
}: ImageBlockEditorProps) {
  const { showNotification } = useNotification()
  const [uploading, setUploading] = useState(false)
  
  const data = {
    url: content.url || "",
    alt: content.alt || "",
    caption: content.caption || "",
    alignment: content.alignment || "center"
  }

  async function handleImageUpload(file: File) {
    if (!dppId) {
      showNotification("DPP-ID fehlt", "error")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`/api/app/dpp/${dppId}/media`, {
        method: "POST",
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.message || `Fehler beim Hochladen (${response.status})`
        throw new Error(errorMessage)
      }

      const result = await response.json()

      if (!result.media || !result.media.storageUrl) {
        throw new Error("Ungültige Antwort vom Server: Keine Bild-URL erhalten")
      }

      updateField("url", result.media.storageUrl)
      showNotification("Bild erfolgreich hochgeladen", "success")
    } catch (error: any) {
      console.error("Error uploading image:", error)
      const errorMessage = error.message || "Fehler beim Hochladen des Bildes"
      showNotification(errorMessage, "error")
    } finally {
      setUploading(false)
    }
  }

  function updateField(field: string, value: any) {
    onChange({
      ...data,
      [field]: value
    })
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Image Upload */}
      {dppId && (
        <div>
          <FileUploadArea
            accept="image/*"
            maxSize={5 * 1024 * 1024}
            onFileSelect={handleImageUpload}
            disabled={uploading}
            label="Bild hochladen"
            description="JPEG, PNG, GIF oder WebP (max. 5 MB)"
          />
        </div>
      )}

      {/* Image Preview */}
      {data.url && (
        <div style={{
          padding: "1rem",
          backgroundColor: "#F9F9F9",
          border: "1px solid #E5E5E5",
          borderRadius: "8px"
        }}>
          <img
            src={data.url}
            alt={data.alt || "Bild"}
            style={{
              maxWidth: "100%",
              maxHeight: "300px",
              borderRadius: "6px",
              marginBottom: "0.75rem",
              display: "block"
            }}
          />
          <button
            onClick={() => updateField("url", "")}
            style={{
              fontSize: "0.75rem",
              color: "#DC2626",
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0
            }}
          >
            Bild entfernen
          </button>
        </div>
      )}

      {/* Image URL (Fallback wenn kein Upload möglich) */}
      {!dppId && (
        <div>
          <label style={{
            display: "block",
            fontSize: "0.875rem",
            fontWeight: "600",
            color: "#0A0A0A",
            marginBottom: "0.5rem"
          }}>
            Bild-URL <span style={{ color: "#DC2626" }}>*</span>
          </label>
          <input
            type="url"
            value={data.url}
            onChange={(e) => updateField("url", e.target.value)}
            placeholder="https://example.com/image.jpg"
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
        </div>
      )}

      {/* Alt Text */}
      <div>
        <label style={{
          display: "block",
          fontSize: "0.875rem",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          Alt-Text <span style={{ color: "#DC2626" }}>*</span>
        </label>
        <input
          type="text"
          value={data.alt}
          onChange={(e) => updateField("alt", e.target.value)}
          placeholder="Beschreibung des Bildes für Barrierefreiheit"
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

      {/* Caption */}
      <div>
        <label style={{
          display: "block",
          fontSize: "0.875rem",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          Bildunterschrift
        </label>
        <input
          type="text"
          value={data.caption}
          onChange={(e) => updateField("caption", e.target.value)}
          placeholder="Optionale Bildunterschrift"
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
          maxLength={500}
        />
      </div>

      {/* Alignment */}
      <div>
        <label style={{
          display: "block",
          fontSize: "0.875rem",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          Ausrichtung
        </label>
        <div style={{
          display: "flex",
          gap: "0.5rem"
        }}>
          {[
            { value: "left", label: "Links" },
            { value: "center", label: "Zentriert" },
            { value: "right", label: "Rechts" }
          ].map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateField("alignment", option.value)}
              style={{
                flex: 1,
                padding: "0.75rem",
                border: `1px solid ${data.alignment === option.value ? "#E20074" : "#E5E5E5"}`,
                borderRadius: "8px",
                fontSize: "0.875rem",
                fontWeight: data.alignment === option.value ? "600" : "400",
                color: data.alignment === option.value ? "#E20074" : "#0A0A0A",
                backgroundColor: data.alignment === option.value ? "#FFF5F9" : "#FFFFFF",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

