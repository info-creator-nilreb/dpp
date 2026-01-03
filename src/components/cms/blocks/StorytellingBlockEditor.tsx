"use client"

/**
 * Storytelling Block Editor
 */

import { useState } from "react"
import { StorytellingBlockContent } from "@/lib/cms/types"
import FileUploadArea from "@/components/FileUploadArea"
import { useNotification } from "@/components/NotificationProvider"

interface StorytellingBlockEditorProps {
  content: Record<string, any>
  onChange: (content: StorytellingBlockContent) => void
  dppId?: string
}

export default function StorytellingBlockEditor({
  content,
  onChange,
  dppId
}: StorytellingBlockEditorProps) {
  const { showNotification } = useNotification()
  const [uploading, setUploading] = useState(false)
  
  const data: StorytellingBlockContent = {
    title: content.title || "",
    description: content.description || "",
    images: content.images || [],
    sections: content.sections || []
  }

  function updateField(field: keyof StorytellingBlockContent, value: any) {
    onChange({
      ...data,
      [field]: value
    })
  }

  async function handleImageUpload(file: File, index?: number) {
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

      if (index !== undefined) {
        // Update existing image
        const images = [...(data.images || [])]
        images[index] = { ...images[index], url: result.media.storageUrl }
        updateField("images", images)
      } else {
        // Add new image
        updateField("images", [
          ...data.images || [],
          { url: result.media.storageUrl, alt: "", caption: "" }
        ])
      }

      showNotification("Bild erfolgreich hochgeladen", "success")
    } catch (error: any) {
      showNotification(error.message || "Fehler beim Hochladen", "error")
    } finally {
      setUploading(false)
    }
  }

  function addImage() {
    updateField("images", [
      ...data.images || [],
      { url: "", alt: "", caption: "" }
    ])
  }

  function updateImage(index: number, field: string, value: string) {
    const images = [...(data.images || [])]
    images[index] = { ...images[index], [field]: value }
    updateField("images", images)
  }

  function removeImage(index: number) {
    const images = [...(data.images || [])]
    images.splice(index, 1)
    updateField("images", images)
  }

  function addSection() {
    updateField("sections", [
      ...data.sections || [],
      { heading: "", text: "", image: "" }
    ])
  }

  function updateSection(index: number, field: string, value: string) {
    const sections = [...(data.sections || [])]
    sections[index] = { ...sections[index], [field]: value }
    updateField("sections", sections)
  }

  function removeSection(index: number) {
    const sections = [...(data.sections || [])]
    sections.splice(index, 1)
    updateField("sections", sections)
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
          Titel <span style={{ color: "#DC2626" }}>*</span>
        </label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="Titel eingeben"
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

      {/* Description */}
      <div>
        <label style={{
          display: "block",
          fontSize: "0.875rem",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          Beschreibung <span style={{ color: "#DC2626" }}>*</span>
        </label>
        <textarea
          value={data.description}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="Beschreibung eingeben"
          style={{
            width: "100%",
            padding: "0.75rem",
            border: "1px solid #E5E5E5",
            borderRadius: "8px",
            fontSize: "0.875rem",
            minHeight: "120px",
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
          rows={4}
          maxLength={5000}
        />
        <div style={{
          fontSize: "0.75rem",
          color: "#7A7A7A",
          marginTop: "0.5rem",
          textAlign: "right"
        }}>
          {data.description.length} / 5000 Zeichen
        </div>
      </div>

      {/* Images */}
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
            Bilder
          </label>
        </div>

        {/* Upload Area */}
        {dppId && (
          <div style={{ marginBottom: "1rem" }}>
            <FileUploadArea
              accept="image/*"
              maxSize={5 * 1024 * 1024}
              onFileSelect={(file) => handleImageUpload(file)}
              disabled={uploading}
              label="Bild hochladen"
              description="JPEG, PNG, GIF oder WebP (max. 5 MB)"
            />
          </div>
        )}

        {/* Image List */}
        {data.images && data.images.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {data.images.map((image, index) => (
              <div key={index} style={{
                padding: "1rem",
                border: "1px solid #E5E5E5",
                borderRadius: "8px",
                backgroundColor: "#F9F9F9"
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "start",
                  justifyContent: "space-between",
                  marginBottom: "0.75rem"
                }}>
                  <span style={{
                    fontSize: "0.75rem",
                    fontWeight: "500",
                    color: "#7A7A7A"
                  }}>
                    Bild {index + 1}
                  </span>
                  <button
                    onClick={() => removeImage(index)}
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

                {/* Image Preview */}
                {image.url && (
                  <div style={{
                    marginBottom: "0.75rem",
                    padding: "0.75rem",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E5E5E5",
                    borderRadius: "8px"
                  }}>
                    <img
                      src={image.url}
                      alt={image.alt || "Bild"}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "200px",
                        borderRadius: "6px"
                      }}
                    />
                  </div>
                )}

                {/* Upload for existing image */}
                {dppId && (
                  <div style={{ marginBottom: "0.75rem" }}>
                    <FileUploadArea
                      accept="image/*"
                      maxSize={5 * 1024 * 1024}
                      onFileSelect={(file) => handleImageUpload(file, index)}
                      disabled={uploading}
                      label={image.url ? "Bild ersetzen" : "Bild hochladen"}
                      description=""
                    />
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {!dppId && (
                    <input
                      type="url"
                      value={image.url || ""}
                      onChange={(e) => updateImage(index, "url", e.target.value)}
                      placeholder="Bild-URL"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #E5E5E5",
                        borderRadius: "8px",
                        fontSize: "0.875rem"
                      }}
                    />
                  )}
                  <input
                    type="text"
                    value={image.alt || ""}
                    onChange={(e) => updateImage(index, "alt", e.target.value)}
                    placeholder="Alt-Text *"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #E5E5E5",
                      borderRadius: "8px",
                      fontSize: "0.875rem"
                    }}
                  />
                  <input
                    type="text"
                    value={image.caption || ""}
                    onChange={(e) => updateImage(index, "caption", e.target.value)}
                    placeholder="Bildunterschrift (optional)"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #E5E5E5",
                      borderRadius: "8px",
                      fontSize: "0.875rem"
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sections */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Abschnitte
          </label>
          <button
            onClick={addSection}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            + Abschnitt hinzufügen
          </button>
        </div>
        {data.sections && data.sections.length > 0 && (
          <div className="space-y-4">
            {data.sections.map((section, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs text-gray-500">Abschnitt {index + 1}</span>
                  <button
                    onClick={() => removeSection(index)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    ×
                  </button>
                </div>
                <input
                  type="text"
                  value={section.heading || ""}
                  onChange={(e) => updateSection(index, "heading", e.target.value)}
                  placeholder="Überschrift"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm mb-2"
                  maxLength={200}
                />
                <textarea
                  value={section.text || ""}
                  onChange={(e) => updateSection(index, "text", e.target.value)}
                  placeholder="Text"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm mb-2"
                  rows={3}
                  maxLength={2000}
                />
                <input
                  type="url"
                  value={section.image || ""}
                  onChange={(e) => updateSection(index, "image", e.target.value)}
                  placeholder="Bild-URL (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

