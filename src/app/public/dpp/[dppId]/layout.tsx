/**
 * Public DPP Layout
 * 
 * Explizites Layout für Public DPP Seiten ohne Sidebar und Burger-Menu
 * Stellt sicher, dass die Editorial-Ansicht vollständig ohne Navigation angezeigt wird
 */

export default function PublicDppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ 
      width: '100%', 
      minHeight: '100vh',
      margin: 0,
      padding: 0,
      overflowX: 'hidden'
    }}>
      {children}
    </div>
  )
}
