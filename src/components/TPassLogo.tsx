/**
 * Easy Pass Logo Component
 * 
 * Reusable logo component for public and admin areas
 */

interface TPassLogoProps {
  size?: number
  color?: string
  iconOnly?: boolean
  textColor?: string
}

export default function TPassLogo({ 
  size = 32, 
  color = "#24c598",
  iconOnly = false,
  textColor = "#0A0A0A"
}: TPassLogoProps) {
  if (iconOnly) {
    return (
      <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      </div>
      <span style={{ 
        fontSize: `${size * 0.75}px`, 
        fontWeight: "700", 
        color: textColor,
        whiteSpace: "nowrap"
      }}>
        Easy Pass
      </span>
    </div>
  )
}

