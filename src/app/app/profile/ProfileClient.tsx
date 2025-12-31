"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { LoadingSpinner } from "@/components/LoadingSpinner"

interface UserProfile {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  name: string | null
  status: string
  lastLoginAt: string | null
  jobTitle: string | null
  phone: string | null
  preferredLanguage: string
  timeZone: string | null
  organizationId: string | null
  organization: {
    id: string
    name: string
    status: string
  } | null
  role: string | null
}

export default function ProfileClient() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form fields
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [phone, setPhone] = useState("")
  const [preferredLanguage, setPreferredLanguage] = useState("en")
  const [timeZone, setTimeZone] = useState("")

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    setLoading(true)
    try {
      const response = await fetch("/api/app/profile", {
        cache: "no-store",
      })
      if (response.ok) {
        const data = await response.json()
        const user = data.user
        setProfile(user)
        setFirstName(user.firstName || "")
        setLastName(user.lastName || "")
        setJobTitle(user.jobTitle || "")
        setPhone(user.phone || "")
        setPreferredLanguage(user.preferredLanguage || "en")
        setTimeZone(user.timeZone || "")
      } else {
        setError("Fehler beim Laden des Profils")
      }
    } catch (err) {
      console.error("Error loading profile:", err)
      setError("Fehler beim Laden des Profils")
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!firstName.trim() || !lastName.trim()) {
      setError("Vorname und Nachname sind erforderlich")
      return
    }

    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/app/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          jobTitle: jobTitle.trim() || null,
          phone: phone.trim() || null,
          preferredLanguage: preferredLanguage,
          timeZone: timeZone.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Aktualisieren des Profils")
      }

      setSuccess("Profil erfolgreich aktualisiert")
      await loadProfile()
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      setError(err.message || "Fehler beim Aktualisieren des Profils")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LoadingSpinner message="Profil wird geladen..." />
      </div>
    )
  }

  if (!profile) {
    return (
      <div>
        <p>Profil nicht gefunden</p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <Link
          href="/app/dashboard"
          style={{
            color: "#7A7A7A",
            textDecoration: "none",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
          }}
        >
          ← Zur Übersicht
        </Link>
      </div>

      <h1 style={{
        fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
        fontWeight: "700",
        color: "#0A0A0A",
        marginBottom: "1rem",
      }}>
        Mein Profil
      </h1>

      {error && (
        <div style={{
          padding: "0.75rem",
          marginBottom: "1rem",
          backgroundColor: "#FEE",
          border: "1px solid #FCC",
          borderRadius: "6px",
          color: "#C33",
          fontSize: "0.9rem",
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: "0.75rem",
          marginBottom: "1rem",
          backgroundColor: "#E8F5E9",
          border: "1px solid #C8E6C9",
          borderRadius: "6px",
          color: "#2E7D32",
          fontSize: "0.9rem",
        }}>
          {success}
        </div>
      )}

      <div style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #CDCDCD",
        borderRadius: "12px",
        padding: "2rem",
        marginBottom: "2rem",
      }}>
        <h2 style={{
          fontSize: "1.25rem",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "1.5rem",
        }}>
          Persönliche Informationen
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
          <div>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "#0A0A0A",
              fontWeight: "500",
              fontSize: "0.9rem",
            }}>
              Vorname *
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "#0A0A0A",
              fontWeight: "500",
              fontSize: "0.9rem",
            }}>
              Nachname *
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "#0A0A0A",
              fontWeight: "500",
              fontSize: "0.9rem",
            }}>
              E-Mail
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                fontSize: "1rem",
                boxSizing: "border-box",
                backgroundColor: "#F5F5F5",
                color: "#7A7A7A",
              }}
            />
          </div>

          <div>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "#0A0A0A",
              fontWeight: "500",
              fontSize: "0.9rem",
            }}>
              Jobtitel
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="z.B. Product Manager"
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "#0A0A0A",
              fontWeight: "500",
              fontSize: "0.9rem",
            }}>
              Telefon
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+49 123 456789"
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "#0A0A0A",
              fontWeight: "500",
              fontSize: "0.9rem",
            }}>
              Bevorzugte Sprache
            </label>
            <select
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
            >
              <option value="en">English</option>
              <option value="de">Deutsch</option>
              <option value="fr">Français</option>
              <option value="es">Español</option>
            </select>
          </div>

          <div>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "#0A0A0A",
              fontWeight: "500",
              fontSize: "0.9rem",
            }}>
              Zeitzone
            </label>
            <input
              type="text"
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              placeholder="z.B. Europe/Berlin"
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "6px",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {profile.organization && (
          <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #CDCDCD" }}>
            <h3 style={{
              fontSize: "1rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem",
            }}>
              Organisation
            </h3>
            <p style={{ color: "#7A7A7A", fontSize: "0.9rem", margin: 0 }}>
              {profile.organization.name}
              {profile.role && ` • ${profile.role}`}
            </p>
          </div>
        )}

        <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: saving ? "#CDCDCD" : "#E20074",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "6px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Wird gespeichert..." : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  )
}

