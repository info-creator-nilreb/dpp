"use client"

/**
 * New Template Content (Client Component)
 * 
 * Form to create a new template
 */

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Papa from "papaparse"

interface Block {
  id: string
  name: string
  // ENTFERNT: supplierConfig - wird jetzt pro DPP konfiguriert, nicht im Template
  fields: Field[]
}

interface Field {
  id: string
  label: string
  key: string
  type: string
  required: boolean
  config: any | null
}

const fieldTypes = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Mehrzeiliger Text" },
  { value: "number", label: "Zahl" },
  { value: "select", label: "Auswahl" },
  { value: "multi-select", label: "Mehrfachauswahl" },
  { value: "boolean", label: "Ja/Nein" },
  { value: "date", label: "Datum" },
  { value: "url", label: "URL" },
  { value: "file", label: "Datei (alle Typen)" },
  { value: "file-image", label: "Bild (JPG, PNG, WebP)" },
  { value: "file-document", label: "Dokument (PDF)" },
  { value: "file-video", label: "Video" },
  { value: "country", label: "Land (ISO-3166)" },
  { value: "reference", label: "Referenz" }
]

const categories = [
  { value: "FURNITURE", label: "Möbel" },
  { value: "TEXTILE", label: "Textilien" },
  { value: "OTHER", label: "Sonstige" }
]

interface ExistingTemplate {
  id: string
  name: string
  category: string | null
  version: number
  blocks: Array<{
    id: string
    name: string
    order: number
    fields: Array<{
      id: string
      label: string
      key: string
      type: string
      required: boolean
      regulatoryRequired: boolean
      config: string | null
      order: number
    }>
  }>
}

interface NewTemplateContentProps {
  existingTemplates: ExistingTemplate[]
}

// Canonical block names (must match DPP structure)
const CANONICAL_BLOCKS = [
  "Basis- & Produktdaten",
  "Materialien & Zusammensetzung",
  "Nutzung, Pflege & Lebensdauer",
  "Rechtliches & Konformität",
  "Rücknahme & Second Life"
]

export default function NewTemplateContent({ existingTemplates }: NewTemplateContentProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(true) // Show dialog on mount
  const [creationMode, setCreationMode] = useState<"from-existing" | "empty" | "csv-import" | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [categoryLocked, setCategoryLocked] = useState(false) // Lock category after selection
  
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [industry, setIndustry] = useState("")
  const [description, setDescription] = useState("")
  const [blocks, setBlocks] = useState<Block[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvErrors, setCsvErrors] = useState<string[]>([])
  const [csvParsing, setCsvParsing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [editingFieldOptions, setEditingFieldOptions] = useState<string | null>(null)
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null)

  // Helper: Generate English key from German label
  // This ensures consistency with DPP column keys (name, description, countryOfOrigin, etc.)
  const generateKeyFromLabel = (label: string): string => {
    if (!label) return ""
    
    // Mapping von deutschen Labels zu englischen Standard-Keys
    // Dies sorgt für Konsistenz mit DPP-Spalten-Keys
    const labelMapping: Record<string, string> = {
      // Basis- & Produktdaten
      "produktname": "name",
      "produkt name": "name",
      "name": "name",
      "beschreibung": "description",
      "description": "description",
      "sku": "sku",
      "sku / interne id": "sku",
      "interne id": "sku",
      "gtin": "gtin",
      "ean": "gtin",
      "gtin / ean": "gtin",
      "marke": "brand",
      "hersteller": "brand",
      "marke / hersteller": "brand",
      "brand": "brand",
      "herstellungsland": "countryOfOrigin",
      "country of origin": "countryOfOrigin",
      "countryoforigin": "countryOfOrigin",
      // Materialien & Zusammensetzung
      "materialliste": "materials",
      "materialien": "materials",
      "materials": "materials",
      "datenquelle": "materialSource",
      "materialquelle": "materialSource",
      "material source": "materialSource",
      // Nutzung, Pflege & Lebensdauer
      "pflegehinweise": "careInstructions",
      "pflege": "careInstructions",
      "care instructions": "careInstructions",
      "lebensdauer": "lifespan",
      "lifespan": "lifespan",
      "reparierbarkeit": "isRepairable",
      "reparierbar": "isRepairable",
      "is repairable": "isRepairable",
      "ersatzteile verfügbar": "sparePartsAvailable",
      "spare parts available": "sparePartsAvailable",
      // Rechtliches & Konformität
      "konformitätserklärung": "conformityDeclaration",
      "conformity declaration": "conformityDeclaration",
      "entsorgungsinformationen": "disposalInfo",
      "disposal info": "disposalInfo",
      // Rücknahme & Second Life
      "rücknahme angeboten": "takebackOffered",
      "takeback offered": "takebackOffered",
      "rücknahmekontakt": "takebackContact",
      "takeback contact": "takebackContact",
      "second life informationen": "secondLifeInfo",
      "second life": "secondLifeInfo",
      "secondlifeinfo": "secondLifeInfo"
    }
    
    // Normalisiere Label für Mapping
    const normalizedLabel = label.toLowerCase().trim()
    
    // Prüfe zuerst direktes Mapping
    if (labelMapping[normalizedLabel]) {
      return labelMapping[normalizedLabel]
    }
    
    // Prüfe Teilstring-Matches (z.B. "Produktname" in "Produktname (Lang)")
    for (const [germanLabel, englishKey] of Object.entries(labelMapping)) {
      if (normalizedLabel.includes(germanLabel) || germanLabel.includes(normalizedLabel)) {
        return englishKey
      }
    }
    
    // Fallback: Generiere Key aus Label (camelCase, englisch-orientiert)
    // Versuche, deutsche Begriffe zu übersetzen
    const translationMap: Record<string, string> = {
      "produkt": "product",
      "name": "name",
      "beschreibung": "description",
      "land": "country",
      "herstellung": "origin",
      "material": "material",
      "quelle": "source",
      "pflege": "care",
      "hinweis": "instruction",
      "lebens": "life",
      "dauer": "span",
      "reparier": "repair",
      "konformität": "conformity",
      "erklärung": "declaration",
      "entsorgung": "disposal",
      "info": "info",
      "rücknahme": "takeback",
      "kontakt": "contact"
    }
    
    // Ersetze bekannte deutsche Begriffe
    let englishKey = normalizedLabel
    for (const [german, english] of Object.entries(translationMap)) {
      englishKey = englishKey.replace(new RegExp(german, "g"), english)
    }
    
    // Generiere camelCase Key
    return englishKey
      .replace(/[äöü]/g, (char) => {
        const map: Record<string, string> = { ä: "ae", ö: "oe", ü: "ue" }
        return map[char] || char
      })
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .replace(/_+/g, "_")
      .replace(/_([a-z])/g, (_, char) => char.toUpperCase())
      .replace(/^[a-z]/, (char) => char.toLowerCase())
  }

  const addBlock = () => {
    setBlocks([...blocks, {
      id: Date.now().toString(),
      name: "",
      // ENTFERNT: supplierConfig - wird jetzt pro DPP konfiguriert
      fields: []
    }])
  }

  // ENTFERNT: updateSupplierConfig - Supplier-Config wird jetzt pro DPP konfiguriert

  const updateBlockName = (blockId: string, name: string) => {
    setBlocks(blocks.map(block =>
      block.id === blockId ? { ...block, name } : block
    ))
  }

  const deleteBlock = (blockId: string) => {
    if (blocks.length > 1) {
      setBlocks(blocks.filter(block => block.id !== blockId))
    }
  }

  const addField = (blockId: string) => {
    setBlocks(blocks.map(block =>
      block.id === blockId
        ? {
            ...block,
            fields: [
              ...block.fields,
              {
                id: Date.now().toString(),
                label: "",
                key: "",
                type: "text",
                required: false,
                config: null,
                isRepeatable: false
              }
            ]
          }
        : block
    ))
  }

  const updateField = (blockId: string, fieldId: string, updates: Partial<Field>) => {
    setBlocks(blocks.map(block =>
      block.id === blockId
        ? {
            ...block,
            fields: block.fields.map(field => {
              if (field.id === fieldId) {
                const updated = { ...field, ...updates }
                // WICHTIG: Wenn Label geändert wird, generiere Key automatisch neu
                if (updates.label !== undefined && updates.label !== field.label) {
                  const newKey = generateKeyFromLabel(updates.label)
                  if (newKey) {
                    updated.key = newKey
                  }
                }
                return updated
              }
              return field
            })
          }
        : block
    ))
  }

  // Helper: Parse select options from config
  const getSelectOptions = (config: any): Array<{ value: string; label: string; esprReference?: string }> => {
    if (!config) return []
    if (typeof config === "string") {
      try {
        const parsed = JSON.parse(config)
        return parsed.options || []
      } catch {
        return []
      }
    }
    return config.options || []
  }

  // Helper: Update select options in config
  const updateSelectOptions = (blockId: string, fieldId: string, options: Array<{ value: string; label: string; esprReference?: string }>) => {
    const field = blocks.find(b => b.id === blockId)?.fields.find(f => f.id === fieldId)
    const currentConfig = field?.config || {}
    const newConfig = { ...currentConfig, options }
    updateField(blockId, fieldId, { config: newConfig })
  }

  // Drag & Drop für Felder
  const handleFieldDragStart = (e: React.DragEvent, blockId: string, fieldId: string) => {
    setDraggedFieldId(fieldId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleFieldDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleFieldDrop = (e: React.DragEvent, targetBlockId: string, targetFieldId: string) => {
    e.preventDefault()
    if (!draggedFieldId) return

    const sourceBlock = blocks.find(b => b.fields.some(f => f.id === draggedFieldId))
    if (!sourceBlock) return

    const sourceField = sourceBlock.fields.find(f => f.id === draggedFieldId)
    if (!sourceField) return

    // Nur innerhalb desselben Blocks verschieben
    if (sourceBlock.id !== targetBlockId) {
      setDraggedFieldId(null)
      return
    }

    const targetFieldIndex = sourceBlock.fields.findIndex(f => f.id === targetFieldId)
    const sourceFieldIndex = sourceBlock.fields.findIndex(f => f.id === draggedFieldId)

    if (targetFieldIndex === -1 || sourceFieldIndex === -1) {
      setDraggedFieldId(null)
      return
    }

    // Felder neu anordnen
    const newFields = [...sourceBlock.fields]
    newFields.splice(sourceFieldIndex, 1)
    newFields.splice(targetFieldIndex, 0, sourceField)

    setBlocks(blocks.map(block =>
      block.id === targetBlockId
        ? { ...block, fields: newFields }
        : block
    ))

    setDraggedFieldId(null)
  }

  const handleFieldDragEnd = () => {
    setDraggedFieldId(null)
  }

  // Block reordering functions
  const moveBlockUp = (blockIndex: number) => {
    // Block 0 (Basis- & Produktdaten) is always fixed, block 1 can only move down
    if (blockIndex <= 1 || blockIndex >= blocks.length) return
    const newBlocks = [...blocks]
    const temp = newBlocks[blockIndex]
    newBlocks[blockIndex] = newBlocks[blockIndex - 1]
    newBlocks[blockIndex - 1] = temp
    setBlocks(newBlocks)
  }

  const moveBlockDown = (blockIndex: number) => {
    if (blockIndex >= blocks.length - 1) return
    const newBlocks = [...blocks]
    const temp = newBlocks[blockIndex]
    newBlocks[blockIndex] = newBlocks[blockIndex + 1]
    newBlocks[blockIndex + 1] = temp
    setBlocks(newBlocks)
  }

  const deleteField = (blockId: string, fieldId: string) => {
    setBlocks(blocks.map(block =>
      block.id === blockId
        ? {
            ...block,
            fields: block.fields.filter(field => field.id !== fieldId)
          }
        : block
    ))
  }

  // Initialize blocks based on creation mode
  const initializeFromTemplate = (template: ExistingTemplate) => {
    setName(`${template.name} (Kopie)`)
    setCategory(template.category || "")
    setCategoryLocked(true) // Lock category after selection
    setDescription("") // Don't copy description, let user set new one
    
    // Clone blocks and fields
    // WICHTIG: Generiere Keys neu aus Labels, um sicherzustellen, dass neue Templates englische Keys haben
    const clonedBlocks: Block[] = template.blocks.map(block => ({
      id: `block-${Date.now()}-${Math.random()}`,
      name: block.name,
      fields: block.fields.map(field => {
        // Generiere Key neu aus Label (stellt sicher, dass neue Templates englische Keys haben)
        const newKey = generateKeyFromLabel(field.label) || field.key
        return {
          id: `field-${Date.now()}-${Math.random()}`,
          label: field.label,
          key: newKey, // Neu generierter Key aus Label
          type: field.type,
          required: field.required,
          config: field.config ? JSON.parse(field.config) : null,
          isRepeatable: (field as any).isRepeatable || false
        }
      })
    }))
    setBlocks(clonedBlocks)
    setShowDialog(false)
  }

  const initializeEmpty = () => {
    // Category must be set before creating empty template
    // This function is called after category is selected in dialog
    // Create 5 canonical blocks
    const canonicalBlocks: Block[] = CANONICAL_BLOCKS.map((blockName, index) => ({
      id: `block-${Date.now()}-${index}`,
      name: blockName,
      fields: []
    }))
    setBlocks(canonicalBlocks)
    setShowDialog(false)
  }

  // CSV Template Download
  const handleDownloadCsvTemplate = () => {
    const csvContent = `Block Name,Field Label,Field Type,Required,Config
"Basis- & Produktdaten","Produktname","text",true,""
"Basis- & Produktdaten","Beschreibung","textarea",false,""
"Basis- & Produktdaten","SKU","text",true,""
"Materialien & Zusammensetzung","Material","text",true,""
"Nutzung, Pflege & Lebensdauer","Pflegehinweise","textarea",false,""
"Rechtliches & Konformität","Konformitätserklärung","boolean",false,""
"Rücknahme & Second Life","Rücknahmeprogramm","boolean",false,""

Hinweise:
- Block Name: Name des Blocks (muss exakt sein oder leer für neuen Block)
- Field Label: Anzeigename des Feldes (Pflichtfeld)
- Field Type: text, textarea, number, select, multi-select, boolean, date, url, file, country, reference
- Required: true oder false
- Config: JSON-String für erweiterte Konfiguration (z.B. {"options": [{"value": "opt1", "label": "Option 1"}]} für select)
- Hinweis: Der technische Key wird automatisch aus dem Label generiert`
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "template-import-template.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Parse CSV File (1:1 vom DPP-Import übernommen)
  const parseCsvFile = (file: File) => {
    setCsvParsing(true)
    setCsvErrors([])
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = []
        const parsedBlocks: Map<string, Block> = new Map()
        
        results.data.forEach((row: any, index: number) => {
          const rowNum = index + 2 // +2 for header and 1-based counting
          
          // Normalisiere Felder (trim whitespace, lowercase, entferne Unterstriche/Bindestriche)
          // Unterstützt: "Block Name", "block_name", "blockName" → "blockname"
          const normalizedRow: any = {}
          Object.keys(row).forEach(key => {
            const normalizedKey = key.trim().toLowerCase().replace(/[_-]/g, "")
            normalizedRow[normalizedKey] = typeof row[key] === "string" ? row[key].trim() : row[key]
          })
          
          // Extract values from normalized row
          const blockName = (normalizedRow["blockname"] || row["Block Name"] || row["block_name"] || row["blockName"] || "").trim()
          const fieldLabel = (normalizedRow["fieldlabel"] || row["Field Label"] || row["field_label"] || row["fieldLabel"] || "").trim()
          const fieldKey = (normalizedRow["fieldkey"] || row["Field Key"] || row["field_key"] || row["fieldKey"] || "").trim()
          const fieldType = (normalizedRow["fieldtype"] || row["Field Type"] || row["field_type"] || row["fieldType"] || "text").trim().toLowerCase()
          const required = (normalizedRow["required"] || row["Required"] || row["required"] || "false").toString().toLowerCase() === "true"
          const configStr = (normalizedRow["config"] || row["Config"] || row["config"] || "").trim()
          
          // Validation
          if (!blockName) {
            errors.push(`Zeile ${rowNum}: Block Name ist erforderlich`)
            return
          }
          
          if (!fieldLabel) {
            errors.push(`Zeile ${rowNum}: Field Label ist erforderlich`)
            return
          }
          
          // Auto-generate key from label if not provided
          const finalFieldKey = fieldKey || generateKeyFromLabel(fieldLabel)
          
          // Validate field key format if provided (lowercase, no spaces)
          if (fieldKey && !/^[a-z][a-z0-9_]*$/.test(fieldKey)) {
            errors.push(`Zeile ${rowNum}: Field Key muss mit Kleinbuchstaben beginnen und darf nur Kleinbuchstaben, Zahlen und Unterstriche enthalten`)
            return
          }
          
          // Validate field type
          const validTypes = ["text", "textarea", "number", "select", "multi-select", "boolean", "date", "url", "file", "country", "reference"]
          if (!validTypes.includes(fieldType)) {
            errors.push(`Zeile ${rowNum}: Ungültiger Field Type. Erlaubt: ${validTypes.join(", ")}`)
            return
          }
          
          // Parse config if provided
          let config = null
          if (configStr) {
            try {
              config = JSON.parse(configStr)
            } catch (e) {
              errors.push(`Zeile ${rowNum}: Config ist kein gültiger JSON-String`)
              return
            }
          }
          
          // Get or create block
          if (!parsedBlocks.has(blockName)) {
            parsedBlocks.set(blockName, {
              id: `block-${Date.now()}-${parsedBlocks.size}`,
              name: blockName,
              fields: []
            })
          }
          
          const block = parsedBlocks.get(blockName)!
          
          // Check for duplicate field keys in same block
          if (block.fields.some(f => f.key === finalFieldKey)) {
            errors.push(`Zeile ${rowNum}: Field Key "${finalFieldKey}" existiert bereits im Block "${blockName}"`)
            return
          }
          
          // Add field to block
          block.fields.push({
            id: `field-${Date.now()}-${block.fields.length}`,
            label: fieldLabel,
            key: finalFieldKey,
            type: fieldType,
            required: required,
            config: config
          })
        })
        
        if (errors.length > 0) {
          setCsvErrors(errors)
          setCsvParsing(false)
          return
        }
        
        // Initialize template from CSV
        const csvBlocks = Array.from(parsedBlocks.values())
        if (csvBlocks.length === 0) {
          setCsvErrors(["CSV-Datei enthält keine gültigen Blöcke und Felder"])
          setCsvParsing(false)
          return
        }
        
        setBlocks(csvBlocks)
        setCategory(category || "") // Keep category if already set
        setShowDialog(false)
        setCsvParsing(false)
      },
      error: (error) => {
        setCsvErrors([`Fehler beim Parsen der CSV-Datei: ${error.message}`])
        setCsvParsing(false)
      }
    })
  }

  // Datei-Handling (1:1 vom DPP-Import übernommen)
  const handleFileSelect = (file: File) => {
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setCsvErrors(["Bitte wählen Sie eine CSV-Datei aus"])
      return
    }
    
    setCsvFile(file)
    parseCsvFile(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validate
      if (!name || !category) {
        setError("Name und Kategorie sind erforderlich")
        setLoading(false)
        return
      }

      // Validate blocks (must have at least one)
      if (blocks.length === 0) {
        setError("Mindestens ein Block ist erforderlich")
        setLoading(false)
        return
      }

      // Validate blocks
      for (const block of blocks) {
        if (!block.name || block.name.trim() === "") {
          setError("Alle Blöcke benötigen einen Namen")
          setLoading(false)
          return
        }
      }

      // Validate fields
      for (const block of blocks) {
        for (const field of block.fields) {
          if (!field.label) {
            setError("Alle Felder benötigen einen Label")
            setLoading(false)
            return
          }
        }
      }

      // Prepare data - Generate keys automatically from labels
      const templateData = {
        name,
        category,
        industry: industry || null,
        description: description || null,
        blocks: blocks.map(block => ({
          name: block.name,
          // ENTFERNT: supplierConfig - wird jetzt pro DPP konfiguriert
          fields: block.fields.map(field => ({
            label: field.label,
            key: field.key || generateKeyFromLabel(field.label), // Auto-generate if missing
            type: field.type,
            required: field.required,
            isRepeatable: (field as any).isRepeatable || false,
            config: field.config
          }))
        }))
      }

      const response = await fetch("/api/super-admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateData)
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Fehler beim Erstellen des Templates")
        setLoading(false)
        return
      }

      // Success feedback
      if (data.template?.id) {
        // Redirect to template editor
        router.push(`/super-admin/templates/${data.template.id}`)
      } else {
        setError("Template wurde erstellt, aber keine ID zurückgegeben")
        setLoading(false)
      }
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist aufgetreten")
      setLoading(false)
    }
  }

  // Show dialog until user chooses a mode
  if (showDialog) {
    return (
      <div style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E5E5E5",
        borderRadius: "12px",
        padding: "2rem",
        maxWidth: "600px",
        margin: "0 auto"
      }}>
        <h2 style={{
          fontSize: "1.5rem",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "1rem"
        }}>
          Template-Erstellung
        </h2>
        <p style={{
          fontSize: "0.95rem",
          color: "#7A7A7A",
          marginBottom: "2rem"
        }}>
          Wählen Sie, wie Sie das neue Template erstellen möchten:
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
          {/* Option A: From Existing */}
          <div style={{
            border: creationMode === "from-existing" ? "2px solid #24c598" : "2px solid #E5E5E5",
            borderRadius: "8px",
            padding: "1.5rem",
            cursor: "pointer",
            transition: "all 0.2s",
            backgroundColor: creationMode === "from-existing" ? "#FFF5F9" : "#FFFFFF"
          }}
          onClick={() => setCreationMode("from-existing")}
          onMouseEnter={(e) => {
            if (creationMode !== "from-existing") {
              e.currentTarget.style.borderColor = "#24c598"
            }
          }}
          onMouseLeave={(e) => {
            if (creationMode !== "from-existing") {
              e.currentTarget.style.borderColor = "#E5E5E5"
            }
          }}>
            <h3 style={{
              fontSize: "1.1rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Von bestehender Vorlage erstellen
            </h3>
            <p style={{
              fontSize: "0.9rem",
              color: "#7A7A7A",
              marginBottom: creationMode === "from-existing" ? "1rem" : "0"
            }}>
              Klont die Block-Struktur eines vorhandenen aktiven Templates
            </p>
            {creationMode === "from-existing" && (
              <div>
                <label htmlFor="template-select" style={{
                  display: "block",
                  fontSize: "0.95rem",
                  fontWeight: "500",
                  color: "#0A0A0A",
                  marginBottom: "0.5rem"
                }}>
                  Vorlage auswählen *
                </label>
                <select
                  id="template-select"
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #CDCDCD",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    boxSizing: "border-box",
                    backgroundColor: "#FFFFFF"
                  }}
                >
                  <option value="">Bitte wählen...</option>
                  {existingTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.category}) - Version {template.version}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Option B: Empty */}
          <div style={{
            border: creationMode === "empty" ? "2px solid #24c598" : "2px solid #E5E5E5",
            borderRadius: "8px",
            padding: "1.5rem",
            cursor: "pointer",
            transition: "all 0.2s",
            backgroundColor: creationMode === "empty" ? "#FFF5F9" : "#FFFFFF"
          }}
          onClick={() => setCreationMode("empty")}
          onMouseEnter={(e) => {
            if (creationMode !== "empty") {
              e.currentTarget.style.borderColor = "#24c598"
            }
          }}
          onMouseLeave={(e) => {
            if (creationMode !== "empty") {
              e.currentTarget.style.borderColor = "#E5E5E5"
            }
          }}>
            <h3 style={{
              fontSize: "1.1rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Leeres Template erstellen
            </h3>
            <p style={{
              fontSize: "0.9rem",
              color: "#7A7A7A"
            }}>
              Erstellt ein neues Template mit den 5 kanonischen Blöcken (ohne Felder)
            </p>
          </div>

          {/* Option C: CSV Import */}
          <div style={{
            border: creationMode === "csv-import" ? "2px solid #24c598" : "2px solid #E5E5E5",
            borderRadius: "8px",
            padding: "1.5rem",
            cursor: "pointer",
            transition: "all 0.2s",
            backgroundColor: creationMode === "csv-import" ? "#FFF5F9" : "#FFFFFF"
          }}
          onClick={() => setCreationMode("csv-import")}
          onMouseEnter={(e) => {
            if (creationMode !== "csv-import") {
              e.currentTarget.style.borderColor = "#24c598"
            }
          }}
          onMouseLeave={(e) => {
            if (creationMode !== "csv-import") {
              e.currentTarget.style.borderColor = "#E5E5E5"
            }
          }}>
            <h3 style={{
              fontSize: "1.1rem",
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Per CSV importieren
            </h3>
            <p style={{
              fontSize: "0.9rem",
              color: "#7A7A7A",
              marginBottom: creationMode === "csv-import" ? "1rem" : "0"
            }}>
              Importieren Sie Blöcke und Felder aus einer CSV-Datei
            </p>
            {creationMode === "csv-import" && (
              <div style={{ marginTop: "1rem" }}>
                {/* CSV Template Download */}
                <div style={{ marginBottom: "1rem" }}>
                  <button
                    type="button"
                    onClick={handleDownloadCsvTemplate}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor: "#F5F5F5",
                      color: "#0A0A0A",
                      border: "1px solid #CDCDCD",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem"
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
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    CSV Template herunterladen
                  </button>
                  <p style={{
                    fontSize: "0.8rem",
                    color: "#7A7A7A",
                    marginTop: "0.5rem",
                    margin: "0.5rem 0 0 0"
                  }}>
                    Laden Sie das Template herunter, um die erforderlichen Spalten und Formatierung zu sehen.
                  </p>
                </div>

                {/* CSV File Upload (1:1 vom DPP-Import übernommen) */}
                <div>
                  <label htmlFor="csv-file" style={{
                    display: "block",
                    fontSize: "0.95rem",
                    fontWeight: "500",
                    color: "#0A0A0A",
                    marginBottom: "0.5rem"
                  }}>
                    CSV-Datei hochladen *
                  </label>
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    style={{
                      border: `2px dashed ${isDragging ? "#24c598" : "#CDCDCD"}`,
                      borderRadius: "8px",
                      padding: "3rem",
                      textAlign: "center",
                      backgroundColor: isDragging ? "#F5F5F5" : "#FFFFFF",
                      cursor: "pointer",
                      transition: "border-color 0.2s, background-color 0.2s"
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      id="csv-file"
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileInputChange}
                      disabled={csvParsing}
                      style={{ display: "none" }}
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="48"
                      height="48"
                      fill="none"
                      stroke="#7A7A7A"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      viewBox="0 0 24 24"
                      style={{ margin: "0 auto 1rem" }}
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <p style={{
                      color: "#0A0A0A",
                      fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
                      fontWeight: "600",
                      marginBottom: "0.5rem"
                    }}>
                      {csvFile ? csvFile.name : "Datei hier ablegen oder klicken zum Auswählen"}
                    </p>
                    <p style={{
                      color: "#7A7A7A",
                      fontSize: "clamp(0.9rem, 2vw, 1rem)"
                    }}>
                      Nur CSV-Dateien
                    </p>
                    {csvParsing && (
                      <p style={{
                        fontSize: "0.875rem",
                        color: "#24c598",
                        marginTop: "0.5rem",
                        margin: "0.5rem 0 0 0"
                      }}>
                        CSV wird verarbeitet...
                      </p>
                    )}
                  </div>
                </div>

                {/* CSV Errors (1:1 vom DPP-Import übernommen) */}
                {csvErrors.length > 0 && (
                  <div style={{
                    backgroundColor: "#FEE2E2",
                    border: "1px solid #FCA5A5",
                    borderRadius: "8px",
                    padding: "1rem",
                    marginTop: "1rem"
                  }}>
                    <h3 style={{
                      fontSize: "1rem",
                      fontWeight: "700",
                      color: "#991B1B",
                      marginBottom: "0.5rem"
                    }}>
                      Fehler:
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: "1.5rem", color: "#991B1B" }}>
                      {csvErrors.map((err, idx) => (
                        <li key={idx} style={{ marginBottom: "0.25rem" }}>
                          {err}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
          <Link
            href="/super-admin/templates"
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#FFFFFF",
              color: "#0A0A0A",
              border: "1px solid #CDCDCD",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "0.95rem",
              fontWeight: "600",
              display: "inline-block"
            }}
          >
            Abbrechen
          </Link>
          <button
            type="button"
            onClick={() => {
              if (creationMode === "from-existing") {
                if (!selectedTemplateId) {
                  setError("Bitte wählen Sie eine Vorlage aus")
                  return
                }
                const selectedTemplate = existingTemplates.find(t => t.id === selectedTemplateId)
                if (selectedTemplate) {
                  initializeFromTemplate(selectedTemplate)
                }
              } else if (creationMode === "empty") {
                initializeEmpty()
              } else if (creationMode === "csv-import") {
                if (!csvFile || csvErrors.length > 0) {
                  setError("Bitte laden Sie eine gültige CSV-Datei hoch")
                  return
                }
                // CSV was already parsed and blocks initialized in parseCsvFile
                // Just close dialog if no errors
                if (blocks.length > 0) {
                  setShowDialog(false)
                } else {
                  setError("CSV-Datei konnte nicht verarbeitet werden")
                }
              } else {
                setError("Bitte wählen Sie eine Option aus")
              }
            }}
            disabled={!creationMode || (creationMode === "from-existing" && !selectedTemplateId) || (creationMode === "csv-import" && (!csvFile || csvErrors.length > 0 || csvParsing))}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: creationMode && (
                creationMode === "empty" || 
                (creationMode === "from-existing" && selectedTemplateId) ||
                (creationMode === "csv-import" && csvFile && csvErrors.length === 0 && !csvParsing)
              ) ? "#24c598" : "#CDCDCD",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.95rem",
              fontWeight: "600",
              cursor: creationMode && (
                creationMode === "empty" || 
                (creationMode === "from-existing" && selectedTemplateId) ||
                (creationMode === "csv-import" && csvFile && csvErrors.length === 0 && !csvParsing)
              ) ? "pointer" : "not-allowed"
            }}
          >
            Weiter
          </button>
        </div>

        {error && (
          <div style={{
            backgroundColor: "#FFF5F9",
            border: "1px solid #24c598",
            borderRadius: "8px",
            padding: "1rem",
            marginTop: "1rem",
            color: "#24c598",
            fontSize: "0.95rem"
          }}>
            {error}
          </div>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{
          backgroundColor: "#FFF5F9",
          border: "1px solid #24c598",
          borderRadius: "8px",
          padding: "1rem",
          marginBottom: "2rem",
          color: "#24c598",
          fontSize: "0.95rem"
        }}>
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E5E5E5",
        borderRadius: "12px",
        padding: "2rem",
        marginBottom: "2rem"
      }}>
        <h2 style={{
          fontSize: "1.5rem",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "1.5rem"
        }}>
          Basis-Informationen
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <label htmlFor="name" style={{
              display: "block",
              fontSize: "0.95rem",
              fontWeight: "500",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Template-Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
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
            <label htmlFor="category" style={{
              display: "block",
              fontSize: "0.95rem",
              fontWeight: "500",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Kategorie * (Pflichteingabefeld, nicht änderbar nach Erstellung)
            </label>
            <input
              id="category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value.toUpperCase())}
              required
              disabled={loading || categoryLocked}
              placeholder="z.B. FURNITURE, TEXTILE, OTHER"
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "8px",
                fontSize: "1rem",
                boxSizing: "border-box",
                backgroundColor: categoryLocked ? "#F5F5F5" : "#FFFFFF",
                textTransform: "uppercase",
                cursor: categoryLocked ? "not-allowed" : "text"
              }}
            />
            <p style={{
              fontSize: "0.75rem",
              color: "#7A7A7A",
              marginTop: "0.25rem"
            }}>
              {categoryLocked ? "Kategorie ist nach Erstellung nicht änderbar." : "Gültige Kategorien: FURNITURE, TEXTILE, OTHER"}
            </p>
          </div>

          <div>
            <label htmlFor="industry" style={{
              display: "block",
              fontSize: "0.95rem",
              fontWeight: "500",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Branche (optional)
            </label>
            <input
              id="industry"
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              disabled={loading}
              placeholder="z.B. furniture, textile"
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
            <label htmlFor="description" style={{
              display: "block",
              fontSize: "0.95rem",
              fontWeight: "500",
              color: "#0A0A0A",
              marginBottom: "0.5rem"
            }}>
              Beschreibung (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={3}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #CDCDCD",
                borderRadius: "8px",
                fontSize: "1rem",
                boxSizing: "border-box",
                fontFamily: "inherit"
              }}
            />
          </div>
        </div>
      </div>

      {/* Blocks */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem", marginBottom: "2rem" }}>
        {blocks.map((block, blockIndex) => (
          <div
            key={block.id}
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E5E5",
              borderRadius: "12px",
              padding: "2rem"
            }}
          >
            <div className="new-template-block-header-container" style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1.5rem",
              paddingBottom: "1rem",
              borderBottom: "2px solid #24c598",
              flexWrap: "wrap"
            }}>
              <input
                type="text"
                value={block.name}
                onChange={(e) => updateBlockName(block.id, e.target.value)}
                placeholder={`Block ${blockIndex + 1} Name`}
                disabled={loading}
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  color: "#0A0A0A",
                  border: "none",
                  padding: "0.5rem 0",
                  outline: "none",
                  flex: 1,
                  minWidth: "200px",
                  backgroundColor: "transparent"
                }}
              />
              {blockIndex === 0 && (
                <span style={{
                  padding: "0.5rem",
                  fontSize: "0.75rem",
                  color: "#7A7A7A",
                  fontStyle: "italic",
                  flexShrink: 0
                }}>
                  (Fix)
                </span>
              )}
              {blocks.length > 1 && blockIndex > 0 && (
                <div className="block-actions" style={{ 
                  display: "flex", 
                  alignItems: "center",
                  gap: "0.75rem"
                }}>
                  <div className="block-order-controls" style={{ 
                    display: "flex", 
                    gap: "0.5rem",
                    flexShrink: 0
                  }}>
                    {blockIndex > 1 && (
                      <button
                        type="button"
                        onClick={() => moveBlockUp(blockIndex)}
                        disabled={loading}
                        title="Block nach oben verschieben"
                        style={{
                          padding: "0.5rem",
                          backgroundColor: "#F5F5F5",
                          color: "#0A0A0A",
                          border: "1px solid #CDCDCD",
                          borderRadius: "6px",
                          cursor: loading ? "not-allowed" : "pointer",
                          fontSize: "1rem",
                          width: "32px",
                          height: "32px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        ↑
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => moveBlockDown(blockIndex)}
                      disabled={loading || blockIndex === blocks.length - 1}
                      title="Block nach unten verschieben"
                      style={{
                        padding: "0.5rem",
                        backgroundColor: "#F5F5F5",
                        color: "#0A0A0A",
                        border: "1px solid #CDCDCD",
                        borderRadius: "6px",
                        cursor: loading ? "not-allowed" : "pointer",
                        fontSize: "1rem",
                        width: "32px",
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      ↓
                    </button>
                  </div>
                  
                  {/* ENTFERNT: Supplier Config Icon - wird jetzt pro DPP konfiguriert, nicht im Template */}
                  
                  <div className="new-template-block-delete">
                    <button
                      type="button"
                      onClick={() => deleteBlock(block.id)}
                      disabled={loading}
                      title="Block entfernen"
                      className="new-template-block-delete-button"
                      style={{
                        padding: "0.5rem",
                        backgroundColor: "transparent",
                        color: "#7A7A7A",
                        border: "1px solid #CDCDCD",
                        borderRadius: "6px",
                        cursor: loading ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "32px",
                        height: "32px",
                        opacity: loading ? 0.5 : 1,
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.currentTarget.style.backgroundColor = "#F5F5F5"
                          e.currentTarget.style.borderColor = "#7A7A7A"
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) {
                          e.currentTarget.style.backgroundColor = "transparent"
                          e.currentTarget.style.borderColor = "#CDCDCD"
                        }
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>


            {/* Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {block.fields.map((field, fieldIndex) => (
                <div
                  key={field.id}
                  draggable
                  onDragStart={(e) => handleFieldDragStart(e, block.id, field.id)}
                  onDragOver={handleFieldDragOver}
                  onDrop={(e) => handleFieldDrop(e, block.id, field.id)}
                  onDragEnd={handleFieldDragEnd}
                  style={{
                    padding: "1rem",
                    backgroundColor: draggedFieldId === field.id ? "#E5F3FF" : "#F9F9F9",
                    border: draggedFieldId === field.id ? "2px solid #24c598" : "1px solid #E5E5E5",
                    borderRadius: "8px",
                    cursor: "move",
                    opacity: draggedFieldId === field.id ? 0.5 : 1,
                    transition: "all 0.2s",
                    width: "100%",
                    boxSizing: "border-box",
                    overflow: "visible"
                  }}
                >
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "16px minmax(150px, 1fr) 140px max-content max-content 32px",
                    gap: "0.25rem 0.75rem",
                    alignItems: "center",
                    width: "100%",
                    boxSizing: "border-box",
                    minWidth: 0,
                    overflow: "visible"
                  }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "move",
                      padding: "0",
                      marginLeft: "-0.25rem"
                    }}>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ color: "#7A7A7A", flexShrink: 0 }}
                      >
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateField(block.id, field.id, { label: e.target.value })}
                      placeholder="Label"
                      disabled={loading}
                      style={{
                        padding: "0.5rem",
                        border: "1px solid #CDCDCD",
                        borderRadius: "6px",
                        fontSize: "0.95rem",
                        boxSizing: "border-box"
                      }}
                    />
                    <select
                      value={field.type}
                      onChange={(e) => updateField(block.id, field.id, { type: e.target.value })}
                      disabled={loading}
                      style={{
                        padding: "0.5rem",
                        border: "1px solid #CDCDCD",
                        borderRadius: "6px",
                        fontSize: "0.95rem",
                        backgroundColor: "#FFFFFF",
                        boxSizing: "border-box"
                      }}
                    >
                      {fieldTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <label style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      fontSize: "0.875rem",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0
                    }}>
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(block.id, field.id, { required: e.target.checked })}
                        disabled={loading}
                        style={{ flexShrink: 0, width: "16px", height: "16px" }}
                      />
                      <span style={{ whiteSpace: "nowrap" }}>Pflicht</span>
                    </label>
                    <label style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      fontSize: "0.875rem",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0
                    }}>
                      <input
                        type="checkbox"
                        checked={(field as any).isRepeatable || false}
                        onChange={(e) => updateField(block.id, field.id, { isRepeatable: e.target.checked } as any)}
                        disabled={loading}
                        style={{ flexShrink: 0, width: "16px", height: "16px" }}
                      />
                      <span style={{ whiteSpace: "nowrap" }}>Wiederholbar</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => deleteField(block.id, field.id)}
                      disabled={loading}
                      title="Feld entfernen"
                      style={{
                        padding: "0.5rem",
                        backgroundColor: "transparent",
                        color: "#7A7A7A",
                        border: "1px solid #CDCDCD",
                        borderRadius: "6px",
                        cursor: loading ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "32px",
                        height: "32px",
                        opacity: loading ? 0.5 : 1,
                        flexShrink: 0,
                        boxSizing: "border-box"
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.currentTarget.style.backgroundColor = "#F5F5F5"
                          e.currentTarget.style.borderColor = "#7A7A7A"
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) {
                          e.currentTarget.style.backgroundColor = "transparent"
                          e.currentTarget.style.borderColor = "#CDCDCD"
                        }
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                  {/* Select/Multi-select Options */}
                  {(field.type === "select" || field.type === "multi-select") && (
                    <div style={{
                      marginTop: "0.75rem",
                      padding: "0.75rem",
                      backgroundColor: "#F9F9F9",
                      border: "1px solid #E5E5E5",
                      borderRadius: "6px"
                    }}>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.5rem"
                      }}>
                        <label style={{
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          color: "#0A0A0A"
                        }}>
                          Auswahloptionen:
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFieldOptions(editingFieldOptions === field.id ? null : field.id)
                          }}
                          style={{
                            padding: "0.375rem 0.75rem",
                            backgroundColor: editingFieldOptions === field.id ? "#7A7A7A" : "#24c598",
                            color: "#FFFFFF",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            cursor: "pointer"
                          }}
                        >
                          {editingFieldOptions === field.id ? "▼ Ausblenden" : "▶ Optionen"}
                        </button>
                      </div>
                      {editingFieldOptions === field.id && (
                        <>
                          <p style={{
                            fontSize: "0.75rem",
                            color: "#7A7A7A",
                            marginBottom: "0.75rem",
                            fontStyle: "italic"
                          }}>
                            Diese Optionen werden bei DPP-Erstellung und CSV-Import validiert.
                          </p>
                          <div style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            marginBottom: "0.75rem"
                          }}>
                            <button
                              type="button"
                              onClick={() => {
                                const options = getSelectOptions(field.config)
                                updateSelectOptions(block.id, field.id, [...options, { value: "", label: "", esprReference: "" }])
                              }}
                              disabled={loading}
                              style={{
                                padding: "0.375rem 0.75rem",
                                backgroundColor: "#24c598",
                                color: "#FFFFFF",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                cursor: loading ? "not-allowed" : "pointer"
                              }}
                            >
                              + Option hinzufügen
                            </button>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {getSelectOptions(field.config).map((option, optIndex) => (
                              <div key={optIndex} style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr 1fr auto",
                                gap: "0.5rem",
                                alignItems: "center"
                              }}>
                                <input
                                  type="text"
                                  value={option.value}
                                  placeholder="Value (technisch)"
                                  onChange={(e) => {
                                    const options = getSelectOptions(field.config)
                                    options[optIndex] = { ...option, value: e.target.value }
                                    updateSelectOptions(block.id, field.id, options)
                                  }}
                                  disabled={loading}
                                  style={{
                                    padding: "0.5rem",
                                    border: "1px solid #CDCDCD",
                                    borderRadius: "6px",
                                    fontSize: "0.875rem",
                                    fontFamily: "monospace"
                                  }}
                                />
                                <input
                                  type="text"
                                  value={option.label}
                                  placeholder="Label (Anzeige)"
                                  onChange={(e) => {
                                    const options = getSelectOptions(field.config)
                                    options[optIndex] = { ...option, label: e.target.value }
                                    updateSelectOptions(block.id, field.id, options)
                                  }}
                                  disabled={loading}
                                  style={{
                                    padding: "0.5rem",
                                    border: "1px solid #CDCDCD",
                                    borderRadius: "6px",
                                    fontSize: "0.875rem"
                                  }}
                                />
                                <input
                                  type="text"
                                  value={option.esprReference || ""}
                                  placeholder="ESPR-Referenz (optional)"
                                  onChange={(e) => {
                                    const options = getSelectOptions(field.config)
                                    options[optIndex] = { ...option, esprReference: e.target.value || undefined }
                                    updateSelectOptions(block.id, field.id, options)
                                  }}
                                  disabled={loading}
                                  style={{
                                    padding: "0.5rem",
                                    border: "1px solid #CDCDCD",
                                    borderRadius: "6px",
                                    fontSize: "0.875rem"
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const options = getSelectOptions(field.config)
                                    options.splice(optIndex, 1)
                                    updateSelectOptions(block.id, field.id, options)
                                  }}
                                  disabled={loading}
                                  style={{
                                    padding: "0.5rem",
                                    backgroundColor: "transparent",
                                    color: "#DC2626",
                                    border: "1px solid #DC2626",
                                    borderRadius: "6px",
                                    fontSize: "0.875rem",
                                    cursor: loading ? "not-allowed" : "pointer"
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                            {getSelectOptions(field.config).length === 0 && (
                              <p style={{
                                fontSize: "0.75rem",
                                color: "#7A7A7A",
                                fontStyle: "italic",
                                padding: "0.5rem"
                              }}>
                                Noch keine Optionen definiert. Klicken Sie auf "+ Option hinzufügen".
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  {/* Country field info */}
                  {field.type === "country" && (
                    <div style={{
                      marginTop: "0.75rem",
                      padding: "0.75rem",
                      backgroundColor: "#F0F9FF",
                      border: "1px solid #B3E5FC",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      color: "#0277BD"
                    }}>
                      ℹ️ Eine vollständige Liste aller Länder (ISO-3166-1 Alpha-2, ~249 Länder) steht den Nutzern bei der DPP-Erstellung zur Auswahl. Länder werden als ISO-Codes (z. B. DE, FR) gespeichert. Das Land wird basierend auf der IP-Adresse des Nutzers an erster Stelle vorgeschlagen.
                    </div>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() => addField(block.id)}
                disabled={loading}
                style={{
                  padding: "0.75rem 1rem",
                  backgroundColor: "#F9F9F9",
                  color: "#0A0A0A",
                  border: "1px dashed #CDCDCD",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  fontWeight: "500",
                  cursor: loading ? "not-allowed" : "pointer",
                  textAlign: "left"
                }}
              >
                + Feld hinzufügen
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addBlock}
          disabled={loading}
          style={{
            padding: "1rem",
            backgroundColor: "#F9F9F9",
            color: "#0A0A0A",
            border: "2px dashed #CDCDCD",
            borderRadius: "12px",
            fontSize: "1rem",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          + Block hinzufügen
        </button>
      </div>

      {/* Submit */}
      <div style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: "clamp(0.75rem, 2vw, 1rem)",
        flexWrap: "wrap",
        marginTop: "clamp(1.5rem, 4vw, 2rem)",
        paddingTop: "clamp(1rem, 3vw, 1.5rem)"
      }}
      className="template-submit-container"
      >
        <Link
          href="/super-admin/templates"
          style={{
            padding: "clamp(0.625rem, 1.5vw, 0.75rem) clamp(1rem, 2.5vw, 1.5rem)",
            backgroundColor: "#FFFFFF",
            color: "#0A0A0A",
            border: "1px solid #CDCDCD",
            borderRadius: "8px",
            textDecoration: "none",
            fontSize: "clamp(0.875rem, 2vw, 0.95rem)",
            fontWeight: "600",
            display: "inline-block",
            whiteSpace: "nowrap",
            flexShrink: 0
          }}
        >
          Abbrechen
        </Link>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "clamp(0.625rem, 1.5vw, 0.75rem) clamp(1rem, 2.5vw, 1.5rem)",
            backgroundColor: loading ? "#CDCDCD" : "#24c598",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "8px",
            fontSize: "clamp(0.875rem, 2vw, 0.95rem)",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
            transition: "background-color 0.2s"
          }}
        >
          {loading ? "Wird erstellt..." : "Template erstellen"}
        </button>
        <style jsx>{`
          @media (max-width: 640px) {
            .template-submit-container {
              flex-direction: column-reverse !important;
              width: 100% !important;
            }
            .template-submit-container > * {
              width: 100% !important;
              text-align: center !important;
            }
          }
          @media (max-width: 768px) {
            .new-template-block-header-container {
              flex-direction: row !important;
              align-items: center !important;
            }
            .new-template-block-delete {
              width: auto !important;
            }
            .new-template-block-delete-button {
              width: 32px !important;
              height: 32px !important;
            }
          }
          @media (min-width: 769px) {
            .new-template-block-header-container {
              flex-direction: row !important;
              align-items: center !important;
            }
            .new-template-block-delete {
              width: auto !important;
            }
            .new-template-block-delete-button {
              width: 32px !important;
              height: 32px !important;
              padding: 0.5rem !important;
            }
          }
        `}</style>
      </div>
    </form>
  )
}

