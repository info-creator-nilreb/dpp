/**
 * Not Found Page for DPP Editor
 */

import Link from "next/link"

export default function DppEditorNotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          DPP nicht gefunden
        </h2>
        <p className="text-gray-600 mb-6">
          Der angeforderte Digital Product Pass wurde nicht gefunden oder Sie haben keine Berechtigung, darauf zuzugreifen.
        </p>
        <Link
          href="/app/dpps"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Zurück zur Übersicht
        </Link>
      </div>
    </div>
  )
}

