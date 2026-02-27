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
  searchParams?: Promise<{ from?: string }>
}

export const dynamic = 'force-dynamic'

export default async function PublicVersionPage({ params, searchParams }: PublicVersionPageProps) {
  const resolvedParams = await params
  const resolvedSearch = searchParams ? await searchParams : {}
  const versionNumber = parseInt(resolvedParams.versionNumber, 10)
  
  if (isNaN(versionNumber)) {
    notFound()
  }

  return <DppPublicView dppId={resolvedParams.dppId} versionNumber={versionNumber} skipScan={resolvedSearch.from === 'app'} />
}
