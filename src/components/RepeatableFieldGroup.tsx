"use client"

import { useState } from "react"
import TemplateBlockField from "@/components/TemplateBlockField"
import type { Co2EmissionsValue } from "@/lib/co2-emissions-types"

/** Wert eines Felds in einer wiederholbaren Instanz (TemplateBlockField kann auch Co2EmissionsValue liefern) */
type RepeatableFieldValue = string | string[] | Co2EmissionsValue

interface RepeatableFieldGroupProps {
  field: {
    id: string
    label: string
    key: string
    type: string
    required: boolean
    config: any
  }
  blockId: string
  dppId: string | null
  instances: Array<{
    instanceId: string
    values: Record<string, RepeatableFieldValue>
  }>
  onInstancesChange: (instances: Array<{
    instanceId: string
    values: Record<string, RepeatableFieldValue>
  }>) => void
  media?: Array<{
    id: string
    fileName: string
    fileType: string
    storageUrl: string
    blockId?: string | null
    fieldId?: string | null
  }>
  onMediaChange?: () => void
  onMediaDisplayNameChange?: (mediaId: string, displayName: string | null) => Promise<void>
}

/**
 * RepeatableFieldGroup
 * 
 * Rendert eine Gruppe von wiederholbaren Feldern (z.B. Materialien).
 * Jede Instanz kann einzeln bearbeitet und einem Lieferanten zugewiesen werden.
 */
export default function RepeatableFieldGroup({
  field,
  blockId,
  dppId,
  instances,
  onInstancesChange,
  media = [],
  onMediaChange
}: RepeatableFieldGroupProps) {
  const addInstance = () => {
    const newInstanceId = `${field.id}-${Date.now()}`
    onInstancesChange([
      ...instances,
      {
        instanceId: newInstanceId,
        values: {}
      }
    ])
  }

  const removeInstance = (instanceId: string) => {
    onInstancesChange(instances.filter(inst => inst.instanceId !== instanceId))
  }

  const updateInstanceValue = (instanceId: string, value: RepeatableFieldValue) => {
    onInstancesChange(
      instances.map(inst =>
        inst.instanceId === instanceId
          ? { ...inst, values: { ...inst.values, [field.key]: value } }
          : inst
      )
    )
  }

  // Hilfsfunktion: Generiert einen eindeutigen fieldId für jede Instanz (für Media-Upload)
  const getFieldIdForInstance = (instanceId: string): string => {
    return `${field.key}-${instanceId}`
  }

  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1rem"
      }}>
        <label style={{
          fontSize: "clamp(0.9rem, 2vw, 1rem)",
          fontWeight: "600",
          color: "#0A0A0A"
        }}>
          {field.label}
          {field.required && (
            <span style={{ color: "#24c598", marginLeft: "0.25rem" }}>*</span>
          )}
        </label>
        <button
          type="button"
          onClick={addInstance}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#24c598",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "6px",
            fontSize: "0.875rem",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          + {field.label} hinzufügen
        </button>
      </div>

      {instances.length === 0 ? (
        <div style={{
          padding: "1.5rem",
          backgroundColor: "#F9F9F9",
          border: "1px dashed #CDCDCD",
          borderRadius: "8px",
          textAlign: "center",
          color: "#7A7A7A",
          fontSize: "0.875rem"
        }}>
          Noch keine {field.label} hinzugefügt. Klicken Sie auf "+ {field.label} hinzufügen".
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {instances.map((instance, index) => (
            <div
              key={instance.instanceId}
              style={{
                padding: "1rem",
                backgroundColor: "#FFFFFF",
                border: "1px solid #CDCDCD",
                borderRadius: "8px",
                position: "relative"
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.75rem"
              }}>
                <span style={{
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#0A0A0A"
                }}>
                  {field.label} {index + 1}
                </span>
                {instances.length > (field.required ? 1 : 0) && (
                  <button
                    type="button"
                    onClick={() => removeInstance(instance.instanceId)}
                    title="Entfernen"
                    style={{
                      padding: "0.25rem",
                      backgroundColor: "transparent",
                      color: "#DC2626",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "color 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#991B1B"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#DC2626"
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      <line x1="10" y1="11" x2="10" y2="17"/>
                      <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                  </button>
                )}
              </div>
              <TemplateBlockField
                field={{
                  ...field,
                  key: getFieldIdForInstance(instance.instanceId) // Temporärer key mit instanceId für Media-Upload
                }}
                blockId={blockId}
                dppId={dppId}
                value={instance.values[field.key] || (field.type === "boolean" ? "false" : "")}
                onChange={(value) => updateInstanceValue(instance.instanceId, value)}
                media={media.filter(m => 
                  m.blockId === blockId && 
                  m.fieldId === getFieldIdForInstance(instance.instanceId)
                )}
                onMediaChange={onMediaChange}
                onMediaDisplayNameChange={onMediaDisplayNameChange}
                hideLabel={true}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

