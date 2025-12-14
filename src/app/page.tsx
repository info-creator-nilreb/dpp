import Link from 'next/link'
import Header from '@/components/Header'
import HeroLogo from '@/components/HeroLogo'

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF', overflowX: 'hidden' }}>
      {/* Sticky Header */}
      <Header />

      {/* Hero Section */}
      <section style={{
        backgroundColor: '#F5F5F5',
        color: '#0A0A0A',
        padding: 'clamp(2rem, 6vw, 4rem) clamp(1rem, 4vw, 2rem) clamp(3rem, 8vw, 5rem)',
        textAlign: 'center',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
          {/* Großes Logo in Hero */}
          <HeroLogo />
          
          <h1 style={{
            fontSize: 'clamp(1.75rem, 5.5vw, 3.5rem)',
            fontWeight: '700',
            marginBottom: '0.5rem',
            lineHeight: '1.2',
            color: '#0A0A0A',
            padding: '0 clamp(0.5rem, 2vw, 1rem)'
          }}>
            In unter 3 Minuten zum Digitalen Produktpass.
          </h1>
          <p style={{
            fontSize: 'clamp(1.25rem, 4vw, 3.5rem)',
            marginBottom: 'clamp(1.5rem, 4vw, 2.5rem)',
            color: '#E20074',
            fontWeight: '700',
            lineHeight: '1.2',
            padding: '0 clamp(0.5rem, 2vw, 1rem)'
          }}>
            Einfach. Transparent. Nachhaltig.
          </p>
          <p style={{
            fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',
            marginBottom: 'clamp(2rem, 5vw, 2.5rem)',
            lineHeight: '1.6',
            maxWidth: '700px',
            margin: '0 auto clamp(2rem, 5vw, 2.5rem)',
            color: '#7A7A7A',
            padding: '0 clamp(0.5rem, 2vw, 1rem)'
          }}>
            Erstellen Sie digitale Produktpässe - schnell und zuverlässig.
          </p>
          <div style={{ 
            display: 'flex', 
            gap: 'clamp(0.75rem, 2vw, 1rem)', 
            justifyContent: 'center', 
            flexWrap: 'wrap',
            padding: '0 clamp(0.5rem, 2vw, 1rem)'
          }}>
            <Link href="/signup" style={{
              backgroundColor: '#E20074',
              color: '#FFFFFF',
              padding: 'clamp(0.875rem, 2.5vw, 1rem) clamp(1.25rem, 4vw, 2.5rem)',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
              display: 'inline-block',
              boxShadow: '0 4px 12px rgba(226, 0, 116, 0.3)',
              whiteSpace: 'nowrap'
            }}>
              Kostenlos testen
            </Link>
            <a href="#benefits" style={{
              backgroundColor: 'transparent',
              color: '#0A0A0A',
              padding: 'clamp(0.875rem, 2.5vw, 1rem) clamp(1.25rem, 4vw, 2.5rem)',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
              display: 'inline-block',
              border: '2px solid #E20074',
              whiteSpace: 'nowrap'
            }}>
              Unsere Vorteile
            </a>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" style={{
        padding: 'clamp(3rem, 8vw, 5rem) clamp(1rem, 4vw, 2rem)',
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: '#FFFFFF',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <h2 style={{
          fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
          textAlign: 'center',
          marginBottom: 'clamp(2rem, 5vw, 3rem)',
          color: '#0A0A0A',
          fontWeight: '700'
        }}>
          Warum T-Pass?
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: 'clamp(1.5rem, 4vw, 2rem)',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div style={{
            padding: 'clamp(1.5rem, 4vw, 2rem)',
            backgroundColor: '#F5F5F5',
            borderRadius: '12px',
            border: '1px solid #CDCDCD'
          }}>
            <div style={{ width: '48px', height: '48px', marginBottom: '1rem', margin: '0 auto 1rem' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#E20074" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            </div>
            <h3 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', marginBottom: '1rem', color: '#0A0A0A', fontWeight: '700' }}>
              In 3 Minuten erstellt
            </h3>
            <p style={{ color: '#7A7A7A', lineHeight: '1.6', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
              Keine komplexen Tools oder Schulungen nötig. Erstellen Sie Ihren DPP schnell und unkompliziert.
            </p>
          </div>
          <div style={{
            padding: 'clamp(1.5rem, 4vw, 2rem)',
            backgroundColor: '#F5F5F5',
            borderRadius: '12px',
            border: '1px solid #CDCDCD'
          }}>
            <div style={{ width: '48px', height: '48px', marginBottom: '1rem', margin: '0 auto 1rem' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#2070B2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
              </svg>
            </div>
            <h3 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', marginBottom: '1rem', color: '#0A0A0A', fontWeight: '700' }}>
              Einfach & intuitiv
            </h3>
            <p style={{ color: '#7A7A7A', lineHeight: '1.6', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
              Perfekt für Kleinst- und Kleinunternehmen. Keine IT-Kenntnisse erforderlich.
            </p>
          </div>
          <div style={{
            padding: 'clamp(1.5rem, 4vw, 2rem)',
            backgroundColor: '#F5F5F5',
            borderRadius: '12px',
            border: '1px solid #CDCDCD'
          }}>
            <div style={{ width: '48px', height: '48px', marginBottom: '1rem', margin: '0 auto 1rem' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#0FA425" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <h3 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', marginBottom: '1rem', color: '#0A0A0A', fontWeight: '700' }}>
              Flexible Importfunktionen
            </h3>
            <p style={{ color: '#7A7A7A', lineHeight: '1.6', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
              Importieren Sie Produktdaten aus verschiedenen Quellen. CSV, Excel, API – wir unterstützen alle gängigen Formate.
            </p>
          </div>
          <div style={{
            padding: 'clamp(1.5rem, 4vw, 2rem)',
            backgroundColor: '#F5F5F5',
            borderRadius: '12px',
            border: '1px solid #CDCDCD'
          }}>
            <div style={{ width: '48px', height: '48px', marginBottom: '1rem', margin: '0 auto 1rem' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#064545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <h3 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', marginBottom: '1rem', color: '#0A0A0A', fontWeight: '700' }}>
              Nachhaltigkeitstracking
            </h3>
            <p style={{ color: '#7A7A7A', lineHeight: '1.6', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
              Verfolgen Sie den ökologischen Fußabdruck Ihrer Produkte über den gesamten Lebenszyklus. Transparent und nachvollziehbar.
            </p>
          </div>
          <div style={{
            padding: 'clamp(1.5rem, 4vw, 2rem)',
            backgroundColor: '#F5F5F5',
            borderRadius: '12px',
            border: '1px solid #CDCDCD'
          }}>
            <div style={{ width: '48px', height: '48px', marginBottom: '1rem', margin: '0 auto 1rem' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#E20074" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <h3 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', marginBottom: '1rem', color: '#0A0A0A', fontWeight: '700' }}>
              Schnellbefragungen
            </h3>
            <p style={{ color: '#7A7A7A', lineHeight: '1.6', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
              Erstellen Sie interaktive Befragungen direkt im Digital Product Passport. Sammeln Sie Feedback von Kunden einfach und schnell.
            </p>
          </div>
          <div style={{
            padding: 'clamp(1.5rem, 4vw, 2rem)',
            backgroundColor: '#F5F5F5',
            borderRadius: '12px',
            border: '1px solid #CDCDCD'
          }}>
            <div style={{ width: '48px', height: '48px', marginBottom: '1rem', margin: '0 auto 1rem' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#2070B2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <h3 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', marginBottom: '1rem', color: '#0A0A0A', fontWeight: '700' }}>
              Neuer Kundenkanal
            </h3>
            <p style={{ color: '#7A7A7A', lineHeight: '1.6', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
              Mehr als nur Nachhaltigkeitsinfos. Nutzen Sie Cross-Selling und erweitern Sie Ihren Kundenkanal mit zusätzlichen Produktinformationen.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{
        padding: 'clamp(3rem, 8vw, 5rem) clamp(1rem, 4vw, 2rem)',
        backgroundColor: '#F5F5F5',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
            marginBottom: '1rem',
            color: '#0A0A0A',
            fontWeight: '700'
          }}>
            So einfach geht's
          </h2>
          <p style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
            color: '#7A7A7A',
            marginBottom: 'clamp(2rem, 5vw, 3rem)'
          }}>
            Drei Schritte zu Ihrem Digital Product Passport
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            flexWrap: 'wrap',
            gap: 'clamp(1.5rem, 4vw, 2rem)',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#E20074',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                margin: '0 auto 1rem'
              }}>1</div>
              <h3 style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.2rem)', marginBottom: '0.5rem', color: '#0A0A0A', fontWeight: '700' }}>
                Produktdaten eingeben
              </h3>
              <p style={{ color: '#7A7A7A', fontSize: 'clamp(0.9rem, 2vw, 0.95rem)', lineHeight: '1.6' }}>
                Laden Sie Ihre Produktinformationen hoch oder geben Sie sie manuell ein.
              </p>
            </div>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#E20074',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                margin: '0 auto 1rem'
              }}>2</div>
              <h3 style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.2rem)', marginBottom: '0.5rem', color: '#0A0A0A', fontWeight: '700' }}>
                Automatische Validierung
              </h3>
              <p style={{ color: '#7A7A7A', fontSize: 'clamp(0.9rem, 2vw, 0.95rem)', lineHeight: '1.6' }}>
                Unser System prüft automatisch auf ESPR-Konformität und Vollständigkeit.
              </p>
            </div>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#E20074',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                margin: '0 auto 1rem'
              }}>3</div>
              <h3 style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.2rem)', marginBottom: '0.5rem', color: '#0A0A0A', fontWeight: '700' }}>
                DPP erhalten
              </h3>
              <p style={{ color: '#7A7A7A', fontSize: 'clamp(0.9rem, 2vw, 0.95rem)', lineHeight: '1.6' }}>
                Fertig! Ihr Digital Product Passport ist einsatzbereit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & CTA Section */}
      <section style={{
        padding: 'clamp(3rem, 8vw, 5rem) clamp(1rem, 4vw, 2rem)',
        textAlign: 'center',
        backgroundColor: '#FFFFFF',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
            marginBottom: '1.5rem',
            color: '#0A0A0A',
            fontWeight: '700'
          }}>
            Bereit für den nächsten Schritt?
          </h2>
          <p style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
            color: '#7A7A7A',
            marginBottom: '2.5rem',
            lineHeight: '1.6'
          }}>
            Starten Sie noch heute mit Ihrem ersten Digital Product Passport. 
            Keine Kreditkarte erforderlich.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{
              backgroundColor: '#E20074',
              color: '#FFFFFF',
              padding: 'clamp(1rem, 2.5vw, 1.2rem) clamp(2rem, 5vw, 3rem)',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
              display: 'inline-block',
              boxShadow: '0 4px 12px rgba(226, 0, 116, 0.3)'
            }}>
              Jetzt kostenlos starten
            </Link>
          </div>
          <p style={{
            marginTop: '2rem',
            fontSize: 'clamp(0.85rem, 2vw, 0.9rem)',
            color: '#7A7A7A'
          }}>
            ✓ Keine Kreditkarte erforderlich • ✓ Sofort loslegen • ✓ ESPR-konform
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: 'clamp(1.5rem, 4vw, 2rem)',
        textAlign: 'center',
        backgroundColor: '#121212',
        color: '#FFFFFF'
      }}>
        <p style={{ margin: 0, opacity: 0.8, color: '#CDCDCD', fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
          © 2025 T-Pass. Alle Rechte vorbehalten.
        </p>
      </footer>
    </div>
  )
}
