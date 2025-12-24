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
  const template = await prisma.template.findFirst({
    where: {
      category: categoryKey,
      status: "active"
    },
    orderBy: {
      version: "desc"
    },
    include: {
      blocks: {
        orderBy: { order: "asc" },
        include: {
          fields: {
            where: {
              deprecatedInVersion: null // Nur aktive Felder
            },
            orderBy: { order: "asc" }
          }
        }
      }
    }
  })

  return template
}

/**
 * Prüft, ob für eine Kategorie mindestens eine veröffentlichte Template-Version existiert
 */
export async function hasPublishedTemplate(categoryKey: string): Promise<boolean> {
  const count = await prisma.template.count({
    where: {
      category: categoryKey,
      status: "active"
    }
  })
  return count > 0
}

/**
 * Gibt alle Kategorien zurück, für die mindestens eine veröffentlichte Template-Version existiert
 * Inklusive ihrer Labels für die UI
 */
export async function getCategoriesWithPublishedTemplates(): Promise<Array<{ categoryKey: string; label: string }>> {
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

  return templates.map(t => ({
    categoryKey: t.category,
    label: getCategoryLabel(t.category, t.categoryLabel)
  }))
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

