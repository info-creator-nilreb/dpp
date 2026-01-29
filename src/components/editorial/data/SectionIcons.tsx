/**
 * Section Icons
 * 
 * Minimalistische Icons für verschiedene Section-Typen
 * Im Apple-Editorial-Style
 */

interface IconProps {
  size?: number
  color?: string
}

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
}

export function MaterialIcon({ size = 18, color = "#7A7A7A" }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} style={{ color }}>
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
    </svg>
  )
}

export function ColorIcon({ size = 18, color = "#7A7A7A" }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} style={{ color }}>
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  )
}

export function DimensionsIcon({ size = 18, color = "#7A7A7A" }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} style={{ color }}>
      <path d="M3 3h18v18H3z"/>
      <path d="M3 3l18 18"/>
      <path d="M21 3L3 21"/>
    </svg>
  )
}

export function ProductionIcon({ size = 18, color = "#7A7A7A" }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} style={{ color }}>
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
    </svg>
  )
}

export function CareIcon({ size = 18, color = "#7A7A7A" }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} style={{ color }}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}

export function RecyclingIcon({ size = 18, color = "#7A7A7A" }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} style={{ color }}>
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
    </svg>
  )
}

export function ComplianceIcon({ size = 18, color = "#7A7A7A" }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} style={{ color }}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  )
}

export function ChevronDownIcon({ size = 16, color = "#7A7A7A" }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} style={{ color }}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}

export function ChevronUpIcon({ size = 16, color = "#7A7A7A" }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} style={{ color }}>
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  )
}

/**
 * Get icon for section based on block name/key
 */
export function getSectionIcon(blockName: string, blockKey: string) {
  const name = blockName.toLowerCase()
  const key = blockKey.toLowerCase()
  
  if (name.includes('material') || key.includes('material')) {
    return MaterialIcon
  }
  if (name.includes('farbe') || name.includes('color') || key.includes('color')) {
    return ColorIcon
  }
  if (name.includes('abmessung') || name.includes('dimension') || key.includes('dimension')) {
    return DimensionsIcon
  }
  if (name.includes('produktion') || name.includes('herkunft') || key.includes('production')) {
    return ProductionIcon
  }
  if (name.includes('pflege') || name.includes('nutzung') || name.includes('care') || key.includes('care')) {
    return CareIcon
  }
  if (name.includes('rücknahme') || name.includes('recycling') || name.includes('second') || key.includes('recycling')) {
    return RecyclingIcon
  }
  if (name.includes('konform') || name.includes('compliance') || key.includes('compliance')) {
    return ComplianceIcon
  }
  
  // Default icon
  return MaterialIcon
}
