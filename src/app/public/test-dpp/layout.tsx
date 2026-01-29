/**
 * Test DPP Layout
 * 
 * Explizites Layout für Test DPP Seite ohne Sidebar und Burger-Menu
 */

export default function TestDppLayout({
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
