"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { PreflightResponse, PreflightResult } from "@/lib/preflight/types"
import FileUploadArea from "@/components/FileUploadArea"
import { useNotification } from "@/components/NotificationProvider"

/**
 * KI-unterstützte DPP-Erstellung
 * 
 * Ermöglicht die Analyse von Produktdaten aus PDF oder Website
 */
export default function AiStartDppContent() {
  const router = useRouter()
  const [sourceType, setSourceType] = useState<"pdf" | "url" | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [url, setUrl] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<PreflightResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { showNotification } = useNotification()
  const [showLeaveWarning, setShowLeaveWarning] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const [dataTransferred, setDataTransferred] = useState(false) // Track if data was transferred to DPP form

  // URL Validierung (basic)
  const isValidUrl = (urlString: string): boolean => {
    try {
      const urlObj = new URL(urlString)
      return urlObj.protocol === "http:" || urlObj.protocol === "https:"
    } catch {
      return false
    }
  }

  // PDF File Selection
  const handlePdfFileSelect = (file: File) => {
    setSourceType("pdf")
    setUrl("") // Clear URL when PDF is selected
    setPdfFile(file)
  }

  // URL Input
  const handleUrlSelect = () => {
    setSourceType("url")
    setPdfFile(null) // Clear PDF when URL is selected
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value)
  }

  // Check if analysis can be started
  const canStartAnalysis = () => {
    if (sourceType === "pdf" && pdfFile) return true
    if (sourceType === "url" && url.trim() && isValidUrl(url.trim())) return true
    return false
  }

  // Start Analysis
  const handleStartAnalysis = async () => {
    if (!canStartAnalysis()) return

    setIsAnalyzing(true)
    setError(null)
    setAnalysisResult(null)

    try {
      let response: Response

      if (sourceType === "pdf" && pdfFile) {
        // PDF Upload
        const formData = new FormData()
        formData.append("file", pdfFile)

        response = await fetch("/api/app/dpps/preflight/pdf", {
          method: "POST",
          body: formData,
        })
      } else if (sourceType === "url" && url.trim()) {
        // URL Analysis
        response = await fetch("/api/app/dpps/preflight/url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: url.trim() }),
        })
      } else {
        throw new Error("Ungültige Quelle")
      }

      if (!response.ok) {
        let errorMessage = "Analyse fehlgeschlagen"
        try {
          const contentType = response.headers.get("content-type")
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } else {
            // If response is not JSON (e.g. HTML error page), read as text for debugging
            const text = await response.text()
            console.error("Non-JSON error response:", text.substring(0, 200))
            errorMessage = `HTTP ${response.status}: ${response.statusText || "Fehler"}`
          }
        } catch (parseError) {
          // If parsing fails completely, use status text
          errorMessage = `HTTP ${response.status}: ${response.statusText || "Fehler"}`
        }
        throw new Error(errorMessage)
      }

      const data: PreflightResponse = await response.json()
      setAnalysisResult(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Ein Fehler ist aufgetreten"
      setError(errorMessage)
      console.error("Analysis error:", err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Reset to start new analysis
  const handleReset = () => {
    setAnalysisResult(null)
    setError(null)
    setPdfFile(null)
    setUrl("")
    setSourceType(null)
    setDataTransferred(false) // Reset data transfer flag
  }
  
  // Prüft ob ungespeicherte Änderungen vorliegen
  const hasUnsavedChanges = (): boolean => {
    if (dataTransferred) return false // Daten wurden bereits übertragen
    
    // Ungespeichert wenn: PDF/URL ausgewählt oder Analyse gestartet/abgeschlossen
    return !!pdfFile || (url.trim().length > 0) || isAnalyzing || !!analysisResult
  }
  
  // Browser beforeunload Event
  useEffect(() => {
    if (!hasUnsavedChanges()) return
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
      return ""
    }
    
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [pdfFile, url, isAnalyzing, analysisResult, dataTransferred])
  
  // Navigation-Handler für Back-Link
  const handleBackClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (hasUnsavedChanges()) {
      e.preventDefault()
      setPendingNavigation("/app/create")
      setShowLeaveWarning(true)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <a
          href="/app/create"
          onClick={handleBackClick}
          style={{
            color: "#7A7A7A",
            textDecoration: "none",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            cursor: "pointer"
          }}
        >
          ← Zurück zur Auswahl
        </a>
      </div>
      <h1 style={{
        fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
        fontWeight: "700",
        color: "#0A0A0A",
        marginBottom: "1rem"
      }}>
        KI-unterstützt starten
      </h1>
      <p style={{
        color: "#7A7A7A",
        fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
        marginBottom: "2rem"
      }}>
        Vorhandene Produktdaten analysieren und Pflichtfelder automatisch vorprüfen.
      </p>

      {/* Guidance Block */}
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{
          fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
          fontWeight: "700",
          color: "#0A0A0A",
          marginBottom: "0.75rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill="none"
            stroke="#24c598"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
            style={{ flexShrink: 0 }}
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          Was passiert hier?
        </h2>
        <p style={{
          color: "#0A0A0A",
          fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
          marginBottom: "0.5rem",
          lineHeight: "1.6"
        }}>
          Sie laden vorhandene Produktinformationen hoch – zum Beispiel ein Datenblatt
          oder eine Produktseite. Wir schauen uns die Inhalte an und prüfen,
          welche Pflichtangaben für den Digitalen Produktpass bereits vorhanden sind.
        </p>
        <p style={{
          color: "#7A7A7A",
          fontSize: "clamp(0.9rem, 2vw, 1rem)",
          marginBottom: "0.5rem"
        }}>
          Das dauert nur wenige Sekunden.
        </p>
        <p style={{
          color: "#7A7A7A",
          fontSize: "clamp(0.85rem, 1.8vw, 0.95rem)",
          fontStyle: "italic",
          margin: 0
        }}>
          Es wird noch kein Digitaler Produktpass erstellt.
        </p>
      </div>

      {/* Source Selection (only show if no result) */}
      {!analysisResult && (
      <div style={{
        backgroundColor: "#FFFFFF",
        padding: "clamp(1.5rem, 4vw, 2rem)",
        borderRadius: "12px",
        border: "1px solid #CDCDCD",
        marginBottom: "1.5rem"
      }}>
        <h2 style={{
          fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
          fontWeight: "700",
          color: "#0A0A0A",
          marginBottom: "1rem"
        }}>
          Datenquelle wählen
        </h2>

        {/* Option A: PDF Upload */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "0.5rem"
          }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              fill="none"
              stroke="#24c598"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
              style={{ flexShrink: 0 }}
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <label style={{
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              fontWeight: "600",
              color: "#0A0A0A"
            }}>
              PDF hochladen
            </label>
          </div>
          <FileUploadArea
            accept=".pdf,application/pdf"
            maxSize={10 * 1024 * 1024} // 10 MB
            onFileSelect={handlePdfFileSelect}
            disabled={isAnalyzing || sourceType === "url"}
            label={undefined}
            description="Zum Beispiel ein Datenblatt oder eine Produktbeschreibung."
          />
          {pdfFile && (
            <div style={{
              marginTop: "0.75rem",
              padding: "0.75rem",
              backgroundColor: "#F5F5F5",
              borderRadius: "6px",
              border: "1px solid #CDCDCD",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                flex: 1,
                minWidth: 0
              }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="#7A7A7A"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: "#0A0A0A",
                    fontSize: "clamp(0.9rem, 2vw, 1rem)",
                    fontWeight: "500",
                    marginBottom: "0.25rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>
                    {pdfFile.name}
                  </div>
                  <div style={{
                    color: "#7A7A7A",
                    fontSize: "clamp(0.75rem, 1.8vw, 0.85rem)"
                  }}>
                    {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPdfFile(null)
                  setSourceType(null)
                  showNotification("Datei entfernt", "success")
                }}
                style={{
                  padding: "0.5rem",
                  backgroundColor: "transparent",
                  border: "1px solid #CDCDCD",
                  borderRadius: "6px",
                  color: "#24c598",
                  fontSize: "clamp(0.8rem, 2vw, 0.9rem)",
                  cursor: "pointer",
                  fontWeight: "500",
                  flexShrink: 0,
                  whiteSpace: "nowrap"
                }}
              >
                Entfernen
              </button>
            </div>
          )}
        </div>

        {/* Option B: Website URL */}
        <div>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            fontWeight: "600",
            color: "#0A0A0A",
            marginBottom: "0.5rem"
          }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              fill="none"
              stroke="#24c598"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
              style={{ flexShrink: 0 }}
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            Website URL
          </label>
          <p style={{
            color: "#7A7A7A",
            fontSize: "clamp(0.85rem, 1.8vw, 0.95rem)",
            marginBottom: "0.75rem"
          }}>
            Eine Produktseite mit Infos zu Material, Hersteller oder Herkunft.
          </p>
          <input
            type="url"
            value={url}
            onChange={handleUrlChange}
            onClick={handleUrlSelect}
            onFocus={handleUrlSelect}
            placeholder="https://example.com"
            disabled={isAnalyzing || sourceType === "pdf"}
            style={{
              width: "100%",
              maxWidth: "500px",
              padding: "clamp(0.75rem, 2vw, 1rem)",
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              border: "1px solid",
              borderColor: sourceType === "url" ? "#24c598" : "#CDCDCD",
              borderRadius: "8px",
              backgroundColor: "#FFFFFF",
              color: "#0A0A0A",
              boxSizing: "border-box",
              opacity: (isAnalyzing || sourceType === "pdf") ? 0.5 : 1,
              cursor: (isAnalyzing || sourceType === "pdf") ? "not-allowed" : "text"
            }}
          />
        </div>
      </div>
      )}

      {/* Primary Action Button (only show if no result) */}
      {!analysisResult && (
      <div style={{ marginBottom: "1.5rem" }}>
        <button
          onClick={handleStartAnalysis}
          disabled={!canStartAnalysis() || isAnalyzing}
          style={{
            backgroundColor: canStartAnalysis() && !isAnalyzing ? "#24c598" : "#CDCDCD",
            color: "#FFFFFF",
            border: "none",
            padding: "clamp(0.875rem, 2.5vw, 1rem) clamp(1.5rem, 4vw, 2rem)",
            borderRadius: "8px",
            fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
            fontWeight: "600",
            cursor: canStartAnalysis() && !isAnalyzing ? "pointer" : "not-allowed",
            boxShadow: canStartAnalysis() && !isAnalyzing ? "0 4px 12px rgba(226, 0, 116, 0.3)" : "none",
            marginBottom: "0.5rem"
          }}
        >
          {isAnalyzing ? "Analysiere..." : "Analyse starten"}
        </button>
        <p style={{
          color: "#7A7A7A",
          fontSize: "clamp(0.85rem, 1.8vw, 0.95rem)",
          marginBottom: "0.25rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="none"
            stroke="#24c598"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
            style={{ flexShrink: 0 }}
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          Wir prüfen die Angaben automatisch und zeigen Ihnen das Ergebnis.
        </p>
        <p style={{
          color: "#7A7A7A",
          fontSize: "clamp(0.8rem, 1.6vw, 0.85rem)",
          margin: 0
        }}>
          Keine rechtliche Bewertung.
        </p>
      </div>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <div style={{
          backgroundColor: "#FFFFFF",
          padding: "clamp(1.5rem, 4vw, 2rem)",
          borderRadius: "12px",
          border: "1px solid #CDCDCD",
          marginBottom: "1.5rem"
        }}>
          <AiAnalysisLoadingSpinner sourceType={sourceType} />
        </div>
      )}

      {/* Error State */}
      {error && !isAnalyzing && (
        <div style={{
          backgroundColor: "#FFFFFF",
          padding: "clamp(1.5rem, 4vw, 2rem)",
          borderRadius: "12px",
          border: "1px solid #CDCDCD",
          marginBottom: "1.5rem"
        }}>
          <p style={{
            color: "#DC2626",
            fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
            marginBottom: "1rem",
            fontWeight: "600"
          }}>
            Fehler bei der Analyse
          </p>
          <p style={{
            color: "#7A7A7A",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            marginBottom: "1rem"
          }}>
            {error}
          </p>
          <button
            onClick={handleReset}
            style={{
              padding: "clamp(0.6875rem, 2vw, 0.875rem) clamp(1rem, 2.5vw, 1.5rem)",
              backgroundColor: "#24c598",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "6px",
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Erneut versuchen
          </button>
        </div>
      )}

      {/* Result State */}
      {analysisResult && !isAnalyzing && (
        <ResultSection 
          result={analysisResult} 
          onReset={handleReset}
          onDataTransferred={() => setDataTransferred(true)}
        />
      )}
      
      {/* Warnung beim Verlassen */}
      {showLeaveWarning && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
          padding: "1rem"
        }}>
          <div style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            padding: "clamp(1.5rem, 4vw, 2rem)",
            maxWidth: "500px",
            width: "100%",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)"
          }}>
            <h3 style={{
              fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
              fontWeight: "700",
              color: "#0A0A0A",
              marginBottom: "1rem"
            }}>
              Seite verlassen?
            </h3>
            <p style={{
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              color: "#7A7A7A",
              marginBottom: "1.5rem",
              lineHeight: "1.6"
            }}>
              Sie haben die Daten noch nicht gespeichert. Beim Verlassen der Seite gehen diese verloren.
            </p>
            <div style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "flex-end"
            }}>
              <button
                onClick={() => {
                  setShowLeaveWarning(false)
                  setPendingNavigation(null)
                }}
                style={{
                  padding: "clamp(0.875rem, 2.5vw, 1rem) clamp(1.5rem, 4vw, 2rem)",
                  backgroundColor: "#FFFFFF",
                  color: "#0A0A0A",
                  border: "1px solid #CDCDCD",
                  borderRadius: "8px",
                  fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  setShowLeaveWarning(false)
                  if (pendingNavigation) {
                    router.push(pendingNavigation)
                  } else {
                    router.back()
                  }
                  setPendingNavigation(null)
                }}
                style={{
                  padding: "clamp(0.875rem, 2.5vw, 1rem) clamp(1.5rem, 4vw, 2rem)",
                  backgroundColor: "#24c598",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(226, 0, 116, 0.3)"
                }}
              >
                Trotzdem verlassen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Result Section Component
 */
function ResultSection({ 
  result, 
  onReset,
  onDataTransferred
}: { 
  result: PreflightResponse
  onReset: () => void
  onDataTransferred: () => void
}) {
  const router = useRouter()
  // State für Checkboxen der YELLOW-Felder (welche Vorschläge übernommen werden sollen)
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<Set<string>>(new Set())
  // State für verfügbare Kategorien (vom System)
  const [availableCategories, setAvailableCategories] = useState<Array<{ categoryKey: string; label: string }>>([])
  
  // Lade verfügbare Kategorien beim Mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch("/api/app/categories")
        if (response.ok) {
          const data = await response.json()
          setAvailableCategories(data.categories || [])
        }
      } catch (error) {
        console.error("Error loading categories:", error)
      }
    }
    loadCategories()
  }, [])
  
  // Map status to color
  const getStatusColor = (status: "GREEN" | "YELLOW" | "RED") => {
    switch (status) {
      case "GREEN":
        return "#10B981" // green-500
      case "YELLOW":
        return "#F59E0B" // amber-500
      case "RED":
        return "#EF4444" // red-500
    }
  }

  const getStatusLabel = (status: "GREEN" | "YELLOW" | "RED") => {
    switch (status) {
      case "GREEN":
        return "Vorhanden"
      case "YELLOW":
        return "Unklar"
      case "RED":
        return "Fehlt"
    }
  }

  // Translate English comments to German
  const translateComment = (comment: string): string => {
    if (!comment) return ""
    
    const translations: Record<string, string> = {
      "Product name is clearly stated": "Produktname ist eindeutig angegeben",
      "Product name is present": "Produktname ist vorhanden",
      "No product name found": "Kein Produktname gefunden",
      "Product name is missing": "Produktname fehlt",
      "SKU or similar identifier is provided": "SKU oder ähnliche ID ist angegeben",
      "SKU is present": "SKU ist vorhanden",
      "No SKU or similar identifier is provided": "Keine SKU oder ähnliche ID gefunden",
      "SKU is missing": "SKU fehlt",
      "Brand or manufacturer is clearly stated": "Marke oder Hersteller ist eindeutig angegeben",
      "Brand is present": "Marke ist vorhanden",
      "No brand or manufacturer information found": "Keine Marke- oder Herstellerangabe gefunden",
      "Brand is missing": "Marke fehlt",
      "Country of origin is clearly stated": "Herstellungsland ist eindeutig angegeben",
      "Country of origin is present": "Herstellungsland ist vorhanden",
      "No country of origin information found": "Keine Herstellungsland-Angabe gefunden",
      "Country of origin is missing": "Herstellungsland fehlt",
      "Materials information is provided": "Materialangaben sind vorhanden",
      "Materials are present": "Materialien sind vorhanden",
      "No materials information found": "Keine Materialangaben gefunden",
      "Materials are missing": "Materialien fehlen",
      "GTIN or EAN code is provided": "GTIN oder EAN-Code ist angegeben",
      "GTIN is present": "GTIN ist vorhanden",
      "No GTIN or EAN code found": "Kein GTIN oder EAN-Code gefunden",
      "GTIN is missing": "GTIN fehlt",
    }

    let translated = comment
    for (const [en, de] of Object.entries(translations)) {
      translated = translated.replace(new RegExp(en, "gi"), de)
    }

    return translated
  }

  // Get German explanation text for field status
  const getFieldExplanation = (fieldResult: PreflightResult): string => {
    if (fieldResult.status === "GREEN") {
      return "Dieses Feld wurde erfolgreich erkannt und ist vorhanden."
    } else if (fieldResult.status === "YELLOW") {
      const hasValidSuggestion = extractDetectedValue(fieldResult).length > 0
      if (hasValidSuggestion) {
        return "Dieses Feld ist unklar, aber es wurde ein möglicher Wert erkannt."
      } else {
        return "Dieses Feld ist unklar. Es wurde kein konkreter Wert erkannt."
      }
    } else {
      // RED
      const fieldName = formatFieldName(fieldResult.field)
      return `Es wurde kein ${fieldName} gefunden.`
    }
  }

  // Format category key for display (with mapping validation)
  const formatCategoryKey = (key: string) => {
    // First, try to find exact match in available categories
    const exactMatch = availableCategories.find(cat => cat.categoryKey === key)
    if (exactMatch) {
      return exactMatch.label
    }
    
    // Then try mapping to known categories
    const categoryMap: Record<string, string> = {
      TEXTILE: "Textilien & Bekleidung",
      FURNITURE: "Möbel",
      OTHER: "Sonstiges",
      generic_product: "Sonstiges",
      pet_furniture: "Möbel",
      clothing: "Textilien & Bekleidung",
      textile: "Textilien & Bekleidung",
      furniture: "Möbel",
      other: "Sonstiges",
    }
    
    const mapped = categoryMap[key.toLowerCase()] || categoryMap[key]
    if (mapped) {
      return mapped
    }
    
    // If no mapping found, show as "Unklar" if confidence is low, otherwise show key
    return result.detectedCategory?.confidence && result.detectedCategory.confidence < 0.7 
      ? "Unklar" 
      : key
  }
  
  // Map and validate category - returns valid category key or null
  const mapAndValidateCategory = (aiCategoryKey: string): string | null => {
    const lowerKey = aiCategoryKey.toLowerCase()
    
    // Direct mapping to system categories
    const categoryMap: Record<string, string> = {
      "textile": "TEXTILE",
      "furniture": "FURNITURE",
      "other": "OTHER",
      "generic_product": "OTHER",
      "pet_furniture": "FURNITURE",
      "clothing": "TEXTILE",
    }
    
    // Check if mapped category exists in available categories
    const mappedKey = categoryMap[lowerKey] || aiCategoryKey.toUpperCase()
    const isValid = availableCategories.some(cat => cat.categoryKey === mappedKey)
    
    return isValid ? mappedKey : null
  }

  // Format field name for display
  const formatFieldName = (field: string) => {
    const fieldMap: Record<string, string> = {
      name: "Produktname",
      sku: "SKU / Interne ID",
      brand: "Marke / Hersteller",
      countryOfOrigin: "Herstellungsland",
      materials: "Materialien",
      gtin: "GTIN / EAN",
    }
    return fieldMap[field] || field
  }

  // Extract detected value from result (for YELLOW fields suggestions)
  // Uses source field as detected value, applies normalization BEFORE rendering
  // This ensures values displayed in UI are already normalized
  const extractDetectedValue = (fieldResult: PreflightResult): string => {
    let rawValue = ""
    
    // Use source as detected value if available and not empty
    if (fieldResult.source && fieldResult.source.trim().length > 0) {
      rawValue = fieldResult.source.trim()
    } else if (fieldResult.comment) {
      // If source is empty, try to extract from comment (simple heuristic)
      // Comment format might be like "Erkannt: value" or just "value"
      const match = fieldResult.comment.match(/(?:Erkannt|Detected|Gefunden|Wert|Source)[:\s]+(.+?)(?:\.|$)/i)
      if (match && match[1]) {
        rawValue = match[1].trim()
      } else {
        // If no pattern match, use first line of comment if it looks like a value
        const firstLine = fieldResult.comment.split('\n')[0].trim()
        if (firstLine.length > 0 && firstLine.length < 200 && !firstLine.includes('fehlt') && !firstLine.includes('nicht')) {
          rawValue = firstLine
        }
      }
    }
    
    // Apply normalization immediately (before rendering)
    if (rawValue) {
      return normalizeValue(fieldResult.field, rawValue)
    }
    
    return ""
  }

  // Normalize value (remove labels, extract clean value)
  // Applied to ALL fields consistently
  const normalizeValue = (field: string, value: string): string => {
    if (!value || !value.trim()) return ""
    
    let normalized = value.trim()
    
    // Remove common prefixes and labels (applies to all fields)
    const labelPatterns = [
      /^(Produktinformationen|Product Information|Produkt|Product)[:\s]*['"]?/i,
      /^(Hersteller|Marke|Manufacturer|Brand)[:\s]+/i,
      /^(Herkunftsland|Herstellungsland|Country of Origin|Origin)[:\s]+/i,
      /^(Materialien|Materials|Material)[:\s]+/i,
      /^(SKU|Artikelnummer|Article Number)[:\s]+/i,
      /^(GTIN|EAN|Barcode)[:\s]+/i,
    ]
    
    for (const pattern of labelPatterns) {
      normalized = normalized.replace(pattern, "")
    }
    
    // Remove quotes and surrounding whitespace
    normalized = normalized.replace(/^['"]+|['"]+$/g, "").trim()
    
    // Field-specific normalization
    if (field === "name") {
      // Remove marketing phrases and contextual descriptions
      normalized = normalized.replace(/^(Produktinformationen|Product Information)[:\s]*['"]?/i, "")
      normalized = normalized.replace(/['"]/g, "") // Remove quotes
      // Remove common marketing prefixes
      normalized = normalized.replace(/^(Design|Premium|Professional|Original)[\s]+/i, "")
      // Keep only the actual product name (first meaningful part)
      const parts = normalized.split(/[|•\-\n]/)
      normalized = parts[0]?.trim() || normalized
    }
    
    if (field === "countryOfOrigin") {
      // Remove descriptive phrases like "In Deutschland gefertigt" -> "Deutschland"
      normalized = normalized.replace(/\b(gefertigt|hergestellt|produced|manufactured|made|hergestellt in)\b/gi, "")
      normalized = normalized.replace(/\b(in|aus|from|made in|produced in)\s+/i, "")
      // Remove common country name prefixes
      normalized = normalized.replace(/^(in|aus|from|made in|produced in)\s+/i, "").trim()
      // Remove trailing punctuation
      normalized = normalized.replace(/[.,;:]+$/, "").trim()
      // Extract country name if prefixed with location context
      const countryMatch = normalized.match(/(?:in|aus)\s+(.+)/i)
      if (countryMatch && countryMatch[1]) {
        normalized = countryMatch[1].trim()
      }
    }
    
    if (field === "brand") {
      // Remove label prefixes
      normalized = normalized.replace(/^(Marke|Brand|Hersteller|Manufacturer|von|by)[:\s]+/i, "")
      // Remove trailing "s" possessive if present (e.g., "jerry's" -> "jerry's" stays, but remove trailing markers)
      normalized = normalized.replace(/\s+von\s+.*$/i, "") // Remove "von [brand]" patterns
    }
    
    if (field === "materials") {
      // Remove label prefixes
      normalized = normalized.replace(/^(Materialien|Materials|Material|Zusammensetzung)[:\s]+/i, "")
      // Remove trailing lists of percentages if present
      normalized = normalized.replace(/\s*\([^)]*\)\s*$/, "") // Remove trailing parentheses
    }
    
    if (field === "sku" || field === "gtin") {
      // Remove label prefixes and whitespace
      normalized = normalized.replace(/^(SKU|GTIN|EAN|Artikelnummer|Article Number)[:\s]+/i, "")
      normalized = normalized.replace(/\s+/g, "") // Remove all whitespace for codes
    }
    
    // General cleanup: remove trailing punctuation and whitespace
    normalized = normalized.replace(/[.,;:]+$/, "").trim()
    
    // Remove very short or generic placeholders
    const invalidValues = ["n/a", "na", "tbd", "unknown", "unbekannt", "nicht angegeben", "keine angabe"]
    if (invalidValues.includes(normalized.toLowerCase())) {
      return ""
    }
    
    return normalized.trim()
  }

  // Handle checkbox toggle for YELLOW field suggestions
  const handleSuggestionToggle = (field: string) => {
    const newAccepted = new Set(acceptedSuggestions)
    if (newAccepted.has(field)) {
      newAccepted.delete(field)
    } else {
      newAccepted.add(field)
    }
    setAcceptedSuggestions(newAccepted)
  }

  // Collect data payload: GREEN fields + checked YELLOW fields
  // Values are already normalized in extractDetectedValue
  const collectDataPayload = (): Record<string, string> => {
    const payload: Record<string, string> = {}
    
    for (const fieldResult of result.results) {
      // Include GREEN fields automatically
      if (fieldResult.status === "GREEN") {
        const normalizedValue = extractDetectedValue(fieldResult) // Already normalized
        if (normalizedValue) {
          payload[fieldResult.field] = normalizedValue
        }
      }
      // Include YELLOW fields only if checkbox is checked
      if (fieldResult.status === "YELLOW" && acceptedSuggestions.has(fieldResult.field)) {
        const normalizedValue = extractDetectedValue(fieldResult) // Already normalized
        if (normalizedValue) {
          payload[fieldResult.field] = normalizedValue
        }
      }
      // RED fields are ignored
    }

    // Add detected category if available (with validation)
    if (result.detectedCategory?.key) {
      const mappedCategory = mapAndValidateCategory(result.detectedCategory.key)
      if (mappedCategory) {
        payload.category = mappedCategory
      }
      // If category cannot be mapped, do not add it (requires manual selection)
    }

    return payload
  }
  
  // Handle navigation to DPP creation with prefilled data
  const handleContinueToDppCreation = () => {
    const payload = collectDataPayload()
    
    // Store payload in sessionStorage for NewDppContent to read
    sessionStorage.setItem("preflightPrefillData", JSON.stringify(payload))
    
    // Mark data as transferred (so warning won't trigger)
    onDataTransferred()
    
    // Navigate to DPP creation
    router.push("/app/create/new")
  }
  
  // Handle reset (also reset data transfer flag)
  const handleResetWithFlag = () => {
    onReset()
    onDataTransferred() // Reset flag when resetting (via callback)
  }

  return (
    <div>
      {/* Result Header */}
      <div style={{
        backgroundColor: "#FFFFFF",
        padding: "clamp(1.5rem, 4vw, 2rem)",
        borderRadius: "12px",
        border: "1px solid #CDCDCD",
        marginBottom: "1.5rem"
      }}>
        <h2 style={{
          fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
          fontWeight: "700",
          color: "#0A0A0A",
          marginBottom: "1.5rem"
        }}>
          Vorprüfung abgeschlossen
        </h2>

        {/* Detected Category */}
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{
            color: "#7A7A7A",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            marginBottom: "0.5rem"
          }}>
            Erkannte Kategorie
          </p>
          <p style={{
            color: "#0A0A0A",
            fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
            fontWeight: "600",
            marginBottom: "0.25rem"
          }}>
            {formatCategoryKey(result.detectedCategory.key)}
            {!mapAndValidateCategory(result.detectedCategory.key) && (
              <span style={{
                marginLeft: "0.5rem",
                fontSize: "clamp(0.85rem, 1.8vw, 0.95rem)",
                color: "#F59E0B",
                fontWeight: "400"
              }}>
                (Vorschlag - bitte manuell auswählen)
              </span>
            )}
          </p>
          <p style={{
            color: "#7A7A7A",
            fontSize: "clamp(0.85rem, 1.8vw, 0.95rem)",
            margin: 0
          }}>
            Erkennungsgenauigkeit: {Math.round(result.detectedCategory.confidence * 100)}%
          </p>
          {!mapAndValidateCategory(result.detectedCategory.key) && (
            <p style={{
              color: "#7A7A7A",
              fontSize: "clamp(0.85rem, 1.8vw, 0.95rem)",
              fontStyle: "italic",
              margin: 0,
              marginTop: "0.5rem"
            }}>
              Diese Kategorie existiert nicht im System. Bitte wählen Sie beim Erstellen des DPPs eine passende Kategorie aus.
            </p>
          )}
        </div>

        {/* Overall Score */}
        <div style={{
          padding: "1rem",
          backgroundColor: "#F5F5F5",
          borderRadius: "8px",
          marginBottom: "1.5rem"
        }}>
          <p style={{
            color: "#7A7A7A",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            marginBottom: "0.5rem"
          }}>
            Fit zu EU-Anforderungen
          </p>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem"
          }}>
            <div style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: "700",
              color: "#0A0A0A"
            }}>
              {Math.round(result.overallScore * 100)}%
            </div>
            <div style={{
              flex: 1,
              height: "8px",
              backgroundColor: "#CDCDCD",
              borderRadius: "4px",
              overflow: "hidden"
            }}>
              <div style={{
                height: "100%",
                width: `${result.overallScore * 100}%`,
                backgroundColor: result.overallScore >= 0.8 ? "#10B981" : result.overallScore >= 0.5 ? "#F59E0B" : "#EF4444",
                transition: "width 0.3s ease"
              }} />
            </div>
          </div>
        </div>

        {/* Required Fields Results */}
        <div>
          <p style={{
            color: "#7A7A7A",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            marginBottom: "1rem"
          }}>
            Pflichtfelder-Status
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[...result.results].sort((a, b) => {
              // Sort: GREEN first, then YELLOW, then RED
              const statusOrder: Record<"GREEN" | "YELLOW" | "RED", number> = {
                GREEN: 0,
                YELLOW: 1,
                RED: 2
              }
              return statusOrder[a.status] - statusOrder[b.status]
            }).map((fieldResult) => {
              const detectedValue = extractDetectedValue(fieldResult)
              const hasSuggestion = fieldResult.status === "YELLOW" && detectedValue.length > 0
              const isAccepted = acceptedSuggestions.has(fieldResult.field)

              return (
                <div
                  key={fieldResult.field}
                  style={{
                    padding: "1rem",
                    border: "1px solid #CDCDCD",
                    borderRadius: "8px",
                    backgroundColor: "#FFFFFF"
                  }}
                >
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "0.5rem"
                  }}>
                    <div style={{ flex: 1 }}>
                      <p style={{
                        color: "#0A0A0A",
                        fontSize: "clamp(0.9rem, 2vw, 1rem)",
                        fontWeight: "600",
                        marginBottom: "0.25rem"
                      }}>
                        {formatFieldName(fieldResult.field)}
                      </p>
                      {(fieldResult.comment || fieldResult.status !== "GREEN") && (
                        <p style={{
                          color: "#7A7A7A",
                          fontSize: "clamp(0.85rem, 1.8vw, 0.95rem)",
                          margin: 0,
                          marginBottom: hasSuggestion ? "0.75rem" : 0,
                          lineHeight: "1.5"
                        }}>
                          {fieldResult.comment ? translateComment(fieldResult.comment) : getFieldExplanation(fieldResult)}
                        </p>
                      )}
                      {/* Suggestion for YELLOW fields */}
                      {hasSuggestion && (
                        <div style={{
                          marginTop: "0.75rem",
                          padding: "0.75rem",
                          backgroundColor: "#F5F5F5",
                          borderRadius: "6px",
                          border: "1px solid #CDCDCD"
                        }}>
                          <div style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "0.75rem"
                          }}>
                            <input
                              type="checkbox"
                              id={`suggestion-${fieldResult.field}`}
                              checked={isAccepted}
                              onChange={() => handleSuggestionToggle(fieldResult.field)}
                              style={{
                                width: "18px",
                                height: "18px",
                                marginTop: "0.125rem",
                                cursor: "pointer",
                                flexShrink: 0
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <label
                                htmlFor={`suggestion-${fieldResult.field}`}
                                style={{
                                  display: "block",
                                  color: "#0A0A0A",
                                  fontSize: "clamp(0.85rem, 1.8vw, 0.95rem)",
                                  fontWeight: "600",
                                  marginBottom: "0.25rem",
                                  cursor: "pointer"
                                }}
                              >
                                Vorschlag: {detectedValue}
                              </label>
                              <label
                                htmlFor={`suggestion-${fieldResult.field}`}
                                style={{
                                  display: "block",
                                  color: "#7A7A7A",
                                  fontSize: "clamp(0.8rem, 1.6vw, 0.85rem)",
                                  cursor: "pointer"
                                }}
                              >
                                Diesen Vorschlag übernehmen
                              </label>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{
                      padding: "0.375rem 0.75rem",
                      backgroundColor: getStatusColor(fieldResult.status),
                      color: "#FFFFFF",
                      borderRadius: "6px",
                      fontSize: "clamp(0.8rem, 1.6vw, 0.9rem)",
                      fontWeight: "600",
                      whiteSpace: "nowrap",
                      marginLeft: "1rem"
                    }}>
                      {getStatusLabel(fieldResult.status)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: "flex",
        gap: "1rem",
        flexWrap: "wrap"
      }}>
        <button
          onClick={handleResetWithFlag}
          style={{
            padding: "clamp(0.875rem, 2.5vw, 1rem) clamp(1.5rem, 4vw, 2rem)",
            backgroundColor: "#FFFFFF",
            color: "#0A0A0A",
            border: "1px solid #CDCDCD",
            borderRadius: "8px",
            fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          Neue Analyse starten
        </button>
        <button
          onClick={handleContinueToDppCreation}
          style={{
            padding: "clamp(0.875rem, 2.5vw, 1rem) clamp(1.5rem, 4vw, 2rem)",
            backgroundColor: "#24c598",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "8px",
            fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(226, 0, 116, 0.3)"
          }}
        >
          Ausgewählte Daten in DPP übernehmen
        </button>
      </div>
    </div>
  )
}

/**
 * AI Analysis Loading Spinner
 * 
 * Zeigt rotierende, kompakte Statusmeldungen (3-5 Wörter) im 2-Sekunden-Wechsel
 * Unterschiedliche Texte je nach Quelle (PDF oder Website)
 */
function AiAnalysisLoadingSpinner({ sourceType }: { sourceType: "pdf" | "url" | null }) {
  // PDF-spezifische Nachrichten
  const pdfMessages = [
    "PDF wird gelesen",
    "Dokument wird analysiert",
    "Pflichtinformationen werden identifiziert",
    "Inhalte werden verarbeitet",
    "Ergebnisse werden vorbereitet"
  ]

  // Website-spezifische Nachrichten
  const urlMessages = [
    "Website wird aufgerufen",
    "Seiteninhalt wird geladen",
    "Website wird analysiert",
    "Produktdaten werden extrahiert",
    "Ergebnisse werden vorbereitet"
  ]

  // Wähle Messages je nach Quelle
  const analysisMessages = sourceType === "url" ? urlMessages : pdfMessages

  const [currentMessage, setCurrentMessage] = useState(0)

  useEffect(() => {
    // Reset message index when sourceType changes
    setCurrentMessage(0)
    
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % analysisMessages.length)
    }, 2000) // Wechsel alle 2 Sekunden

    return () => clearInterval(interval)
  }, [sourceType, analysisMessages.length])

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem",
        minHeight: "200px",
      }}
    >
      {/* 4 mintfarbene Punkte */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          marginBottom: "1.5rem",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="loading-dot"
            style={{
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              backgroundColor: "#24c598",
              animation: `pulse 1.4s ease-in-out ${index * 0.2}s infinite both`,
            }}
          />
        ))}
      </div>

      {/* Rotierende Nachricht */}
      <p
        key={currentMessage}
        style={{
          color: "#7A7A7A",
          fontSize: "1rem",
          margin: 0,
          textAlign: "center",
          animation: "fadeIn 0.3s ease-in",
        }}
      >
        {analysisMessages[currentMessage]}
      </p>

      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(0.7);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .loading-dot {
          box-shadow: 0 0 8px rgba(36, 197, 152, 0.5);
        }
      `}</style>
    </div>
  )
}
