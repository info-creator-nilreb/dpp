"use client"

/**
 * DPP Frontend Tab
 * 
 * Branding & Styling (Premium only)
 */

import { StylingConfig } from "@/lib/cms/types"
import StylingEditor from "@/components/cms/StylingEditor"
import { useNotification } from "@/components/NotificationProvider"

interface DppFrontendTabProps {
  dppId: string
  organizationId: string
  userId: string
  styling: StylingConfig | null
  onStylingChange: (styling: StylingConfig) => void
  availableFeatures: string[]
  loading: boolean
  onReload: () => void
}

export default function DppFrontendTab({
  dppId,
  styling,
  onStylingChange,
  availableFeatures,
  loading
}: DppFrontendTabProps) {
  const { showNotification } = useNotification()
  const hasStyling = availableFeatures.includes("cms_styling")

  async function handleUpdateStyling(updates: Partial<StylingConfig>) {
    try {
      const response = await fetch(`/api/app/dpp/${dppId}/content/styling`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Fehler beim Aktualisieren")
      }

      const data = await response.json()
      onStylingChange(data.styling)
      showNotification("Styling aktualisiert", "success")
    } catch (error: any) {
      showNotification(error.message || "Fehler beim Aktualisieren", "error")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Lade Styling...</div>
      </div>
    )
  }

  if (!hasStyling) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <div className="mb-4 text-6xl">🔒</div>
          <h3 className="text-xl font-semibold mb-2">Styling nicht verfügbar</h3>
          <p className="text-gray-500 mb-4">
            Branding & Styling ist nur im Premium Plan verfügbar.
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Upgrade auf Premium
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-3xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Frontend Styling</h2>
          <p className="text-gray-600">
            Konfigurieren Sie das Branding für Ihren Digital Product Passport.
            Diese Einstellungen gelten global für alle veröffentlichten Versionen.
          </p>
        </div>

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                Premium Feature
              </h3>
              <p className="text-sm text-blue-800">
                Branding & Styling ist nur im Premium Plan verfügbar.
                Änderungen werden sofort in der Vorschau und nach Veröffentlichung sichtbar.
              </p>
            </div>
          </div>
        </div>

        {/* Styling Editor */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <StylingEditor
            styling={styling}
            onUpdate={handleUpdateStyling}
          />
        </div>
      </div>
    </div>
  )
}

