# CMS Architecture Documentation

## Übersicht

Das blockbasierte CMS für Digital Product Passports (DPP) ermöglicht es, strukturierte Inhalte zu erstellen und zu verwalten. Das System ist strikt kontrolliert und respektiert Subscription-Tiers und Feature-Capabilities.

## Architektur-Prinzipien

### 1. Block-basiert, nicht frei formbar
- Blöcke sind systemdefiniert, nicht benutzerdefiniert
- Kein Custom HTML, CSS oder Layout-Grids
- Styling-Optionen sind eingeschränkt und brand-fokussiert
- Alle Sichtbarkeit und Verfügbarkeit hängt von Feature-Capabilities ab

### 2. Feature-basierte Verfügbarkeit
- Jeder Block-Typ ist an ein Feature im Feature-Manifest gebunden
- Verfügbarkeit wird über den zentralen Capability-Resolver geprüft
- Keine Frontend-seitige Subscription-Logik

### 3. Subscription-Tiers

#### Basic
- Nur obligatorische Blöcke
- Kein CMS-Zugriff

#### Pro
- Block-Editor-Zugriff
- Zusätzliche Blöcke (Storytelling, Text/Bild)
- Keine Styling-Controls

#### Premium
- Vollständiger Block-Zugriff
- Styling-Controls aktiviert

#### Testphase (Trial)
- Gleiche Blöcke wie Premium
- Gleiche Styling-Controls
- Nur Draft & Preview
- Kein Publishing

## Datenmodell

### Block Structure

```typescript
interface Block {
  id: string                    // Eindeutige Block-ID
  type: BlockTypeKey            // Block-Typ (storytelling, quick_poll, etc.)
  featureKey: string            // Referenz zu FEATURE_MANIFEST key
  order: number                 // Anzeige-Reihenfolge (ascending)
  status: "draft" | "published"
  content: Record<string, any>  // Schema-validierte Inhalte
}
```

### Styling Configuration

```typescript
interface StylingConfig {
  logo?: {
    url: string
    alt?: string
    width?: number
    height?: number
  }
  colors: {
    primary: string      // Hex-Farbe
    secondary?: string
    accent?: string
  }
  fonts?: {
    primary?: string    // Aus vordefinierten Fonts
    secondary?: string
  }
  spacing?: {
    blockSpacing?: number
    sectionPadding?: number
  }
}
```

## Block-Typen

### Verfügbare Block-Typen

1. **Storytelling** (`block_storytelling`)
   - Plan: Pro
   - Features: Titel, Beschreibung, Bilder, Abschnitte
   - Schema: `storytellingBlockSchema`

2. **Quick Poll** (`block_quick_poll`)
   - Plan: Premium
   - Features: Frage, Optionen, Mehrfachauswahl
   - Schema: `quickPollBlockSchema`

3. **Image Text** (`block_image_text`)
   - Plan: Pro
   - Features: Bild + Text, verschiedene Layouts
   - Schema: `imageTextBlockSchema`

## API-Endpunkte

### Content Management

#### GET `/api/app/dpp/[dppId]/content`
Lädt DPP-Content (Blöcke + Styling)

**Response:**
```json
{
  "content": {
    "blocks": Block[],
    "styling": StylingConfig
  },
  "isPublished": boolean
}
```

#### POST `/api/app/dpp/[dppId]/content`
Erstellt oder aktualisiert DPP-Content

**Request:**
```json
{
  "blocks": Block[],
  "styling": StylingConfig,
  "publish": boolean
}
```

### Block Management

#### POST `/api/app/dpp/[dppId]/content/blocks`
Erstellt einen neuen Block

**Request:**
```json
{
  "type": BlockTypeKey,
  "content": Record<string, any>,
  "order": number (optional)
}
```

#### PUT `/api/app/dpp/[dppId]/content/blocks/[blockId]`
Aktualisiert einen Block

**Request:**
```json
{
  "content": Record<string, any> (optional),
  "order": number (optional),
  "status": "draft" | "published" (optional)
}
```

#### DELETE `/api/app/dpp/[dppId]/content/blocks/[blockId]`
Löscht einen Block

#### POST `/api/app/dpp/[dppId]/content/blocks/reorder`
Ordnet Blöcke neu

**Request:**
```json
{
  "blockIds": string[]  // Geordnete Liste von Block-IDs
}
```

### Styling Management

#### PUT `/api/app/dpp/[dppId]/content/styling`
Aktualisiert Styling-Konfiguration (Premium only)

**Request:**
```json
{
  "logo": {...} (optional),
  "colors": {...} (optional),
  "fonts": {...} (optional),
  "spacing": {...} (optional)
}
```

## Validierung

### Block-Validierung

1. **Feature-Check**: Prüft ob Block-Typ verfügbar ist
2. **Schema-Validierung**: Validiert Content gegen JSON Schema
3. **Order-Validierung**: Prüft auf doppelte Orders
4. **ID-Validierung**: Prüft auf doppelte IDs

### Styling-Validierung

1. **Feature-Check**: Prüft Premium-Plan
2. **Farb-Validierung**: Hex-Format (#RRGGBB)
3. **Font-Validierung**: Nur vordefinierte Fonts
4. **Logo-Validierung**: URL-Format, Dimensionen

## Frontend-Rendering

### Rendering-Reihenfolge

1. **Capabilities auflösen**: `hasFeature()` für jeden Block-Typ
2. **Theme auflösen**: Styling mit Defaults mergen
3. **Erlaubte Blöcke filtern**: Nur Blöcke mit verfügbarem Feature rendern
4. **Blöcke in Order rendern**: Ascending nach `order`

### Beispiel-Rendering-Logik

```typescript
// 1. Resolve capabilities
const availableFeatures = await getAvailableFeatures(context)

// 2. Resolve theme
const theme = resolveTheme(styling)

// 3. Filter allowed blocks
const allowedBlocks = blocks.filter(block => {
  const featureKey = BLOCK_TYPE_FEATURE_MAP[block.type]
  return availableFeatures.includes(featureKey)
})

// 4. Sort by order
const sortedBlocks = allowedBlocks.sort((a, b) => a.order - b.order)

// 5. Render blocks
sortedBlocks.forEach(block => {
  renderBlock(block, theme)
})
```

## Sicherheit & Validierung

### Server-seitige Validierung

- Alle Feature-Checks erfolgen server-seitig
- Schema-Validierung für alle Block-Inhalte
- Styling-Validierung für alle Styling-Inputs
- Keine Cross-DPP-Styling-Leckage

### Client-seitige Validierung

- UI-Feedback für nicht verfügbare Features
- Upgrade-Hinweise (nicht aufdringlich)
- Klare Fehlermeldungen

## Publishing & Preview

### Modes

- **draft**: Entwurf (immer erlaubt)
- **preview**: Vorschau (erlaubt für alle mit CMS-Zugriff)
- **published**: Veröffentlicht (nur mit `publish_dpp` Feature)

### Testphase-Regeln

- Draft & Preview erlaubt
- Publishing deaktiviert
- Styling sichtbar, aber nicht veröffentlicht

## Beispiel-Block-Definitionen

### Storytelling Block

```json
{
  "id": "block_123",
  "type": "storytelling",
  "featureKey": "block_storytelling",
  "order": 0,
  "status": "draft",
  "content": {
    "title": "Unsere Nachhaltigkeitsgeschichte",
    "description": "Wie wir nachhaltige Produkte herstellen",
    "images": [
      {
        "url": "https://example.com/image.jpg",
        "alt": "Nachhaltige Produktion",
        "caption": "Unsere Produktionsstätte"
      }
    ],
    "sections": [
      {
        "heading": "Materialien",
        "text": "Wir verwenden nur nachhaltige Materialien",
        "image": "https://example.com/materials.jpg"
      }
    ]
  }
}
```

### Quick Poll Block

```json
{
  "id": "block_456",
  "type": "quick_poll",
  "featureKey": "block_quick_poll",
  "order": 1,
  "status": "draft",
  "content": {
    "question": "Wie wichtig ist Ihnen Nachhaltigkeit?",
    "options": [
      { "id": "opt1", "label": "Sehr wichtig" },
      { "id": "opt2", "label": "Wichtig" },
      { "id": "opt3", "label": "Weniger wichtig" }
    ],
    "allowMultiple": false,
    "showResults": true
  }
}
```

### Image Text Block

```json
{
  "id": "block_789",
  "type": "image_text",
  "featureKey": "block_image_text",
  "order": 2,
  "status": "draft",
  "content": {
    "layout": "image_left",
    "image": {
      "url": "https://example.com/product.jpg",
      "alt": "Unser Produkt",
      "caption": "Hochwertiges Design"
    },
    "text": {
      "heading": "Premium Qualität",
      "content": "Unser Produkt wird mit höchster Sorgfalt hergestellt..."
    }
  }
}
```

## Styling-Config Beispiel

```json
{
  "logo": {
    "url": "https://example.com/logo.png",
    "alt": "Company Logo",
    "width": 200,
    "height": 50
  },
  "colors": {
    "primary": "#1a1a1a",
    "secondary": "#666666",
    "accent": "#0066CC"
  },
  "fonts": {
    "primary": "Inter",
    "secondary": "Roboto"
  },
  "spacing": {
    "blockSpacing": 32,
    "sectionPadding": 48
  }
}
```

## Capability-Checks (Pseudocode)

```typescript
// Block-Erstellung prüfen
async function canCreateBlock(blockType: BlockTypeKey, context: CapabilityContext): Promise<boolean> {
  const featureKey = BLOCK_TYPE_FEATURE_MAP[blockType]
  return await hasFeature(featureKey, context)
}

// Styling prüfen
async function canUseStyling(context: CapabilityContext): Promise<boolean> {
  return await hasFeature("cms_styling", context)
}

// Publishing prüfen
async function canPublish(context: CapabilityContext): Promise<boolean> {
  return await hasFeature("publish_dpp", context)
}
```

## Frontend-Rendering-Flow

```typescript
// 1. Capabilities auflösen
const capabilities = await getAvailableFeatures({
  organizationId: dpp.organizationId,
  userId: user.id
})

// 2. Theme auflösen
const theme = resolveTheme(content.styling)

// 3. Erlaubte Blöcke filtern
const allowedBlocks = content.blocks.filter(block => {
  const featureKey = BLOCK_TYPE_FEATURE_MAP[block.type]
  return capabilities.includes(featureKey)
})

// 4. Nach Order sortieren
const sortedBlocks = allowedBlocks.sort((a, b) => a.order - b.order)

// 5. Rendern
sortedBlocks.forEach(block => {
  renderBlock(block, theme)
})
```

## CMS-Editor UI-Logik

### Block-Erstellung

```typescript
// Prüfe verfügbare Block-Typen
const availableBlockTypes = await getAvailableBlockTypes(context)

// Zeige nur verfügbare Block-Typen im UI
availableBlockTypes.forEach(blockType => {
  if (hasFeature(BLOCK_TYPE_FEATURE_MAP[blockType], context)) {
    showBlockTypeOption(blockType)
  } else {
    showUpgradeHint(blockType)
  }
})
```

### Block-Reordering

```typescript
// Drag & Drop Handler
function handleBlockReorder(newOrder: string[]) {
  // Validiere alle Block-IDs
  if (!validateBlockIds(newOrder)) {
    showError("Ungültige Block-Reihenfolge")
    return
  }

  // API-Call
  await fetch(`/api/app/dpp/${dppId}/content/blocks/reorder`, {
    method: "POST",
    body: JSON.stringify({ blockIds: newOrder })
  })
}
```

### Styling-Editor

```typescript
// Prüfe Styling-Feature
const canUseStyling = await hasFeature("cms_styling", context)

if (!canUseStyling) {
  showUpgradeMessage("Styling verfügbar im Premium Plan")
  disableStylingControls()
} else {
  enableStylingControls()
}
```

## Zusammenfassung

Das CMS-System ist:

- **Block-basiert**: Systemdefinierte Blöcke, keine Custom-HTML
- **Feature-gesteuert**: Alle Verfügbarkeit über Capability-Resolver
- **Subscription-aware**: Respektiert Plan-Tiers automatisch
- **Validiert**: Server-seitige Schema-Validierung
- **Sicher**: Keine Cross-DPP-Leckage, strikte Validierung
- **Kontrolliert**: Layout und Design strikt kontrolliert

