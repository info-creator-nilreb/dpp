/**
 * Template Helper Functions
 * 
 * Zentrale Funktionen für Template-Operationen
 */

import { prisma } from "@/lib/prisma"

/**
 * Findet die aktuellste veröffentlichte Template-Version für eine Kategorie
 * 
 * @param categoryKey - Die Kategorie (z.B. "TEXTILE", "FURNITURE")
 * @returns Das Template oder null, wenn kein veröffentlichtes Template existiert
 */
export async function latestPublishedTemplate(categoryKey: string) {
  try {
    // Normalisiere die Kategorie
    const normalizedCategory = normalizeCategory(categoryKey) || categoryKey
    
    // Lade ALLE aktiven Templates und filtere nach normalisierter Kategorie
    // Das ist notwendig, weil wir "FURNITURE" suchen könnten, aber das Template "MÖBEL" hat
    const allActiveTemplates = await prisma.template.findMany({
      where: {
        status: "active"
      },
      include: {
        blocks: {
          orderBy: { order: "asc" },
          include: {
            fields: {
              where: {
                deprecatedInVersion: null
              },
              orderBy: { order: "asc" }
            }
          }
        }
      }
    })
    
    // Filtere Templates, deren Kategorie (normalisiert) zur gesuchten Kategorie passt
    const matchingTemplates = allActiveTemplates.filter(t => {
      if (!t.category) return false
      
      // Normalisiere die Template-Kategorie
      const normalizedTemplateCategory = normalizeCategory(t.category)
      
      // Prüfe ob die normalisierten Kategorien übereinstimmen
      const matches = normalizedTemplateCategory === normalizedCategory || 
                      normalizedTemplateCategory === categoryKey ||
                      t.category === categoryKey ||
                      t.category === normalizedCategory
      
      return matches
    })
    
    // Sortiere nach Version (neueste zuerst) und nimm das erste
    const template = matchingTemplates.sort((a, b) => b.version - a.version)[0] || null

    return template
  } catch (error: any) {
    // Datenbankverbindungsfehler abfangen
    if (error?.message?.includes("Can't reach database server") || error?.code === "P1001") {
      return null
    }
    // Andere Fehler weiterwerfen
    throw error
  }
}

/**
 * Prüft, ob für eine Kategorie mindestens eine veröffentlichte Template-Version existiert
 */
export async function hasPublishedTemplate(categoryKey: string): Promise<boolean> {
  try {
    // Normalisiere die Kategorie
    const normalizedCategory = normalizeCategory(categoryKey) || categoryKey
    
    // Lade ALLE aktiven Templates und filtere nach normalisierter Kategorie
    // Das ist notwendig, weil wir "FURNITURE" suchen könnten, aber das Template "MÖBEL" hat
    const allActiveTemplates = await prisma.template.findMany({
      where: {
        status: "active"
      },
      select: {
        category: true,
        status: true
      }
    })
    
    // Filtere Templates, deren Kategorie (normalisiert) zur gesuchten Kategorie passt
    const matchingTemplates = allActiveTemplates.filter(t => {
      if (!t.category) return false
      
      // Normalisiere die Template-Kategorie
      const normalizedTemplateCategory = normalizeCategory(t.category)
      
      // Prüfe ob die normalisierten Kategorien übereinstimmen
      const matches = normalizedTemplateCategory === normalizedCategory || 
                      normalizedTemplateCategory === categoryKey ||
                      t.category === categoryKey ||
                      t.category === normalizedCategory
      
      return matches
    })
    
    return matchingTemplates.length > 0
  } catch (error: any) {
    // Datenbankverbindungsfehler abfangen
    if (error?.message?.includes("Can't reach database server") || error?.code === "P1001") {
      return false
    }
    // Andere Fehler weiterwerfen
    throw error
  }
}

/**
 * Mappt deutsche Kategorienamen zu englischen Standard-Kategorien
 * Exportiert für Verwendung in anderen Modulen
 */
export function normalizeCategory(category: string | null): string | null {
  if (!category) return null
  
  const categoryUpper = category.toUpperCase()
  
  // Mapping von deutschen zu englischen Kategorien
  const categoryMap: Record<string, string> = {
    "MÖBEL": "FURNITURE",
    "MOEBEL": "FURNITURE",
    "FURNITURE": "FURNITURE",
    "TEXTIL": "TEXTILE",
    "TEXTILIEN": "TEXTILE",
    "TEXTILE": "TEXTILE",
    "SONSTIGE": "OTHER",
    "OTHER": "OTHER"
  }
  
  return categoryMap[categoryUpper] || category
}

/**
 * Gibt alle Kategorien zurück, für die mindestens eine veröffentlichte Template-Version existiert
 * Inklusive ihrer Labels für die UI
 */
export async function getCategoriesWithPublishedTemplates(): Promise<Array<{ categoryKey: string; label: string }>> {
  try {
    // Prüfe alle Templates
    const allTemplates = await prisma.template.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        status: true,
        version: true,
        categoryLabel: true
      }
    })
    
    // Suche nach Templates mit Status "active" (case-insensitive)
    const activeTemplates = allTemplates.filter(t => {
      const statusLower = t.status?.toLowerCase()
      return statusLower === "active"
    })
    
    // Normalisiere Kategorien und gruppiere
    // WICHTIG: Wir speichern die ursprüngliche Kategorie aus der DB, nicht die normalisierte
    const categoriesMap = new Map<string, { category: string; originalCategory: string; categoryLabel: string | null }>()
    
    for (const t of activeTemplates) {
      if (t.category) {
        const normalizedCategory = normalizeCategory(t.category)
        if (normalizedCategory && !categoriesMap.has(normalizedCategory)) {
          categoriesMap.set(normalizedCategory, {
            category: normalizedCategory,
            originalCategory: t.category, // Ursprüngliche Kategorie aus DB behalten
            categoryLabel: t.categoryLabel
          })
        }
      }
    }
    
    const result = Array.from(categoriesMap.values()).map(t => ({
      categoryKey: t.category, // Normalisierte Kategorie als Key (für Matching)
      label: t.categoryLabel || t.originalCategory // Verwende categoryLabel oder ursprüngliche Kategorie aus DB
    }))
    
    return result
  } catch (error: any) {
    // Datenbankverbindungsfehler abfangen
    if (error?.message?.includes("Can't reach database server") || error?.code === "P1001") {
      return []
    }
    // Andere Fehler weiterwerfen
    throw error
  }
}

/**
 * Kategorie-Labels für Anzeige
 */
export const CATEGORY_LABELS: Record<string, string> = {
  TEXTILE: "Textile Erzeugnisse",
  FURNITURE: "Möbel",
  ELECTRONICS: "Elektronik",
  OTHER: "Andere"
}

/**
 * Gibt das Label für eine Kategorie zurück
 * 
 * Priorität:
 * 1. customLabel (aus Datenbank) - wenn vorhanden, wird es immer verwendet
 * 2. categoryKey (wenn kein customLabel vorhanden)
 * 
 * KEIN hardcoded Fallback mehr - Labels müssen in der DB gesetzt werden
 */
export function getCategoryLabel(categoryKey: string, customLabel?: string | null): string {
  // Wenn ein customLabel vorhanden ist, verwende es
  if (customLabel && customLabel.trim()) {
    return customLabel
  }
  // Sonst verwende die Kategorie selbst (kein hardcoded Fallback)
  return categoryKey
}

/**
 * Lädt Kategorien mit ihren Labels aus der Datenbank
 * Gibt eine Map zurück: categoryKey -> { label, categoryKey }
 */
export async function getCategoriesWithLabels(): Promise<Map<string, { label: string; categoryKey: string }>> {
  try {
    const templates = await prisma.template.findMany({
      where: {
        status: "active"
      },
      select: {
        category: true,
        categoryLabel: true
      },
      distinct: ["category"]
    })

    const result = new Map<string, { label: string; categoryKey: string }>()
    
    for (const template of templates) {
      if (template.category) {
        // Verwende die ursprüngliche Kategorie aus der DB als Label, wenn kein categoryLabel vorhanden ist
        const label = template.categoryLabel || template.category
        const normalizedCategory = normalizeCategory(template.category)
        
        // Verwende normalisierte Kategorie als Key für Matching, aber ursprüngliche Kategorie als Label
        if (normalizedCategory && !result.has(normalizedCategory)) {
          result.set(normalizedCategory, {
            categoryKey: normalizedCategory,
            label: label
          })
        }
      }
    }

    return result
  } catch (error: any) {
    // Datenbankverbindungsfehler abfangen
    if (error?.message?.includes("Can't reach database server") || error?.code === "P1001") {
      return new Map()
    }
    // Andere Fehler weiterwerfen
    throw error
  }
}

/**
 * Gibt alle veröffentlichten Templates zurück
 * Single source of truth für Template-Abfragen
 * 
 * @returns Array von Templates mit id, name, category, version, categoryLabel
 */
export async function getAllPublishedTemplates(): Promise<Array<{
  id: string
  name: string
  category: string
  version: number
  categoryLabel: string | null
  label: string // Kombiniertes Label für UI
}>> {
  try {
    // Prüfe alle Templates mit Status
    const allTemplatesDebug = await prisma.template.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        status: true,
        version: true,
        categoryLabel: true
      }
    })
    
    // Suche mit verschiedenen Status-Werten
    let templates = await prisma.template.findMany({
      where: {
        status: {
          in: ["active", "Active", "ACTIVE"]
        }
      },
      select: {
        id: true,
        name: true,
        category: true,
        version: true,
        categoryLabel: true
      },
      orderBy: [
        { category: "asc" },
        { version: "desc" }
      ]
    })
    
    // Filtere Templates ohne Kategorie heraus (nach dem Laden, da Prisma TypeScript-Probleme mit null-Checks hat)
    templates = templates.filter(t => t.category !== null)

    // Fallback: Wenn nichts gefunden, filtere manuell
    if (templates.length === 0) {
      const activeTemplates = allTemplatesDebug.filter(t => 
        t.status && t.status.toLowerCase() === "active" && t.category
      )
      templates = activeTemplates.map(t => ({
        id: t.id,
        name: t.name,
        category: t.category!,
        version: t.version,
        categoryLabel: t.categoryLabel
      }))
    }

    return templates.map(t => ({
      id: t.id,
      name: t.name,
      category: t.category,
      version: t.version,
      categoryLabel: t.categoryLabel,
      label: `${getCategoryLabel(t.category, t.categoryLabel)} - ${t.name} (v${t.version})`
    }))
  } catch (error: any) {
    // Datenbankverbindungsfehler abfangen
    if (error?.message?.includes("Can't reach database server") || error?.code === "P1001") {
      return []
    }
    // Andere Fehler weiterwerfen
    throw error
  }
}

/**
 * Gibt alle veröffentlichten Templates gruppiert nach Kategorie zurück
 * 
 * @returns Map von categoryKey -> Array von Templates
 */
export async function getPublishedTemplatesByCategory(): Promise<Map<string, Array<{
  id: string
  name: string
  category: string
  version: number
  categoryLabel: string | null
  label: string
}>>> {
  const templates = await getAllPublishedTemplates()
  const result = new Map<string, typeof templates>()
  
  for (const template of templates) {
    if (!result.has(template.category)) {
      result.set(template.category, [])
    }
    result.get(template.category)!.push(template)
  }

  return result
}

