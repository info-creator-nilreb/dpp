"use client"

import { useState } from "react"

interface VersionQrCodeSectionProps {
  publicUrl: string | null
  qrCodeImageUrl?: string | null // Optional: Wird nicht mehr verwendet, bleibt für Kompatibilität
  dppId: string
  version: number
}

/**
 * QR-Code-Sektion für Versionen
 * 
 * Zeigt öffentliche URL und QR-Code mit Download-Option
 * QR-Codes werden on-demand via API Route generiert (Vercel-compatible)
 */
export default function VersionQrCodeSection({ publicUrl, dppId, version }: VersionQrCodeSectionProps) {
  const [copied, setCopied] = useState(false)

  if (!publicUrl) {
    return null
  }

  // QR-Code Preview-URL (generiert on-demand)
  const qrCodePreviewUrl = `/api/app/dpp/${dppId}/versions/${version}/qr-code-preview`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Error copying to clipboard:", error)
    }
  }

  return (
    <div style={{
      backgroundColor: "#FFFFFF",
      padding: "clamp(1.5rem, 4vw, 2rem)",
      borderRadius: "12px",
      border: "1px solid #CDCDCD",
      marginBottom: "2rem"
    }}>
      <h2 style={{
        fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
        fontWeight: "700",
        color: "#0A0A0A",
        marginBottom: "1rem"
      }}>
        Öffentlicher Zugriff
      </h2>
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem"
      }}>
        <div>
          <label style={{
            display: "block",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            fontWeight: "600",
            color: "#0A0A0A",
            marginBottom: "0.5rem"
          }}>
            Öffentliche URL
          </label>
          <div style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
            flexWrap: "wrap"
          }}>
            <input
              type="text"
              value={publicUrl}
              readOnly
              style={{
                flex: 1,
                minWidth: "200px",
                padding: "0.75rem",
                fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                backgroundColor: "#F5F5F5",
                color: "#0A0A0A",
                boxSizing: "border-box"
              }}
            />
            <button
              onClick={handleCopy}
              style={{
                padding: "0.75rem 1rem",
                backgroundColor: copied ? "#00A651" : "#24c598",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "6px",
                fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
                fontWeight: "600",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "background-color 0.2s"
              }}
            >
              {copied ? "✓ Kopiert" : "Kopieren"}
            </button>
          </div>
        </div>
        {publicUrl && (
          <div>
            <label style={{
              display: "block",
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              QR-Code
            </label>
            <div style={{
              display: "flex",
              gap: "1rem",
              alignItems: "flex-start",
              flexWrap: "wrap"
            }}>
              <div style={{
                padding: "1rem",
                backgroundColor: "#FFFFFF",
                border: "1px solid #CDCDCD",
                borderRadius: "8px"
              }}>
                <img
                  src={qrCodePreviewUrl}
                  alt="QR-Code"
                  style={{
                    width: "150px",
                    height: "150px",
                    display: "block"
                  }}
                />
              </div>
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem"
              }}>
                <a
                  href={`/api/app/dpp/${dppId}/versions/${version}/qr-code`}
                  download
                  style={{
                    display: "inline-block",
                    padding: "0.75rem 1rem",
                    backgroundColor: "#24c598",
                    color: "#FFFFFF",
                    textDecoration: "none",
                    borderRadius: "6px",
                    fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
                    fontWeight: "600",
                    textAlign: "center"
                  }}
                >
                  QR-Code herunterladen
                </a>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    padding: "0.75rem 1rem",
                    backgroundColor: "transparent",
                    color: "#0A0A0A",
                    textDecoration: "none",
                    border: "1px solid #CDCDCD",
                    borderRadius: "6px",
                    fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
                    fontWeight: "600",
                    textAlign: "center"
                  }}
                >
                  Öffentliche Ansicht öffnen
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

