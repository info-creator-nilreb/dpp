"use client"

import Link from "next/link"

interface VersionLinkProps {
  href: string
  children: React.ReactNode
}

/**
 * Client Component für Version-Link
 * 
 * Wrapper für Link mit Hover-Effekten
 */
export default function VersionLink({ href, children }: VersionLinkProps) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        backgroundColor: "#FFFFFF",
        padding: "1.5rem",
        borderRadius: "12px",
        border: "1px solid #CDCDCD",
        textDecoration: "none",
        color: "inherit",
        transition: "border-color 0.2s, box-shadow 0.2s"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#24c598"
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(36, 197, 152, 0.1)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#CDCDCD"
        e.currentTarget.style.boxShadow = "none"
      }}
    >
      {children}
    </Link>
  )
}

