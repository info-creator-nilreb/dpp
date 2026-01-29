export const dynamic = "force-dynamic"

import { Suspense } from "react"
import NewDppContent from "./NewDppContent"
import AuthGate from "../../_auth/AuthGate"
import { getCategoriesWithPublishedTemplates } from "@/lib/template-helpers"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { LoadingSpinner } from "@/components/LoadingSpinner"

// Lade Organizations - mit Error-Handling für Connection Pool Overflow
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
    // Datenbankverbindungsfehler abfangen (Connection Pool Overflow, Network Errors, etc.)
    if (
      error?.message?.includes("Can't reach database server") || 
      error?.code === "P1001" ||
      error?.message?.includes("MaxClientsInSessionMode") ||
      error?.message?.includes("max clients reached")
    ) {
      // Bei Connection Pool Overflow: Leeres Array zurückgeben statt Fehler zu werfen
      // Die Seite kann trotzdem geladen werden, nur ohne Organizations
      return []
    }
    throw error
  }
}

export default async function NewDppPage() {
  // Lade Kategorien und Organizations sequenziell, um Connection Pool Overflow zu vermeiden
  // In Production kann paralleles Laden zu "MaxClientsInSessionMode" Fehlern führen
  const session = await auth()
  const userId = session?.user?.id
  
  try {
    // Sequenzielles Laden statt Promise.all, um Connection Pool zu schonen
    const availableCategories = await getCategoriesWithPublishedTemplates()
    const organizations = userId ? await loadUserOrganizations(userId) : []
    
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
  } catch (error: any) {
    // Bei Connection Pool Overflow oder anderen DB-Fehlern: Fallback mit leeren Daten
    if (
      error?.message?.includes("MaxClientsInSessionMode") ||
      error?.message?.includes("max clients reached") ||
      error?.code === "P1001"
    ) {
      return (
        <AuthGate>
          <NewDppContent 
            availableCategories={[]}
            initialOrganizations={[]}
          />
        </AuthGate>
      )
    }
    // Andere Fehler weiterwerfen
    throw error
  }
}
