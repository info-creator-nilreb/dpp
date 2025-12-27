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
          border: `2px dashed ${isDragging ? "#E20074" : "#CDCDCD"}`,
          borderRadius: "8px",
          padding: "2rem",
          textAlign: "center",
          backgroundColor: isDragging ? "#FEF3F8" : "#F5F5F5",
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
          stroke={isDragging ? "#E20074" : "#7A7A7A"}
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
            color: isDragging ? "#E20074" : "#0A0A0A",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            fontWeight: "600",
            marginBottom: "0.5rem",
            margin: 0,
          }}
        >
          {isDragging ? "Datei hier ablegen" : "Klicken zum Auswählen oder Datei hier ablegen"}
        </p>
        {accept && (
          <p
            style={{
              color: "#7A7A7A",
              fontSize: "clamp(0.85rem, 1.8vw, 0.95rem)",
              marginTop: "0.5rem",
              margin: 0,
            }}
          >
            Erlaubte Formate: {Array.from(new Set(
              accept
                .split(",")
                .map(f => {
                  const trimmed = f.trim()
                  // Extract file extension: remove leading dots and MIME types
                  if (trimmed.startsWith(".")) {
                    return trimmed.substring(1)
                  }
                  if (trimmed.includes("/")) {
                    // MIME type: extract extension from common types
                    if (trimmed === "application/pdf") return "pdf"
                    if (trimmed.startsWith("image/")) {
                      const ext = trimmed.split("/")[1]
                      return ext === "jpeg" ? "jpg" : ext
                    }
                    if (trimmed.includes("wordprocessingml")) return "docx"
                    if (trimmed === "application/msword") return "doc"
                    return null
                  }
                  return trimmed
                })
                .filter((f): f is string => f !== null && f.length > 0)
            )).join(", ")}
          </p>
        )}
      </div>
    </div>
  )
}

