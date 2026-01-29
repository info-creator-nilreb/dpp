/**
 * Theme Resolver
 * 
 * Client-safe theme resolution (no server dependencies)
 * Extracted from validation.ts to prevent bundling issues
 */

import { StylingConfig } from "./types"
import { defaultStylingConfig } from "./schemas"

/**
 * Resolves theme with defaults
 * 
 * This function is safe to use in client components as it doesn't
 * import any server-only modules like prisma
 */
export function resolveTheme(styling: StylingConfig | undefined): StylingConfig {
  return {
    colors: {
      primary: styling?.colors?.primary || defaultStylingConfig.colors.primary,
      secondary: styling?.colors?.secondary || defaultStylingConfig.colors.secondary,
      accent: styling?.colors?.accent || defaultStylingConfig.colors.accent
    },
    fonts: {
      primary: styling?.fonts?.primary || defaultStylingConfig.fonts.primary,
      secondary: styling?.fonts?.secondary || defaultStylingConfig.fonts.secondary
    },
    spacing: {
      blockSpacing: styling?.spacing?.blockSpacing ?? defaultStylingConfig.spacing.blockSpacing,
      sectionPadding: styling?.spacing?.sectionPadding ?? defaultStylingConfig.spacing.sectionPadding
    },
    logo: styling?.logo
  }
}
