# DPP Editorial Frontend - UX System Design & Architektur

## Executive Summary

Dieses Dokument beschreibt die Redesign-Architektur für den editorial DPP-Frontend, der eine brand-driven Storytelling-Erfahrung mit hochflexiblen Content-Blöcken kombiniert, ohne in Endless Scrolling zu verfallen. Die Architektur ist explizit darauf ausgelegt, vorwärtskompatibel mit geplanten CMS-Erweiterungen zu sein, die sich aktuell im Feature Branch befinden.

---

## 1. Drei-Schichten-Architektur

### 1.1 Editorial Spine (Immer sichtbar, narrativ)

**Zweck:** Die erzählerische Klammer, die dem DPP seine Markenidentität verleiht.

**Eigenschaften:**
- **Immer sichtbar:** Befindet sich oberhalb des Fold, nie einklappbar
- **Narrativ:** Erzählt eine Geschichte, keine reine Datendarbietung
- **Visuell dominant:** Hero-Bilder, markengetreue Typografie, emotionale Ansprache
- **Begrenzte Höhe:** Maximal 1.5-2 Viewport-Höhen (mit optimiertem Layout)

**Zulässige Block-Typen:**
- `hero_image` - Vollbild Hero mit optionaler Overlay-Text
- `headline` - Große, markengetreue Überschrift
- `story_text` - Narrativer Textblock (max. 2-3 Absätze)
- `brand_quote` - Zitat oder Brand-Statement
- `key_visual` - Ein einprägsames visuelles Element

**Verboten:**
- Technische Datenfelder
- Wiederholbare Felder-Gruppen
- Tabellen oder Listen mit mehr als 5 Einträgen
- Dichte Informations-Grids

**CMS-Kompatibilität:**
- Nutzt `block.metadata.editorialLayer = "spine"` Flag (zukünftig)
- Respektiert `block.metadata.summary` für kompakte Darstellung
- Ignoriert `block.supplierAttribution` im Spine (nur in Data Sections)

---

### 1.2 Modular Data Sections (Eingeklappt per Default, Progressive Disclosure)

**Zweck:** Strukturierte Datenpräsentation, die bei Bedarf erweitert werden kann.

**Eigenschaften:**
- **Collapsed by Default:** Alle Sections starten eingeklappt
- **Progressive Disclosure:** Zusammenfassung vor Detail-Ansicht
- **Kategorisiert:** Gruppiert nach semantischen Themen (Materialien, Nutzung, Rechtliches, etc.)
- **Scroll-Optimiert:** Maximal 3-5 Sections gleichzeitig offen

**Zulässige Block-Typen:**
- `data_group` - Gruppierte Felder mit Überschrift
- `summary_card` - Kompakte Zusammenfassung wichtiger Metriken
- `expandable_table` - Tabelle mit "Zeige mehr" Funktionalität
- `media_gallery` - Bildergalerie mit Lazy Loading
- `repeatable_group` - Wiederholbare Einträge (z.B. Materialien) mit Pagination
- `key_value_list` - Strukturierte Key-Value-Paare
- `document_list` - Liste von Dokumenten/PDFs

**Verboten:**
- Narrative Textblöcke ohne Daten
- Reine Storytelling-Elemente (gehören in Spine)
- Unstrukturierte Textwüsten
- Mehr als 20 Felder pro Section ohne Gruppierung

**CMS-Kompatibilität:**
- Nutzt `block.metadata.editorialLayer = "data"` Flag
- Respektiert `block.metadata.collapsedByDefault = true`
- Nutzt `block.metadata.summary` für Preview-Text
- Unterstützt `block.metadata.density = "compact" | "normal" | "detailed"`
- Berücksichtigt `block.supplierAttribution` für Supplier-Quellenangaben

---

### 1.3 Deep Data Views (Drawer, Overlays, Separate Technical Views)

**Zweck:** Technische Detail-Ansichten für Experten und Compliance-Anforderungen.

**Eigenschaften:**
- **Nicht im Hauptfluss:** Öffnen sich als Modal, Drawer oder separate Route
- **Vollständig:** Zeigen alle verfügbaren Daten ohne Zusammenfassung
- **Technisch:** Tabellen, strukturierte Listen, Rohdaten-Export
- **Optional:** Nur über explizite Aktionen erreichbar

**Zulässige Block-Typen:**
- `technical_table` - Vollständige Datentabellen
- `compliance_view` - ESPR-konforme Datenpräsentation
- `raw_data_export` - JSON/CSV Export-Optionen
- `version_history` - Versionsverlauf mit Diff-Ansicht
- `supplier_details` - Detaillierte Supplier-Informationen
- `regulatory_mapping` - Mapping zu regulatorischen Anforderungen

**CMS-Kompatibilität:**
- Nutzt `block.metadata.editorialLayer = "deep"` Flag
- Respektiert `block.metadata.requiresAuthentication`
- Unterstützt `block.metadata.exportFormats = ["json", "csv", "pdf"]`
- Nutzt `block.metadata.regulatoryMapping` für Compliance-Views

---

## 2. CMS-Forward-Compatibility durch Abstrakte Contracts

### 2.1 Content Contract Abstraktion

**Prinzip:** Frontend-Komponenten arbeiten mit abstrakten Content-Contracts, nicht mit konkreten CMS-Feld-Strukturen.

#### Aktueller Contract (Main Branch - Template-based)

```typescript
interface CurrentContentBlock {
  // Von TemplateBlock
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
  
  // Von DppContent (falls vorhanden)
  values?: Record<string, any>
  supplierConfig?: {
    enabled: boolean
    mode: "input" | "declaration"
  }
}
```

#### Zukünftiger Contract (Feature Branch - BlockType-based)

```typescript
interface FutureContentBlock {
  // Von BlockType
  id: string
  type: string  // BlockType.key
  order: number
  config: Record<string, any>  // Validated against BlockType.configSchema
  styling?: Record<string, any>  // Block-level styling
  data: Record<string, any>
  
  // Neue Metadaten (aus Feature Branch)
  metadata?: {
    editorialLayer?: "spine" | "data" | "deep"
    summary?: string
    collapsedByDefault?: boolean
    density?: "compact" | "normal" | "detailed"
    supplierAttribution?: {
      enabled: boolean
      sourceId: string
      sourceName: string
    }
    visibility?: {
      roles?: string[]
      subscriptionTiers?: string[]
    }
  }
}
```

#### Abstrakter Unified Contract (Für Frontend-Kompatibilität)

```typescript
interface UnifiedContentBlock {
  // Core Identity
  id: string
  blockKey: string  // TemplateBlock.id ODER BlockType.key
  displayName: string  // TemplateBlock.name ODER BlockType.name
  order: number
  
  // Content Data (unified)
  content: {
    // Strukturierte Felder (aus Template-Fields ODER BlockType.data)
    fields: Record<string, FieldValue>
    // Wiederholbare Instanzen (aus RepeatableFieldGroup ODER BlockType.data[instances])
    instances?: Array<Record<string, FieldValue>>
  }
  
  // Presentation Metadata (abstrahiert)
  presentation: {
    layer: "spine" | "data" | "deep"  // Aus TemplateBlock.order=0 ODER metadata.editorialLayer
    defaultCollapsed: boolean  // Berechnet aus layer="data" ODER metadata.collapsedByDefault
    summary?: string  // Aus metadata.summary ODER erste N Zeichen von content
    density: "compact" | "normal" | "detailed"  // Aus metadata.density ODER calculated
    allowedInEditorialSpine: boolean  // Aus BlockType.category ODER TemplateBlock.order=0
  }
  
  // Supplier & Source Attribution (vorbereitet für Feature Branch)
  attribution?: {
    enabled: boolean
    mode?: "input" | "declaration"
    sourceId?: string
    sourceName?: string
  }
  
  // Feature Flags (für zukünftige Features)
  features?: {
    supportsStyling?: boolean
    requiresPublishing?: boolean
    exportFormats?: string[]
    regulatoryMapping?: Record<string, string>
  }
}
```

---

### 2.2 Content Adapter Pattern

**Implementierung:** Adapter-Schicht transformiert aktuelle und zukünftige CMS-Strukturen in den Unified Contract.

```typescript
// Adapter für aktuelle Template-basierte Struktur
function adaptTemplateBlockToUnified(
  templateBlock: TemplateBlock,
  dppContent: DppContent | null,
  supplierConfig: DppBlockSupplierConfig | null
): UnifiedContentBlock {
  // Berechne editorial layer basierend auf order
  const layer: "spine" | "data" | "deep" = 
    templateBlock.order === 0 ? "spine" : "data"
  
  // Extrahiere Content-Werte
  const fields: Record<string, FieldValue> = {}
  templateBlock.fields.forEach(field => {
    // Versuche Wert aus DppContent zu holen (falls vorhanden)
    // Fallback zu DPP-Feldern basierend auf field.key
    fields[field.key] = extractFieldValue(field, dppContent)
  })
  
  return {
    id: templateBlock.id,
    blockKey: templateBlock.id,
    displayName: templateBlock.name,
    order: templateBlock.order,
    content: { fields },
    presentation: {
      layer,
      defaultCollapsed: layer !== "spine",
      density: "normal",
      allowedInEditorialSpine: layer === "spine"
    },
    attribution: supplierConfig ? {
      enabled: supplierConfig.enabled,
      mode: supplierConfig.mode || "input"
    } : undefined
  }
}

// Adapter für zukünftige BlockType-basierte Struktur
function adaptBlockTypeToUnified(
  block: Block,  // Aus DppContent.blocks[]
  blockType: BlockType
): UnifiedContentBlock {
  return {
    id: block.id,
    blockKey: block.type,  // BlockType.key
    displayName: blockType.name,
    order: block.order,
    content: {
      fields: block.data,
      instances: block.data.instances  // Falls wiederholbar
    },
    presentation: {
      layer: block.metadata?.editorialLayer || "data",
      defaultCollapsed: block.metadata?.collapsedByDefault ?? true,
      summary: block.metadata?.summary,
      density: block.metadata?.density || "normal",
      allowedInEditorialSpine: block.metadata?.editorialLayer === "spine"
    },
    attribution: block.metadata?.supplierAttribution ? {
      enabled: true,
      sourceId: block.metadata.supplierAttribution.sourceId,
      sourceName: block.metadata.supplierAttribution.sourceName
    } : undefined,
    features: {
      supportsStyling: blockType.supportsStyling,
      requiresPublishing: blockType.requiresPublishing,
      exportFormats: block.metadata?.exportFormats,
      regulatoryMapping: block.metadata?.regulatoryMapping
    }
  }
}
```

---

### 2.3 Komponenten-Isolation

**Prinzip:** Präsentations-Komponenten kennen nur den Unified Contract, nie die CMS-Implementation.

```typescript
// ✅ GUT: Komponente arbeitet mit Unified Contract
function EditorialSpineSection({ blocks }: { blocks: UnifiedContentBlock[] }) {
  // Filter nur Spine-Blöcke
  const spineBlocks = blocks.filter(b => b.presentation.layer === "spine")
  
  // Rendere nur erlaubte Block-Typen
  return (
    <SpineContainer>
      {spineBlocks.map(block => {
        // Entscheide Rendering basierend auf blockKey und content
        if (isAllowedInSpine(block)) {
          return <SpineBlockRenderer key={block.id} block={block} />
        }
        // Log Warning, ignoriere Block
        console.warn(`Block ${block.blockKey} not allowed in Editorial Spine`)
        return null
      })}
    </SpineContainer>
  )
}

// ❌ SCHLECHT: Direkte CMS-Abhängigkeit
function EditorialSpineSection({ templateBlocks }: { templateBlocks: TemplateBlock[] }) {
  // ❌ Enge Kopplung an TemplateBlock-Struktur
  // ❌ Wird bei Feature Branch Merge brechen
}
```

---

## 3. UX-Patterns zur Vermeidung von Endless Scrolling

### 3.1 Section Collapsing (Progressive Disclosure)

**Implementierung:**
- Alle Data Sections starten eingeklappt
- Section-Header zeigt Zusammenfassung (Summary)
- Nutzer klickt, um zu expandieren
- Nur 3-5 Sections gleichzeitig offen (Auto-Collapse älterer)

**Zusammenfassungs-Strategie:**
```typescript
interface SectionSummary {
  // Aus block.presentation.summary ODER generiert
  preview: string  // Max. 120 Zeichen
  metrics?: Array<{
    label: string
    value: string
    icon?: string
  }>
  completion?: number  // 0-100, zeigt Vollständigkeit
  hasSupplierData?: boolean  // Indikator für Supplier-Daten
}
```

**UX-Regeln:**
- Section-Header immer sichtbar (auch eingeklappt)
- Zusammenfassung zeigt "Was ist drin?" nicht "Alles"
- Expandierte Sections haben klaren Close-Button
- Scroll-Position bleibt stabil beim Expand/Collapse

---

### 3.2 Summary Before Details

**Pattern:** Jede Data Section zeigt zuerst eine kompakte Zusammenfassung, dann Details.

**Implementierung:**
```typescript
function DataSection({ block }: { block: UnifiedContentBlock }) {
  const [expanded, setExpanded] = useState(block.presentation.defaultCollapsed === false)
  const summary = generateSectionSummary(block)
  
  return (
    <SectionContainer>
      <SectionHeader 
        onClick={() => setExpanded(!expanded)}
        summary={summary}
        expanded={expanded}
      />
      {expanded && (
        <SectionDetails block={block} />
      )}
    </SectionContainer>
  )
}
```

**Summary-Generierung:**
- Nutzt `block.presentation.summary` falls vorhanden
- Sonst: Extrahiert erste 3-5 wichtige Felder
- Zeigt Metriken statt Text (z.B. "5 Materialien, 3 Dokumente")
- Highlight: Neue oder Supplier-beigesteuerte Daten

---

### 3.3 Technical vs Editorial View Toggle

**Pattern:** Nutzer kann zwischen Editorial (brand-driven) und Technical (data-driven) View wechseln.

**Implementierung:**
```typescript
type ViewMode = "editorial" | "technical"

function DppViewToggle({ mode, onModeChange }: { 
  mode: ViewMode
  onModeChange: (mode: ViewMode) => void 
}) {
  return (
    <ToggleGroup>
      <ToggleButton 
        active={mode === "editorial"}
        onClick={() => onModeChange("editorial")}
      >
        Story
      </ToggleButton>
      <ToggleButton 
        active={mode === "technical"}
        onClick={() => onModeChange("technical")}
      >
        Daten
      </ToggleButton>
    </ToggleGroup>
  )
}
```

**View-Unterschiede:**

**Editorial Mode:**
- Zeigt Editorial Spine + eingeklappte Data Sections
- Fokus auf Storytelling
- Visuelle Hierarchie, Markenidentität
- Zusammenfassungen bevorzugt

**Technical Mode:**
- Alle Sections expanded
- Tabellen statt Cards
- Keine Marken-Elemente
- Export-Optionen sichtbar
- Deep Data Views direkt verlinkt

---

### 3.4 Sticky Section Navigation (Optional)

**Pattern:** Für sehr lange DPPs: Sticky Navigation zu Sections.

**Implementierung:**
```typescript
function StickySectionNav({ sections }: { sections: UnifiedContentBlock[] }) {
  const [activeSection, setActiveSection] = useState<string>()
  
  // Scroll-Listener für Active Section Detection
  useEffect(() => {
    const observer = new IntersectionObserver(/* ... */)
    // ...
  }, [])
  
  return (
    <StickyNav>
      {sections.map(section => (
        <NavItem
          key={section.id}
          active={activeSection === section.id}
          onClick={() => scrollToSection(section.id)}
        >
          {section.displayName}
        </NavItem>
      ))}
    </StickyNav>
  )
}
```

**UX-Regeln:**
- Nur anzeigen wenn > 5 Sections
- Collapsible (ausklappbar)
- Mobile: Bottom Sheet statt Sidebar
- Keyboard Navigation unterstützt

---

### 3.5 Content Density Control

**Pattern:** Nutzer kann Dichte der Darstellung anpassen (Compact / Normal / Detailed).

**Implementierung:**
```typescript
type DensityLevel = "compact" | "normal" | "detailed"

function DensityControl({ density, onChange }: {
  density: DensityLevel
  onChange: (density: DensityLevel) => void
}) {
  return (
    <DensitySelector>
      <Option value="compact" active={density === "compact"}>
        Kompakt
      </Option>
      <Option value="normal" active={density === "normal"}>
        Normal
      </Option>
      <Option value="detailed" active={density === "detailed"}>
        Detailliert
      </Option>
    </DensitySelector>
  )
}
```

**Density-Auswirkungen:**
- **Compact:** Nur Zusammenfassungen, minimale Whitespace, kleinere Schrift
- **Normal:** Standard-Darstellung (Default)
- **Detailed:** Alle Felder, erweiterte Metadaten, größere Schrift

**CMS-Integration:**
- Respektiert `block.presentation.density`
- Überschreibt mit User-Preference falls vorhanden
- Speichert Preference in LocalStorage

---

## 4. Block-Typ-Regeln und Governance

### 4.1 Editorial Spine - Erlaubte Block-Typen

**Whitelist-Ansatz:** Nur explizit erlaubte Typen dürfen im Spine erscheinen.

**Erlaubt:**
- `hero_image` - Hero-Bild mit optionalem Overlay
- `headline` - Große Marken-Überschrift (H1-H2)
- `story_text` - Narrativer Text (max. 300 Wörter)
- `brand_quote` - Zitat oder Statement
- `key_visual` - Einprägsames visuelles Element
- `media_gallery` - Bildergalerie (max. 5 Bilder)

**Verboten:**
- Technische Datenfelder (z.B. `sku`, `gtin`)
- Tabellen oder Listen
- Wiederholbare Gruppen
- Formulare oder Eingabefelder
- Dichte Informations-Grids
- Compliance-Dokumente

**Validierung:**
```typescript
const ALLOWED_SPINE_BLOCK_TYPES = [
  "hero_image",
  "headline",
  "story_text",
  "brand_quote",
  "key_visual",
  "media_gallery"
]

function isAllowedInSpine(block: UnifiedContentBlock): boolean {
  // 1. Check blockKey (TemplateBlock.id basierend auf Template-Struktur)
  if (block.presentation.allowedInEditorialSpine === false) {
    return false
  }
  
  // 2. Check Block-Type (für Feature Branch)
  if (block.blockKey && !ALLOWED_SPINE_BLOCK_TYPES.includes(block.blockKey)) {
    return false
  }
  
  // 3. Check Content-Type (Fallback für Template-Fields)
  const hasTechnicalFields = Object.keys(block.content.fields).some(key =>
    TECHNICAL_FIELD_KEYS.includes(key)
  )
  if (hasTechnicalFields) {
    return false
  }
  
  return true
}
```

---

### 4.2 Data Sections - Erlaubte Block-Typen

**Whitelist-Ansatz:** Flexible aber strukturierte Datendarstellung.

**Erlaubt:**
- `data_group` - Gruppierte Felder mit Kategorisierung
- `summary_card` - Kompakte Metriken-Karten
- `expandable_table` - Tabellen mit "Zeige mehr"
- `media_gallery` - Bildergalerien (beliebig viele)
- `repeatable_group` - Wiederholbare Einträge (mit Pagination)
- `key_value_list` - Strukturierte Listen
- `document_list` - Dokumenten-Listen
- `timeline` - Zeitliche Abläufe (z.B. Versionshistorie)

**Mit Einschränkungen:**
- `text` - Nur wenn mit Daten kombiniert (nicht pure Story)
- `list` - Max. 20 Einträge ohne Pagination

**Verboten:**
- Pure Storytelling-Elemente (gehören in Spine)
- Unstrukturierte Textwüsten
- Mehr als 20 Felder ohne Gruppierung

---

### 4.3 Deep Data Views - Erlaubte Block-Typen

**Whitelist-Ansatz:** Technische und Compliance-orientierte Ansichten.

**Erlaubt:**
- `technical_table` - Vollständige Datentabellen
- `compliance_view` - ESPR-konforme Präsentation
- `raw_data_export` - Export-Optionen (JSON/CSV/PDF)
- `version_history` - Versionsverlauf mit Diff
- `supplier_details` - Detaillierte Supplier-Info
- `regulatory_mapping` - Mapping zu Regulierungen

**Besonderheiten:**
- Erfordern oft Authentication
- Können separate Routes sein
- Können als Modal/Drawer geöffnet werden

---

### 4.4 Block-Typ-Validierung im Template

**Implementierung:** Template-Editor validiert Block-Platzierung zur Laufzeit.

```typescript
function validateBlockPlacement(
  block: UnifiedContentBlock,
  targetLayer: "spine" | "data" | "deep"
): ValidationResult {
  const errors: string[] = []
  
  // Check Whitelist
  if (targetLayer === "spine" && !isAllowedInSpine(block)) {
    errors.push(
      `Block "${block.displayName}" ist nicht für Editorial Spine erlaubt. ` +
      `Erlaubt sind nur: ${ALLOWED_SPINE_BLOCK_TYPES.join(", ")}`
    )
  }
  
  // Check Content-Struktur
  if (targetLayer === "spine") {
    const fieldCount = Object.keys(block.content.fields).length
    if (fieldCount > 10) {
      errors.push(
        `Editorial Spine Blocks sollten maximal 10 Felder haben. ` +
        `Dieser Block hat ${fieldCount} Felder.`
      )
    }
  }
  
  // Check Density
  if (targetLayer === "spine" && block.presentation.density === "detailed") {
    errors.push(
      `Editorial Spine Blocks sollten nicht "detailed" density haben.`
    )
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
```

---

## 5. Template-Governance und Konsistenz

### 5.1 Visuelle Hierarchie durch Template

**Prinzip:** Template definiert visuelle Hierarchie, nicht Frontend-Code.

**Template-Metadaten (Zukünftig):**
```typescript
interface TemplateMetadata {
  // Editorial Spine Konfiguration
  spine: {
    maxBlocks: number  // Default: 5
    allowedBlockTypes: string[]
    defaultDensity: "compact" | "normal"
  }
  
  // Data Sections Konfiguration
  dataSections: {
    defaultCollapsed: boolean  // Default: true
    maxExpandedSections: number  // Default: 3
    summaryStrategy: "auto" | "manual" | "firstFields"
  }
  
  // Deep Data Views Konfiguration
  deepViews: {
    enabled: boolean
    requireAuthentication: boolean
    exportFormats: string[]
  }
}
```

**Aktuelle Implementation (Template-based):**
- Block `order === 0` → Editorial Spine
- Block `order > 0` → Data Section
- `order` bestimmt visuelle Reihenfolge

---

### 5.2 Content Density Control durch Template

**Prinzip:** Template kann pro Block/Section Density-Level vorschreiben.

**Implementation:**
```typescript
// Template definiert Density-Preference
interface TemplateBlockMetadata {
  defaultDensity?: "compact" | "normal" | "detailed"
  allowedDensities?: ("compact" | "normal" | "detailed")[]
  minDensity?: "compact" | "normal" | "detailed"  // Minimum für Lesbarkeit
}

// Frontend respektiert Template-Preference
function getBlockDensity(
  block: UnifiedContentBlock,
  userPreference?: DensityLevel
): DensityLevel {
  // 1. User-Preference hat Priorität (falls erlaubt)
  if (userPreference && block.presentation.allowedDensities?.includes(userPreference)) {
    return userPreference
  }
  
  // 2. Template-Default
  if (block.presentation.density) {
    return block.presentation.density
  }
  
  // 3. Layer-basierter Fallback
  if (block.presentation.layer === "spine") {
    return "normal"
  }
  if (block.presentation.layer === "data") {
    return "compact"  // Data Sections starten kompakt
  }
  
  return "normal"
}
```

---

### 5.3 Konsistenz über Tausende DPPs

**Herausforderung:** Tausende DPPs müssen visuell konsistent aussehen, auch wenn Templates sich entwickeln.

**Strategien:**

#### 5.3.1 Template-Versionierung
- Templates sind versioniert
- DPPs referenzieren spezifische Template-Version
- Alte DPPs bleiben bei alter Template-Version
- Neue DPPs nutzen aktuelle Template-Version

#### 5.3.2 Design Token System
- Zentrale Design Tokens (wie bereits in Editorial-Architektur)
- Template kann Tokens überschreiben (per-Organization)
- Frontend nutzt Tokens, nicht Hard-Coded-Werte

```typescript
// Design Tokens (aus Editorial-Architektur erweitert)
interface DesignTokens {
  colors: {
    brandPrimary: string
    textPrimary: string
    // ...
  }
  typography: {
    spineHeadline: { fontSize: string, fontWeight: number }
    dataSectionTitle: { fontSize: string, fontWeight: number }
    // ...
  }
  spacing: {
    spineSectionGap: string
    dataSectionGap: string
    // ...
  }
  layout: {
    spineMaxHeight: string
    dataSectionDefaultCollapsed: boolean
    // ...
  }
}
```

#### 5.3.3 Graceful Degradation
- Fehlende Metadaten werden intelligent gefüllt
- Alte Templates funktionieren mit neuem Frontend
- Fallback-Strategien für alle optionalen Features

```typescript
function normalizeBlockForRendering(block: UnifiedContentBlock): NormalizedBlock {
  return {
    ...block,
    presentation: {
      layer: block.presentation.layer || inferLayerFromOrder(block.order),
      defaultCollapsed: block.presentation.defaultCollapsed ?? 
        (block.presentation.layer !== "spine"),
      summary: block.presentation.summary || 
        generateSummaryFromContent(block.content),
      density: block.presentation.density || "normal",
      allowedInEditorialSpine: block.presentation.allowedInEditorialSpine ?? 
        (block.order === 0)
    }
  }
}
```

---

### 5.4 Graceful Handling von Inkompletten/Evolvierenden CMS-Daten

**Problem:** CMS-Daten können unvollständig sein oder sich über Zeit entwickeln.

**Strategien:**

#### 5.4.1 Schema-Evolution-Support
```typescript
// Frontend akzeptiert sowohl alte als auch neue Schemas
function parseBlockData(data: unknown): UnifiedContentBlock {
  // Versuche neue Struktur (Feature Branch)
  if (isBlockTypeStructure(data)) {
    return adaptBlockTypeToUnified(data, blockType)
  }
  
  // Versuche alte Struktur (Main Branch)
  if (isTemplateBlockStructure(data)) {
    return adaptTemplateBlockToUnified(data, template, dppContent)
  }
  
  // Fallback: Generische Struktur
  return createFallbackBlock(data)
}
```

#### 5.4.2 Fehlende Metadaten-Interpolation
```typescript
function enrichBlockWithDefaults(block: Partial<UnifiedContentBlock>): UnifiedContentBlock {
  return {
    id: block.id || generateId(),
    blockKey: block.blockKey || "unknown",
    displayName: block.displayName || "Unbenannter Block",
    order: block.order ?? 999,
    content: block.content || { fields: {} },
    presentation: {
      layer: block.presentation?.layer || inferLayer(block.order),
      defaultCollapsed: block.presentation?.defaultCollapsed ?? true,
      summary: block.presentation?.summary || generateSummary(block.content),
      density: block.presentation?.density || "normal",
      allowedInEditorialSpine: block.presentation?.allowedInEditorialSpine ?? false
    },
    attribution: block.attribution,
    features: block.features
  }
}
```

#### 5.4.3 Content-Validation mit Warnungen
```typescript
function validateBlockContent(block: UnifiedContentBlock): ValidationResult {
  const warnings: string[] = []
  
  // Check für fehlende Pflichtfelder
  if (block.presentation.layer === "spine" && !block.presentation.summary) {
    warnings.push(
      `Spine-Block "${block.displayName}" hat keine Zusammenfassung. ` +
      `Wird automatisch generiert.`
    )
  }
  
  // Check für ungewöhnliche Content-Mengen
  const fieldCount = Object.keys(block.content.fields).length
  if (block.presentation.layer === "spine" && fieldCount > 15) {
    warnings.push(
      `Spine-Block "${block.displayName}" hat ${fieldCount} Felder. ` +
      `Empfohlen: Max. 10 Felder für Editorial Spine.`
    )
  }
  
  return {
    valid: true,  // Nicht blockierend, nur Warnungen
    warnings
  }
}
```

---

## 6. Komponenten-Architektur (System Design, nicht Code)

### 6.1 Komponenten-Hierarchie

```
DppEditorialPage (Root)
├── EditorialSpineSection
│   ├── SpineBlockRenderer (polymorph)
│   │   ├── HeroImageBlock
│   │   ├── HeadlineBlock
│   │   ├── StoryTextBlock
│   │   ├── BrandQuoteBlock
│   │   └── KeyVisualBlock
│   └── SpineLayout (full-bleed, contained, split)
│
├── DataSectionsContainer
│   ├── DataSection (collapsible)
│   │   ├── SectionHeader (mit Summary)
│   │   ├── SectionDetails (expandable)
│   │   │   └── DataBlockRenderer (polymorph)
│   │   │       ├── DataGroupBlock
│   │   │       ├── SummaryCardBlock
│   │   │       ├── ExpandableTableBlock
│   │   │       ├── MediaGalleryBlock
│   │   │       ├── RepeatableGroupBlock (mit Pagination)
│   │   │       ├── KeyValueListBlock
│   │   │       └── DocumentListBlock
│   │   └── SectionFooter (optional: "Zeige mehr" → Deep View)
│   └── SectionCollapseManager (max. 3-5 expanded)
│
├── DeepDataViewsContainer (optional, conditional)
│   ├── TechnicalViewDrawer
│   ├── ComplianceViewModal
│   ├── ExportView
│   └── VersionHistoryView
│
├── ViewModeToggle (Editorial / Technical)
├── DensityControl (Compact / Normal / Detailed)
└── StickySectionNav (optional, wenn > 5 Sections)
```

---

### 6.2 State Management

**Prinzip:** Minimaler State, maximale Berechnung aus Props.

**State:**
- `expandedSections: Set<string>` - Welche Sections sind expanded
- `viewMode: "editorial" | "technical"` - Aktueller View-Mode
- `density: "compact" | "normal" | "detailed"` - User-Density-Preference
- `activeDeepView: string | null` - Welche Deep View ist geöffnet

**Berechnet:**
- `spineBlocks` - Filter aus `blocks` basierend auf `presentation.layer === "spine"`
- `dataBlocks` - Filter aus `blocks` basierend auf `presentation.layer === "data"`
- `sectionSummaries` - Generiert aus `block.content` und `block.presentation.summary`
- `allowedBlockTypes` - Aus Template-Metadaten oder Defaults

---

### 6.3 Content Adapter Integration

**Location:** Zwischen CMS-API und Komponenten.

```
API Layer
  ↓
Content Adapter (adaptTemplateBlockToUnified / adaptBlockTypeToUnified)
  ↓
UnifiedContentBlock[]
  ↓
Komponenten (EditorialSpineSection, DataSectionsContainer, etc.)
```

**Verantwortlichkeiten:**
- Transformation CMS → Unified Contract
- Enrichment mit Defaults
- Validation
- Fehlerbehandlung

---

## 7. Frontend-zu-CMS Interface Assumptions (Contracts, nicht Schemas)

### 7.1 Content Fetching Contract

**Annahme:** Frontend ruft Content über abstrakte API auf, nicht direkt CMS.

```typescript
// API Contract (unabhängig von CMS-Implementation)
interface DppContentApi {
  // Fetch DPP Content
  getDppContent(dppId: string, options?: {
    includeMetadata?: boolean
    layer?: "spine" | "data" | "deep" | "all"
  }): Promise<UnifiedContentBlock[]>
  
  // Fetch Template Metadata
  getTemplateMetadata(templateId: string): Promise<TemplateMetadata>
  
  // Fetch Block-Type Definitions (für Feature Branch)
  getBlockTypes(blockKeys?: string[]): Promise<BlockTypeDefinition[]>
}
```

**Implementation:**
- Main Branch: API transformiert TemplateBlock → UnifiedContentBlock
- Feature Branch: API transformiert BlockType → UnifiedContentBlock
- Frontend sieht immer denselben Contract

---

### 7.2 Content Update Contract

**Annahme:** Frontend sendet Updates über abstrakte API.

```typescript
// API Contract für Content-Updates
interface DppContentUpdateApi {
  updateBlockContent(
    dppId: string,
    blockId: string,
    updates: Partial<UnifiedContentBlock['content']>
  ): Promise<UnifiedContentBlock>
  
  updateBlockPresentation(
    dppId: string,
    blockId: string,
    presentation: Partial<UnifiedContentBlock['presentation']>
  ): Promise<UnifiedContentBlock>
}
```

**Implementation:**
- API transformiert Unified Contract → CMS-spezifisches Format
- Frontend sendet immer Unified Contract
- CMS-Änderungen bleiben in API-Layer

---

### 7.3 Template Metadata Contract

**Annahme:** Template liefert Metadaten für Layout-Governance.

```typescript
interface TemplateMetadata {
  id: string
  version: number
  name: string
  
  // Editorial Spine Configuration
  spine: {
    maxBlocks: number
    allowedBlockTypes: string[]
    defaultDensity: "compact" | "normal" | "detailed"
  }
  
  // Data Sections Configuration
  dataSections: {
    defaultCollapsed: boolean
    maxExpandedSections: number
    summaryStrategy: "auto" | "manual" | "firstFields"
  }
  
  // Block Definitions (für Validierung)
  blockDefinitions: Array<{
    id: string
    blockKey: string
    layer: "spine" | "data" | "deep"
    defaultCollapsed?: boolean
    summary?: string
    density?: "compact" | "normal" | "detailed"
  }>
}
```

**Usage:**
- Frontend nutzt Metadata für Validierung
- Frontend respektiert Template-Preferences
- Template-Änderungen beeinflussen Frontend-Verhalten

---

### 7.4 Supplier Attribution Contract

**Annahme:** Supplier-Daten haben Attribution-Metadaten.

```typescript
interface SupplierAttribution {
  enabled: boolean
  mode: "input" | "declaration"
  source?: {
    id: string
    name: string
    role: string
    submittedAt: Date
  }
}
```

**Integration:**
- Aktuell: Aus `DppBlockSupplierConfig`
- Zukünftig: Aus `block.metadata.supplierAttribution`
- Unified Contract abstrahiert beides

---

## 8. Design-Entscheidungsrationale

### 8.1 Warum Drei-Schichten-Architektur?

**Problem:** Brand-Storytelling vs. Datenpräsentation vs. Compliance-Anforderungen sind unterschiedliche UX-Ziele.

**Lösung:** Drei getrennte Layers mit klaren Regeln.

**Vorteile:**
- Klare Verantwortlichkeiten pro Layer
- Keine Vermischung von Storytelling und Daten
- Compliance-Daten bleiben zugänglich, stören aber nicht UX
- Skalierbar: Neue Anforderungen können in passenden Layer

---

### 8.2 Warum Abstrakte Contracts statt Direkter CMS-Kopplung?

**Problem:** Feature Branch hat andere CMS-Struktur als Main Branch.

**Lösung:** Unified Contract als Abstraktion zwischen Frontend und CMS.

**Vorteile:**
- Frontend-Komponenten bleiben unverändert bei CMS-Änderungen
- Parallel-Entwicklung möglich (Main + Feature Branch)
- Einfacherer Merge-Prozess (Adapter-Layer isoliert Änderungen)
- Testbarkeit: Mock Unified Contract, nicht CMS

---

### 8.3 Warum Whitelist-Ansatz für Block-Typen?

**Problem:** Flexibilität vs. Konsistenz: Zu viele Block-Typen im Spine zerstören UX.

**Lösung:** Whitelist: Nur explizit erlaubte Typen pro Layer.

**Vorteile:**
- Garantiert konsistente UX über alle DPPs
- Template-Validierung kann Fehler früh erkennen
- Brand-Konsistenz bleibt erhalten
- Entwickler sehen klare Regeln

---

### 8.4 Warum Progressive Disclosure (Collapsed by Default)?

**Problem:** Große DPPs führen zu Endless Scrolling.

**Lösung:** Sections starten eingeklappt, Nutzer expandiert bei Bedarf.

**Vorteile:**
- Reduziert initiale Scroll-Höhe um 70-80%
- Nutzer fokussiert auf relevante Sections
- Zusammenfassungen geben Kontext ohne Details
- Mobile-freundlich (weniger Scroll)

---

### 8.5 Warum Template-basierte Governance?

**Problem:** Tausende DPPs müssen konsistent aussehen, auch bei Template-Änderungen.

**Lösung:** Template definiert Metadaten, Frontend respektiert sie.

**Vorteile:**
- Zentrale Steuerung über Template
- Per-Organization Customization möglich
- Versionierung erlaubt schrittweise Migration
- Design Token System ermöglicht Branding

---

## 9. Implementierungs-Roadmap

### Phase 1: Foundation (Ohne Code-Änderungen)
1. ✅ Unified Contract definieren
2. ✅ Content Adapter Pattern spezifizieren
3. ✅ Block-Typ-Whitelists dokumentieren
4. ✅ Template-Metadaten-Schema definieren

### Phase 2: Adapter-Layer (Low-Risk)
1. Content Adapter implementieren (Template → Unified)
2. Default-Enrichment für fehlende Metadaten
3. Validierung-Layer für Block-Platzierung

### Phase 3: Komponenten-Refactoring (Medium-Risk)
1. EditorialSpineSection Komponente (nutzt Unified Contract)
2. DataSectionsContainer Komponente (nutzt Unified Contract)
3. Progressive Disclosure Logic (Collapse/Expand)

### Phase 4: UX-Enhancements (Low-Risk)
1. View-Mode-Toggle (Editorial / Technical)
2. Density-Control
3. Section-Summaries
4. Sticky Navigation (optional)

### Phase 5: Feature Branch Integration (Low-Risk dank Adapter)
1. Content Adapter für BlockType-Struktur
2. Feature Branch Metadaten-Mapping
3. Testing mit beiden CMS-Strukturen

---

## 10. Risiken und Mitigation

### 10.1 Risiko: Feature Branch Merge bricht Frontend

**Mitigation:**
- Adapter-Layer isoliert CMS-Änderungen
- Unified Contract bleibt stabil
- Frontend-Komponenten kennen nur Unified Contract

### 10.2 Risiko: Performance bei großen DPPs

**Mitigation:**
- Progressive Disclosure reduziert initial Rendering
- Lazy Loading für Media
- Virtual Scrolling für lange Listen (falls nötig)

### 10.3 Risiko: Template-Migration für bestehende DPPs

**Mitigation:**
- Template-Versionierung: Alte DPPs bleiben bei alter Version
- Graceful Degradation: Fehlende Metadaten werden interpoliert
- Fallback-Strategien für alle optionalen Features

---

## 11. Zusammenfassung

Diese Architektur ermöglicht:

1. **Brand-driven Storytelling** durch Editorial Spine (immer sichtbar)
2. **Flexible Datenpräsentation** durch Modular Data Sections (progressive disclosure)
3. **Compliance-Zugang** durch Deep Data Views (optional, nicht im Hauptfluss)
4. **Kein Endless Scrolling** durch Collapsing, Summaries, Density-Control
5. **CMS-Forward-Compatibility** durch abstrakte Contracts und Adapter-Pattern
6. **Konsistenz** über Tausende DPPs durch Template-Governance
7. **Skalierbarkeit** durch klare Komponenten-Isolation

**Nächste Schritte:**
- Implementierung starten mit Phase 1 (Foundation)
- Content Adapter entwickeln
- Komponenten schrittweise auf Unified Contract umstellen

---

**Dokument-Version:** 1.0  
**Erstellt:** 2025-01-10  
**Autor:** UX Architecture Team


