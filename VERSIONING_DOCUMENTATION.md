# DPP Versionierung - Dokumentation

## Konzept: Draft vs. Versionen

### Grundprinzip

- **Draft (Entwurf)**: Der `Dpp`-Eintrag repräsentiert IMMER den aktuellen, editierbaren Entwurf
- **Versionen**: Veröffentlichte Versionen werden in `DppVersion` gespeichert und sind **unveränderlich** (immutable)
- **Änderungen**: Erfolgen IMMER am Draft
- **Veröffentlichung**: Erstellt IMMER eine neue Version als Snapshot des aktuellen Drafts

### Warum diese Trennung?

1. **ESPR-Konformität**: Veröffentlichte Versionen müssen unveränderlich sein für regulatorische Compliance
2. **Audit-Trail**: Vollständige Nachvollziehbarkeit (Wer hat wann welche Version veröffentlicht?)
3. **Flexibilität**: Draft kann kontinuierlich bearbeitet werden, ohne bestehende Versionen zu beeinträchtigen

## Datenmodell

### Dpp (Draft)
- Repräsentiert den editierbaren Entwurf
- Status: `DRAFT` (noch nie veröffentlicht) oder `PUBLISHED` (hat mind. 1 Version)
- Alle Felder editierbar

### DppVersion (Veröffentlichte Version)
- **Unveränderlich** (immutable) nach Erstellung
- Enthält vollständigen Snapshot aller DPP-Daten
- Metadaten für ESPR/Audit:
  - `version`: Fortlaufende Versionsnummer (1, 2, 3, ...)
  - `createdAt`: Veröffentlichungsdatum
  - `createdByUserId`: Bearbeiter (User)

### Beziehung
- Ein `Dpp` kann mehrere `DppVersion` haben (1:N)
- `DppVersion` referenziert immer den `Dpp` (Draft)

## Publish-Funktion

### Verfügbarkeit

Die Publish-Funktion ist verfügbar:

1. **Bei Neuanlage** (`/app/dpps/new`):
   - "Als Entwurf speichern" → Erstellt Draft
   - "Veröffentlichen" → Erstellt Draft + erste Version

2. **Im Editor** (`/app/dpps/[id]`):
   - "Änderungen speichern" → Speichert Draft
   - "Neue Version veröffentlichen" → Speichert Draft + erstellt neue Version

3. **In der Übersicht** (`/app/dpps`):
   - Quick-Publish-Button (Icon) → Direktes Veröffentlichen ohne Editor-Öffnung

### Publish-Logik

1. **Validierung**: Name muss vorhanden sein (Pflichtfeld)
2. **Versionsnummer**: Automatische Berechnung (höchste bestehende + 1)
3. **Snapshot**: Alle aktuellen Draft-Daten werden in `DppVersion` kopiert
4. **Status-Update**: `Dpp.status` wird auf `PUBLISHED` gesetzt (falls noch nicht)
5. **Audit-Trail**: `createdByUserId` wird gespeichert

### Transaktion
- Publish erfolgt in einer Prisma-Transaktion
- Entweder: Version wird erstellt UND Status aktualisiert
- Oder: Fehler → Rollback (keine inkonsistenten Zustände)

## API-Routen

### POST `/api/app/dpp/[dppId]/publish`
- Veröffentlicht Draft als neue Version
- Gibt Versionsnummer und Bearbeiter zurück

### GET `/api/app/dpp/[dppId]/versions`
- Liste aller Versionen (absteigend nach Versionsnummer)
- Inkl. Bearbeiter-Informationen

### GET `/api/app/dpp/[dppId]/versions/[versionNumber]`
- Details einer spezifischen Version (read-only)
- Alle DPP-Daten + Metadaten

## Benutzeroberfläche

### DPP-Übersicht (`/app/dpps`)

**Anzeige pro DPP:**
- Status: "Entwurf" oder "Veröffentlicht"
- Letzte Version: Versionsnummer, Datum, Bearbeiter
- Aktions-Icons:
  - 👁️ **Vorschau**: Zeigt letzte Version (read-only)
  - ✏️ **Bearbeiten**: Öffnet Draft-Editor
  - ✓ **Veröffentlichen**: Quick-Publish (neue Version)
  - 📋 **Versionen**: Zeigt Versionsliste

### Versionsliste (`/app/dpps/[id]/versions`)

- Liste aller Versionen
- Sortiert nach Versionsnummer (neueste zuerst)
- Pro Version: Nummer, Datum, Bearbeiter
- Klick → Read-only Ansicht

### Versions-Ansicht (`/app/dpps/[id]/versions/[versionNumber]`)

- **Read-only** Ansicht aller DPP-Daten
- Klarer Hinweis: "Veröffentlichte Version (Read-only)"
- Gleiche Struktur wie Editor (5 Sektionen)
- Metadaten: Version, Datum, Bearbeiter

### Editor (`/app/dpps/[id]` oder `/app/dpps/new`)

- **Zwei Buttons**:
  1. "Als Entwurf speichern" / "Änderungen speichern"
  2. "Veröffentlichen" / "Neue Version veröffentlichen"

## Warum Datum & Bearbeiter wichtig sind

### ESPR-Konformität

Die EU-ESPR (Ecodesign for Sustainable Products Regulation) erfordert:
- **Nachvollziehbarkeit**: Wer hat welche Informationen wann veröffentlicht?
- **Audit-Trail**: Vollständige Historie aller Änderungen
- **Verantwortlichkeit**: Klare Zuordnung zu Personen/Organisationen

### Compliance & Rechtssicherheit

- **Datum**: Zeigt, wann eine Version veröffentlicht wurde (wichtig für regulatorische Anforderungen)
- **Bearbeiter**: Zeigt, wer verantwortlich ist (interne Kontrolle, Qualitätssicherung)

### Praktischer Nutzen

- **Versionierung**: Klare Unterscheidung zwischen verschiedenen Versionen
- **Nachvollziehbarkeit**: Bei Fragen/Problemen kann der Bearbeiter kontaktiert werden
- **Qualitätssicherung**: Nachvollziehbarkeit verbessert Datenqualität

## Technische Details

### Prisma Schema

```prisma
model DppVersion {
  id             String   @id @default(cuid())
  dppId          String
  version        Int      // Fortlaufend: 1, 2, 3, ...
  // Snapshot aller DPP-Daten
  name           String
  description    String?
  // ... alle anderen Felder
  // Metadaten
  createdAt      DateTime @default(now())
  createdByUserId String
  
  dpp            Dpp      @relation(...)
  createdBy      User     @relation(...)
  
  @@unique([dppId, version])
}
```

### Eindeutigkeit

- `@@unique([dppId, version])` stellt sicher, dass jede Versionsnummer nur einmal pro DPP existiert
- Prisma verhindert doppelte Versionsnummern automatisch

### Immutability

- Versionen werden nach Erstellung **nie** mehr geändert
- Nur lesender Zugriff möglich
- Alle Änderungen erfolgen am Draft

## Workflow-Beispiel

1. **Neuanlage**:
   - User erstellt Draft: "Produkt XYZ"
   - User klickt "Veröffentlichen"
   - System: Erstellt Version 1, setzt Status auf PUBLISHED

2. **Änderung**:
   - User bearbeitet Draft: Name → "Produkt XYZ v2"
   - User klickt "Neue Version veröffentlichen"
   - System: Erstellt Version 2 mit neuem Namen

3. **Anzeige**:
   - Version 1 bleibt unverändert (alter Name)
   - Version 2 zeigt neuen Namen
   - Draft kann weiter bearbeitet werden

4. **Historie**:
   - User kann alle Versionen einsehen
   - Jede Version zeigt: Wer hat wann was veröffentlicht

## Wichtige Regeln

- ✅ **Kein Auto-Publish**: Publish ist immer bewusst (User muss Button klicken)
- ✅ **Kein Rollback**: Versionen können nicht gelöscht/rückgängig gemacht werden
- ✅ **Kein Diff**: Kein Vergleich zwischen Versionen (später erweiterbar)
- ✅ **Keine öffentliche Ansicht**: Nur innerhalb der Organisation sichtbar
- ✅ **Keine Versionierung von Medien**: Medien gehören nur zum Draft (nicht zu Versionen)

