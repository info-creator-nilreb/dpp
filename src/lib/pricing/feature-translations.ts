/**
 * Feature Translations
 * 
 * German translations for feature descriptions
 * Used when feature descriptions from Feature Registry are in English
 */

const FEATURE_DESCRIPTION_TRANSLATIONS: Record<string, string> = {
  // Storytelling & Content Features
  "storytelling_blocks": "Erweiterte Content-Blöcke für Storytelling",
  "block_editor": "Visueller Block-basierter Content-Editor",
  "cms_access": "Zugriff auf das Content-Management-System",
  "interaction_blocks": "Interaktive Elemente (Quizze, Formulare, etc.)",
  "publishing": "Möglichkeit, DPPs öffentlich zu veröffentlichen",
  "styling_controls": "Erweiterte Styling-Optionen für Content",
  
  // Common English descriptions that need translation
  "Advanced content blocks for storytelling": "Erweiterte Content-Blöcke für Storytelling",
  "Visual block-based content editor": "Visueller Block-basierter Content-Editor",
  "Access to content management system": "Zugriff auf das Content-Management-System",
  "Interactive elements (quizzes, forms, etc.)": "Interaktive Elemente (Quizze, Formulare, etc.)",
  "Ability to publish DPPs publicly": "Möglichkeit, DPPs öffentlich zu veröffentlichen",
  "Advanced styling options for content": "Erweiterte Styling-Optionen für Content"
}

/**
 * Get German description for a feature
 * Returns the translation if available, otherwise returns the original description
 */
export function getFeatureDescription(featureKey: string, originalDescription: string | null): string | null {
  if (!originalDescription) return null
  
  // First check if we have a translation by feature key
  const translationByKey = FEATURE_DESCRIPTION_TRANSLATIONS[featureKey]
  if (translationByKey) {
    return translationByKey
  }
  
  // Then check if we have a translation by exact description text
  const translationByDescription = FEATURE_DESCRIPTION_TRANSLATIONS[originalDescription]
  if (translationByDescription) {
    return translationByDescription
  }
  
  // Check for partial matches in description (case-insensitive)
  const lowerDescription = originalDescription.toLowerCase()
  for (const [englishText, germanText] of Object.entries(FEATURE_DESCRIPTION_TRANSLATIONS)) {
    if (englishText.length > 10 && lowerDescription.includes(englishText.toLowerCase())) {
      return germanText
    }
  }
  
  // If description is already in German (contains common German words), return as is
  const germanIndicators = ['für', 'und', 'die', 'der', 'das', 'mit', 'kann', 'wird', 'sind', 'ist', 'können', 'werden', 'haben', 'sollte', 'zugriff', 'möglichkeit', 'erweiterte', 'visueller']
  const hasGermanWords = germanIndicators.some(word => 
    lowerDescription.includes(word.toLowerCase())
  )
  
  if (hasGermanWords) {
    return originalDescription
  }
  
  // Try to translate common English patterns (more aggressive matching)
  const commonTranslations: Record<string, string> = {
    "Advanced content blocks for storytelling": "Erweiterte Content-Blöcke für Storytelling",
    "Visual block-based content editor": "Visueller Block-basierter Content-Editor",
    "Access to content management system": "Zugriff auf das Content-Management-System",
    "Interactive elements (quizzes, forms, etc.)": "Interaktive Elemente (Quizze, Formulare, etc.)",
    "Ability to publish DPPs publicly": "Möglichkeit, DPPs öffentlich zu veröffentlichen",
    "Advanced styling options for content": "Erweiterte Styling-Optionen für Content",
    "content blocks": "Content-Blöcke",
    "block editor": "Block-Editor",
    "content management": "Content-Management",
    "interactive elements": "Interaktive Elemente",
    "publish": "veröffentlichen",
    "styling options": "Styling-Optionen",
    "advanced": "Erweiterte",
    "visual": "Visueller",
    "access to": "Zugriff auf",
    "ability to": "Möglichkeit zu"
  }
  
  // Check for exact or partial matches
  for (const [english, german] of Object.entries(commonTranslations)) {
    if (lowerDescription.includes(english.toLowerCase())) {
      return german
    }
  }
  
  // For now, return original description if no translation found
  return originalDescription
}

