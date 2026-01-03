"use client"

/**
 * Quick Poll Block Renderer
 */

import { useState } from "react"
import { Block, StylingConfig } from "@/lib/cms/types"
import { QuickPollBlockContent } from "@/lib/cms/types"

interface QuickPollBlockRendererProps {
  block: Block
  theme: StylingConfig
}

export default function QuickPollBlockRenderer({
  block,
  theme
}: QuickPollBlockRendererProps) {
  const content = block.content as QuickPollBlockContent
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)

  function handleOptionClick(optionId: string) {
    if (submitted) return

    if (content.allowMultiple) {
      setSelectedOptions(prev => 
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      )
    } else {
      setSelectedOptions([optionId])
    }
  }

  function handleSubmit() {
    if (selectedOptions.length === 0) return
    setSubmitted(true)
    // TODO: Send poll results to API
  }

  return (
    <div className="quick-poll-block p-6 border rounded-lg" style={{ borderColor: theme.colors.accent }}>
      {/* Question */}
      {content.question && (
        <h3 
          className="text-xl font-semibold mb-4"
          style={{ color: theme.colors.primary }}
        >
          {content.question}
        </h3>
      )}

      {/* Options */}
      {content.options && content.options.length > 0 && (
        <div className="space-y-2 mb-4">
          {content.options.map((option) => {
            const isSelected = selectedOptions.includes(option.id)
            return (
              <button
                key={option.id}
                onClick={() => handleOptionClick(option.id)}
                disabled={submitted}
                className={`
                  w-full text-left p-3 rounded border transition-colors
                  ${isSelected 
                    ? "border-blue-500 bg-blue-50" 
                    : "border-gray-200 hover:border-gray-300"
                  }
                  ${submitted ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                `}
                style={{
                  borderColor: isSelected ? theme.colors.accent : undefined
                }}
              >
                {content.allowMultiple && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    className="mr-2"
                  />
                )}
                {!content.allowMultiple && (
                  <input
                    type="radio"
                    checked={isSelected}
                    readOnly
                    className="mr-2"
                  />
                )}
                {option.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Submit Button */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={selectedOptions.length === 0}
          className="px-4 py-2 rounded text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: theme.colors.accent }}
        >
          Absenden
        </button>
      )}

      {/* Thank You Message */}
      {submitted && (
        <div className="text-center py-4">
          <p style={{ color: theme.colors.accent }}>
            Vielen Dank für Ihre Teilnahme!
          </p>
        </div>
      )}

      {/* Results (if enabled) */}
      {submitted && content.showResults && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm font-medium mb-2">Ergebnisse:</p>
          {/* TODO: Display poll results from API */}
          <p className="text-xs text-gray-500">Ergebnisse werden geladen...</p>
        </div>
      )}
    </div>
  )
}

