"use client"

/**
 * Image Block Editor
 * 
 * Editor für Bild-Blöcke mit Unterstützung für mehrere Bilder
 * UI orientiert sich an Shopify Produktbild-Upload
 */

import FileField from "@/components/cms/fields/FileField"
import { useState, useEffect, useRef } from "react"
import { useNotification } from "@/components/NotificationProvider"

interface ImageBlockEditorProps {
  content: Record<string, any>
  onChange: (content: Record<string, any>) => void
  dppId?: string
  blockId?: string // Block-ID für versionsgebundene Medien
  blockName?: string // Block-Name (für Hero-Logik)
}

interface ImageMetadata {
  alt?: string
  caption?: string
  alignment?: "left" | "center" | "right"
}

export default function ImageBlockEditor({
  content,
  onChange,
  dppId,
  blockId,
  blockName
}: ImageBlockEditorProps) {
  // Normalisiere url zu Array (für mehrere Bilder)
  const urlValue = content.url || ""
  const urlArray = Array.isArray(urlValue) ? urlValue : (urlValue ? [urlValue] : [])
  
  // Metadaten pro Bild (index-basiert)
  const [imageMetadata, setImageMetadata] = useState<Record<number, ImageMetadata>>(() => {
    // Initialisiere aus content.imageMetadata oder aus Legacy-Feldern
    if (content.imageMetadata && typeof content.imageMetadata === 'object') {
      return content.imageMetadata as Record<number, ImageMetadata>
    }
    // Fallback: Verwende Legacy-Felder für erstes Bild
    return {
      0: {
        alt: content.alt || "",
        caption: content.caption || "",
        alignment: content.alignment || "center"
      }
    }
  })
  
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const { showNotification } = useNotification()

  // Initialisiere Metadaten für alle Bilder beim Laden
  useEffect(() => {
    const newMetadata: Record<number, ImageMetadata> = {}
    urlArray.forEach((_, index) => {
      if (imageMetadata[index]) {
        newMetadata[index] = imageMetadata[index]
      } else {
        // Verwende Legacy-Felder für erstes Bild, sonst Standardwerte
        newMetadata[index] = index === 0 ? {
          alt: content.alt || "",
          caption: content.caption || "",
          alignment: content.alignment || "center"
        } : {
          alt: "",
          caption: "",
          alignment: "center"
        }
      }
    })
    if (JSON.stringify(newMetadata) !== JSON.stringify(imageMetadata)) {
      setImageMetadata(newMetadata)
    }
  }, [urlArray.length]) // Nur wenn Anzahl der Bilder sich ändert

  const data = {
    url: urlArray, // Immer als Array speichern
    alt: imageMetadata[0]?.alt || content.alt || "",
    caption: imageMetadata[0]?.caption || content.caption || "",
    alignment: imageMetadata[0]?.alignment || content.alignment || "center"
  }

  function updateField(field: string, value: any) {
    onChange({
      ...data,
      [field]: value
    })
  }

  function updateImageMetadata(index: number, metadata: ImageMetadata) {
    const newMetadata = {
      ...imageMetadata,
      [index]: metadata
    }
    setImageMetadata(newMetadata)
    
    // Update auch im content (für Backward-Kompatibilität speichere erste Bild-Metadaten im Haupt-Content)
    if (index === 0) {
      updateField("alt", metadata.alt || "")
      updateField("caption", metadata.caption || "")
      updateField("alignment", metadata.alignment || "center")
    }
    
    // Speichere alle Metadaten im content (als Array für mehrere Bilder)
    onChange({
      ...data,
      url: urlArray,
      imageMetadata: newMetadata, // Speichere alle Metadaten
      alt: newMetadata[0]?.alt || "",
      caption: newMetadata[0]?.caption || "",
      alignment: newMetadata[0]?.alignment || "center"
    })
  }

  // Upload-Funktion für einzelne Datei
  async function handleFileUpload(file: File) {
    if (!dppId) {
      showNotification("DPP-ID fehlt", "error")
      return
    }

    // Validierung
    const maxSize = 5 * 1024 * 1024 // 5 MB
    if (file.size > maxSize) {
      showNotification(`Datei zu groß. Maximum: ${(maxSize / 1024 / 1024).toFixed(1)} MB`, "error")
      return
    }

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
    if (!validTypes.includes(file.type)) {
      showNotification("Ungültiger Dateityp. Nur JPEG, PNG, WebP oder GIF erlaubt.", "error")
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      if (blockId) formData.append("blockId", blockId)
      formData.append("fieldKey", "url")
      formData.append("role", "gallery_image")

      const response = await fetch(`/api/app/dpp/${dppId}/media`, {
        method: "POST",
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Upload fehlgeschlagen")
      }

      const result = await response.json()
      const newUrl = result.media.storageUrl

      // Füge neues Bild hinzu
      const newUrls = [...urlArray, newUrl]
      updateField("url", newUrls)

      // Initialisiere Metadaten für neues Bild
      setImageMetadata(prev => ({
        ...prev,
        [newUrls.length - 1]: {
          alt: "",
          caption: "",
          alignment: "center"
        }
      }))

      showNotification("Bild erfolgreich hochgeladen", "success")
    } catch (error: any) {
      console.error("Error uploading file:", error)
      showNotification(error.message || "Fehler beim Hochladen der Datei", "error")
    } finally {
      setUploading(false)
    }
  }

  // Drag & Drop Handler
  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    // Nur wenn wir den Container verlassen (nicht ein Child-Element)
    if (e.currentTarget === e.target) {
      setIsDragging(false)
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  // Wenn mehrere Bilder vorhanden, zeige Thumbnail-Galerie
  const hasImages = urlArray.length > 0

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Shopify-ähnliche Upload-Ansicht */}
      {!hasImages ? (
        // Keine Bilder: Upload-Ansicht wie Screenshot 2
        <FileField
          label="Bilder"
          value={null}
          onChange={(urls) => {
            const normalizedUrls = Array.isArray(urls) ? urls : (urls ? [urls] : [])
            updateField("url", normalizedUrls)
            // Initialisiere Metadaten für neue Bilder
            const newMetadata: Record<number, ImageMetadata> = {}
            normalizedUrls.forEach((_, index) => {
              newMetadata[index] = {
                alt: "",
                caption: "",
                alignment: "center"
              }
            })
            setImageMetadata(newMetadata)
          }}
          dppId={dppId || ""}
          blockId={blockId}
          fieldKey="url"
          blockName={blockName}
          fileType="media"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          maxSize={5 * 1024 * 1024}
          maxCount={10}
          description="JPEG, PNG, GIF oder WebP (max. 5 MB pro Bild)"
          helperText="Sie können mehrere Bilder in diesem Block hochladen"
        />
      ) : (
        // Bilder vorhanden: Thumbnail-Grid mit Plus-Icon wie Screenshot 3
        <div>
          <label style={{
            display: "block",
            fontSize: "0.875rem",
            fontWeight: "600",
            color: "#0A0A0A",
            marginBottom: "0.75rem"
          }}>
            Bilder
          </label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              gap: "0.75rem",
              border: isDragging ? "2px dashed #24c598" : "2px dashed transparent",
              borderRadius: "8px",
              padding: isDragging ? "0.5rem" : "0",
              backgroundColor: isDragging ? "#F0FDF4" : "transparent",
              transition: "all 0.2s",
              minHeight: "120px",
              position: "relative"
            }}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Drag & Drop Overlay */}
            {isDragging && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(36, 197, 152, 0.1)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                  pointerEvents: "none"
                }}
              >
                <div style={{
                  textAlign: "center",
                  color: "#24c598",
                  fontWeight: "600",
                  fontSize: "0.875rem"
                }}>
                  Bild hier ablegen
                </div>
              </div>
            )}
            
            {/* Upload Loading Overlay */}
            {uploading && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                  pointerEvents: "none"
                }}
              >
                <div style={{
                  textAlign: "center",
                  color: "#24c598"
                }}>
                  <div style={{
                    display: "inline-block",
                    width: "24px",
                    height: "24px",
                    border: "3px solid #E5E5E5",
                    borderTopColor: "#24c598",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                    marginBottom: "0.5rem"
                  }} />
                  <div style={{
                    fontSize: "0.875rem",
                    fontWeight: "500"
                  }}>
                    Wird hochgeladen...
                  </div>
                  <style>{`
                    @keyframes spin {
                      to { transform: rotate(360deg); }
                    }
                  `}</style>
                </div>
              </div>
            )}
            {/* Bestehende Bilder */}
            {urlArray.map((url: string, index: number) => (
              <div
                key={index}
                style={{
                  position: "relative",
                  aspectRatio: "1",
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: "1px solid #E5E5E5",
                  backgroundColor: "#FFFFFF",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onClick={() => setEditingImageIndex(index)}
                onMouseEnter={(e) => {
                  if (!isDragging) {
                    e.currentTarget.style.borderColor = "#24c598"
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(36, 197, 152, 0.2)"
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#E5E5E5"
                  e.currentTarget.style.boxShadow = "none"
                }}
                // Verhindere Drag & Drop auf bestehenden Bildern (nur auf Container)
                onDragEnter={(e) => e.stopPropagation()}
                onDragOver={(e) => e.stopPropagation()}
                onDrop={(e) => e.stopPropagation()}
              >
                <img
                  src={url}
                  alt={imageMetadata[index]?.alt || `Bild ${index + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  }}
                  onError={(e) => {
                    console.error("Error loading preview image:", url)
                  }}
                />
                {/* Entfernen-Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    const newUrls = urlArray.filter((_, i) => i !== index)
                    updateField("url", newUrls)
                    // Entferne Metadaten für gelöschtes Bild
                    const newMetadata = { ...imageMetadata }
                    delete newMetadata[index]
                    // Verschiebe Metadaten für nachfolgende Bilder
                    const reindexedMetadata: Record<number, ImageMetadata> = {}
                    newUrls.forEach((_, newIndex) => {
                      const oldIndex = newIndex >= index ? newIndex + 1 : newIndex
                      reindexedMetadata[newIndex] = imageMetadata[oldIndex] || {
                        alt: "",
                        caption: "",
                        alignment: "center"
                      }
                    })
                    setImageMetadata(reindexedMetadata)
                  }}
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(220, 38, 38, 0.9)",
                    color: "#FFFFFF",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    fontWeight: "bold",
                    padding: 0,
                    lineHeight: 1
                  }}
                  title="Bild entfernen"
                >
                  ×
                </button>
              </div>
            ))}
            
            {/* Plus-Icon zum Hinzufügen weiterer Bilder */}
            {urlArray.length < 10 && (
              <div
                style={{
                  aspectRatio: "1",
                  borderRadius: "8px",
                  border: "2px dashed #E5E5E5",
                  backgroundColor: "#F9F9F9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onClick={() => {
                  // Trigger file input
                  const input = document.createElement("input")
                  input.type = "file"
                  input.accept = "image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  input.multiple = false
                  input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) {
                      await handleFileUpload(file)
                    }
                  }
                  input.click()
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#24c598"
                  e.currentTarget.style.backgroundColor = "#F0FDF4"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#E5E5E5"
                  e.currentTarget.style.backgroundColor = "#F9F9F9"
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7A7A7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal für Bild-Metadaten */}
      {editingImageIndex !== null && urlArray[editingImageIndex] && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem"
          }}
          onClick={() => setEditingImageIndex(null)}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              padding: "2rem",
              maxWidth: "500px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem"
            }}>
              <h3 style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                color: "#0A0A0A",
                margin: 0
              }}>
                Bild bearbeiten
              </h3>
              <button
                type="button"
                onClick={() => setEditingImageIndex(null)}
                style={{
                  backgroundColor: "transparent",
                  border: "none",
                  fontSize: "1.5rem",
                  color: "#7A7A7A",
                  cursor: "pointer",
                  padding: 0,
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                ×
              </button>
            </div>

            {/* Bildvorschau */}
            <div style={{
              marginBottom: "1.5rem",
              borderRadius: "8px",
              overflow: "hidden",
              border: "1px solid #E5E5E5"
            }}>
              <img
                src={urlArray[editingImageIndex]}
                alt={imageMetadata[editingImageIndex]?.alt || "Bild"}
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block"
                }}
              />
            </div>

            {/* Alt-Text */}
            <div style={{ marginBottom: "1.5rem" }}>
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
                value={imageMetadata[editingImageIndex]?.alt || ""}
                onChange={(e) => {
                  const newMetadata = {
                    ...imageMetadata[editingImageIndex],
                    alt: e.target.value
                  }
                  updateImageMetadata(editingImageIndex, newMetadata)
                }}
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
                  e.target.style.borderColor = "#24c598"
                  e.target.style.boxShadow = "0 0 0 3px rgba(36, 197, 152, 0.1)"
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#E5E5E5"
                  e.target.style.boxShadow = "none"
                }}
                maxLength={200}
              />
            </div>

            {/* Bildunterschrift */}
            <div style={{ marginBottom: "1.5rem" }}>
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
                value={imageMetadata[editingImageIndex]?.caption || ""}
                onChange={(e) => {
                  const newMetadata = {
                    ...imageMetadata[editingImageIndex],
                    caption: e.target.value
                  }
                  updateImageMetadata(editingImageIndex, newMetadata)
                }}
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
                  e.target.style.borderColor = "#24c598"
                  e.target.style.boxShadow = "0 0 0 3px rgba(36, 197, 152, 0.1)"
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#E5E5E5"
                  e.target.style.boxShadow = "none"
                }}
                maxLength={500}
              />
            </div>

            {/* Ausrichtung */}
            <div style={{ marginBottom: "1.5rem" }}>
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
                    onClick={() => {
                      const newMetadata = {
                        ...imageMetadata[editingImageIndex],
                        alignment: option.value as "left" | "center" | "right"
                      }
                      updateImageMetadata(editingImageIndex, newMetadata)
                    }}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      border: `1px solid ${imageMetadata[editingImageIndex]?.alignment === option.value ? "#24c598" : "#E5E5E5"}`,
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                      fontWeight: imageMetadata[editingImageIndex]?.alignment === option.value ? "600" : "400",
                      color: imageMetadata[editingImageIndex]?.alignment === option.value ? "#24c598" : "#0A0A0A",
                      backgroundColor: imageMetadata[editingImageIndex]?.alignment === option.value ? "#F0FDF4" : "#FFFFFF",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Speichern-Button */}
            <button
              type="button"
              onClick={() => setEditingImageIndex(null)}
              style={{
                width: "100%",
                padding: "0.75rem",
                backgroundColor: "#24c598",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.875rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#1ea882"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#24c598"
              }}
            >
              Speichern
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
