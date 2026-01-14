"use client"

import { useState, useEffect } from "react"

interface TemplateBlock {
  id: string
  name: string
  order: number
  fields: Array<{
    id: string
    label: string
    key: string
    type: string
    required: boolean
    config: any
    order: number
    isRepeatable?: boolean
  }>
}

interface FieldInstance {
  fieldId: string
  instanceId: string
  label: string
  assignedSupplier?: string
}

interface SupplierInvite {
  email: string
  name?: string
  company?: string
  message: string
  role: string
  mode: "contribute" | "review" // "Daten beisteuern" | "Daten prüfen & bestätigen"
  selectedBlocks: string[]
  selectedFieldInstances: FieldInstance[]
}

interface ExistingInvite {
  id: string
  email: string
  partnerRole: string
  blockIds?: string[]
  fieldInstances?: FieldInstance[]
  supplierMode?: string // "input" | "declaration"
  status: string
}

interface SupplierInviteModalProps {
  isOpen: boolean
  onClose: () => void
  template: {
    id: string
    name: string
    blocks: TemplateBlock[]
  } | null
  dppId: string | null
  blockSupplierConfigs: Record<string, {
    enabled: boolean
    mode: "input" | "declaration" | null
    allowedRoles?: string[]
  }>
  existingInvites: ExistingInvite[]
  onSubmit: (invite: SupplierInvite) => Promise<void>
  onInviteSuccess?: () => void // Callback nach erfolgreicher Einladung
  onRemoveInvite?: (inviteId: string) => Promise<void> // Callback zum Entfernen eines Beteiligten
  loading?: boolean
  fieldInstances?: Record<string, Array<{
    instanceId: string
    values: Record<string, string | string[]>
  }>>
}

// Rollen-Optionen gemäß UX-Guide (exakte Reihenfolge wie in Anforderung)
const ROLE_OPTIONS = [
  { value: "Manufacturer", label: "Hersteller" },
  { value: "Material supplier", label: "Materiallieferant" },
  { value: "Component supplier", label: "Komponentenlieferant" },
  { value: "Recycler", label: "Recycling / Entsorgung" },
  { value: "Other", label: "Sonstiger Partner" }
]

// Vorbefüllter Einladungstext
const DEFAULT_INVITATION_TEXT = "Sie wurden eingeladen, ausgewählte Informationen für einen Digitalen Produktpass bereitzustellen.\nSie sehen ausschließlich die Ihnen zugewiesenen Inhalte."

/**
 * Supplier Invite Modal - 5-Schritt-Flow
 * 
 * Schritt 1: Rolle wählen (Pflicht, zuerst!)
 * Schritt 2: Kontakt (E-Mail, optional Name/Unternehmen, vorbefüllter Text)
 * Schritt 3: Modus auswählen (Pflicht: "Daten beisteuern" | "Daten prüfen & bestätigen")
 * Schritt 4: Zuständigkeiten (Block-first, Progressive Disclosure für Felder)
 * Schritt 5: Zusammenfassung
 */
export default function SupplierInviteModal({
  isOpen,
  onClose,
  template,
  dppId,
  blockSupplierConfigs,
  existingInvites,
  onSubmit,
  onInviteSuccess,
  onRemoveInvite,
  loading = false,
  fieldInstances = {}
}: SupplierInviteModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [role, setRole] = useState("")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [message, setMessage] = useState(DEFAULT_INVITATION_TEXT)
  const [mode, setMode] = useState<"contribute" | "review" | "">("") // "contribute" = beisteuern, "review" = prüfen & bestätigen
  const [selectedBlocks, setSelectedBlocks] = useState<Set<string>>(new Set())
  const [selectedFieldInstances, setSelectedFieldInstances] = useState<Set<string>>(new Set())
  const [expandedBlockFields, setExpandedBlockFields] = useState<Set<string>>(new Set()) // Block-IDs, für die Felder ausgeklappt sind
  const [modalFieldInstances, setModalFieldInstances] = useState<Record<string, FieldInstance[]>>({})
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // Helper: Prüft, ob ein Block supplier-fähig ist
  const isBlockSupplierEnabled = (blockId: string): boolean => {
    return blockSupplierConfigs[blockId]?.enabled === true
  }

  // Helper: Filtert nur supplier-fähige Blöcke (order > 0)
  const supplierEnabledBlocks = template?.blocks.filter(
    block => block.order > 0 && isBlockSupplierEnabled(block.id)
  ) || []

  // Initialize field instances when modal opens
  useEffect(() => {
    if (isOpen && template) {
      const instances: Record<string, FieldInstance[]> = {}
      supplierEnabledBlocks.forEach(block => {
        block.fields.forEach(field => {
          if (field.isRepeatable) {
            const repeatableInstances = fieldInstances[field.key] || []
            repeatableInstances.forEach((inst, idx) => {
              const key = `${block.id}:${field.id}`
              if (!instances[key]) {
                instances[key] = []
              }
              instances[key].push({
                fieldId: field.id,
                instanceId: inst.instanceId,
                label: `${field.label} ${idx + 1}`,
                assignedSupplier: getAssignedSupplier(field.id, inst.instanceId, block.id)
              })
            })
          } else {
            const key = `${block.id}:${field.id}`
            if (!instances[key]) {
              instances[key] = []
            }
            instances[key].push({
              fieldId: field.id,
              instanceId: `${field.id}-0`,
              label: field.label,
              assignedSupplier: getAssignedSupplier(field.id, `${field.id}-0`, block.id)
            })
          }
        })
      })
      setModalFieldInstances(instances)
    }
  }, [isOpen, template, fieldInstances])

  // Body-Overflow-Management für Modal
  useEffect(() => {
    if (!isOpen) {
      // Sicherstellen, dass overflow zurückgesetzt wird, wenn Modal geschlossen wird
      document.body.style.overflow = ""
      return
    }

    // Body scroll sperren wenn Modal offen ist
    document.body.style.overflow = "hidden"

    return () => {
      // Overflow zurücksetzen - immer zurücksetzen
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // ESC-Taste zum Schließen
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, loading, onClose])

  // Reset form when modal opens (aber nicht nach erfolgreicher Einladung)
  useEffect(() => {
    if (isOpen && !showSuccessToast) {
      // Reset nur beim ersten Öffnen
      if (currentStep === 1 && !role && !email && !mode) {
        setRole("")
        setEmail("")
        setName("")
        setCompany("")
        setMessage(DEFAULT_INVITATION_TEXT)
        setMode("")
        setSelectedBlocks(new Set())
        setSelectedFieldInstances(new Set())
        setExpandedBlockFields(new Set())
        setCurrentStep(1)
      }
    }
  }, [isOpen])

  // Helper: Prüft, ob ein Feld/Instanz bereits zugewiesen ist
  const getAssignedSupplier = (fieldId: string, instanceId: string, blockId: string): string | undefined => {
    // Prüfe zuerst, ob das Feld explizit zugewiesen wurde
    for (const invite of existingInvites) {
      if (invite.fieldInstances && invite.fieldInstances.length > 0) {
        const fieldAssigned = invite.fieldInstances.some(fi => fi.fieldId === fieldId && fi.instanceId === instanceId)
        if (fieldAssigned) {
          return invite.email
        }
      }
    }
    
    // Wenn das Feld nicht explizit zugewiesen wurde, prüfe ob der Block vollständig zugewiesen wurde
    // (nur wenn KEINE Felder explizit zugewiesen wurden für diesen Block)
    for (const invite of existingInvites) {
      if (invite.blockIds && invite.blockIds.length > 0 && invite.blockIds.includes(blockId)) {
        // Wenn Felder explizit zugewiesen wurden für diesen Block, dann ist nur der Block nicht zugewiesen
        // (die Felder wurden oben bereits geprüft)
        if (!invite.fieldInstances || invite.fieldInstances.length === 0) {
          // Block ist vollständig zugewiesen (ohne Felder), daher sind ALLE Felder zugewiesen
          return invite.email
        }
      }
    }
    
    return undefined
  }

  // Helper: Zählt zugewiesene Blöcke/Felder für einen Beteiligten
  const getAssignedSummary = (invite: ExistingInvite): { blocks: number; fields: number } => {
    const blocks = invite.blockIds?.length || 0
    const fields = invite.fieldInstances?.length || 0
    return { blocks, fields }
  }

  const handleBlockFieldsToggle = (blockId: string) => {
    setExpandedBlockFields(prev => {
      const next = new Set(prev)
      if (next.has(blockId)) {
        next.delete(blockId)
      } else {
        next.add(blockId)
      }
      return next
    })
  }

  const handleBlockSelect = (blockId: string, checked: boolean) => {
    setSelectedBlocks(prev => {
      const next = new Set(prev)
      if (checked) {
        next.add(blockId)
      } else {
        next.delete(blockId)
        // Entferne auch alle Feld-Instanzen dieses Blocks
        setSelectedFieldInstances(prevInstances => {
          const nextInstances = new Set(prevInstances)
          // Finde alle Felder dieses Blocks
          const block = template?.blocks.find(b => b.id === blockId)
          if (block) {
            block.fields.forEach(field => {
              if (field.isRepeatable) {
                const repeatableInstances = fieldInstances[field.key] || []
                repeatableInstances.forEach(inst => {
                  nextInstances.delete(`${field.id}:${inst.instanceId}`)
                })
              } else {
                nextInstances.delete(`${field.id}:${field.id}-0`)
              }
            })
          }
          return nextInstances
        })
        // Schließe auch die Felder-Auswahl für diesen Block
        setExpandedBlockFields(prev => {
          const next = new Set(prev)
          next.delete(blockId)
          return next
        })
      }
      return next
    })
  }

  const handleFieldInstanceToggle = (fieldId: string, instanceId: string, checked: boolean) => {
    const key = `${fieldId}:${instanceId}`
    setSelectedFieldInstances(prev => {
      const next = new Set(prev)
      if (checked) {
        // Finde Block-ID für dieses Feld
        const block = template?.blocks.find(b => b.fields.some(f => f.id === fieldId))
        if (!block) {
          return prev
        }
        const assigned = getAssignedSupplier(fieldId, instanceId, block.id)
        if (assigned) {
          return prev // Bereits zugewiesen
        }
        next.add(key)
      } else {
        next.delete(key)
      }
      return next
    })
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (!role) return
      setCurrentStep(2)
    } else if (currentStep === 2) {
      if (!email.trim()) return
      setCurrentStep(3)
    } else if (currentStep === 3) {
      if (!mode) return
      setCurrentStep(4)
    } else if (currentStep === 4) {
      if (selectedBlocks.size === 0 && selectedFieldInstances.size === 0) return
      setCurrentStep(5)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as 1 | 2 | 3 | 4 | 5)
    }
  }

  const handleSubmit = async () => {
    if (!role || !email.trim() || !mode) return
    if (selectedBlocks.size === 0 && selectedFieldInstances.size === 0) return

    // Konvertiere selectedFieldInstances zu FieldInstance[]
    const instances: FieldInstance[] = []
    selectedFieldInstances.forEach(key => {
      const [fieldId, instanceId] = key.split(":")
      const block = template?.blocks.find(b => b.fields.some(f => f.id === fieldId))
      const field = block?.fields.find(f => f.id === fieldId)
      if (field) {
        instances.push({
          fieldId,
          instanceId,
          label: field.label
        })
      }
    })

    try {
      await onSubmit({
        email: email.trim(),
        name: name.trim() || undefined,
        company: company.trim() || undefined,
        message: message.trim() || DEFAULT_INVITATION_TEXT,
        role: role.trim(),
        mode: mode as "contribute" | "review",
        selectedBlocks: Array.from(selectedBlocks),
        selectedFieldInstances: instances
      })

      // Multi-Invite-Flow: Modal bleibt offen, Formular reset
      setSuccessMessage("Beteiligter erfolgreich eingeladen")
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 3000)

      // Reset form für nächste Einladung
      setRole("")
      setEmail("")
      setName("")
      setCompany("")
      setMessage(DEFAULT_INVITATION_TEXT)
      setMode("")
      setSelectedBlocks(new Set())
      setSelectedFieldInstances(new Set())
      setExpandedBlockFields(new Set())
      setCurrentStep(1)

      // Callback aufrufen NACH erfolgreichem onSubmit (damit dataRequests neu geladen werden)
      if (onInviteSuccess) {
        onInviteSuccess()
      }
    } catch (error) {
      // Fehler wird bereits in onSubmit behandelt
      console.error("Error in handleSubmit:", error)
    }
  }

  const canProceed = () => {
    if (currentStep === 1) return role !== ""
    if (currentStep === 2) return email.trim() !== ""
    if (currentStep === 3) return mode !== ""
    if (currentStep === 4) return selectedBlocks.size > 0 || selectedFieldInstances.size > 0
    if (currentStep === 5) {
      // Schritt 5 (Zusammenfassung): Alle Pflichtfelder müssen ausgefüllt sein
      return role !== "" && email.trim() !== "" && mode !== "" && (selectedBlocks.size > 0 || selectedFieldInstances.size > 0)
    }
    return false
  }

  // Body-Overflow-Management für Modal
  useEffect(() => {
    if (!isOpen) {
      // Sicherstellen, dass overflow zurückgesetzt wird, wenn Modal geschlossen wird
      if (typeof document !== "undefined") {
        document.body.style.overflow = ""
      }
      return
    }

    // Body scroll sperren wenn Modal offen ist
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden"
    }

    return () => {
      // Overflow zurücksetzen - immer zurücksetzen
      if (typeof document !== "undefined") {
        document.body.style.overflow = ""
      }
    }
  }, [isOpen])

  // ESC-Taste zum Schließen
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, loading, onClose])

  // Wichtig: Dieser Check muss NACH den useEffects sein, damit Cleanup ausgeführt wird
  if (!isOpen) {
    // Zusätzliche Sicherheit: overflow zurücksetzen, auch wenn Modal nicht gerendert wird
    if (typeof document !== "undefined") {
      document.body.style.overflow = ""
    }
    // WICHTIG: return null muss vor allen anderen Returns sein, damit kein Overlay-Element gerendert wird
    return null
  }

  // Debug: Log existingInvites für Debugging
  console.log("[SupplierInviteModal] existingInvites:", existingInvites.length, existingInvites)
  console.log("[SupplierInviteModal] isOpen:", isOpen)
  console.log("[SupplierInviteModal] currentStep:", currentStep)

  // Bereits eingebundene Beteiligte (für Zusammenfassung)
  const assignedSummary = existingInvites.map(invite => {
    const summary = getAssignedSummary(invite)
    const roleLabel = ROLE_OPTIONS.find(r => r.value === invite.partnerRole)?.label || invite.partnerRole
    return {
      role: roleLabel,
      email: invite.email,
      ...summary
    }
  })

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "1rem"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !showSuccessToast) {
          onClose()
        }
      }}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          padding: "2rem",
          maxWidth: "700px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
          position: "relative"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success Toast */}
        {showSuccessToast && (
          <div style={{
            position: "absolute",
            top: "1rem",
            left: "2rem",
            right: "2rem",
            padding: "1rem",
            backgroundColor: "#E6F7E6",
            border: "1px solid #00A651",
            borderRadius: "8px",
            color: "#00A651",
            fontSize: "0.95rem",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            zIndex: 10001,
            boxShadow: "0 2px 8px rgba(0, 166, 81, 0.2)"
          }}>
            <span>✓</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1.5rem"
        }}>
          <div>
            <h2 style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              color: "#0A0A0A",
              margin: "0 0 0.25rem 0"
            }}>
              Beteiligte & Zuständigkeiten
            </h2>
            <p style={{
              fontSize: "0.95rem",
              color: "#7A7A7A",
              margin: 0
            }}>
              Externe Partner für die Datenerfassung einbinden und Zuständigkeiten zuweisen
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: "0.5rem",
              backgroundColor: "transparent",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "1.5rem",
              color: "#7A7A7A",
              lineHeight: 1,
              borderRadius: "4px",
              transition: "background-color 0.2s"
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = "#F5F5F5"
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent"
            }}
          >
            ×
          </button>
        </div>

        {/* Minimale Übersicht: Bereits eingebundene Beteiligte (immer sichtbar) */}
        {existingInvites.length > 0 && (
          <div style={{
            marginBottom: "1.5rem",
            padding: "1rem",
            backgroundColor: "#F9F9F9",
            borderRadius: "8px",
            border: "1px solid #E5E5E5"
          }}>
            <div style={{
              fontSize: "0.813rem",
              fontWeight: "600",
              color: "#7A7A7A",
              marginBottom: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              Bereits eingebundene Beteiligte
            </div>
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem"
            }}>
              {existingInvites.map(invite => {
                const summary = getAssignedSummary(invite)
                const roleLabel = ROLE_OPTIONS.find(r => r.value === invite.partnerRole)?.label || invite.partnerRole
                // Extrahiere mode aus supplierMode (falls vorhanden, ansonsten Default)
                const modeLabel = invite.supplierMode === "declaration" ? "Prüfen & Bestätigen" : "Beisteuern"
                
                return (
                  <div
                    key={invite.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.75rem 1rem",
                      backgroundColor: "#FFFFFF",
                      borderRadius: "6px",
                      border: "1px solid #E5E5E5",
                      fontSize: "0.875rem"
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: "600",
                        color: "#0A0A0A",
                        marginBottom: "0.25rem"
                      }}>
                        {roleLabel} • {invite.email}
                      </div>
                      <div style={{
                        fontSize: "0.813rem",
                        color: "#7A7A7A"
                      }}>
                        {modeLabel} • {summary.blocks > 0 && `${summary.blocks} Block${summary.blocks > 1 ? "e" : ""}`}
                        {summary.blocks > 0 && summary.fields > 0 && " / "}
                        {summary.fields > 0 && `${summary.fields} Feld${summary.fields > 1 ? "er" : ""}`}
                      </div>
                    </div>
                    {onRemoveInvite && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(`Beteiligten "${invite.email}" wirklich entfernen?`)) {
                            await onRemoveInvite(invite.id)
                          }
                        }}
                        disabled={loading}
                        title="Beteiligten entfernen"
                        style={{
                          padding: "0.5rem",
                          backgroundColor: "transparent",
                          border: "none",
                          cursor: loading ? "not-allowed" : "pointer",
                          color: "#7A7A7A",
                          fontSize: "0.875rem",
                          borderRadius: "4px",
                          transition: "all 0.2s",
                          marginLeft: "1rem",
                          flexShrink: 0
                        }}
                        onMouseEnter={(e) => {
                          if (!loading) {
                            e.currentTarget.style.backgroundColor = "#F5F5F5"
                            e.currentTarget.style.color = "#DC2626"
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent"
                          e.currentTarget.style.color = "#7A7A7A"
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ display: "block" }}
                        >
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        <div style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "2rem",
          paddingBottom: "1rem",
          borderBottom: "1px solid #E5E5E5"
        }}>
          {[1, 2, 3, 4, 5].map(step => (
            <div
              key={step}
              style={{
                flex: 1,
                height: "4px",
                backgroundColor: step <= currentStep ? "#24c598" : "#E5E5E5",
                borderRadius: "2px",
                transition: "background-color 0.2s"
              }}
            />
          ))}
        </div>

        {/* Step 1: Rolle wählen */}
        {currentStep === 1 && (
          <div>
            <label style={{
              display: "block",
              fontSize: "1rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.75rem"
            }}>
              Rolle *
            </label>
            <p style={{
              fontSize: "0.875rem",
              color: "#7A7A7A",
              marginBottom: "1rem",
              lineHeight: "1.5"
            }}>
              Wählen Sie die Rolle des Beteiligten aus.
            </p>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "0.75rem"
            }}>
              {ROLE_OPTIONS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  disabled={loading}
                  style={{
                    padding: "1rem",
                    backgroundColor: role === option.value ? "#E6F7E6" : "#FFFFFF",
                    border: `2px solid ${role === option.value ? "#24c598" : "#CDCDCD"}`,
                    borderRadius: "8px",
                    fontSize: "0.95rem",
                    fontWeight: role === option.value ? "600" : "400",
                    color: "#0A0A0A",
                    cursor: loading ? "not-allowed" : "pointer",
                    textAlign: "left",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && role !== option.value) {
                      e.currentTarget.style.borderColor = "#24c598"
                      e.currentTarget.style.backgroundColor = "#F0F9FF"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (role !== option.value) {
                      e.currentTarget.style.borderColor = "#CDCDCD"
                      e.currentTarget.style.backgroundColor = "#FFFFFF"
                    }
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Kontakt */}
        {currentStep === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label style={{
                display: "block",
                fontSize: "1rem",
                fontWeight: "600",
                color: "#0A0A0A",
                marginBottom: "0.5rem"
              }}>
                E-Mail-Adresse *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                placeholder="partner@beispiel.de"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #CDCDCD",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div>
              <label style={{
                display: "block",
                fontSize: "1rem",
                fontWeight: "600",
                color: "#0A0A0A",
                marginBottom: "0.5rem"
              }}>
                Name / Unternehmen (optional)
              </label>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  placeholder="Max Mustermann"
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    border: "1px solid #CDCDCD",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    boxSizing: "border-box"
                  }}
                />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  disabled={loading}
                  placeholder="Unternehmen GmbH"
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    border: "1px solid #CDCDCD",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    boxSizing: "border-box"
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{
                display: "block",
                fontSize: "1rem",
                fontWeight: "600",
                color: "#0A0A0A",
                marginBottom: "0.5rem"
              }}>
                Einladungstext (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={loading}
                rows={4}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #CDCDCD",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  resize: "vertical"
                }}
              />
              <p style={{
                fontSize: "0.75rem",
                color: "#7A7A7A",
                marginTop: "0.5rem",
                marginBottom: 0
              }}>
                Der Text wird automatisch vorbefüllt, kann aber angepasst werden.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Modus auswählen */}
        {currentStep === 3 && (
          <div>
            <label style={{
              display: "block",
              fontSize: "1rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.75rem"
            }}>
              Was soll diese Person tun? *
            </label>
            <p style={{
              fontSize: "0.875rem",
              color: "#7A7A7A",
              marginBottom: "1.25rem",
              lineHeight: "1.5"
            }}>
              Wählen Sie, ob die Person Daten beisteuert oder vorhandene Angaben prüft und bestätigt.
            </p>
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem"
            }}>
              <button
                type="button"
                onClick={() => setMode("contribute")}
                disabled={loading}
                style={{
                  padding: "1.25rem",
                  backgroundColor: mode === "contribute" ? "#E6F7E6" : "#FFFFFF",
                  border: `2px solid ${mode === "contribute" ? "#24c598" : "#CDCDCD"}`,
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  fontWeight: mode === "contribute" ? "600" : "400",
                  color: "#0A0A0A",
                  cursor: loading ? "not-allowed" : "pointer",
                  textAlign: "left",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem"
                }}
                onMouseEnter={(e) => {
                  if (!loading && mode !== "contribute") {
                    e.currentTarget.style.borderColor = "#24c598"
                    e.currentTarget.style.backgroundColor = "#F0F9FF"
                  }
                }}
                onMouseLeave={(e) => {
                  if (mode !== "contribute") {
                    e.currentTarget.style.borderColor = "#CDCDCD"
                    e.currentTarget.style.backgroundColor = "#FFFFFF"
                  }
                }}
              >
                <div style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  border: `2px solid ${mode === "contribute" ? "#24c598" : "#CDCDCD"}`,
                  backgroundColor: mode === "contribute" ? "#24c598" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: "2px"
                }}>
                  {mode === "contribute" && (
                    <div style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "#FFFFFF"
                    }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: "0.95rem",
                    fontWeight: mode === "contribute" ? "600" : "400",
                    color: "#0A0A0A",
                    marginBottom: "0.25rem"
                  }}>
                    Daten beisteuern
                  </div>
                  <div style={{
                    fontSize: "0.875rem",
                    color: "#7A7A7A",
                    lineHeight: "1.4"
                  }}>
                    Partner ergänzt oder pflegt Inhalte
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode("review")}
                disabled={loading}
                style={{
                  padding: "1.25rem",
                  backgroundColor: mode === "review" ? "#E6F7E6" : "#FFFFFF",
                  border: `2px solid ${mode === "review" ? "#24c598" : "#CDCDCD"}`,
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  fontWeight: mode === "review" ? "600" : "400",
                  color: "#0A0A0A",
                  cursor: loading ? "not-allowed" : "pointer",
                  textAlign: "left",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem"
                }}
                onMouseEnter={(e) => {
                  if (!loading && mode !== "review") {
                    e.currentTarget.style.borderColor = "#24c598"
                    e.currentTarget.style.backgroundColor = "#F0F9FF"
                  }
                }}
                onMouseLeave={(e) => {
                  if (mode !== "review") {
                    e.currentTarget.style.borderColor = "#CDCDCD"
                    e.currentTarget.style.backgroundColor = "#FFFFFF"
                  }
                }}
              >
                <div style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  border: `2px solid ${mode === "review" ? "#24c598" : "#CDCDCD"}`,
                  backgroundColor: mode === "review" ? "#24c598" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: "2px"
                }}>
                  {mode === "review" && (
                    <div style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "#FFFFFF"
                    }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: "0.95rem",
                    fontWeight: mode === "review" ? "600" : "400",
                    color: "#0A0A0A",
                    marginBottom: "0.25rem"
                  }}>
                    Daten prüfen & bestätigen
                  </div>
                  <div style={{
                    fontSize: "0.875rem",
                    color: "#7A7A7A",
                    lineHeight: "1.4"
                  }}>
                    Partner prüft vorhandene Angaben und bestätigt diese
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Zuständigkeiten (Block-first, Progressive Disclosure) */}
        {currentStep === 4 && (
          <div>
            <label style={{
              display: "block",
              fontSize: "1rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Welche Inhalte übernimmt diese Person? *
            </label>
            <p style={{
              fontSize: "0.875rem",
              color: "#7A7A7A",
              marginBottom: "1.25rem",
              lineHeight: "1.5"
            }}>
              Sie können ganze Abschnitte auswählen oder – falls nötig – die Zuständigkeit auf einzelne Felder einschränken.
            </p>

            {supplierEnabledBlocks.length === 0 ? (
              <div style={{
                padding: "1.5rem",
                backgroundColor: "#F5F5F5",
                borderRadius: "8px",
                color: "#7A7A7A",
                fontSize: "0.95rem",
                textAlign: "center"
              }}>
                Keine delegierbaren Blöcke verfügbar.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {supplierEnabledBlocks.map(block => {
                  const isBlockSelected = selectedBlocks.has(block.id)
                  const blockFieldsExpanded = expandedBlockFields.has(block.id)
                  // Felder für diesen Block (immer laden, auch wenn Block nicht ausgewählt, um zugewiesene Felder zu prüfen)
                  const blockFields: FieldInstance[] = []
                  block.fields.forEach(field => {
                    if (field.isRepeatable) {
                      const repeatableInstances = fieldInstances[field.key] || []
                      if (repeatableInstances.length > 0) {
                        repeatableInstances.forEach((inst, idx) => {
                          blockFields.push({
                            fieldId: field.id,
                            instanceId: inst.instanceId,
                            label: `${field.label} ${idx + 1}`,
                            assignedSupplier: getAssignedSupplier(field.id, inst.instanceId, block.id)
                          })
                        })
                      } else {
                        // Falls noch keine Instanzen existieren, erstelle eine Standard-Instanz
                        blockFields.push({
                          fieldId: field.id,
                          instanceId: `${field.id}-0`,
                          label: field.label,
                          assignedSupplier: getAssignedSupplier(field.id, `${field.id}-0`, block.id)
                        })
                      }
                    } else {
                      blockFields.push({
                        fieldId: field.id,
                        instanceId: `${field.id}-0`,
                        label: field.label,
                        assignedSupplier: getAssignedSupplier(field.id, `${field.id}-0`, block.id)
                      })
                    }
                  })
                  
                  // Prüfe, ob für diesen Block Felder ausgewählt sind
                  const selectedFieldsForBlock = blockFields.filter(fi => {
                    const key = `${fi.fieldId}:${fi.instanceId}`
                    return selectedFieldInstances.has(key)
                  })
                  
                  return (
                    <div
                      key={block.id}
                      style={{
                        border: `2px solid ${isBlockSelected ? "#24c598" : "#E5E5E5"}`,
                        borderRadius: "8px",
                        backgroundColor: isBlockSelected ? "#F9F9F9" : "#FFFFFF",
                        overflow: "hidden",
                        transition: "all 0.2s"
                      }}
                    >
                      {/* Block-Auswahl (primär) */}
                      <div
                        style={{
                          padding: "1rem",
                          cursor: loading ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          backgroundColor: isBlockSelected ? "#E6F7E6" : "transparent"
                        }}
                        onClick={() => !loading && handleBlockSelect(block.id, !isBlockSelected)}
                        onMouseEnter={(e) => {
                          if (!loading && !isBlockSelected) {
                            e.currentTarget.style.backgroundColor = "#F0F9FF"
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isBlockSelected) {
                            e.currentTarget.style.backgroundColor = "transparent"
                          }
                        }}
                      >
                        <div style={{
                          width: "20px",
                          height: "20px",
                          border: `2px solid ${isBlockSelected ? "#24c598" : "#CDCDCD"}`,
                          borderRadius: "4px",
                          backgroundColor: isBlockSelected ? "#24c598" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}>
                          {isBlockSelected && (
                            <span style={{ color: "#FFFFFF", fontSize: "0.75rem", fontWeight: "700" }}>✓</span>
                          )}
                        </div>
                        <span style={{
                          fontSize: "0.95rem",
                          fontWeight: "600",
                          color: "#0A0A0A",
                          flex: 1
                        }}>
                          {block.name}
                        </span>
                      </div>

                      {/* Progressive Disclosure: Optionale Felder-Auswahl (nur wenn Block ausgewählt) */}
                      {isBlockSelected && blockFields.length > 0 && (
                        <div style={{
                          padding: "0.75rem 1rem 1rem 1rem",
                          backgroundColor: "#FFFFFF",
                          borderTop: "1px solid #E5E5E5"
                        }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleBlockFieldsToggle(block.id)
                            }}
                            disabled={loading}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              padding: "0.5rem 0.75rem",
                              backgroundColor: "transparent",
                              border: "1px solid #E5E5E5",
                              borderRadius: "6px",
                              cursor: loading ? "not-allowed" : "pointer",
                              fontSize: "0.813rem",
                              fontWeight: "400",
                              color: "#7A7A7A",
                              transition: "all 0.2s",
                              marginBottom: blockFieldsExpanded ? "0.75rem" : "0"
                            }}
                            onMouseEnter={(e) => {
                              if (!loading) {
                                e.currentTarget.style.borderColor = "#24c598"
                                e.currentTarget.style.color = "#24c598"
                                e.currentTarget.style.backgroundColor = "#F0F9FF"
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = "#E5E5E5"
                              e.currentTarget.style.color = "#7A7A7A"
                              e.currentTarget.style.backgroundColor = "transparent"
                            }}
                          >
                            <span>{blockFieldsExpanded ? "▾" : "▸"}</span>
                            <span>Optional: Zuständigkeit auf einzelne Felder einschränken</span>
                          </button>

                          {/* Felder-Liste (wenn ausgeklappt) */}
                          {blockFieldsExpanded && (
                            <div style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.5rem",
                              marginTop: "0.75rem",
                              paddingTop: "0.75rem",
                              borderTop: "1px solid #F0F0F0"
                            }}>
                              {blockFields.map(fi => {
                                const key = `${fi.fieldId}:${fi.instanceId}`
                                const isSelected = selectedFieldInstances.has(key)
                                const isAssigned = !!fi.assignedSupplier

                                return (
                                  <label
                                    key={key}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (!isAssigned && !loading) {
                                        handleFieldInstanceToggle(fi.fieldId, fi.instanceId, !isSelected)
                                      }
                                    }}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "0.75rem",
                                      padding: "0.75rem",
                                      backgroundColor: isSelected ? "#E6F7E6" : (isAssigned ? "#F5F5F5" : "transparent"),
                                      border: `1px solid ${isSelected ? "#24c598" : (isAssigned ? "#CDCDCD" : "#E5E5E5")}`,
                                      borderRadius: "6px",
                                      cursor: isAssigned || loading ? "not-allowed" : "pointer",
                                      opacity: isAssigned ? 0.5 : 1,
                                      transition: "all 0.2s"
                                    }}
                                    title={isAssigned ? `Dieses Feld ist bereits zugewiesen (${fi.assignedSupplier})` : undefined}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected && !isAssigned}
                                      onChange={(e) => {
                                        e.stopPropagation()
                                        if (!isAssigned && !loading) {
                                          handleFieldInstanceToggle(fi.fieldId, fi.instanceId, e.target.checked)
                                        }
                                      }}
                                      disabled={loading || isAssigned}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (isAssigned) {
                                          e.preventDefault()
                                        }
                                      }}
                                      style={{
                                        width: "18px",
                                        height: "18px",
                                        cursor: isAssigned ? "not-allowed" : "pointer",
                                        flexShrink: 0,
                                        opacity: isAssigned ? 0.5 : 1
                                      }}
                                    />
                                    <span style={{ 
                                      fontSize: "0.9rem", 
                                      color: isAssigned ? "#7A7A7A" : "#0A0A0A", 
                                      flex: 1,
                                      textDecoration: isAssigned ? "line-through" : "none"
                                    }}>
                                      {fi.label}
                                    </span>
                                    {isAssigned && (
                                      <span style={{
                                        fontSize: "0.75rem",
                                        color: "#7A7A7A",
                                        fontStyle: "italic"
                                      }}>
                                        Bereits zugewiesen
                                      </span>
                                    )}
                                  </label>
                                )
                              })}
                            </div>
                          )}

                          {/* Hinweis wenn Felder ausgewählt */}
                          {selectedFieldsForBlock.length > 0 && !blockFieldsExpanded && (
                            <div style={{
                              fontSize: "0.813rem",
                              color: "#7A7A7A",
                              marginTop: "0.5rem",
                              paddingLeft: "0.75rem"
                            }}>
                              {selectedFieldsForBlock.length} Feld{selectedFieldsForBlock.length > 1 ? "er" : ""} ausgewählt
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 5: Zusammenfassung */}
        {currentStep === 5 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <h3 style={{
                fontSize: "1.1rem",
                fontWeight: "600",
                color: "#0A0A0A",
                marginBottom: "1rem"
              }}>
                Zusammenfassung
              </h3>
              
              <div style={{
                padding: "1.25rem",
                backgroundColor: "#F9F9F9",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "1rem"
              }}>
                <div>
                  <div style={{
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "#7A7A7A",
                    marginBottom: "0.25rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}>
                    Rolle
                  </div>
                  <div style={{
                    fontSize: "1rem",
                    color: "#0A0A0A",
                    fontWeight: "600"
                  }}>
                    {ROLE_OPTIONS.find(r => r.value === role)?.label || role}
                  </div>
                </div>

                <div>
                  <div style={{
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "#7A7A7A",
                    marginBottom: "0.25rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}>
                    Modus
                  </div>
                  <div style={{
                    fontSize: "1rem",
                    color: "#0A0A0A",
                    fontWeight: "600"
                  }}>
                    {mode === "contribute" ? "Daten beisteuern" : mode === "review" ? "Daten prüfen & bestätigen" : "-"}
                  </div>
                  <div style={{
                    fontSize: "0.875rem",
                    color: "#7A7A7A",
                    marginTop: "0.25rem"
                  }}>
                    {mode === "contribute" ? "Partner ergänzt oder pflegt Inhalte" : mode === "review" ? "Partner prüft vorhandene Angaben und bestätigt diese" : ""}
                  </div>
                </div>

                <div>
                  <div style={{
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "#7A7A7A",
                    marginBottom: "0.25rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}>
                    Kontakt
                  </div>
                  <div style={{
                    fontSize: "1rem",
                    color: "#0A0A0A"
                  }}>
                    {email}
                    {name && ` - ${name}`}
                    {company && ` (${company})`}
                  </div>
                </div>

                <div>
                  <div style={{
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "#7A7A7A",
                    marginBottom: "0.25rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}>
                    Zuständigkeiten
                  </div>
                  <div style={{
                    fontSize: "1rem",
                    color: "#0A0A0A"
                  }}>
                    {selectedBlocks.size > 0 && `${selectedBlocks.size} Block${selectedBlocks.size > 1 ? "e" : ""}`}
                    {selectedBlocks.size > 0 && selectedFieldInstances.size > 0 && " / "}
                    {selectedFieldInstances.size > 0 && `${selectedFieldInstances.size} Feld${selectedFieldInstances.size > 1 ? "er" : ""}`}
                  </div>
                  <div style={{
                    fontSize: "0.875rem",
                    color: "#7A7A7A",
                    marginTop: "0.25rem"
                  }}>
                    {mode === "contribute" 
                      ? selectedFieldInstances.size > 0 
                        ? "Zugriff: Bearbeiten nur der ausgewählten Felder" 
                        : "Zugriff: Bearbeiten der gesamten Blöcke"
                      : selectedFieldInstances.size > 0
                        ? "Zugriff: Prüfen & Bestätigen nur der ausgewählten Felder"
                        : "Zugriff: Prüfen & Bestätigen der gesamten Blöcke"
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Bereits eingebundene Beteiligte */}
            {assignedSummary.length > 0 && (
              <div>
                <div style={{
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#7A7A7A",
                  marginBottom: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em"
                }}>
                  Bereits eingebunden
                </div>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem"
                }}>
                  {assignedSummary.map((summary, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "0.75rem 1rem",
                        backgroundColor: "#F5F5F5",
                        borderRadius: "6px",
                        fontSize: "0.9rem",
                        color: "#0A0A0A"
                      }}
                    >
                      <strong>{summary.role}</strong>
                      {summary.blocks > 0 && ` – ${summary.blocks} Block${summary.blocks > 1 ? "e" : ""}`}
                      {summary.fields > 0 && ` – ${summary.fields} Feld${summary.fields > 1 ? "er" : ""}`}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "2rem",
          paddingTop: "1.5rem",
          borderTop: "1px solid #E5E5E5"
        }}>
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "transparent",
                  color: "#0A0A0A",
                  border: "1px solid #CDCDCD",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer"
                }}
              >
                Zurück
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={loading || !canProceed()}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: loading || !canProceed() ? "#CDCDCD" : "#24c598",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  cursor: loading || !canProceed() ? "not-allowed" : "pointer",
                  transition: "background-color 0.2s"
                }}
              >
                Weiter
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !canProceed()}
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor: loading || !canProceed() ? "#CDCDCD" : "#24c598",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    cursor: loading || !canProceed() ? "not-allowed" : "pointer"
                  }}
                >
                  {loading ? "Wird gesendet..." : "Beteiligten einladen"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Reset für weiteren Beteiligten
                    setRole("")
                    setEmail("")
                    setName("")
                    setCompany("")
                    setMessage(DEFAULT_INVITATION_TEXT)
                    setMode("")
                    setSelectedBlocks(new Set())
                    setSelectedFieldInstances(new Set())
                    setExpandedBlockFields(new Set())
                    setCurrentStep(1)
                  }}
                  disabled={loading}
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor: "transparent",
                    color: "#0A0A0A",
                    border: "1px solid #CDCDCD",
                    borderRadius: "8px",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    cursor: loading ? "not-allowed" : "pointer"
                  }}
                >
                  + Weiteren Beteiligten hinzufügen
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
