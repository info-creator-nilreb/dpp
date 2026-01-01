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
  console.log(`[latestPublishedTemplate] Suche Template für Kategorie: "${categoryKey}"`)
  
  // Normalisiere die Kategorie
  const normalizedCategory = normalizeCategory(categoryKey) || categoryKey
  console.log(`[latestPublishedTemplate] Normalisierte Kategorie: "${normalizedCategory}"`)
  
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
  
  console.log(`[latestPublishedTemplate] Gefundene aktive Templates:`, allActiveTemplates.length)
  
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
    
    if (matches) {
      console.log(`[latestPublishedTemplate] Passendes Template gefunden: "${t.name}" (Kategorie: "${t.category}" -> normalisiert: "${normalizedTemplateCategory}")`)
    }
    
    return matches
  })
  
  console.log(`[latestPublishedTemplate] Passende Templates:`, matchingTemplates.length)
  
  // Sortiere nach Version (neueste zuerst) und nimm das erste
  const template = matchingTemplates.sort((a, b) => b.version - a.version)[0] || null

  console.log(`[latestPublishedTemplate] Gefundenes Template für "${categoryKey}":`, template ? { id: template.id, name: template.name, category: template.category, version: template.version, status: template.status } : "null")

  return template
}

/**
 * Prüft, ob für eine Kategorie mindestens eine veröffentlichte Template-Version existiert
 */
export async function hasPublishedTemplate(categoryKey: string): Promise<boolean> {
  console.log(`[hasPublishedTemplate] Prüfe Kategorie: "${categoryKey}"`)
  
  // Normalisiere die Kategorie
  const normalizedCategory = normalizeCategory(categoryKey) || categoryKey
  console.log(`[hasPublishedTemplate] Normalisierte Kategorie: "${normalizedCategory}"`)
  
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
  
  console.log(`[hasPublishedTemplate] Gefundene aktive Templates:`, allActiveTemplates.length)
  
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
    
    if (matches) {
      console.log(`[hasPublishedTemplate] Passendes Template gefunden: Kategorie "${t.category}" -> normalisiert: "${normalizedTemplateCategory}"`)
    }
    
    return matches
  })
  
  const hasTemplate = matchingTemplates.length > 0
  console.log(`[hasPublishedTemplate] Ergebnis für "${categoryKey}":`, hasTemplate)
  
  return hasTemplate
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
    // Debug: Prüfe alle Templates
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
    
    console.log("[Template Debug] === getCategoriesWithPublishedTemplates ===")
    console.log("[Template Debug] Alle Templates in DB:", JSON.stringify(allTemplates, null, 2))
    
    // Suche nach Templates mit Status "active" (case-insensitive)
    const activeTemplates = allTemplates.filter(t => {
      const statusLower = t.status?.toLowerCase()
      const isActive = statusLower === "active"
      console.log(`[Template Debug] Template "${t.name}" (${t.id}): status="${t.status}", statusLower="${statusLower}", isActive=${isActive}`)
      return isActive
    })
    
    console.log("[Template Debug] Aktive Templates (gefiltert):", activeTemplates.length)
    activeTemplates.forEach(t => {
      console.log(`[Template Debug]   - ${t.name} (${t.id}): category="${t.category}", status="${t.status}"`)
    })
    
    // Normalisiere Kategorien und gruppiere
    const categoriesMap = new Map<string, { category: string; categoryLabel: string | null }>()
    
    for (const t of activeTemplates) {
      if (t.category) {
        const normalizedCategory = normalizeCategory(t.category)
        console.log(`[Template Debug] Kategorie "${t.category}" -> normalisiert: "${normalizedCategory}"`)
        if (normalizedCategory && !categoriesMap.has(normalizedCategory)) {
          categoriesMap.set(normalizedCategory, {
            category: normalizedCategory,
            categoryLabel: t.categoryLabel
          })
        }
      } else {
        console.log(`[Template Debug] WARNUNG: Template "${t.name}" hat keine Kategorie!`)
      }
    }
    
    const result = Array.from(categoriesMap.values()).map(t => ({
      categoryKey: t.category,
      label: getCategoryLabel(t.category, t.categoryLabel)
    }))
    
    console.log("[Template Debug] Finale Kategorien:", JSON.stringify(result, null, 2))
    console.log("[Template Debug] === Ende getCategoriesWithPublishedTemplates ===")
    
    return result
  } catch (error) {
    console.error("[Template Debug] FEHLER in getCategoriesWithPublishedTemplates:", error)
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
 * 1. customLabel (aus Datenbank)
 * 2. CATEGORY_LABELS (Fallback)
 * 3. categoryKey (wenn nichts gefunden)
 */
export function getCategoryLabel(categoryKey: string, customLabel?: string | null): string {
  // Wenn ein customLabel vorhanden ist, verwende es
  if (customLabel && customLabel.trim()) {
    return customLabel
  }
  // Sonst Fallback zu Standard-Labels
  return CATEGORY_LABELS[categoryKey] || categoryKey
}

/**
 * Lädt Kategorien mit ihren Labels aus der Datenbank
 * Gibt eine Map zurück: categoryKey -> { label, categoryKey }
 */
export async function getCategoriesWithLabels(): Promise<Map<string, { label: string; categoryKey: string }>> {
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
    if (!result.has(template.category)) {
      result.set(template.category, {
        categoryKey: template.category,
        label: getCategoryLabel(template.category, template.categoryLabel)
      })
    }
  }

  return result
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
  // Debug: Prüfe alle Templates mit Status
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
  console.log("[Template Debug] Alle Templates (getAllPublishedTemplates):", JSON.stringify(allTemplatesDebug, null, 2))
  
  // Suche mit verschiedenen Status-Werten
  let templates = await prisma.template.findMany({
    where: {
      status: {
        in: ["active", "Active", "ACTIVE"]
      },
      category: {
        not: null
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
    console.log("[Template Debug] Fallback: Manuell gefilterte aktive Templates:", templates.length)
  }

  console.log("[Template Debug] Aktive Templates gefunden (getAllPublishedTemplates):", templates.length, templates.map(t => ({ id: t.id, name: t.name, category: t.category, version: t.version, status: "active" })))

  return templates.map(t => ({
    id: t.id,
    name: t.name,
    category: t.category,
    version: t.version,
    categoryLabel: t.categoryLabel,
    label: `${getCategoryLabel(t.category, t.categoryLabel)} - ${t.name} (v${t.version})`
  }))
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

