# QR-Code-Funktionalität - Dokumentation

## Konzept: QR-Codes für veröffentlichte Versionen

### Grundprinzip

- **QR-Codes sind versionsgebunden**: Jede veröffentlichte Version erhält einen eigenen QR-Code
- **Keine QR-Codes für Drafts**: Nur veröffentlichte Versionen haben QR-Codes
- **Unveränderlichkeit**: QR-Code verweist immer auf die spezifische Version (nicht auf den Draft)

### Warum QR-Code versionsgebunden ist

1. **ESPR-Konformität**: 
   - Jede Version ist ein unveränderlicher Snapshot
   - QR-Code muss immer auf die exakt veröffentlichte Version verweisen
   - Änderungen am Draft dürfen QR-Code nicht beeinflussen

2. **Nachvollziehbarkeit**:
   - QR-Code auf Produkt verweist auf spezifische Version
   - Bei neuen Versionen: Neuer QR-Code (alte Versionen bleiben abrufbar)
   - Klare Zuordnung: Version X → QR-Code X

3. **Praktischer Nutzen**:
   - Produkte können physisch mit QR-Code versehen werden
   - QR-Code bleibt gültig, auch wenn neue Versionen erstellt werden
   - Konsumenten sehen immer die Version, die zum Zeitpunkt der Produktion gültig war

## Datenmodell

### DppVersion erweitert

```prisma
model DppVersion {
  // ... bestehende Felder ...
  
  // Public Access & QR-Code
  publicUrl      String?  // Öffentliche URL: /public/dpp/[id]/v/[version]
  qrCodeImageUrl String?  // Storage-URL: /uploads/qrcodes/qrcode-[id]-v[version].svg
}
```

### Metadaten pro Version

- `publicUrl`: Öffentliche URL für diese Version (ohne Auth)
- `qrCodeImageUrl`: Pfad zum QR-Code-Bild im Storage
- `version`: Versionsnummer
- `createdAt`: Veröffentlichungsdatum
- `createdByUserId`: Bearbeiter

## QR-Code-Generierung

### Technische Umsetzung

**Package**: `qrcode` (npm)

**Format**: SVG (bevorzugt, da skalierbar)

**Speicherung**:
- Lokal: `/public/uploads/qrcodes/qrcode-[dppId]-v[version].svg`
- URL: `/uploads/qrcodes/qrcode-[dppId]-v[version].svg`

**Generierung beim Publish**:
1. Public URL wird generiert: `/public/dpp/[dppId]/v/[versionNumber]`
2. QR-Code wird als SVG generiert (verweist auf Public URL)
3. QR-Code wird im Storage gespeichert
4. `publicUrl` und `qrCodeImageUrl` werden in `DppVersion` gespeichert

### Public URL

**Format**: `/public/dpp/[dppId]/v/[versionNumber]`

**Base URL**:
- Production: `NEXT_PUBLIC_BASE_URL` (Environment Variable)
- Vercel: Automatisch aus `VERCEL_URL`
- Development: `http://localhost:3000`

**Beispiel**:
- `https://t-pass.example.com/public/dpp/cmj4e5fpd0001pgg8sjuj4xvd/v/1`

## Public-View

### Route: `/public/dpp/[dppId]/v/[versionNumber]`

**Zugriff**: Öffentlich (keine Authentifizierung erforderlich)

**Anzeige**:
- Vollständige DPP-Daten (read-only)
- Gleiche Struktur wie interne Versionen-Ansicht
- Metadaten: Version, Datum, Bearbeiter, Organisation

**Verwendung**:
- Direkter Zugriff über URL
- Zugriff über QR-Code-Scan
- Teilen mit externen Partnern

## Download-Funktionalität

### API-Route: `/api/app/dpp/[dppId]/versions/[versionNumber]/qr-code`

**Methode**: `GET`

**Zugriff**: Authentifiziert (nur innerhalb der Organisation)

**Response**:
- Content-Type: `image/svg+xml`
- Content-Disposition: `attachment; filename="qrcode-dpp-[id]-v[version].svg"`
- Datei wird direkt heruntergeladen

**Technische Umsetzung**:
1. Prüfe Zugriff auf DPP
2. Lade QR-Code-Datei aus Storage
3. Sende Datei als Download-Response

## UX-Integration

### 1. Nach Publish

**Im Editor** (`/app/dpps/[id]`):
- Nach erfolgreichem Publish: Notification mit Versionsnummer
- Weiterleitung zum Editor zeigt QR-Code-Sektion

**QR-Code-Sektion zeigt**:
- Öffentliche URL (kopierbar)
- QR-Code-Vorschau (150x150px)
- Download-Button
- Link zur öffentlichen Ansicht

### 2. In der Versions-Ansicht

**Route**: `/app/dpps/[id]/versions/[versionNumber]`

- `VersionQrCodeSection` Komponente
- Zeigt QR-Code nur wenn vorhanden
- Download und öffentliche Ansicht verfügbar

### 3. In der Versionsliste

**Route**: `/app/dpps/[id]/versions`

- `VersionCard` Komponente
- QR-Code-Icon oben rechts (wenn vorhanden)
- Klick → Download

### 4. In der Produktpass-Übersicht

**Route**: `/app/dpps`

- `DppCard` Komponente
- QR-Code-Icon in Aktions-Icons (wenn letzte Version QR-Code hat)
- Tooltip: "QR-Code herunterladen (letzte Version)"

## Workflow-Beispiel

1. **User erstellt DPP**: Draft wird erstellt
2. **User veröffentlicht**: 
   - Version 1 wird erstellt
   - Public URL wird generiert: `/public/dpp/[id]/v/1`
   - QR-Code wird generiert und gespeichert
   - `publicUrl` und `qrCodeImageUrl` werden gespeichert
3. **QR-Code verfügbar**:
   - Im Editor: QR-Code-Sektion sichtbar
   - In Übersicht: QR-Code-Icon verfügbar
   - Download möglich
4. **Neue Version**:
   - Version 2 wird erstellt
   - Neuer QR-Code wird generiert (verweist auf v2)
   - Version 1 QR-Code bleibt unverändert

## Technische Details

### QR-Code-Generierung

```typescript
// src/lib/qrcode.ts
export async function generateQrCode(
  publicUrl: string, 
  dppId: string, 
  version: number
): Promise<string>
```

**Parameter**:
- `publicUrl`: Vollständige URL zur öffentlichen Version
- `dppId`: DPP-ID
- `version`: Versionsnummer

**Rückgabe**: Storage-URL (z.B. `/uploads/qrcodes/qrcode-[id]-v[version].svg`)

### Storage-Struktur

```
public/
  uploads/
    qrcodes/
      qrcode-[dppId]-v1.svg
      qrcode-[dppId]-v2.svg
      ...
```

### Fehlerbehandlung

- QR-Code-Generierung ist **nicht kritisch**
- Wenn Generierung fehlschlägt: Version wird trotzdem erstellt
- `qrCodeImageUrl` bleibt `null` wenn Generierung fehlschlägt
- UI zeigt QR-Code-Sektion nur wenn `qrCodeImageUrl` vorhanden ist

## Wichtige Regeln

- ✅ **Nur für Versionen**: Keine QR-Codes für Drafts
- ✅ **Versionsgebunden**: Jede Version hat eigenen QR-Code
- ✅ **Unveränderlich**: QR-Code verweist immer auf spezifische Version
- ✅ **Öffentlicher Zugriff**: Public-View ist ohne Auth erreichbar
- ✅ **Download**: QR-Code kann als SVG heruntergeladen werden
- ✅ **Kein Refactor**: Bestehende Versionierungslogik unverändert

