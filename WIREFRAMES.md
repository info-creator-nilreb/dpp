# Editorial DPP Frontend - Wireframes

## Executive Summary

Dieses Dokument zeigt die visuelle Struktur (Wireframes) des Editorial DPP Frontends für Mobile und Desktop, basierend auf der MVP-Spezifikation.

**⚠️ WICHTIG: Template-Flexibilität**

Alle in den Wireframes gezeigten Inhalte (Block-Namen, Anzahl der Felder, Anzahl der Bilder, etc.) sind **vollständig dynamisch** und werden aus dem Template geladen. Die Wireframes zeigen **Beispiele**, nicht feste Strukturen.

- **Block-Namen:** Kommen aus `TemplateBlock.name` (z.B. "Materialien & Zusammensetzung", "Produktdaten", etc.)
- **Anzahl der Blocks:** Variiert je nach Template (kann 2-20+ Blocks haben)
- **Anzahl der Felder:** Variiert je nach Block (kann 1-50+ Fields haben)
- **Anzahl der Bilder:** Variiert je nach Block (kann 0-100+ Bilder haben)
- **Zusammenfassung:** Wird dynamisch generiert aus verfügbaren Feldern/Bildern/Dokumenten

Die Architektur unterstützt:
- ✅ Templates mit unterschiedlicher Anzahl von Blocks
- ✅ Blocks mit unterschiedlicher Anzahl von Fields
- ✅ Dynamische Zusammenfassungen basierend auf tatsächlichem Content
- ✅ Graceful Degradation wenn Metadaten fehlen

---

## 1. Desktop Wireframe (≥ 1024px)

### 1.1 Vollständige Seite (Initial State - Alle Sections Collapsed)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  [LOGO] 120-160px                                                           │
│  Top-Left, 24px Padding                                                    │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                                                                       │ │
│  │                    HERO-BILD (Full-Bleed)                            │ │
│  │                    Max. 60vh Höhe                                    │ │
│  │                    Aspect Ratio: 16:9 oder 21:9                     │ │
│  │                                                                       │ │
│  │  ┌─────────────────────────────────────────────────────────────┐     │ │
│  │  │                                                             │     │ │
│  │  │  [HEADLINE]                                                 │     │ │
│  │  │  Produktname                                                 │     │ │
│  │  │  3-4rem, Font-Weight 700, Weiß                              │     │ │
│  │  │                                                             │     │ │
│  │  │  [BRAND-NAME]                                               │     │ │
│  │  │  Markenname (wenn vorhanden)                                │     │ │
│  │  │  0.875-1.125rem, Uppercase, Weiß 90% Opacity                │     │ │
│  │  │                                                             │     │ │
│  │  │  [VERSION-INFO]                                             │     │ │
│  │  │  Version 2 • Veröffentlicht am 10. Januar 2025             │     │ │
│  │  │  0.875rem, Weiß 70% Opacity                                 │     │ │
│  │  │                                                             │     │ │
│  │  └─────────────────────────────────────────────────────────────┘     │ │
│  │  Overlay: Gradient von transparent zu rgba(0,0,0,0.7)               │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                    STORY-TEXT SECTION                                 │ │
│  │                    (Contained, max. 1200px, zentriert)               │ │
│  │                                                                       │ │
│  │  [STORY-TEXT]                                                         │ │
│  │  Narrativer Textblock, max. 300 Wörter                               │ │
│  │  2-Spalten-Layout (wenn Text > 150 Wörter)                           │ │
│  │  Font-Size: 1rem, Line-Height: 1.6                                   │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  [SECTION HEADER] ──────────────────────────────────────────────── [+] │ │
│  │  {TemplateBlock.name}  ← Dynamisch aus Template                      │ │
│  │  Zusammenfassung: {X} Felder • {Y} Bilder • {Z} Dokumente          │ │
│  │  ← Dynamisch generiert aus verfügbaren Fields/Media                 │ │
│  │  56px Höhe, Collapsed                                                 │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  [Weitere Sections...]  ← Anzahl variiert je nach Template                │
│  (Kann 2-20+ Sections sein)                                                │
│                                                                             │
│  ⚠️ HINWEIS: Die obigen Beispiele ("Materialien", "Nutzung", etc.)         │
│     sind nur Beispiele. Die tatsächlichen Block-Namen und Anzahl          │
│     kommen dynamisch aus dem Template.                                     │
│                                                                             │
│                                                                             │
│  [Footer / Bottom Padding: 120px für Sticky Elements]                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Desktop - Section Expanded

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  [LOGO]                                                                     │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                    HERO-BILD                                          │ │
│  │                    [HEADLINE] [BRAND] [VERSION]                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                    STORY-TEXT                                         │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  [SECTION HEADER] ──────────────────────────────────────────────── [−] │ │
│  │  Materialien & Zusammensetzung                                        │ │
│  │  Zusammenfassung: 5 Felder • 3 Bilder • 2 Dokumente                  │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │                                                                       │ │
│  │  [EXPANDED CONTENT]                                                   │ │
│  │                                                                       │ │
│  │  ┌──────────────────────┐  ┌──────────────────────┐                 │ │
│  │  │  Feld-Label          │  │  Feld-Label          │                 │ │
│  │  │  Feld-Value          │  │  Feld-Value          │                 │ │
│  │  └──────────────────────┘  └──────────────────────┘                 │ │
│  │                                                                       │ │
│  │  ┌──────────────────────┐  ┌──────────────────────┐                 │ │
│  │  │  Feld-Label          │  │  Feld-Label          │                 │ │
│  │  │  Feld-Value          │  │  Feld-Value          │                 │ │
│  │  └──────────────────────┘  └──────────────────────┘                 │ │
│  │                                                                       │ │
│  │  [MEDIA GALLERY]                                                      │ │
│  │  ┌────┐ ┌────┐ ┌────┐                                               │ │
│  │  │IMG │ │IMG │ │IMG │  (3 Spalten Grid)                              │ │
│  │  └────┘ └────┘ └────┘                                               │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  [SECTION HEADER] ──────────────────────────────────────────────── [+] │ │
│  │  Nutzung, Pflege & Lebensdauer                                        │ │
│  │  Zusammenfassung: 8 Felder • 1 Bild                                  │ │
│  │  56px Höhe, Collapsed                                                 │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  [Weitere Sections...]                                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Desktop - Layout-Details

**Container-Struktur:**
- Max. Breite: 1200px, zentriert
- Padding: 24px links/rechts
- Section-Abstand: 24px vertikal

**Grid-Layout (Fields):**
- 2-Spalten wenn > 5 Fields
- Field-Breite: Min. 300px pro Spalte
- Gap: 24px

**Media-Gallery:**
- 3 Spalten Grid
- Bild-Aspekt-Ratio: 16:9
- Lazy Loading

---

## 2. Mobile Wireframe (< 768px)

### 2.1 Vollständige Seite (Initial State - Alle Sections Collapsed)

```
┌─────────────────────────────┐
│                             │
│  [LOGO] 100-120px           │
│  Top-Left, 16px Padding     │
│                             │
│  ┌─────────────────────────┐│
│  │                         ││
│  │    HERO-BILD            ││
│  │    Full-Bleed           ││
│  │    Max. 40vh Höhe       ││
│  │    Aspect Ratio: 16:9   ││
│  │                         ││
│  │  ┌───────────────────┐  ││
│  │  │                   │  ││
│  │  │  [HEADLINE]       │  ││
│  │  │  Produktname      │  ││
│  │  │  2-2.5rem, Weiß   │  ││
│  │  │                   │  ││
│  │  │  [BRAND-NAME]     │  ││
│  │  │  Markenname       │  ││
│  │  │  0.875-1rem       │  ││
│  │  │                   │  ││
│  │  │  [VERSION-INFO]   │  ││
│  │  │  Version 2 •      │  ││
│  │  │  10. Jan. 2025    │  ││
│  │  │  0.75rem          │  ││
│  │  │                   │  ││
│  │  └───────────────────┘  ││
│  │  Overlay: Gradient      ││
│  │                         ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │                         ││
│  │  [STORY-TEXT]           ││
│  │  Narrativer Text        ││
│  │  1-Spalte, volle Breite ││
│  │  Minus 16px Padding     ││
│  │  Font-Size: 1rem        ││
│  │                         ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │ [SECTION HEADER]     [+]││
│  │ {TemplateBlock.name}    ││
│  │ ← Dynamisch aus Template││
│  │ {X} Felder • {Y} Bilder  ││
│  │ ← Dynamisch generiert   ││
│  │ 48px Höhe, Collapsed    ││
│  └─────────────────────────┘│
│                             │
│  [Weitere Sections...]       │
│  ← Anzahl variiert je nach  │
│    Template (2-20+ möglich) │
│                             │
│  ⚠️ HINWEIS: Block-Namen    │
│     und Anzahl sind         │
│     vollständig dynamisch   │
│                             │
│  [Bottom Padding: 120px]    │
│                             │
└─────────────────────────────┘
```

### 2.2 Mobile - Section Expanded

```
┌─────────────────────────────┐
│                             │
│  [LOGO]                     │
│                             │
│  ┌─────────────────────────┐│
│  │    HERO-BILD            ││
│  │    [HEADLINE]           ││
│  │    [BRAND] [VERSION]    ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │  [STORY-TEXT]           ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │ [SECTION HEADER]     [−]││
│  │ {TemplateBlock.name}    ││
│  │ ← Dynamisch aus Template││
│  │ {X} Felder • {Y} Bilder ││
│  │ ← Dynamisch generiert   ││
│  ├─────────────────────────┤│
│  │                         ││
│  │  [EXPANDED CONTENT]     ││
│  │  ← Alle Fields aus      ││
│  │    TemplateBlock.fields ││
│  │  ← Anzahl variiert      ││
│  │    (1-50+ möglich)       ││
│  │                         ││
│  │  ┌───────────────────┐ ││
│  │  │  {Field.label}    │ ││
│  │  │  ← TemplateField  │ ││
│  │  │                   │ ││
│  │  │  {Field.value}    │ ││
│  │  │  ← DPP-Daten      │ ││
│  │  └───────────────────┘ ││
│  │                         ││
│  │  [Weitere Fields...]    ││
│  │  ← Dynamisch            ││
│  │                         ││
│  │  [MEDIA GALLERY]        ││
│  │  ← Nur wenn vorhanden   ││
│  │  ┌────┐                 ││
│  │  │IMG │  ← Anzahl       ││
│  │  └────┘    variiert     ││
│  │  ┌────┐    (0-100+)     ││
│  │  │IMG │                 ││
│  │  └────┘                 ││
│  │                         ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │ [SECTION HEADER]     [+]││
│  │ {TemplateBlock.name}    ││
│  │ ← Dynamisch aus Template││
│  │ {X} Felder • {Y} Bilder ││
│  │ ← Dynamisch generiert   ││
│  │ 48px Höhe, Collapsed    ││
│  └─────────────────────────┘│
│                             │
│  [Weitere Sections...]       │
│                             │
└─────────────────────────────┘
```

### 2.3 Mobile - Layout-Details

**Container-Struktur:**
- Volle Breite (100vw)
- Padding: 16px links/rechts
- Section-Abstand: 16px vertikal

**Grid-Layout (Fields):**
- Immer 1 Spalte (Stack)
- Field-Breite: Volle Breite minus 32px (16px Padding × 2)
- Gap: 16px

**Media-Gallery:**
- 1 Spalte (Stack)
- Bild-Aspekt-Ratio: 16:9
- Lazy Loading

**Touch-Targets:**
- Min. 44x44px für alle interaktiven Elemente
- Section-Header: 48px Höhe

---

## 3. Tablet Wireframe (768px - 1024px)

### 3.1 Vollständige Seite (Initial State)

```
┌──────────────────────────────────────────────┐
│                                              │
│  [LOGO] 120-140px                           │
│  Top-Left, 20px Padding                    │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │                                        │ │
│  │        HERO-BILD                       │ │
│  │        Max. 50vh Höhe                 │ │
│  │                                        │ │
│  │  ┌──────────────────────────────────┐ │ │
│  │  │                                  │ │ │
│  │  │  [HEADLINE]                      │ │ │
│  │  │  Produktname                     │ │ │
│  │  │  2.5-3rem, Weiß                 │ │ │
│  │  │                                  │ │ │
│  │  │  [BRAND-NAME]                    │ │ │
│  │  │  Markenname                      │ │ │
│  │  │  0.875-1rem                      │ │ │
│  │  │                                  │ │ │
│  │  │  [VERSION-INFO]                  │ │ │
│  │  │  Version 2 • 10. Januar 2025    │ │ │
│  │  │  0.8125rem                       │ │ │
│  │  │                                  │ │ │
│  │  └──────────────────────────────────┘ │ │
│  │                                        │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  [STORY-TEXT]                         │ │
│  │  1-Spalte, max. 700px Container       │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  [SECTION HEADER] ──────────────── [+] │ │
│  │  Materialien & Zusammensetzung         │ │
│  │  5 Felder • 3 Bilder • 2 Dokumente     │ │
│  │  52px Höhe, Collapsed                  │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  [Weitere Sections...]                       │
│                                              │
└──────────────────────────────────────────────┘
```

### 3.2 Tablet - Section Expanded

**Layout:**
- Fields: 2-Spalten Grid (wenn > 5 Fields)
- Media-Gallery: 2 Spalten Grid
- Container: Max. 100% Breite, 24px Padding

---

## 4. Template-Flexibilität & Dynamische Inhalte

### 4.1 Wie Templates das Frontend bestimmen

**Wichtig:** Das Frontend ist vollständig template-gesteuert. Alle Inhalte kommen dynamisch aus dem Template.

**Template-Struktur:**
```typescript
Template {
  blocks: TemplateBlock[]  // Array von Blocks (kann 2-20+ sein)
  // Jeder Block:
  TemplateBlock {
    id: string
    name: string           // ← Wird als Section-Name angezeigt
    order: number          // ← Bestimmt Reihenfolge (0 = Spine, >0 = Data)
    fields: TemplateField[] // Array von Fields (kann 1-50+ sein)
  }
  // Jedes Field:
  TemplateField {
    id: string
    label: string          // ← Wird als Field-Label angezeigt
    key: string            // ← Wird für DPP-Daten-Lookup verwendet
    type: string           // ← Bestimmt Rendering (text, image, etc.)
    order: number          // ← Bestimmt Reihenfolge innerhalb Block
  }
}
```

### 4.2 Beispiele für verschiedene Template-Konfigurationen

**Beispiel 1: Minimales Template (2 Blocks)**
```
Template: "Basis-Template"
├─ Block 1 (order=0): "Produktdaten"
│  └─ Fields: 5 (Name, SKU, GTIN, Brand, Beschreibung)
└─ Block 2 (order=1): "Zusätzliche Informationen"
   └─ Fields: 3 (Materialien, Herkunft, Pflege)
```

**Frontend-Anzeige:**
- Editorial Spine: 1 Block (Produktdaten)
- Data Sections: 1 Section (Zusätzliche Informationen)

**Beispiel 2: Standard-Template (5 Blocks)**
```
Template: "Standard-Textilien"
├─ Block 1 (order=0): "Produktdaten"
│  └─ Fields: 8
├─ Block 2 (order=1): "Materialien"
│  └─ Fields: 12
├─ Block 3 (order=2): "Nutzung & Pflege"
│  └─ Fields: 6
├─ Block 4 (order=3): "Rechtliches"
│  └─ Fields: 15
└─ Block 5 (order=4): "Rücknahme"
   └─ Fields: 4
```

**Frontend-Anzeige:**
- Editorial Spine: 1 Block (Produktdaten)
- Data Sections: 4 Sections (Materialien, Nutzung, Rechtliches, Rücknahme)

**Beispiel 3: Komplexes Template (10+ Blocks)**
```
Template: "Premium-Elektronik"
├─ Block 1 (order=0): "Produktdaten"
│  └─ Fields: 15
├─ Block 2 (order=1): "Technische Spezifikationen"
│  └─ Fields: 25
├─ Block 3 (order=2): "Materialien & Komponenten"
│  └─ Fields: 20
├─ Block 4 (order=3): "Energieeffizienz"
│  └─ Fields: 8
├─ Block 5 (order=4): "Reparatur & Wartung"
│  └─ Fields: 12
├─ Block 6 (order=5): "Rechtliches & Konformität"
│  └─ Fields: 18
├─ Block 7 (order=6): "Rücknahme & Recycling"
│  └─ Fields: 10
├─ Block 8 (order=7): "Lieferkette"
│  └─ Fields: 15
├─ Block 9 (order=8): "Zertifikate"
│  └─ Fields: 8
└─ Block 10 (order=9): "Weitere Informationen"
   └─ Fields: 5
```

**Frontend-Anzeige:**
- Editorial Spine: 1 Block (Produktdaten)
- Data Sections: 9 Sections (alle anderen Blocks)

### 4.3 Dynamische Zusammenfassung

**Wie wird die Zusammenfassung generiert?**

```typescript
function generateSectionSummary(block: UnifiedContentBlock): string {
  const fieldCount = Object.keys(block.content.fields).length
  const imageCount = block.content.fields.filter(f => f.type === 'image').length
  const documentCount = block.content.fields.filter(f => f.type === 'file-document').length
  
  // Beispiel-Output:
  // "5 Felder • 3 Bilder • 2 Dokumente"
  // "12 Felder" (wenn keine Bilder/Dokumente)
  // "3 Bilder" (wenn nur Bilder)
  
  return formatSummary(fieldCount, imageCount, documentCount)
}
```

**Beispiele:**
- Block mit 5 Fields, 3 Images, 2 Documents → "5 Felder • 3 Bilder • 2 Dokumente"
- Block mit 12 Fields, 0 Images, 0 Documents → "12 Felder"
- Block mit 0 Fields, 8 Images, 0 Documents → "8 Bilder"
- Block mit 1 Field, 0 Images, 5 Documents → "1 Feld • 5 Dokumente"

### 4.4 Responsive Verhalten bei variabler Content-Menge

**Wenige Fields (< 5):**
- Desktop: 1-Spalten-Layout (auch wenn Grid verfügbar)
- Mobile: 1-Spalten-Layout

**Viele Fields (> 20):**
- Desktop: 2-Spalten-Grid
- Tablet: 2-Spalten-Grid
- Mobile: 1-Spalten-Layout (Stack)

**Sehr viele Fields (> 50):**
- Desktop: 2-Spalten-Grid mit Scroll (Section-Content scrollbar)
- Mobile: 1-Spalten-Layout mit Scroll

**Viele Bilder (> 10):**
- Desktop: 3-Spalten-Grid mit "Zeige mehr" Button
- Tablet: 2-Spalten-Grid mit "Zeige mehr" Button
- Mobile: 1-Spalten-Layout mit "Zeige mehr" Button

### 4.5 Graceful Degradation

**Was passiert, wenn Template-Daten fehlen?**

1. **Fehlender Block-Name:**
   - Fallback: "Block {order + 1}" oder "Unbenannter Block"

2. **Fehlende Field-Labels:**
   - Fallback: Field-Key wird angezeigt (z.B. "material_source")

3. **Fehlende Zusammenfassung:**
   - Fallback: Automatische Generierung aus verfügbaren Fields

4. **Leere Sections:**
   - Anzeige: "Keine Daten verfügbar" oder Section wird ausgeblendet (optional)

5. **Fehlende Hero-Bild:**
   - Fallback: Headline wird prominent ohne Overlay angezeigt

---

## 5. Komponenten-Details

### 4.1 Editorial Spine - Hero-Overlay

```
┌─────────────────────────────────────────────┐
│                                             │
│  [Hero-Bild Full-Bleed]                    │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │                                       │ │
│  │  [HEADLINE]                           │ │
│  │  Große Überschrift                    │ │
│  │  Font-Weight: 700                     │ │
│  │  Color: #FFFFFF                       │ │
│  │                                       │ │
│  │  [BRAND-NAME]                         │ │
│  │  Markenname                           │ │
│  │  Text-Transform: Uppercase            │ │
│  │  Color: rgba(255, 255, 255, 0.9)    │ │
│  │                                       │ │
│  │  [VERSION-INFO]                       │ │
│  │  Version X • Veröffentlicht am ...   │ │
│  │  Color: rgba(255, 255, 255, 0.7)    │ │
│  │                                       │ │
│  └───────────────────────────────────────┘ │
│  Overlay: linear-gradient(to top,          │
│           rgba(0,0,0,0.7), transparent)   │
│                                             │
└─────────────────────────────────────────────┘
```

### 4.2 Section Header (Collapsed)

**Desktop:**
```
┌────────────────────────────────────────────────────────────┐
│  [Section Name]                    [Summary]          [+]  │
│  Font-Weight: 700                  Font-Size: 0.875rem     │
│  Font-Size: 1.25rem                Color: #7A7A7A          │
│  Color: #0A0A0A                                            │
│  Height: 56px                                               │
│  Padding: 1rem                                              │
└────────────────────────────────────────────────────────────┘
```

**Mobile:**
```
┌────────────────────────────────────┐
│  [Section Name]              [+]  │
│  Font-Weight: 700                 │
│  Font-Size: 1.1rem                │
│  Color: #0A0A0A                   │
│                                   │
│  [Summary]                        │
│  Font-Size: 0.875rem              │
│  Color: #7A7A7A                  │
│  Height: 48px (min)               │
│  Padding: 1rem                    │
└────────────────────────────────────┘
```

### 4.3 Section Content (Expanded)

**Desktop - 2-Spalten Grid:**
```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  ┌──────────────────────┐  ┌──────────────────────┐     │
│  │  Feld-Label         │  │  Feld-Label         │     │
│  │  Font-Weight: 600   │  │  Font-Weight: 600   │     │
│  │  Font-Size: 0.95rem │  │  Font-Size: 0.95rem │     │
│  │                     │  │                     │     │
│  │  Feld-Value         │  │  Feld-Value         │     │
│  │  Font-Size: 1rem    │  │  Font-Size: 1rem    │     │
│  │  Color: #0A0A0A     │  │  Color: #0A0A0A     │     │
│  └──────────────────────┘  └──────────────────────┘     │
│                                                            │
│  Gap: 24px                                                 │
│  Min-Width pro Spalte: 300px                               │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Mobile - 1-Spalte Stack:**
```
┌────────────────────────────┐
│                            │
│  ┌──────────────────────┐  │
│  │  Feld-Label         │  │
│  │  Font-Weight: 600   │  │
│  │  Font-Size: 0.95rem │  │
│  │                     │  │
│  │  Feld-Value         │  │
│  │  Font-Size: 1rem    │  │
│  │  Color: #0A0A0A     │  │
│  └──────────────────────┘  │
│                            │
│  Gap: 16px                 │
│  Full Width minus 32px     │
│                            │
└────────────────────────────┘
```

### 4.4 Media Gallery

**Desktop - 3 Spalten:**
```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  ┌──────┐  ┌──────┐  ┌──────┐                            │
│  │ IMG  │  │ IMG  │  │ IMG  │                            │
│  │16:9  │  │16:9  │  │16:9  │                            │
│  └──────┘  └──────┘  └──────┘                            │
│                                                            │
│  ┌──────┐  ┌──────┐  ┌──────┐                            │
│  │ IMG  │  │ IMG  │  │ IMG  │                            │
│  │16:9  │  │16:9  │  │16:9  │                            │
│  └──────┘  └──────┘  └──────┘                            │
│                                                            │
│  Gap: 16px                                                 │
│  Lazy Loading                                              │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Tablet - 2 Spalten:**
```
┌────────────────────────────────────┐
│                                    │
│  ┌──────┐  ┌──────┐               │
│  │ IMG  │  │ IMG  │               │
│  │16:9  │  │16:9  │               │
│  └──────┘  └──────┘               │
│                                    │
│  ┌──────┐  ┌──────┐               │
│  │ IMG  │  │ IMG  │               │
│  │16:9  │  │16:9  │               │
│  └──────┘  └──────┘               │
│                                    │
│  Gap: 16px                         │
│                                    │
└────────────────────────────────────┘
```

**Mobile - 1 Spalte:**
```
┌────────────────────────────┐
│                            │
│  ┌──────────────────────┐  │
│  │        IMG           │  │
│  │        16:9          │  │
│  └──────────────────────┘  │
│                            │
│  ┌──────────────────────┐  │
│  │        IMG           │  │
│  │        16:9          │  │
│  └──────────────────────┘  │
│                            │
│  Gap: 16px                 │
│  Full Width                 │
│                            │
└────────────────────────────┘
```

---

## 5. Responsive Breakpoints

### 5.1 Breakpoint-Übersicht

```
Mobile:    0px - 767px
Tablet:    768px - 1023px
Desktop:   1024px+
Wide:      1440px+ (optional, nutzt max. 1200px Container)
```

### 5.2 Responsive Verhalten

**Hero-Bild:**
- Mobile: Max. 40vh
- Tablet: Max. 50vh
- Desktop: Max. 60vh

**Headline:**
- Mobile: 2-2.5rem
- Tablet: 2.5-3rem
- Desktop: 3-4rem

**Section-Header:**
- Mobile: 48px Höhe
- Tablet: 52px Höhe
- Desktop: 56px Höhe

**Container:**
- Mobile: 100% Breite, 16px Padding
- Tablet: 100% Breite, 24px Padding
- Desktop: Max. 1200px, zentriert, 24px Padding

**Fields Grid:**
- Mobile: 1 Spalte (Stack)
- Tablet: 2 Spalten (wenn > 5 Fields)
- Desktop: 2 Spalten (wenn > 5 Fields)

**Media Gallery:**
- Mobile: 1 Spalte
- Tablet: 2 Spalten
- Desktop: 3 Spalten

---

## 6. Interaktive Elemente

### 6.1 Section Expand/Collapse

**Collapsed State:**
```
┌────────────────────────────────────┐
│  Section Name        Summary   [+] │
│  (Click/Tap to Expand)             │
└────────────────────────────────────┘
```

**Expanding Animation:**
```
┌────────────────────────────────────┐
│  Section Name        Summary   [+] │
│  ──────────────────────────────── │
│  [Content fährt nach unten]        │
│  Animation: 300ms ease             │
└────────────────────────────────────┘
```

**Expanded State:**
```
┌────────────────────────────────────┐
│  Section Name        Summary   [−] │
│  ──────────────────────────────── │
│  [Content sichtbar]                │
│  (Click/Tap to Collapse)           │
└────────────────────────────────────┘
```

### 6.2 Auto-Collapse (Max. 3 Sections)

**Szenario:**
1. Section A expanded
2. Section B expanded
3. Section C expanded
4. Section D wird expanded → Section A kollabiert automatisch (LRU)

---

## 7. Spacing & Typography

### 7.1 Spacing-System (8px Base)

```
xs:   4px   (0.25rem)
sm:   8px   (0.5rem)
md:   16px  (1rem)
lg:   24px  (1.5rem)
xl:   32px  (2rem)
2xl:  48px  (3rem)
```

### 7.2 Typography-Scale

**Headlines:**
- H1 (Spine): 2-4rem (responsive)
- H2 (Section): 1.25rem (Desktop), 1.1rem (Mobile)

**Body:**
- Body: 1rem
- Small: 0.875rem
- Caption: 0.75rem

**Line-Height:**
- Headlines: 1.2
- Body: 1.6

---

## 8. Farben & Kontraste

### 8.1 Farb-Palette

```
Text Primary:    #0A0A0A
Text Secondary:  #7A7A7A
Background:      #FFFFFF
Border:          #CDCDCD
Accent:          #24c598 (Brand-Farbe)
```

### 8.2 Hero-Overlay

```
Overlay Gradient: linear-gradient(to top, rgba(0,0,0,0.7), transparent)
Text Color:       #FFFFFF
Text Opacity:     100% (Headline), 90% (Brand), 70% (Version)
```

### 8.3 Kontraste (WCAG AA)

- Text Primary auf Background: 16.5:1 ✅
- Text Secondary auf Background: 4.7:1 ✅
- Weißer Text auf Overlay: 4.5:1+ ✅

---

## 9. Accessibility-Features

### 9.1 Keyboard Navigation

```
Tab:     Nächster Section-Header
Shift+Tab: Vorheriger Section-Header
Enter/Space: Expand/Collapse Section
```

### 9.2 ARIA-Labels

```html
<section aria-label="Materialien & Zusammensetzung">
  <button 
    aria-expanded="false"
    aria-label="Materialien & Zusammensetzung erweitern"
  >
    Section Header
  </button>
</section>
```

### 9.3 Focus-States

```
Focus-Ring: 2px solid #24c598
Offset: 2px
Visible: :focus-visible
```

---

## 10. Performance-Optimierungen

### 10.1 Lazy Loading

- Hero-Bild: Priority (above-the-fold)
- Andere Bilder: Lazy Loading (Intersection Observer)
- Sections: Nur expanded Sections rendern

### 10.2 Code-Splitting

- Editorial Spine: Main Bundle
- Data Sections: Dynamic Import
- Media Gallery: Dynamic Import

---

## 11. Zusammenfassung: Template-Flexibilität

### 11.1 Was ist dynamisch?

**✅ Vollständig dynamisch (aus Template):**
- Block-Namen (`TemplateBlock.name`)
- Anzahl der Blocks (2-20+ möglich)
- Anzahl der Fields pro Block (1-50+ möglich)
- Field-Labels (`TemplateField.label`)
- Field-Types (`TemplateField.type`)
- Field-Reihenfolge (`TemplateField.order`)
- Zusammenfassung (generiert aus verfügbaren Fields/Media)

**✅ Vollständig dynamisch (aus DPP-Daten):**
- Field-Values (aus DPP-Content)
- Anzahl der Bilder (aus DppMedia)
- Anzahl der Dokumente (aus DppMedia mit fileType="application/pdf")

**❌ Fest (Design-System):**
- Layout-Struktur (Spine, Data Sections)
- Responsive Breakpoints
- Spacing-System
- Typography-Scale
- Farben

### 11.2 Template-Beispiele

**Minimales Template:**
- 2 Blocks (1 Spine, 1 Data)
- 8 Fields gesamt
- Frontend zeigt: 1 Spine-Section, 1 Data-Section

**Standard-Template:**
- 5 Blocks (1 Spine, 4 Data)
- 45 Fields gesamt
- Frontend zeigt: 1 Spine-Section, 4 Data-Sections

**Komplexes Template:**
- 10+ Blocks (1 Spine, 9+ Data)
- 100+ Fields gesamt
- Frontend zeigt: 1 Spine-Section, 9+ Data-Sections

### 11.3 Implementierungs-Hinweise

**Content Adapter:**
```typescript
// Transformiert Template → Unified Content Block
const unifiedBlocks = template.blocks.map(block => 
  adaptTemplateBlockToUnified(block, dppContent)
)

// Rendert dynamisch basierend auf unifiedBlocks
{unifiedBlocks.map(block => (
  <Section key={block.id} name={block.displayName}>
    {/* Block-Name kommt aus TemplateBlock.name */}
    {block.content.fields.map(field => (
      <Field key={field.key} label={field.label} value={field.value} />
      {/* Field-Label kommt aus TemplateField.label */}
    ))}
  </Section>
))}
```

**Zusammenfassung-Generierung:**
```typescript
function generateSummary(block: UnifiedContentBlock): string {
  const fieldCount = Object.keys(block.content.fields).length
  const imageCount = countImages(block)
  const documentCount = countDocuments(block)
  
  // Dynamisch basierend auf tatsächlichem Content
  return `${fieldCount} Felder${imageCount > 0 ? ` • ${imageCount} Bilder` : ''}${documentCount > 0 ? ` • ${documentCount} Dokumente` : ''}`
}
```

### 11.4 Antwort auf die Rückfrage

**Ja, das Design ist vollständig flexibel:**

✅ **Block-Namen:** Kommen dynamisch aus `TemplateBlock.name`  
✅ **Anzahl der Blocks:** Variiert je nach Template (2-20+)  
✅ **Anzahl der Fields:** Variiert je nach Block (1-50+)  
✅ **Anzahl der Bilder:** Variiert je nach DPP (0-100+)  
✅ **Zusammenfassung:** Wird dynamisch generiert aus tatsächlichem Content  

**Die Wireframes zeigen Beispiele, nicht feste Strukturen.**

---

**Dokument-Version:** 1.1  
**Erstellt:** 2025-01-10  
**Aktualisiert:** 2025-01-10 (Template-Flexibilität klargestellt)  
**Autor:** UX Architecture Team
