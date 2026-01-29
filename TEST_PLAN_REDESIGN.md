# Test Plan: Editorial DPP Frontend Redesign

## Übersicht
Test-Plan für die neue Editorial DPP Frontend-Implementierung mit Editorial Spine + Data Sections.

## 1. Foundation Tests

### 1.1 Content Adapter
- [ ] **Template → Unified Block Transformation**
  - Test: TemplateBlock mit verschiedenen Field-Types wird korrekt transformiert
  - Erwartung: Alle Fields werden in `content.fields` gemappt
  - Erwartung: `presentation.layer` ist "spine" für order=0, sonst "data"
  
- [ ] **Media-Extraktion**
  - Test: Media-Files werden korrekt zu Field-Values gemappt
  - Erwartung: Media mit `fieldId` werden dem entsprechenden Field zugeordnet
  - Erwartung: Komma-separierte URLs für mehrere Media pro Field
  
- [ ] **Zusammenfassung-Generierung**
  - Test: Summary wird korrekt generiert
  - Erwartung: "X Felder • Y Bilder • Z Dokumente" Format
  - Erwartung: Leere Sections zeigen "Keine Daten verfügbar"

### 1.2 DPP Transformer
- [ ] **DPP → Unified Blocks**
  - Test: DPP mit Template wird korrekt transformiert
  - Erwartung: Alle TemplateBlocks werden zu UnifiedContentBlocks
  - Erwartung: DPP-Daten werden korrekt in Fields gemappt
  
- [ ] **Version-Info**
  - Test: Version-Info wird korrekt übergeben
  - Erwartung: `versionInfo` ist in jedem Block vorhanden (wenn aktiviert)

## 2. Editorial Spine Tests

### 2.1 Hero Image Block
- [ ] **Hero-Bild Rendering**
  - Test: Hero-Bild wird angezeigt wenn vorhanden
  - Erwartung: Bild mit 16:9 Aspect Ratio
  - Erwartung: Overlay mit Headline, Brand, Version-Info
  
- [ ] **Fallback ohne Hero-Bild**
  - Test: Headline wird angezeigt wenn kein Hero-Bild
  - Erwartung: HeadlineBlock wird gerendert

### 2.2 Headline Block
- [ ] **Headline-Extraktion**
  - Test: Headline wird aus Spine-Block extrahiert
  - Erwartung: Field mit key="name" oder type="text" wird verwendet
  - Erwartung: Fallback auf `dppName` wenn kein Field gefunden

### 2.3 Story Text Block
- [ ] **Story-Text Rendering**
  - Test: Story-Text wird angezeigt wenn vorhanden
  - Erwartung: Text wird auf max. 300 Wörter gekürzt
  - Erwartung: 2-Spalten Layout bei > 150 Wörtern (Desktop)

### 2.4 Version Info
- [ ] **Version-Info Display**
  - Test: Version und Datum werden angezeigt
  - Erwartung: Format: "Version X • Veröffentlicht am DD. Monat YYYY"
  - Erwartung: Im Hero-Overlay oder separat

## 3. Data Sections Tests

### 3.1 Section Header
- [ ] **Section Name**
  - Test: Block-Name wird als Header angezeigt
  - Erwartung: `block.displayName` wird verwendet
  
- [ ] **Zusammenfassung**
  - Test: Summary wird unter Header angezeigt
  - Erwartung: Format: "X Felder • Y Bilder • Z Dokumente"
  
- [ ] **Expand/Collapse Icon**
  - Test: Icon ändert sich (+ / −)
  - Erwartung: "+" wenn collapsed, "−" wenn expanded

### 3.2 Section Content
- [ ] **Fields Rendering**
  - Test: Alle Fields werden angezeigt
  - Erwartung: Label + Value für jedes Field
  - Erwartung: "Nicht angegeben" für leere Fields
  
- [ ] **Grid Layout**
  - Test: Grid-Layout bei > 5 Fields
  - Erwartung: `repeat(auto-fit, minmax(300px, 1fr))` Grid
  - Erwartung: Flex-Layout bei ≤ 5 Fields

### 3.3 Media Gallery
- [ ] **Bildergalerie**
  - Test: Bilder werden in Grid angezeigt
  - Erwartung: 3 Spalten (Desktop), 2 Spalten (Tablet), 1 Spalte (Mobile)
  - Erwartung: Max. 10 Bilder angezeigt
  
- [ ] **Media-Extraktion**
  - Test: Komma-separierte URLs werden korrekt geparst
  - Erwartung: Jede URL wird als separates Bild gerendert

### 3.4 Expand/Collapse Logic
- [ ] **Auto-Collapse**
  - Test: Max. 3 Sections expanded gleichzeitig
  - Erwartung: Älteste Section wird auto-collapsed wenn 4. Section expanded wird
  - Erwartung: LRU (Least Recently Used) Logik funktioniert

## 4. Responsive Design Tests

### 4.1 Mobile (< 768px)
- [ ] **Hero-Bild**
  - Test: Hero-Bild ist responsive
  - Erwartung: Max-Height passt sich an
  
- [ ] **Data Sections**
  - Test: Sections sind touch-optimiert
  - Erwartung: Min-Height 48px für Header
  - Erwartung: Ausreichend große Touch-Targets
  
- [ ] **Media Gallery**
  - Test: 1-Spalten Layout
  - Erwartung: Alle Bilder untereinander

### 4.2 Tablet (768px - 1024px)
- [ ] **Media Gallery**
  - Test: 2-Spalten Layout
  - Erwartung: 2 Bilder nebeneinander

### 4.3 Desktop (≥ 1024px)
- [ ] **Media Gallery**
  - Test: 3-Spalten Layout
  - Erwartung: 3 Bilder nebeneinander
  
- [ ] **Story Text**
  - Test: 2-Spalten Layout bei > 150 Wörtern
  - Erwartung: Text in 2 Spalten

## 5. Edge Cases

### 5.1 Leere DPPs
- [ ] **Keine Daten**
  - Test: DPP ohne Fields
  - Erwartung: "Keine Daten verfügbar" wird angezeigt
  - Erwartung: Sections sind collapsed

### 5.2 Fehlende Media
- [ ] **Keine Bilder**
  - Test: DPP ohne Media
  - Erwartung: Media Gallery wird nicht gerendert
  - Erwartung: Summary zeigt "0 Bilder"

### 5.3 Fehlende Template**
- [ ] **Template nicht gefunden**
  - Test: DPP mit ungültiger Template-ID
  - Erwartung: 404 Not Found

### 5.4 Viele Sections
- [ ] **Performance**
  - Test: DPP mit 20+ Sections
  - Erwartung: Keine Performance-Probleme
  - Erwartung: Auto-Collapse funktioniert

## 6. Integration Tests

### 6.1 Public DPP Page
- [ ] **Rendering**
  - Test: Public DPP Page rendert korrekt
  - Erwartung: EditorialDppViewRedesign wird verwendet
  - Erwartung: Alle Props werden korrekt übergeben

### 6.2 Logo-Platzierung
- [ ] **Logo Display**
  - Test: Logo wird angezeigt wenn vorhanden
  - Erwartung: Top-Left Position
  - Erwartung: Link zu Website wenn vorhanden

## 7. Browser-Kompatibilität

### 7.1 Chrome (aktuell + letzte 3 Versionen)
- [ ] **Rendering**
  - Test: Alle Komponenten rendern korrekt
  - Erwartung: Keine Layout-Probleme

### 7.2 Safari (aktuell + letzte 3 Versionen)
- [ ] **Rendering**
  - Test: Alle Komponenten rendern korrekt
  - Erwartung: Keine Layout-Probleme

### 7.3 Firefox (aktuell + letzte 3 Versionen)
- [ ] **Rendering**
  - Test: Alle Komponenten rendern korrekt
  - Erwartung: Keine Layout-Probleme

### 7.4 Edge (aktuell + letzte 3 Versionen)
- [ ] **Rendering**
  - Test: Alle Komponenten rendern korrekt
  - Erwartung: Keine Layout-Probleme

## 8. Accessibility Tests

### 8.1 Keyboard Navigation
- [ ] **Section Toggle**
  - Test: Sections können mit Tastatur erweitert werden
  - Erwartung: Tab-Navigation funktioniert
  - Erwartung: Enter/Space toggle Sections

### 8.2 Screen Reader
- [ ] **ARIA Labels**
  - Test: ARIA-Labels sind vorhanden
  - Erwartung: `aria-expanded` auf Section Headers
  - Erwartung: `aria-label` für Toggle-Buttons

## 9. Performance Tests

### 9.1 Initial Load
- [ ] **Ladezeit**
  - Test: Page lädt schnell
  - Erwartung: < 2s für initiales Rendering

### 9.2 Lazy Loading
- [ ] **Bilder**
  - Test: Bilder werden lazy geladen
  - Erwartung: Nur erste 3 Bilder mit priority

## 10. Migration Tests

### 10.1 Bestehende DPPs
- [ ] **Automatische Migration**
  - Test: Bestehende DPPs funktionieren
  - Erwartung: Keine Breaking Changes
  - Erwartung: Alle Daten werden korrekt angezeigt

---

## Test-Status
- **Foundation:** ⏳ In Arbeit
- **Editorial Spine:** ⏳ In Arbeit
- **Data Sections:** ⏳ In Arbeit
- **Responsive Design:** ⏳ In Arbeit
- **Edge Cases:** ⏳ In Arbeit
- **Integration:** ⏳ In Arbeit
- **Browser-Kompatibilität:** ⏳ In Arbeit
- **Accessibility:** ⏳ In Arbeit
- **Performance:** ⏳ In Arbeit
- **Migration:** ⏳ In Arbeit
