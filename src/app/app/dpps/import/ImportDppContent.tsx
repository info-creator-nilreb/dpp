"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
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

export default function ImportDppContent({ availableCategories }: ImportDppContentProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [category, setCategory] = useState<string>(availableCategories[0]?.categoryKey || "")
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<CsvRow[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [categoriesWithLabels, setCategoriesWithLabels] = useState<Map<string, { label: string; categoryKey: string }>>(new Map())

  // Lade Kategorie-Labels beim Mount
  useEffect(() => {
    async function loadCategoryLabels() {
      try {
        const response = await fetch("/api/app/categories")
        if (response.ok) {
          const data = await response.json()
          const labelsMap = new Map<string, { label: string; categoryKey: string }>()
          for (const cat of data.categories || []) {
            labelsMap.set(cat.categoryKey, cat)
          }
          setCategoriesWithLabels(labelsMap)
        }
      } catch (err) {
        console.error("Error loading category labels:", err)
      }
    }
    loadCategoryLabels()
  }, [])

  // CSV Template herunterladen
  const handleDownloadTemplate = () => {
    const link = document.createElement("a")
    link.href = `/api/app/dpps/csv-template?category=${category}`
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

    try {
      const response = await fetch("/api/app/dpps/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          products: parsedData
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Import")
      }

      const result = await response.json()

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

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <Link
          href="/app/dpps/create"
          style={{
            color: "#7A7A7A",
            textDecoration: "none",
            fontSize: "clamp(0.9rem, 2vw, 1rem)"
          }}
        >
          ← Zurück
        </Link>
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
            backgroundPosition: "right 0.75rem center"
          }}
        >
          {availableCategories.length === 0 ? (
            <option value="">Keine Kategorien verfügbar</option>
          ) : (
            availableCategories.map((cat) => (
              <option key={cat.categoryKey} value={cat.categoryKey}>
                {cat.label}
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
            backgroundColor: "#E20074",
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
            border: `2px dashed ${isDragging ? "#E20074" : "#CDCDCD"}`,
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
                backgroundColor: canImport ? "#E20074" : "#CDCDCD",
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
    </div>
  )
}

