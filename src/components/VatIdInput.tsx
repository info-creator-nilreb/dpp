"use client"

import { useState, useEffect, useRef } from "react"

interface VatIdInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  style?: React.CSSProperties
}

type ValidationState = "idle" | "validating" | "valid" | "invalid" | "error"

/**
 * VAT-ID Input-Komponente mit VIES-Validierung
 * 
 * Validiert die VAT-ID automatisch beim Verlassen des Feldes (onBlur)
 * und zeigt visuelles Feedback.
 */
export default function VatIdInput({
  id,
  label,
  value,
  onChange,
  placeholder = "z.B. DE123456789",
  disabled = false,
  style
}: VatIdInputProps) {
  const [validationState, setValidationState] = useState<ValidationState>("idle")
  const [validationMessage, setValidationMessage] = useState<string>("")
  const [lastValidatedValue, setLastValidatedValue] = useState<string>("")
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Validiere VAT-ID über API
  const validateVatId = async (vatId: string) => {
    if (!vatId || vatId.trim().length === 0) {
      setValidationState("idle")
      setValidationMessage("")
      setLastValidatedValue("")
      return
    }

    // Wenn sich der Wert nicht geändert hat, nicht erneut validieren
    if (vatId === lastValidatedValue) {
      return
    }

    setValidationState("validating")
    setValidationMessage("")

    try {
      const response = await fetch("/api/vat/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ vatId }),
      })

      const data = await response.json()

      if (data.valid) {
        setValidationState("valid")
        setValidationMessage(data.companyName ? `Gültig: ${data.companyName}` : "VAT-ID ist gültig")
        setLastValidatedValue(vatId)
      } else {
        setValidationState("invalid")
        setValidationMessage(data.error || "VAT-ID ist ungültig")
        setLastValidatedValue(vatId)
      }
    } catch (error) {
      setValidationState("error")
      setValidationMessage("Fehler bei der Validierung. Bitte versuchen Sie es später erneut.")
    }
  }

  // Validiere mit Debounce beim Eingeben (nach 1 Sekunde Inaktivität)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)

    // Reset validation state wenn sich der Wert ändert
    if (newValue !== lastValidatedValue) {
      setValidationState("idle")
      setValidationMessage("")
    }

    // Debounce validation
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current)
    }

    // Wenn Feld leer ist, nicht validieren
    if (!newValue || newValue.trim().length === 0) {
      setValidationState("idle")
      setValidationMessage("")
      setLastValidatedValue("")
      return
    }

    // Validiere nach 1 Sekunde Inaktivität
    validationTimeoutRef.current = setTimeout(() => {
      validateVatId(newValue)
    }, 1000)
  }

  // Validiere auch beim Verlassen des Feldes
  const handleBlur = () => {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current)
    }

    if (value && value.trim().length > 0) {
      validateVatId(value)
    }
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }
    }
  }, [])

  // Bestimme Border-Farbe basierend auf Validation State
  const getBorderColor = () => {
    switch (validationState) {
      case "valid":
        return "#22C55E" // Grün
      case "invalid":
        return "#EF4444" // Rot
      case "validating":
        return "#24c598" // Akzentfarbe während Validierung
      case "error":
        return "#F59E0B" // Orange für Fehler
      default:
        return "#CDCDCD" // Standard grau
    }
  }

  return (
    <div style={style}>
      <label style={{
        display: "block",
        marginBottom: "0.5rem",
        color: "#0A0A0A",
        fontWeight: "500",
        fontSize: "0.9rem",
      }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          type="text"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            width: "100%",
            padding: "0.75rem",
            paddingRight: validationState === "validating" ? "2.5rem" : "2.5rem",
            border: `1px solid ${getBorderColor()}`,
            borderRadius: "6px",
            fontSize: "1rem",
            boxSizing: "border-box",
            transition: "border-color 0.2s",
            backgroundColor: disabled ? "#F5F5F5" : "#FFFFFF",
            color: disabled ? "#7A7A7A" : "#0A0A0A",
          }}
        />
        {/* Validierungs-Icon */}
        {validationState === "validating" && (
          <div style={{
            position: "absolute",
            right: "0.75rem",
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
            color: "#24c598"
          }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                animation: "rotation 1s linear infinite"
              }}
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        )}
        {validationState === "valid" && (
          <div style={{
            position: "absolute",
            right: "0.75rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#22C55E",
            display: "flex",
            alignItems: "center"
          }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
        )}
        {validationState === "invalid" && (
          <div style={{
            position: "absolute",
            right: "0.75rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#EF4444",
            display: "flex",
            alignItems: "center"
          }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
        )}
      </div>
      {/* Validierungs-Nachricht */}
      {validationMessage && (
        <p style={{
          fontSize: "0.85rem",
          color: validationState === "valid" ? "#22C55E" : 
                 validationState === "invalid" ? "#EF4444" : 
                 validationState === "error" ? "#F59E0B" : "#7A7A7A",
          marginTop: "0.5rem",
          marginBottom: 0,
          display: "flex",
          alignItems: "center",
          gap: "0.25rem"
        }}>
          {validationMessage}
        </p>
      )}
      {/* CSS für Spinner-Animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes rotation {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `
      }} />
    </div>
  )
}

