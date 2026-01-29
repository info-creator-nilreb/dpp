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
    mode?: "input" | "declaration" // Modus: "input" = beigesteuert, "declaration" = geprüft
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
            {supplierInfo.mode === "declaration" 
              ? `Daten geprüft und vom ${supplierInfo.partnerRole} bestätigt`
              : `Geprüft und von ${supplierInfo.partnerRole} übernommen`}
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
  // WICHTIG: Zeige Medien an, die zu diesem Feld gehören
  // 1. Exakte Übereinstimmung: blockId und fieldId passen
  // 2. Fallback: fieldId passt (auch wenn blockId unterschiedlich ist - für Template-Änderungen)
  // 3. Fallback: fieldId passt mit alternativer Schreibweise (z.B. 'produktbild' vs 'productbild')
  // 4. Fallback: Legacy-Medien ohne blockId/fieldId für file-image Felder
  const fieldMedia = media.filter(m => {
    // 1. Exakte Übereinstimmung: blockId und fieldId passen
    if (m.blockId === blockId && m.fieldId === field.key) {
      return true
    }
    
    // 2. Fallback: fieldId passt (auch wenn blockId unterschiedlich ist)
    // Dies ist wichtig, wenn das Template geändert wurde und Block-IDs sich geändert haben
    if (m.fieldId === field.key && field.type === "file-image" && m.fileType && m.fileType.startsWith("image/")) {
      return true
    }
    
    // 3. Fallback: fieldId passt mit alternativer Schreibweise
    // Behandle 'produktbild' und 'productbild' als gleichwertig
    const normalizeFieldId = (id: string | null | undefined) => {
      if (!id) return null
      // Normalisiere zu Kleinbuchstaben und ersetze häufige Varianten
      return id.toLowerCase().replace(/produktbild/g, 'productbild')
    }
    const normalizedMediaFieldId = normalizeFieldId(m.fieldId)
    const normalizedFieldKey = normalizeFieldId(field.key)
    if (normalizedMediaFieldId === normalizedFieldKey && field.type === "file-image" && m.fileType && m.fileType.startsWith("image/")) {
      return true
    }
    
    // 4. Fallback für Legacy-Medien: Wenn blockId und fieldId beide null/undefined/leer sind
    // und es ein Bild ist, zeige es für file-image Felder an
    // Dies ist wichtig für Medien, die vor der Template-Implementierung hochgeladen wurden
    const hasNoBlockId = !m.blockId || m.blockId === null || m.blockId === ""
    const hasNoFieldId = !m.fieldId || m.fieldId === null || m.fieldId === ""
    
    if (hasNoBlockId && hasNoFieldId) {
      // Nur für file-image Felder: Zeige alle Bilder ohne blockId/fieldId
      if (field.type === "file-image" && m.fileType && m.fileType.startsWith("image/")) {
        return true
      }
    }
    return false
  })
  
  // Debug: Log gefilterte Medien - erweitert für besseres Debugging
  const allMediaDetails = media.map(m => {
    const hasNoBlockId = !m.blockId || m.blockId === null || m.blockId === ""
    const hasNoFieldId = !m.fieldId || m.fieldId === null || m.fieldId === ""
    const isImage = m.fileType?.startsWith("image/")
    const matchesBlockId = m.blockId === blockId
    const matchesFieldId = m.fieldId === field.key
    const shouldShowForFileImageLegacy = hasNoBlockId && hasNoFieldId && field.type === "file-image" && isImage
    const shouldShowForFileImageFieldMatch = matchesFieldId && field.type === "file-image" && isImage
    
    return {
      id: m.id,
      fileName: m.fileName,
      fileType: m.fileType,
      blockId: m.blockId,
      fieldId: m.fieldId,
      blockIdType: typeof m.blockId,
      fieldIdType: typeof m.fieldId,
      matchesBlockId: matchesBlockId,
      matchesFieldId: matchesFieldId,
      isImage: isImage,
      hasNoBlockId: hasNoBlockId,
      hasNoFieldId: hasNoFieldId,
      shouldShowForFileImageLegacy: shouldShowForFileImageLegacy,
      shouldShowForFileImageFieldMatch: shouldShowForFileImageFieldMatch,
      willBeFiltered: (matchesBlockId && matchesFieldId) || shouldShowForFileImageFieldMatch || shouldShowForFileImageLegacy
    }
  })
  
  // Erweitere Logs für besseres Debugging
  console.log(`[TemplateBlockField] Field ${field.key} (${field.label}): Found ${fieldMedia.length} media items out of ${media.length} total`, {
    blockId,
    fieldKey: field.key,
    fieldType: field.type,
    allMediaDetails: allMediaDetails,
    filteredMedia: fieldMedia.map(m => ({ id: m.id, fileName: m.fileName, blockId: m.blockId, fieldId: m.fieldId }))
  })
  
  // Zusätzlicher detaillierter Log für das erste Media-Item
  if (media.length > 0 && fieldMedia.length === 0) {
    const firstMedia = media[0]
    console.log(`[TemplateBlockField] DEBUG - Media not filtered for field ${field.key}:`, {
      mediaBlockId: firstMedia.blockId,
      mediaFieldId: firstMedia.fieldId,
      fieldBlockId: blockId,
      fieldKey: field.key,
      blockIdMatch: firstMedia.blockId === blockId,
      fieldIdMatch: firstMedia.fieldId === field.key,
      isImage: firstMedia.fileType?.startsWith("image/"),
      fieldType: field.type,
      shouldMatchByFieldId: firstMedia.fieldId === field.key && field.type === "file-image" && firstMedia.fileType?.startsWith("image/")
    })
  }
  
  // Filtere Pending Files für dieses Feld
  const fieldPendingFiles = pendingFiles.filter((pf: any) => 
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
          const pendingFile: any = {
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
          const pendingFile: any = {
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
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
          fontSize: "clamp(0.9rem, 2vw, 1rem)",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          <span>{field.label}</span>
          {field.required && (
            <span style={{ color: "#DC2626" }}>*</span>
          )}
          {/* TEIL 6: Bestätigungsfunktion - in derselben Zeile wie Label */}
          {renderSupplierInfo()}
        </label>
        
        {/* Upload Area - nur anzeigen wenn nicht read-only */}
        {!readOnly && (
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
        )}

        {/* Hinweis wenn im Review-Modus keine Medien vorhanden sind */}
        {readOnly && fieldMedia.length === 0 && (
          <div style={{
            marginTop: "1rem",
            padding: "1rem",
            backgroundColor: "#F5F5F5",
            borderRadius: "8px",
            border: "1px solid #E5E5E5",
            textAlign: "center"
          }}>
            <p style={{
              margin: 0,
              fontSize: "0.875rem",
              color: "#7A7A7A",
              fontStyle: "italic"
            }}>
              {field.type === "file-image" 
                ? "Kein Bild hochgeladen"
                : field.type === "file-document"
                ? "Kein Dokument hochgeladen"
                : field.type === "file-video"
                ? "Kein Video hochgeladen"
                : "Keine Datei hochgeladen"}
            </p>
          </div>
        )}

        {/* Angezeigte Medien (inkl. Pending Files) - Pending Files nur im Edit-Modus */}
        {(fieldMedia.length > 0 || (!readOnly && fieldPendingFiles.length > 0)) && (
          <div style={{
            marginTop: "1rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: "1rem"
          }}>
            {/* Pending Files (mit reduzierter Opacity) - nur im Edit-Modus */}
            {!readOnly && fieldPendingFiles.map((pendingFile) => (
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
                  {/* Delete-Button nur anzeigen wenn nicht read-only */}
                  {!readOnly && dppId && dppId !== "new" && (
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
      </div>
    )
  }

  // Textarea-Feld
  if (field.type === "textarea") {
    return (
      <div style={{ marginBottom: "1.5rem" }}>
        <label htmlFor={`field-${field.id}`} style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
          fontSize: "clamp(0.9rem, 2vw, 1rem)",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          {!hideLabel && <span>{field.label}</span>}
          {field.required && <span style={{ color: "#24c598" }}>*</span>}
          {/* TEIL 6: Bestätigungsfunktion - in derselben Zeile wie Label */}
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
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
          fontSize: "clamp(0.9rem, 2vw, 1rem)",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          {!hideLabel && <span>{field.label}</span>}
          {field.required && <span style={{ color: "#24c598" }}>*</span>}
          {/* TEIL 6: Bestätigungsfunktion - in derselben Zeile wie Label */}
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
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
          fontSize: "clamp(0.9rem, 2vw, 1rem)",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          {!hideLabel && <span>{field.label}</span>}
          {field.required && <span style={{ color: "#24c598" }}>*</span>}
          {/* TEIL 6: Bestätigungsfunktion - in derselben Zeile wie Label */}
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
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
          fontSize: "clamp(0.9rem, 2vw, 1rem)",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          {!hideLabel && <span>{field.label}</span>}
          {field.required && <span style={{ color: "#24c598" }}>*</span>}
          {/* TEIL 6: Bestätigungsfunktion - in derselben Zeile wie Label */}
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
      <div style={{ marginBottom: "1.5rem" }}>
        {!hideLabel && (
          <div style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.5rem",
            marginBottom: "0.5rem"
          }}>
            <label htmlFor={`field-${field.id}`} style={{
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              fontWeight: "600",
              color: "#0A0A0A"
            }}>
              {field.label}
            </label>
            {field.required && (
              <span style={{ color: "#24c598" }}>*</span>
            )}
            {renderSupplierInfo()}
          </div>
        )}
        <CountrySelect
          id={`field-${field.id}`}
          label="" // Label wird oben angezeigt
          value={value as string || ""}
          onChange={(code: string) => onChange?.(code)}
          required={field.required}
        />
      </div>
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
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.5rem",
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              <span>{field.label}</span>
              {field.required && (
                <span style={{ color: "#24c598" }}>*</span>
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
            padding: "clamp(0.75rem, 2vw, 1rem) 2.5rem clamp(0.75rem, 2vw, 1rem) clamp(0.75rem, 2vw, 1rem)",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            border: "1px solid #CDCDCD",
            borderRadius: "8px",
            backgroundColor: "#FFFFFF",
            color: "#0A0A0A",
            boxSizing: "border-box",
            appearance: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
            cursor: "pointer",
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%237A7A7A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 0.75rem center",
            backgroundSize: "20px 20px"
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
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.5rem",
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              <span>{field.label}</span>
              {field.required && (
                <span style={{ color: "#24c598" }}>*</span>
              )}
              {renderSupplierInfo()}
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
              flexWrap: "wrap",
              gap: "0.75rem",
              cursor: "pointer"
            }}>
              <input
                type="checkbox"
                checked={typeof value === "string" && value === "true"}
                onChange={(e) => {
                  onChange?.(e.target.checked ? "true" : "false")
                }}
                style={{ width: "18px", height: "18px", cursor: "pointer", flexShrink: 0 }}
              />
              <span style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.5rem",
                fontSize: "clamp(0.9rem, 2vw, 1rem)",
                fontWeight: "600",
                color: "#0A0A0A",
                flex: 1
              }}>
                <span>{field.label}</span>
                {field.required && (
                  <span style={{ color: "#24c598" }}>*</span>
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

