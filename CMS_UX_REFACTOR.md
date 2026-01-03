# CMS UX Refactor - Gutenberg-Inspired

## Übersicht

Der DPP-Editor wurde zu einer modernen, WordPress/Gutenberg-inspirierten UX refactoriert, die klar zwischen Compliance-Daten, Content-Blöcken und Frontend-Styling trennt.

## Editor-Struktur

### Tab-basierte Navigation

```
/app/dpps/:dppId
├── Daten (Tab)
│   └── Compliance-Informationen (ESPR-konform)
├── Content (Tab)
│   ├── Compliance-Referenz (read-only)
│   └── Content-Blöcke (CMS)
└── Frontend (Tab)
    └── Branding & Styling (Premium)
```

## 1. Daten Tab

**Zweck:** Bearbeitung von ESPR-konformen Pflichtinformationen

**Features:**
- Strukturierte Formulare
- Klare Markierung als "Pflichtinformationen"
- Info-Banner mit Erklärung
- Kein Drag & Drop
- Keine CMS-Aktionen

**UI:**
- Moderne Formularfelder
- Klare visuelle Hierarchie
- Beruhigende Info-Hinweise

## 2. Content Tab - Gutenberg-Inspired

**Zweck:** Block-basiertes CMS für optionale Inhalte

### A. Compliance-Referenz (Read-only)

- Graue, gesperrte Sektionen
- Nur zur Orientierung
- Nicht editierbar, nicht verschiebbar
- Zeigt alle Pflichtinformationen an

### B. Content-Blöcke

**Block Cards:**
- Moderne Card-basierte UI
- Drag & Drop Reordering (HTML5 Drag & Drop)
- Inline-Editing (klick auf Block öffnet Editor)
- Status-Badges (Draft/Published)
- Drag Handle (⋮⋮)
- Hover-Actions (Edit, Delete)

**Block Picker Modal:**
- Card-basierte Auswahl
- Icons, Titel, Beschreibung
- Verfügbare vs. gesperrte Blöcke
- Template-Auswahl
- Moderne Modal mit Backdrop

**Empty State:**
- Klare Erklärung
- CTA zum ersten Block erstellen
- Visuell ansprechend

## 3. Frontend Tab

**Zweck:** Globales Branding & Styling (Premium)

**Features:**
- Logo-Upload mit Preview
- Farb-Auswahl (Primary, Secondary, Accent)
- Font-Auswahl (vordefinierte Liste)
- Spacing-Konfiguration
- Moderne Formular-UI

**Capability-Check:**
- Sichtbar für alle
- Aktiviert nur für Premium
- Upgrade-Hinweis für Non-Premium

## UX-Qualitätsstandards

### Modern
- Card-basierte UI
- Smooth Transitions
- Moderne Icons (SVG)
- Klare Typografie

### Calm
- Beruhigende Farben (Grau, Blau)
- Ausreichend Whitespace
- Klare Hierarchie
- Keine überladenen Interfaces

### Structured
- Klare Tab-Trennung
- Logische Gruppierung
- Konsistente Patterns
- Vorhersehbare Navigation

### Premium
- Hochwertige Animationen
- Polierte Interaktionen
- Professionelle Farbpalette
- Premium-Feel

## Technische Details

### Drag & Drop
- HTML5 Drag & Drop API
- Visuelle Drop-Indikatoren
- Smooth Transitions
- Touch-friendly

### Block Editing
- Inline-Editing in Cards
- Automatische Änderungsverfolgung
- Save/Cancel Actions
- Block-spezifische Editoren

### Capability Awareness
- Feature-basierte Sichtbarkeit
- Upgrade-Hinweise
- Gesperrte Blöcke sichtbar aber disabled
- Klare Erklärungen

## Komponenten-Struktur

```
src/components/
├── dpp/
│   ├── DppEditorTabs.tsx          # Haupt-Tab-Komponente
│   └── tabs/
│       ├── DppDataTab.tsx         # Compliance-Daten
│       ├── DppContentTab.tsx      # CMS Content
│       └── DppFrontendTab.tsx     # Styling
└── cms/
    ├── GutenbergEditor.tsx        # Gutenberg-Editor
    ├── ComplianceReference.tsx    # Read-only Compliance
    ├── ContentBlockCard.tsx       # Block Card
    ├── ContentBlockEditor.tsx     # Inline Editor
    ├── BlockPickerModal.tsx       # Block-Auswahl
    └── blocks/
        ├── StorytellingBlockEditor.tsx
        ├── QuickPollBlockEditor.tsx
        └── ImageTextBlockEditor.tsx
```

## Compliance vs. Content Trennung

### Compliance (Daten Tab)
- ESPR-konform
- Template-basiert
- Nicht veränderbar
- Immer vorhanden
- Nicht verschiebbar

### Content (Content Tab)
- Optional
- Block-basiert
- Vollständig editierbar
- Verschiebbar
- Capability-gesteuert

### Frontend (Frontend Tab)
- Premium-only
- Globales Branding
- Nicht block-spezifisch
- Sofort sichtbar nach Veröffentlichung

## Public Rendering

Die Public-Ansicht rendert:
1. Compliance-Sektionen (immer)
2. CMS Content-Blöcke (wenn verfügbar)

Strikte Reihenfolge, keine Vermischung.

