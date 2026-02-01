"use client"

/**
 * Image Text Block Editor
 */

import { ImageTextBlockContent } from "@/lib/cms/types"
import FileField from "@/components/cms/fields/FileField"

interface ImageTextBlockEditorProps {
  content: Record<string, any>
  onChange: (content: ImageTextBlockContent) => void
  dppId?: string
  blockId?: string
  blockName?: string
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
  dppId,
  blockId,
  blockName
}: ImageTextBlockEditorProps) {
  const data: ImageTextBlockContent = {
    layout: content.layout || "image_left",
    image: content.image || { url: "", alt: "" },
    text: content.text || { content: "" }
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
        {dppId && blockId ? (
          <FileField
            label="Bild"
            value={data.image.url}
            onChange={(url) => updateImage("url", Array.isArray(url) ? url[0] ?? "" : (url ?? ""))}
            dppId={dppId}
            blockId={blockId}
            fieldKey="image"
            blockName={blockName}
            fileType="media"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            maxSize={5 * 1024 * 1024}
            description="JPEG, PNG, GIF oder WebP (max. 5 MB)"
            required
          />
        ) : (
          <div>
            <label style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: "500",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Bild-URL *
            </label>
            <input
              type="url"
              value={data.image.url}
              onChange={(e) => updateImage("url", e.target.value)}
              placeholder="https://example.com/image.jpg"
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #E5E5E5",
                borderRadius: "8px",
                fontSize: "0.875rem"
              }}
            />
          </div>
        )}

        {/* Thumbnail-Preview */}
        {data.image.url && (
          <div style={{
            marginTop: "1rem",
            padding: "1rem",
            backgroundColor: "#F9F9F9",
            border: "1px solid #E5E5E5",
            borderRadius: "8px"
          }}>
            <p style={{
              fontSize: "0.75rem",
              fontWeight: "600",
              color: "#7A7A7A",
              marginBottom: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              Vorschau
            </p>
            <img
              src={data.image.url}
              alt={data.image.alt || "Bild"}
              style={{
                width: "100%",
                maxWidth: "400px",
                height: "auto",
                maxHeight: "300px",
                objectFit: "contain",
                borderRadius: "6px",
                border: "1px solid #E5E5E5",
                backgroundColor: "#FFFFFF",
                display: "block"
              }}
              onError={(e) => {
                console.error("Error loading preview image:", data.image.url)
              }}
            />
          </div>
        )}
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

