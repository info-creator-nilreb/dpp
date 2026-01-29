/**
 * CMS SCHEMAS
 * 
 * JSON Schemas for block content validation
 */

/**
 * Storytelling Block Schema
 */
export const storytellingBlockSchema = {
  type: "object",
  required: ["title", "description"],
  properties: {
    title: {
      type: "string",
      minLength: 1,
      maxLength: 200
    },
    description: {
      type: "string",
      minLength: 1,
      maxLength: 5000
    },
    images: {
      type: "array",
      items: {
        type: "object",
        required: ["url", "alt"],
        properties: {
          url: { type: "string", format: "uri" },
          alt: { type: "string", maxLength: 200 },
          caption: { type: "string", maxLength: 500 }
        }
      },
      maxItems: 10
    },
    sections: {
      type: "array",
      items: {
        type: "object",
        required: ["heading", "text"],
        properties: {
          heading: { type: "string", maxLength: 200 },
          text: { type: "string", maxLength: 2000 },
          image: { type: "string", format: "uri" }
        }
      },
      maxItems: 20
    }
  }
}

/**
 * Quick Poll Block Schema
 */
export const quickPollBlockSchema = {
  type: "object",
  required: ["question", "options"],
  properties: {
    question: {
      type: "string",
      minLength: 1,
      maxLength: 300
    },
    options: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "label"],
        properties: {
          id: { type: "string", minLength: 1 },
          label: { type: "string", minLength: 1, maxLength: 200 }
        }
      },
      minItems: 2,
      maxItems: 10
    },
    allowMultiple: {
      type: "boolean",
      default: false
    },
    showResults: {
      type: "boolean",
      default: false
    },
    completionMessage: {
      type: "string",
      maxLength: 200,
      default: "Vielen Dank für Ihre Teilnahme!"
    }
  }
}

/**
 * Multi-Question Poll Block Schema
 */
export const multiQuestionPollBlockSchema = {
  type: "object",
  required: ["questions"],
  properties: {
    questions: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "object",
        required: ["question", "options"],
        properties: {
          question: {
            type: "string",
            minLength: 1,
            maxLength: 300
          },
          options: {
            type: "array",
            minItems: 2,
            maxItems: 5,
            items: {
              type: "string",
              minLength: 1,
              maxLength: 200
            }
          }
        }
      }
    },
    completionMessage: {
      type: "string",
      maxLength: 200,
      default: "Vielen Dank für Ihre Teilnahme!"
    }
  }
}

/**
 * Image Text Block Schema
 */
export const imageTextBlockSchema = {
  type: "object",
  required: ["layout", "image", "text"],
  properties: {
    layout: {
      type: "string",
      enum: ["image_left", "image_right", "image_top", "image_bottom"]
    },
    image: {
      type: "object",
      required: ["url", "alt"],
      properties: {
        url: { type: "string", format: "uri" },
        alt: { type: "string", maxLength: 200 },
        caption: { type: "string", maxLength: 500 }
      }
    },
    text: {
      type: "object",
      required: ["content"],
      properties: {
        heading: { type: "string", maxLength: 200 },
        content: { type: "string", minLength: 1, maxLength: 5000 }
      }
    }
  }
}

/**
 * Styling Config Schema
 */
export const stylingConfigSchema = {
  type: "object",
  properties: {
    logo: {
      type: "object",
      properties: {
        url: { type: "string", format: "uri" },
        alt: { type: "string", maxLength: 200 },
        width: { type: "number", minimum: 1, maximum: 2000 },
        height: { type: "number", minimum: 1, maximum: 2000 }
      },
      required: ["url"]
    },
    colors: {
      type: "object",
      required: ["primary"],
      properties: {
        primary: {
          type: "string",
          pattern: "^#[0-9A-Fa-f]{6}$"
        },
        secondary: {
          type: "string",
          pattern: "^#[0-9A-Fa-f]{6}$"
        },
        accent: {
          type: "string",
          pattern: "^#[0-9A-Fa-f]{6}$"
        }
      }
    },
    fonts: {
      type: "object",
      properties: {
        primary: {
          type: "string",
          enum: [
            "Inter",
            "Roboto",
            "Open Sans",
            "Lato",
            "Montserrat",
            "Poppins",
            "Source Sans Pro",
            "Raleway"
          ]
        },
        secondary: {
          type: "string",
          enum: [
            "Inter",
            "Roboto",
            "Open Sans",
            "Lato",
            "Montserrat",
            "Poppins",
            "Source Sans Pro",
            "Raleway"
          ]
        }
      }
    },
    spacing: {
      type: "object",
      properties: {
        blockSpacing: {
          type: "number",
          minimum: 0,
          maximum: 200,
          default: 24
        },
        sectionPadding: {
          type: "number",
          minimum: 0,
          maximum: 200,
          default: 40
        }
      }
    }
  }
}

/**
 * Block Schema Registry
 */
export const blockSchemas: Record<string, any> = {
  storytelling: storytellingBlockSchema,
  multi_question_poll: multiQuestionPollBlockSchema,
  image_text: imageTextBlockSchema
}

/**
 * Default Styling Config
 */
export const defaultStylingConfig = {
  colors: {
    primary: "#0A0A0A", // System default
    secondary: "#7A7A7A", // System default
    accent: "#24c598" // System default (Mint)
  },
  fonts: {
    primary: "Inter",
    secondary: "Inter"
  },
  spacing: {
    blockSpacing: 24,
    sectionPadding: 40
  }
}

