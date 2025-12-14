import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Digital Product Passport - DPP in unter 3 Minuten | ESPR-ready',
  description: 'Erstellen Sie Ihren Digital Product Passport für Textil & Möbel. ESPR-konform, einfach und schnell. Jetzt kostenlos testen.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>{children}</body>
    </html>
  )
}



