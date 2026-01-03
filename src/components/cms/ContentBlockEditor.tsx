"use client"

/**
 * Content Block Editor
 * 
 * Editor für einzelne Blöcke (vereinfacht)
 */

import { useState, useEffect, useRef } from "react"
import { Block, UpdateBlockRequest } from "@/lib/cms/types"
import { useAutoSave } from "@/hooks/useAutoSave"
import StorytellingBlockEditor from "./blocks/StorytellingBlockEditor"
import QuickPollBlockEditor from "./blocks/QuickPollBlockEditor"
import ImageTextBlockEditor from "./blocks/ImageTextBlockEditor"
import TextBlockEditor from "./blocks/TextBlockEditor"
import ImageBlockEditor from "./blocks/ImageBlockEditor"
import VideoBlockEditor from "./blocks/VideoBlockEditor"
import TimelineBlockEditor from "./blocks/TimelineBlockEditor"
import AccordionBlockEditor from "./blocks/AccordionBlockEditor"

interface ContentBlockEditorProps {
  block: Block
  onUpdate: (updates: UpdateBlockRequest) => void
  dppId?: string
}

export default function ContentBlockEditor({ block, onUpdate, dppId }: ContentBlockEditorProps) {
  const [content, setContent] = useState(block.content)
  const initialContentRef = useRef(block.content)
  const isSavingRef = useRef(false)
  const isUserTypingRef = useRef(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Only update content if user is not currently typing
    // This prevents losing characters while user is typing
    if (!isUserTypingRef.current) {
      setContent(block.content)
      initialContentRef.current = block.content
    }
    isSavingRef.current = false
  }, [block.id]) // Only update when block.id changes (different block)

  // Update when block.content changes, but only if user is not typing
  // CRITICAL: This prevents the last character from being cut off
  useEffect(() => {
    // Only update if user is not currently typing
    // This ensures the last character is not lost during auto-save
    if (!isUserTypingRef.current) {
      const blockContentStr = JSON.stringify(block.content)
      const currentContentStr = JSON.stringify(content)
      
      // Only update if content actually changed (prevents unnecessary updates)
      if (blockContentStr !== currentContentStr) {
        setContent(block.content)
        initialContentRef.current = block.content
      }
    }
  }, [block.content, content]) // Include content in deps to compare properly

  // Auto-Save: Save block content
  // Optimized to catch every change, including single character edits
  const performAutoSave = async () => {
    // Skip if already saving
    if (isSavingRef.current) {
      return
    }
    
    // Deep comparison to detect ANY change, including single characters
    const currentContentStr = JSON.stringify(content)
    const initialContentStr = JSON.stringify(initialContentRef.current)
    
    // Only save if content actually changed
    if (currentContentStr === initialContentStr) {
      return
    }
    
    isSavingRef.current = true
    try {
      await onUpdate({ content })
      // Update initial content AFTER successful save
      // Use parsed version to avoid reference issues
      initialContentRef.current = JSON.parse(currentContentStr)
    } catch (error) {
      console.error("Error saving block content:", error)
      throw error
    } finally {
      isSavingRef.current = false
    }
  }

  // Auto-Save hook
  // Optimized for Shopify/Shopware-level UX - catches every change including single characters
  const { scheduleSave } = useAutoSave({
    onSave: performAutoSave,
    enabled: true,
    debounceMs: 500 // Short debounce for instant feel - catches minimal changes
  })

  function handleContentChange(newContent: Record<string, any>) {
    // SYNCHRONE State-Update: Schreibe sofort in content
    setContent(newContent)
    
    // SYNCHRONE State-Update: Rufe onUpdate sofort auf
    // onUpdate schreibt direkt in blocks prop via onBlocksChange -> handleUpdateBlock
    onUpdate({ content: newContent })
    
    // Mark that user is typing (prevents content loss during auto-save)
    isUserTypingRef.current = true
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Reset typing flag after user stops typing for 1500ms
    // CRITICAL: Longer timeout to prevent last character from being cut off
    typingTimeoutRef.current = setTimeout(() => {
      isUserTypingRef.current = false
    }, 1500) // Longer timeout to ensure last character is saved
    
    // Auto-Save wird durch onUpdate -> handleUpdateBlock -> scheduleSaveWithBlocks getriggert
    // Kein direkter scheduleSave() Aufruf hier - ContentBlockEditor hat keinen eigenen Auto-Save mehr
  }

  // Render block-specific editor
  function renderBlockEditor() {
    switch (block.type) {
      case "storytelling":
        return (
          <StorytellingBlockEditor
            content={content}
            onChange={handleContentChange}
            dppId={dppId}
          />
        )
      case "quick_poll":
        return (
          <QuickPollBlockEditor
            content={content}
            onChange={handleContentChange}
          />
        )
      case "image_text":
        return (
          <ImageTextBlockEditor
            content={content}
            onChange={handleContentChange}
            dppId={dppId}
          />
        )
      case "text":
        return (
          <TextBlockEditor
            content={content}
            onChange={handleContentChange}
          />
        )
      case "image":
        return (
          <ImageBlockEditor
            content={content}
            onChange={handleContentChange}
            dppId={dppId}
          />
        )
      case "video":
        return (
          <VideoBlockEditor
            content={content}
            onChange={handleContentChange}
            dppId={dppId}
          />
        )
      case "timeline":
        return (
          <TimelineBlockEditor
            content={content}
            onChange={handleContentChange}
          />
        )
      case "accordion":
        return (
          <AccordionBlockEditor
            content={content}
            onChange={handleContentChange}
          />
        )
      default:
        return (
          <div style={{
            padding: "2rem",
            textAlign: "center",
            color: "#7A7A7A",
            fontSize: "0.875rem"
          }}>
            <p>Editor für Block-Typ "{block.type}" noch nicht implementiert</p>
          </div>
        )
    }
  }

  return (
    <div>
      {renderBlockEditor()}
      {/* Auto-Save: No manual save buttons - changes are saved automatically */}
    </div>
  )
}

