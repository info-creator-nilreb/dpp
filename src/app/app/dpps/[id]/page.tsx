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
  params: { id: string }
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

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

  return <DppEditor dpp={dpp} isNew={false} />
}

