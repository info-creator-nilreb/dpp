import { writeFile, mkdir, unlink } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { put, del } from "@vercel/blob"

/**
 * Storage-Helper für Datei-Uploads
 * 
 * Verwendet Vercel Blob Storage in Production (Vercel)
 * Fallback auf lokales File-System in Development
 */

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "dpp-media")

// Prüfe ob wir in Vercel-Umgebung sind
const isVercel = process.env.VERCEL === "1" || !!process.env.BLOB_READ_WRITE_TOKEN

/**
 * Erstellt Upload-Verzeichnis falls nicht vorhanden (nur für lokales Storage)
 */
async function ensureUploadDir() {
  if (!isVercel && !existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

/**
 * Speichert eine Datei im Storage
 * 
 * @param file - File Buffer oder Blob
 * @param fileName - Dateiname (wird sanitized)
 * @returns Storage-URL (Vercel Blob URL oder relative URL für lokal)
 */
export async function saveFile(file: Buffer, fileName: string): Promise<string> {
  // Dateiname sanitizen (nur alphanumerisch, Bindestrich, Unterstrich, Punkt)
  const sanitizedFileName = fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
  
  // Eindeutigen Dateinamen erstellen (Timestamp + Originalname)
  const timestamp = Date.now()
  const uniqueFileName = `${timestamp}_${sanitizedFileName}`
  
  if (isVercel) {
    // Vercel Blob Storage verwenden
    try {
      const blob = await put(`dpp-media/${uniqueFileName}`, file, {
        access: "public",
        contentType: getContentType(fileName)
      })
      return blob.url
    } catch (error) {
      console.error("Vercel Blob upload error:", error)
      throw new Error("Fehler beim Hochladen der Datei")
    }
  } else {
    // Lokales File-System (Development)
    await ensureUploadDir()
    const filePath = join(UPLOAD_DIR, uniqueFileName)
    await writeFile(filePath, file)
    return `/uploads/dpp-media/${uniqueFileName}`
  }
}

/**
 * Löscht eine Datei aus dem Storage
 * 
 * @param storageUrl - Storage-URL (Vercel Blob URL oder relative URL für lokal)
 */
export async function deleteFile(storageUrl: string): Promise<void> {
  if (isVercel) {
    // Vercel Blob Storage
    try {
      // Extrahiere Blob-URL aus der storageUrl
      if (storageUrl.startsWith("http")) {
        await del(storageUrl)
      } else {
        console.warn("Invalid blob URL for deletion:", storageUrl)
      }
    } catch (error) {
      console.error("Vercel Blob delete error:", error)
      // Fehler wird ignoriert, da Datei möglicherweise bereits gelöscht wurde
    }
  } else {
    // Lokales File-System (Development)
    const relativePath = storageUrl.startsWith("/") ? storageUrl.slice(1) : storageUrl
    const filePath = join(process.cwd(), "public", relativePath)
    
    if (existsSync(filePath)) {
      await unlink(filePath)
    }
  }
}

/**
 * Ermittelt Content-Type basierend auf Dateiname
 */
function getContentType(fileName: string): string {
  const ext = fileName.toLowerCase().split(".").pop()
  const contentTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    mp4: "video/mp4",
    webm: "video/webm",
    ogg: "video/ogg",
    mov: "video/quicktime"
  }
  return contentTypes[ext || ""] || "application/octet-stream"
}

/**
 * Prüft ob Dateityp erlaubt ist
 * 
 * @param mimeType - MIME-Type der Datei
 * @returns true wenn erlaubt
 */
export function isAllowedFileType(mimeType: string): boolean {
  const allowedTypes = [
    // Bilder
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    // Dokumente
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    // Videos
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime", // .mov
  ]
  
  return allowedTypes.includes(mimeType.toLowerCase())
}

/**
 * Maximale Dateigröße: 10 MB (Standard)
 * Videos: 100 MB
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024 // 100 MB

/**
 * Ermittelt die maximale Dateigröße basierend auf Dateityp
 */
export function getMaxFileSize(mimeType: string): number {
  if (mimeType.startsWith("video/")) {
    return MAX_VIDEO_SIZE
  }
  return MAX_FILE_SIZE
}

