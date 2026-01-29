/**
 * Block Templates
 * 
 * Pre-configured block templates for quick creation
 */

import { Block, BlockTypeKey } from "./types"
import { BLOCK_TYPE_FEATURE_MAP } from "./validation"

export interface BlockTemplate {
  id: string
  name: string
  description: string
  type: BlockTypeKey
  featureKey: string
  template: Partial<Block>
}

export const BLOCK_TEMPLATES: BlockTemplate[] = [
  {
    id: "storytelling_intro",
    name: "Einführungs-Storytelling",
    description: "Ein Storytelling-Block mit Titel, Beschreibung und Bildern für die Einführung",
    type: "storytelling",
    featureKey: BLOCK_TYPE_FEATURE_MAP.storytelling,
    template: {
      type: "storytelling",
      featureKey: BLOCK_TYPE_FEATURE_MAP.storytelling,
      status: "draft",
      content: {
        title: "Unsere Geschichte",
        description: "Erzählen Sie hier Ihre Markengeschichte und was Sie auszeichnet.",
        images: [],
        sections: [
          {
            heading: "Unsere Mission",
            text: "Beschreiben Sie hier Ihre Mission und Werte.",
            image: ""
          }
        ]
      }
    }
  },
  {
    id: "storytelling_sustainability",
    name: "Nachhaltigkeits-Storytelling",
    description: "Ein Storytelling-Block fokussiert auf Nachhaltigkeit",
    type: "storytelling",
    featureKey: BLOCK_TYPE_FEATURE_MAP.storytelling,
    template: {
      type: "storytelling",
      featureKey: BLOCK_TYPE_FEATURE_MAP.storytelling,
      status: "draft",
      content: {
        title: "Nachhaltigkeit",
        description: "Wie wir nachhaltige Produkte herstellen und unsere Umwelt schützen.",
        images: [],
        sections: [
          {
            heading: "Nachhaltige Materialien",
            text: "Wir verwenden nur nachhaltige und zertifizierte Materialien.",
            image: ""
          },
          {
            heading: "Kreislaufwirtschaft",
            text: "Unser Engagement für eine zirkuläre Wirtschaft.",
            image: ""
          }
        ]
      }
    }
  },
  {
    id: "multi_question_poll_feedback",
    name: "Feedback-Umfrage",
    description: "Interaktive Umfrage für Nutzer-Feedback",
    type: "multi_question_poll",
    featureKey: BLOCK_TYPE_FEATURE_MAP.multi_question_poll,
    template: {
      type: "multi_question_poll",
      featureKey: BLOCK_TYPE_FEATURE_MAP.multi_question_poll,
      status: "draft",
      content: {
        questions: [
          {
            question: "Wie zufrieden sind Sie mit unserem Produkt?",
            options: ["Sehr zufrieden", "Zufrieden", "Neutral", "Unzufrieden"]
          }
        ],
        completionMessage: "Vielen Dank für Ihre Teilnahme!"
      }
    }
  },
  {
    id: "image_text_product",
    name: "Produkt-Bild-Text",
    description: "Ein Bild-Text-Block für Produktpräsentation",
    type: "image_text",
    featureKey: BLOCK_TYPE_FEATURE_MAP.image_text,
    template: {
      type: "image_text",
      featureKey: BLOCK_TYPE_FEATURE_MAP.image_text,
      status: "draft",
      content: {
        layout: "image_left",
        image: {
          url: "",
          alt: "Produktbild",
          caption: ""
        },
        text: {
          heading: "Unser Produkt",
          content: "Beschreiben Sie hier die wichtigsten Eigenschaften und Vorteile Ihres Produkts."
        }
      }
    }
  },
  {
    id: "image_text_features",
    name: "Features-Bild-Text",
    description: "Ein Bild-Text-Block für Produktfeatures",
    type: "image_text",
    featureKey: BLOCK_TYPE_FEATURE_MAP.image_text,
    template: {
      type: "image_text",
      featureKey: BLOCK_TYPE_FEATURE_MAP.image_text,
      status: "draft",
      content: {
        layout: "image_right",
        image: {
          url: "",
          alt: "Produktfeatures",
          caption: ""
        },
        text: {
          heading: "Produktfeatures",
          content: "Listen Sie hier die wichtigsten Features und Vorteile auf."
        }
      }
    }
  }
]

/**
 * Get templates for a specific block type
 */
export function getTemplatesForType(type: BlockTypeKey): BlockTemplate[] {
  return BLOCK_TEMPLATES.filter(template => template.type === type)
}

/**
 * Get all available templates based on features
 */
export function getAvailableTemplates(availableFeatures: string[]): BlockTemplate[] {
  return BLOCK_TEMPLATES.filter(template => 
    availableFeatures.includes(template.featureKey)
  )
}

/**
 * Create a block from a template
 */
export function createBlockFromTemplate(
  template: BlockTemplate,
  order: number
): Block {
  return {
    id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: template.type,
    featureKey: template.featureKey,
    order,
    status: "draft",
    content: template.template.content || {}
  }
}

