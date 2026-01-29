# Debug-Anleitung: Accordion-Daten nicht sichtbar

## Dev Tools Prüfungen

### 1. Console-Logs prüfen
Öffne die Browser-Console (F12 oder Cmd+Option+I) und prüfe:

```javascript
// Sollte erscheinen:
[DataSectionsContainer] Initialisiere expanded Sections: ["data-1", "data-2"]
[DataSectionsContainer] Template Blocks: [...]
[DataSection] Rendering content for: Materialien & Zusammensetzung Fields: 12
[SectionContent] Block: Materialien & Zusammensetzung Alle Felder: 12 [...]
```

### 2. React DevTools prüfen
1. Installiere React DevTools Extension (falls nicht vorhanden)
2. Öffne React DevTools Tab
3. Suche nach `DataSectionsContainer`
4. Prüfe:
   - `expandedSections` State: Sollte `Set(2)` mit `data-1` und `data-2` enthalten
   - `templateBlocks`: Sollte 5 Blöcke enthalten
   - Jeder `DataSection` sollte `isExpanded: true` haben (für erste 2)

### 3. DOM-Inspector prüfen
1. Rechtsklick auf einen Accordion-Header → "Untersuchen"
2. Prüfe:
   - Gibt es ein `<div class="data-section-content-minimal">` Element?
   - Ist `aria-expanded="true"` auf dem Button?
   - Gibt es Content innerhalb des divs?

### 4. JavaScript-Fehler prüfen
1. Console Tab öffnen
2. Prüfe auf rote Fehlermeldungen
3. Besonders prüfen:
   - `Cannot read property 'fields' of undefined`
   - `Cannot read property 'content' of undefined`
   - React Rendering Errors

### 5. Network Tab prüfen
1. Network Tab öffnen
2. Prüfe ob alle Assets geladen werden
3. Prüfe ob API-Calls erfolgreich sind (falls vorhanden)

## Manuelle Prüfungen im Code

### Prüfe in Console:
```javascript
// Im Browser Console ausführen:
const container = document.querySelector('[class*="data-section"]')
console.log('Container gefunden:', container)

// Prüfe alle Sections:
const sections = document.querySelectorAll('.data-section-minimal')
console.log('Anzahl Sections:', sections.length)
sections.forEach((section, idx) => {
  const isExpanded = section.querySelector('[aria-expanded="true"]')
  const content = section.querySelector('.data-section-content-minimal')
  console.log(`Section ${idx}:`, {
    expanded: !!isExpanded,
    hasContent: !!content,
    contentVisible: content?.style.display !== 'none'
  })
})
```

### Prüfe React State:
```javascript
// In React DevTools:
// 1. Finde DataSectionsContainer Component
// 2. Prüfe Props: blocks (sollte 5+ Blöcke enthalten)
// 3. Prüfe State: expandedSections (sollte Set mit 2 IDs enthalten)
// 4. Prüfe jedes DataSection: isExpanded prop
```

## Häufige Probleme

1. **Sections nicht expanded:**
   - Prüfe `expandedSections` State
   - Prüfe ob `useEffect` ausgeführt wird
   - Prüfe ob `templateBlocks` korrekt gefiltert werden

2. **Felder werden herausgefiltert:**
   - Prüfe `fields` Array in SectionContent
   - Prüfe ob Filter-Logik zu strikt ist
   - Prüfe ob `block.content.fields` existiert

3. **Content wird nicht gerendert:**
   - Prüfe ob `isExpanded === true`
   - Prüfe ob `SectionContent` Component gerendert wird
   - Prüfe ob es CSS-Probleme gibt (display: none, visibility: hidden)

4. **CSS-Probleme:**
   - Prüfe ob `.data-section-content-minimal` sichtbar ist
   - Prüfe ob `animation: fadeIn` funktioniert
   - Prüfe ob `paddingTop` korrekt ist
