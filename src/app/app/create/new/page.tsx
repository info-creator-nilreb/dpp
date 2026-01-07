export const dynamic = "force-dynamic"

import { Suspense } from "react"
import NewDppContent from "./NewDppContent"
import AuthGate from "../../_auth/AuthGate"
import { getCategoriesWithPublishedTemplates } from "@/lib/template-helpers"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { LoadingSpinner } from "@/components/LoadingSpinner"

// Lade Organizations parallel zu Kategorien
async function loadUserOrganizations(userId: string) {
  try {
    const memberships = await prisma.membership.findMany({
      where: {
        userId: userId
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    return memberships.map(m => m.organization)
  } catch (error: any) {
    // Datenbankverbindungsfehler abfangen
    if (error?.message?.includes("Can't reach database server") || error?.code === "P1001") {
      return []
    }
    throw error
  }
}

export default async function NewDppPage() {
  // Lade Kategorien und Organizations parallel
  const session = await auth()
  const userId = session?.user?.id
  
  const [availableCategories, organizations] = await Promise.all([
    getCategoriesWithPublishedTemplates(),
    userId ? loadUserOrganizations(userId) : Promise.resolve([])
  ])
  
  return (
    <AuthGate>
      <Suspense fallback={
        <div style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          border: "1px solid #CDCDCD",
          padding: "2rem"
        }}>
          <LoadingSpinner message="Daten werden geladen..." />
        </div>
      }>
        <NewDppContent 
          availableCategories={availableCategories}
          initialOrganizations={organizations}
        />
      </Suspense>
    </AuthGate>
  )
}
