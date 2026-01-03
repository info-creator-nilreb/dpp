/**
 * DPP Section Constants
 * 
 * Defines all available sections in a Digital Product Passport.
 * This file has no dependencies to avoid bundling issues in client components.
 */

export const DPP_SECTIONS = {
  // Sektion 1: Basis- & Produktdaten
  BASIC_DATA: "basic_data",
  // Sektion 2: Materialien & Zusammensetzung
  MATERIALS: "materials",
  MATERIAL_SOURCE: "material_source",
  // Sektion 3: Nutzung, Pflege & Lebensdauer
  CARE: "care",
  REPAIR: "repair",
  LIFESPAN: "lifespan",
  // Sektion 4: Rechtliches & Konformität
  LEGAL: "legal",
  CONFORMITY: "conformity",
  DISPOSAL: "disposal",
  // Sektion 5: Rücknahme & Second Life
  TAKEBACK: "takeback",
  SECOND_LIFE: "second_life",
  // Medien
  MEDIA: "media",
} as const

export type DppSection = typeof DPP_SECTIONS[keyof typeof DPP_SECTIONS]

