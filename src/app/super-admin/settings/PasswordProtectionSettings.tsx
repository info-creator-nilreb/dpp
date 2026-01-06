"use client"

import { useState, useEffect } from "react"
import { PasswordProtectionConfig } from "@/lib/password-protection"

interface PasswordProtectionSettingsProps {
  initialConfig: PasswordProtectionConfig | null
  adminId: string
}

export default function PasswordProtectionSettings({
  initialConfig,
  adminId,
}: PasswordProtectionSettingsProps) {
  const [enabled, setEnabled] = useState(initialConfig?.passwordProtectionEnabled ?? false)
  const [startDate, setStartDate] = useState(
    initialConfig?.passwordProtectionStartDate 
      ? new Date(initialConfig.passwordProtectionStartDate).toISOString().slice(0, 16)
      : ""
  )
  const [endDate, setEndDate] = useState(
    initialConfig?.passwordProtectionEndDate 
      ? new Date(initialConfig.passwordProtectionEndDate).toISOString().slice(0, 16)
      : ""
  )
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isActive, setIsActive] = useState(false)

  // Check if protection is currently active
  useEffect(() => {
    checkProtectionStatus()
    // Refresh status every 30 seconds
    const interval = setInterval(checkProtectionStatus, 30000)
    return () => clearInterval(interval)
  }, [enabled, startDate, endDate])

  const checkProtectionStatus = async () => {
    try {
      const response = await fetch("/api/super-admin/settings/password-protection/status")
      if (response.ok) {
        const data = await response.json()
        setIsActive(data.isActive)
      }
    } catch (err) {
      console.error("Error checking protection status:", err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const body: any = {
        passwordProtectionEnabled: enabled,
        passwordProtectionStartDate: startDate ? new Date(startDate).toISOString() : null,
        passwordProtectionEndDate: endDate ? new Date(endDate).toISOString() : null,
        passwordProtectionSessionTimeoutMinutes: 60,
      }

      // Only include password if it's provided (not empty)
      if (password.trim()) {
        body.passwordProtectionPasswordHash = password
      }

      const response = await fetch("/api/super-admin/settings/password-protection", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Fehler beim Speichern der Einstellungen")
        setLoading(false)
        return
      }

      setSuccess("Einstellungen erfolgreich gespeichert")
      setPassword("") // Clear password field after successful save
      setLoading(false)
      
      // Refresh status
      setTimeout(checkProtectionStatus, 1000)
    } catch (err: any) {
      console.error("Error saving settings:", err)
      setError("Ein Fehler ist aufgetreten")
      setLoading(false)
    }
  }

  const now = new Date().toISOString().slice(0, 16)

  return (
    <div style={{
      backgroundColor: "#FFFFFF",
      borderRadius: "12px",
      border: "1px solid #E5E5E5",
      padding: "2rem",
      marginBottom: "2rem"
    }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{
          fontSize: "1.25rem",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          Password Protection (Closed Alpha / Pre-Launch)
        </h2>
        <p style={{ color: "#7A7A7A", fontSize: "0.9rem", lineHeight: "1.5" }}>
          Globales Passwort-Tor für alle Seiten außer dem Super Admin Bereich. 
          Schutz wird aktiviert, wenn "Aktiviert" aktiviert ist oder das aktuelle Datum innerhalb des Zeitraums liegt.
        </p>
        {isActive && (
          <div style={{
            marginTop: "1rem",
            padding: "0.75rem",
            backgroundColor: "#FEF3C7",
            border: "1px solid #FCD34D",
            borderRadius: "6px",
            color: "#92400E",
            fontSize: "0.9rem"
          }}>
            <strong>Status:</strong> Password Protection ist derzeit <strong>AKTIV</strong>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{
            padding: "0.75rem",
            marginBottom: "1rem",
            backgroundColor: "#FEE",
            border: "1px solid #FCC",
            borderRadius: "6px",
            color: "#C33",
            fontSize: "0.9rem"
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: "0.75rem",
            marginBottom: "1rem",
            backgroundColor: "#DEF",
            border: "1px solid #BCD",
            borderRadius: "6px",
            color: "#036",
            fontSize: "0.9rem"
          }}>
            {success}
          </div>
        )}

        {/* Enabled Toggle */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            cursor: "pointer"
          }}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              style={{
                width: "20px",
                height: "20px",
                cursor: "pointer"
              }}
            />
            <span style={{
              fontWeight: "500",
              color: "#0A0A0A",
              fontSize: "0.95rem"
            }}>
              Aktiviert (Manueller Toggle - überschreibt Datumslogik)
            </span>
          </label>
          <p style={{
            color: "#7A7A7A",
            fontSize: "0.85rem",
            marginTop: "0.25rem",
            marginLeft: "2.75rem"
          }}>
            Wenn aktiviert, ist Password Protection unabhängig vom Datumsbereich aktiv.
          </p>
        </div>

        {/* Date Range */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{
            display: "block",
            marginBottom: "0.5rem",
            fontWeight: "500",
            color: "#0A0A0A",
            fontSize: "0.95rem"
          }}>
            Startdatum (optional)
          </label>
          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={now}
            style={{
              width: "100%",
              maxWidth: "400px",
              padding: "0.75rem",
              border: "1px solid #CDCDCD",
              borderRadius: "6px",
              fontSize: "0.95rem",
              boxSizing: "border-box"
            }}
          />
          <p style={{
            color: "#7A7A7A",
            fontSize: "0.85rem",
            marginTop: "0.25rem"
          }}>
            Optional: Schutz wird ab diesem Datum aktiviert (wenn nicht manuell aktiviert).
          </p>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{
            display: "block",
            marginBottom: "0.5rem",
            fontWeight: "500",
            color: "#0A0A0A",
            fontSize: "0.95rem"
          }}>
            Enddatum (optional)
          </label>
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || now}
            style={{
              width: "100%",
              maxWidth: "400px",
              padding: "0.75rem",
              border: "1px solid #CDCDCD",
              borderRadius: "6px",
              fontSize: "0.95rem",
              boxSizing: "border-box"
            }}
          />
          <p style={{
            color: "#7A7A7A",
            fontSize: "0.85rem",
            marginTop: "0.25rem"
          }}>
            Optional: Schutz wird bis zu diesem Datum aktiviert (wenn nicht manuell aktiviert).
          </p>
        </div>

        {/* Password */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{
            display: "block",
            marginBottom: "0.5rem",
            fontWeight: "500",
            color: "#0A0A0A",
            fontSize: "0.95rem"
          }}>
            Passwort
          </label>
          <div style={{ position: "relative", maxWidth: "400px" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leer lassen, um aktuelles Passwort beizubehalten"
              style={{
                width: "100%",
                padding: "0.75rem",
                paddingRight: "3rem",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                fontSize: "0.95rem",
                boxSizing: "border-box"
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
              style={{
                position: "absolute",
                right: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0.5rem",
                color: "#24c598"
              }}
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
          <p style={{
            color: "#7A7A7A",
            fontSize: "0.85rem",
            marginTop: "0.25rem"
          }}>
            Neues Passwort setzen (nur eingeben, wenn Sie das Passwort ändern möchten).
          </p>
        </div>

        {/* Session Timeout Info */}
        <div style={{
          padding: "1rem",
          backgroundColor: "#F5F5F5",
          borderRadius: "6px",
          marginBottom: "1.5rem"
        }}>
          <p style={{
            color: "#0A0A0A",
            fontSize: "0.9rem",
            margin: 0
          }}>
            <strong>Session-Timeout:</strong> 60 Minuten Inaktivität erfordert erneute Passworteingabe.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: loading ? "#CDCDCD" : "#24c598",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "6px",
            fontSize: "0.95rem",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Wird gespeichert..." : "Einstellungen speichern"}
        </button>
      </form>
    </div>
  )
}

