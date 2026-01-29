# Test-Seite für Editorial DPP Redesign

## Übersicht

Die Test-Seite `/public/test-dpp` zeigt das Editorial DPP Redesign mit exemplarischen Mock-Daten. Sie ist nützlich für:

- **Entwicklung & Testing:** Testen des Redesigns ohne veröffentlichte DPPs
- **Demonstration:** Zeigen des neuen Frontends an Stakeholdern
- **Design-Review:** Überprüfen der UX-Patterns und Responsive Design

## Zugriff

Die Test-Seite ist unter folgender URL erreichbar:

```
http://localhost:3000/public/test-dpp
```

(oder entsprechend Ihrer Development-URL)

## Enthaltene Features

Die Test-Seite demonstriert alle Features des Redesigns:

### ✅ Editorial Spine
- **Hero-Bild** mit Overlay (Headline, Brand, Version-Info)
- **Headline** (Produktname)
- **Story-Text** (Produktbeschreibung)

### ✅ Data Sections (5 Sections)
1. **Materialien & Zusammensetzung**
   - 4 Felder + 2 Bilder
   - Zeigt Material-Details und Produktionsprozess

2. **Produktion & Herkunft**
   - 5 Felder
   - Herkunftsland, Marke, Zertifizierungen

3. **Nutzung, Pflege & Lebensdauer**
   - 5 Felder + 1 Bild
   - Lebensdauer, Reparierbarkeit, Pflegehinweise

4. **Rücknahme & Second Life**
   - 5 Felder
   - Rücknahme-Service, Recycling-Informationen

5. **Konformitätserklärung & Compliance**
   - 4 Felder
   - Regulatorische Compliance, SKU, GTIN

### ✅ Responsive Design
- **Mobile:** 1-Spalten Layout, optimierte Touch-Targets
- **Tablet:** 2-Spalten Media Gallery
- **Desktop:** 3-Spalten Media Gallery, 2-Spalten Story-Text

### ✅ Interaktive Features
- **Expand/Collapse:** Sections können erweitert/eingeklappt werden
- **Auto-Collapse:** Max. 3 Sections gleichzeitig expanded
- **Media Gallery:** Responsive Bildergalerie

## Mock-Daten

Die Test-Seite verwendet exemplarische Daten für eine **Bio-Baumwoll Jeans**:

- **Produktname:** "Nachhaltige Bio-Baumwoll Jeans"
- **Marke:** "EcoFashion"
- **Version:** 1
- **Veröffentlichungsdatum:** 15. Januar 2024

### Bilder

Die Test-Seite nutzt Unsplash-Bilder als Platzhalter:
- Hero-Bild: Jeans-Produktbild
- Material-Details: Baumwoll-Close-up
- Produktionsprozess: Textilproduktion
- Pflege-Video: Wäsche-Pflege

**Hinweis:** In Produktion würden diese durch echte Produktbilder ersetzt.

## Anpassung der Mock-Daten

Um die Mock-Daten anzupassen, bearbeiten Sie:

```
src/app/public/test-dpp/page.tsx
```

### Beispiel: Neues Feld hinzufügen

```typescript
{
  value: 'Neuer Wert',
  type: 'text',
  label: 'Neues Feld',
  key: 'newField'
}
```

### Beispiel: Neues Bild hinzufügen

```typescript
{
  value: 'https://example.com/image.jpg',
  type: 'file-image',
  label: 'Bild-Beschreibung',
  key: 'imageKey'
}
```

## Unterschiede zur Produktions-Seite

| Feature | Test-Seite | Produktions-Seite |
|---------|-----------|-------------------|
| Datenquelle | Mock-Daten (hardcoded) | Datenbank (Prisma) |
| Rendering | Client-Side ("use client") | Server-Side (SSR) |
| Template | Statisch | Dynamisch aus Template |
| Media | Unsplash-URLs | Storage-URLs |
| Version-Info | Mock-Datum | Echte DPP-Version |

## Troubleshooting

### Seite lädt nicht
- Prüfen Sie, ob der Development-Server läuft
- Prüfen Sie die Browser-Konsole auf Fehler

### Bilder werden nicht angezeigt
- Prüfen Sie die Internet-Verbindung (Unsplash-Bilder)
- Prüfen Sie die Browser-Konsole auf CORS-Fehler

### Sections expandieren nicht
- Prüfen Sie die Browser-Konsole auf JavaScript-Fehler
- Prüfen Sie, ob alle Komponenten korrekt importiert sind

## Nächste Schritte

1. **Testen Sie die Seite** im Browser
2. **Prüfen Sie Responsive Design** (Mobile/Tablet/Desktop)
3. **Testen Sie Interaktionen** (Expand/Collapse)
4. **Passen Sie Mock-Daten an** für Ihre Test-Szenarien

## Weitere Informationen

- **UX-System-Design:** `UX_SYSTEM_DESIGN.md`
- **Wireframes:** `WIREFRAMES.md`
- **MVP-Spezifikation:** `MVP_SPECIFICATION.md`
- **Test-Plan:** `TEST_PLAN_REDESIGN.md`
