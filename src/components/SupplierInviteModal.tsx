"use client"

import { useState, useEffect, useRef } from "react"
import ConfirmDialog from "@/components/ConfirmDialog"

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
  sendEmail?: boolean // Steuert, ob E-Mail sofort versendet wird (default: true)
}

interface ExistingInvite {
  id: string
  email: string
  partnerRole: string
  blockIds?: string[]
  fieldInstances?: FieldInstance[]
  supplierMode?: string // "input" | "declaration"
  status: string
  emailSentAt?: Date | string | null // Timestamp, wenn E-Mail verschickt wurde
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
  onSendPendingInvites?: () => Promise<void> // Callback zum Versenden von E-Mails an alle pending Invites
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
  onSendPendingInvites,
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
  const [showExistingInvitesHeader, setShowExistingInvitesHeader] = useState(false) // Nur anzeigen nach "Weiteren Beteiligten hinzufügen"
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [inviteToRemove, setInviteToRemove] = useState<ExistingInvite | null>(null)
  const [hasVisitedStep5, setHasVisitedStep5] = useState(false) // Track ob Schritt 5 bereits besucht wurde
  const [showAllFieldsAssignedHint, setShowAllFieldsAssignedHint] = useState(false) // Hinweis, dass alle Felder zugewiesen sind
  const [showAddAnotherDialog, setShowAddAnotherDialog] = useState(false) // Dialog "Weiteren Beteiligten einladen?"
  const prevIsOpenRef = useRef(false) // Track vorherigen isOpen-Status, um Öffnen zu erkennen

  // Helper: Prüft, ob ein Block supplier-fähig ist
  const isBlockSupplierEnabled = (blockId: string): boolean => {
    return blockSupplierConfigs[blockId]?.enabled === true
  }

  // Helper: Filtert nur supplier-fähige Blöcke (order > 0)
  const supplierEnabledBlocks = template?.blocks.filter(
    block => block.order > 0 && isBlockSupplierEnabled(block.id)
  ) || []

  // Helper: Prüft, ob ein Feld bereits für "Beisteuern" (exklusiv) zugewiesen wurde
  // WICHTIG: Berücksichtigt sowohl "Beisteuern" (input/contribute) als auch "Prüfen" (declaration/review)
  // Ein Feld, das bereits für einen Modus zugewiesen wurde, kann nicht mehr für "Beisteuern" zugewiesen werden
  // WICHTIG: Berücksichtigt ALLE Invites, auch noch nicht verschickte (pending ohne emailSentAt)
  const getAssignedSupplierForContribute = (fieldId: string, instanceId: string, blockId: string): string | undefined => {
    // Prüfe ALLE Invites (inkl. pending ohne emailSentAt), damit Felder auch VOR dem Versenden ausgegraut werden
    // Prüfe Invites mit Modus "Beisteuern" (input/contribute) UND "Prüfen" (declaration/review)
    for (const invite of existingInvites) {
      // Prüfe sowohl "Beisteuern" als auch "Prüfen" - ein Feld kann nicht für beide Modi zugewiesen werden
      // WICHTIG: Prüfe ALLE invites, unabhängig vom Status oder emailSentAt
      if (invite.supplierMode !== "input" && invite.supplierMode !== "contribute" && invite.supplierMode !== "declaration" && invite.supplierMode !== "review") {
        continue
      }
      
      // Prüfe zuerst, ob das Feld explizit zugewiesen wurde
      if (invite.fieldInstances && invite.fieldInstances.length > 0) {
        const fieldAssigned = invite.fieldInstances.some(fi => fi.fieldId === fieldId && fi.instanceId === instanceId)
        if (fieldAssigned) {
          return invite.email
        }
      }
      
      // Wenn das Feld nicht explizit zugewiesen wurde, prüfe ob der Block vollständig zugewiesen wurde
      if (invite.blockIds && invite.blockIds.length > 0 && invite.blockIds.includes(blockId)) {
        // Wenn KEINE Felder explizit zugewiesen wurden, ist der Block vollständig zugewiesen
        if (!invite.fieldInstances || invite.fieldInstances.length === 0) {
          // Block ist vollständig zugewiesen (ohne Felder), daher sind ALLE Felder zugewiesen
          return invite.email
        }
      }
    }
    return undefined
  }

  // Helper: Prüft, ob mindestens ein Feld für einen Modus verfügbar ist
  // WICHTIG: Berücksichtigt ALLE Invites, auch noch nicht verschickte (pending ohne emailSentAt)
  const hasAvailableFieldsForMode = (mode: "contribute" | "review"): boolean => {
    if (!template) return false
    
    // Für "Daten prüfen & bestätigen": Alle Felder können geprüft werden (immer verfügbar)
    if (mode === "review") {
      return supplierEnabledBlocks.length > 0
    }
    
    // Für "Daten beisteuern": Prüfe, ob mindestens ein Feld NICHT bereits zugewiesen ist
    // WICHTIG: getAssignedSupplierForContribute prüft bereits ALLE invites (inkl. pending ohne emailSentAt)
    // und berücksichtigt sowohl explizite Feld-Zuweisungen als auch Block-Zuweisungen
    // WICHTIG: Berücksichtigt sowohl "Beisteuern" (input/contribute) als auch "Prüfen" (declaration/review)
    
    // Debug: Log alle Invites mit contribute mode ODER declaration mode
    const contributeInvites = existingInvites.filter(inv => 
      inv.supplierMode === "input" || inv.supplierMode === "contribute" || inv.supplierMode === "declaration" || inv.supplierMode === "review"
    )
    console.log("[SupplierInviteModal] hasAvailableFieldsForMode - contributeInvites (inkl. declaration):", contributeInvites.length, contributeInvites.map(inv => ({
      email: inv.email,
      supplierMode: inv.supplierMode,
      blockIds: inv.blockIds,
      fieldInstances: inv.fieldInstances?.length || 0
    })))
    
    let availableFieldsFound = 0
    let totalFieldsChecked = 0
    
    for (const block of supplierEnabledBlocks) {
      // Prüfe, ob Block vollständig zugewiesen ist (ohne explizite Felder)
      // Berücksichtigt sowohl "Beisteuern" als auch "Prüfen"
      // Direkte Prüfung ohne isBlockAssigned, da diese Funktion später definiert ist
      const blockAssigned = contributeInvites.some(inv => {
        // Wenn Felder explizit zugewiesen wurden, ist der Block nicht vollständig zugewiesen
        if (inv.fieldInstances && inv.fieldInstances.length > 0) {
          return false
        }
        // Wenn Block-IDs vorhanden sind und dieser Block dabei ist
        return inv.blockIds && inv.blockIds.length > 0 && inv.blockIds.includes(block.id)
      })
      
      if (blockAssigned) {
        // Block ist vollständig zugewiesen ohne explizite Felder - alle Felder sind zugewiesen
        console.log("[SupplierInviteModal] Block", block.name, "ist vollständig zugewiesen ohne explizite Felder")
        continue // Alle Felder dieses Blocks sind zugewiesen
      }
      
      // Prüfe einzelne Felder
      for (const field of block.fields) {
        if (field.isRepeatable) {
          const repeatableInstances = fieldInstances[field.key] || []
          for (const inst of repeatableInstances) {
            totalFieldsChecked++
            const assigned = getAssignedSupplierForContribute(field.id, inst.instanceId, block.id)
            if (!assigned) {
              availableFieldsFound++
              console.log("[SupplierInviteModal] Verfügbares Feld gefunden:", field.label, inst.instanceId, "in Block", block.name)
              return true // Mindestens ein Feld ist verfügbar
            }
          }
          // Falls keine Instanzen existieren, ist das Feld verfügbar
          if (repeatableInstances.length === 0) {
            availableFieldsFound++
            console.log("[SupplierInviteModal] Verfügbares Feld gefunden (keine Instanzen):", field.label, "in Block", block.name)
            return true
          }
        } else {
          totalFieldsChecked++
          const assigned = getAssignedSupplierForContribute(field.id, `${field.id}-0`, block.id)
          if (!assigned) {
            availableFieldsFound++
            console.log("[SupplierInviteModal] Verfügbares Feld gefunden:", field.label, "in Block", block.name)
            return true // Mindestens ein Feld ist verfügbar
          }
        }
      }
    }
    
    console.log("[SupplierInviteModal] hasAvailableFieldsForMode - Ergebnis: false (keine verfügbaren Felder), totalFieldsChecked:", totalFieldsChecked)
    return false // Keine verfügbaren Felder
  }

  // Prüfe Verfügbarkeit für beide Modi
  const canUseContributeMode = hasAvailableFieldsForMode("contribute")
  const canUseReviewMode = hasAvailableFieldsForMode("review")
  
  // Debug-Logs für Verfügbarkeits-Checks
  console.log("[SupplierInviteModal] canUseContributeMode:", canUseContributeMode)
  console.log("[SupplierInviteModal] canUseReviewMode:", canUseReviewMode)
  console.log("[SupplierInviteModal] currentStep:", currentStep)
  console.log("[SupplierInviteModal] existingInvites count:", existingInvites.length)
  console.log("[SupplierInviteModal] supplierEnabledBlocks count:", supplierEnabledBlocks.length)
  
  // Prüfe, ob es ausstehende Einladungen gibt (Schritt 5 immer erreichbar)
  const hasPendingInvites = existingInvites.some(invite => 
    invite.status === "pending" && !invite.emailSentAt
  )

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
  }, [isOpen, template, fieldInstances, existingInvites])

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
    // Prüfe, ob das Modal gerade geöffnet wurde (von false zu true)
    const justOpened = isOpen && !prevIsOpenRef.current
    
    if (justOpened && !showSuccessToast) {
      console.log("[SupplierInviteModal] Modal gerade geöffnet - Prüfung:", {
        canUseContributeMode,
        canUseReviewMode
      })
      
      // IMMER prüfen, ob noch Felder zugewiesen werden können
      // Wenn nicht, IMMER zu Schritt 5 springen - unabhängig vom aktuellen Step
      if (!canUseContributeMode) {
        console.log("[SupplierInviteModal] Keine Felder mehr verfügbar - springe zu Schritt 5")
        setCurrentStep(5)
        setHasVisitedStep5(true)
        setShowExistingInvitesHeader(false)
        prevIsOpenRef.current = isOpen
        return
      }
      
      // Wenn Felder verfügbar sind, Form zurücksetzen und zu Schritt 1 springen
      console.log("[SupplierInviteModal] Felder verfügbar - reset und zu Schritt 1")
      setRole("")
      setEmail("")
      setName("")
      setCompany("")
      setMessage(DEFAULT_INVITATION_TEXT)
      setMode("")
      setSelectedBlocks(new Set())
      setSelectedFieldInstances(new Set())
      setExpandedBlockFields(new Set())
      
      // Wenn Felder verfügbar sind, zu Schritt 1 springen
      setCurrentStep(1)
      setHasVisitedStep5(false)
      
      // Header nicht anzeigen beim normalen Öffnen
      setShowExistingInvitesHeader(false)
    }
    
    // Aktualisiere Ref am Ende
    prevIsOpenRef.current = isOpen
  }, [isOpen, showSuccessToast, canUseContributeMode])

  // Helper: Prüft, ob ein Feld bereits zugewiesen wurde (für Anzeigezwecke)
  // Zeigt an, wer das Feld befüllt oder prüft
  
  // Helper: Prüft, ob ein Feld bereits zugewiesen wurde (für Anzeigezwecke)
  // Zeigt an, wer das Feld befüllt oder prüft
  const getAssignedSupplier = (fieldId: string, instanceId: string, blockId: string): string | undefined => {
    // Prüfe ALLE Invites (nicht nur pending), damit Felder auch VOR dem Versenden ausgegraut werden
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
  
  // Helper: Prüft, ob ein Feld für "Beisteuern" zugewiesen ist (für Deaktivierung)
  // Wird nur verwendet, wenn aktueller Modus = "Beisteuern"
  const isFieldAssignedForContribute = (fieldId: string, instanceId: string, blockId: string): boolean => {
    return !!getAssignedSupplierForContribute(fieldId, instanceId, blockId)
  }
  
  // Helper: Prüft, ob ein Block bereits vollständig zugewiesen ist
  // WICHTIG: Prüft ALLE Invites (nicht nur pending), damit Blöcke auch VOR dem Versenden ausgegraut werden
  const isBlockAssigned = (blockId: string): string | undefined => {
    for (const invite of existingInvites) {
      // Wenn Felder explizit zugewiesen wurden, ist der Block nicht vollständig zugewiesen
      if (invite.fieldInstances && invite.fieldInstances.length > 0) {
        continue
      }
      
      // Wenn Block-IDs vorhanden sind und dieser Block dabei ist
      if (invite.blockIds && invite.blockIds.length > 0 && invite.blockIds.includes(blockId)) {
        return invite.email
      }
    }
    return undefined
  }

  // Helper: Zählt zugewiesene Blöcke/Felder für einen Beteiligten
  const getAssignedSummary = (invite: ExistingInvite): { blocks: number; fields: number; blockNames: string[] } => {
    const blocks = invite.blockIds?.length || 0
    const fields = invite.fieldInstances?.length || 0
    // Hole Block-Namen aus template
    const blockNames: string[] = []
    if (invite.blockIds && template) {
      invite.blockIds.forEach(blockId => {
        const block = template.blocks.find(b => b.id === blockId)
        if (block) {
          blockNames.push(block.name)
        }
      })
    }
    return { blocks, fields, blockNames }
  }

  // Helper: Hole Block-Namen für aktuelle Auswahl (für Zusammenfassung)
  const getSelectedBlockNames = (): string[] => {
    const blockNames: string[] = []
    if (selectedBlocks.size > 0 && template) {
      selectedBlocks.forEach(blockId => {
        const block = template.blocks.find(b => b.id === blockId)
        if (block) {
          blockNames.push(block.name)
        }
      })
    }
    return blockNames
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
    // Prüfe, ob Block bereits zugewiesen ist
    const assignedSupplier = isBlockAssigned(blockId)
    if (assignedSupplier) {
      return // Block ist bereits zugewiesen, kann nicht ausgewählt werden
    }
    
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
      // Prüfe, ob noch Felder verfügbar sind, bevor man zu Schritt 2 geht
      if (!canUseContributeMode && !canUseReviewMode) {
        // Keine Felder mehr verfügbar - springe direkt zu Schritt 5
        setCurrentStep(5)
        setHasVisitedStep5(true)
        return
      }
      setCurrentStep(2)
    } else if (currentStep === 2) {
      if (!email.trim()) return
      // Prüfe, ob noch Felder verfügbar sind, bevor man zu Schritt 3 geht
      if (!canUseContributeMode && !canUseReviewMode) {
        // Keine Felder mehr verfügbar - springe direkt zu Schritt 5
        setCurrentStep(5)
        setHasVisitedStep5(true)
        return
      }
      setCurrentStep(3)
    } else if (currentStep === 3) {
      if (!mode) return
      // Prüfe, ob noch Felder verfügbar sind für den gewählten Modus
      if (mode === "contribute" && !canUseContributeMode) {
        // Keine Felder mehr verfügbar für Beisteuern - springe direkt zu Schritt 5
        setCurrentStep(5)
        setHasVisitedStep5(true)
        return
      }
      if (mode === "review" && !canUseReviewMode) {
        // Keine Felder mehr verfügbar für Prüfen - springe direkt zu Schritt 5
        setCurrentStep(5)
        setHasVisitedStep5(true)
        return
      }
      // Prüfe erneut, ob noch Felder verfügbar sind, bevor man zu Schritt 4 geht
      const hasAvailableFields = mode === "contribute" ? canUseContributeMode : canUseReviewMode
      if (!hasAvailableFields) {
        // Keine Felder mehr verfügbar - springe direkt zu Schritt 5
        setCurrentStep(5)
        setHasVisitedStep5(true)
        return
      }
      setCurrentStep(4)
    } else if (currentStep === 4) {
      // Prüfe, ob noch Felder verfügbar sind für den gewählten Modus
      const hasAvailableFields = mode === "contribute" ? canUseContributeMode : canUseReviewMode
      if (!hasAvailableFields && selectedBlocks.size === 0 && selectedFieldInstances.size === 0) {
        // Keine Felder mehr verfügbar und nichts ausgewählt - springe direkt zu Schritt 5
        setCurrentStep(5)
        setHasVisitedStep5(true)
        return
      }
      if (selectedBlocks.size === 0 && selectedFieldInstances.size === 0) return
      setCurrentStep(5)
      setHasVisitedStep5(true) // Markiere Schritt 5 als besucht
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as 1 | 2 | 3 | 4 | 5)
    }
  }

  const handleSubmit = async (sendEmailNow: boolean = true) => {
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
        selectedFieldInstances: instances,
        sendEmail: sendEmailNow // Steuert, ob E-Mail sofort versendet wird
      })

      // Multi-Invite-Flow: Modal bleibt offen
      setSuccessMessage(sendEmailNow ? "Beteiligter erfolgreich eingeladen" : "Beteiligter erfolgreich gespeichert")
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 3000)

      // Callback aufrufen NACH erfolgreichem onSubmit (damit dataRequests neu geladen werden)
      if (onInviteSuccess) {
        onInviteSuccess()
      }

      // Zeige Bestätigungsdialog für "Weiteren Beteiligten einladen?"
      setShowAddAnotherDialog(true)
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
  console.log("[SupplierInviteModal] existingInvites mit Status:", existingInvites.map(i => ({ email: i.email, status: i.status, blockIds: i.blockIds, emailSentAt: i.emailSentAt })))
  console.log("[SupplierInviteModal] pending invites:", existingInvites.filter(i => i.status === "pending").length)
  console.log("[SupplierInviteModal] isOpen:", isOpen)
  console.log("[SupplierInviteModal] currentStep:", currentStep)
  console.log("[SupplierInviteModal] Will show overview:", existingInvites.length > 0)

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

        {/* TEIL 4: Modal als "Beteiligten-Manager" - persistierender Header mit allen konfigurierten Beteiligten */}
        {existingInvites.length > 0 && (
          <div style={{
            marginBottom: "1.5rem",
            padding: "1rem",
            backgroundColor: "#F9F9F9",
            borderRadius: "8px",
            border: "1px solid #E5E5E5"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.75rem"
            }}>
              <div style={{
                fontSize: "0.813rem",
                fontWeight: "600",
                color: "#7A7A7A",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>
                Konfigurierte Beteiligte ({existingInvites.length})
              </div>
              {hasPendingInvites && currentStep !== 5 && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(5)
                    setHasVisitedStep5(true)
                  }}
                  disabled={loading}
                  style={{
                    padding: "0.375rem 0.75rem",
                    backgroundColor: "transparent",
                    border: "1px solid #CDCDCD",
                    borderRadius: "6px",
                    fontSize: "0.813rem",
                    fontWeight: "500",
                    color: "#7A7A7A",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    opacity: loading ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.borderColor = "#24c598"
                      e.currentTarget.style.color = "#24c598"
                      e.currentTarget.style.backgroundColor = "#F0F9FF"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.borderColor = "#CDCDCD"
                      e.currentTarget.style.color = "#7A7A7A"
                      e.currentTarget.style.backgroundColor = "transparent"
                    }
                  }}
                >
                  Zur Übersicht
                </button>
              )}
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
                        marginBottom: "0.25rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        flexWrap: "wrap"
                      }}>
                        <span>{roleLabel}</span>
                        <span style={{ color: "#7A7A7A", fontWeight: "400" }}>•</span>
                        <span style={{ fontSize: "0.875rem", fontWeight: "400", color: "#7A7A7A" }}>{invite.email}</span>
                        {invite.status === "pending" && !invite.emailSentAt && (
                          <span style={{
                            fontSize: "0.75rem",
                            padding: "0.125rem 0.5rem",
                            backgroundColor: "#FEF3C7",
                            color: "#92400E",
                            borderRadius: "4px",
                            fontWeight: "600"
                          }}>
                            Noch nicht benachrichtigt
                          </span>
                        )}
                        {invite.status === "submitted" && (
                          <span style={{
                            fontSize: "0.75rem",
                            padding: "0.125rem 0.5rem",
                            backgroundColor: "#D1FAE5",
                            color: "#065F46",
                            borderRadius: "4px",
                            fontWeight: "600"
                          }}>
                            Daten eingereicht
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: "0.813rem",
                        color: "#7A7A7A",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        flexWrap: "wrap"
                      }}>
                        <span>{modeLabel}</span>
                        {summary.blocks > 0 && (
                          <span>• <strong>{summary.blocks} Block{summary.blocks > 1 ? "e" : ""}</strong>
                            {summary.blockNames && summary.blockNames.length > 0 && ` (${summary.blockNames.join(", ")})`}
                          </span>
                        )}
                        {summary.fields > 0 && (
                          <span>• {summary.fields} Feld{summary.fields > 1 ? "er" : ""}</span>
                        )}
                      </div>
                    </div>
                    {/* Entfernen-Button nur für pending invites (keine eingereichten Daten) */}
                    {onRemoveInvite && invite.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => {
                          setInviteToRemove(invite)
                          setShowConfirmDialog(true)
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

        {/* Progress Indicator - Klickbar für Navigation */}
        <div style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "2rem",
          paddingBottom: "1rem",
          borderBottom: "1px solid #E5E5E5"
        }}>
          {[1, 2, 3, 4, 5].map(step => {
            // Schritt 5 ist nur aktiv, wenn er bereits besucht wurde oder wenn man gerade dort ist
            const isStepCompleted = step < currentStep
            const isCurrentStep = step === currentStep
            // Schritt 5 ist nur grün, wenn er bereits besucht wurde ODER wenn man gerade dort ist
            // WICHTIG: Tab 5 ist NICHT klickbar - wurde durch "Zur Übersicht" Button ersetzt
            const isStep5Active = step === 5 && (isCurrentStep || hasVisitedStep5)
            const canClick = false // Tab 5 ist nicht klickbar - "Zur Übersicht" Button wird stattdessen verwendet
            
            return (
              <button
                key={step}
                type="button"
                onClick={() => {
                  // Tab 5 ist nicht klickbar
                }}
                disabled={true}
                title={undefined}
                style={{
                  flex: 1,
                  height: "4px",
                  backgroundColor: (isStepCompleted || isCurrentStep || isStep5Active) ? "#24c598" : "#E5E5E5",
                  borderRadius: "2px",
                  transition: "all 0.2s",
                  border: "none",
                  cursor: "default",
                  padding: 0,
                  position: "relative"
                }}
              />
            )
          })}
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
              <div style={{ 
                display: "flex", 
                flexDirection: "column",
                gap: "0.75rem"
              }}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  placeholder="Max Mustermann"
                  style={{
                    width: "100%",
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
                  placeholder="Unternehmen"
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
                disabled={loading || !canUseContributeMode}
                style={{
                  padding: "1.25rem",
                  backgroundColor: mode === "contribute" ? "#E6F7E6" : "#FFFFFF",
                  border: `2px solid ${mode === "contribute" ? "#24c598" : (!canUseContributeMode ? "#F5F5F5" : "#CDCDCD")}`,
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  fontWeight: "400",
                  color: !canUseContributeMode ? "#CDCDCD" : "#0A0A0A",
                  cursor: (loading || !canUseContributeMode) ? "not-allowed" : "pointer",
                  opacity: !canUseContributeMode ? 0.6 : 1,
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
                    fontWeight: "400",
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
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.375rem", marginTop: "0.25rem", fontSize: "0.813rem", color: "#7A7A7A" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "2px" }}>
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                      <span>Exklusive Verantwortung • Jedes Feld nur einmal zuweisbar</span>
                    </div>
                    {!canUseContributeMode && (
                      <div style={{ 
                        fontSize: "0.813rem", 
                        color: "#DC2626", 
                        marginTop: "0.5rem",
                        fontStyle: "italic"
                      }}>
                        Alle Felder sind bereits zugewiesen.
                      </div>
                    )}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode("review")}
                disabled={loading || !canUseReviewMode}
                style={{
                  padding: "1.25rem",
                  backgroundColor: mode === "review" ? "#E6F7E6" : "#FFFFFF",
                  border: `2px solid ${mode === "review" ? "#24c598" : (!canUseReviewMode ? "#F5F5F5" : "#CDCDCD")}`,
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  fontWeight: "400",
                  color: !canUseReviewMode ? "#CDCDCD" : "#0A0A0A",
                  cursor: (loading || !canUseReviewMode) ? "not-allowed" : "pointer",
                  opacity: !canUseReviewMode ? 0.6 : 1,
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
                    fontWeight: "400",
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
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.375rem", marginTop: "0.25rem", fontSize: "0.813rem", color: "#7A7A7A" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "2px" }}>
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                      <span>Schreibgeschützt • Mehrere Prüfer pro Feld möglich</span>
                    </div>
                    {!canUseReviewMode && (
                      <div style={{ 
                        fontSize: "0.813rem", 
                        color: "#DC2626", 
                        marginTop: "0.5rem",
                        fontStyle: "italic"
                      }}>
                        Keine Blöcke verfügbar.
                      </div>
                    )}
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
                  
                  // Prüfe, ob ALLE Felder dieses Blocks zugewiesen sind (für Block-Checkbox)
                  const allFieldsAssigned = blockFields.length > 0 && blockFields.every(fi => !!fi.assignedSupplier)
                  const blockDisabledByFields = allFieldsAssigned && blockFields.length > 0
                  
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
                          cursor: (loading || blockDisabledByFields) ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          backgroundColor: isBlockSelected ? "#E6F7E6" : (blockDisabledByFields ? "#F5F5F5" : "transparent"),
                          opacity: blockDisabledByFields ? 0.5 : 1
                        }}
                        onClick={() => !loading && !blockDisabledByFields && handleBlockSelect(block.id, !isBlockSelected)}
                        onMouseEnter={(e) => {
                          if (!loading && !isBlockSelected && !blockDisabledByFields) {
                            e.currentTarget.style.backgroundColor = "#F0F9FF"
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isBlockSelected) {
                            e.currentTarget.style.backgroundColor = blockDisabledByFields ? "#F5F5F5" : "transparent"
                          }
                        }}
                        title={blockDisabledByFields ? `Alle Felder dieses Blocks sind bereits zugewiesen` : undefined}
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
                          color: blockDisabledByFields ? "#7A7A7A" : "#0A0A0A",
                          flex: 1,
                          textDecoration: blockDisabledByFields ? "line-through" : "none"
                        }}>
                          {block.name}
                        </span>
                        {blockDisabledByFields && (
                          <span style={{
                            fontSize: "0.75rem",
                            color: "#7A7A7A",
                            fontStyle: "italic"
                          }}>
                            Bereits zugewiesen
                          </span>
                        )}
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
                                // TEIL 2: Feld-Logik verfeinern
                                // Nur deaktivieren, wenn Modus = "Beisteuern" UND Feld bereits für "Beisteuern" zugewiesen
                                const isAssignedForContribute = mode === "contribute" && isFieldAssignedForContribute(fi.fieldId, fi.instanceId, block.id)
                                const isAssigned = isAssignedForContribute
                                
                                // Für Anzeige: Wer hat das Feld befüllt/geprüft (unabhängig vom Modus)
                                const assignedForContribute = getAssignedSupplierForContribute(fi.fieldId, fi.instanceId, block.id)
                                const reviewersForField = existingInvites.filter(inv => {
                                  if (inv.supplierMode !== "declaration" && inv.supplierMode !== "review") return false
                                  if (inv.fieldInstances && inv.fieldInstances.length > 0) {
                                    return inv.fieldInstances.some(fi2 => fi2.fieldId === fi.fieldId && fi2.instanceId === fi.instanceId)
                                  }
                                  if (inv.blockIds && inv.blockIds.includes(block.id) && (!inv.fieldInstances || inv.fieldInstances.length === 0)) {
                                    return true
                                  }
                                  return false
                                })
                                const hasReviewers = reviewersForField.length > 0

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
                                    title={isAssigned ? (mode === "contribute" && assignedForContribute ? `Dieses Feld ist bereits durch ${existingInvites.find(inv => inv.email === assignedForContribute)?.partnerRole || "einen Beteiligten"} zur Befüllung zugewiesen` : `Dieses Feld ist bereits zugewiesen`) : undefined}
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
                                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                    <span style={{ 
                                      fontSize: "0.9rem", 
                                      color: isAssigned ? "#7A7A7A" : "#0A0A0A", 
                                      textDecoration: isAssigned ? "line-through" : "none"
                                    }}>
                                      {fi.label}
                                    </span>
                                      {/* TEIL 3: Sichtbarkeit der Verantwortlichkeit */}
                                      {(assignedForContribute || hasReviewers) && (
                                        <div style={{
                                          fontSize: "0.75rem",
                                          color: "#7A7A7A",
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: "0.125rem"
                                        }}>
                                          {assignedForContribute && (
                                            <span style={{ fontStyle: "italic" }}>
                                              Befüllt durch {existingInvites.find(inv => inv.email === assignedForContribute)?.partnerRole || "Beteiligten"}
                                            </span>
                                          )}
                                          {hasReviewers && (
                                            <span style={{ fontStyle: "italic" }}>
                                              Geprüft durch {reviewersForField.map(inv => inv.partnerRole).join(", ")}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
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

        {/* Step 5: Zusammenfassung - nur anzeigen wenn Daten eingegeben wurden */}
        {currentStep === 5 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Zusammenfassung nur anzeigen, wenn in Schritten 1-4 Daten eingegeben wurden */}
            {(role || email || mode || selectedBlocks.size > 0 || selectedFieldInstances.size > 0) && (
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
                    {selectedBlocks.size > 0 && (
                      <>
                        <strong>{selectedBlocks.size} Block{selectedBlocks.size > 1 ? "e" : ""}</strong>
                        {(() => {
                          const blockNames = getSelectedBlockNames()
                          return blockNames.length > 0 ? ` (${blockNames.join(", ")})` : ""
                        })()}
                      </>
                    )}
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
            )}

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
                      {summary.blocks > 0 && (
                        <>
                          {` – ${summary.blocks} Block${summary.blocks > 1 ? "e" : ""}`}
                          {summary.blockNames && summary.blockNames.length > 0 && ` (${summary.blockNames.join(", ")})`}
                        </>
                      )}
                      {summary.fields > 0 && ` – ${summary.fields} Feld${summary.fields > 1 ? "er" : ""}`}
                    </div>
                  ))}
                </div>
                {/* Hinweis, wenn alle Felder/Blöcke bereits zugewiesen sind */}
                {(() => {
                  const shouldShowHint = !canUseContributeMode && currentStep === 5
                  console.log("[SupplierInviteModal] Schritt 5 - shouldShowHint:", shouldShowHint, "canUseContributeMode:", canUseContributeMode)
                  return shouldShowHint ? (
                    <div style={{
                      marginTop: "0.75rem",
                      padding: "0.75rem 1rem",
                      backgroundColor: "#FEF3C7",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
                      color: "#92400E",
                      border: "1px solid #FDE68A"
                    }}>
                      Alle Felder und Blöcke sind bereits zugewiesen. Eine weitere Zuweisung ist nicht möglich.
                    </div>
                  ) : null
                })()}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          marginTop: "2rem",
          paddingTop: "1.5rem",
          borderTop: "1px solid #E5E5E5",
          gap: "0.75rem"
        }}>
          {/* Mobile: Buttons untereinander, Desktop: nebeneinander */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            width: "100%"
          }}>
            {/* Zurück-Button - nur anzeigen wenn nicht alle Felder zugewiesen sind */}
            {currentStep > 1 && canUseContributeMode && (
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
                  cursor: loading ? "not-allowed" : "pointer",
                  height: "42px",
                  boxSizing: "border-box",
                  width: "100%"
                }}
              >
                Zurück
              </button>
            )}

            {/* Haupt-Button Container */}
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
                  transition: "background-color 0.2s",
                  height: "42px",
                  boxSizing: "border-box",
                  width: "100%"
                }}
              >
                Weiter
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    // Wenn es pending Invites gibt, versende E-Mails an diese
                    if (hasPendingInvites && onSendPendingInvites) {
                      await onSendPendingInvites()
                      return
                    }
                    // Sonst: Normale Submit-Funktion (neuen Beteiligten hinzufügen)
                    // Prüfe Validierung vor dem Aufruf
                    if (!role || !email.trim() || !mode || (selectedBlocks.size === 0 && selectedFieldInstances.size === 0)) {
                      console.error("[SupplierInviteModal] Validierung fehlgeschlagen:", { role, email, mode, selectedBlocks: selectedBlocks.size, selectedFieldInstances: selectedFieldInstances.size })
                      return
                    }
                    await handleSubmit(true)
                  }}
                  disabled={loading || (hasPendingInvites ? false : !canProceed())}
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor: loading || (hasPendingInvites ? false : !canProceed()) ? "#CDCDCD" : "#24c598",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    cursor: loading || (hasPendingInvites ? false : !canProceed()) ? "not-allowed" : "pointer",
                    transition: "background-color 0.2s ease",
                    height: "42px",
                    boxSizing: "border-box",
                    width: "100%"
                  }}
                >
                  {loading ? "Wird gesendet..." : hasPendingInvites ? "Nicht benachrichtigte Beteiligte einladen" : "Beteiligten einladen"}
                </button>
                {/* "Weiteren Beteiligten" - immer anzeigen, aber ausgegraut wenn keine Felder mehr verfügbar für "contribute" */}
                {(() => {
                  const isDisabled = loading || !canUseContributeMode
                  console.log("[SupplierInviteModal] Schritt 5 - '+ Weiteren Beteiligten' Button:", {
                    isDisabled,
                    loading,
                    canUseContributeMode,
                    backgroundColor: !canUseContributeMode ? "#F5F5F5" : "transparent",
                    color: !canUseContributeMode ? "#CDCDCD" : "#0A0A0A",
                    opacity: !canUseContributeMode ? 0.5 : 1
                  })
                  return (
                    <button
                      type="button"
                      onClick={async () => {
                        // Wenn keine Felder mehr verfügbar für "contribute", keine Aktion
                        if (!canUseContributeMode) {
                          console.log("[SupplierInviteModal] Button geklickt, aber canUseContributeMode ist false")
                          return
                        }
                        // Speichere aktuellen Beteiligten OHNE E-Mail zu versenden
                        await handleSubmit(false)
                        // Reset für weiteren Beteiligten erfolgt bereits in handleSubmit
                        // Header anzeigen, wenn "Weiteren Beteiligten" geklickt wird
                        setShowExistingInvitesHeader(true)
                      }}
                      disabled={isDisabled}
                      style={{
                        padding: "0.75rem 1.5rem",
                        backgroundColor: !canUseContributeMode ? "#F5F5F5" : "transparent",
                        color: !canUseContributeMode ? "#CDCDCD" : "#0A0A0A",
                        border: `1px solid ${!canUseContributeMode ? "#E5E5E5" : "#CDCDCD"}`,
                        borderRadius: "8px",
                        fontSize: "0.95rem",
                        fontWeight: "600",
                        cursor: isDisabled ? "not-allowed" : "pointer",
                        opacity: !canUseContributeMode ? 0.5 : 1,
                        height: "42px",
                        boxSizing: "border-box",
                        width: "100%",
                        transition: "all 0.2s"
                      }}
                    >
                      + Weiteren Beteiligten
                    </button>
                  )
                })()}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Dialog für Entfernen */}
      {showConfirmDialog && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 10002,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem"
        }}
        onClick={() => {
          if (!loading) {
            setShowConfirmDialog(false)
            setInviteToRemove(null)
          }
        }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
              width: "90%",
              maxWidth: "480px",
              overflow: "hidden"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: "1.5rem 1.5rem 1rem",
              borderBottom: "1px solid #F5F5F5"
            }}>
              <h2 style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                color: "#0A0A0A",
                margin: 0
              }}>
                Beteiligten entfernen
              </h2>
            </div>

            {/* Body */}
            <div style={{
              padding: "1.5rem"
            }}>
              <p style={{
                fontSize: "1rem",
                color: "#7A7A7A",
                lineHeight: "1.5",
                margin: 0,
                marginBottom: "1.5rem"
              }}>
                {inviteToRemove ? `Möchten Sie den Beteiligten "${inviteToRemove.email}" wirklich entfernen?` : ""}
              </p>

              {/* Actions */}
              <div style={{
                display: "flex",
                gap: "0.75rem",
                justifyContent: "flex-end"
              }}>
                <button
                  onClick={() => {
                    if (!loading) {
                      setShowConfirmDialog(false)
                      setInviteToRemove(null)
                    }
                  }}
                  disabled={loading}
                  style={{
                    padding: "0.75rem 1.5rem",
                    fontSize: "1rem",
                    fontWeight: "500",
                    color: "#7A7A7A",
                    backgroundColor: "transparent",
                    border: "1px solid #CDCDCD",
                    borderRadius: "8px",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    minWidth: "120px",
                    boxSizing: "border-box",
                    opacity: loading ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.borderColor = "#24c598"
                      e.currentTarget.style.color = "#24c598"
                      e.currentTarget.style.backgroundColor = "#FFF5F9"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.borderColor = "#CDCDCD"
                      e.currentTarget.style.color = "#7A7A7A"
                      e.currentTarget.style.backgroundColor = "transparent"
                    }
                  }}
                >
                  Abbrechen
                </button>
                <button
                  onClick={async () => {
                    if (inviteToRemove && onRemoveInvite && !loading) {
                      await onRemoveInvite(inviteToRemove.id)
                      setShowConfirmDialog(false)
                      setInviteToRemove(null)
                    }
                  }}
                  disabled={loading}
                  style={{
                    padding: "0.75rem 1.5rem",
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#FFFFFF",
                    backgroundColor: loading ? "#CDCDCD" : "#DC2626",
                    border: "none",
                    borderRadius: "8px",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    boxShadow: loading ? "none" : "0 2px 8px rgba(220, 38, 38, 0.2)",
                    minWidth: "120px",
                    boxSizing: "border-box"
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor = "#991B1B"
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(220, 38, 38, 0.3)"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor = "#DC2626"
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(220, 38, 38, 0.2)"
                    }
                  }}
                >
                  Entfernen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialog: Weiteren Beteiligten einladen? */}
      {showAddAnotherDialog && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 10002,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem"
          }}
          onClick={() => {
            if (!loading) {
              setShowAddAnotherDialog(false)
              // Bei Abbrechen: Modal schließen
              onClose()
            }
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
              width: "90%",
              maxWidth: "480px",
              overflow: "hidden"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: "1.5rem 1.5rem 1rem",
              borderBottom: "1px solid #F5F5F5"
            }}>
              <h2 style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                color: "#0A0A0A",
                margin: 0
              }}>
                Weiteren Beteiligten einladen?
              </h2>
            </div>

            {/* Body */}
            <div style={{
              padding: "1.5rem"
            }}>
              <p style={{
                fontSize: "1rem",
                color: "#7A7A7A",
                lineHeight: "1.5",
                margin: 0,
                marginBottom: "1.5rem"
              }}>
                Möchten Sie einen weiteren Beteiligten einladen?
              </p>

              {/* Actions */}
              <div style={{
                display: "flex",
                gap: "0.75rem",
                justifyContent: "flex-end"
              }}>
                <button
                  onClick={() => {
                    if (!loading) {
                      setShowAddAnotherDialog(false)
                      // Bei "Nein": Modal schließen
                      onClose()
                    }
                  }}
                  disabled={loading}
                  style={{
                    padding: "0.75rem 1.5rem",
                    fontSize: "1rem",
                    fontWeight: "500",
                    color: "#7A7A7A",
                    backgroundColor: "transparent",
                    border: "1px solid #CDCDCD",
                    borderRadius: "8px",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    minWidth: "120px",
                    boxSizing: "border-box",
                  }}
                >
                  Nein
                </button>
                <button
                  onClick={() => {
                    if (!loading) {
                      setShowAddAnotherDialog(false)
                      // Bei "Ja": Reset form und zurück zu Schritt 1
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
                      // Reset Schritt 5 Besuch-Status, damit Tab 5 nicht mehr hervorgehoben ist
                      setHasVisitedStep5(false)
                    }
                  }}
                  disabled={loading}
                  style={{
                    padding: "0.75rem 1.5rem",
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#FFFFFF",
                    backgroundColor: loading ? "#CDCDCD" : "#24c598",
                    border: "none",
                    borderRadius: "8px",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    minWidth: "120px",
                    boxSizing: "border-box",
                  }}
                >
                  Ja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
