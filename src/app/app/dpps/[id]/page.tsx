export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { requireDppAccess } from "@/lib/dpp-access"
import { prisma } from "@/lib/prisma"
import DppEditor from "@/components/DppEditor"
import AuthGate from "../../_auth/AuthGate"

async function DppEditorContent({
  params,
}: {
  params: { id: string }
}) {
  // Prüfe Zugriff auf DPP
  await requireDppAccess(params.id)

  // Lade DPP mit Medien
  const dpp = await prisma.dpp.findUnique({
    where: { id: params.id },
    include: {
      organization: true,
      media: {
        orderBy: { uploadedAt: "desc" }
      }
    }
  })

  if (!dpp) {
    redirect("/app/dpps")
  }

  // Normalize category to expected union type for Dpp
  const categoryValues = ["TEXTILE", "FURNITURE", "OTHER"] as const
  type CategoryType = typeof categoryValues[number]
  const normalizedDpp = {
    ...dpp,
    category: categoryValues.includes(dpp.category as CategoryType)
      ? (dpp.category as CategoryType)
      : "OTHER"
  }

  return <DppEditor dpp={normalizedDpp} isNew={false} />
}

export default async function DppEditorPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <AuthGate>
      <DppEditorContent params={params} />
    </AuthGate>
  )
}
