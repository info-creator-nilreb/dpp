"use client"

/**
 * DPP Data Tab - Refactored
 * 
 * Card-based layout matching app design system
 * - White cards with border (#E5E5E5)
 * - Rounded corners (12px)
 * - Proper spacing
 */

import { useState } from "react"
import DppEditor from "@/components/DppEditor"

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
  onDppUpdate
}: DppDataTabV2Props) {
  return (
    <div style={{
      flex: 1,
      overflowY: "auto",
      padding: "2rem",
      backgroundColor: "#FFFFFF"
    }}>
      {/* Compliance Editor Card */}
      <div style={{
        backgroundColor: "#FFFFFF",
        border: "none",
        borderRadius: "12px",
        overflow: "hidden"
      }}>
        <DppEditor 
          dpp={dpp} 
          isNew={false}
          onSave={onSave}
          onPublish={onPublish}
          onStatusChange={onStatusChange}
          onLastSavedChange={onLastSavedChange}
          onErrorChange={onErrorChange}
          onDppUpdate={onDppUpdate}
        />
      </div>
    </div>
  )
}
