/**
 * Multi-Question Poll Renderer
 * 
 * Rendert eine Umfrage mit bis zu 3 Fragen, die horizontal durchgescrollt werden können
 * Nach Beantwortung wird eine konfigurierbare Nachricht angezeigt
 */

"use client"

import React, { useState, useRef, useEffect } from 'react'
import { UnifiedContentBlock } from '@/lib/content-adapter'
import { editorialColors } from '../tokens/colors'
import { editorialSpacing } from '../tokens/spacing'

interface MultiQuestionPollRendererProps {
  block: UnifiedContentBlock
  dppId: string
}

interface Question {
  question: string
  options: string[]
}

export default function MultiQuestionPollRenderer({ block, dppId }: MultiQuestionPollRendererProps) {
  const pollBlockId = block.id
  
  console.log('[MultiQuestionPollRenderer] Initialized', { 
    pollBlockId, 
    dppId, 
    blockId: block.id,
    blockKey: block.blockKey,
    fields: block.content?.fields
  })
  
  // Fragen kommen aus block.content.fields.questions.value (vom CMS-Adapter gesetzt)
  const questionsField = block.content?.fields?.questions
  const questions: Question[] = questionsField && Array.isArray(questionsField.value)
    ? questionsField.value
    : []
  
  console.log('[MultiQuestionPollRenderer] Questions from fields:', questions)
  
  // Completion Message aus fields
  const completionMessageField = block.content?.fields?.completionMessage
  const completionMessage = completionMessageField?.value || 
    'Vielen Dank für Ihre Teilnahme!'

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set())
  const [showAnswerConfirmation, setShowAnswerConfirmation] = useState<number | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Prüfe ob bereits beantwortet (LocalStorage)
  useEffect(() => {
    const answered = localStorage.getItem(`poll_${pollBlockId}_answered`)
    if (answered === 'true') {
      setIsSubmitted(true)
    }
  }, [pollBlockId])

  // Scroll zu aktueller Frage
  useEffect(() => {
    if (scrollContainerRef.current) {
      const questionElement = scrollContainerRef.current.children[currentQuestionIndex] as HTMLElement
      if (questionElement) {
        questionElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
      }
    }
  }, [currentQuestionIndex])

  const handleAnswer = (option: string) => {
    // Verhindere Änderungen nach Absenden
    if (isSubmitted) {
      return
    }
    
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: option
    }))
    
    // Markiere Frage als beantwortet
    setAnsweredQuestions(prev => new Set(prev).add(currentQuestionIndex))
    
    // Zeige Bestätigung für 2 Sekunden
    setShowAnswerConfirmation(currentQuestionIndex)
    setTimeout(() => {
      setShowAnswerConfirmation(null)
    }, 2000)
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    console.log('[MultiQuestionPollRenderer] handleSubmit called', { pollBlockId, dppId, answers })
    
    // Prüfe ob alle Fragen beantwortet wurden
    const allAnswered = questions.every((_, index) => answers[index] !== undefined)
    if (!allAnswered) {
      setError('Bitte beantworten Sie alle Fragen')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Generiere Session-ID (für Duplikat-Prävention)
      let sessionId = localStorage.getItem(`poll_${pollBlockId}_session`)
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem(`poll_${pollBlockId}_session`, sessionId)
      }

      // Formatiere Antworten
      const responses = Object.entries(answers).map(([index, answer]) => ({
        questionIndex: parseInt(index),
        answer
      }))

      const requestBody = {
        pollBlockId,
        dppId,
        responses,
        sessionId
      }
      
      console.log('[MultiQuestionPollRenderer] Submitting poll response:', requestBody)

      const response = await fetch('/api/polls/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      console.log('[MultiQuestionPollRenderer] Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('[MultiQuestionPollRenderer] Error response:', errorData)
        throw new Error(errorData.error || 'Fehler beim Speichern')
      }

      const responseData = await response.json()
      console.log('[MultiQuestionPollRenderer] Success response:', responseData)

      // Markiere als beantwortet
      localStorage.setItem(`poll_${pollBlockId}_answered`, 'true')
      setIsSubmitted(true)
      
      // Verhindere weitere Änderungen
      setAnsweredQuestions(new Set(Object.keys(answers).map(Number)))
    } catch (err: any) {
      console.error('[MultiQuestionPollRenderer] Submit error:', err)
      setError(err.message || 'Fehler beim Speichern der Antwort')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div style={{
        marginTop: editorialSpacing.md,
        padding: editorialSpacing.xl,
        backgroundColor: editorialColors.background.dark,
        borderRadius: '12px',
        textAlign: 'center',
      }}>
        {/* Check Icon */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: editorialSpacing.md,
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: editorialColors.brand.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: editorialColors.text.inverse }}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
        
        {/* Completion Message */}
        <p style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          color: editorialColors.text.inverse,
          margin: 0,
          lineHeight: 1.5,
        }}>
          {completionMessage}
        </p>
      </div>
    )
  }

  if (questions.length === 0) {
    return null
  }

  const currentQuestion = questions[currentQuestionIndex]
  const hasAnswer = answers[currentQuestionIndex] !== undefined
  const canGoNext = hasAnswer
  const canGoPrevious = currentQuestionIndex > 0
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  return (
    <div style={{ marginTop: editorialSpacing.md }}>
      {/* Poll Container mit dunklem Hintergrund */}
      <div style={{
        padding: editorialSpacing.xl,
        backgroundColor: editorialColors.background.dark,
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        {/* Fortschrittsanzeige - Kompakt */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          marginBottom: editorialSpacing.md, // Reduziert von lg zu md
        }}>
          {questions.map((_, index) => (
            <div
              key={index}
              style={{
                width: index === currentQuestionIndex ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: index === currentQuestionIndex 
                  ? editorialColors.brand.accent 
                  : index < currentQuestionIndex
                    ? editorialColors.brand.accent
                    : 'rgba(255, 255, 255, 0.3)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
          <span style={{
            fontSize: '0.75rem',
            color: 'rgba(255, 255, 255, 0.7)',
            marginLeft: editorialSpacing.sm,
            fontWeight: 500,
          }}>
            {currentQuestionIndex + 1} / {questions.length}
          </span>
        </div>

        {/* Scroll-Container für Fragen */}
        <div
          ref={scrollContainerRef}
          style={{
            display: 'flex',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth',
            gap: 0, // Kein Gap zwischen Fragen
            marginBottom: editorialSpacing.md, // Reduziert
            // Verstecke Scrollbar
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          className="poll-scroll-container"
        >
          {questions.map((question, questionIndex) => (
            <div
              key={questionIndex}
              style={{
                flex: '0 0 100%',
                scrollSnapAlign: 'start',
                minWidth: '100%',
                paddingRight: questionIndex < questions.length - 1 ? editorialSpacing.lg : 0, // Nur Padding rechts für Abstand zwischen Fragen
              }}
            >
              {/* Frage - Kompakt */}
              <div style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: editorialColors.text.inverse,
                marginBottom: editorialSpacing.md, // Reduziert von lg zu md
                textAlign: 'left', // Linksbündig für bessere Lesbarkeit
                lineHeight: 1.4,
              }}>
                {question.question}
              </div>

              {/* Antwortoptionen - Kompakt */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: editorialSpacing.sm, // Reduziert von md zu sm
                position: 'relative',
              }}>
              {question.options.map((option: string, optionIndex: number) => {
                const isSelected = answers[questionIndex] === option
                const isAnswered = answeredQuestions.has(questionIndex)
                const showConfirmation = showAnswerConfirmation === questionIndex && isSelected
                
                return (
                  <div key={optionIndex} style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={() => handleAnswer(option)}
                      disabled={isSubmitted}
                      style={{
                        padding: `${editorialSpacing.sm} ${editorialSpacing.md}`, // Kompakteres Padding
                        backgroundColor: isSelected 
                          ? editorialColors.brand.accent 
                          : 'rgba(255, 255, 255, 0.1)',
                        color: editorialColors.text.inverse,
                        border: `1px solid ${isSelected ? editorialColors.brand.accent : 'rgba(255, 255, 255, 0.2)'}`,
                        borderRadius: '8px',
                        cursor: isSubmitted ? 'not-allowed' : 'pointer',
                        textAlign: 'left',
                        fontSize: '0.9375rem',
                        fontWeight: isSelected ? 600 : 400,
                        transition: 'all 0.2s ease',
                        opacity: isSubmitted ? 0.6 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected && !isSubmitted) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected && !isSubmitted) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                        }
                      }}
                    >
                      <span>{option}</span>
                      {isSelected && !isSubmitted && (
                        <svg 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ flexShrink: 0, marginLeft: '0.5rem' }}
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                    
                    {/* Bestätigungs-Badge */}
                    {showConfirmation && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '-2.5rem',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: editorialColors.brand.accent,
                          color: editorialColors.text.inverse,
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          zIndex: 10,
                          animation: 'fadeInOut 2s ease',
                          pointerEvents: 'none',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                        }}
                      >
                        ✓ Antwort ausgewählt
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            
              {/* Hinweis: Antwort kann geändert werden */}
              {answeredQuestions.has(questionIndex) && !isSubmitted && (
                <p style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginTop: editorialSpacing.xs,
                  marginBottom: 0,
                  fontStyle: 'italic',
                  textAlign: 'left',
                }}>
                  Sie können Ihre Antwort noch ändern, bevor Sie absenden
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Navigation - Kompakt */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: editorialSpacing.md,
          marginTop: editorialSpacing.md, // Kompakter Abstand
        }}>
        <button
          type="button"
          onClick={handlePrevious}
          disabled={!canGoPrevious}
          style={{
            padding: `${editorialSpacing.sm} ${editorialSpacing.md}`,
            backgroundColor: canGoPrevious ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            color: canGoPrevious ? editorialColors.text.inverse : 'rgba(255, 255, 255, 0.3)',
            border: `1px solid ${canGoPrevious ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: '8px',
            cursor: canGoPrevious ? 'pointer' : 'not-allowed',
            fontSize: '0.875rem',
            fontWeight: 500,
            transition: 'all 0.2s ease',
          }}
        >
          ← Zurück
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={!canGoNext || isSubmitting}
          style={{
            padding: `${editorialSpacing.sm} ${editorialSpacing.md}`,
            backgroundColor: canGoNext && !isSubmitting
              ? editorialColors.brand.accent
              : 'rgba(255, 255, 255, 0.1)',
            color: canGoNext && !isSubmitting
              ? editorialColors.text.inverse
              : 'rgba(255, 255, 255, 0.3)',
            border: `1px solid ${canGoNext && !isSubmitting ? editorialColors.brand.accent : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: '8px',
            cursor: canGoNext && !isSubmitting ? 'pointer' : 'not-allowed',
            fontSize: '0.875rem',
            fontWeight: 600,
            transition: 'all 0.2s ease',
          }}
        >
          {isSubmitting 
            ? 'Wird gespeichert...' 
            : isLastQuestion 
              ? 'Absenden' 
              : 'Weiter →'}
        </button>
        </div>

        {/* Fehlermeldung */}
        {error && (
          <div style={{
            marginTop: editorialSpacing.sm,
            padding: editorialSpacing.sm,
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
            color: '#ff6666',
            borderRadius: '6px',
            fontSize: '0.875rem',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}
      </div>

      {/* CSS für Scrollbar-Versteckung und Animationen */}
      <style jsx>{`
        .poll-scroll-container::-webkit-scrollbar {
          display: none;
        }
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          20% { opacity: 1; transform: translateX(-50%) translateY(0); }
          80% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
        }
      `}</style>
    </div>
  )
}
