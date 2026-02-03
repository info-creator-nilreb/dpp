/**
 * Multi-Question Poll Block Editor
 * 
 * Editor für Multi-Question Polls mit bis zu 3 Fragen
 * Jede Frage kann bis zu 5 Antwortoptionen haben
 */

"use client"

import React, { useState } from 'react'

interface Question {
  question: string
  options: string[]
}

interface MultiQuestionPollConfig {
  questions: Question[]
  completionMessage: string
}

interface MultiQuestionPollBlockEditorProps {
  content: Record<string, any>
  onChange: (config: MultiQuestionPollConfig) => void
}

export default function MultiQuestionPollBlockEditor({
  content,
  onChange
}: MultiQuestionPollBlockEditorProps) {
  // Parse config from content
  const config: MultiQuestionPollConfig = {
    questions: content.questions || [
      { question: '', options: ['', ''] }
    ],
    completionMessage: content.completionMessage || 'Vielen Dank für Ihre Teilnahme!'
  }

  function updateConfig(updates: Partial<MultiQuestionPollConfig>) {
    onChange({
      ...config,
      ...updates
    })
  }

  function updateQuestion(index: number, field: 'question' | 'options', value: string | string[]) {
    const questions = [...config.questions]
    if (field === 'question') {
      questions[index] = { ...questions[index], question: value as string }
    } else {
      questions[index] = { ...questions[index], options: value as string[] }
    }
    updateConfig({ questions })
  }

  function addQuestion() {
    if (config.questions.length >= 3) {
      return // Max 3 Fragen
    }
    const questions = [...config.questions, { question: '', options: ['', ''] }]
    updateConfig({ questions })
  }

  function removeQuestion(index: number) {
    if (config.questions.length <= 1) {
      return // Mindestens 1 Frage
    }
    const questions = config.questions.filter((_, i) => i !== index)
    updateConfig({ questions })
  }

  function addOption(questionIndex: number) {
    const question = config.questions[questionIndex]
    if (question.options.length >= 5) {
      return // Max 5 Optionen
    }
    const options = [...question.options, '']
    updateQuestion(questionIndex, 'options', options)
  }

  function updateOption(questionIndex: number, optionIndex: number, value: string) {
    const question = config.questions[questionIndex]
    const options = [...question.options]
    options[optionIndex] = value
    updateQuestion(questionIndex, 'options', options)
  }

  function removeOption(questionIndex: number, optionIndex: number) {
    const question = config.questions[questionIndex]
    if (question.options.length <= 2) {
      return // Mindestens 2 Optionen
    }
    const options = question.options.filter((_, i) => i !== optionIndex)
    updateQuestion(questionIndex, 'options', options)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Fragen */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <label style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#0A0A0A'
          }}>
            Fragen * (max. 3)
          </label>
          {config.questions.length < 3 && (
            <button
              type="button"
              onClick={addQuestion}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                color: '#24c598',
                backgroundColor: 'transparent',
                border: '1px solid #24c598',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F0FDF4'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              + Frage hinzufügen
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {config.questions.map((question, questionIndex) => (
            <div
              key={questionIndex}
              style={{
                padding: '1.5rem',
                backgroundColor: '#FAFAFA',
                border: '1px solid #E5E5E5',
                borderRadius: '8px'
              }}
            >
              {/* Frage Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <h4 style={{
                  fontSize: '0.9375rem',
                  fontWeight: '600',
                  color: '#0A0A0A',
                  margin: 0
                }}>
                  Frage {questionIndex + 1}
                </h4>
                {config.questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(questionIndex)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                      color: '#DC2626',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    Entfernen
                  </button>
                )}
              </div>

              {/* Frage Text */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#0A0A0A',
                  marginBottom: '0.5rem'
                }}>
                  Frage *
                </label>
                <input
                  type="text"
                  value={question.question}
                  onChange={(e) => updateQuestion(questionIndex, 'question', e.target.value)}
                  placeholder="Frage eingeben"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #CDCDCD',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                  maxLength={300}
                />
              </div>

              {/* Antwortoptionen */}
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem'
                }}>
                  <label style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#0A0A0A'
                  }}>
                    Antwortoptionen * (min. 2, max. 5)
                  </label>
                  {question.options.length < 5 && (
                    <button
                      type="button"
                      onClick={() => addOption(questionIndex)}
                      style={{
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.75rem',
                        color: '#24c598',
                        backgroundColor: 'transparent',
                        border: '1px solid #24c598',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      + Option
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {question.options.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                        placeholder={`Option ${optionIndex + 1}`}
                        style={{
                          flex: 1,
                          padding: '0.5rem 0.75rem',
                          border: '1px solid #CDCDCD',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          boxSizing: 'border-box'
                        }}
                        maxLength={200}
                      />
                      {question.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(questionIndex, optionIndex)}
                          title="Option entfernen"
                          style={{
                            padding: '0.5rem',
                            color: '#DC2626',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Completion Message */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: '600',
          color: '#0A0A0A',
          marginBottom: '0.5rem'
        }}>
          Dankesnachricht
        </label>
        <input
          type="text"
          value={config.completionMessage}
          onChange={(e) => updateConfig({ completionMessage: e.target.value })}
          placeholder="Vielen Dank für Ihre Teilnahme!"
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #CDCDCD',
            borderRadius: '6px',
            fontSize: '0.875rem',
            boxSizing: 'border-box'
          }}
          maxLength={200}
        />
        <p style={{
          fontSize: '0.75rem',
          color: '#7A7A7A',
          marginTop: '0.5rem',
          marginBottom: 0
        }}>
          Diese Nachricht wird nach dem Absenden der Umfrage angezeigt
        </p>
      </div>
    </div>
  )
}
