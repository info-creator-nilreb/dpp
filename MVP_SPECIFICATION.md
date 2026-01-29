# MVP Specification - Editorial DPP Frontend Redesign

## Executive Summary

Dieses Dokument definiert das Minimum Viable Product (MVP) für das Editorial DPP Frontend Redesign, inklusive User Stories, Acceptance Criteria, Browser-Support und Migrations-Strategie.

---

## 1. MVP-Empfehlung

### 1.1 MVP-Scope

**Phase 1 (MVP) - Core Editorial Experience:**

✅ **Enthalten:**
- Editorial Spine (Hero, Headline, Story-Text)
- Data Sections mit Progressive Disclosure (Collapsed by Default)
- Content Adapter für Template-basierte Struktur
- Responsive Design (Mobile, Tablet, Desktop)
- Basis-Branding (Logo-Platzierung Top-Left)
- Version & Veröffentlichungsdatum (analog zur aktuellen Lösung)
- Automatische Migration bestehender DPPs

❌ **Nicht enthalten (Phase 2):**
- Deep Data Views (Drawer, Modals)
- View-Mode-Toggle (Editorial/Technical)
- Density-Control (Compact/Normal/Detailed)
- Executive Summary Block
- Brand Moments in Data Sections
- Guided Experience für KMU
- Sticky Navigation
- Erweiterte Branding-Optionen (Farben, Fonts, Patterns)

### 1.2 MVP-Block-Types

**Editorial Spine:**
- `hero_image` - Hero-Bild mit optionalem Overlay-Text
- `headline` - Große Überschrift (H1)
- `story_text` - Narrativer Textblock (max. 300 Wörter)

**Data Sections:**
- `data_group` - Gruppierte Felder mit Überschrift
- `key_value_list` - Strukturierte Key-Value-Paare
- `media_gallery` - Bildergalerie (max. 10 Bilder, Lazy Loading)

### 1.3 MVP-Features

**Must-Have:**
1. ✅ Editorial Spine immer sichtbar (oberhalb des Fold)
2. ✅ Data Sections collapsed by default
3. ✅ Section-Header mit Zusammenfassung
4. ✅ Click/Tap zum Expandieren/Einklappen
5. ✅ Max. 3 Sections gleichzeitig expanded (Auto-Collapse)
6. ✅ Responsive Layout (Mobile, Tablet, Desktop)
7. ✅ Logo-Platzierung Top-Left
8. ✅ Version & Veröffentlichungsdatum anzeigen (analog zur aktuellen Lösung)
9. ✅ Automatische Migration bestehender DPPs

**Nice-to-Have (kann in MVP, falls Zeit):**
- ⚠️ "Alle Sections erweitern" Button (für Stakeholder)
- ⚠️ Scroll-to-Section (smooth scroll)

**Explicitly Out-of-Scope:**
- ❌ Deep Data Views
- ❌ View-Mode-Toggle
- ❌ Density-Control
- ❌ Executive Summary
- ❌ Brand Moments
- ❌ Guided Experience
- ❌ Sticky Navigation
- ❌ Erweiterte Branding-Optionen

---

## 2. User Stories mit Acceptance Criteria

**Hinweis:** Die Stories sind nach Priorität sortiert. Story 11a (Version & Veröffentlichungsdatum) wurde nachträglich hinzugefügt, um die Anzeige analog zur aktuellen Lösung sicherzustellen.

### Story 1: Editorial Spine - Hero-Bild anzeigen

**Als:** DPP-Besucher  
**Möchte ich:** Ein Hero-Bild sehen, wenn verfügbar  
**Damit:** Ich sofort visuell verstehe, worum es geht

**Acceptance Criteria:**
- [ ] Hero-Bild wird im Editorial Spine angezeigt (wenn in Template Block order=0 vorhanden)
- [ ] Hero-Bild ist full-bleed (volle Breite, keine Ränder)
- [ ] Desktop: Max. 60vh Höhe
- [ ] Tablet: Max. 50vh Höhe
- [ ] Mobile: Max. 40vh Höhe
- [ ] Bild ist responsive (verschiedene Größen je nach Viewport)
- [ ] Lazy Loading: Bild lädt erst wenn im Viewport
- [ ] Fallback: Wenn kein Hero-Bild, wird Headline prominent angezeigt
- [ ] Alt-Text wird aus DPP-Metadaten oder Template-Field geladen

**Technische Details:**
- Nutzt `next/image` für Optimierung
- Aspect Ratio: 16:9 oder 21:9 (Template-definiert)
- Format: WebP mit JPG-Fallback

---

### Story 2: Editorial Spine - Headline anzeigen

**Als:** DPP-Besucher  
**Möchte ich:** Eine große, markengetreue Überschrift sehen  
**Damit:** Ich sofort den Produktnamen und die Marke erkenne

**Acceptance Criteria:**
- [ ] Headline wird im Editorial Spine angezeigt (Template Block order=0, Field type="headline" oder DPP.name)
- [ ] Desktop: 3-4rem Schriftgröße, Font-Weight 700
- [ ] Tablet: 2.5-3rem Schriftgröße
- [ ] Mobile: 2-2.5rem Schriftgröße
- [ ] Headline ist vollständig lesbar ohne Scroll (oberhalb des Fold)
- [ ] Text ist responsive (kein Overflow auf Mobile)
- [ ] Brand-Name wird hervorgehoben (falls in DPP.brand vorhanden)
- [ ] Fallback: Wenn keine Headline, wird DPP.name verwendet

**Technische Details:**
- HTML-Tag: `<h1>` für SEO
- CSS: `clamp()` für responsive Schriftgrößen
- Max. 2 Zeilen, dann Ellipsis mit Tooltip

---

### Story 3: Editorial Spine - Story-Text anzeigen

**Als:** DPP-Besucher  
**Möchte ich:** Einen narrativen Textblock lesen  
**Damit:** Ich die Marken-Story und Produktwerte verstehe

**Acceptance Criteria:**
- [ ] Story-Text wird im Editorial Spine angezeigt (Template Block order=0, Field type="textarea" oder DPP.description)
- [ ] Max. 300 Wörter (Template-Validierung)
- [ ] Desktop: 2-Spalten-Layout möglich (wenn Text > 150 Wörter)
- [ ] Tablet/Mobile: 1-Spalte, volle Breite minus 16px Padding
- [ ] Text ist gut lesbar (Line-Height 1.6, Font-Size 1rem)
- [ ] Max. 2-3 Absätze
- [ ] Fallback: Wenn kein Story-Text, wird DPP.description verwendet (gekürzt auf 300 Wörter)

**Technische Details:**
- Rich-Text-Support: Basic Formatting (Bold, Italic, Links)
- Text-Truncation: Nach 300 Wörtern mit "..." und "Mehr lesen" Link (optional)

---

### Story 4: Data Sections - Collapsed by Default

**Als:** KMU-Mitarbeiter  
**Möchte ich:** Data Sections eingeklappt sehen  
**Damit:** Ich nicht von zu vielen Informationen überwältigt werde

**Acceptance Criteria:**
- [ ] Alle Data Sections (Template Blocks order > 0) starten eingeklappt
- [ ] Section-Header ist immer sichtbar (auch eingeklappt)
- [ ] Section-Header zeigt Section-Name (Template Block.name)
- [ ] Section-Header zeigt Zusammenfassung (aus Template-Fields oder generiert)
- [ ] Zusammenfassung ist max. 120 Zeichen
- [ ] Desktop: Section-Header hat 56px Höhe (Touch-Target)
- [ ] Mobile: Section-Header hat 48px Höhe (Touch-Target)
- [ ] Section-Header hat visuellen Indikator (Icon: Chevron-Down wenn collapsed, Chevron-Up wenn expanded)

**Technische Details:**
- State-Management: `expandedSections: Set<string>`
- Initial State: Leer (alle collapsed)
- CSS: `transition: height 300ms ease`

---

### Story 5: Data Sections - Expandieren/Einklappen

**Als:** KMU-Mitarbeiter  
**Möchte ich:** Sections per Click/Tap expandieren/einklappen  
**Damit:** Ich nur relevante Informationen sehe

**Acceptance Criteria:**
- [ ] Click/Tap auf Section-Header expandiert Section
- [ ] Click/Tap auf Section-Header (wenn expanded) klappt Section ein
- [ ] Animation: Smooth Expand/Collapse (300ms)
- [ ] Max. 3 Sections gleichzeitig expanded (Auto-Collapse älteste)
- [ ] Scroll-Position bleibt stabil beim Expand/Collapse
- [ ] Keyboard: Enter/Space auf Section-Header expandiert/einklappt
- [ ] Mobile: Touch-Geste funktioniert (kein Double-Tap nötig)
- [ ] Focus-State: Section-Header hat sichtbaren Focus-Ring (Accessibility)

**Technische Details:**
- Event-Handler: `onClick` auf Section-Header
- Auto-Collapse: LRU (Least Recently Used) Strategy
- Keyboard: `onKeyDown` mit Enter/Space
- ARIA: `aria-expanded` Attribute

---

### Story 6: Data Sections - Zusammenfassung anzeigen

**Als:** Stakeholder  
**Möchte ich:** Eine Zusammenfassung jeder Section sehen  
**Damit:** Ich schnell verstehe, was in der Section ist, ohne sie zu öffnen

**Acceptance Criteria:**
- [ ] Zusammenfassung wird im Section-Header angezeigt (immer sichtbar)
- [ ] Zusammenfassung zeigt: "X Felder, Y Bilder, Z Dokumente" oder ähnlich
- [ ] Zusammenfassung ist max. 120 Zeichen
- [ ] Zusammenfassung nutzt `block.presentation.summary` falls vorhanden
- [ ] Fallback: Generiert Zusammenfassung aus ersten 3 Template-Fields
- [ ] Desktop: Zusammenfassung rechts neben Section-Name
- [ ] Mobile: Zusammenfassung unter Section-Name (2-Zeilen-Layout)
- [ ] Zusammenfassung aktualisiert sich wenn DPP-Daten geändert werden

**Technische Details:**
- Summary-Generierung: `generateSectionSummary(block: UnifiedContentBlock)`
- Format: "5 Felder • 3 Bilder • 2 Dokumente"
- Icon-basiert für bessere Scannbarkeit

---

### Story 7: Data Sections - Content anzeigen (Expanded)

**Als:** KMU-Mitarbeiter  
**Möchte ich:** Den vollständigen Content einer Section sehen, wenn ich sie expandiere  
**Damit:** Ich alle Details zu einem Thema sehe

**Acceptance Criteria:**
- [ ] Wenn Section expanded, werden alle Template-Fields angezeigt
- [ ] Fields werden in Template-Field.order-Reihenfolge angezeigt
- [ ] Field-Label wird angezeigt (Template Field.label)
- [ ] Field-Value wird angezeigt (aus DPP-Daten oder leer)
- [ ] Leere Fields zeigen Placeholder-Text (z.B. "Nicht angegeben")
- [ ] Desktop: Fields in 2-Spalten-Grid (wenn > 5 Fields)
- [ ] Tablet: Fields in 1-Spalte
- [ ] Mobile: Fields in 1-Spalte, volle Breite
- [ ] Media-Gallery zeigt Bilder in Grid (3 Spalten Desktop, 2 Tablet, 1 Mobile)
- [ ] Bilder haben Lazy Loading

**Technische Details:**
- Field-Rendering: `renderField(field: TemplateField, value: any)`
- Grid-Layout: CSS Grid mit `grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))`
- Media-Gallery: `next/image` mit Lazy Loading

---

### Story 8: Responsive Design - Mobile

**Als:** Mobile-Nutzer  
**Möchte ich:** Den DPP auf meinem Smartphone gut nutzen können  
**Damit:** Ich auch unterwegs alle Informationen sehe

**Acceptance Criteria:**
- [ ] Layout funktioniert auf Bildschirmen ab 320px Breite
- [ ] Editorial Spine ist vollständig sichtbar ohne Scroll (max. 40vh)
- [ ] Section-Header sind min. 48px hoch (Touch-Target)
- [ ] Alle interaktiven Elemente sind min. 44x44px (Touch-Target)
- [ ] Text ist lesbar ohne Zoom (min. 16px Font-Size)
- [ ] Bilder sind responsive (verschiedene Größen je nach Viewport)
- [ ] Kein horizontaler Scroll
- [ ] Navigation ist Touch-optimiert (kein Hover-State nötig)

**Technische Details:**
- Breakpoint: `@media (max-width: 768px)`
- Touch-Targets: Min. 44x44px (WCAG 2.1)
- Viewport-Meta: `<meta name="viewport" content="width=device-width, initial-scale=1">`

---

### Story 9: Responsive Design - Tablet

**Als:** Tablet-Nutzer  
**Möchte ich:** Den DPP auf meinem Tablet optimal nutzen können  
**Damit:** Ich mehr Informationen auf einmal sehe als auf Mobile

**Acceptance Criteria:**
- [ ] Layout funktioniert auf Bildschirmen 768px - 1024px Breite
- [ ] Editorial Spine nutzt max. 50vh Höhe
- [ ] Data Sections nutzen 2-Spalten-Grid für Summary Cards (wenn vorhanden)
- [ ] Tabellen nutzen Card-Layout (keine horizontalen Tabellen)
- [ ] Section-Header sind 52px hoch
- [ ] Text ist gut lesbar (1rem Font-Size, 1.6 Line-Height)

**Technische Details:**
- Breakpoint: `@media (min-width: 768px) and (max-width: 1024px)`
- Grid: `grid-template-columns: repeat(2, 1fr)`

---

### Story 10: Responsive Design - Desktop

**Als:** Desktop-Nutzer  
**Möchte ich:** Den DPP auf meinem Desktop optimal nutzen können  
**Damit:** Ich alle Informationen effizient durchsehen kann

**Acceptance Criteria:**
- [ ] Layout funktioniert auf Bildschirmen ab 1024px Breite
- [ ] Editorial Spine nutzt max. 60vh Höhe
- [ ] Content-Container ist max. 1200px breit, zentriert
- [ ] Data Sections nutzen 2-Spalten-Grid für Fields (wenn > 5 Fields)
- [ ] Tabellen können horizontal scrollen (falls nötig)
- [ ] Section-Header sind 56px hoch
- [ ] Hover-States funktionieren (für interaktive Elemente)

**Technische Details:**
- Breakpoint: `@media (min-width: 1024px)`
- Container: `max-width: 1200px; margin: 0 auto;`

---

### Story 11: Logo-Platzierung - Top-Left

**Als:** Markenverantwortlicher  
**Möchte ich:** Das Kundenlogo prominent platzieren  
**Damit:** Die Marke sofort erkennbar ist

**Acceptance Criteria:**
- [ ] Logo wird Top-Left angezeigt (wenn in Organization oder DPP vorhanden)
- [ ] Desktop: Logo 120-160px Breite, 24px Abstand von Top/Left
- [ ] Tablet: Logo 120-140px Breite, 20px Abstand
- [ ] Mobile: Logo 100-120px Breite, 16px Abstand
- [ ] Logo hat max. Höhe (aspect-ratio preserved)
- [ ] Logo ist immer sichtbar (auch beim Scroll)
- [ ] Logo ist klickbar (Link zu Organization-Website, falls vorhanden)
- [ ] Fallback: Wenn kein Logo, wird Organization-Name angezeigt

**Technische Details:**
- Position: `position: absolute; top: 24px; left: 24px;`
- Z-Index: `z-index: 10` (über Hero-Bild)
- Responsive: `width: clamp(100px, 12vw, 160px)`

---

### Story 11a: Version & Veröffentlichungsdatum anzeigen

**Als:** DPP-Besucher  
**Möchte ich:** Die Version des DPPs und das Veröffentlichungsdatum sehen  
**Damit:** Ich weiß, welche Version ich sehe und wann sie veröffentlicht wurde

**Acceptance Criteria:**
- [ ] Version wird im Editorial Spine angezeigt (wenn DPP Version-Info hat)
- [ ] Veröffentlichungsdatum wird angezeigt (wenn verfügbar)
- [ ] Platzierung: Dezent im Hero-Overlay unter Brand-Name (analog zur aktuellen Lösung)
- [ ] Desktop: Font-Size 0.875rem, Farbe rgba(255, 255, 255, 0.7) für Overlay
- [ ] Tablet: Font-Size 0.8125rem
- [ ] Mobile: Font-Size 0.75rem
- [ ] Format: "Version X • Veröffentlicht am [Datum]" oder "Version X" (wenn kein Datum)
- [ ] Datum-Format: Deutsche Lokalisierung (z.B. "10. Januar 2025")
- [ ] Fallback: Wenn keine Version-Info, wird nichts angezeigt (kein Fehler)
- [ ] Version-Info ist immer sichtbar (auch wenn Hero-Bild vorhanden)

**Platzierung im Editorial Spine:**
```
Hero-Bild (wenn vorhanden)
  └─ Overlay
      ├─ Headline (Produktname)
      ├─ Brand-Name (wenn vorhanden)
      └─ Version-Info (Version + Veröffentlichungsdatum) ← NEU
```

**Alternative Platzierung (wenn kein Hero-Bild):**
- Version-Info wird unter Headline angezeigt
- Farbe: #7A7A7A (statt weiß)
- Font-Size: 0.875rem

**Technische Details:**
- Datenquelle: `dpp.versionInfo` (aus DppVersion)
- Format: `versionInfo: { version: number, createdAt: Date }`
- Datum-Formatierung: `new Date(versionInfo.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })`
- CSS: `fontSize: "clamp(0.75rem, 1.5vw, 0.875rem)"`, `color: "rgba(255, 255, 255, 0.7)"` (Overlay) oder `"#7A7A7A"` (ohne Overlay)

---

### Story 12: Version-Info in Unified Content Block

**Als:** Entwickler  
**Möchte ich:** Version-Info im Unified Content Block verfügbar haben  
**Damit:** Frontend-Komponenten Version & Datum anzeigen können

**Acceptance Criteria:**
- [ ] UnifiedContentBlock erweitert um `versionInfo?: { version: number, createdAt: Date }`
- [ ] Content Adapter extrahiert Version-Info aus DPP/DppVersion
- [ ] Version-Info wird an Editorial Spine weitergegeben
- [ ] Fallback: Wenn keine Version-Info, bleibt Feld `undefined` (kein Fehler)

**Technische Details:**
```typescript
interface UnifiedContentBlock {
  // ... bestehende Felder
  versionInfo?: {
    version: number
    createdAt: Date
  }
}
```

---

### Story 13: Content Adapter - Template zu Unified Contract

**Als:** Entwickler  
**Möchte ich:** Template-basierte DPPs in Unified Content Blocks transformieren  
**Damit:** Frontend-Komponenten konsistent arbeiten können

**Acceptance Criteria:**
- [ ] Adapter transformiert TemplateBlock → UnifiedContentBlock
- [ ] Adapter nutzt DPP-Daten für Field-Values
- [ ] Adapter berechnet `presentation.layer` basierend auf `block.order` (0 = spine, >0 = data)
- [ ] Adapter setzt `presentation.defaultCollapsed = true` für data layers
- [ ] Adapter generiert `presentation.summary` wenn nicht vorhanden
- [ ] Adapter behandelt fehlende Metadaten graceful (Fallbacks)
- [ ] Adapter validiert Block-Platzierung (Spine-Blocks nur in Spine)
- [ ] Adapter loggt Warnungen bei ungültigen Konfigurationen

**Technische Details:**
- Funktion: `adaptTemplateBlockToUnified(templateBlock, dppContent, supplierConfig)`
- Error-Handling: Try-Catch mit Fallback zu Default-Values
- Logging: Console.warn für ungültige Konfigurationen

---

### Story 14: Automatische Migration - Bestehende DPPs

**Als:** System-Administrator  
**Möchte ich:** Bestehende DPPs automatisch zum neuen Format migrieren  
**Damit:** Alle DPPs das neue Design nutzen können

**Acceptance Criteria:**
- [ ] Migration läuft automatisch beim ersten Aufruf eines DPPs
- [ ] Migration transformiert TemplateBlock-Struktur → UnifiedContentBlock
- [ ] Migration behält alle DPP-Daten (keine Datenverluste)
- [ ] Migration setzt Default-Values für fehlende Metadaten
- [ ] Migration loggt alle Änderungen (für Audit)
- [ ] Migration ist idempotent (mehrfaches Ausführen ist sicher)
- [ ] Migration hat Rollback-Mechanismus (falls Fehler)
- [ ] Migration zeigt Progress-Indicator (für große DPPs)

**Technische Details:**
- Migration-Funktion: `migrateDppToUnifiedFormat(dppId: string)`
- Database: Migration-Flag in DPP-Tabelle (`migratedToUnified: boolean`)
- Batch-Processing: Für > 100 DPPs in Background-Job
- Error-Handling: Rollback bei Fehler, Logging

---

### Story 15: Performance - Lazy Loading

**Als:** Nutzer  
**Möchte ich:** Schnelle Ladezeiten  
**Damit:** Ich nicht lange warten muss

**Acceptance Criteria:**
- [ ] Hero-Bild lädt mit Priority (above-the-fold)
- [ ] Andere Bilder nutzen Lazy Loading (laden erst bei Scroll in Viewport)
- [ ] Sections rendern nur wenn expanded (Virtual Rendering)
- [ ] Initial Bundle-Size < 200KB gzipped
- [ ] Lighthouse Performance Score > 90
- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] FCP (First Contentful Paint) < 1.8s

**Technische Details:**
- Next.js Image: `priority` für Hero, `loading="lazy"` für andere
- Code-Splitting: Dynamic Imports für nicht-kritische Komponenten
- Bundle-Analysis: `@next/bundle-analyzer`

---

### Story 16: Accessibility - Keyboard Navigation

**Als:** Screen-Reader-Nutzer  
**Möchte ich:** Den DPP mit Tastatur navigieren können  
**Damit:** Ich alle Informationen zugänglich habe

**Acceptance Criteria:**
- [ ] Tab-Navigation funktioniert durch alle interaktiven Elemente
- [ ] Section-Header sind fokussierbar (Tab)
- [ ] Enter/Space expandiert/einklappt Section
- [ ] Focus-State ist sichtbar (Focus-Ring)
- [ ] ARIA-Labels sind vorhanden (`aria-expanded`, `aria-label`)
- [ ] Screen-Reader liest Section-Name und Zusammenfassung
- [ ] Skip-Links für Navigation (optional)

**Technische Details:**
- ARIA: `aria-expanded={isExpanded}`, `aria-label={sectionName}`
- Keyboard: `onKeyDown` mit Enter/Space
- Focus: `:focus-visible` für sichtbaren Focus-Ring

---

## 3. Browser-Support

### 3.1 Unterstützte Browser

**Desktop:**
- ✅ Chrome: Aktuelle Version + letzte 3 Versionen
- ✅ Safari: Aktuelle Version + letzte 3 Versionen
- ✅ Firefox: Aktuelle Version + letzte 3 Versionen
- ✅ Edge: Aktuelle Version + letzte 3 Versionen

**Mobile:**
- ✅ Chrome Mobile (Android): Aktuelle Version + letzte 3 Versionen
- ✅ Safari iOS: Aktuelle Version + letzte 3 Versionen
- ✅ Firefox Mobile (Android): Aktuelle Version + letzte 3 Versionen

**Beispiel (Stand Januar 2025):**
- Chrome: 120, 119, 118, 117
- Safari: 17, 16, 15, 14
- Firefox: 121, 120, 119, 118
- Edge: 120, 119, 118, 117

### 3.2 Feature-Detection

**Polyfills (falls nötig):**
- CSS Grid: Nicht nötig (alle unterstützten Browser)
- Intersection Observer: Polyfill für ältere Browser (optional)
- CSS Custom Properties: Nicht nötig (alle unterstützten Browser)

**Progressive Enhancement:**
- Basis-Funktionalität funktioniert ohne JavaScript (Server-Side Rendering)
- JavaScript verbessert UX (Expand/Collapse, Lazy Loading)

### 3.3 Testing-Strategie

**Browser-Testing:**
- [ ] Chrome (Desktop & Mobile) - Aktuelle + 3 Versionen
- [ ] Safari (Desktop & iOS) - Aktuelle + 3 Versionen
- [ ] Firefox (Desktop & Mobile) - Aktuelle + 3 Versionen
- [ ] Edge (Desktop) - Aktuelle + 3 Versionen

**Tools:**
- BrowserStack oder ähnlich für Cross-Browser-Testing
- Lighthouse für Performance-Testing
- WAVE oder ähnlich für Accessibility-Testing

---

## 4. Automatische Migration - Detaillierte Strategie

### 4.1 Migrations-Prozess

**Trigger:**
- Automatisch beim ersten Aufruf eines DPPs nach Deployment
- Oder: Batch-Job für alle DPPs (Background-Processing)

**Schritte:**

1. **DPP laden** (mit Template und DPP-Content)
2. **Migration-Flag prüfen** (`dpp.migratedToUnified`)
3. **Wenn nicht migriert:**
   - Transformiere TemplateBlocks → UnifiedContentBlocks
   - Setze Default-Values für fehlende Metadaten
   - Speichere Migration-Flag
   - Logge Migration
4. **Wenn migriert:**
   - Nutze bereits transformierte Daten (Cache)

### 4.2 Migrations-Logik

```typescript
interface MigrationResult {
  dppId: string
  migrated: boolean
  blocksTransformed: number
  warnings: string[]
  errors: string[]
}

async function migrateDppToUnifiedFormat(dppId: string): Promise<MigrationResult> {
  // 1. Lade DPP mit Template
  const dpp = await loadDppWithTemplate(dppId)
  
  // 2. Prüfe Migration-Flag
  if (dpp.migratedToUnified) {
    return { dppId, migrated: false, blocksTransformed: 0, warnings: [], errors: [] }
  }
  
  // 3. Transformiere Blocks
  const unifiedBlocks: UnifiedContentBlock[] = []
  const warnings: string[] = []
  
  for (const templateBlock of dpp.template.blocks) {
    try {
      const unifiedBlock = adaptTemplateBlockToUnified(
        templateBlock,
        dpp.content,
        dpp.supplierConfigs?.[templateBlock.id]
      )
      unifiedBlocks.push(unifiedBlock)
    } catch (error) {
      warnings.push(`Block ${templateBlock.id}: ${error.message}`)
    }
  }
  
  // 4. Speichere Migration-Flag
  await markDppAsMigrated(dppId)
  
  // 5. Logge Migration
  await logMigration({
    dppId,
    timestamp: new Date(),
    blocksTransformed: unifiedBlocks.length,
    warnings
  })
  
  return {
    dppId,
    migrated: true,
    blocksTransformed: unifiedBlocks.length,
    warnings,
    errors: []
  }
}
```

### 4.3 Default-Values für fehlende Metadaten

```typescript
function enrichBlockWithDefaults(block: Partial<UnifiedContentBlock>): UnifiedContentBlock {
  return {
    id: block.id || generateId(),
    blockKey: block.blockKey || "unknown",
    displayName: block.displayName || "Unbenannter Block",
    order: block.order ?? 999,
    content: block.content || { fields: {} },
    presentation: {
      layer: block.presentation?.layer || 
        (block.order === 0 ? "spine" : "data"),
      defaultCollapsed: block.presentation?.defaultCollapsed ?? 
        (block.order === 0 ? false : true),
      summary: block.presentation?.summary || 
        generateSummaryFromContent(block.content),
      density: block.presentation?.density || "normal",
      allowedInEditorialSpine: block.presentation?.allowedInEditorialSpine ?? 
        (block.order === 0)
    },
    attribution: block.attribution,
    features: block.features
  }
}
```

### 4.4 Batch-Migration (für große DPP-Anzahlen)

```typescript
async function batchMigrateDpps(organizationId?: string): Promise<MigrationReport> {
  // 1. Lade alle nicht-migrierten DPPs
  const dpps = await loadUnmigratedDpps(organizationId)
  
  // 2. Batch-Processing (10 DPPs gleichzeitig)
  const batchSize = 10
  const results: MigrationResult[] = []
  
  for (let i = 0; i < dpps.length; i += batchSize) {
    const batch = dpps.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(dpp => migrateDppToUnifiedFormat(dpp.id))
    )
    results.push(...batchResults)
    
    // Progress-Logging
    console.log(`Migrated ${i + batch.length} / ${dpps.length} DPPs`)
  }
  
  // 3. Generiere Report
  return {
    total: dpps.length,
    migrated: results.filter(r => r.migrated).length,
    failed: results.filter(r => r.errors.length > 0).length,
    warnings: results.flatMap(r => r.warnings)
  }
}
```

### 4.5 Rollback-Mechanismus

```typescript
async function rollbackMigration(dppId: string): Promise<void> {
  // 1. Entferne Migration-Flag
  await removeMigrationFlag(dppId)
  
  // 2. Lösche transformierte Daten (falls gespeichert)
  await deleteUnifiedContent(dppId)
  
  // 3. Logge Rollback
  await logRollback({ dppId, timestamp: new Date() })
}
```

### 4.6 Migration-Monitoring

**Metriken:**
- Anzahl migrierter DPPs
- Anzahl fehlgeschlagener Migrationen
- Durchschnittliche Migrations-Zeit
- Anzahl Warnungen

**Alerts:**
- Fehlerrate > 5% → Alert an DevOps
- Migrations-Zeit > 5s pro DPP → Performance-Review

---

## 5. Definition of Done

Ein Feature ist "Done", wenn:

- [ ] Alle Acceptance Criteria erfüllt sind
- [ ] Code ist reviewed und approved
- [ ] Unit-Tests geschrieben (Coverage > 80%)
- [ ] Integration-Tests geschrieben
- [ ] E2E-Tests geschrieben (kritische User Flows)
- [ ] Browser-Testing auf allen unterstützten Browsern
- [ ] Accessibility-Testing (WCAG 2.1 Level AA)
- [ ] Performance-Testing (Lighthouse Score > 90)
- [ ] Dokumentation aktualisiert
- [ ] Migration getestet (mit Test-DPPs)

---

## 6. Risiken & Mitigation

### 6.1 Risiko: Migration schlägt fehl

**Mitigation:**
- Rollback-Mechanismus
- Batch-Processing mit Fehler-Isolation
- Monitoring & Alerts

### 6.2 Risiko: Performance bei vielen DPPs

**Mitigation:**
- Lazy Loading
- Virtual Rendering
- Caching-Strategie

### 6.3 Risiko: Browser-Kompatibilität

**Mitigation:**
- Feature-Detection
- Progressive Enhancement
- Polyfills (falls nötig)

---

## 7. Nächste Schritte

1. **Sprint-Planning:** User Stories in Sprints aufteilen
2. **Design-Review:** UI/UX-Design für MVP-Komponenten
3. **API-Spec:** Backend-Endpoints für Content-Fetching
4. **Migration-Testing:** Test-Migration mit Sample-DPPs
5. **Browser-Testing:** Setup BrowserStack oder ähnlich

---

**Dokument-Version:** 1.0  
**Erstellt:** 2025-01-10  
**Autor:** Product Owner
