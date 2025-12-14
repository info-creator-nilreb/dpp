# DPP Medien & Dokumente - Dokumentation

## Übersicht

Diese Dokumentation beschreibt die Medien- und Dokumenten-Funktionalität für den DPP One-Pager Editor.

## Datenmodell

### Prisma Schema

```prisma
// Digital Product Passport (DPP)
model Dpp {
  id             String       @id @default(cuid())
  name           String       // Produktname
  description    String?      // Produktbeschreibung
  organizationId String       // Zugehörigkeit zur Organization
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  organization   Organization @relation(...)
  media          DppMedia[]   // 1:N Beziehung zu Medien
}

// Medien & Dokumente für DPPs
model DppMedia {
  id          String   @id @default(cuid())
  dppId       String   // Zugehörigkeit zum DPP
  fileName    String   // Original-Dateiname
  fileType    String   // MIME-Type (z.B. "image/jpeg", "application/pdf")
  fileSize    Int      // Größe in Bytes
  storageUrl  String   // URL/Path zur Datei im Storage
  uploadedAt  DateTime @default(now())

  dpp         Dpp      @relation(...)
}
```

### Warum Medien getrennt modelliert sind

**1. Skalierbarkeit:**
- Ein DPP kann viele Medien haben (Bilder, PDFs, etc.)
- Getrenntes Modell ermöglicht effiziente Abfragen
- Medien können unabhängig geladen werden (Lazy Loading)

**2. Flexibilität:**
- Medien können später erweitert werden (z.B. Metadaten, Versionierung)
- Einfache Migration zu externen Storage-Services (Supabase, Vercel Blob)
- Medien können zwischen DPPs geteilt werden (später möglich)

**3. Performance:**
- DPP-Liste lädt nicht automatisch alle Medien
- Medien werden nur bei Bedarf geladen
- Bessere Caching-Möglichkeiten

**4. Wartbarkeit:**
- Klare Trennung von Produktdaten und Medien
- Einfache Erweiterung ohne DPP-Modell zu ändern

## Upload-Flow

### 1. Datei-Auswahl
```
User wählt Datei im Browser
  ↓
Client: Datei wird validiert (Typ, Größe)
  ↓
FormData wird erstellt
```

### 2. Upload-Request
```
POST /api/app/dpp/[dppId]/media
  ↓
Server: Prüft Berechtigung (Organization-Membership)
  ↓
Server: Validiert Dateityp (Bilder, PDFs)
  ↓
Server: Validiert Dateigröße (max. 10 MB)
  ↓
Server: Speichert Datei im Storage (lokales File-System)
  ↓
Server: Speichert Metadaten in DB (DppMedia)
  ↓
Response: { media: { id, fileName, fileType, storageUrl, ... } }
```

### 3. Storage-Speicherung

**MVP: Lokales File-System**
- Dateien werden in `/public/uploads/dpp-media/` gespeichert
- Eindeutiger Dateiname: `{timestamp}_{sanitizedFileName}`
- Relative URL: `/uploads/dpp-media/{uniqueFileName}`

**Später: Externes Storage**
- Einfach umstellbar auf Supabase Storage oder Vercel Blob
- Nur `src/lib/storage.ts` muss angepasst werden

## API-Endpunkte

### POST /api/app/dpp/[dppId]/media
Upload eines Mediums.

**Request:**
- `Content-Type: multipart/form-data`
- `file`: File (Bild oder PDF)

**Response (201):**
```json
{
  "message": "Medium erfolgreich hochgeladen",
  "media": {
    "id": "clx...",
    "fileName": "produktbild.jpg",
    "fileType": "image/jpeg",
    "fileSize": 245678,
    "storageUrl": "/uploads/dpp-media/1234567890_produktbild.jpg",
    "uploadedAt": "2024-01-01T12:00:00Z"
  }
}
```

**Fehler (400):**
```json
{
  "error": "Dateityp nicht erlaubt. Erlaubt: Bilder (JPEG, PNG, GIF, WebP) und PDFs"
}
// oder
{
  "error": "Datei zu groß. Maximum: 10 MB"
}
```

### GET /api/app/dpp/[dppId]/media
Holt alle Medien eines DPPs.

**Response (200):**
```json
{
  "media": [
    {
      "id": "clx...",
      "fileName": "produktbild.jpg",
      "fileType": "image/jpeg",
      "fileSize": 245678,
      "storageUrl": "/uploads/dpp-media/1234567890_produktbild.jpg",
      "uploadedAt": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### DELETE /api/app/dpp/[dppId]/media/[mediaId]
Löscht ein Medium.

**Response (200):**
```json
{
  "message": "Medium erfolgreich gelöscht"
}
```

## Access-Control

### Organization-basierte Zugriffskontrolle

- **Prüfung**: User muss Mitglied der Organization sein, zu der der DPP gehört
- **Implementierung**: In jeder API-Route wird geprüft:
  1. DPP laden (inkl. Organization)
  2. Prüfen ob User Mitglied der Organization ist
  3. Wenn nicht → 403 Forbidden

### Zugriff nur innerhalb der Organisation

- Medien sind **nicht öffentlich** zugänglich
- Nur Mitglieder der Organization können:
  - Medien hochladen
  - Medien anzeigen
  - Medien löschen

## Dateien-Struktur

### Neue Dateien:

```
src/
├── lib/
│   ├── storage.ts                    # Storage-Helper (Upload, Delete)
│   └── dpp-access.ts                 # DPP Access-Control Helper
├── components/
│   ├── DppEditor.tsx                 # Haupt-Editor-Komponente
│   └── DppMediaSection.tsx           # Medien-Sektion (Upload, Liste, Delete)
├── app/
│   ├── api/
│   │   └── app/
│   │       ├── dpp/
│   │       │   ├── route.ts          # DPP erstellen/auflisten
│   │       │   └── [dppId]/
│   │       │       ├── page.tsx      # DPP Editor Seite
│   │       │       └── media/
│   │       │           ├── route.ts  # Upload & Liste
│   │       │           └── [mediaId]/
│   │       │               └── route.ts  # Delete
│   │       └── organizations/
│   │           └── route.ts          # Organizations API
│   └── app/
│       ├── dpp/
│       │   ├── new/
│       │   │   └── page.tsx         # Neuer DPP erstellen
│       │   └── [dppId]/
│       │       └── page.tsx         # DPP Editor
│       └── dashboard/
│           └── page.tsx             # Erweitert (DPP-Liste)

prisma/
└── schema.prisma                     # Erweitert (DPP, DppMedia)
```

## Verwendung

### Medien hochladen

```typescript
const formData = new FormData()
formData.append("file", file)

const response = await fetch(`/api/app/dpp/${dppId}/media`, {
  method: "POST",
  body: formData
})
```

### Medien auflisten

```typescript
const response = await fetch(`/api/app/dpp/${dppId}/media`)
const { media } = await response.json()
```

### Medium löschen

```typescript
const response = await fetch(`/api/app/dpp/${dppId}/media/${mediaId}`, {
  method: "DELETE"
})
```

## Erlaubte Dateitypen

### Bilder:
- JPEG/JPG (`image/jpeg`)
- PNG (`image/png`)
- GIF (`image/gif`)
- WebP (`image/webp`)

### Dokumente:
- PDF (`application/pdf`)
- Word (.doc, .docx)

### Maximale Dateigröße:
- **10 MB** pro Datei

## Storage-Migration (später)

Um auf externes Storage umzustellen (z.B. Supabase):

1. **Supabase Storage Setup:**
```typescript
// src/lib/storage.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!)

export async function saveFile(file: Buffer, fileName: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('dpp-media')
    .upload(`${Date.now()}_${fileName}`, file)
  
  if (error) throw error
  
  return data.path
}
```

2. **Nur `src/lib/storage.ts` muss geändert werden**
3. **Alle anderen Dateien bleiben unverändert**

## Nächste Schritte (Optional)

- [ ] Drag & Drop Upload
- [ ] Bild-Vorschau vor Upload
- [ ] Progress-Bar beim Upload
- [ ] Bulk-Upload (mehrere Dateien gleichzeitig)
- [ ] Medien-Versionierung
- [ ] Externes Storage (Supabase/Vercel Blob)
- [ ] Medien-Komprimierung (Bilder)
- [ ] Thumbnail-Generierung

