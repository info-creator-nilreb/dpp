/**
 * Public DPP Page - Editorial Frontend
 *
 * Zeigt die veröffentlichte DPP-Ansicht (EditorialDppViewRedesign).
 * Nutzt dieselbe Ansicht wie die Vorschau im Editor und die versionierte URL.
 * Ohne versionNumber: neueste veröffentlichte Version (z. B. QR-Code).
 */

import DppPublicView from '@/components/public/DppPublicView'

interface PublicDppPageProps {
  params: Promise<{ dppId: string }>
}

export const dynamic = 'force-dynamic'

export default async function PublicDppPage({ params }: PublicDppPageProps) {
  const { dppId } = await params
  return <DppPublicView dppId={dppId} />
}
