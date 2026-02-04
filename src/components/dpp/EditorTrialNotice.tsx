"use client"

/**
 * Zeigt unter dem Editor-Header Trial-Banner und einen Hinweis, wenn der Nutzer in der Testphase ist.
 * Bei regulärem Abo wird nichts gerendert (Inhalt kann enger an die Save-Bar rücken).
 */

import TrialBanner from "@/components/TrialBanner"

interface EditorTrialNoticeProps {
  isTrial: boolean
  organizationId: string
  trialEndDate: string | null
}

export default function EditorTrialNotice({
  isTrial,
  organizationId,
  trialEndDate,
}: EditorTrialNoticeProps) {
  if (!isTrial || !trialEndDate || !organizationId) {
    return null
  }

  return (
    <div
      style={{
        flexShrink: 0,
        padding: "0 1.5rem",
        marginTop: "16px",
        marginBottom: "0",
      }}
    >
      <TrialBanner organizationId={organizationId} trialEndDate={trialEndDate} />
      <p
        style={{
          fontSize: "0.8125rem",
          color: "#78350F",
          margin: "8px 0 16px 0",
          lineHeight: 1.4,
        }}
      >
        Veröffentlichen ist nach dem Upgrade möglich.
      </p>
    </div>
  )
}
