"use client"

/**
 * DPP Viewer (Read-only)
 * 
 * Zeigt eine veröffentlichte Version eines DPPs
 * Alle Felder sind read-only, kein Editor
 */
export default function DppViewer({ version }: {
  version: {
    id: string
    version: number
    name: string
    description: string | null
    category: string
    sku: string | null
    gtin: string | null
    brand: string | null
    countryOfOrigin: string | null
    materials: string | null
    materialSource: string | null
    careInstructions: string | null
    isRepairable: string | null
    sparePartsAvailable: string | null
    lifespan: string | null
    conformityDeclaration: string | null
    disposalInfo: string | null
    takebackOffered: string | null
    takebackContact: string | null
    secondLifeInfo: string | null
  }
}) {
  // Render-Funktion für read-only Felder
  const ReadOnlyField = ({ label, value }: { label: string; value: string | null }) => (
    <div style={{ marginBottom: "1.5rem" }}>
      <label style={{
        display: "block",
        fontSize: "clamp(0.9rem, 2vw, 1rem)",
        fontWeight: "600",
        color: "#0A0A0A",
        marginBottom: "0.5rem"
      }}>
        {label}
      </label>
      <div style={{
        padding: "clamp(0.75rem, 2vw, 1rem)",
        fontSize: "clamp(0.9rem, 2vw, 1rem)",
        border: "1px solid #CDCDCD",
        borderRadius: "8px",
        backgroundColor: "#F5F5F5",
        color: "#0A0A0A",
        minHeight: "2.5rem"
      }}>
        {value || <span style={{ color: "#7A7A7A", fontStyle: "italic" }}>Nicht angegeben</span>}
      </div>
    </div>
  )

  const ReadOnlyTextArea = ({ label, value }: { label: string; value: string | null }) => (
    <div style={{ marginBottom: "1.5rem" }}>
      <label style={{
        display: "block",
        fontSize: "clamp(0.9rem, 2vw, 1rem)",
        fontWeight: "600",
        color: "#0A0A0A",
        marginBottom: "0.5rem"
      }}>
        {label}
      </label>
      <div style={{
        padding: "clamp(0.75rem, 2vw, 1rem)",
        fontSize: "clamp(0.9rem, 2vw, 1rem)",
        border: "1px solid #CDCDCD",
        borderRadius: "8px",
        backgroundColor: "#F5F5F5",
        color: "#0A0A0A",
        minHeight: "4rem",
        whiteSpace: "pre-wrap"
      }}>
        {value || <span style={{ color: "#7A7A7A", fontStyle: "italic" }}>Nicht angegeben</span>}
      </div>
    </div>
  )

  return (
    <div>
      {/* 1. Basis- & Produktdaten */}
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
          1. Basis- & Produktdaten
        </h2>
        
        <ReadOnlyField label="Produktname" value={version.name} />
        <ReadOnlyTextArea label="Beschreibung" value={version.description} />
        <ReadOnlyField label="Produktkategorie" value={version.category} />
        <ReadOnlyField label="SKU / Interne ID" value={version.sku} />
        <ReadOnlyField label="GTIN / EAN" value={version.gtin} />
        <ReadOnlyField label="Marke / Hersteller" value={version.brand} />
        <ReadOnlyField label="Herstellungsland" value={version.countryOfOrigin} />
      </div>

      {/* 2. Materialien & Zusammensetzung */}
      {(version.materials || version.materialSource) && (
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
            2. Materialien & Zusammensetzung
          </h2>
          
          <ReadOnlyTextArea label="Materialliste" value={version.materials} />
          <ReadOnlyField label="Datenquelle" value={version.materialSource} />
        </div>
      )}

      {/* 3. Nutzung, Pflege & Lebensdauer */}
      {(version.careInstructions || version.isRepairable || version.sparePartsAvailable || version.lifespan) && (
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
            3. Nutzung, Pflege & Lebensdauer
          </h2>
          
          <ReadOnlyTextArea label="Pflegehinweise" value={version.careInstructions} />
          <ReadOnlyField label="Reparierbarkeit" value={version.isRepairable} />
          <ReadOnlyField label="Ersatzteile verfügbar" value={version.sparePartsAvailable} />
          <ReadOnlyField label="Lebensdauer" value={version.lifespan} />
        </div>
      )}

      {/* 4. Rechtliches & Konformität */}
      {(version.conformityDeclaration || version.disposalInfo) && (
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
            4. Rechtliches & Konformität
          </h2>
          
          <ReadOnlyTextArea label="Konformitätserklärung" value={version.conformityDeclaration} />
          <ReadOnlyTextArea label="Entsorgung / Recycling" value={version.disposalInfo} />
        </div>
      )}

      {/* 5. Rücknahme & Second Life */}
      {(version.takebackOffered || version.takebackContact || version.secondLifeInfo) && (
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
            5. Rücknahme & Second Life
          </h2>
          
          <ReadOnlyField label="Rücknahme angeboten" value={version.takebackOffered} />
          <ReadOnlyField label="Kontakt / URL" value={version.takebackContact} />
          <ReadOnlyTextArea label="Second-Life-Informationen" value={version.secondLifeInfo} />
        </div>
      )}
    </div>
  )
}

