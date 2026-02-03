"use client"

/**
 * Styling Editor Component
 * 
 * Premium-only styling configuration
 * Modern, Shopify-inspired design with small containers for each setting
 */

import { useState, useEffect, useRef } from "react"
import { StylingConfig, UpdateStylingRequest } from "@/lib/cms/types"
import FileUploadArea from "@/components/FileUploadArea"
import { useNotification } from "@/components/NotificationProvider"
import { editorialColors } from "@/components/editorial/tokens/colors"

interface StylingEditorProps {
  styling: StylingConfig | null
  onUpdate: (updates: UpdateStylingRequest) => void
  dppId: string
}

// System default colors
const DEFAULT_PRIMARY = editorialColors.brand.primary // '#0A0A0A'
const DEFAULT_SECONDARY = editorialColors.brand.secondary // '#7A7A7A'
const DEFAULT_ACCENT = editorialColors.brand.accent // '#24c598' (Mint)

export default function StylingEditor({ styling, onUpdate, dppId }: StylingEditorProps) {
  const { showNotification } = useNotification()
  const [logoUrl, setLogoUrl] = useState(styling?.logo?.url || "")
  const [logoAlt, setLogoAlt] = useState(styling?.logo?.alt || "")
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const isUploadingRef = useRef(false) // Track upload state to prevent useEffect from overwriting
  // Use default colors if no styling config exists or colors are not set
  const [primaryColor, setPrimaryColor] = useState(styling?.colors?.primary || DEFAULT_PRIMARY)
  const [secondaryColor, setSecondaryColor] = useState(styling?.colors?.secondary || "")
  const [accentColor, setAccentColor] = useState(styling?.colors?.accent || "")

  useEffect(() => {
    // Always set colors, using defaults if styling is null or colors are missing
    // Only update logoUrl if styling actually changed and we don't have a local upload in progress
    const newLogoUrl = styling?.logo?.url || ""
    // Only update if we're not currently uploading (use ref to get latest value)
    if (!isUploadingRef.current && newLogoUrl !== logoUrl) {
      setLogoUrl(newLogoUrl)
    }
    setLogoAlt(styling?.logo?.alt || "")
    setPrimaryColor(styling?.colors?.primary || DEFAULT_PRIMARY)
    setSecondaryColor(styling?.colors?.secondary || "")
    setAccentColor(styling?.colors?.accent || "")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styling]) // Only depend on styling - use ref to check upload state

  async function handleLogoUpload(file: File) {
    setUploadingLogo(true)
    isUploadingRef.current = true
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("role", "logo")

      const response = await fetch(`/api/app/dpp/${dppId}/media`, {
        method: "POST",
        body: formData
      })

      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Ungültige Antwort vom Server. Bitte versuchen Sie es erneut.")
      }

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch (parseError) {
          throw new Error(`Fehler beim Hochladen (Status: ${response.status})`)
        }
        const errorMessage = errorData.error || errorData.message || `Fehler beim Hochladen (${response.status})`
        throw new Error(errorMessage)
      }

      let result
      try {
        result = await response.json()
      } catch (parseError) {
        throw new Error("Fehler beim Verarbeiten der Antwort")
      }

      if (!result.media || !result.media.storageUrl) {
        console.error("Invalid response structure:", result)
        throw new Error("Ungültige Antwort vom Server: Keine Bild-URL erhalten")
      }

      const newLogoUrl = result.media.storageUrl
      console.log("Logo uploaded successfully, URL:", newLogoUrl)
      
      // Update state immediately
      setLogoUrl(newLogoUrl)
      
      // Save to backend immediately - onUpdate will trigger auto-save
      onUpdate({
        logo: {
          url: newLogoUrl,
          alt: logoAlt || undefined
        }
      })
      
      // No notification - header provides feedback
    } catch (error: any) {
      console.error("Error uploading logo:", error)
      const errorMessage = error.message || "Fehler beim Hochladen des Logos"
      showNotification(errorMessage, "error") // Keep error notifications
    } finally {
      setUploadingLogo(false)
      isUploadingRef.current = false
    }
  }

  function handleRemoveLogo() {
    setLogoUrl("")
    saveStyling({
      logo: undefined
    })
  }

  function saveStyling(updates: Partial<UpdateStylingRequest>) {
    // "logo" in updates: explizites Setzen (auch auf undefined beim Entfernen) berücksichtigen
    const logoValue =
      "logo" in updates
        ? updates.logo
        : logoUrl
          ? { url: logoUrl, alt: logoAlt || undefined }
          : undefined
    const fullUpdates: UpdateStylingRequest = {
      ...updates,
      colors: {
        primary: primaryColor,
        ...(secondaryColor && { secondary: secondaryColor }),
        ...(accentColor && { accent: accentColor })
      },
      logo: logoValue
    }
    onUpdate(fullUpdates)
  }

  function handleColorChange(colorType: "primary" | "secondary" | "accent", value: string) {
    // Update state immediately
    if (colorType === "primary") {
      const newPrimary = value || DEFAULT_PRIMARY
      setPrimaryColor(newPrimary)
      // Use the new value directly, not from state (which may not be updated yet)
      onUpdate({
        colors: {
          primary: newPrimary,
          ...(secondaryColor && { secondary: secondaryColor }),
          ...(accentColor && { accent: accentColor })
        }
      })
    } else if (colorType === "secondary") {
      const newSecondary = value || ""
      setSecondaryColor(newSecondary)
      // Use current primaryColor from state, but new secondary value
      onUpdate({
        colors: {
          primary: primaryColor || DEFAULT_PRIMARY,
          ...(newSecondary && { secondary: newSecondary }),
          ...(accentColor && { accent: accentColor })
        }
      })
    } else {
      const newAccent = value || ""
      setAccentColor(newAccent)
      // Use current values from state, but new accent value
      onUpdate({
        colors: {
          primary: primaryColor || DEFAULT_PRIMARY,
          ...(secondaryColor && { secondary: secondaryColor }),
          ...(newAccent && { accent: newAccent })
        }
      })
    }
  }

  function handleRemoveColor(colorType: "secondary" | "accent") {
    if (colorType === "secondary") {
      setSecondaryColor(DEFAULT_SECONDARY)
      onUpdate({
        colors: {
          primary: primaryColor || DEFAULT_PRIMARY,
          secondary: DEFAULT_SECONDARY,
          ...(accentColor && { accent: accentColor })
        }
      })
    } else {
      setAccentColor(DEFAULT_ACCENT)
      onUpdate({
        colors: {
          primary: primaryColor || DEFAULT_PRIMARY,
          ...(secondaryColor && { secondary: secondaryColor }),
          accent: DEFAULT_ACCENT
        }
      })
    }
  }

  return (
    <div style={{
      padding: "2rem",
      display: "flex",
      flexDirection: "column",
      gap: "2rem"
    }}>
      {/* Logo Section */}
      <div>
        <h3 style={{
          fontSize: "1.5rem",
          fontWeight: 600,
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          Logo hochladen
        </h3>
        {logoUrl ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.75rem",
            backgroundColor: "#FFFFFF",
            border: "1px solid #E5E5E5",
            borderRadius: "8px"
          }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "6px",
              border: "1px solid #E5E5E5",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#F9F9F9",
              overflow: "hidden"
            }}>
              <img
                src={logoUrl}
                alt={logoAlt || "Logo"}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
                  display: "block"
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#0A0A0A",
                marginBottom: "0.25rem"
              }}>
                Logo
              </div>
              <div style={{
                fontSize: "0.75rem",
                color: "#7A7A7A",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}>
                Hochgeladen
              </div>
            </div>
            <button
              onClick={handleRemoveLogo}
              style={{
                padding: "0.5rem",
                color: "#DC2626",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                borderRadius: "4px",
                transition: "background-color 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#FEF2F2"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent"
              }}
              title="Logo entfernen"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        ) : (
          <FileUploadArea
            accept="image/*"
            maxSize={2 * 1024 * 1024} // 2 MB
            onFileSelect={handleLogoUpload}
            disabled={uploadingLogo}
            description="PNG, JPG oder SVG (max. 2 MB)"
          />
        )}
      </div>

      {/* Colors Section */}
      <div>
        <h3 style={{
          fontSize: "1.5rem",
          fontWeight: 600,
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          Markenfarben definieren
        </h3>
        <p style={{
          fontSize: "0.875rem",
          color: "#7A7A7A",
          marginBottom: "1.5rem",
          lineHeight: 1.6
        }}>
          Die Markenfarben werden in der öffentlichen Darstellung des Digitalen Produktpasses erscheinen
        </p>

        {/* Primary Color */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.75rem",
          backgroundColor: "#FFFFFF",
          border: "1px solid #E5E5E5",
          borderRadius: "8px",
          marginBottom: "0.5rem"
        }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "6px",
            backgroundColor: primaryColor,
            border: "1px solid #E5E5E5",
            flexShrink: 0,
            cursor: "pointer",
            position: "relative"
          }}>
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => handleColorChange("primary", e.target.value)}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                opacity: 0,
                cursor: "pointer"
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#0A0A0A",
              marginBottom: "0.25rem"
            }}>
              Primärfarbe
            </div>
            <input
              type="text"
              value={primaryColor}
              onChange={(e) => handleColorChange("primary", e.target.value)}
              style={{
                width: "auto",
                minWidth: "80px",
                padding: "0.375rem 0.5rem",
                fontSize: "0.75rem",
                fontFamily: "monospace",
                border: "1px solid #E5E5E5",
                borderRadius: "4px",
                backgroundColor: "#FFFFFF",
                color: "#0A0A0A"
              }}
              placeholder="#000000"
              maxLength={7}
            />
          </div>
        </div>

        {/* Secondary Color */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.75rem",
          backgroundColor: "#FFFFFF",
          border: "1px solid #E5E5E5",
          borderRadius: "8px",
          marginBottom: "0.5rem"
        }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "6px",
            backgroundColor: secondaryColor || "#F5F5F5",
            border: "1px solid #E5E5E5",
            flexShrink: 0,
            cursor: "pointer",
            position: "relative",
            opacity: secondaryColor ? 1 : 0.5
          }}>
            <input
              type="color"
              value={secondaryColor || "#666666"}
              onChange={(e) => handleColorChange("secondary", e.target.value)}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                opacity: 0,
                cursor: "pointer"
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#0A0A0A",
              marginBottom: "0.25rem"
            }}>
              Sekundärfarbe
            </div>
            <input
              type="text"
              value={secondaryColor}
              onChange={(e) => handleColorChange("secondary", e.target.value)}
              placeholder="Optional"
              style={{
                width: "auto",
                minWidth: "80px",
                padding: "0.375rem 0.5rem",
                fontSize: "0.75rem",
                fontFamily: "monospace",
                border: "1px solid #E5E5E5",
                borderRadius: "4px",
                backgroundColor: "#FFFFFF",
                color: "#0A0A0A"
              }}
              maxLength={7}
            />
          </div>
          {secondaryColor && (
            <button
              type="button"
              onClick={() => handleRemoveColor("secondary")}
              style={{
                padding: "0.5rem",
                color: "#DC2626",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                borderRadius: "4px",
                transition: "background-color 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#FEF2F2"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent"
              }}
              title="Farbe entfernen"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          )}
        </div>

        {/* Accent Color */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.75rem",
          backgroundColor: "#FFFFFF",
          border: "1px solid #E5E5E5",
          borderRadius: "8px"
        }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "6px",
            backgroundColor: accentColor || "#F5F5F5",
            border: "1px solid #E5E5E5",
            flexShrink: 0,
            cursor: "pointer",
            position: "relative",
            opacity: accentColor ? 1 : 0.5
          }}>
            <input
              type="color"
              value={accentColor || "#24c598"}
              onChange={(e) => handleColorChange("accent", e.target.value)}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                opacity: 0,
                cursor: "pointer"
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#0A0A0A",
              marginBottom: "0.25rem"
            }}>
              Akzentfarbe
            </div>
            <input
              type="text"
              value={accentColor}
              onChange={(e) => handleColorChange("accent", e.target.value)}
              placeholder="Optional"
              style={{
                width: "auto",
                minWidth: "80px",
                padding: "0.375rem 0.5rem",
                fontSize: "0.75rem",
                fontFamily: "monospace",
                border: "1px solid #E5E5E5",
                borderRadius: "4px",
                backgroundColor: "#FFFFFF",
                color: "#0A0A0A"
              }}
              maxLength={7}
            />
          </div>
          {accentColor && (
            <button
              type="button"
              onClick={() => handleRemoveColor("accent")}
              style={{
                padding: "0.5rem",
                color: "#DC2626",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                borderRadius: "4px",
                transition: "background-color 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#FEF2F2"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent"
              }}
              title="Farbe entfernen"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
