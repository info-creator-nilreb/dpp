"use client"

import Link from "next/link"

interface DashboardCardProps {
  href: string
  title: string
  description: string
}

/**
 * Dashboard Card Component (Client Component)
 * 
 * Handles hover effects with event handlers
 */
export default function DashboardCard({ href, title, description }: DashboardCardProps) {
  return (
    <Link
      href={href}
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #CDCDCD",
        borderRadius: "8px",
        padding: "1.5rem",
        textDecoration: "none",
        color: "inherit",
        display: "block",
        transition: "border-color 0.2s"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#E20074"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#CDCDCD"
      }}
    >
      <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem" }}>
        {title}
      </h2>
      <p style={{ color: "#7A7A7A", fontSize: "0.9rem" }}>
        {description}
      </p>
    </Link>
  )
}

