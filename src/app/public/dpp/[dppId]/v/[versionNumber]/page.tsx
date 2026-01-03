/**
 * Public DPP Version Page - Editorial Style
 * 
 * Premium editorial view for a specific DPP version.
 * Same editorial style as main public page, but shows specific version.
 */

import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import DppPublicView from '@/components/public/DppPublicView'

interface PublicVersionPageProps {
  params: Promise<{ dppId: string; versionNumber: string }>
}

export const dynamic = 'force-dynamic'

export default async function PublicVersionPage({ params }: PublicVersionPageProps) {
  const resolvedParams = await params
  const versionNumber = parseInt(resolvedParams.versionNumber, 10)
  
  if (isNaN(versionNumber)) {
    notFound()
  }

  // Use combined view: Compliance + CMS
  return <DppPublicView dppId={resolvedParams.dppId} versionNumber={versionNumber} />
}
