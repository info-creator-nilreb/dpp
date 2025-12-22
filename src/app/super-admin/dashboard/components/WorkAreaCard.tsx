"use client"

import Link from "next/link"
import { ArrowRightIcon } from "../../components/Icons"

interface WorkAreaCardProps {
  href: string
  icon: React.ReactNode
  title: string
  description: string
}

/**
 * Work Area Card - Large, primary action cards
 * Used in "Arbeitsbereiche" section
 */
export default function WorkAreaCard({ href, icon, title, description }: WorkAreaCardProps) {
  return (
    <Link
      href={href}
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E5E5E5",
        borderRadius: "12px",
        padding: "2rem",
        textDecoration: "none",
        color: "inherit",
        display: "block",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        transition: "all 0.2s ease",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)"
        e.currentTarget.style.borderColor = "#E20074"
        e.currentTarget.style.transform = "translateY(-2px)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)"
        e.currentTarget.style.borderColor = "#E5E5E5"
        e.currentTarget.style.transform = "translateY(0)"
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{
          width: "48px",
          height: "48px",
          borderRadius: "8px",
          backgroundColor: "#F5F5F5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: "#E20074",
        }}>
          <div style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {icon}
          </div>
        </div>
        <div style={{ 
          color: "#E20074", 
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "20px",
          height: "20px",
        }}>
          <ArrowRightIcon />
        </div>
      </div>
      <h3 style={{ 
        fontSize: "1.5rem", 
        fontWeight: "700", 
        color: "#0A0A0A",
        marginBottom: "0.5rem"
      }}>
        {title}
      </h3>
      <p style={{ 
        color: "#7A7A7A", 
        fontSize: "0.95rem",
        lineHeight: "1.5"
      }}>
        {description}
      </p>
    </Link>
  )
}

