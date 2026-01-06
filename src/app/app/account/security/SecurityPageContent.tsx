"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

/**
 * Sicherheitseinstellungen
 * 
 * Zeigt 2FA-Status und ermöglicht Super Admins die Einrichtung von 2FA
 */
export function SecurityPageContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [totpEnabled, setTotpEnabled] = useState(false)
  const [setup2FA, setSetup2FA] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [verificationCode, setVerificationCode] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [activating, setActivating] = useState(false)
  
  // Passwort-Änderung States
  const [changingPassword, setChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")

  // Lade 2FA-Status beim Mount
  useEffect(() => {
    async function load2FAStatus() {
      setLoading(true)
      try {
        const response = await fetch("/api/auth/check-2fa", {
          cache: "no-store"
        })

        if (response.ok) {
          const data = await response.json()
          setIsSuperAdmin(data.isSuperAdmin || false)
          setTotpEnabled(data.totpEnabled || false)
        }
      } catch (err) {
        console.error("Error loading 2FA status:", err)
      } finally {
        setLoading(false)
      }
    }

    load2FAStatus()
  }, [])

  // Starte 2FA-Setup
  async function handleStart2FASetup() {
    setError("")
    setSuccess("")
    setSetup2FA(true)

    try {
      const response = await fetch("/api/auth/setup-2fa", {
        method: "GET",
        cache: "no-store"
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Generieren des QR-Codes")
      }

      const data = await response.json()
      setQrCode(data.qrCode)
      setSecret(data.secret)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten")
      setSetup2FA(false)
    }
  }

  // Aktiviere 2FA mit Code
  async function handleActivate2FA() {
    console.log("handleActivate2FA aufgerufen", { 
      verificationCode: verificationCode.trim(), 
      secret: secret ? "vorhanden" : "fehlt",
      verificationCodeLength: verificationCode.trim().length 
    })
    
    if (!verificationCode.trim() || !secret) {
      console.error("Validierung fehlgeschlagen:", { 
        hasCode: !!verificationCode.trim(), 
        hasSecret: !!secret 
      })
      setError("Bitte geben Sie den 6-stelligen Code ein")
      return
    }

    setActivating(true)
    setError("")
    setSuccess("")

    try {
      console.log("Sende 2FA-Aktivierungs-Request:", { 
        secret: secret.substring(0, 4) + "...", 
        codeLength: verificationCode.trim().length 
      })
      
      const response = await fetch("/api/auth/setup-2fa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          secret,
          code: verificationCode.trim()
        })
      })
      
      console.log("Response Status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("2FA-Aktivierung fehlgeschlagen:", errorData)
        
        // Zeige Debug-Informationen, wenn verfügbar
        let errorMessage = errorData.error || "Fehler beim Aktivieren von 2FA"
        if (errorData.debug) {
          errorMessage += `\n\nDebug-Info:\n- Eingegebener Code: ${errorData.debug.providedCode}\n- Aktuell generierter Code: ${errorData.debug.currentGeneratedCode}\n- Hinweis: ${errorData.debug.hint}`
          console.error("Debug-Informationen:", errorData.debug)
        }
        
        throw new Error(errorMessage)
      }
      
      console.log("2FA erfolgreich aktiviert!")

      setSuccess("2FA wurde erfolgreich aktiviert!")
      setTotpEnabled(true) // Status direkt aktualisieren
      setSetup2FA(false)
      setQrCode(null)
      setSecret(null)
      setVerificationCode("")
      
      // Status auch vom Server neu laden zur Sicherheit
      try {
        const statusResponse = await fetch("/api/auth/check-2fa", {
          cache: "no-store"
        })
        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          setIsSuperAdmin(statusData.isSuperAdmin || false)
          setTotpEnabled(statusData.totpEnabled || false)
        }
      } catch (statusErr) {
        console.error("Error reloading 2FA status:", statusErr)
        // Ignorieren, da wir bereits den State aktualisiert haben
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten")
    } finally {
      setActivating(false)
    }
  }

  // Passwort ändern
  async function handleChangePassword() {
    setPasswordError("")
    setPasswordSuccess("")

    // Validierung
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Bitte füllen Sie alle Felder aus")
      return
    }

    if (newPassword.length < 8) {
      setPasswordError("Das neue Passwort muss mindestens 8 Zeichen lang sein")
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Die neuen Passwörter stimmen nicht überein")
      return
    }

    setChangingPassword(true)

    try {
      const response = await fetch("/api/app/account/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Ändern des Passworts")
      }

      setPasswordSuccess("Passwort wurde erfolgreich geändert")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      
      // Success-Message nach 5 Sekunden entfernen
      setTimeout(() => setPasswordSuccess(""), 5000)
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten")
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "400px"
      }}>
        <p style={{ color: "#7A7A7A" }}>Lade Sicherheitseinstellungen...</p>
      </div>
    )
  }

  return (
    <div>
      <div style={{
        marginBottom: "1rem"
      }}>
        <Link
          href="/app/account"
          style={{
            color: "#7A7A7A",
            textDecoration: "none",
            fontSize: "clamp(0.9rem, 2vw, 1rem)"
          }}
        >
          ← Zurück zu Meine Daten
        </Link>
      </div>
      <h1 style={{
        fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
        fontWeight: "700",
        color: "#0A0A0A",
        marginBottom: "1rem"
      }}>
        Sicherheitseinstellungen
      </h1>
      <p style={{
        color: "#7A7A7A",
        fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
        marginBottom: "2rem"
      }}>
        Verwalten Sie Ihre Sicherheitseinstellungen und Zwei-Faktor-Authentifizierung.
      </p>

      {/* Fehler/Success Messages */}
      {error && (
        <div style={{
          backgroundColor: "#FEE2E2",
          border: "1px solid #FCA5A5",
          borderRadius: "8px",
          padding: "1rem",
          marginBottom: "1.5rem",
          color: "#991B1B"
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          backgroundColor: "#D1FAE5",
          border: "1px solid #86EFAC",
          borderRadius: "8px",
          padding: "1rem",
          marginBottom: "1.5rem",
          color: "#065F46"
        }}>
          {success}
        </div>
      )}

      <div style={{
        display: "grid",
        gap: "2rem"
      }}>
        {/* Passwort-Änderung */}
        <div style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          border: "1px solid #CDCDCD",
          padding: "clamp(1.5rem, 4vw, 2rem)"
        }}>
          <h2 style={{
            fontSize: "clamp(1.2rem, 3vw, 1.5rem)",
            fontWeight: "600",
            color: "#0A0A0A",
            marginBottom: "0.5rem"
          }}>
            Passwort ändern
          </h2>
          <p style={{
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            color: "#7A7A7A",
            marginBottom: "1.5rem"
          }}>
            Ändern Sie Ihr Passwort, um die Sicherheit Ihres Kontos zu erhöhen.
          </p>

          {passwordError && (
            <div style={{
              backgroundColor: "#FEE2E2",
              border: "1px solid #FCA5A5",
              borderRadius: "8px",
              padding: "1rem",
              marginBottom: "1.5rem",
              color: "#991B1B"
            }}>
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div style={{
              backgroundColor: "#D1FAE5",
              border: "1px solid #86EFAC",
              borderRadius: "8px",
              padding: "1rem",
              marginBottom: "1.5rem",
              color: "#065F46"
            }}>
              {passwordSuccess}
            </div>
          )}

          <div style={{
            display: "grid",
            gap: "1.5rem"
          }}>
            {/* Aktuelles Passwort */}
            <div>
              <label style={{
                display: "block",
                fontSize: "clamp(0.9rem, 2vw, 1rem)",
                fontWeight: "600",
                color: "#0A0A0A",
                marginBottom: "0.5rem"
              }}>
                Aktuelles Passwort <span style={{ color: "#24c598" }}>*</span>
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Aktuelles Passwort"
                style={{
                  width: "100%",
                  padding: "clamp(0.75rem, 2vw, 1rem)",
                  fontSize: "clamp(0.9rem, 2vw, 1rem)",
                  border: "1px solid #CDCDCD",
                  borderRadius: "8px",
                  color: "#0A0A0A",
                  backgroundColor: "#FFFFFF"
                }}
              />
            </div>

            {/* Neues Passwort */}
            <div>
              <label style={{
                display: "block",
                fontSize: "clamp(0.9rem, 2vw, 1rem)",
                fontWeight: "600",
                color: "#0A0A0A",
                marginBottom: "0.5rem"
              }}>
                Neues Passwort <span style={{ color: "#24c598" }}>*</span>
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Neues Passwort (mind. 8 Zeichen)"
                style={{
                  width: "100%",
                  padding: "clamp(0.75rem, 2vw, 1rem)",
                  fontSize: "clamp(0.9rem, 2vw, 1rem)",
                  border: "1px solid #CDCDCD",
                  borderRadius: "8px",
                  color: "#0A0A0A",
                  backgroundColor: "#FFFFFF"
                }}
              />
              <p style={{
                fontSize: "clamp(0.8rem, 1.5vw, 0.85rem)",
                color: "#7A7A7A",
                marginTop: "0.5rem",
                margin: "0.5rem 0 0 0"
              }}>
                Das Passwort muss mindestens 8 Zeichen lang sein.
              </p>
            </div>

            {/* Passwort bestätigen */}
            <div>
              <label style={{
                display: "block",
                fontSize: "clamp(0.9rem, 2vw, 1rem)",
                fontWeight: "600",
                color: "#0A0A0A",
                marginBottom: "0.5rem"
              }}>
                Neues Passwort bestätigen <span style={{ color: "#24c598" }}>*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Neues Passwort wiederholen"
                style={{
                  width: "100%",
                  padding: "clamp(0.75rem, 2vw, 1rem)",
                  fontSize: "clamp(0.9rem, 2vw, 1rem)",
                  border: "1px solid #CDCDCD",
                  borderRadius: "8px",
                  color: "#0A0A0A",
                  backgroundColor: "#FFFFFF"
                }}
              />
            </div>
          </div>

          {/* Button */}
          <button
            onClick={handleChangePassword}
            disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
            style={{
              backgroundColor: changingPassword || !currentPassword || !newPassword || !confirmPassword ? "#7A7A7A" : "#24c598",
              color: "#FFFFFF",
              border: "none",
              padding: "clamp(0.875rem, 2.5vw, 1rem) clamp(1.5rem, 4vw, 2rem)",
              borderRadius: "8px",
              fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
              fontWeight: "600",
              cursor: changingPassword || !currentPassword || !newPassword || !confirmPassword ? "not-allowed" : "pointer",
              boxShadow: changingPassword || !currentPassword || !newPassword || !confirmPassword ? "none" : "0 4px 12px rgba(226, 0, 116, 0.3)",
              marginTop: "1.5rem"
            }}
          >
            {changingPassword ? "Passwort wird geändert..." : "Passwort ändern"}
          </button>
        </div>

        {/* 2FA Section */}
        <div style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          border: "1px solid #CDCDCD",
          padding: "clamp(1.5rem, 4vw, 2rem)"
        }}>
          {/* Super Admin Status */}
          <div style={{
            marginBottom: "2rem",
            paddingBottom: "2rem",
            borderBottom: "1px solid #E5E5E5"
          }}>
            <h2 style={{
              fontSize: "clamp(1.2rem, 3vw, 1.5rem)",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Rollenstatus
            </h2>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem"
            }}>
              {isSuperAdmin ? (
                <>
                  <span style={{
                    backgroundColor: "#24c598",
                    color: "#FFFFFF",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "6px",
                    fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
                    fontWeight: "600"
                  }}>
                    Super Admin
                  </span>
                  <p style={{
                    fontSize: "clamp(0.9rem, 2vw, 1rem)",
                    color: "#7A7A7A",
                    margin: 0
                  }}>
                    Sie haben Vollzugriff auf alle Funktionen und Daten.
                  </p>
                </>
              ) : (
                <p style={{
                  fontSize: "clamp(0.9rem, 2vw, 1rem)",
                  color: "#7A7A7A",
                  margin: 0
                }}>
                  Standardbenutzer
                </p>
              )}
            </div>
          </div>

          <h2 style={{
            fontSize: "clamp(1.2rem, 3vw, 1.5rem)",
            fontWeight: "600",
            color: "#0A0A0A",
            marginBottom: "0.5rem"
          }}>
            Zwei-Faktor-Authentifizierung (2FA)
          </h2>
          <p style={{
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            color: "#7A7A7A",
            marginBottom: "1.5rem"
          }}>
            {isSuperAdmin 
              ? "Als Super Admin können Sie 2FA mit einem Authenticator-App (z.B. Google Authenticator) einrichten, um zusätzliche Sicherheit zu gewährleisten."
              : "2FA ist nur für Super Admins verfügbar."
            }
          </p>

          {isSuperAdmin && (
            <>
              {/* 2FA Status */}
              <div style={{
                marginBottom: "1.5rem"
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  marginBottom: "1rem"
                }}>
                  <div style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: totpEnabled ? "#10B981" : "#EF4444"
                  }} />
                  <span style={{
                    fontSize: "clamp(0.9rem, 2vw, 1rem)",
                    fontWeight: "600",
                    color: "#0A0A0A"
                  }}>
                    {totpEnabled ? "2FA ist aktiviert" : "2FA ist nicht aktiviert"}
                  </span>
                </div>
              </div>

              {/* 2FA Setup */}
              {!totpEnabled && !setup2FA && (
                <button
                  onClick={handleStart2FASetup}
                  style={{
                    backgroundColor: "#24c598",
                    color: "#FFFFFF",
                    border: "none",
                    padding: "clamp(0.875rem, 2.5vw, 1rem) clamp(1.5rem, 4vw, 2rem)",
                    borderRadius: "8px",
                    fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
                    fontWeight: "600",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(226, 0, 116, 0.3)"
                  }}
                >
                  2FA einrichten
                </button>
              )}

              {/* QR Code Setup */}
              {setup2FA && qrCode && secret && (
                <div style={{
                  backgroundColor: "#F5F5F5",
                  borderRadius: "8px",
                  padding: "1.5rem",
                  marginTop: "1.5rem"
                }}>
                  <h3 style={{
                    fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
                    fontWeight: "600",
                    color: "#0A0A0A",
                    marginBottom: "1rem"
                  }}>
                    Schritt 1: QR-Code scannen
                  </h3>
                  <p style={{
                    fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
                    color: "#7A7A7A",
                    marginBottom: "1rem"
                  }}>
                    Öffnen Sie Ihre Authenticator-App (z.B. Google Authenticator, Authy) und scannen Sie diesen QR-Code:
                  </p>
                  
                  <div style={{
                    display: "flex",
                    justifyContent: "center",
                    marginBottom: "1.5rem"
                  }}>
                    <div style={{
                      backgroundColor: "#FFFFFF",
                      padding: "1rem",
                      borderRadius: "8px",
                      display: "inline-block"
                    }}>
                      <img 
                        src={qrCode}
                        alt="2FA QR Code"
                        style={{
                          width: "200px",
                          height: "200px",
                          display: "block"
                        }}
                      />
                    </div>
                  </div>

                  <h3 style={{
                    fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
                    fontWeight: "600",
                    color: "#0A0A0A",
                    marginTop: "1.5rem",
                    marginBottom: "1rem"
                  }}>
                    Schritt 2: Code eingeben
                  </h3>
                  <p style={{
                    fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
                    color: "#7A7A7A",
                    marginBottom: "1rem"
                  }}>
                    Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein, um 2FA zu aktivieren:
                  </p>

                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem"
                  }}>
                    <div style={{ width: "100%" }}>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        style={{
                          width: "100%",
                          maxWidth: "100%",
                          boxSizing: "border-box",
                          padding: "clamp(0.75rem, 2vw, 1rem)",
                          fontSize: "clamp(1.2rem, 3vw, 1.5rem)",
                          textAlign: "center",
                          letterSpacing: "0.5rem",
                          fontFamily: "monospace",
                          border: "1px solid #CDCDCD",
                          borderRadius: "8px",
                          color: "#0A0A0A",
                          backgroundColor: "#FFFFFF"
                        }}
                      />
                    </div>
                    <div style={{
                      display: "flex",
                      gap: "1rem",
                      width: "100%"
                    }}>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          console.log("Button onClick ausgelöst", { 
                            verificationCode, 
                            length: verificationCode.length,
                            trimmed: verificationCode.trim().length,
                            secret: secret ? "vorhanden" : "fehlt"
                          })
                          handleActivate2FA()
                        }}
                        disabled={activating || verificationCode.trim().replace(/\D/g, "").length !== 6}
                        style={{
                          flex: 1,
                          backgroundColor: activating || verificationCode.length !== 6 ? "#7A7A7A" : "#24c598",
                          color: "#FFFFFF",
                          border: "none",
                          padding: "clamp(0.875rem, 2.5vw, 1rem) clamp(1.5rem, 4vw, 2rem)",
                          borderRadius: "8px",
                          fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
                          fontWeight: "600",
                          cursor: activating || verificationCode.length !== 6 ? "not-allowed" : "pointer",
                          boxShadow: activating || verificationCode.length !== 6 ? "none" : "0 4px 12px rgba(226, 0, 116, 0.3)"
                        }}
                      >
                        {activating ? "Aktiviere..." : "Aktivieren"}
                      </button>
                      <button
                        onClick={() => {
                          setSetup2FA(false)
                          setQrCode(null)
                          setSecret(null)
                          setVerificationCode("")
                          setError("")
                        }}
                        style={{
                          backgroundColor: "transparent",
                          color: "#7A7A7A",
                          border: "1px solid #CDCDCD",
                          padding: "clamp(0.875rem, 2.5vw, 1rem) clamp(1.5rem, 4vw, 2rem)",
                          borderRadius: "8px",
                          fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

