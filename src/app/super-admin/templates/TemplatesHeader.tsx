"use client"

import Link from "next/link"

/**
 * Client Component for Templates Page Header
 * Handles responsive layout and mobile optimization
 */
export default function TemplatesHeader() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "clamp(1rem, 3vw, 1.5rem)",
      marginBottom: "clamp(1.5rem, 4vw, 2rem)"
    }}
    className="templates-header"
    >
      <div style={{ width: "100%" }}>
        <Link
          href="/super-admin/dashboard"
          style={{
            color: "#7A7A7A",
            textDecoration: "none",
            fontSize: "clamp(0.85rem, 2vw, 0.9rem)",
            marginBottom: "clamp(0.5rem, 1.5vw, 0.75rem)",
            display: "block"
          }}
        >
          ← Zum Dashboard
        </Link>
        <h1 style={{
          fontSize: "clamp(1.5rem, 4vw, 2rem)",
          fontWeight: "700",
          color: "#0A0A0A",
          margin: 0,
          lineHeight: "1.2"
        }}>
          Templates
        </h1>
      </div>
      <Link
        href="/super-admin/templates/new"
        style={{
          backgroundColor: "#24c598",
          color: "#FFFFFF",
          padding: "clamp(0.625rem, 1.5vw, 0.75rem) clamp(1rem, 2.5vw, 1.5rem)",
          borderRadius: "8px",
          textDecoration: "none",
          fontSize: "clamp(0.875rem, 2vw, 0.95rem)",
          fontWeight: "600",
          display: "inline-block",
          whiteSpace: "nowrap",
          alignSelf: "flex-start",
          transition: "background-color 0.2s"
        }}
        className="new-template-button"
      >
        + Neues Template
      </Link>
      <style jsx>{`
        @media (min-width: 768px) {
          .templates-header {
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: center !important;
          }
          .new-template-button {
            align-self: center !important;
          }
        }
      `}</style>
    </div>
  )
}

