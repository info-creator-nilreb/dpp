"use client"

/**
 * Image Block Editor
 * 
 * Editor für einfache Bild-Blöcke
 */

import FileField from "@/components/cms/fields/FileField"

interface ImageBlockEditorProps {
  content: Record<string, any>
  onChange: (content: Record<string, any>) => void
  dppId?: string
  blockId?: string // Block-ID für versionsgebundene Medien
  blockName?: string // Block-Name (für Hero-Logik)
}

export default function ImageBlockEditor({
  content,
  onChange,
  dppId,
  blockId,
  blockName
}: ImageBlockEditorProps) {
  const data = {
    url: content.url || "",
    alt: content.alt || "",
    caption: content.caption || "",
    alignment: content.alignment || "center"
  }

  function updateField(field: string, value: any) {
    onChange({
      ...data,
      [field]: value
    })
  }

  const isImage = data.url && (
    data.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) || 
    data.url.startsWith("/uploads/") && !data.url.endsWith(".pdf")
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Thumbnail-Preview direkt im Block (wenn Bild vorhanden) */}
      {data.url && isImage && (
        <div style={{
          padding: "1rem",
          backgroundColor: "#F9F9F9",
          border: "1px solid #E5E5E5",
          borderRadius: "8px",
          marginBottom: "0.5rem"
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
            src={data.url}
            alt={data.alt || "Bildvorschau"}
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
              console.error("Error loading preview image:", data.url)
            }}
          />
        </div>
      )}

      {/* Image Upload mit FileField-Komponente */}
      {dppId ? (
        <FileField
          label="Bild"
          value={data.url}
          onChange={(url) => updateField("url", url || "")}
          dppId={dppId}
          blockId={blockId}
          fieldKey="url"
          blockName={blockName}
          fileType="media"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          maxSize={5 * 1024 * 1024}
          description="JPEG, PNG, GIF oder WebP (max. 5 MB)"
          helperText="Dieses Bild wird im Block angezeigt"
        />
      ) : (
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

