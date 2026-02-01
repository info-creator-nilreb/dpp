"use client"

/**
 * DPP Editor Tabs
 * 
 * Modern horizontal tabs (matching pricing plan style):
 * - Horizontal tabs with mint accent (#24c598)
 * - Gray background (#F9F9F9)
 * - Card-based content sections
 * - Block-based structure similar to template editor
 */

import { useState, useEffect } from "react"
import { Block, StylingConfig } from "@/lib/cms/types"
import DppDataTabV2 from "./tabs/DppDataTabV2"
import DppContentTabV2 from "./tabs/DppContentTabV2"
import DppFrontendTabV2 from "./tabs/DppFrontendTabV2"

interface DppEditorTabsProps {
  dpp: any
  organizationId: string
  userId: string
  availableFeatures: string[]
  onSave?: () => Promise<void>
  onPublish?: () => Promise<void>
  onStatusChange?: (status: "idle" | "saving" | "saved" | "publishing" | "error") => void
  onLastSavedChange?: (date: Date | null) => void
  onErrorChange?: (error: string | null) => void
  onDppUpdate?: (updatedDpp: any) => void
}

type TabId = "data" | "content" | "frontend"

export default function DppEditorTabs({
  dpp,
  organizationId,
  userId,
  availableFeatures,
  onSave,
  onPublish,
  onStatusChange,
  onLastSavedChange,
  onErrorChange,
  onDppUpdate
}: DppEditorTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("data")
  const [cmsBlocks, setCmsBlocks] = useState<Block[]>([])
  const [cmsStyling, setCmsStyling] = useState<StylingConfig | null>(null)
  const [loadingContent, setLoadingContent] = useState(false)
  const [contentLoaded, setContentLoaded] = useState<string | null>(null)
  const [contentTabStatus, setContentTabStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  
  // Combine status from all tabs - content tab status takes precedence if active
  useEffect(() => {
    if (activeTab === "content" && contentTabStatus !== "idle") {
      // Map content tab status to main status
      if (contentTabStatus === "saving") {
        onStatusChange?.("saving")
      } else if (contentTabStatus === "saved") {
        onStatusChange?.("saved")
      } else if (contentTabStatus === "error") {
        onStatusChange?.("error")
      }
    }
  }, [activeTab, contentTabStatus, onStatusChange])

  // Load CMS content when Content or Frontend tab is accessed
  // Only load once per DPP to avoid unnecessary refetches
  useEffect(() => {
    if ((activeTab === "content" || activeTab === "frontend") && dpp?.id && contentLoaded !== dpp.id && !loadingContent) {
      loadCmsContent()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, dpp?.id])

  async function loadCmsContent() {
    if (!dpp?.id) return
    try {
      setLoadingContent(true)
      const response = await fetch(`/api/app/dpp/${dpp.id}/content`)
      if (response.ok) {
        const data = await response.json()
        const blocks = data.content?.blocks || []
        console.log("DppEditorTabs: Loaded blocks:", blocks.length, blocks)
        setCmsBlocks(blocks)
        setCmsStyling(data.content?.styling || null)
        setContentLoaded(dpp.id)
      } else {
        console.error("DppEditorTabs: Failed to load content:", response.status, response.statusText)
        const errorData = await response.json().catch(() => ({}))
        console.error("DppEditorTabs: Error data:", errorData)
      }
    } catch (error) {
      console.error("DppEditorTabs: Error loading CMS content:", error)
    } finally {
      setLoadingContent(false)
    }
  }

  // Check capabilities
  const hasCmsAccess = availableFeatures.length === 0 || availableFeatures.includes("cms_access") || availableFeatures.includes("block_storytelling") || availableFeatures.includes("block_image_text")
  // Styling: bei leerem Capabilities-Ergebnis anzeigen (Fail-open in Produktion/Trial), sonst cms_styling oder advanced_styling
  const hasStyling =
    availableFeatures.length === 0 ||
    availableFeatures.includes("cms_styling") ||
    availableFeatures.includes("advanced_styling")

  const tabs = [
    {
      id: "data" as TabId,
      label: "Pflichtdaten",
      enabled: true,
      icon: null
    },
    {
      id: "content" as TabId,
      label: "Mehrwert",
      enabled: hasCmsAccess,
      icon: null
    },
    {
      id: "frontend" as TabId,
      label: "Vorschau",
      enabled: true, // Preview is available for all
      icon: null
    }
  ]

  if (!dpp) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">DPP wird geladen...</div>
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: "#FFFFFF",
      borderRadius: "12px",
      border: "1px solid #E5E5E5",
      overflow: "hidden",
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Tabs - Matching Pricing Plan Style */}
      <div style={{
        display: "flex",
        borderBottom: "1px solid #E5E5E5",
        backgroundColor: "#F9F9F9",
        overflowX: "auto",
        overflowY: "hidden",
        width: "100%",
        minWidth: 0
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => tab.enabled && setActiveTab(tab.id)}
            disabled={!tab.enabled}
            style={{
              padding: "1rem 1.5rem",
              border: "none",
              backgroundColor: "transparent",
              borderBottom: activeTab === tab.id ? "2px solid #24c598" : "2px solid transparent",
              color: activeTab === tab.id ? "#24c598" : "#7A7A7A",
              fontSize: "0.875rem",
              fontWeight: activeTab === tab.id ? "600" : "400",
              cursor: tab.enabled ? "pointer" : "not-allowed",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
              flexShrink: 0,
              opacity: tab.enabled ? 1 : 0.5
            }}
          >
            {tab.label}
            {!tab.enabled && tab.icon && (
              <span style={{ marginLeft: "0.5rem", display: "inline-flex", alignItems: "center" }}>
                {tab.icon}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{
        flex: 1,
        overflow: "hidden",
        minHeight: 0,
        display: "flex",
        flexDirection: "column"
      }}>
        {activeTab === "data" && (
          <DppDataTabV2 
            dpp={dpp}
            onSave={onSave}
            onPublish={onPublish}
            onStatusChange={onStatusChange}
            onLastSavedChange={onLastSavedChange}
            onErrorChange={onErrorChange}
            onDppUpdate={onDppUpdate}
          />
        )}
        
        {activeTab === "content" && dpp?.id && (
          <DppContentTabV2
            dppId={dpp.id}
            organizationId={organizationId}
            userId={userId}
            blocks={cmsBlocks}
            onBlocksChange={setCmsBlocks}
            availableFeatures={availableFeatures}
            loading={loadingContent}
            onReload={loadCmsContent}
            onStatusChange={setContentTabStatus}
            onLastSavedChange={onLastSavedChange}
          />
        )}
        
        {activeTab === "frontend" && dpp?.id && (
          <DppFrontendTabV2
            dpp={dpp}
            dppId={dpp.id}
            organizationId={organizationId}
            userId={userId}
            styling={cmsStyling}
            blocks={cmsBlocks}
            onStylingChange={setCmsStyling}
            availableFeatures={availableFeatures}
            loading={loadingContent}
            onReload={loadCmsContent}
            onStatusChange={onStatusChange}
            onLastSavedChange={onLastSavedChange}
          />
        )}
      </div>
    </div>
  )
}
