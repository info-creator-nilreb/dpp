/**
 * Minimalistische Stats-Icons (Heroicons/Feather-Style)
 * Zarte Linie, flat design
 */

interface IconProps {
  size?: number
  color?: string
}

const iconProps = {
  viewBox: "0 0 24 24" as const,
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
}

export function StatsUsageIcon({ size = 18, color = "#6B7280" }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} style={{ color }}>
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  )
}

export function StatsSurveyIcon({ size = 18, color = "#6B7280" }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} style={{ color }}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
