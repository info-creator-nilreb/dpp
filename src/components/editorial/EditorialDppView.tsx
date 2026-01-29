/**
 * Editorial DPP View Component
 * 
 * Wiederverwendbare Komponente für Editorial-Ansicht
 * Kann sowohl Dpp als auch DppVersion Daten anzeigen
 */

import { Page, Section, TextBlock, QuoteBlock, Image, Accent } from './index'

interface EditorialDppData {
  id: string
  name: string
  description: string | null
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
  organization: {
    name: string
  }
  media: Array<{
    id: string
    storageUrl: string
    fileType: string
    blockId?: string | null
    fieldId?: string | null
  }>
  produktdatenBlockId?: string | null
  versionInfo?: {
    version: number
    createdAt: Date
  }
}

interface EditorialDppViewProps {
  dpp: EditorialDppData
}

export default function EditorialDppView({ dpp }: EditorialDppViewProps) {
  // Herobild: Erstes Bild im Produktdaten-Block (oder erstes Bild insgesamt als Fallback)
  const produktdatenImages = dpp.media.filter(m => 
    m.fileType.startsWith('image/') && 
    (dpp.produktdatenBlockId ? m.blockId === dpp.produktdatenBlockId : true)
  )
  const heroImage = produktdatenImages[0] || dpp.media.find(m => m.fileType.startsWith('image/'))
  const galleryImages = produktdatenImages.slice(1) // Weitere Bilder im Produktdaten-Block = Galerie
  
  const brandName = dpp.brand || dpp.organization.name

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    })
  }

  return (
    <Page>
      {/* Hero Section - Full Bleed, direkt am Seitenbeginn ohne unnötigen Raum */}
      <Section variant="full-bleed" style={{ paddingTop: 0, paddingBottom: 0 }}>
        {heroImage ? (
          <div style={{ position: 'relative', width: '100%' }}>
            <Image
              src={heroImage.storageUrl}
              alt={dpp.name}
              aspectRatio="16:9"
              priority
            />
            {/* Titel als Overlay auf Hero-Bild für maximalen visuellen Impact */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0))',
              padding: '3rem 1.5rem 2rem',
            }}>
              <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
              }}>
                <h1 style={{
                  fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                  fontWeight: 700,
                  lineHeight: 1.2,
                  marginBottom: '0.5rem',
                  letterSpacing: '-0.02em',
                  color: '#FFFFFF',
                }}>
                  {dpp.name}
                </h1>
                {brandName && (
                  <p style={{
                    fontSize: 'clamp(0.875rem, 2vw, 1.125rem)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: dpp.versionInfo ? '0.5rem' : 0,
                  }}>
                    {brandName}
                  </p>
                )}
                {/* Version und Datum dezent unter Brand */}
                {dpp.versionInfo && (
                  <p style={{
                    fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontWeight: 400,
                    letterSpacing: '0.02em',
                    marginTop: '0.5rem',
                  }}>
                    Version {dpp.versionInfo.version} • {formatDate(dpp.versionInfo.createdAt)}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '4rem 1.5rem 2rem',
            textAlign: 'center',
          }}>
            <h1 style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: '1rem',
              letterSpacing: '-0.02em',
            }}>
              {dpp.name}
            </h1>
            {brandName && (
              <p style={{
                fontSize: 'clamp(0.875rem, 2vw, 1.125rem)',
                color: '#7A7A7A',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: dpp.versionInfo ? '0.5rem' : 0,
              }}>
                {brandName}
              </p>
            )}
            {/* Version und Datum dezent unter Brand */}
            {dpp.versionInfo && (
              <p style={{
                fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
                color: '#9A9A9A',
                fontWeight: 400,
                letterSpacing: '0.02em',
                marginTop: '0.5rem',
              }}>
                Version {dpp.versionInfo.version} • {formatDate(dpp.versionInfo.createdAt)}
              </p>
            )}
          </div>
        )}
      </Section>

      {/* Story Section - Contained */}
      <Section variant="contained">
        {dpp.description && (
          <TextBlock size="lg" style={{ 
            maxWidth: '700px', 
            margin: '0 auto',
            textAlign: 'center'
          }}>
            {dpp.description}
          </TextBlock>
        )}

        {/* Product Information Grid - Basis- & Produktdaten */}
        {(dpp.sku || dpp.gtin || dpp.countryOfOrigin) && (
          <>
            <Accent type="highlight" style={{ margin: '3rem auto' }} />
            
            <div style={{
              maxWidth: '900px',
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '2rem',
            }}>
              {dpp.sku && (
                <div style={{ textAlign: 'center' }}>
                  <p style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: '#7A7A7A',
                    marginBottom: '0.5rem',
                  }}>
                    SKU
                  </p>
                  <TextBlock size="base" weight="medium">{dpp.sku}</TextBlock>
                </div>
              )}
              
              {dpp.gtin && (
                <div style={{ textAlign: 'center' }}>
                  <p style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: '#7A7A7A',
                    marginBottom: '0.5rem',
                  }}>
                    GTIN/EAN
                  </p>
                  <TextBlock size="base" weight="medium">{dpp.gtin}</TextBlock>
                </div>
              )}
              
              {dpp.countryOfOrigin && (
                <div style={{ textAlign: 'center' }}>
                  <p style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: '#7A7A7A',
                    marginBottom: '0.5rem',
                  }}>
                    Herkunftsland
                  </p>
                  <TextBlock size="base" weight="medium">{dpp.countryOfOrigin}</TextBlock>
                </div>
              )}
            </div>
          </>
        )}

        {/* Materialien & Zusammensetzung */}
        {(dpp.materials || dpp.materialSource) && (
          <>
            <Accent type="divider" style={{ margin: '4rem auto 3rem' }} />
            
            <div style={{
              maxWidth: '900px',
              margin: '0 auto',
            }}>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: 700,
                lineHeight: 1.2,
                marginBottom: '2rem',
                textAlign: 'center',
                letterSpacing: '-0.02em',
              }}>
                Materialien & Zusammensetzung
              </h2>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '3rem',
              }}>
                {dpp.materials && (
                  <div>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      marginBottom: '1rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#7A7A7A',
                    }}>
                      Materialien
                    </h3>
                    <TextBlock>{dpp.materials}</TextBlock>
                  </div>
                )}

                {dpp.materialSource && (
                  <div>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      marginBottom: '1rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#7A7A7A',
                    }}>
                      Materialherkunft
                    </h3>
                    <TextBlock>{dpp.materialSource}</TextBlock>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Nutzung, Pflege & Lebensdauer */}
        {(dpp.careInstructions || dpp.lifespan || dpp.isRepairable || dpp.sparePartsAvailable) && (
          <>
            <Accent type="divider" style={{ margin: '4rem auto 3rem' }} />
            
            <div style={{
              maxWidth: '900px',
              margin: '0 auto',
            }}>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: 700,
                lineHeight: 1.2,
                marginBottom: '2rem',
                textAlign: 'center',
                letterSpacing: '-0.02em',
              }}>
                Nutzung, Pflege & Lebensdauer
              </h2>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '3rem',
              }}>
                {dpp.careInstructions && (
                  <div>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      marginBottom: '1rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#7A7A7A',
                    }}>
                      Pflegehinweise
                    </h3>
                    <TextBlock>{dpp.careInstructions}</TextBlock>
                  </div>
                )}

                {dpp.lifespan && (
                  <div>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      marginBottom: '1rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#7A7A7A',
                    }}>
                      Lebensdauer
                    </h3>
                    <TextBlock>{dpp.lifespan}</TextBlock>
                  </div>
                )}

                {dpp.isRepairable && (
                  <div>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      marginBottom: '1rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#7A7A7A',
                    }}>
                      Reparaturfähigkeit
                    </h3>
                    <TextBlock>{dpp.isRepairable}</TextBlock>
                  </div>
                )}

                {dpp.sparePartsAvailable && (
                  <div>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      marginBottom: '1rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#7A7A7A',
                    }}>
                      Ersatzteile
                    </h3>
                    <TextBlock>{dpp.sparePartsAvailable}</TextBlock>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Rechtliches & Konformität */}
        {dpp.conformityDeclaration && (
          <>
            <Accent type="divider" style={{ margin: '4rem auto 3rem' }} />
            
            <Section variant="contained" backgroundColor="#FAFAFA">
              <div style={{
                maxWidth: '900px',
                margin: '0 auto',
              }}>
                <h2 style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  lineHeight: 1.2,
                  marginBottom: '2rem',
                  textAlign: 'center',
                  letterSpacing: '-0.02em',
                }}>
                  Rechtliches & Konformität
                </h2>
                
                <div style={{
                  maxWidth: '700px',
                  margin: '0 auto',
                }}>
                  <TextBlock size="lg">{dpp.conformityDeclaration}</TextBlock>
                </div>
              </div>
            </Section>
          </>
        )}

        {/* Entsorgung */}
        {dpp.disposalInfo && (
          <>
            <Accent type="divider" style={{ margin: '4rem auto 3rem' }} />
            
            <div style={{
              maxWidth: '900px',
              margin: '0 auto',
            }}>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: 700,
                lineHeight: 1.2,
                marginBottom: '2rem',
                textAlign: 'center',
                letterSpacing: '-0.02em',
              }}>
                Entsorgung
              </h2>
              
              <div style={{
                maxWidth: '700px',
                margin: '0 auto',
              }}>
                <TextBlock size="lg">{dpp.disposalInfo}</TextBlock>
              </div>
            </div>
          </>
        )}
      </Section>

      {/* Rücknahme & Second Life - Nur wenn Daten vorhanden */}
      {(dpp.takebackOffered || dpp.takebackContact || dpp.secondLifeInfo) && (
        <>
          <Accent type="divider" style={{ margin: '4rem auto 3rem' }} />
          
          <Section variant="contained" backgroundColor="#FAFAFA">
            <div style={{
              maxWidth: '900px',
              margin: '0 auto',
            }}>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: 700,
                lineHeight: 1.2,
                marginBottom: '2rem',
                textAlign: 'center',
                letterSpacing: '-0.02em',
              }}>
                Rücknahme & Second Life
              </h2>
              
              <div style={{
                maxWidth: '700px',
                margin: '0 auto',
              }}>
                {dpp.takebackOffered && (
                  <TextBlock size="lg" style={{ marginBottom: '1.5rem' }}>
                    {dpp.takebackOffered}
                  </TextBlock>
                )}
                
                {dpp.takebackContact && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      marginBottom: '0.5rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#7A7A7A',
                    }}>
                      Kontakt für Rücknahme
                    </h3>
                    <TextBlock>{dpp.takebackContact}</TextBlock>
                  </div>
                )}
                
                {dpp.secondLifeInfo && (
                  <QuoteBlock attribution={brandName}>
                    {dpp.secondLifeInfo}
                  </QuoteBlock>
                )}
              </div>
            </div>
          </Section>
        </>
      )}

      {/* Additional Media Gallery - Nur wenn weitere Bilder im Produktdaten-Block vorhanden */}
      {galleryImages.length > 0 && (
        <>
          <Accent type="divider" style={{ margin: '4rem auto 3rem' }} />
          
          <Section variant="contained">
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: '2rem',
              textAlign: 'center',
              letterSpacing: '-0.02em',
            }}>
              Galerie
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
            }}>
              {galleryImages.map((media) => (
                <Image
                  key={media.id}
                  src={media.storageUrl}
                  alt={`${dpp.name} - Bild ${media.id}`}
                  aspectRatio="4:3"
                />
              ))}
            </div>
          </Section>
        </>
      )}

      {/* Footer nur wenn Organization Name vorhanden (aus DPP-Daten) */}
      {dpp.organization.name && (
        <Section variant="contained" backgroundColor="#0A0A0A">
          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            textAlign: 'center',
            color: '#FFFFFF',
            paddingTop: '3rem',
            paddingBottom: '3rem',
          }}>
            <TextBlock size="sm" style={{ color: '#9A9A9A' }}>
              {dpp.organization.name}
            </TextBlock>
          </div>
        </Section>
      )}
    </Page>
  )
}

