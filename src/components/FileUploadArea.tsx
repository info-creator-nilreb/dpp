"use client"

import { useState, useRef, useCallback } from "react"

interface FileUploadAreaProps {
  accept?: string
  maxSize?: number // in bytes
  onFileSelect: (file: File) => void
  disabled?: boolean
  label?: string
  description?: string
}

/**
 * Wiederverwendbare File Upload Komponente mit Drag & Drop
 */
export default function FileUploadArea({
  accept,
  maxSize,
  onFileSelect,
  disabled = false,
  label,
  description,
}: FileUploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `Datei zu groß. Maximum: ${(maxSize / 1024 / 1024).toFixed(1)} MB`
    }
    return null
  }

  const handleFile = useCallback(
    (file: File) => {
      const error = validateFile(file)
      if (error) {
        alert(error)
        return
      }
      onFileSelect(file)
    },
    [onFileSelect, maxSize]
  )

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }

  return (
    <div>
      {label && (
        <label
          style={{
            display: "block",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            fontWeight: "600",
            color: "#0A0A0A",
            marginBottom: "0.5rem",
          }}
        >
          {label}
        </label>
      )}

      {description && (
        <p
          style={{
            color: "#7A7A7A",
            fontSize: "clamp(0.85rem, 1.8vw, 0.95rem)",
            marginBottom: "0.75rem",
          }}
        >
          {description}
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        disabled={disabled}
        style={{ display: "none" }}
      />

      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragging ? "#24c598" : "#CDCDCD"}`,
          borderRadius: "8px",
          padding: "2rem",
          textAlign: "center",
          backgroundColor: isDragging ? "#ECFDF5" : "#F5F5F5",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "all 0.2s ease",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          fill="none"
          stroke={isDragging ? "#24c598" : "#7A7A7A"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
          style={{
            margin: "0 auto 1rem",
            display: "block",
          }}
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p
          style={{
            color: isDragging ? "#24c598" : "#0A0A0A",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            fontWeight: "600",
            marginBottom: "0.5rem",
            margin: 0,
          }}
        >
          {isDragging ? "Datei hier ablegen" : "Klicken zum Auswählen oder Datei hier ablegen"}
        </p>
        {accept && (() => {
          // Liste der erlaubten Formate basierend auf accept-String
          const formatList: string[] = []
          const acceptParts = accept.split(",").map(p => p.trim())
          
          for (const part of acceptParts) {
            // Handle image/* wildcard - expandiere zu spezifischen Bildformaten
            if (part === "image/*") {
              formatList.push("jpg", "jpeg", "png", "gif", "webp")
              continue
            }
            
            // Handle spezifische MIME types
            if (part === "application/pdf") {
              formatList.push("pdf")
            } else if (part === "application/msword") {
              formatList.push("doc")
            } else if (part.includes("wordprocessingml") || part === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
              formatList.push("docx")
            } else if (part.startsWith("image/")) {
              // Spezifische Bildformate
              const ext = part.split("/")[1]
              if (ext === "jpeg") {
                formatList.push("jpg")
              } else {
                formatList.push(ext)
              }
            } else if (part.startsWith("video/")) {
              // Spezifische Videoformate
              const ext = part.split("/")[1]
              if (ext === "quicktime") {
                formatList.push("mov")
              } else {
                formatList.push(ext)
              }
            } else if (part.startsWith(".")) {
              // Dateiendung ohne Punkt
              formatList.push(part.substring(1))
            } else if (!part.includes("/") && !part.includes("*")) {
              // Direkte Dateiendung
              formatList.push(part)
            }
            // Ignoriere andere Wildcards oder unbekannte Formate
          }
          
          // Entferne Duplikate und sortiere
          const uniqueFormats = Array.from(new Set(formatList))
            .filter(f => f.length > 0)
            .sort()
          
          if (uniqueFormats.length === 0) return null
          
          return (
            <p
              style={{
                color: "#7A7A7A",
                fontSize: "clamp(0.85rem, 1.8vw, 0.95rem)",
                marginTop: "0.5rem",
                margin: 0,
              }}
            >
              Erlaubte Formate: {uniqueFormats.join(", ")}
            </p>
          )
        })()}
      </div>
    </div>
  )
}

