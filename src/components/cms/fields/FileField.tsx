"use client"

/**
 * File Field Component
 * 
 * Generische File-Feld-Komponente für Blöcke
 * - Unterstützt Upload mit Block-Kontext
 * - Rolle wird automatisch aus Block + Feldtyp abgeleitet
 * - Versionsgebundene Medien
 * 
 * File-Typen:
 * - "media": Bilder (jpg, png, webp, gif) → Rolle wird aus Block-Kontext abgeleitet
 * - "document": PDFs, Dokumente → Rolle = "document"
 */

import { useState, useRef, useEffect } from "react"
import FileUploadArea from "@/components/FileUploadArea"
import { useNotification } from "@/components/NotificationProvider"

export type FileFieldType = "media" | "document"

interface FileFieldProps {
  label: string
  value: string | string[] | null // storageUrl oder Array von URLs oder null
  onChange: (value: string | string[] | null) => void
  dppId: string
  blockId?: string // Optional: ID des Blocks (für Content-Blöcke)
  fieldKey?: string // Optional: Key des Felds im Block
  blockName?: string // Optional: Name des Blocks (für Hero-Logik: "Basis- & Produktdaten")
  fileType?: FileFieldType // "media" oder "document" - bestimmt erlaubte Dateitypen
  required?: boolean
  accept?: string // MIME-Types (wird aus fileType abgeleitet, falls nicht gesetzt)
  maxSize?: number // In Bytes
  maxCount?: number // Optional: Maximale Anzahl an Dateien (für Multi-File-Felder)
  description?: string
  helperText?: string
}

/**
 * Leitet die Rolle automatisch aus Block-Kontext und Dateityp ab
 */
function deriveRole(
  file: File,
  blockName?: string,
  fileType?: FileFieldType,
  existingMediaCount?: number
): string {
  const isImage = file.type.startsWith("image/")
  const isDocument = file.type === "application/pdf" || fileType === "document"

  // Document → immer "document"
  if (isDocument) {
    return "document"
  }

  // Media im "Basis- & Produktdaten"-Block
  if (blockName === "Basis- & Produktdaten" || blockName?.includes("Basis") || blockName?.includes("Produktdaten")) {
    // Erstes Bild = Hero, weitere = Galerie
    if (existingMediaCount === 0) {
      return "primary_product_image"
    } else {
      return "gallery_image"
    }
  }

  // Media in anderen Blöcken → "gallery_image" (wird im jeweiligen Abschnitt angezeigt)
  if (isImage) {
    return "gallery_image"
  }

  // Fallback
  return "other"
}

export default function FileField({
  label,
  value,
  onChange,
  dppId,
  blockId,
  fieldKey,
  blockName,
  fileType = "media", // Default: Media
  required = false,
  accept,
  maxSize = 10 * 1024 * 1024, // 10 MB default
  maxCount,
  description,
  helperText
}: FileFieldProps) {
  const { showNotification } = useNotification()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Cleanup: Abbreche laufende Uploads beim Unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Leite accept aus fileType ab, falls nicht explizit gesetzt
  const effectiveAccept = accept || (
    fileType === "document"
      ? "application/pdf"
      : "image/jpeg,image/jpg,image/png,image/webp,image/gif"
  )

  async function handleFileUpload(file: File) {
    if (!dppId) {
      showNotification("DPP-ID fehlt", "error")
      return
    }

    // Prüfe Max-Anzahl (falls gesetzt)
    if (maxCount !== undefined && maxCount > 0) {
      const currentCount = Array.isArray(value) ? value.length : (value ? 1 : 0)
      if (currentCount >= maxCount) {
        showNotification(`Maximal ${maxCount} Datei${maxCount > 1 ? 'en' : ''} erlaubt. Bitte entfernen Sie zuerst eine vorhandene Datei.`, "error")
        return
      }
    }

    setUploading(true)
    setUploadProgress("Wird hochgeladen...")
    
    // Erstelle neuen AbortController für diesen Upload
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal
    
    try {
      // Hole aktuelle Medienanzahl für Hero-Logik (nur für Basis- & Produktdaten-Block)
      let existingMediaCount = 0
      if (blockName?.includes("Basis") || blockName?.includes("Produktdaten")) {
        try {
          const mediaResponse = await fetch(`/api/app/dpp/${dppId}/media`, {
            signal // Auch für diesen Request
          })
          if (mediaResponse.ok) {
            const mediaData = await mediaResponse.json()
            // Zähle nur Media-Dateien (Bilder) im gleichen Block
            existingMediaCount = (mediaData.media || []).filter((m: any) => 
              m.blockId === blockId && 
              m.fileType?.startsWith("image/")
            ).length
          }
        } catch (e: any) {
          // Ignoriere Abort-Fehler
          if (e.name === 'AbortError') {
            console.log("Media count fetch aborted")
            return
          }
          // Ignoriere andere Fehler beim Laden der Medienanzahl
          console.warn("Could not load existing media count:", e)
        }
      }

      // Leite Rolle automatisch ab
      const derivedRole = deriveRole(file, blockName, fileType, existingMediaCount)

      const formData = new FormData()
      formData.append("file", file)
      if (blockId) formData.append("blockId", blockId)
      if (fieldKey) formData.append("fieldKey", fieldKey)
      formData.append("role", derivedRole)

      const response = await fetch(`/api/app/dpp/${dppId}/media`, {
        method: "POST",
        body: formData,
        signal // Wichtig: Signal für Abort-Unterstützung
      })

      if (!response.ok) {
        let errorMessage = `Fehler beim Hochladen (${response.status})`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
          console.error("[FileField] Upload error response:", {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          })
        } catch (parseError) {
          // Wenn JSON-Parsing fehlschlägt, verwende Status-Text
          const statusText = response.statusText || `HTTP ${response.status}`
          errorMessage = `Fehler beim Hochladen: ${statusText}`
          console.error("[FileField] Failed to parse error response:", parseError)
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()

      if (!result.media || !result.media.storageUrl) {
        throw new Error("Ungültige Antwort vom Server: Keine Datei-URL erhalten")
      }

      // Prüfe ob Request abgebrochen wurde
      if (signal.aborted) {
        console.log("Upload was aborted")
        return
      }

      // Setze Upload-Status zurück BEVOR onChange aufgerufen wird
      setUploading(false)
      setUploadProgress(null)
      
      // Update value mit neuem Media-Objekt (inkl. Thumbnail-Info)
      const mediaUrl = result.media.storageUrl
      
      // Wenn maxCount > 1, füge zur Array hinzu, sonst ersetze
      if (maxCount && maxCount > 1) {
        const currentUrls = Array.isArray(value) ? value : (value ? [value] : [])
        onChange([...currentUrls, mediaUrl])
      } else {
        onChange(mediaUrl)
      }
      
      // Zeige kontextbezogene Erfolgsmeldung
      const successMessage = derivedRole === "primary_product_image"
        ? "Bild als Hero-Bild hochgeladen"
        : derivedRole === "gallery_image"
        ? "Bild zur Galerie hinzugefügt"
        : "Datei erfolgreich hochgeladen"
      
      showNotification(successMessage, "success")
    } catch (error: any) {
      // Ignoriere Abort-Fehler (Request wurde absichtlich abgebrochen)
      if (error.name === 'AbortError') {
        console.log("Upload was aborted")
        setUploading(false)
        setUploadProgress(null)
        return
      }
      
      console.error("Error uploading file:", error)
      const errorMessage = error.message || "Fehler beim Hochladen der Datei"
      showNotification(errorMessage, "error")
      setUploading(false)
      setUploadProgress(null)
    } finally {
      // Cleanup
      abortControllerRef.current = null
    }
  }

  function handleRemove(index?: number) {
    if (maxCount && maxCount > 1 && Array.isArray(value)) {
      // Entferne spezifisches Bild aus Array
      const newValue = value.filter((_, i) => i !== index)
      onChange(newValue.length > 0 ? newValue : null)
    } else {
      onChange(null)
    }
  }

  // Normalisiere value zu Array für Multi-File oder zu String für Single-File
  const isMultiFile = maxCount && maxCount > 1
  const imageUrls = isMultiFile 
    ? (Array.isArray(value) ? value : (value ? [value] : []))
    : (Array.isArray(value) ? value[0] : value)
  
  // Prüfe ob es ein Bild ist (sicher mit null/undefined checks)
  const getImageUrl = () => {
    if (!imageUrls) return null
    if (Array.isArray(imageUrls)) {
      return imageUrls.length > 0 ? imageUrls[0] : null
    }
    return typeof imageUrls === 'string' ? imageUrls : null
  }
  
  const imageUrl = getImageUrl()
  const isImage = imageUrl && typeof imageUrl === 'string' && (
    imageUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) || 
    (imageUrl.startsWith("/uploads/") && !imageUrl.endsWith(".pdf"))
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Label */}
      <div>
        <label style={{
          display: "block",
          fontSize: "0.875rem",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          {label} {required && <span style={{ color: "#24c598" }}>*</span>}
        </label>
        {description && (
          <p style={{
            fontSize: "0.75rem",
            color: "#7A7A7A",
            margin: "0 0 0.5rem 0"
          }}>
            {description}
          </p>
        )}
        {helperText && (
          <p style={{
            fontSize: "0.75rem",
            color: "#7A7A7A",
            fontStyle: "italic",
            margin: "0 0 0.5rem 0"
          }}>
            {helperText}
          </p>
        )}
      </div>

      {/* Kontextbezogene Beschreibung */}
      {!description && blockName && (
        <p style={{
          fontSize: "0.75rem",
          color: "#7A7A7A",
          margin: "0 0 0.5rem 0"
        }}>
          {fileType === "document" 
            ? "PDF-Dokument wird als Download im Abschnitt bereitgestellt"
            : blockName.includes("Basis") || blockName.includes("Produktdaten")
            ? "Erstes Bild wird als Hero-Bild verwendet, weitere als Galerie"
            : "Bild wird im Abschnitt angezeigt"}
        </p>
      )}

      {/* Upload-Status während Upload */}
      {uploading && uploadProgress && (
        <div style={{
          padding: "1.5rem",
          backgroundColor: "#F9F9F9",
          border: "1px solid #E5E5E5",
          borderRadius: "8px",
          textAlign: "center"
        }}>
          <div style={{
            display: "inline-block",
            width: "24px",
            height: "24px",
            border: "3px solid #E5E5E5",
            borderTopColor: "#24c598",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            marginBottom: "0.75rem"
          }} />
          <p style={{
            fontSize: "0.875rem",
            color: "#7A7A7A",
            margin: 0
          }}>
            {uploadProgress}
          </p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* File Upload - nur anzeigen wenn keine Dateien oder wenn Single-File */}
      {(!value || (Array.isArray(value) && value.length === 0) || (!isMultiFile && value)) && !uploading && (
        <FileUploadArea
          accept={effectiveAccept}
          maxSize={maxSize}
          onFileSelect={handleFileUpload}
          disabled={uploading}
          label={isMultiFile ? "Dateien auswählen" : "Datei auswählen"}
          description={description || (
            fileType === "document"
              ? `PDF-Dokument (max. ${(maxSize / 1024 / 1024).toFixed(0)} MB)`
              : `Bild (JPEG, PNG, WebP, GIF - max. ${(maxSize / 1024 / 1024).toFixed(0)} MB)`
          )}
        />
      )}

      {/* File Preview mit Thumbnail */}
      {value && !uploading && (
        <div style={{
          padding: "1rem",
          backgroundColor: "#F9F9F9",
          border: "1px solid #E5E5E5",
          borderRadius: "8px"
        }}>
          {isMultiFile && Array.isArray(imageUrls) && imageUrls.length > 0 ? (
            // Multi-File: Thumbnail-Galerie
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
              gap: "0.75rem",
              marginBottom: "0.75rem"
            }}>
              {imageUrls.map((url, index) => (
                <div key={index} style={{ position: "relative" }}>
                  <img
                    src={url}
                    alt={`${label} ${index + 1}`}
                    style={{
                      width: "100%",
                      height: "100px",
                      objectFit: "cover",
                      borderRadius: "6px",
                      border: "1px solid #E5E5E5",
                      backgroundColor: "#FFFFFF"
                    }}
                    onError={(e) => {
                      console.error("Error loading image:", url)
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    disabled={uploading}
                    style={{
                      position: "absolute",
                      top: "4px",
                      right: "4px",
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(220, 38, 38, 0.9)",
                      color: "#FFFFFF",
                      border: "none",
                      cursor: uploading ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: "bold",
                      padding: 0
                    }}
                    title="Entfernen"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : isImage && imageUrl ? (
            // Single-File: Einzelnes Bild
            <div style={{ marginBottom: "0.75rem" }}>
              <img
                src={imageUrl}
                alt={label}
                style={{
                  width: "100%",
                  maxWidth: "300px",
                  height: "auto",
                  maxHeight: "200px",
                  objectFit: "contain",
                  borderRadius: "6px",
                  border: "1px solid #E5E5E5",
                  backgroundColor: "#FFFFFF",
                  display: "block"
                }}
                onError={(e) => {
                  console.error("Error loading image:", imageUrl)
                }}
              />
            </div>
          ) : imageUrl ? (
            // Dokument
            <div style={{
              padding: "1rem",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E5E5",
              borderRadius: "6px",
              marginBottom: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem"
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7A7A7A" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <span style={{ fontSize: "0.875rem", color: "#0A0A0A" }}>
                {imageUrl.split("/").pop() || "Datei"}
              </span>
            </div>
          ) : null}
          {!isMultiFile && (
            <button
              type="button"
              onClick={() => handleRemove()}
              disabled={uploading}
              style={{
                fontSize: "0.75rem",
                color: "#DC2626",
                backgroundColor: "transparent",
                border: "none",
                cursor: uploading ? "not-allowed" : "pointer",
                padding: "0.5rem 0",
                opacity: uploading ? 0.5 : 1,
                fontWeight: "500"
              }}
            >
              Datei entfernen
            </button>
          )}
          {isMultiFile && Array.isArray(imageUrls) && imageUrls.length > 0 && (
            <p style={{
              fontSize: "0.75rem",
              color: "#7A7A7A",
              margin: "0.5rem 0 0 0"
            }}>
              {imageUrls.length} Bild{imageUrls.length > 1 ? 'er' : ''} hochgeladen
            </p>
          )}
        </div>
      )}
    </div>
  )
}



