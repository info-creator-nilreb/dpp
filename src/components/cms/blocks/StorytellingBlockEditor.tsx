"use client"

/**
 * Storytelling Block Editor
 */

import { StorytellingBlockContent } from "@/lib/cms/types"
import FileField from "@/components/cms/fields/FileField"

interface StorytellingBlockEditorProps {
  content: Record<string, any>
  onChange: (content: StorytellingBlockContent) => void
  dppId?: string
  blockId?: string
}

const TITLE_MAX = 80
const DESC_MAX = 300

export default function StorytellingBlockEditor({
  content,
  onChange,
  dppId,
  blockId
}: StorytellingBlockEditorProps) {
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

  // URLs aus images für FileField (wie Image-Block)
  const imageUrls = data.images?.length
    ? data.images
        .map((img: { url?: string }) => img?.url)
        .filter((u): u is string => Boolean(u))
    : null
  const fileFieldValue: string | string[] | null = imageUrls && imageUrls.length > 0
    ? (imageUrls.length === 1 ? imageUrls[0] : imageUrls)
    : null

  function handleImagesChange(urls: string | string[] | null) {
    const urlArray = urls
      ? (Array.isArray(urls) ? urls : [urls]).filter(Boolean)
      : []
    const newImages = urlArray.map((url) => {
      const existing = data.images?.find((img: { url?: string }) => img?.url === url)
      return existing || { url, alt: "", caption: "" }
    })
    updateField("images", newImages)
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
          Titel <span style={{ color: "#DC2626" }}>*</span> <span style={{ fontWeight: 400, color: "#7A7A7A" }}>(max. {TITLE_MAX} Zeichen)</span>
        </label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => updateField("title", e.target.value.slice(0, TITLE_MAX))}
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
            e.target.style.borderColor = "#24c598"
            e.target.style.boxShadow = "0 0 0 3px rgba(36, 197, 152, 0.2)"
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#E5E5E5"
            e.target.style.boxShadow = "none"
          }}
          maxLength={TITLE_MAX}
        />
        <div style={{ fontSize: "0.75rem", color: "#7A7A7A", marginTop: "0.25rem", textAlign: "right" }}>
          {data.title.length} / {TITLE_MAX}
        </div>
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
            e.target.style.borderColor = "#24c598"
            e.target.style.boxShadow = "0 0 0 3px rgba(36, 197, 152, 0.2)"
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#E5E5E5"
            e.target.style.boxShadow = "none"
          }}
          rows={4}
          maxLength={DESC_MAX}
        />
        <div style={{
          fontSize: "0.75rem",
          color: "#7A7A7A",
          marginTop: "0.25rem",
          textAlign: "right"
        }}>
          {data.description.length} / {DESC_MAX}
        </div>
      </div>

      {/* Bilder – wie Image-Block: FileField mit blockId für korrekten Media-Upload */}
      {dppId && blockId && (
        <FileField
          label="Bild"
          value={fileFieldValue}
          onChange={handleImagesChange}
          dppId={dppId}
          blockId={blockId}
          fieldKey="images"
          blockName="Storytelling"
          fileType="media"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          maxSize={5 * 1024 * 1024}
          maxCount={1}
          hideAddWhenMaxReached
          description="JPEG, PNG, GIF oder WebP (max. 5 MB)"
          helperText="Hintergrundbild für den Storytelling-Block (wird mit Text-Overlay angezeigt)"
        />
      )}

      {/* Sections – kein weiterer Abschnitt hinzufügbar */}
      <div>
        {data.sections && data.sections.length > 0 && (
          <div className="space-y-4">
            {data.sections.map((section, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs text-gray-500">Abschnitt {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeSection(index)}
                    className="text-red-600 hover:text-red-700 flex items-center justify-center"
                    title="Abschnitt entfernen"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
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

