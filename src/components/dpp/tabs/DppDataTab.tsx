"use client"

/**
 * DPP Data Tab
 * 
 * Zeigt Compliance-Informationen (ESPR-relevant)
 * Diese Daten sind NICHT Teil des CMS
 */

import DppEditor from "@/components/DppEditor"

interface DppDataTabProps {
  dpp: any
}

export default function DppDataTab({ dpp }: DppDataTabProps) {
  return (
      <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                Pflichtinformationen
              </h3>
              <p className="text-sm text-blue-800 leading-relaxed">
                Diese Informationen sind Teil des ESPR-konformen Produktpasses
                und können nicht frei angeordnet oder entfernt werden.
              </p>
            </div>
          </div>
        </div>

        {/* DPP Editor (Compliance Data) */}
        <DppEditor dpp={dpp} isNew={false} />
      </div>
    </div>
  )
}

