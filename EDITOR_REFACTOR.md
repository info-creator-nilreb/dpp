# DPP Editor Refactor - Modern SaaS Layout

## Übersicht

Der DPP-Editor wurde basierend auf modernen SaaS-Editor-Prinzipien (inspiriert von Shopify/WordPress) refactoriert, um eine klare, card-basierte Struktur mit deutlicher Trennung zwischen Content und Meta/Settings zu schaffen.

## Design-Prinzipien (aus Screenshots übernommen)

### ✅ Übernommen:
- **Card-basiertes Layout**: Alle Inhalte in klaren, abgegrenzten Cards
- **Klare Trennung**: Content-Bereich vs. Meta/Settings-Sidebar
- **Ruhige Hierarchie**: Editor-ähnliche Struktur, nicht formular-lastig
- **Feste vs. Flexible Sektionen**: Compliance sieht fest aus, Blocks sind modular
- **"Add section" Affordances**: Prominente, einladende Buttons zum Hinzufügen
- **Keine Form-Walls**: Keine langen, einspaltigen Formulare

### ❌ Nicht kopiert:
- Exaktes Styling/Farben
- Shopify-spezifische Features
- Branding-Elemente

## Komponenten-Struktur

### 1. EditorLayout
**Zweck**: Haupt-Container für alle Editor-Tabs

**Features**:
- EditorHeader mit Titel, Subtitle, Actions
- ContentArea (flex-1, scrollbar)
- Optional Sidebar (Meta/Settings)

**Verwendung**:
```tsx
<EditorLayout
  title="Content Editor"
  subtitle="Zusätzliche Inhalte"
  headerActions={<SaveButton />}
  content={<ContentArea />}
  sidebar={<MetaPanel />}
/>
```

### 2. ContentSection
**Zweck**: Gruppiert verwandte Inhalte in Sektionen

**Features**:
- Titel + Beschreibung
- `isFixed` Flag für feste Sektionen (Compliance)
- Konsistente Abstände

**Verwendung**:
```tsx
<ContentSection
  title="Content-Blöcke"
  description="Zusätzliche Inhalte"
  isFixed={false}
>
  {children}
</ContentSection>
```

### 3. AddBlockButton
**Zweck**: Prominenter Button zum Hinzufügen von Blöcken

**Features**:
- Gestrichelter Border (dashed)
- Hover-Effekte
- Klare visuelle Affordance

**Verwendung**:
```tsx
<AddBlockButton
  onClick={() => setShowPicker(true)}
  label="Add section"
/>
```

### 4. ComplianceCard
**Zweck**: Feste, stabile Cards für Compliance-Informationen

**Features**:
- Grauer Hintergrund (stabiler Look)
- "Pflichtinformation" Badge
- Klare visuelle Unterscheidung von editierbaren Blöcken

## Tab-Struktur

### Daten Tab (DppDataTabV2)
- **Layout**: EditorLayout mit ContentArea
- **Struktur**: Info-Banner + Compliance-Editor in Card
- **Erscheinung**: Fest, stabil, nicht verschiebbar

### Content Tab (DppContentTabV2)
- **Layout**: EditorLayout mit ContentArea
- **Struktur**:
  1. Feste Compliance-Referenz (read-only)
  2. Flexible Content-Blöcke (modular)
  3. "Add section" Button prominent
- **Erscheinung**: Modular, editierbar, verschiebbar

### Frontend Tab (DppFrontendTabV2)
- **Layout**: EditorLayout mit ContentArea
- **Struktur**: ContentSection mit Styling-Editor in Card
- **Erscheinung**: Settings-ähnlich, klar strukturiert

## Visuelle Hierarchie

### Compliance (Fest)
- Graue Cards
- "Pflichtinformation" Badge
- Keine Drag-Handles
- Stabile Erscheinung

### Content Blocks (Flexibel)
- Weiße Cards
- Drag-Handles
- Status-Badges (Live/Draft)
- Hover-Effekte
- Edit/Delete Actions

### "Add Block" Buttons
- Gestrichelter Border
- Hover: Blauer Border + Hintergrund
- Prominent platziert
- Klare Affordance

## Anwendung der Screenshot-Prinzipien

### 1. Card-basiertes Layout ✅
- Alle Inhalte in Cards (`bg-white`, `rounded-lg`, `border`)
- Klare visuelle Abgrenzung
- Konsistente Abstände

### 2. Content/Meta Trennung ✅
- ContentArea links (flex-1)
- Optional Sidebar rechts (w-80)
- Klare visuelle Trennung

### 3. Ruhige Hierarchie ✅
- EditorHeader mit Titel
- ContentSection für Gruppierung
- Keine überladenen Interfaces

### 4. Feste vs. Flexible Sektionen ✅
- Compliance: `isFixed={true}`, graue Cards
- Blocks: `isFixed={false}`, weiße Cards, Drag-Handles

### 5. "Add section" Affordances ✅
- Prominente Buttons
- Gestrichelter Border
- Hover-Effekte
- Klare Platzierung

### 6. Keine Form-Walls ✅
- Card-basierte Struktur
- Sektionen statt lange Listen
- Klare visuelle Gruppierung

## Komponenten-Übersicht

```
src/components/dpp/
├── EditorLayout.tsx          # Haupt-Container
├── ContentSection.tsx        # Sektions-Gruppierung
├── AddBlockButton.tsx        # "Add section" Button
├── ComplianceCard.tsx        # Compliance-Card (optional)
└── tabs/
    ├── DppDataTabV2.tsx      # Daten Tab (refactored)
    ├── DppContentTabV2.tsx   # Content Tab (refactored)
    └── DppFrontendTabV2.tsx  # Frontend Tab (refactored)
```

## Migration

Die neuen V2-Komponenten werden automatisch verwendet, da `DppEditorTabs` auf sie verweist. Die alten Komponenten bleiben als Backup.

## Nächste Schritte

1. ✅ EditorLayout erstellt
2. ✅ ContentSection erstellt
3. ✅ AddBlockButton erstellt
4. ✅ Tab-Komponenten refactored
5. ⏳ Testing & Feinschliff

