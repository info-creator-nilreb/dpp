"use client"

interface DppVersion {
  id: string
  version: number
  createdAt: Date
  publicUrl: string | null
}

interface DppMedia {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  uploadedAt: Date
}

interface Dpp {
  id: string
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
  status: string
  createdAt: Date
  updatedAt: Date
  organization: {
    id: string
    name: string
    licenseTier: string
  }
  media: DppMedia[]
  versions: DppVersion[]
  _count: {
    versions: number
    media: number
  }
}

interface DppDetailContentProps {
  dpp: Dpp
}

export default function DppDetailContent({ dpp }: DppDetailContentProps) {
  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      {/* Basic Info */}
      <div style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #CDCDCD",
        borderRadius: "8px",
        padding: "1.5rem"
      }}>
        <h2 style={{
          fontSize: "1.25rem",
          fontWeight: "600",
          marginBottom: "1rem",
          color: "#0A0A0A"
        }}>
          Informationen
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
          <div>
            <div style={{ fontSize: "0.85rem", color: "#7A7A7A", marginBottom: "0.25rem" }}>
              Organisation
            </div>
            <div style={{ fontSize: "1rem", color: "#0A0A0A", fontWeight: "500" }}>
              {dpp.organization.name}
            </div>
            <div style={{ fontSize: "0.85rem", color: "#7A7A7A", marginTop: "0.25rem" }}>
              License: {dpp.organization.licenseTier}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.85rem", color: "#7A7A7A", marginBottom: "0.25rem" }}>
              Kategorie
            </div>
            <div style={{ fontSize: "1rem", color: "#0A0A0A" }}>
              {dpp.category}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.85rem", color: "#7A7A7A", marginBottom: "0.25rem" }}>
              Status
            </div>
            <div>
              <span style={{
                padding: "0.25rem 0.75rem",
                borderRadius: "4px",
                fontSize: "0.85rem",
                backgroundColor: dpp.status === "PUBLISHED" ? "#F0FDF4" : "#FEF3C7",
                color: dpp.status === "PUBLISHED" ? "#16A34A" : "#D97706"
              }}>
                {dpp.status === "PUBLISHED" ? "Veröffentlicht" : "Entwurf"}
              </span>
            </div>
          </div>
          {dpp.brand && (
            <div>
              <div style={{ fontSize: "0.85rem", color: "#7A7A7A", marginBottom: "0.25rem" }}>
                Marke
              </div>
              <div style={{ fontSize: "1rem", color: "#0A0A0A" }}>
                {dpp.brand}
              </div>
            </div>
          )}
          {dpp.sku && (
            <div>
              <div style={{ fontSize: "0.85rem", color: "#7A7A7A", marginBottom: "0.25rem" }}>
                SKU
              </div>
              <div style={{ fontSize: "1rem", color: "#0A0A0A" }}>
                {dpp.sku}
              </div>
            </div>
          )}
          {dpp.gtin && (
            <div>
              <div style={{ fontSize: "0.85rem", color: "#7A7A7A", marginBottom: "0.25rem" }}>
                GTIN/EAN
              </div>
              <div style={{ fontSize: "1rem", color: "#0A0A0A" }}>
                {dpp.gtin}
              </div>
            </div>
          )}
        </div>
        {dpp.description && (
          <div style={{ marginTop: "1rem" }}>
            <div style={{ fontSize: "0.85rem", color: "#7A7A7A", marginBottom: "0.25rem" }}>
              Beschreibung
            </div>
            <div style={{ fontSize: "1rem", color: "#0A0A0A" }}>
              {dpp.description}
            </div>
          </div>
        )}
      </div>

      {/* Versions */}
      <div style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #CDCDCD",
        borderRadius: "8px",
        padding: "1.5rem"
      }}>
        <h2 style={{
          fontSize: "1.25rem",
          fontWeight: "600",
          marginBottom: "1rem",
          color: "#0A0A0A"
        }}>
          Versionen ({dpp._count.versions})
        </h2>
        {dpp.versions.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {dpp.versions.map((version) => (
              <div
                key={version.id}
                style={{
                  padding: "1rem",
                  backgroundColor: "#F5F5F5",
                  borderRadius: "6px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <div style={{ fontWeight: "500", color: "#0A0A0A" }}>
                    Version {version.version}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#7A7A7A" }}>
                    {new Date(version.createdAt).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </div>
                </div>
                {version.publicUrl && (
                  <a
                    href={version.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#24c598",
                      textDecoration: "none",
                      fontSize: "0.9rem",
                      fontWeight: "500"
                    }}
                  >
                    Öffentliche Ansicht →
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "#7A7A7A" }}>Keine Versionen vorhanden</p>
        )}
      </div>

      {/* Media */}
      {dpp.media.length > 0 && (
        <div style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #CDCDCD",
          borderRadius: "8px",
          padding: "1.5rem"
        }}>
          <h2 style={{
            fontSize: "1.25rem",
            fontWeight: "600",
            marginBottom: "1rem",
            color: "#0A0A0A"
          }}>
            Medien ({dpp._count.media})
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
            {dpp.media.map((media) => (
              <div
                key={media.id}
                style={{
                  padding: "1rem",
                  backgroundColor: "#F5F5F5",
                  borderRadius: "6px"
                }}
              >
                <div style={{ fontWeight: "500", color: "#0A0A0A", marginBottom: "0.5rem" }}>
                  {media.fileName}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#7A7A7A" }}>
                  {media.fileType} • {(media.fileSize / 1024).toFixed(2)} KB
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

