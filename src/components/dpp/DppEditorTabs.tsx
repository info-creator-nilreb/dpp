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
  availableCategories?: Array<{ categoryKey: string; label: string }>
  onSave?: () => Promise<void>
  onPublish?: () => Promise<void>
  onStatusChange?: (status: "idle" | "saving" | "saved" | "publishing" | "error") => void
  onLastSavedChange?: (date: Date | null) => void
  onErrorChange?: (error: string | null) => void
  onDppUpdate?: (updatedDpp: any) => void
  onDraftSaved?: () => void
}

type TabId = "data" | "content" | "frontend"

export default function DppEditorTabs({
  dpp,
  organizationId,
  userId,
  availableFeatures,
  availableCategories,
  onSave,
  onPublish,
  onStatusChange,
  onLastSavedChange,
  onErrorChange,
  onDppUpdate,
  onDraftSaved
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

  // Check capabilities – nur anzeigen wenn für Tarif aktiviert (kein Fail-Open)
  const hasContentTab = availableFeatures.includes("content_tab")
  const hasCmsAccess =
    hasContentTab ||
    availableFeatures.includes("cms_access") ||
    availableFeatures.some((k) => k.startsWith("block_"))
  const hasStyling =
    availableFeatures.includes("cms_styling") ||
    availableFeatures.includes("advanced_styling")

  const isNewDpp = dpp?.id === "new" || !dpp?.id

  // Wenn Mehrwert-Tab deaktiviert ist, nicht auf „content“ bleiben
  useEffect(() => {
    if (!hasContentTab && activeTab === "content") {
      setActiveTab("data")
    }
  }, [hasContentTab, activeTab])

  const tabs = [
    {
      id: "data" as TabId,
      label: "Pflichtdaten",
      enabled: true,
      icon: null
    },
    ...(hasContentTab
      ? [{
          id: "content" as TabId,
          label: "Mehrwert",
          enabled: hasCmsAccess && !isNewDpp,
          icon: null
        }]
      : []),
    {
      id: "frontend" as TabId,
      label: "Vorschau",
      enabled: !isNewDpp,
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
            isNew={isNewDpp}
            availableCategories={availableCategories}
            availableFeatures={availableFeatures}
            onSave={onSave}
            onPublish={onPublish}
            onStatusChange={onStatusChange}
            onLastSavedChange={onLastSavedChange}
            onErrorChange={onErrorChange}
            onDppUpdate={onDppUpdate}
          />
        )}
        
        {activeTab === "content" && dpp?.id && dpp.id !== "new" && (
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
            onDraftSaved={onDraftSaved}
          />
        )}
        
        {activeTab === "frontend" && dpp?.id && dpp.id !== "new" && (
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
            onDraftSaved={onDraftSaved}
          />
        )}
      </div>
    </div>
  )
}
