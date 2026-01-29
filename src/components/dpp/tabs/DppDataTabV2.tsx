"use client"

/**
 * DPP Data Tab - Pflichtdaten wie DPP-Editor im Merge 8de05e6 (supplierinvitation into main)
 *
 * Verwendet DppEditorPflichtdaten: Template-Blöcke, Supplier Invitation (Block-Markierung + Modal),
 * gleiche Template-Lade-Logik und APIs (supplier-config, supplier-invites).
 */

import DppEditorPflichtdaten from "@/components/DppEditorPflichtdaten"

interface DppDataTabV2Props {
  dpp: any
  onSave?: () => Promise<void>
  onPublish?: () => Promise<void>
  onStatusChange?: (status: "idle" | "saving" | "saved" | "publishing" | "error") => void
  onLastSavedChange?: (date: Date | null) => void
  onErrorChange?: (error: string | null) => void
  onDppUpdate?: (updatedDpp: any) => void
}

export default function DppDataTabV2({
  dpp,
  onSave,
  onPublish,
  onStatusChange,
  onLastSavedChange,
  onErrorChange,
  onDppUpdate,
}: DppDataTabV2Props) {
  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "2rem",
        backgroundColor: "#FFFFFF",
      }}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "none",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <DppEditorPflichtdaten
          dpp={dpp}
          isNew={false}
          onSave={onSave}
          onPublish={onPublish}
          onDppUpdate={onDppUpdate}
        />
      </div>
    </div>
  )
}
