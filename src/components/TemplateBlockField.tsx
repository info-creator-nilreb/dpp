"use client"

import { useState } from "react"
import FileUploadArea from "@/components/FileUploadArea"
import InputField from "@/components/InputField"
import CountrySelect from "@/components/CountrySelect"
import { useNotification } from "@/components/NotificationProvider"

interface TemplateBlockFieldProps {
  field: {
    id: string
    label: string
    key: string
    type: string
    required: boolean
    config: any
  }
  blockId: string
  dppId: string | null
  value?: string | string[] // Für file-Felder: Array von Media-IDs oder URLs
  onChange?: (value: string | string[]) => void
  media?: Array<{
    id: string
    fileName: string
    fileType: string
    storageUrl: string
    blockId?: string | null
    fieldId?: string | null
  }>
  onMediaChange?: () => void
}

/**
 * Rendert ein einzelnes Template-Feld basierend auf dem Feldtyp
 */
export default function TemplateBlockField({
  field,
  blockId,
  dppId,
  value,
  onChange,
  media = [],
  onMediaChange
}: TemplateBlockFieldProps) {
  const { showNotification } = useNotification()
  const [uploading, setUploading] = useState(false)

  // Filtere Medien für dieses Feld
  const fieldMedia = media.filter(m => 
    m.blockId === blockId && m.fieldId === field.key
  )

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!dppId || dppId === "new") {
      showNotification("Bitte speichern Sie den DPP zuerst", "error")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("blockId", blockId)
      formData.append("fieldId", field.key)

      const response = await fetch(`/api/app/dpp/${dppId}/media`, {
        method: "POST",
        body: formData
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Hochladen")
      }

      showNotification("Datei erfolgreich hochgeladen", "success")
      if (onMediaChange) {
        onMediaChange()
      }
    } catch (error: any) {
      showNotification(error.message || "Fehler beim Hochladen", "error")
    } finally {
      setUploading(false)
    }
  }

  // Render basierend auf Feldtyp
  if (field.type === "file" || field.type === "file-image" || field.type === "file-document" || field.type === "file-video") {
    return (
      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{
          display: "block",
          fontSize: "clamp(0.9rem, 2vw, 1rem)",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          {field.label}
          {field.required && (
            <span style={{ color: "#DC2626", marginLeft: "0.25rem" }}>*</span>
          )}
        </label>
        
        {/* Upload Area */}
        <FileUploadArea
          accept={
            field.type === "file-image" 
              ? "image/jpeg,image/jpg,image/png,image/gif,image/webp"
              : field.type === "file-document"
              ? "application/pdf"
              : field.type === "file-video"
              ? "video/mp4,video/webm,video/ogg"
              : "image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf,video/mp4,video/webm,video/ogg"
          }
          maxSize={field.type === "file-video" ? 100 * 1024 * 1024 : 10 * 1024 * 1024} // 100 MB für Videos, 10 MB für andere
          onFileSelect={handleFileUpload}
          disabled={uploading || !dppId || dppId === "new"}
          label="Datei hochladen"
          description={
            field.type === "file-image"
              ? "Bilder (JPG, PNG, WebP). Maximale Dateigröße: 10 MB"
              : field.type === "file-document"
              ? "Dokumente (PDF). Maximale Dateigröße: 10 MB"
              : field.type === "file-video"
              ? "Videos (MP4, WebM, OGG). Maximale Dateigröße: 100 MB"
              : field.type === "file"
              ? "Alle Dateitypen. Maximale Dateigröße: 10 MB"
              : "Dateien hochladen. Maximale Dateigröße: 10 MB"
          }
        />

        {/* Angezeigte Medien */}
        {fieldMedia.length > 0 && (
          <div style={{
            marginTop: "1rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: "1rem"
          }}>
            {fieldMedia.map((mediaItem) => (
              <div
                key={mediaItem.id}
                style={{
                  position: "relative",
                  border: "1px solid #CDCDCD",
                  borderRadius: "8px",
                  overflow: "hidden"
                }}
              >
                {mediaItem.fileType.startsWith("image/") ? (
                  <img
                    src={mediaItem.storageUrl}
                    alt={mediaItem.fileName}
                    style={{
                      width: "100%",
                      height: "150px",
                      objectFit: "cover"
                    }}
                  />
                ) : mediaItem.fileType.startsWith("video/") ? (
                  <video
                    src={mediaItem.storageUrl}
                    style={{
                      width: "100%",
                      height: "150px",
                      objectFit: "cover"
                    }}
                    muted
                    playsInline
                  >
                    <track kind="captions" />
                  </video>
                ) : (
                  <div style={{
                    width: "100%",
                    height: "150px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#F5F5F5"
                  }}>
                    <span style={{ fontSize: "2rem" }}>📄</span>
                  </div>
                )}
                <div style={{
                  padding: "0.5rem",
                  fontSize: "0.75rem",
                  color: "#7A7A7A",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}>
                  {mediaItem.fileName}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Text-Feld
  if (field.type === "text") {
    return (
      <InputField
        id={`field-${field.id}`}
        label={field.label}
        value={value as string || ""}
        onChange={(e) => {
          onChange?.(e.target.value)
        }}
        required={field.required}
        type="text"
      />
    )
  }

  // Textarea-Feld
  if (field.type === "textarea") {
    return (
      <InputField
        id={`field-${field.id}`}
        label={field.label}
        value={value as string || ""}
        onChange={(e) => {
          onChange?.(e.target.value)
        }}
        required={field.required}
        rows={4}
      />
    )
  }

  // Number-Feld
  if (field.type === "number") {
    return (
      <InputField
        id={`field-${field.id}`}
        label={field.label}
        value={value as string || ""}
        onChange={(e) => onChange?.(e.target.value)}
        required={field.required}
        type="number"
      />
    )
  }

  // Date-Feld
  if (field.type === "date") {
    return (
      <InputField
        id={`field-${field.id}`}
        label={field.label}
        value={value as string || ""}
        onChange={(e) => onChange?.(e.target.value)}
        required={field.required}
        type="date"
      />
    )
  }

  // URL-Feld
  if (field.type === "url") {
    return (
      <InputField
        id={`field-${field.id}`}
        label={field.label}
        value={value as string || ""}
        onChange={(e) => onChange?.(e.target.value)}
        required={field.required}
        type="url"
      />
    )
  }

  // Country-Feld
  if (field.type === "country") {
    return (
      <CountrySelect
        id={`field-${field.id}`}
        label={field.label}
        value={value as string || ""}
        onChange={(code: string) => onChange?.(code)}
        required={field.required}
      />
    )
  }

  // Select-Feld (Single Choice)
  if (field.type === "select") {
    const options = field.config?.options || []
    return (
      <div style={{ marginBottom: "1.5rem" }}>
        <label htmlFor={`field-${field.id}`} style={{
          display: "block",
          fontSize: "clamp(0.9rem, 2vw, 1rem)",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          {field.label}
          {field.required && (
            <span style={{ color: "#DC2626", marginLeft: "0.25rem" }}>*</span>
          )}
        </label>
        <select
          id={`field-${field.id}`}
          value={value as string || ""}
          onChange={(e) => {
            onChange?.(e.target.value)
          }}
          required={field.required}
          style={{
            width: "100%",
            padding: "clamp(0.75rem, 2vw, 1rem)",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            border: "1px solid #CDCDCD",
            borderRadius: "8px",
            backgroundColor: "#FFFFFF",
            color: "#0A0A0A",
            boxSizing: "border-box"
          }}
        >
          <option value="">Bitte wählen</option>
          {options.map((opt: string | { value: string; label: string }) => {
            const optionValue = typeof opt === "string" ? opt : opt.value
            const optionLabel = typeof opt === "string" ? opt : opt.label
            return (
              <option key={optionValue} value={optionValue}>
                {optionLabel}
              </option>
            )
          })}
        </select>
      </div>
    )
  }

  // Multi-Select-Feld
  if (field.type === "multi-select") {
    const options = field.config?.options || []
    const selectedValues = (value as string[] || [])
    return (
      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{
          display: "block",
          fontSize: "clamp(0.9rem, 2vw, 1rem)",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          {field.label}
          {field.required && (
            <span style={{ color: "#DC2626", marginLeft: "0.25rem" }}>*</span>
          )}
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {options.map((opt: string | { value: string; label: string }) => {
            const optionValue = typeof opt === "string" ? opt : opt.value
            const optionLabel = typeof opt === "string" ? opt : opt.label
            const isChecked = selectedValues.includes(optionValue)
            return (
              <label key={optionValue} style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, optionValue]
                      : selectedValues.filter(v => v !== optionValue)
                    onChange?.(newValues)
                  }}
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                />
                <span style={{ fontSize: "0.9rem", color: "#0A0A0A" }}>{optionLabel}</span>
              </label>
            )
          })}
        </div>
      </div>
    )
  }

  // Boolean-Feld (Ja/Nein)
  if (field.type === "boolean") {
    return (
      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          cursor: "pointer"
        }}>
          <input
            type="checkbox"
            checked={typeof value === "string" && value === "true"}
            onChange={(e) => {
              onChange?.(e.target.checked ? "true" : "false")
            }}
            style={{ width: "18px", height: "18px", cursor: "pointer" }}
          />
          <span style={{
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            fontWeight: "600",
            color: "#0A0A0A"
          }}>
            {field.label}
            {field.required && (
              <span style={{ color: "#DC2626", marginLeft: "0.25rem" }}>*</span>
            )}
          </span>
        </label>
      </div>
    )
  }

  // Unbekannter Feldtyp
  return (
    <div style={{ marginBottom: "1.5rem", padding: "1rem", backgroundColor: "#FFF5F5", border: "1px solid #FCA5A5", borderRadius: "8px" }}>
      <p style={{ color: "#991B1B", fontSize: "0.9rem", margin: 0 }}>
        Feldtyp "{field.type}" wird noch nicht unterstützt
      </p>
    </div>
  )
}

