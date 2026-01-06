"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Papa from "papaparse"

interface CsvRow {
  name: string
  description?: string
  category: string
  sku: string
  brand: string
  countryOfOrigin: string
}

interface ValidationError {
  row: number
  field: string
  message: string
}

interface ImportDppContentProps {
  availableCategories: Array<{ categoryKey: string; label: string }>
}

interface Template {
  id: string
  name: string
  category: string
  version: number
  label: string
}

export default function ImportDppContent({ availableCategories }: ImportDppContentProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [category, setCategory] = useState<string>(availableCategories[0]?.categoryKey || "")
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [templates, setTemplates] = useState<Template[]>([])
  const [templatesByCategory, setTemplatesByCategory] = useState<Map<string, Template[]>>(new Map())
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<CsvRow[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [categoriesWithLabels, setCategoriesWithLabels] = useState<Map<string, { label: string; categoryKey: string }>>(new Map())
  const [showLeaveWarning, setShowLeaveWarning] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const [dataImported, setDataImported] = useState(false) // Track if data was imported

  // Lade Templates und Kategorie-Labels beim Mount
  useEffect(() => {
    async function loadTemplatesAndLabels() {
      try {
        // Lade Templates gruppiert nach Kategorie
        const templatesResponse = await fetch("/api/app/templates?groupByCategory=true")
        if (templatesResponse.ok) {
          const templatesData = await templatesResponse.json()
          const templatesMap = new Map<string, Template[]>()
          const allTemplates: Template[] = []
          
          for (const [cat, templateList] of Object.entries(templatesData.templatesByCategory || {})) {
            const templatesForCategory = (templateList as any[]).map((t: any) => ({
              id: t.id,
              name: t.name,
              category: t.category,
              version: t.version,
              label: t.label
            }))
            templatesMap.set(cat, templatesForCategory)
            allTemplates.push(...templatesForCategory)
          }
          
          setTemplatesByCategory(templatesMap)
          setTemplates(allTemplates)
          
          // Setze das erste Template der ersten Kategorie als Standard
          if (availableCategories.length > 0) {
            const firstCategory = availableCategories[0].categoryKey
            const templatesForFirstCategory = templatesMap.get(firstCategory) || []
            if (templatesForFirstCategory.length > 0) {
              setSelectedTemplateId(templatesForFirstCategory[0].id)
            }
          }
        }

        // Lade Kategorie-Labels
        const categoriesResponse = await fetch("/api/app/categories")
        if (categoriesResponse.ok) {
          const data = await categoriesResponse.json()
          const labelsMap = new Map<string, { label: string; categoryKey: string }>()
          for (const cat of data.categories || []) {
            labelsMap.set(cat.categoryKey, cat)
          }
          setCategoriesWithLabels(labelsMap)
        }
      } catch (err) {
        console.error("Error loading templates and category labels:", err)
      }
    }
    loadTemplatesAndLabels()
  }, [availableCategories])

  // Aktualisiere ausgewähltes Template wenn Kategorie geändert wird
  useEffect(() => {
    if (category && templatesByCategory.has(category)) {
      const templatesForCategory = templatesByCategory.get(category) || []
      if (templatesForCategory.length > 0) {
        setSelectedTemplateId(templatesForCategory[0].id)
      } else {
        setSelectedTemplateId("")
      }
    }
  }, [category, templatesByCategory])

  // CSV Template herunterladen
  const handleDownloadTemplate = () => {
    if (!selectedTemplateId) {
      setError("Bitte wählen Sie zuerst ein Template aus")
      return
    }
    const link = document.createElement("a")
    link.href = `/api/app/dpps/csv-template?category=${category}&templateId=${selectedTemplateId}`
    link.download = `dpp-template-${category.toLowerCase()}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // CSV-Datei parsen
  const parseCsvFile = (file: File) => {
    setError("")
    setValidationErrors([])
    setParsedData([])

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: ValidationError[] = []
        const validRows: CsvRow[] = []

        results.data.forEach((row: any, index: number) => {
          const rowErrors: ValidationError[] = []

          // Normalisiere Felder (trim whitespace, lowercase, entferne Unterstriche/Bindestriche)
          // Unterstützt: "countryOfOrigin", "country_of_origin", "country-of-origin" → "countryoforigin"
          const normalizedRow: any = {}
          Object.keys(row).forEach(key => {
            const normalizedKey = key.trim().toLowerCase().replace(/[_-]/g, "")
            normalizedRow[normalizedKey] = typeof row[key] === "string" ? row[key].trim() : row[key]
          })

          // Validierung: name (Pflichtfeld)
          if (!normalizedRow.name || normalizedRow.name.length === 0) {
            rowErrors.push({
              row: index + 2, // +2 wegen Header und 1-basierter Zählung
              field: "name",
              message: "Produktname ist erforderlich"
            })
          }

          // Validierung: category (Pflichtfeld und gültige Werte - nur verfügbare Kategorien)
          const categoryValue = (normalizedRow.category || category).toUpperCase()
          if (!availableCategories.map(c => c.categoryKey.toUpperCase()).includes(categoryValue)) {
            rowErrors.push({
              row: index + 2,
              field: "category",
              message: `Kategorie muss eine der verfügbaren Kategorien sein: ${availableCategories.map(c => c.label).join(", ")}`
            })
          }

          // Validierung: sku (Pflichtfeld)
          if (!normalizedRow.sku || normalizedRow.sku.length === 0) {
            rowErrors.push({
              row: index + 2,
              field: "sku",
              message: "SKU ist erforderlich"
            })
          }

          // Validierung: brand (Pflichtfeld)
          if (!normalizedRow.brand || normalizedRow.brand.length === 0) {
            rowErrors.push({
              row: index + 2,
              field: "brand",
              message: "Marke ist erforderlich"
            })
          }

          // Validierung: countryOfOrigin (Pflichtfeld)
          if (!normalizedRow.countryoforigin || normalizedRow.countryoforigin.length === 0) {
            rowErrors.push({
              row: index + 2,
              field: "countryOfOrigin",
              message: "Herstellungsland ist erforderlich"
            })
          }

          if (rowErrors.length === 0) {
            validRows.push({
              name: normalizedRow.name,
              description: normalizedRow.description || "",
              category: categoryValue,
              sku: normalizedRow.sku,
              brand: normalizedRow.brand,
              countryOfOrigin: normalizedRow.countryoforigin
            })
          } else {
            errors.push(...rowErrors)
          }
        })

        setValidationErrors(errors)
        setParsedData(validRows)

        if (errors.length > 0) {
          setError(`${errors.length} Fehler in ${results.data.length} Zeilen gefunden. Bitte korrigieren Sie die Fehler.`)
        }
      },
      error: (error) => {
        setError(`Fehler beim Parsen der CSV-Datei: ${error.message}`)
      }
    })
  }

  // Datei-Handling
  const handleFileSelect = (file: File) => {
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setError("Bitte wählen Sie eine CSV-Datei aus.")
      return
    }

    setCsvFile(file)
    parseCsvFile(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  // Import ausführen
  const handleImport = async () => {
    if (parsedData.length === 0) {
      setError("Keine gültigen Daten zum Importieren vorhanden.")
      return
    }

    if (validationErrors.length > 0) {
      setError("Bitte korrigieren Sie alle Fehler vor dem Import.")
      return
    }

    setIsImporting(true)
    setError("")

    if (!selectedTemplateId) {
      setError("Bitte wählen Sie zuerst ein Template aus")
      setIsImporting(false)
      return
    }

    try {
      const response = await fetch("/api/app/dpps/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          products: parsedData,
          templateId: selectedTemplateId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Import")
      }

      const result = await response.json()
      
      // Mark data as imported (so warning won't trigger)
      setDataImported(true)

      // Navigation basierend auf Anzahl der erstellten DPPs
      if (result.createdIds.length === 1) {
        router.push(`/app/dpps/${result.createdIds[0]}`)
      } else {
        router.push("/app/dpps")
      }
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist aufgetreten")
      setIsImporting(false)
    }
  }

  const hasErrors = validationErrors.length > 0
  const canImport = parsedData.length > 0 && !hasErrors && !isImporting
  
  // Prüft ob ungespeicherte Änderungen vorliegen
  const hasUnsavedChanges = (): boolean => {
    if (dataImported) return false // Daten wurden bereits importiert
    
    // Ungespeichert wenn: CSV-Datei hochgeladen/geparst
    return !!csvFile || parsedData.length > 0
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
  }, [csvFile, parsedData, dataImported])
  
  // Navigation-Handler für Back-Link
  const handleBackClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (hasUnsavedChanges()) {
      e.preventDefault()
      setPendingNavigation("/app/create")
      setShowLeaveWarning(true)
    }
  }

  // Wenn keine Templates verfügbar sind, zeige leeren Zustand
  if (availableCategories.length === 0 || templates.length === 0) {
    return (
      <div>
        <div style={{ marginBottom: "1rem" }}>
          <a
            href="/app/create"
            style={{
              color: "#7A7A7A",
              textDecoration: "none",
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              cursor: "pointer"
            }}
          >
            ← Zurück
          </a>
        </div>
        <h1 style={{
          fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
          fontWeight: "700",
          color: "#0A0A0A",
          marginBottom: "1rem"
        }}>
          CSV Import
        </h1>
        <div style={{
          backgroundColor: "#FFFFFF",
          padding: "clamp(2rem, 5vw, 4rem)",
          borderRadius: "12px",
          border: "1px solid #CDCDCD",
          textAlign: "center"
        }}>
          <p style={{
            color: "#7A7A7A",
            fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
            marginBottom: "1rem"
          }}>
            Keine Templates verfügbar
          </p>
          <p style={{
            color: "#7A7A7A",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            marginBottom: "1.5rem"
          }}>
            Es sind derzeit keine veröffentlichten Templates verfügbar. Bitte kontaktieren Sie einen Administrator, um Templates zu veröffentlichen.
          </p>
        </div>
      </div>
    )
  }

  const templatesForSelectedCategory = templatesByCategory.get(category) || []

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
          ← Zurück
        </a>
      </div>
      <h1 style={{
        fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
        fontWeight: "700",
        color: "#0A0A0A",
        marginBottom: "1rem"
      }}>
        CSV Import
      </h1>
      <p style={{
        color: "#7A7A7A",
        fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
        marginBottom: "2rem"
      }}>
        Importieren Sie mehrere Produkte auf einmal über eine CSV-Datei.
      </p>

      {/* Fehler-Anzeige */}
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

      {/* Kategorie-Auswahl */}
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
          Kategorie
        </h2>
        <p style={{
          color: "#7A7A7A",
          fontSize: "clamp(0.9rem, 2vw, 1rem)",
          marginBottom: "1rem"
        }}>
          Wählen Sie die Kategorie für die zu importierenden Produkte:
        </p>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as "TEXTILE" | "FURNITURE" | "OTHER")}
          style={{
            width: "100%",
            maxWidth: "300px",
            padding: "0.6875rem 2.5rem 0.6875rem 0.75rem",
            border: "1px solid #CDCDCD",
            borderRadius: "6px",
            fontSize: "1rem",
            backgroundColor: "#FFFFFF",
            boxSizing: "border-box",
            height: "42px",
            lineHeight: "1.5",
            appearance: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23000' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 0.75rem center",
            marginBottom: "1.5rem"
          }}
        >
          {availableCategories.map((cat) => (
            <option key={cat.categoryKey} value={cat.categoryKey}>
              {cat.label}
            </option>
          ))}
        </select>

        {/* Template-Auswahl */}
        <h2 style={{
          fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
          fontWeight: "700",
          color: "#0A0A0A",
          marginBottom: "1rem",
          marginTop: "1.5rem"
        }}>
          Template
        </h2>
        <p style={{
          color: "#7A7A7A",
          fontSize: "clamp(0.9rem, 2vw, 1rem)",
          marginBottom: "1rem"
        }}>
          Wählen Sie das Template für die zu importierenden Produkte:
        </p>
        <select
          value={selectedTemplateId}
          onChange={(e) => setSelectedTemplateId(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "500px",
            padding: "0.6875rem 2.5rem 0.6875rem 0.75rem",
            border: "1px solid #CDCDCD",
            borderRadius: "6px",
            fontSize: "1rem",
            backgroundColor: "#FFFFFF",
            boxSizing: "border-box",
            height: "42px",
            lineHeight: "1.5",
            appearance: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23000' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 0.75rem center"
          }}
        >
          {templatesForSelectedCategory.length === 0 ? (
            <option value="">Keine Templates für diese Kategorie verfügbar</option>
          ) : (
            templatesForSelectedCategory.map((template) => (
              <option key={template.id} value={template.id}>
                {template.label}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Template Download */}
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
          CSV Template
        </h2>
        <p style={{
          color: "#7A7A7A",
          fontSize: "clamp(0.9rem, 2vw, 1rem)",
          marginBottom: "1rem"
        }}>
          Laden Sie ein CSV-Template mit den erforderlichen Spalten und einem Beispiel-Datensatz herunter.
        </p>
        <button
          onClick={handleDownloadTemplate}
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
          Template herunterladen
        </button>
      </div>

      {/* File Upload */}
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
          CSV-Datei hochladen
        </h2>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            border: `2px dashed ${isDragging ? "#24c598" : "#CDCDCD"}`,
            borderRadius: "8px",
            padding: "3rem",
            textAlign: "center",
            backgroundColor: isDragging ? "#F5F5F5" : "#FFFFFF",
            cursor: "pointer",
            transition: "border-color 0.2s, background-color 0.2s"
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileInputChange}
            style={{ display: "none" }}
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            fill="none"
            stroke="#7A7A7A"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
            style={{ margin: "0 auto 1rem" }}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p style={{
            color: "#0A0A0A",
            fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
            fontWeight: "600",
            marginBottom: "0.5rem"
          }}>
            {csvFile ? csvFile.name : "Datei hier ablegen oder klicken zum Auswählen"}
          </p>
          <p style={{
            color: "#7A7A7A",
            fontSize: "clamp(0.9rem, 2vw, 1rem)"
          }}>
            Nur CSV-Dateien
          </p>
        </div>
      </div>

      {/* Import Preview */}
      {parsedData.length > 0 && (
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
            Import-Vorschau
          </h2>
          <p style={{
            color: "#7A7A7A",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            marginBottom: "1rem"
          }}>
            {parsedData.length} gültige Produkte gefunden
            {validationErrors.length > 0 && ` • ${validationErrors.length} Fehler`}
          </p>

          {/* Fehler-Details */}
          {validationErrors.length > 0 && (
            <div style={{
              backgroundColor: "#FEE2E2",
              border: "1px solid #FCA5A5",
              borderRadius: "8px",
              padding: "1rem",
              marginBottom: "1.5rem"
            }}>
              <h3 style={{
                fontSize: "1rem",
                fontWeight: "700",
                color: "#991B1B",
                marginBottom: "0.5rem"
              }}>
                Fehler:
              </h3>
              <ul style={{ margin: 0, paddingLeft: "1.5rem", color: "#991B1B" }}>
                {validationErrors.map((err, idx) => (
                  <li key={idx} style={{ marginBottom: "0.25rem" }}>
                    Zeile {err.row}, Feld "{err.field}": {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Daten-Tabelle */}
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "clamp(0.85rem, 2vw, 0.95rem)"
            }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #CDCDCD" }}>
                  <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: "600", color: "#0A0A0A" }}>Name</th>
                  <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: "600", color: "#0A0A0A" }}>Kategorie</th>
                  <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: "600", color: "#0A0A0A" }}>SKU</th>
                  <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: "600", color: "#0A0A0A" }}>Marke</th>
                  <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: "600", color: "#0A0A0A" }}>Herkunftsland</th>
                </tr>
              </thead>
              <tbody>
                {parsedData.slice(0, 10).map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #E5E5E5" }}>
                    <td style={{ padding: "0.75rem", color: "#0A0A0A" }}>{row.name}</td>
                    <td style={{ padding: "0.75rem", color: "#0A0A0A" }}>{row.category}</td>
                    <td style={{ padding: "0.75rem", color: "#0A0A0A" }}>{row.sku}</td>
                    <td style={{ padding: "0.75rem", color: "#0A0A0A" }}>{row.brand}</td>
                    <td style={{ padding: "0.75rem", color: "#0A0A0A" }}>{row.countryOfOrigin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedData.length > 10 && (
              <p style={{
                color: "#7A7A7A",
                fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
                marginTop: "0.5rem",
                textAlign: "center"
              }}>
                ... und {parsedData.length - 10} weitere Produkte
              </p>
            )}
          </div>

          {/* Import-Button */}
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
            <button
              onClick={handleImport}
              disabled={!canImport}
              style={{
                backgroundColor: canImport ? "#24c598" : "#CDCDCD",
                color: "#FFFFFF",
                border: "none",
                padding: "clamp(0.875rem, 2.5vw, 1rem) clamp(1.5rem, 4vw, 2rem)",
                borderRadius: "8px",
                fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
                fontWeight: "600",
                cursor: canImport ? "pointer" : "not-allowed",
                boxShadow: canImport ? "0 4px 12px rgba(226, 0, 116, 0.3)" : "none"
              }}
            >
              {isImporting ? "Importiere..." : `${parsedData.length} Produkte importieren`}
            </button>
          </div>
        </div>
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

