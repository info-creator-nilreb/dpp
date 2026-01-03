"use client"

/**
 * Image Text Block Editor
 */

import { useState } from "react"
import { ImageTextBlockContent } from "@/lib/cms/types"
import FileUploadArea from "@/components/FileUploadArea"
import { useNotification } from "@/components/NotificationProvider"

interface ImageTextBlockEditorProps {
  content: Record<string, any>
  onChange: (content: ImageTextBlockContent) => void
  dppId?: string
}

const LAYOUT_OPTIONS = [
  { value: "image_left", label: "Bild links" },
  { value: "image_right", label: "Bild rechts" },
  { value: "image_top", label: "Bild oben" },
  { value: "image_bottom", label: "Bild unten" }
]

export default function ImageTextBlockEditor({
  content,
  onChange,
  dppId
}: ImageTextBlockEditorProps) {
  const { showNotification } = useNotification()
  const [uploading, setUploading] = useState(false)
  
  const data: ImageTextBlockContent = {
    layout: content.layout || "image_left",
    image: content.image || { url: "", alt: "" },
    text: content.text || { content: "" }
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

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Fehler beim Hochladen")
      }

      updateImage("url", result.media.storageUrl)
      showNotification("Bild erfolgreich hochgeladen", "success")
    } catch (error: any) {
      showNotification(error.message || "Fehler beim Hochladen", "error")
    } finally {
      setUploading(false)
    }
  }

  function updateField(field: keyof ImageTextBlockContent, value: any) {
    onChange({
      ...data,
      [field]: value
    })
  }

  function updateImage(field: string, value: string) {
    updateField("image", {
      ...data.image,
      [field]: value
    })
  }

  function updateText(field: string, value: string) {
    updateField("text", {
      ...data.text,
      [field]: value
    })
  }

  return (
    <div className="space-y-6">
      {/* Layout */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Layout
        </label>
        <select
          value={data.layout}
          onChange={(e) => updateField("layout", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded"
        >
          {LAYOUT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Image */}
      <div>
        <label style={{
          display: "block",
          fontSize: "0.875rem",
          fontWeight: "500",
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          Bild *
        </label>
        
        {dppId && (
          <div style={{ marginBottom: "1rem" }}>
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

        {data.image.url && (
          <div style={{
            marginBottom: "1rem",
            padding: "1rem",
            backgroundColor: "#F9F9F9",
            border: "1px solid #E5E5E5",
            borderRadius: "8px"
          }}>
            <img
              src={data.image.url}
              alt={data.image.alt || "Bild"}
              style={{
                maxWidth: "100%",
                maxHeight: "200px",
                borderRadius: "6px",
                marginBottom: "0.5rem"
              }}
            />
            <button
              onClick={() => updateImage("url", "")}
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

        <input
          type="url"
          value={data.image.url}
          onChange={(e) => updateImage("url", e.target.value)}
          placeholder="Oder Bild-URL eingeben"
          style={{
            width: "100%",
            padding: "0.75rem",
            border: "1px solid #E5E5E5",
            borderRadius: "8px",
            fontSize: "0.875rem",
            marginBottom: "0.75rem"
          }}
        />
        <input
          type="text"
          value={data.image.alt}
          onChange={(e) => updateImage("alt", e.target.value)}
          placeholder="Alt-Text *"
          style={{
            width: "100%",
            padding: "0.75rem",
            border: "1px solid #E5E5E5",
            borderRadius: "8px",
            fontSize: "0.875rem",
            marginBottom: "0.75rem"
          }}
          maxLength={200}
        />
        <input
          type="text"
          value={data.image.caption || ""}
          onChange={(e) => updateImage("caption", e.target.value)}
          placeholder="Bildunterschrift (optional)"
          style={{
            width: "100%",
            padding: "0.75rem",
            border: "1px solid #E5E5E5",
            borderRadius: "8px",
            fontSize: "0.875rem"
          }}
          maxLength={500}
        />
      </div>

      {/* Text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Text *
        </label>
        <input
          type="text"
          value={data.text.heading || ""}
          onChange={(e) => updateText("heading", e.target.value)}
          placeholder="Überschrift (optional)"
          className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
          maxLength={200}
        />
        <textarea
          value={data.text.content}
          onChange={(e) => updateText("content", e.target.value)}
          placeholder="Text-Inhalt"
          className="w-full px-3 py-2 border border-gray-300 rounded"
          rows={6}
          maxLength={5000}
        />
      </div>
    </div>
  )
}

