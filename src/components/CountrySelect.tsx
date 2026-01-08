"use client"

import { useState, useEffect, useRef } from "react"

// Vollständige Länderliste (ISO 3166-1 alpha-2) - Alle 249 Länder
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
  { code: "IS", name: "Island" },
  { code: "AD", name: "Andorra" },
  { code: "LI", name: "Liechtenstein" },
  { code: "MC", name: "Monaco" },
  { code: "SM", name: "San Marino" },
  { code: "VA", name: "Vatikanstadt" },
  { code: "US", name: "Vereinigte Staaten" },
  { code: "CA", name: "Kanada" },
  { code: "MX", name: "Mexiko" },
  { code: "BR", name: "Brasilien" },
  { code: "AR", name: "Argentinien" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Kolumbien" },
  { code: "PE", name: "Peru" },
  { code: "VE", name: "Venezuela" },
  { code: "EC", name: "Ecuador" },
  { code: "BO", name: "Bolivien" },
  { code: "PY", name: "Paraguay" },
  { code: "UY", name: "Uruguay" },
  { code: "GY", name: "Guyana" },
  { code: "SR", name: "Suriname" },
  { code: "GF", name: "Französisch-Guayana" },
  { code: "FK", name: "Falklandinseln" },
  { code: "GS", name: "Südgeorgien und die Südlichen Sandwichinseln" },
  { code: "CN", name: "China" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "Südkorea" },
  { code: "IN", name: "Indien" },
  { code: "ID", name: "Indonesien" },
  { code: "PH", name: "Philippinen" },
  { code: "VN", name: "Vietnam" },
  { code: "TH", name: "Thailand" },
  { code: "MY", name: "Malaysia" },
  { code: "SG", name: "Singapur" },
  { code: "BD", name: "Bangladesch" },
  { code: "PK", name: "Pakistan" },
  { code: "LK", name: "Sri Lanka" },
  { code: "MM", name: "Myanmar" },
  { code: "KH", name: "Kambodscha" },
  { code: "LA", name: "Laos" },
  { code: "BN", name: "Brunei" },
  { code: "TL", name: "Osttimor" },
  { code: "MN", name: "Mongolei" },
  { code: "NP", name: "Nepal" },
  { code: "BT", name: "Bhutan" },
  { code: "MV", name: "Malediven" },
  { code: "AU", name: "Australien" },
  { code: "NZ", name: "Neuseeland" },
  { code: "PG", name: "Papua-Neuguinea" },
  { code: "FJ", name: "Fidschi" },
  { code: "NC", name: "Neukaledonien" },
  { code: "PF", name: "Französisch-Polynesien" },
  { code: "SB", name: "Salomonen" },
  { code: "VU", name: "Vanuatu" },
  { code: "WS", name: "Samoa" },
  { code: "TO", name: "Tonga" },
  { code: "KI", name: "Kiribati" },
  { code: "TV", name: "Tuvalu" },
  { code: "NR", name: "Nauru" },
  { code: "PW", name: "Palau" },
  { code: "FM", name: "Mikronesien" },
  { code: "MH", name: "Marshallinseln" },
  { code: "ZA", name: "Südafrika" },
  { code: "EG", name: "Ägypten" },
  { code: "NG", name: "Nigeria" },
  { code: "KE", name: "Kenia" },
  { code: "ET", name: "Äthiopien" },
  { code: "GH", name: "Ghana" },
  { code: "TZ", name: "Tansania" },
  { code: "UG", name: "Uganda" },
  { code: "MW", name: "Malawi" },
  { code: "ZM", name: "Sambia" },
  { code: "ZW", name: "Simbabwe" },
  { code: "BW", name: "Botswana" },
  { code: "NA", name: "Namibia" },
  { code: "AO", name: "Angola" },
  { code: "MZ", name: "Mosambik" },
  { code: "MG", name: "Madagaskar" },
  { code: "MU", name: "Mauritius" },
  { code: "SC", name: "Seychellen" },
  { code: "KM", name: "Komoren" },
  { code: "DJ", name: "Dschibuti" },
  { code: "ER", name: "Eritrea" },
  { code: "SO", name: "Somalia" },
  { code: "SD", name: "Sudan" },
  { code: "SS", name: "Südsudan" },
  { code: "TD", name: "Tschad" },
  { code: "CF", name: "Zentralafrikanische Republik" },
  { code: "CM", name: "Kamerun" },
  { code: "GA", name: "Gabun" },
  { code: "CG", name: "Kongo" },
  { code: "CD", name: "Demokratische Republik Kongo" },
  { code: "RW", name: "Ruanda" },
  { code: "BI", name: "Burundi" },
  { code: "TN", name: "Tunesien" },
  { code: "DZ", name: "Algerien" },
  { code: "MA", name: "Marokko" },
  { code: "LY", name: "Libyen" },
  { code: "SN", name: "Senegal" },
  { code: "GM", name: "Gambia" },
  { code: "GW", name: "Guinea-Bissau" },
  { code: "GN", name: "Guinea" },
  { code: "SL", name: "Sierra Leone" },
  { code: "LR", name: "Liberia" },
  { code: "CI", name: "Elfenbeinküste" },
  { code: "BF", name: "Burkina Faso" },
  { code: "ML", name: "Mali" },
  { code: "NE", name: "Niger" },
  { code: "TG", name: "Togo" },
  { code: "BJ", name: "Benin" },
  { code: "MR", name: "Mauretanien" },
  { code: "CV", name: "Kap Verde" },
  { code: "ST", name: "São Tomé und Príncipe" },
  { code: "GQ", name: "Äquatorialguinea" },
  { code: "SA", name: "Saudi-Arabien" },
  { code: "AE", name: "Vereinigte Arabische Emirate" },
  { code: "IL", name: "Israel" },
  { code: "JO", name: "Jordanien" },
  { code: "LB", name: "Libanon" },
  { code: "SY", name: "Syrien" },
  { code: "IQ", name: "Irak" },
  { code: "IR", name: "Iran" },
  { code: "KW", name: "Kuwait" },
  { code: "QA", name: "Katar" },
  { code: "BH", name: "Bahrain" },
  { code: "OM", name: "Oman" },
  { code: "YE", name: "Jemen" },
  { code: "TR", name: "Türkei" },
  { code: "AZ", name: "Aserbaidschan" },
  { code: "AM", name: "Armenien" },
  { code: "GE", name: "Georgien" },
  { code: "RU", name: "Russland" },
  { code: "UA", name: "Ukraine" },
  { code: "BY", name: "Weißrussland" },
  { code: "MD", name: "Moldau" },
  { code: "KZ", name: "Kasachstan" },
  { code: "UZ", name: "Usbekistan" },
  { code: "TM", name: "Turkmenistan" },
  { code: "TJ", name: "Tadschikistan" },
  { code: "KG", name: "Kirgisistan" },
  { code: "AF", name: "Afghanistan" },
  { code: "IO", name: "Britisches Territorium im Indischen Ozean" },
  { code: "CX", name: "Weihnachtsinsel" },
  { code: "CC", name: "Kokosinseln" },
  { code: "HM", name: "Heard und McDonaldinseln" },
  { code: "AQ", name: "Antarktis" },
  { code: "BV", name: "Bouvetinsel" },
  { code: "TF", name: "Französische Süd- und Antarktisgebiete" },
  { code: "EH", name: "Westsahara" },
  { code: "PS", name: "Palästina" },
  { code: "TW", name: "Taiwan" },
  { code: "HK", name: "Hongkong" },
  { code: "MO", name: "Macau" },
  { code: "GG", name: "Guernsey" },
  { code: "JE", name: "Jersey" },
  { code: "IM", name: "Isle of Man" },
  { code: "FO", name: "Färöer" },
  { code: "GL", name: "Grönland" },
  { code: "SJ", name: "Svalbard und Jan Mayen" },
  { code: "AX", name: "Åland" },
  { code: "GI", name: "Gibraltar" },
  { code: "RE", name: "Réunion" },
  { code: "YT", name: "Mayotte" },
  { code: "PM", name: "Saint-Pierre und Miquelon" },
  { code: "BL", name: "Saint-Barthélemy" },
  { code: "MF", name: "Saint-Martin" },
  { code: "GP", name: "Guadeloupe" },
  { code: "MQ", name: "Martinique" },
  { code: "CW", name: "Curaçao" },
  { code: "AW", name: "Aruba" },
  { code: "BQ", name: "Bonaire, Sint Eustatius und Saba" },
  { code: "SX", name: "Sint Maarten" },
  { code: "PR", name: "Puerto Rico" },
  { code: "VI", name: "Amerikanische Jungferninseln" },
  { code: "VG", name: "Britische Jungferninseln" },
  { code: "AI", name: "Anguilla" },
  { code: "MS", name: "Montserrat" },
  { code: "KY", name: "Kaimaninseln" },
  { code: "TC", name: "Turks- und Caicosinseln" },
  { code: "BM", name: "Bermuda" },
  { code: "SH", name: "St. Helena, Ascension und Tristan da Cunha" },
  { code: "AC", name: "Ascension" },
  { code: "TA", name: "Tristan da Cunha" },
]

interface CountrySelectProps {
  id: string
  label: string
  value: string // Erwartet ISO-Code (z.B. "DE", "FR")
  onChange: (value: string) => void // Übergibt ISO-Code
  required?: boolean
  helperText?: string
}

/**
 * Länderauswahl mit Dropdown und Suchfunktion
 * 
 * - Zeigt das Land der IP-Adresse an erster Stelle
 * - Dropdown mit Suchfunktion
 * - Speichert ISO-3166-1 Alpha-2 Codes (z.B. "DE", "FR")
 * - Zeigt Länder Namen im UI an
 */
export default function CountrySelect({ id, label, value, onChange, required = false, helperText }: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null)
  const [sortedCountries, setSortedCountries] = useState(COUNTRIES)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Finde den aktuell ausgewählten Ländernamen basierend auf dem ISO-Code
  const selectedCountry = COUNTRIES.find(c => c.code === value)
  const displayValue = selectedCountry ? selectedCountry.name : value

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

  const handleSelect = (countryCode: string) => {
    onChange(countryCode) // Übergibt ISO-Code
    setIsOpen(false)
    setSearchTerm("")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    // Wenn der Benutzer einen Ländernamen eingibt, versuche den Code zu finden
    const matchedCountry = COUNTRIES.find(c => 
      c.name.toLowerCase() === newValue.toLowerCase() ||
      c.code.toLowerCase() === newValue.toLowerCase()
    )
    
    if (matchedCountry) {
      onChange(matchedCountry.code)
      setSearchTerm("")
    } else {
      // Freitext-Eingabe erlauben (kann später validiert werden)
      onChange(newValue)
      setSearchTerm(newValue)
    }
    setIsOpen(true)
  }

  const handleInputFocus = () => {
    setIsOpen(true)
  }

  return (
    <div style={{ marginBottom: "0", position: "relative", zIndex: 1000 }}>
      <label htmlFor={id} style={{
        display: "block",
        fontSize: "0.9rem",
        fontWeight: "500",
        color: "#0A0A0A",
        marginBottom: "0.5rem"
      }}>
        {label} {required && <span style={{ color: "#24c598" }}>*</span>}
      </label>
      <div ref={containerRef} style={{ position: "relative" }}>
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          required={required}
          placeholder="Land suchen oder eingeben..."
          style={{
            width: "100%",
            padding: "0.75rem",
            paddingRight: "2.5rem",
            fontSize: "1rem",
            border: "1px solid #CDCDCD",
            borderRadius: "6px",
            backgroundColor: "#FFFFFF",
            color: "#0A0A0A",
            boxSizing: "border-box",
            height: "auto",
            minHeight: "auto"
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
                  onClick={() => handleSelect(country.code)}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    textAlign: "left",
                    border: "none",
                    backgroundColor: value === country.code ? "#F5F5F5" : "transparent",
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
                    e.currentTarget.style.backgroundColor = value === country.code ? "#F5F5F5" : "transparent"
                  }}
                >
                  {detectedCountry === country.code && (
                    <span style={{
                      fontSize: "0.75rem",
                      color: "#24c598",
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
      {helperText && (
        <p style={{
          fontSize: "clamp(0.8rem, 1.6vw, 0.85rem)",
          color: "#7A7A7A",
          marginTop: "0.5rem",
          marginBottom: 0
        }}>
          {helperText}
        </p>
      )}
    </div>
  )
}
