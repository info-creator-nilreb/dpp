# Medien-UX Refactoring - Dokumentation

## Übersicht

Das Medienhandling wurde refaktoriert zu einer block- und templatebasierten Lösung, bei der Medien ausschließlich über File-Felder in Blöcken hochgeladen werden.

## Implementierte Änderungen

### 1. FileField-Komponente refaktoriert ✅

**Datei:** `src/components/cms/fields/FileField.tsx`

**Änderungen:**
- ❌ Rollen-Dropdown entfernt
- ✅ Automatische Rollen-Ableitung aus Block-Kontext
- ✅ Unterstützung für File-Typen: `"media"` (Bilder) und `"document"` (PDFs)
- ✅ Kontextbezogene Erfolgsmeldungen

**Rollen-Ableitung:**
```typescript
// Document → immer "document"
if (isDocument) return "document"

// Media im "Basis- & Produktdaten"-Block
if (blockName === "Basis- & Produktdaten") {
  if (existingMediaCount === 0) return "primary_product_image" // Hero
  else return "gallery_image" // Galerie
}

// Media in anderen Blöcken → "gallery_image"
if (isImage) return "gallery_image"
```

### 2. Zentrale Medienkomponente entfernt ✅

**Datei:** `src/components/DppEditor.tsx`

**Änderungen:**
- ❌ `DppMediaSection` entfernt
- ❌ `refreshMedia` Funktion entfernt
- ✅ Hinweis auf File-Felder in Blöcken

### 3. ImageBlockEditor aktualisiert ✅

**Datei:** `src/components/cms/blocks/ImageBlockEditor.tsx`

**Änderungen:**
- ✅ Verwendet neue FileField-API (ohne Rollen-Dropdown)
- ✅ `fileType="media"` gesetzt
- ✅ `blockName` wird übergeben

## Noch zu implementieren

### 4. Template-System erweitern

**Ziel:** File-Felder im Template-System mit Typen (Media vs. Document) und Konfiguration

**Erforderliche Änderungen:**

#### a) TemplateField config Schema erweitern

Für File-Felder sollte `config` folgendes Schema haben:
```json
{
  "fileType": "media" | "document",
  "accept": ["image/jpeg", "image/png", ...] | ["application/pdf"],
  "maxSize": 10485760, // in Bytes
  "maxCount": 1 // Optional: Maximale Anzahl
}
```

#### b) Template-Editor erweitern

**Datei:** `src/app/super-admin/templates/[id]/TemplateEditorContent.tsx`

Wenn `type === "file"`, zusätzliche Konfiguration anzeigen:
- File-Typ-Auswahl: "Media" (Bilder) oder "Document" (PDFs)
- Erlaubte Dateitypen (basierend auf File-Typ)
- Max. Dateigröße
- Max. Anzahl (optional)

#### c) Template-Feld-Renderer erstellen

**Neue Datei:** `src/components/template/fields/TemplateFieldRenderer.tsx`

Rendert Template-Felder basierend auf Typ:
- `file` → FileField-Komponente
- `text` → InputField
- `textarea` → Textarea
- etc.

### 5. Hero-Logik im Frontend

**Ziel:** Erstes Bild im "Basis- & Produktdaten"-Block als Hero anzeigen

**Erforderliche Änderungen:**

#### a) Helper-Funktion für Hero-Bild

**Neue Datei:** `src/lib/media/hero-logic.ts`

```typescript
export function getHeroImage(media: DppMedia[], blockName?: string): string | null {
  // Nur Medien aus "Basis- & Produktdaten"-Block
  if (blockName !== "Basis- & Produktdaten") return null
  
  // Erstes Bild mit Rolle "primary_product_image"
  const heroImage = media.find(m => 
    m.role === "primary_product_image" && 
    m.fileType?.startsWith("image/")
  )
  
  return heroImage?.storageUrl || null
}

export function getGalleryImages(media: DppMedia[], blockName?: string): string[] {
  // Nur Medien aus "Basis- & Produktdaten"-Block
  if (blockName !== "Basis- & Produktdaten") return []
  
  // Alle Bilder mit Rolle "gallery_image"
  return media
    .filter(m => 
      m.role === "gallery_image" && 
      m.fileType?.startsWith("image/")
    )
    .map(m => m.storageUrl)
    .filter(Boolean)
}
```

#### b) Public Frontend anpassen

**Datei:** `src/components/editorial/EditorialDppView.tsx` oder ähnlich

- Hero-Bild nur aus "Basis- & Produktdaten"-Block
- Galerie nur aus "Basis- & Produktdaten"-Block
- Medien aus anderen Blöcken nur im jeweiligen Abschnitt

### 6. Template-Felder in DppEditor integrieren

**Aktueller Stand:** DppEditor hat hardcodierte Felder

**Ziel:** Template-basierte Felder rendern

**Erforderliche Änderungen:**

1. Template für DPP-Kategorie laden
2. Template-Blöcke und -Felder rendern
3. File-Felder mit FileField-Komponente rendern
4. Block-Namen für Hero-Logik übergeben

**Neue Komponente:** `src/components/template/TemplateFieldRenderer.tsx`

## Konfiguration für File-Felder

### Beispiel: Media-Feld (Bilder)

```json
{
  "type": "file",
  "label": "Produktbild",
  "key": "productImage",
  "config": {
    "fileType": "media",
    "accept": ["image/jpeg", "image/png", "image/webp"],
    "maxSize": 5242880,
    "maxCount": 1
  }
}
```

### Beispiel: Document-Feld (PDFs)

```json
{
  "type": "file",
  "label": "Zertifikat",
  "key": "certificate",
  "config": {
    "fileType": "document",
    "accept": ["application/pdf"],
    "maxSize": 10485760,
    "maxCount": 1
  }
}
```

### Beispiel: Multi-Image-Feld (Galerie)

```json
{
  "type": "file",
  "label": "Produktgalerie",
  "key": "productGallery",
  "config": {
    "fileType": "media",
    "accept": ["image/jpeg", "image/png", "image/webp"],
    "maxSize": 5242880,
    "maxCount": 5
  }
}
```

## Migration bestehender Medien

Bestehende Medien ohne `blockId`/`fieldKey` sollten:
- Weiterhin funktionieren (Backward Compatibility)
- Optional: Manuell zugeordnet werden können
- Oder: Als "Legacy-Medien" markiert werden

## Testing

Siehe `TESTCASES_MEDIA_UPLOAD.md` für detaillierte Testfälle.

## Nächste Schritte

1. ✅ FileField refaktoriert
2. ✅ Zentrale Medienkomponente entfernt
3. ⏳ Template-System erweitern (File-Typen)
4. ⏳ Template-Felder in DppEditor integrieren
5. ⏳ Hero-Logik im Frontend implementieren
6. ⏳ Public Frontend anpassen



