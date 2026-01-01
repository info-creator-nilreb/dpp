"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react"

interface UserProfile {
  role: string | null
  firstName: string | null
  lastName: string | null
  email: string | null
}

interface AppDataContextType {
  availableFeatures: string[]
  isLoading: boolean
  refresh: () => Promise<void>
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined)

/**
 * AppDataProvider
 * 
 * Lädt Features beim Provider-Init (nicht im Render).
 * User-Profil-Daten (firstName, lastName, role, email) kommen jetzt aus der NextAuth Session
 * und sind synchron verfügbar.
 */
export function AppDataProvider({ children }: { children: ReactNode }) {
  const [availableFeatures, setAvailableFeatures] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const hasLoadedRef = useRef(false)

  const loadFeatures = async () => {
    try {
      const featuresResponse = await fetch("/api/app/features", { cache: "no-store" })
      if (featuresResponse.ok) {
        const featuresData = await featuresResponse.json()
        setAvailableFeatures(featuresData.features || [])
      }
    } catch (error) {
      console.error("Error loading features:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Nur einmal beim Mount laden (nicht bei jedem Render)
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      loadFeatures()
    }
  }, [])

  return (
    <AppDataContext.Provider
      value={{
        availableFeatures,
        isLoading,
        refresh: loadFeatures,
      }}
    >
      {children}
    </AppDataContext.Provider>
  )
}

export function useAppData() {
  const context = useContext(AppDataContext)
  if (context === undefined) {
    throw new Error("useAppData must be used within an AppDataProvider")
  }
  return context
}



