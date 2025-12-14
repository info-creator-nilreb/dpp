import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { requireDppAccess } from "@/lib/dpp-access"
import { prisma } from "@/lib/prisma"
import DppEditor from "@/components/DppEditor"

/**
 * DPP One-Pager Editor
 * 
 * Zeigt Editor für einen DPP mit:
 * - Produktinformationen
 * - Medien & Dokumente (Upload, Liste, Delete)
 */
export default async function DppEditorPage({
  params,
}: {
  params: { dppId: string }
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  // Prüfe Zugriff auf DPP
  await requireDppAccess(params.dppId)

  // Lade DPP mit Medien
  const dpp = await prisma.dpp.findUnique({
    where: { id: params.dppId },
    include: {
      organization: true,
      media: {
        orderBy: { uploadedAt: "desc" }
      }
    }
  })

  if (!dpp) {
    redirect("/app/dashboard")
  }

  // Normalize category to expected union type for Dpp
  const categoryValues = ["TEXTILE", "FURNITURE", "OTHER"] as const
  type CategoryType = typeof categoryValues[number];
  const normalizedDpp = {
    ...dpp,
    category: categoryValues.includes(dpp.category as CategoryType)
      ? (dpp.category as CategoryType)
      : "OTHER"
  }

  return <DppEditor dpp={normalizedDpp} isNew={false} />
}
