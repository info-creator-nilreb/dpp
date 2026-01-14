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
 * Gibt das Hero-Bild zurück (erstes Bild mit Rolle "primary_product_image")
 * Nur aus "Basis- & Produktdaten"-Block
 */
export function getHeroImage(
  media: MediaItem[], 
  blockName?: string
): MediaItem | null {
  // Filtere nur Medien aus "Basis- & Produktdaten"-Block
  const productDataMedia = media.filter(m => 
    isFromProductDataBlock(m, blockName) &&
    m.fileType?.startsWith("image/")
  )
  
  // Erstes Bild mit Rolle "primary_product_image"
  const heroImage = productDataMedia.find(m => 
    m.role === "primary_product_image"
  )
  
  return heroImage || null
}

/**
 * Gibt alle Galerie-Bilder zurück (Bilder mit Rolle "gallery_image")
 * Nur aus "Basis- & Produktdaten"-Block
 */
export function getGalleryImages(
  media: MediaItem[], 
  blockName?: string
): MediaItem[] {
  // Filtere nur Medien aus "Basis- & Produktdaten"-Block
  const productDataMedia = media.filter(m => 
    isFromProductDataBlock(m, blockName) &&
    m.fileType?.startsWith("image/")
  )
  
  // Alle Bilder mit Rolle "gallery_image"
  return productDataMedia.filter(m => 
    m.role === "gallery_image"
  )
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



