"use client"

import { useState } from "react"
import FileUploadArea from "@/components/FileUploadArea"
import InputField from "@/components/InputField"
import CountrySelect from "@/components/CountrySelect"
import { useNotification } from "@/components/NotificationProvider"

interface PendingFile {
  id: string
  file: File
  preview?: string
}

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
  pendingFiles?: PendingFile[]
  onPendingFileAdd?: (file: PendingFile) => void
  onPendingFileRemove?: (fileId: string) => void
  hideLabel?: boolean // Für wiederholbare Felder: Label ausblenden
  supplierInfo?: {
    partnerRole: string
    confirmed?: boolean // TEIL 6: Ob die Angaben bereits geprüft und übernommen wurden
  } | null // Information über den Beteiligten, der dieses Feld bereitgestellt hat
  onSupplierInfoConfirm?: (fieldKey: string) => void // TEIL 6: Callback für Bestätigung
  readOnly?: boolean // Felder read-only machen (für Prüf-Modus)
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
  onMediaChange,
  pendingFiles = [],
  onPendingFileAdd,
  onPendingFileRemove,
  hideLabel = false,
  supplierInfo = null,
  onSupplierInfoConfirm,
  readOnly = false
}: TemplateBlockFieldProps) {
  const { showNotification } = useNotification()
  const [uploading, setUploading] = useState(false)
  
  // Debug: Log value prop
  console.log(`[TemplateBlockField] Field ${field.key} (${field.label}): value=`, value, "type:", typeof value, "supplierInfo:", supplierInfo)
  
  // TEIL 6: Wiederverwendbare Komponente für Supplier-Info-Anzeige (minimalistisch, inline)
  const renderSupplierInfo = () => {
    if (!supplierInfo) return null
    
    return (
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        marginLeft: "0.5rem",
        flexWrap: "wrap"
      }}>
        {supplierInfo.confirmed ? (
          <span style={{
            fontSize: "0.813rem",
            padding: "0.125rem 0.5rem",
            backgroundColor: "#D1FAE5",
            color: "#065F46",
            borderRadius: "4px",
            fontWeight: "400",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem"
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Geprüft und von {supplierInfo.partnerRole} übernommen
          </span>
        ) : (
          <>
            <span style={{
              fontSize: "0.813rem",
              padding: "0.125rem 0.5rem",
              backgroundColor: "#FEF3C7",
              color: "#92400E",
              borderRadius: "4px",
              fontWeight: "400"
            }}>
              Von {supplierInfo.partnerRole} bereitgestellt (ungeprüft)
            </span>
            {onSupplierInfoConfirm && (
              <button
                type="button"
                onClick={() => onSupplierInfoConfirm(field.key)}
                style={{
                  fontSize: "0.813rem",
                  padding: "0.25rem 0.75rem",
                  backgroundColor: "transparent",
                  color: "#7A7A7A",
                  border: "1px solid #E5E5E5",
                  borderRadius: "4px",
                  fontWeight: "400",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#F5F5F5"
                  e.currentTarget.style.borderColor = "#CDCDCD"
                  e.currentTarget.style.color = "#0A0A0A"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent"
                  e.currentTarget.style.borderColor = "#E5E5E5"
                  e.currentTarget.style.color = "#7A7A7A"
                }}
              >
                Angaben übernehmen
              </button>
            )}
          </>
        )}
      </span>
    )
  }

  // Filtere Medien für dieses Feld
  const fieldMedia = media.filter(m => 
    m.blockId === blockId && m.fieldId === field.key
  )
  
  // Filtere Pending Files für dieses Feld
  const fieldPendingFiles = pendingFiles.filter(pf => 
    pf.blockId === blockId && pf.fieldId === field.key
  )

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    // Für neue DPPs: Datei zwischenspeichern (wird nach dem Speichern hochgeladen)
    if (!dppId || dppId === "new") {
      if (!onPendingFileAdd) {
        showNotification("Upload-Funktion nicht verfügbar", "error")
        return
      }
      
      // Erstelle Preview für Bilder und Videos
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const preview = e.target?.result as string
          const pendingFile: PendingFile = {
            id: `pending-${Date.now()}-${Math.random()}`,
            file,
            preview,
            blockId,
            fieldId: field.key
          }
          onPendingFileAdd(pendingFile)
          showNotification("Datei wird nach dem Speichern hochgeladen", "info")
        }
        reader.readAsDataURL(file)
      } else {
        // PDF oder andere Dateien ohne Preview
        const pendingFile: PendingFile = {
          id: `pending-${Date.now()}-${Math.random()}`,
          file,
          blockId,
          fieldId: field.key
        }
        onPendingFileAdd(pendingFile)
        showNotification("Datei wird nach dem Speichern hochgeladen", "info")
      }
      return
    }

    // Für bestehende DPPs: Sofort hochladen
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
        
        {/* TEIL 6: Bestätigungsfunktion - unter dem Label, nicht inline */}
        {renderSupplierInfo()}
        
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
          disabled={uploading}
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

        {/* Angezeigte Medien (inkl. Pending Files) */}
        {(fieldMedia.length > 0 || fieldPendingFiles.length > 0) && (
          <div style={{
            marginTop: "1rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: "1rem"
          }}>
            {/* Pending Files (mit reduzierter Opacity) */}
            {fieldPendingFiles.map((pendingFile) => (
              <div
                key={pendingFile.id}
                style={{
                  position: "relative",
                  border: "1px solid #CDCDCD",
                  borderRadius: "8px",
                  overflow: "hidden",
                  opacity: 0.7
                }}
              >
                {pendingFile.file.type.startsWith("image/") && pendingFile.preview ? (
                  <img
                    src={pendingFile.preview}
                    alt={pendingFile.file.name}
                    style={{
                      width: "100%",
                      height: "150px",
                      objectFit: "cover",
                      cursor: "pointer"
                    }}
                  />
                ) : pendingFile.file.type.startsWith("video/") && pendingFile.preview ? (
                  <div style={{ position: "relative", width: "100%", height: "150px" }}>
                    <video
                      src={pendingFile.preview}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover"
                      }}
                      muted
                      playsInline
                      controls
                      preload="metadata"
                    >
                      <track kind="captions" />
                    </video>
                  </div>
                ) : (
                  <div 
                    style={{
                      width: "100%",
                      height: "150px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#F5F5F5"
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="48"
                      height="48"
                      fill="none"
                      stroke="#7A7A7A"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      viewBox="0 0 24 24"
                      style={{ marginBottom: "0.5rem" }}
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <span style={{ 
                      fontSize: "0.75rem", 
                      color: "#7A7A7A",
                      textAlign: "center",
                      padding: "0 0.5rem"
                    }}>
                      PDF
                    </span>
                  </div>
                )}
                <div style={{
                  padding: "0.5rem",
                  fontSize: "0.75rem",
                  color: "#7A7A7A",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {pendingFile.file.name}
                  </span>
                  {onPendingFileRemove && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onPendingFileRemove(pendingFile.id)
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#DC2626",
                        cursor: "pointer",
                        padding: "0.25rem 0.5rem",
                        marginLeft: "0.5rem",
                        fontSize: "1.2rem",
                        fontWeight: "bold",
                        lineHeight: 1
                      }}
                      title="Datei entfernen"
                    >
                      ×
                    </button>
                  )}
                </div>
                <div style={{
                  position: "absolute",
                  top: "0.5rem",
                  right: "0.5rem",
                  backgroundColor: "#FEF3C7",
                  color: "#92400E",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "4px",
                  fontSize: "0.7rem",
                  fontWeight: "600"
                }}>
                  Wartend
                </div>
              </div>
            ))}
            
            {/* Hochgeladene Medien */}
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
                      objectFit: "cover",
                      cursor: "pointer"
                    }}
                    onClick={() => window.open(mediaItem.storageUrl, "_blank")}
                  />
                ) : mediaItem.fileType.startsWith("video/") ? (
                  <div style={{ position: "relative", width: "100%", height: "150px" }}>
                    <video
                      src={mediaItem.storageUrl}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover"
                      }}
                      muted
                      playsInline
                      controls
                      preload="metadata"
                    >
                      <track kind="captions" />
                    </video>
                  </div>
                ) : (
                  <div 
                    style={{
                      width: "100%",
                      height: "150px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#F5F5F5",
                      cursor: "pointer"
                    }}
                    onClick={() => window.open(mediaItem.storageUrl, "_blank")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="48"
                      height="48"
                      fill="none"
                      stroke="#7A7A7A"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      viewBox="0 0 24 24"
                      style={{ marginBottom: "0.5rem" }}
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <span style={{ 
                      fontSize: "0.75rem", 
                      color: "#7A7A7A",
                      textAlign: "center",
                      padding: "0 0.5rem"
                    }}>
                      PDF
                    </span>
                  </div>
                )}
                <div style={{
                  padding: "0.5rem",
                  fontSize: "0.75rem",
                  color: "#7A7A7A",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {mediaItem.fileName}
                  </span>
                  {dppId && dppId !== "new" && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (!confirm("Möchten Sie diese Datei wirklich löschen?")) return
                        
                        try {
                          const response = await fetch(`/api/app/dpp/${dppId}/media/${mediaItem.id}`, {
                            method: "DELETE"
                          })
                          if (response.ok) {
                            showNotification("Datei gelöscht", "success")
                            if (onMediaChange) {
                              onMediaChange()
                            }
                          } else {
                            const data = await response.json()
                            throw new Error(data.error || "Fehler beim Löschen")
                          }
                        } catch (error: any) {
                          showNotification(error.message || "Fehler beim Löschen", "error")
                        }
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#DC2626",
                        cursor: "pointer",
                        padding: "0.25rem 0.5rem",
                        marginLeft: "0.5rem",
                        fontSize: "1.2rem",
                        fontWeight: "bold",
                        lineHeight: 1
                      }}
                      title="Datei löschen"
                    >
                      ×
                    </button>
                  )}
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
      <div>
        <InputField
          id={`field-${field.id}`}
          label={hideLabel ? "" : field.label}
          value={value as string || ""}
          onChange={(e) => {
            console.log("[TemplateBlockField] Text field onChange:", field.key, e.target.value, "onChange exists:", !!onChange)
            if (onChange) {
              onChange(e.target.value)
            } else {
              console.warn("[TemplateBlockField] onChange is undefined for field:", field.key)
            }
          }}
          required={field.required}
          type="text"
          readOnly={readOnly}
          disabled={readOnly}
        />
        {/* TEIL 6: Bestätigungsfunktion - unter dem InputField */}
        {renderSupplierInfo()}
      </div>
    )
  }

  // Textarea-Feld
  if (field.type === "textarea") {
    return (
      <div style={{ marginBottom: "1.5rem" }}>
        <label htmlFor={`field-${field.id}`} style={{
          display: "block",
          fontSize: "clamp(0.9rem, 2vw, 1rem)",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          {hideLabel ? "" : field.label}
          {field.required && <span style={{ color: "#24c598", marginLeft: "0.25rem" }}>*</span>}
          {/* TEIL 6: Bestätigungsfunktion - direkt hinter dem Feldnamen (inline) */}
          {renderSupplierInfo()}
        </label>
        <textarea
          id={`field-${field.id}`}
          value={value as string || ""}
          onChange={(e) => {
            if (onChange) {
              onChange(e.target.value)
            }
          }}
          required={field.required}
          rows={4}
          style={{
            width: "100%",
            padding: "clamp(0.75rem, 2vw, 1rem)",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            border: "1px solid #CDCDCD",
            borderRadius: "8px",
            boxSizing: "border-box",
            fontFamily: "inherit",
            resize: "vertical"
          }}
        />
      </div>
    )
  }

  // Number-Feld
  if (field.type === "number") {
    return (
      <div style={{ marginBottom: "1.5rem" }}>
        <label htmlFor={`field-${field.id}`} style={{
          display: "block",
          fontSize: "clamp(0.9rem, 2vw, 1rem)",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          {hideLabel ? "" : field.label}
          {field.required && <span style={{ color: "#24c598", marginLeft: "0.25rem" }}>*</span>}
          {/* TEIL 6: Bestätigungsfunktion - direkt hinter dem Feldnamen (inline) */}
          {renderSupplierInfo()}
        </label>
        <input
          id={`field-${field.id}`}
          type="number"
          value={value as string || ""}
          onChange={(e) => onChange?.(e.target.value)}
          required={field.required}
          style={{
            width: "100%",
            padding: "clamp(0.75rem, 2vw, 1rem)",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            border: "1px solid #CDCDCD",
            borderRadius: "8px",
            boxSizing: "border-box"
          }}
        />
      </div>
    )
  }

  // Date-Feld
  if (field.type === "date") {
    return (
      <div style={{ marginBottom: "1.5rem" }}>
        <label htmlFor={`field-${field.id}`} style={{
          display: "block",
          fontSize: "clamp(0.9rem, 2vw, 1rem)",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          {hideLabel ? "" : field.label}
          {field.required && <span style={{ color: "#24c598", marginLeft: "0.25rem" }}>*</span>}
          {/* TEIL 6: Bestätigungsfunktion - direkt hinter dem Feldnamen (inline) */}
          {renderSupplierInfo()}
        </label>
        <input
          id={`field-${field.id}`}
          type="date"
          value={value as string || ""}
          onChange={(e) => onChange?.(e.target.value)}
          required={field.required}
          style={{
            width: "100%",
            padding: "clamp(0.75rem, 2vw, 1rem)",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            border: "1px solid #CDCDCD",
            borderRadius: "8px",
            boxSizing: "border-box"
          }}
        />
      </div>
    )
  }

  // URL-Feld
  if (field.type === "url") {
    return (
      <div style={{ marginBottom: "1.5rem" }}>
        <label htmlFor={`field-${field.id}`} style={{
          display: "block",
          fontSize: "clamp(0.9rem, 2vw, 1rem)",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          {hideLabel ? "" : field.label}
          {field.required && <span style={{ color: "#24c598", marginLeft: "0.25rem" }}>*</span>}
          {/* TEIL 6: Bestätigungsfunktion - direkt hinter dem Feldnamen (inline) */}
          {renderSupplierInfo()}
        </label>
        <input
          id={`field-${field.id}`}
          type="url"
          value={value as string || ""}
          onChange={(e) => onChange?.(e.target.value)}
          required={field.required}
          style={{
            width: "100%",
            padding: "clamp(0.75rem, 2vw, 1rem)",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            border: "1px solid #CDCDCD",
            borderRadius: "8px",
            boxSizing: "border-box"
          }}
        />
      </div>
    )
  }

  // Country-Feld
  if (field.type === "country") {
    return (
      <CountrySelect
        id={`field-${field.id}`}
        label={hideLabel ? "" : field.label}
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
      <>
        {!hideLabel && (
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
                <span style={{ color: "#24c598", marginLeft: "0.25rem" }}>*</span>
              )}
              {renderSupplierInfo()}
            </label>
          </div>
        )}
        <div style={{ marginBottom: hideLabel ? "0" : "1.5rem" }}>
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
      </>
    )
  }

  // Multi-Select-Feld
  if (field.type === "multi-select") {
    const options = field.config?.options || []
    const selectedValues = (value as string[] || [])
    return (
      <>
        {!hideLabel && (
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
                <span style={{ color: "#24c598", marginLeft: "0.25rem" }}>*</span>
              )}
            </label>
          </div>
        )}
        <div style={{ marginBottom: hideLabel ? "0" : "1.5rem" }}>
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
      </>
    )
  }

  // Boolean-Feld (Ja/Nein)
  if (field.type === "boolean") {
    return (
      <>
        {!hideLabel && (
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
                  <span style={{ color: "#24c598", marginLeft: "0.25rem" }}>*</span>
                )}
                {renderSupplierInfo()}
              </span>
            </label>
          </div>
        )}
      </>
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

