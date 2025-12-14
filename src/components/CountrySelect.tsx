"use client"

import { useState, useEffect, useRef } from "react"

// Länderliste (ISO 3166-1 alpha-2)
const COUNTRIES = [
  { code: "DE", name: "Deutschland" },
  { code: "AT", name: "Österreich" },
  { code: "CH", name: "Schweiz" },
  { code: "FR", name: "Frankreich" },
  { code: "IT", name: "Italien" },
  { code: "ES", name: "Spanien" },
  { code: "NL", name: "Niederlande" },
  { code: "BE", name: "Belgien" },
  { code: "PL", name: "Polen" },
  { code: "CZ", name: "Tschechien" },
  { code: "DK", name: "Dänemark" },
  { code: "SE", name: "Schweden" },
  { code: "NO", name: "Norwegen" },
  { code: "FI", name: "Finnland" },
  { code: "GB", name: "Vereinigtes Königreich" },
  { code: "IE", name: "Irland" },
  { code: "PT", name: "Portugal" },
  { code: "GR", name: "Griechenland" },
  { code: "HU", name: "Ungarn" },
  { code: "RO", name: "Rumänien" },
  { code: "BG", name: "Bulgarien" },
  { code: "HR", name: "Kroatien" },
  { code: "SK", name: "Slowakei" },
  { code: "SI", name: "Slowenien" },
  { code: "LT", name: "Litauen" },
  { code: "LV", name: "Lettland" },
  { code: "EE", name: "Estland" },
  { code: "LU", name: "Luxemburg" },
  { code: "MT", name: "Malta" },
  { code: "CY", name: "Zypern" },
  { code: "US", name: "Vereinigte Staaten" },
  { code: "CA", name: "Kanada" },
  { code: "MX", name: "Mexiko" },
  { code: "BR", name: "Brasilien" },
  { code: "AR", name: "Argentinien" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "Südkorea" },
  { code: "IN", name: "Indien" },
  { code: "AU", name: "Australien" },
  { code: "NZ", name: "Neuseeland" },
  { code: "ZA", name: "Südafrika" },
  { code: "EG", name: "Ägypten" },
  { code: "TR", name: "Türkei" },
  { code: "RU", name: "Russland" },
  { code: "UA", name: "Ukraine" },
  { code: "TH", name: "Thailand" },
  { code: "VN", name: "Vietnam" },
  { code: "ID", name: "Indonesien" },
  { code: "MY", name: "Malaysia" },
  { code: "SG", name: "Singapur" },
  { code: "PH", name: "Philippinen" },
  { code: "BD", name: "Bangladesch" },
  { code: "PK", name: "Pakistan" },
  { code: "SA", name: "Saudi-Arabien" },
  { code: "AE", name: "Vereinigte Arabische Emirate" },
  { code: "IL", name: "Israel" },
  { code: "NZ", name: "Neuseeland" },
  // Weitere Länder können hier hinzugefügt werden
]

interface CountrySelectProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
}

/**
 * Länderauswahl mit Dropdown und Suchfunktion
 * 
 * - Zeigt das Land der IP-Adresse an erster Stelle
 * - Dropdown mit Suchfunktion
 * - Freitext-Eingabe möglich
 */
export default function CountrySelect({ id, label, value, onChange, required = false }: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null)
  const [sortedCountries, setSortedCountries] = useState(COUNTRIES)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // IP-Geolocation beim Mount
  useEffect(() => {
    async function detectCountry() {
      try {
        const response = await fetch("https://ipapi.co/json/")
        const data = await response.json()
        if (data.country_code) {
          setDetectedCountry(data.country_code)
          // Sortiere Länder: Detected Country zuerst
          const sorted = [...COUNTRIES].sort((a, b) => {
            if (a.code === data.country_code) return -1
            if (b.code === data.country_code) return 1
            return a.name.localeCompare(b.name)
          })
          setSortedCountries(sorted)
        }
      } catch (error) {
        console.error("Error detecting country:", error)
        // Fallback: Alphabetisch sortieren
        setSortedCountries([...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name)))
      }
    }
    detectCountry()
  }, [])

  // Filtere Länder basierend auf Suchbegriff
  const filteredCountries = sortedCountries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Schließe Dropdown beim Klick außerhalb
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (countryName: string) => {
    onChange(countryName)
    setIsOpen(false)
    setSearchTerm("")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setSearchTerm(newValue)
    setIsOpen(true)
  }

  const handleInputFocus = () => {
    setIsOpen(true)
  }

  return (
    <div style={{ marginBottom: "1.5rem", position: "relative", zIndex: 1000 }}>
      <label htmlFor={id} style={{
        display: "block",
        fontSize: "clamp(0.9rem, 2vw, 1rem)",
        fontWeight: "600",
        color: "#0A0A0A",
        marginBottom: "0.5rem"
      }}>
        {label} {required && <span style={{ color: "#E20074" }}>*</span>}
      </label>
      <div ref={containerRef} style={{ position: "relative" }}>
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          required={required}
          placeholder="Land suchen oder eingeben..."
          style={{
            width: "100%",
            padding: "clamp(0.75rem, 2vw, 1rem)",
            paddingRight: "2.5rem",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            border: "1px solid #CDCDCD",
            borderRadius: "8px",
            backgroundColor: "#FFFFFF",
            color: "#0A0A0A",
            boxSizing: "border-box"
          }}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: "absolute",
            right: "0.5rem",
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
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
            style={{
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s"
            }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {isOpen && (
          <div style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "0.25rem",
            backgroundColor: "#FFFFFF",
            border: "1px solid #CDCDCD",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            maxHeight: "300px",
            overflowY: "auto",
            zIndex: 10000
          }}>
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleSelect(country.name)}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    textAlign: "left",
                    border: "none",
                    backgroundColor: value === country.name ? "#F5F5F5" : "transparent",
                    cursor: "pointer",
                    fontSize: "clamp(0.9rem, 2vw, 1rem)",
                    color: "#0A0A0A",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#F5F5F5"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = value === country.name ? "#F5F5F5" : "transparent"
                  }}
                >
                  {detectedCountry === country.code && (
                    <span style={{
                      fontSize: "0.75rem",
                      color: "#E20074",
                      fontWeight: "600"
                    }}>
                      ●
                    </span>
                  )}
                  <span>{country.name}</span>
                </button>
              ))
            ) : (
              <div style={{
                padding: "1rem",
                textAlign: "center",
                color: "#7A7A7A",
                fontSize: "clamp(0.85rem, 2vw, 0.95rem)"
              }}>
                Keine Länder gefunden
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

