export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import DppEditor from "@/components/DppEditor"
import AuthGate from "../../_auth/AuthGate"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

async function DppEditorContent({
  params,
}: {
  params: { id: string }
}) {
  
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/app/dashboard")
  }

  // Lade DPP mit Medien und Content direkt aus der Datenbank
  const dpp = await prisma.dpp.findUnique({
    where: { id: params.id },
    include: {
      organization: {
        select: {
          id: true,
          name: true
        }
      },
      media: true,
      content: {
        where: {
          isPublished: false // Lade nur Draft-Content (wie in API-Route)
        },
        orderBy: {
          updatedAt: "desc"
        },
        take: 1 // Neueste Draft-Version
      }
    }
  })

  if (!dpp) {
    redirect("/app/dpps")
  }

  // Prüfe Zugriff (User muss Mitglied der Organisation sein)
  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      organizationId: dpp.organizationId
    }
  })

  if (!membership) {
    redirect("/app/dpps")
  }

  // Extrahiere fieldValues und fieldInstances aus DppContent (gleiche Logik wie API-Route)
  let fieldValues: Record<string, string | string[]> = {}
  let fieldInstances: Record<string, Array<{
    instanceId: string
    values: Record<string, string | string[]>
  }>> = {}

  if (dpp.content && dpp.content.length > 0) {
    const dppContent = dpp.content[0]
    const blocks = (dppContent.blocks as any) || []
    
    blocks.forEach((block: any) => {
      // Nur template-basierte Blöcke haben block.data
      if (!block.data || typeof block.data !== 'object') {
        return
      }
      
      const blockData = block.data
      if (blockData && typeof blockData === 'object') {
        Object.keys(blockData).forEach(fieldKey => {
          const value = blockData[fieldKey]
          
          // Prüfe ob es ein wiederholbares Feld ist (Array von Objekten mit instanceId)
          if (Array.isArray(value) && value.length > 0) {
            // Prüfe ob das erste Element ein Objekt mit instanceId ist
            const firstElement = value[0]
            if (typeof firstElement === 'object' && firstElement !== null && firstElement.instanceId) {
              // Wiederholbares Feld: Speichere in fieldInstances
              fieldInstances[fieldKey] = value
            } else {
              // Normales Array-Feld (z.B. Multi-Select): Speichere direkt
              fieldValues[fieldKey] = value
            }
          } else if (value !== null && value !== undefined) {
            // Normales Feld: Speichere direkt
            fieldValues[fieldKey] = value
          }
        })
      }
    })
  }

  // FALLBACK: Wenn keine template-basierten Felder vorhanden sind, verwende direkte DPP-Spalten
  // Dies ist für alte DPPs, die noch keine template-basierten Felder haben
  if (Object.keys(fieldValues).length === 0 && Object.keys(fieldInstances).length === 0) {
    // Mappe direkte DPP-Spalten zu template-basierten Feld-Keys
    // Diese Mapping-Logik sollte mit dem Template übereinstimmen
    const directFieldMapping: Record<string, string> = {
      "name": "name",
      "description": "description",
      "sku": "sku",
      "gtin": "gtin",
      "brand": "brand",
      "countryOfOrigin": "countryOfOrigin",
      "materials": "materials",
      "materialSource": "materialSource",
      "careInstructions": "careInstructions",
      "isRepairable": "isRepairable",
      "sparePartsAvailable": "sparePartsAvailable",
      "lifespan": "lifespan",
      "conformityDeclaration": "conformityDeclaration",
      "disposalInfo": "disposalInfo",
      "takebackOffered": "takebackOffered",
      "takebackContact": "takebackContact",
      "secondLifeInfo": "secondLifeInfo"
    }

    Object.keys(directFieldMapping).forEach(dppColumn => {
      const fieldKey = directFieldMapping[dppColumn]
      const value = (dpp as any)[dppColumn]
      if (value !== null && value !== undefined && value !== "") {
        fieldValues[fieldKey] = value
      }
    })
  }

  // Normalize category to expected union type for Dpp
  const categoryValues = ["TEXTILE", "FURNITURE", "OTHER"] as const
  type CategoryType = typeof categoryValues[number]
  const normalizedDpp = {
    ...dpp,
    category: categoryValues.includes(dpp.category as CategoryType)
      ? (dpp.category as CategoryType)
      : "OTHER",
    createdAt: dpp.createdAt,
    updatedAt: dpp.updatedAt,
    media: dpp.media.map((m) => ({
      ...m,
      uploadedAt: m.uploadedAt
    })),
    // Füge _fieldValues und _fieldInstances hinzu
    _fieldValues: fieldValues,
    _fieldInstances: fieldInstances
  } as any

  return <DppEditor dpp={normalizedDpp} isNew={false} />
}

export default async function DppEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const id = resolvedParams.id
  
  if (!id || id === "undefined" || id === "") {
    return (
      <AuthGate>
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <p style={{ color: "#DC2626" }}>Fehler: DPP-ID fehlt oder ist ungültig</p>
        </div>
      </AuthGate>
    )
  }
  
  return (
    <AuthGate>
      <DppEditorContent params={{ id }} />
    </AuthGate>
  )
}
