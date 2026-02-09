import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import PublicLayoutClient from '@/components/PublicLayoutClient'
import ConditionalLayout from '@/components/ConditionalLayout'
import PasswordProtectionWrapper from '@/components/PasswordProtectionWrapper'
import PasswordProtectionSessionCheck from '@/components/PasswordProtectionSessionCheck'
import { getTemplateCategoryKeywordsForSeo } from '@/lib/template-helpers'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.easyproductpass.com'

const baseKeywords = ['Digitaler Produktpass', 'DPP', 'ESPR', 'Nachhaltigkeit', 'Produktpass', 'EU-Verordnung']

export async function generateMetadata(): Promise<Metadata> {
  let categoryKeywords: string[] = []
  try {
    // 60s Cache: reduziert DB-Last bei jedem Request (MaxClientsInSessionMode)
    categoryKeywords = await unstable_cache(
      () => getTemplateCategoryKeywordsForSeo(),
      ['template-category-keywords-seo'],
      { revalidate: 60 }
    )()
  } catch {
    categoryKeywords = []
  }
  const keywords = [...baseKeywords, ...categoryKeywords]

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: 'Digitaler Produktpass - DPP in 3 Minuten | ESPR-ready',
      template: '%s | Easy Product Pass',
    },
    description: 'Erstellen Sie Ihren Digitalen Produktpass - ESPR-konform, einfach und schnell. Jetzt kostenlos testen.',
    keywords,
    authors: [{ name: 'Easy Product Pass', url: baseUrl }],
    creator: 'Easy Product Pass',
    openGraph: {
      type: 'website',
      locale: 'de_DE',
      url: baseUrl,
      siteName: 'Easy Product Pass',
      title: 'Digitaler Produktpass - DPP in 3 Minuten | ESPR-ready',
      description: 'Erstellen Sie Ihren Digitalen Produktpass - ESPR-konform, einfach und schnell. Jetzt kostenlos testen.',
      images: [{ url: '/apple-icon', width: 192, height: 192, alt: 'Easy Product Pass' }],
    },
    twitter: {
      card: 'summary',
      title: 'Digitaler Produktpass - DPP in 3 Minuten | ESPR-ready',
      description: 'Erstellen Sie Ihren Digitalen Produktpass - ESPR-konform, einfach und schnell.',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    icons: {
      icon: [
        { url: '/icon', type: 'image/png', sizes: '48x48' },
        { url: '/favicon.svg', type: 'image/svg+xml', sizes: 'any' },
      ],
      apple: [{ url: '/apple-icon', type: 'image/png', sizes: '192x192' }],
    },
    alternates: { canonical: baseUrl },
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <PasswordProtectionWrapper>
          <PasswordProtectionSessionCheck />
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </PasswordProtectionWrapper>
      </body>
    </html>
  )
}



