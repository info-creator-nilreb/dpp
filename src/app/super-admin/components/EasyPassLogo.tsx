/**
 * Easy Pass Logo Component
 * 
 * Konsistentes Logo für Super Admin Bereich
 * - iconOnly: zeigt nur das Icon (für eingeklappte Sidebar)
 * - full: zeigt Logo + Text (für ausgeklappte Sidebar)
 */

interface EasyPassLogoProps {
  size?: number
  color?: string
  iconOnly?: boolean
  textColor?: string
}

export default function EasyPassLogo({ 
  size = 32, 
  color = "#24c598", 
  iconOnly = false,
  textColor = "#FFFFFF"
}: EasyPassLogoProps) {
  if (iconOnly) {
    // Nur das Icon (für eingeklappte Sidebar)
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="32" cy="32" r="30" fill={color} />
        <path
          d="M20 32L28 40L44 24"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  // Vollständiges Logo mit Text (für ausgeklappte Sidebar)
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
    }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <circle cx="32" cy="32" r="30" fill={color} />
        <path
          d="M20 32L28 40L44 24"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span style={{
        fontSize: "1.25rem",
        fontWeight: "700",
        color: textColor,
        whiteSpace: "nowrap",
      }}>
        Easy Pass
      </span>
    </div>
  )
}
