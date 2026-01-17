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
    
    console.log("[DppEditorPage] Found dppContent with", blocks.length, "blocks")
    console.log("[DppEditorPage] DppContent blocks:", JSON.stringify(blocks, null, 2))
    
    blocks.forEach((block: any) => {
      console.log("[DppEditorPage] Processing block:", block.id, "type:", block.type, "has data:", !!block.data)
      // Nur template-basierte Blöcke haben block.data
      if (!block.data || typeof block.data !== 'object') {
        console.log("[DppEditorPage] Skipping block (no data):", block.id)
        return
      }
      
      console.log("[DppEditorPage] Block data keys:", Object.keys(block.data))
      const blockData = block.data
      if (blockData && typeof blockData === 'object') {
        Object.keys(blockData).forEach(fieldKey => {
          const value = blockData[fieldKey]
          console.log("[DppEditorPage] Processing field:", fieldKey, "value:", value, "type:", typeof value)
          
          // Prüfe ob es ein wiederholbares Feld ist (Array von Objekten mit instanceId)
          if (Array.isArray(value) && value.length > 0) {
            // Prüfe ob das erste Element ein Objekt mit instanceId ist
            const firstElement = value[0]
            if (typeof firstElement === 'object' && firstElement !== null && firstElement.instanceId) {
              // Wiederholbares Feld: Speichere in fieldInstances
              fieldInstances[fieldKey] = value
              console.log("[DppEditorPage] Detected repeatable field:", fieldKey)
            } else {
              // Normales Array-Feld (z.B. Multi-Select): Speichere direkt
              fieldValues[fieldKey] = value
              console.log("[DppEditorPage] Detected array field (multi-select):", fieldKey)
            }
          } else if (value !== null && value !== undefined) {
            // Normales Feld: Speichere direkt
            fieldValues[fieldKey] = value
            console.log("[DppEditorPage] Detected normal field:", fieldKey, "=", value)
          }
        })
      }
    })
    
    console.log("[DppEditorPage] Extracted field values:", Object.keys(fieldValues).length, "fields:", Object.keys(fieldValues))
    console.log("[DppEditorPage] Extracted field values detail:", JSON.stringify(fieldValues, null, 2))
  } else {
    console.log("[DppEditorPage] No dppContent found for DPP")
  }

  // FALLBACK: Ergänze fieldValues mit direkten DPP-Spalten, wenn sie noch nicht vorhanden sind
  // Dies ist für alte DPPs und für den Fall, dass einige Felder noch nicht in DppContent gespeichert sind
  // WICHTIG: Ergänze nur, wenn Werte in DPP-Spalten vorhanden sind, aber nicht in fieldValues
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

  // Ergänze fieldValues mit direkten DPP-Spalten, wenn sie noch nicht vorhanden sind
  console.log("[DppEditorPage] Checking direct DPP columns for fallback")
  Object.keys(directFieldMapping).forEach(dppColumn => {
    const fieldKey = directFieldMapping[dppColumn]
    const value = (dpp as any)[dppColumn]
    console.log("[DppEditorPage] Checking column:", dppColumn, "->", fieldKey, "value:", value, "already in fieldValues:", !!fieldValues[fieldKey])
    // Ergänze nur, wenn Wert vorhanden ist UND noch nicht in fieldValues
    if (value !== null && value !== undefined && value !== "" && !fieldValues[fieldKey]) {
      fieldValues[fieldKey] = value
      console.log("[DppEditorPage] Fallback: Added", dppColumn, "->", fieldKey, "=", value)
    }
  })
  
  console.log("[DppEditorPage] Final fieldValues after fallback:", Object.keys(fieldValues).length, "fields:", Object.keys(fieldValues))

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
