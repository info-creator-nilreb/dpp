import { writeFile, mkdir, unlink } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

/**
 * Storage-Helper für Datei-Uploads
 * 
 * MVP: Lokales File-System
 * Später: Einfach auf Supabase Storage oder Vercel Blob umstellbar
 */

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "dpp-media")

/**
 * Erstellt Upload-Verzeichnis falls nicht vorhanden
 */
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

/**
 * Speichert eine Datei im Storage
 * 
 * @param file - File Buffer oder Blob
 * @param fileName - Dateiname (wird sanitized)
 * @returns Storage-URL (relativ zu /uploads)
 */
export async function saveFile(file: Buffer, fileName: string): Promise<string> {
  await ensureUploadDir()
  
  // Dateiname sanitizen (nur alphanumerisch, Bindestrich, Unterstrich, Punkt)
  const sanitizedFileName = fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
  
  // Eindeutigen Dateinamen erstellen (Timestamp + Originalname)
  const timestamp = Date.now()
  const uniqueFileName = `${timestamp}_${sanitizedFileName}`
  const filePath = join(UPLOAD_DIR, uniqueFileName)
  
  // Datei speichern
  await writeFile(filePath, file)
  
  // Relative URL zurückgeben (für Browser-Zugriff)
  return `/uploads/dpp-media/${uniqueFileName}`
}

/**
 * Löscht eine Datei aus dem Storage
 * 
 * @param storageUrl - Storage-URL (z.B. "/uploads/dpp-media/123_file.jpg")
 */
export async function deleteFile(storageUrl: string): Promise<void> {
  // Entferne führenden Slash und konvertiere zu absolutem Pfad
  const relativePath = storageUrl.startsWith("/") ? storageUrl.slice(1) : storageUrl
  const filePath = join(process.cwd(), "public", relativePath)
  
  if (existsSync(filePath)) {
    await unlink(filePath)
  }
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
  ]
  
  return allowedTypes.includes(mimeType.toLowerCase())
}

/**
 * Maximale Dateigröße: 10 MB
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

