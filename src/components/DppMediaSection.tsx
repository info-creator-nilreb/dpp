"use client"

import { useState, useRef } from "react"
import FileUploadArea from "@/components/FileUploadArea"
import { useNotification } from "@/components/NotificationProvider"

interface DppMedia {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  storageUrl: string
  uploadedAt: Date
}

interface PendingFile {
  id: string // temporäre ID
  file: File
  preview?: string // Für Bilder: Data URL
}

interface DppMediaSectionProps {
  dppId: string | null // Kann null sein für neue DPPs
  media: DppMedia[]
  onMediaChange: () => void
  pendingFiles?: PendingFile[]
  onPendingFilesChange?: (files: PendingFile[]) => void
}

/**
 * Medien & Dokumente Sektion
 * 
 * Ermöglicht:
 * - Upload von Bildern und PDFs
 * - Anzeige vorhandener Medien
 * - Löschen von Medien
 * - Zwischenspeicherung von Dateien für neue DPPs (ohne ID)
 */
export default function DppMediaSection({ 
  dppId, 
  media, 
  onMediaChange,
  pendingFiles = [],
  onPendingFilesChange 
}: DppMediaSectionProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const { showNotification } = useNotification()

  const handleFileSelect = async (file: File) => {
    setError("")

    // Wenn keine DPP-ID vorhanden, Datei zwischenspeichern
    if (!dppId || dppId === "new") {
      if (onPendingFilesChange) {
        const reader = new FileReader()
        
        if (file.type.startsWith("image/")) {
          reader.onload = (e) => {
            const preview = e.target?.result as string
            const pendingFile: PendingFile = {
              id: `pending-${Date.now()}-${Math.random()}`,
              file,
              preview
            }
            onPendingFilesChange([...pendingFiles, pendingFile])
          }
          reader.readAsDataURL(file)
        } else {
          const pendingFile: PendingFile = {
            id: `pending-${Date.now()}-${Math.random()}`,
            file
          }
          onPendingFilesChange([...pendingFiles, pendingFile])
        }
      }
      
      return
    }

    // Wenn DPP-ID vorhanden, sofort hochladen
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
      }
    } catch (err) {
      setError("Ein Fehler ist aufgetreten")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (mediaId: string) => {
    // Prüfe, ob es eine pending file ist
    if (mediaId.startsWith("pending-")) {
      if (onPendingFilesChange) {
        onPendingFilesChange(pendingFiles.filter(f => f.id !== mediaId))
        showNotification("Datei entfernt", "success")
      }
      return
    }

    // Löschen von hochgeladenem Medium
    if (!dppId || dppId === "new") {
      return
    }

    try {
      const response = await fetch(`/api/app/dpp/${dppId}/media/${mediaId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        onMediaChange()
        showNotification("Datei erfolgreich entfernt", "success")
      } else {
        const data = await response.json()
        showNotification(data.error || "Fehler beim Löschen", "error")
      }
    } catch (err) {
      showNotification("Ein Fehler ist aufgetreten", "error")
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
        <FileUploadArea
          accept="image/*,application/pdf,.doc,.docx"
          maxSize={10 * 1024 * 1024} // 10 MB
          onFileSelect={handleFileSelect}
          disabled={uploading}
          label="Datei hochladen"
          description="Bilder, PDFs oder Dokumente. Maximale Dateigröße: 10 MB"
        />
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
      {(media.length > 0 || pendingFiles.length > 0) ? (
        <div>
          <h3 style={{
            fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
            fontWeight: "600",
            color: "#0A0A0A",
            marginBottom: "1rem"
          }}>
            Medien ({media.length + pendingFiles.length})
            {pendingFiles.length > 0 && (
              <span style={{
                fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
                fontWeight: "400",
                color: "#7A7A7A",
                marginLeft: "0.5rem"
              }}>
                ({pendingFiles.length} zum Upload)
              </span>
            )}
          </h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "1rem"
          }}>
            {/* Pending Files */}
            {pendingFiles.map((pendingFile) => (
              <div
                key={pendingFile.id}
                style={{
                  border: "1px solid #CDCDCD",
                  borderRadius: "8px",
                  overflow: "hidden",
                  backgroundColor: "#FFFFFF",
                  opacity: 0.8
                }}
              >
                {isImage(pendingFile.file.type) && pendingFile.preview ? (
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
                      src={pendingFile.preview}
                      alt={pendingFile.file.name}
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="40"
                      height="40"
                      fill="none"
                      stroke="#7A7A7A"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      viewBox="0 0 24 24"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
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
                    {pendingFile.file.name}
                  </div>
                  <div style={{
                    fontSize: "clamp(0.75rem, 2vw, 0.85rem)",
                    color: "#7A7A7A",
                    marginBottom: "0.5rem"
                  }}>
                    {formatFileSize(pendingFile.file.size)}
                  </div>
                  <button
                    onClick={() => handleDelete(pendingFile.id)}
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
            
            {/* Hochgeladene Medien */}
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="40"
                      height="40"
                      fill="none"
                      stroke="#7A7A7A"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      viewBox="0 0 24 24"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
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

