"use client"

import React from "react"
import { Tooltip } from "@/components/Tooltip"

const DownloadIconSvg = ({ size = 18, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    className={className}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const TOOLTIP_LABEL = "Rechnung herunterladen"

interface InvoiceDownloadButtonProps {
  href: string
  invoiceNumber?: string | null
  /** Icon-only (table) vs icon + text (card) */
  variant?: "icon" | "iconAndText"
  disabled?: boolean
}

export function InvoiceDownloadButton({
  href,
  invoiceNumber,
  variant = "icon",
  disabled = false,
}: InvoiceDownloadButtonProps) {
  const ariaLabel = invoiceNumber
    ? `Rechnung ${invoiceNumber} als PDF herunterladen`
    : "Rechnung als PDF herunterladen"

  const content = (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={() => {
        if (disabled) return
        window.open(href, "_blank", "noopener,noreferrer")
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
        minWidth: 32,
        minHeight: 32,
        padding: variant === "icon" ? "0.5rem" : "0.5rem 0.75rem",
        border: "none",
        borderRadius: "6px",
        background: "transparent",
        color: disabled ? "#9CA3AF" : "#374151",
        cursor: disabled ? "not-allowed" : "pointer",
        pointerEvents: disabled ? "none" : "auto",
        fontSize: "0.9rem",
        outlineOffset: "2px",
        transition: "color 0.15s, background-color 0.15s",
      }}
      onMouseEnter={(e) => {
        if (disabled) return
        e.currentTarget.style.color = "#24c598"
        e.currentTarget.style.backgroundColor = "rgba(36, 197, 152, 0.08)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = disabled ? "#9CA3AF" : "#374151"
        e.currentTarget.style.backgroundColor = "transparent"
      }}
      onFocus={(e) => {
        if (disabled) return
        e.currentTarget.style.outline = "2px solid #24c598"
        e.currentTarget.style.outlineOffset = "2px"
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = ""
      }}
    >
      <DownloadIconSvg size={variant === "icon" ? 17 : 18} />
      {variant === "iconAndText" && <span>Rechnung herunterladen</span>}
    </button>
  )

  if (disabled) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center" }} title="Kein PDF verfügbar">
        {content}
      </span>
    )
  }

  return (
    <Tooltip content={TOOLTIP_LABEL}>
      {content}
    </Tooltip>
  )
}
