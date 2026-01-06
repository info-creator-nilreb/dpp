"use client"

import Link from "next/link"
import { ReactNode } from "react"

interface DashboardCardProps {
  href: string
  icon: ReactNode
  title: string
  description: string
  children?: ReactNode
}

/**
 * Dashboard-Kachel Komponente
 * 
 * Klickbare Kachel mit Hover-Effekten
 */
export default function DashboardCard({ href, icon, title, description, children }: DashboardCardProps) {
  const isClickable = href !== "#"
  
  const content = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        backgroundColor: "#FFFFFF",
        padding: "clamp(1.5rem, 4vw, 2rem)",
        borderRadius: "12px",
        border: "1px solid #CDCDCD",
        textDecoration: "none",
        color: "inherit",
        transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
        cursor: isClickable ? "pointer" : "default",
        boxSizing: "border-box",
        width: "100%",
        overflow: "hidden"
      }}
      onMouseEnter={(e) => {
        if (isClickable) {
          e.currentTarget.style.borderColor = "#24c598"
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(226, 0, 116, 0.1)"
          e.currentTarget.style.transform = "translateY(-2px)"
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#CDCDCD"
        e.currentTarget.style.boxShadow = "none"
        e.currentTarget.style.transform = "translateY(0)"
      }}
    >
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "1rem",
        marginBottom: "1rem"
      }}>
        <div style={{
          width: "48px",
          height: "48px",
          borderRadius: "8px",
          backgroundColor: "#F5F5F5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0
        }}>
          {icon}
        </div>
        <h2 
          lang="de"
          style={{
            fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
            fontWeight: "700",
            color: "#0A0A0A",
            margin: 0,
            flex: 1,
            minWidth: 0,
            wordBreak: "break-word",
            overflowWrap: "break-word",
            hyphens: "auto",
            WebkitHyphens: "auto",
            msHyphens: "auto",
            lineHeight: "1.3"
          }}
        >
          {title}
        </h2>
      </div>
      <p style={{
        color: "#7A7A7A",
        fontSize: "clamp(0.9rem, 2vw, 1rem)",
        marginBottom: children ? "1.5rem" : 0,
        flexGrow: 1
      }}>
        {description}
      </p>
      {children}
    </div>
  )

  if (isClickable) {
    return (
      <Link href={href} style={{ textDecoration: "none", color: "inherit", height: "100%", display: "flex", flexDirection: "column" }}>
        {content}
      </Link>
    )
  }

  return content
}

