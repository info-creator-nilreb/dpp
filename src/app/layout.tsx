import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Digitaler Produktpass - DPP in 3 Minuten | ESPR-ready',
  description: 'Erstellen Sie Ihren Digitalen Produktpass für Textil & Möbel. ESPR-konform, einfach und schnell. Jetzt kostenlos testen.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>{children}</body>
    </html>
  )
}



