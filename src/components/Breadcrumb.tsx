import Link from "next/link"

/**
 * Breadcrumb-Navigation
 * 
 * Zeigt dezenten Link zum Dashboard oben auf jeder Seite
 */
export default function Breadcrumb() {
  return (
    <div style={{
      marginBottom: "1rem"
    }}>
      <Link
        href="/app/dashboard"
        style={{
          color: "#7A7A7A",
          textDecoration: "none",
          fontSize: "clamp(0.9rem, 2vw, 1rem)"
        }}
      >
        ← Zum Dashboard
      </Link>
    </div>
  )
}

