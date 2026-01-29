"use client"

import { useState, useRef, useEffect } from "react"
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
  videoThumbnail?: string // Für Videos: Thumbnail Data URL
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
  // Ensure media is always an array
  const safeMedia = Array.isArray(media) ? media : []
  const safePendingFiles = Array.isArray(pendingFiles) ? pendingFiles : []
  
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
        } else if (file.type.startsWith("video/")) {
          // Für Videos: Erstelle Thumbnail aus erstem Frame
          const video = document.createElement("video")
          video.preload = "metadata"
          video.src = URL.createObjectURL(file)
          
          video.onloadedmetadata = () => {
            video.currentTime = 0.1 // Erste Sekunde für Thumbnail
          }
          
          video.onseeked = () => {
            const canvas = document.createElement("canvas")
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            const ctx = canvas.getContext("2d")
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
              const thumbnail = canvas.toDataURL("image/jpeg", 0.8)
              const pendingFile: PendingFile = {
                id: `pending-${Date.now()}-${Math.random()}`,
                file,
                videoThumbnail: thumbnail
              }
              onPendingFilesChange([...pendingFiles, pendingFile])
              URL.revokeObjectURL(video.src)
            }
          }
          
          video.onerror = () => {
            // Fallback: Kein Thumbnail, nur Datei speichern
            const pendingFile: PendingFile = {
              id: `pending-${Date.now()}-${Math.random()}`,
              file
            }
            onPendingFilesChange([...pendingFiles, pendingFile])
            URL.revokeObjectURL(video.src)
          }
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
        showNotification(data.error || "Fehler beim Hochladen", "error")
      } else {
        // Erfolgreich hochgeladen - sofort Medienliste aktualisieren
        showNotification("Datei erfolgreich hochgeladen", "success")
        // Warte kurz, damit die Datenbank aktualisiert ist
        setTimeout(() => {
          onMediaChange()
        }, 100)
      }
    } catch (err) {
      setError("Ein Fehler ist aufgetreten")
      showNotification("Ein Fehler ist aufgetreten", "error")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (mediaId: string) => {
    // Prüfe, ob es eine pending file ist
    if (mediaId.startsWith("pending-")) {
      if (onPendingFilesChange) {
        onPendingFilesChange(safePendingFiles.filter(f => f.id !== mediaId))
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

  const isVideo = (fileType: string): boolean => {
    return fileType.startsWith("video/")
  }

  const isPdf = (fileType: string): boolean => {
    return fileType === "application/pdf"
  }

  const isDocument = (fileType: string): boolean => {
    return fileType === "application/msword" || 
           fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  }

  const getFileTypeLabel = (fileType: string): string => {
    if (isPdf(fileType)) return "PDF"
    if (isVideo(fileType)) return "Video"
    if (isDocument(fileType)) {
      if (fileType.includes("wordprocessingml")) return "DOCX"
      return "DOC"
    }
    return "Dokument"
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
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,video/mp4,video/webm,video/ogg,video/quicktime"
          maxSize={100 * 1024 * 1024} // 100 MB (für Videos)
          onFileSelect={handleFileSelect}
          disabled={uploading}
          label="Datei hochladen"
          description="Bilder, Videos, PDFs oder Dokumente. Maximale Dateigröße: 10 MB (Bilder/Dokumente), 100 MB (Videos)"
        />
        {error && (
          <p style={{
            color: "#24c598",
            fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
            marginTop: "0.5rem"
          }}>
            {error}
          </p>
        )}
      </div>

      {/* Medien-Liste */}
      {(safeMedia.length > 0 || safePendingFiles.length > 0) ? (
        <div>
          <h3 style={{
            fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
            fontWeight: "600",
            color: "#0A0A0A",
            marginBottom: "1rem"
          }}>
            Medien ({safeMedia.length + safePendingFiles.length})
            {safePendingFiles.length > 0 && (
              <span style={{
                fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
                fontWeight: "400",
                color: "#7A7A7A",
                marginLeft: "0.5rem"
              }}>
                ({safePendingFiles.length} zum Upload)
              </span>
            )}
          </h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "1rem"
          }}>
            {/* Pending Files */}
            {safePendingFiles.map((pendingFile) => (
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
                ) : isVideo(pendingFile.file.type) && pendingFile.videoThumbnail ? (
                  <div style={{
                    width: "100%",
                    aspectRatio: "16/9",
                    backgroundColor: "#F5F5F5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    position: "relative"
                  }}>
                    <img
                      src={pendingFile.videoThumbnail}
                      alt={pendingFile.file.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover"
                      }}
                    />
                    <div style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(0, 0, 0, 0.6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="#FFFFFF"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
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
                    {isPdf(pendingFile.file.type) ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="40"
                        height="40"
                        fill="none"
                        stroke="#DC2626"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                    ) : (
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
                    )}
                    <div style={{
                      fontSize: "clamp(0.75rem, 2vw, 0.85rem)",
                      color: "#7A7A7A",
                      textAlign: "center",
                      padding: "0 0.5rem"
                    }}>
                      {getFileTypeLabel(pendingFile.file.type)}
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
                      color: "#24c598",
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
            {safeMedia.map((item) => (
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
                      onError={(e) => {
                        // Fallback bei Fehler beim Laden des Bildes
                        const target = e.target as HTMLImageElement
                        target.style.display = "none"
                        const parent = target.parentElement
                        if (parent) {
                          parent.innerHTML = `
                            <div style="display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 0.5rem; width: 100%; height: 100%;">
                              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" stroke="#7A7A7A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                              </svg>
                              <div style="font-size: clamp(0.75rem, 2vw, 0.85rem); color: #7A7A7A;">Bild</div>
                            </div>
                          `
                        }
                      }}
                    />
                  </div>
                ) : isVideo(item.fileType) ? (
                  <VideoThumbnail
                    videoUrl={item.storageUrl}
                    fileName={item.fileName}
                  />
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
                    {isPdf(item.fileType) ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="40"
                        height="40"
                        fill="none"
                        stroke="#DC2626"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                    ) : (
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
                    )}
                    <div style={{
                      fontSize: "clamp(0.75rem, 2vw, 0.85rem)",
                      color: "#7A7A7A",
                      textAlign: "center",
                      padding: "0 0.5rem"
                    }}>
                      {getFileTypeLabel(item.fileType)}
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
                      color: "#24c598",
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

/**
 * Video-Thumbnail Komponente
 * Erstellt ein Thumbnail aus dem ersten Frame eines Videos
 */
function VideoThumbnail({ videoUrl, fileName }: { videoUrl: string; fileName: string }) {
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    
    if (!video || !canvas) return

    const generateThumbnail = () => {
      try {
        video.currentTime = 0.1 // Erste Sekunde für Thumbnail
      } catch (err) {
        setLoading(false)
      }
    }

    const onSeeked = () => {
      try {
        const ctx = canvas.getContext("2d")
        if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const thumbnailDataUrl = canvas.toDataURL("image/jpeg", 0.8)
          setThumbnail(thumbnailDataUrl)
        }
        setLoading(false)
      } catch (err) {
        setLoading(false)
      }
    }

    const onError = () => {
      setLoading(false)
    }

    video.addEventListener("loadedmetadata", generateThumbnail)
    video.addEventListener("seeked", onSeeked)
    video.addEventListener("error", onError)

    return () => {
      video.removeEventListener("loadedmetadata", generateThumbnail)
      video.removeEventListener("seeked", onSeeked)
      video.removeEventListener("error", onError)
    }
  }, [videoUrl])

  if (loading || !thumbnail) {
    return (
      <div style={{
        width: "100%",
        aspectRatio: "16/9",
        backgroundColor: "#F5F5F5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "0.5rem",
        position: "relative"
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
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
        <div style={{
          fontSize: "clamp(0.75rem, 2vw, 0.85rem)",
          color: "#7A7A7A",
          textAlign: "center"
        }}>
          Video
        </div>
        <video
          ref={videoRef}
          src={videoUrl}
          style={{ display: "none" }}
          preload="metadata"
        />
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    )
  }

  return (
    <div style={{
      width: "100%",
      aspectRatio: "16/9",
      backgroundColor: "#F5F5F5",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      position: "relative"
    }}>
      <img
        src={thumbnail}
        alt={fileName}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover"
        }}
      />
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "48px",
        height: "48px",
        borderRadius: "50%",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none"
      }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="#FFFFFF"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
      <video
        ref={videoRef}
        src={videoUrl}
        style={{ display: "none" }}
        preload="metadata"
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  )
}

