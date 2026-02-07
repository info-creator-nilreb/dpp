/**
 * Hero & Gallery Logic
 * 
 * Helper-Funktionen für die automatische Hero- und Galerie-Logik
 * basierend auf Block-Kontext und Medienrollen
 */

export interface MediaItem {
  id: string
  storageUrl: string
  fileType: string
  role?: string | null
  blockId?: string | null
  fieldKey?: string | null
  fileName: string
}

/**
 * Prüft, ob ein Medium aus dem "Basis- & Produktdaten"-Block stammt
 */
export function isFromProductDataBlock(media: MediaItem, blockName?: string): boolean {
  // Prüfe Block-Name (für Template-Blöcke)
  if (blockName === "Basis- & Produktdaten" || 
      blockName?.includes("Basis") || 
      blockName?.includes("Produktdaten")) {
    return true
  }
  
  // Fallback: Prüfe Rolle (für bereits hochgeladene Medien)
  return media.role === "primary_product_image" || media.role === "gallery_image"
}

/**
 * Gibt das Hero-Bild zurück (erstes Bild in der Reihenfolge = sortOrder vom Server).
 * Nur aus "Basis- & Produktdaten"-Block. Die Medienliste wird vom Server bereits nach sortOrder sortiert geliefert.
 */
export function getHeroImage(
  media: MediaItem[], 
  blockName?: string
): MediaItem | null {
  const productDataMedia = media.filter(m => 
    isFromProductDataBlock(m, blockName) &&
    m.fileType?.startsWith("image/")
  )
  return productDataMedia[0] ?? null
}

/**
 * Gibt alle Galerie-Bilder zurück (alle Produktbilder in Reihenfolge; erstes = Hero, Rest = Galerie).
 * Nur aus "Basis- & Produktdaten"-Block. Liste ist bereits nach sortOrder sortiert.
 */
export function getGalleryImages(
  media: MediaItem[], 
  blockName?: string
): MediaItem[] {
  const productDataMedia = media.filter(m => 
    isFromProductDataBlock(m, blockName) &&
    m.fileType?.startsWith("image/")
  )
  return productDataMedia
}

/**
 * Gibt alle Medien eines bestimmten Blocks zurück
 */
export function getMediaByBlock(
  media: MediaItem[], 
  blockId: string
): MediaItem[] {
  return media.filter(m => m.blockId === blockId)
}

/**
 * Gibt alle Dokumente (PDFs) zurück
 */
export function getDocuments(media: MediaItem[]): MediaItem[] {
  return media.filter(m => 
    m.fileType === "application/pdf" || 
    m.role === "document" ||
    m.storageUrl?.endsWith(".pdf")
  )
}

/**
 * Gibt alle Medien eines bestimmten Abschnitts zurück
 * (basierend auf Block-Name oder Block-ID)
 */
export function getMediaBySection(
  media: MediaItem[],
  sectionName?: string,
  blockId?: string
): MediaItem[] {
  if (blockId) {
    return getMediaByBlock(media, blockId)
  }
  
  // Fallback: Filtere nach Block-Name (wenn verfügbar)
  // Dies erfordert zusätzliche Block-Metadaten
  return media
}

