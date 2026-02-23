"use client"

import { useEffect, useState } from "react"
import { BREAKPOINTS_MQ } from "@/lib/breakpoints"

/**
 * Umfrage-Block: Frage einmal, Balken 100 % Breite (Grün + Grau).
 * Mobile: Vertikaler Stack (Label → Bar → Result).
 * Desktop: Label links/rechts, Bar darunter.
 */

interface Option {
  option: string
  count: number
  percentage: number
}

interface SurveyResultsBlockProps {
  question: string
  totalVotes: number
  options: Option[]
  /** Weniger Abstand oben für erstes Frage-Block innerhalb einer Umfrage */
  noTopMargin?: boolean
}

const pollBar: React.CSSProperties = {
  width: "100%",
  height: 10,
  background: "#E5E7EB",
  borderRadius: 999,
  overflow: "hidden",
}

const pollBarFill: React.CSSProperties = {
  height: "100%",
  background: "#18A673",
  borderRadius: 999,
  transition: "width 0.3s ease",
}

const pollBarMobile: React.CSSProperties = {
  ...pollBar,
  height: 14,
  background: "#E9EDF2",
}

const pollBarFillMobile: React.CSSProperties = {
  ...pollBarFill,
  background: "#18A673",
}

export default function SurveyResultsBlock({
  question,
  totalVotes,
  options,
  noTopMargin = false,
}: SurveyResultsBlockProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(BREAKPOINTS_MQ.appMobile)
    const handler = () => setIsMobile(mq.matches)
    handler()
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  return (
    <div className="poll-option-block" style={{ marginTop: noTopMargin ? 0 : isMobile ? 28 : 24 }}>
      {question && (
        <p
          className="poll-question"
          style={{
            fontSize: isMobile ? 14 : 16,
            fontWeight: isMobile ? 500 : 600,
            color: "#0A0A0A",
            margin: isMobile ? "0 0 12px 0" : "0 0 4px 0",
          }}
        >
          {question}
        </p>
      )}
      <p style={{ color: "#6B7280", fontSize: 13, margin: "0 0 12px 0" }}>
        {totalVotes} {totalVotes === 1 ? "Stimme" : "Stimmen"}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 20 : 12 }}>
        {options.map((opt, idx) => (
          <div key={idx} className="poll-option" style={{ marginBottom: isMobile ? 20 : 0 }}>
            <div
              className="poll-option-label"
              style={{
                fontSize: isMobile ? 14 : "0.9rem",
                fontWeight: isMobile ? 500 : 400,
                marginBottom: 6,
                color: "#374151",
              }}
            >
              {opt.option}
            </div>
            <div className="poll-bar" style={isMobile ? pollBarMobile : pollBar}>
              <div
                className="poll-bar-fill"
                style={{
                  ...(isMobile ? pollBarFillMobile : pollBarFill),
                  width: `${opt.percentage}%`,
                }}
              />
            </div>
            <div
              className="poll-option-result"
              style={{
                fontSize: 13,
                color: "#5F6B7A",
                marginTop: 6,
              }}
            >
              {opt.percentage} % ({opt.count})
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
