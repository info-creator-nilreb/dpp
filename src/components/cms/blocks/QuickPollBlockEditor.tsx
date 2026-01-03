"use client"

/**
 * Quick Poll Block Editor
 */

import { QuickPollBlockContent } from "@/lib/cms/types"

interface QuickPollBlockEditorProps {
  content: Record<string, any>
  onChange: (content: QuickPollBlockContent) => void
}

export default function QuickPollBlockEditor({
  content,
  onChange
}: QuickPollBlockEditorProps) {
  const data: QuickPollBlockContent = {
    question: content.question || "",
    options: content.options || [],
    allowMultiple: content.allowMultiple || false,
    showResults: content.showResults || false
  }

  function updateField(field: keyof QuickPollBlockContent, value: any) {
    onChange({
      ...data,
      [field]: value
    })
  }

  function addOption() {
    const newOption = {
      id: `opt_${Date.now()}`,
      label: ""
    }
    updateField("options", [...data.options, newOption])
  }

  function updateOption(index: number, field: string, value: string) {
    const options = [...data.options]
    options[index] = { ...options[index], [field]: value }
    updateField("options", options)
  }

  function removeOption(index: number) {
    const options = [...data.options]
    options.splice(index, 1)
    updateField("options", options)
  }

  return (
    <div className="space-y-6">
      {/* Question */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Frage *
        </label>
        <input
          type="text"
          value={data.question}
          onChange={(e) => updateField("question", e.target.value)}
          placeholder="Frage eingeben"
          className="w-full px-3 py-2 border border-gray-300 rounded"
          maxLength={300}
        />
      </div>

      {/* Options */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Optionen * (mindestens 2)
          </label>
          <button
            onClick={addOption}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            + Option hinzufügen
          </button>
        </div>
        {data.options.length === 0 && (
          <p className="text-sm text-gray-500 mb-3">
            Fügen Sie mindestens 2 Optionen hinzu
          </p>
        )}
        {data.options.length > 0 && (
          <div className="space-y-2">
            {data.options.map((option, index) => (
              <div key={option.id || index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={option.label}
                  onChange={(e) => updateOption(index, "label", e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                  maxLength={200}
                />
                {data.options.length > 2 && (
                  <button
                    onClick={() => removeOption(index)}
                    className="text-red-600 hover:text-red-700 text-sm px-2"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Einstellungen
        </label>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="allowMultiple"
            checked={data.allowMultiple}
            onChange={(e) => updateField("allowMultiple", e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="allowMultiple" className="text-sm text-gray-700">
            Mehrfachauswahl erlauben
          </label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="showResults"
            checked={data.showResults}
            onChange={(e) => updateField("showResults", e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="showResults" className="text-sm text-gray-700">
            Ergebnisse anzeigen
          </label>
        </div>
      </div>
    </div>
  )
}

