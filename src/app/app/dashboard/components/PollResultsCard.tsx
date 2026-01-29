/**
 * Poll Results Card
 * 
 * Zeigt eine Übersicht aller aktiven Umfragen mit Ergebnissen
 */

"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { editorialColors } from '@/components/editorial/tokens/colors'
import { editorialSpacing } from '@/components/editorial/tokens/spacing'

interface PollResult {
  pollBlockId: string
  dppId: string
  dppName: string
  totalResponses: number
  questions: Array<{
    question: string
    options: Array<{
      option: string
      count: number
      percentage: number
    }>
  }>
}

export default function PollResultsCard() {
  const router = useRouter()
  const [polls, setPolls] = useState<PollResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPollResults()
  }, [])

  const loadPollResults = async () => {
    try {
      setLoading(true)
      // Hole alle DPPs des Users mit Poll-Blöcken
      const dppsResponse = await fetch('/api/app/dpps')
      if (!dppsResponse.ok) return

      const dpps = await dppsResponse.json()
      
      // Für jeden DPP: Hole Poll-Ergebnisse
      const pollResults: PollResult[] = []
      
      for (const dpp of dpps) {
        // Hole DppContent für diesen DPP
        const contentResponse = await fetch(`/api/app/dpp/${dpp.id}/content`)
        if (!contentResponse.ok) continue
        
        const content = await contentResponse.json()
        const blocks = content.blocks || []
        
        // Finde alle multi_question_poll Blöcke
        const pollBlocks = blocks.filter((b: any) => b.type === 'multi_question_poll')
        
        for (const pollBlock of pollBlocks) {
          try {
            const resultsResponse = await fetch(
              `/api/polls/results?pollBlockId=${pollBlock.id}&dppId=${dpp.id}`
            )
            if (resultsResponse.ok) {
              const results = await resultsResponse.json()
              if (results.totalResponses > 0) {
                pollResults.push({
                  pollBlockId: pollBlock.id,
                  dppId: dpp.id,
                  dppName: dpp.name,
                  totalResponses: results.totalResponses,
                  questions: results.questions
                })
              }
            }
          } catch (err) {
            console.error('Error loading poll results:', err)
          }
        }
      }
      
      setPolls(pollResults)
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden der Ergebnisse')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E5E5E5',
        padding: editorialSpacing.lg,
        marginBottom: editorialSpacing.lg,
      }}>
        <p style={{ color: '#7A7A7A', fontSize: '0.875rem' }}>Lade Umfrage-Ergebnisse...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E5E5E5',
        padding: editorialSpacing.lg,
        marginBottom: editorialSpacing.lg,
      }}>
        <p style={{ color: '#ff4444', fontSize: '0.875rem' }}>{error}</p>
      </div>
    )
  }

  if (polls.length === 0) {
    return null // Keine Umfragen mit Ergebnissen
  }

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '12px',
      border: '1px solid #E5E5E5',
      padding: editorialSpacing.lg,
      marginBottom: editorialSpacing.lg,
    }}>
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: 600,
        color: '#0A0A0A',
        marginBottom: editorialSpacing.md,
      }}>
        Umfrage-Ergebnisse
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: editorialSpacing.md }}>
        {polls.map((poll) => (
          <div
            key={`${poll.dppId}-${poll.pollBlockId}`}
            style={{
              padding: editorialSpacing.md,
              backgroundColor: '#FAFAFA',
              borderRadius: '8px',
              border: '1px solid #E5E5E5',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onClick={() => router.push(`/app/dpp/${poll.dppId}?poll=${poll.pollBlockId}`)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F5F5F5'
              e.currentTarget.style.borderColor = editorialColors.brand.accent
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FAFAFA'
              e.currentTarget.style.borderColor = '#E5E5E5'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: editorialSpacing.xs,
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: 500,
                color: '#0A0A0A',
                margin: 0,
              }}>
                {poll.dppName}
              </h3>
              <span style={{
                fontSize: '0.875rem',
                color: '#7A7A7A',
              }}>
                {poll.totalResponses} {poll.totalResponses === 1 ? 'Teilnehmer' : 'Teilnehmer'}
              </span>
            </div>
            
            <p style={{
              fontSize: '0.875rem',
              color: '#7A7A7A',
              margin: 0,
            }}>
              {poll.questions.length} {poll.questions.length === 1 ? 'Frage' : 'Fragen'}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
