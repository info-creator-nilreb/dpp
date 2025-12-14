"use client"

import { useState, useRef } from "react"

interface DppMedia {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  storageUrl: string
  uploadedAt: Date
}

interface DppMediaSectionProps {
  dppId: string
  media: DppMedia[]
  onMediaChange: () => void
}

/**
 * Medien & Dokumente Sektion
 * 
 * Ermöglicht:
 * - Upload von Bildern und PDFs
 * - Anzeige vorhandener Medien
 * - Löschen von Medien
 */
export default function DppMediaSection({ dppId, media, onMediaChange }: DppMediaSectionProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError("")
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`/api/app/dpp/${dppId}/media`, {
        method: "POST",
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Fehler beim Hochladen")
      } else {
        // Erfolgreich hochgeladen
        onMediaChange()
        // Input zurücksetzen
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }
    } catch (err) {
      setError("Ein Fehler ist aufgetreten")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (mediaId: string) => {
    if (!confirm("Möchten Sie dieses Medium wirklich löschen?")) {
      return
    }

    try {
      const response = await fetch(`/api/app/dpp/${dppId}/media/${mediaId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        onMediaChange()
      } else {
        const data = await response.json()
        alert(data.error || "Fehler beim Löschen")
      }
    } catch (err) {
      alert("Ein Fehler ist aufgetreten")
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const isImage = (fileType: string): boolean => {
    return fileType.startsWith("image/")
  }

  return (
    <div style={{
      backgroundColor: "#FFFFFF",
      padding: "clamp(1.5rem, 4vw, 2rem)",
      borderRadius: "12px",
      border: "1px solid #CDCDCD"
    }}>
      <h2 style={{
        fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
        fontWeight: "700",
        color: "#0A0A0A",
        marginBottom: "1rem"
      }}>
        Medien & Dokumente
      </h2>

      {/* Upload-Feld */}
      <div style={{ marginBottom: "2rem" }}>
        <label htmlFor="media-upload" style={{
          display: "block",
          fontSize: "clamp(0.9rem, 2vw, 1rem)",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          Datei hochladen
        </label>
        <div style={{
          border: "2px dashed #CDCDCD",
          borderRadius: "8px",
          padding: "clamp(1.5rem, 4vw, 2rem)",
          textAlign: "center",
          backgroundColor: "#F5F5F5",
          cursor: uploading ? "not-allowed" : "pointer",
          transition: "border-color 0.2s"
        }}
        onClick={() => !uploading && fileInputRef.current?.click()}
        onMouseEnter={(e) => {
          if (!uploading) {
            e.currentTarget.style.borderColor = "#E20074"
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#CDCDCD"
        }}
        >
          <input
            ref={fileInputRef}
            id="media-upload"
            type="file"
            accept="image/*,application/pdf,.doc,.docx"
            onChange={handleFileSelect}
            disabled={uploading}
            style={{ display: "none" }}
          />
          {uploading ? (
            <div style={{ color: "#7A7A7A" }}>Wird hochgeladen...</div>
          ) : (
            <>
              <div style={{
                fontSize: "clamp(0.9rem, 2vw, 1rem)",
                color: "#7A7A7A",
                marginBottom: "0.5rem"
              }}>
                Klicken Sie hier oder ziehen Sie eine Datei hierher
              </div>
              <div style={{
                fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
                color: "#7A7A7A"
              }}>
                Erlaubt: Bilder (JPEG, PNG, GIF, WebP) und PDFs (max. 10 MB)
              </div>
            </>
          )}
        </div>
        {error && (
          <p style={{
            color: "#E20074",
            fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
            marginTop: "0.5rem"
          }}>
            {error}
          </p>
        )}
      </div>

      {/* Medien-Liste */}
      {media.length > 0 ? (
        <div>
          <h3 style={{
            fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
            fontWeight: "600",
            color: "#0A0A0A",
            marginBottom: "1rem"
          }}>
            Hochgeladene Medien ({media.length})
          </h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "1rem"
          }}>
            {media.map((item) => (
              <div
                key={item.id}
                style={{
                  border: "1px solid #CDCDCD",
                  borderRadius: "8px",
                  overflow: "hidden",
                  backgroundColor: "#FFFFFF"
                }}
              >
                {isImage(item.fileType) ? (
                  <div style={{
                    width: "100%",
                    aspectRatio: "16/9",
                    backgroundColor: "#F5F5F5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden"
                  }}>
                    <img
                      src={item.storageUrl}
                      alt={item.fileName}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover"
                      }}
                    />
                  </div>
                ) : (
                  <div style={{
                    width: "100%",
                    aspectRatio: "16/9",
                    backgroundColor: "#F5F5F5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    gap: "0.5rem"
                  }}>
                    <div style={{
                      fontSize: "2rem",
                      color: "#7A7A7A"
                    }}>
                      📄
                    </div>
                    <div style={{
                      fontSize: "clamp(0.75rem, 2vw, 0.85rem)",
                      color: "#7A7A7A",
                      textAlign: "center",
                      padding: "0 0.5rem"
                    }}>
                      PDF
                    </div>
                  </div>
                )}
                <div style={{ padding: "0.75rem" }}>
                  <div style={{
                    fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
                    fontWeight: "500",
                    color: "#0A0A0A",
                    marginBottom: "0.25rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>
                    {item.fileName}
                  </div>
                  <div style={{
                    fontSize: "clamp(0.75rem, 2vw, 0.85rem)",
                    color: "#7A7A7A",
                    marginBottom: "0.5rem"
                  }}>
                    {formatFileSize(item.fileSize)}
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      backgroundColor: "transparent",
                      border: "1px solid #CDCDCD",
                      borderRadius: "6px",
                      color: "#E20074",
                      fontSize: "clamp(0.8rem, 2vw, 0.9rem)",
                      cursor: "pointer",
                      fontWeight: "500"
                    }}
                  >
                    Entfernen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{
          textAlign: "center",
          padding: "2rem",
          color: "#7A7A7A",
          fontSize: "clamp(0.9rem, 2vw, 1rem)"
        }}>
          Noch keine Medien hochgeladen
        </div>
      )}
    </div>
  )
}

