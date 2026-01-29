ich # CMS-Branch Integration: Multi-Question Poll

## Übersicht

Der Multi-Question Poll Block wurde im `main` Branch implementiert. Für die vollständige CMS-Integration müssen folgende Änderungen im **`CMS` Branch** vorgenommen werden.

**WICHTIG:** Dieser Branch ist separat vom `main` Branch. Die Integration muss im `CMS` Branch durchgeführt werden.

## Status

✅ **Fertig im main Branch:**
- `MultiQuestionPollBlockEditor` Komponente
- Frontend-Rendering (`MultiQuestionPollRenderer`)
- API-Endpunkte (`/api/polls/submit`, `/api/polls/results`)
- Datenbank-Migration (`PollResponse` Tabelle)
- Dashboard-Integration (`PollResultsCard`)

⏳ **Ausstehend im CMS Branch:**
- BlockTypeKey Erweiterung
- Feature Mapping
- BlockPickerModal Integration
- ContentBlockEditor Integration

## 1. BlockTypeKey erweitern

**Datei:** `src/lib/cms/types.ts`

```typescript
export type BlockTypeKey = 
  | "storytelling"
  | "quick_poll"
  | "multi_question_poll"  // ← NEU HINZUFÜGEN
  | "image_text"
  | "text"
  | "image"
  | "video"
  | "accordion"
  | "timeline"
```

## 2. Feature Mapping erweitern

**Datei:** `src/lib/cms/validation.ts`

```typescript
export const BLOCK_TYPE_FEATURE_MAP: Record<BlockTypeKey, string> = {
  storytelling: "block_storytelling",
  quick_poll: "block_quick_poll",
  multi_question_poll: "interaction_blocks",  // ← NEU HINZUFÜGEN (oder "block_multi_question_poll")
  image_text: "block_image_text",
  text: "cms_access",
  image: "cms_access",
  video: "cms_access",
  accordion: "cms_access",
  timeline: "cms_access"
}
```

## 3. BlockPickerModal erweitern

**Datei:** `src/components/cms/BlockPickerModal.tsx`

### Icon hinzufügen:

```typescript
const BlockIcons: Record<BlockTypeKey, React.ReactNode> = {
  // ... bestehende Icons
  multi_question_poll: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
      <circle cx="18" cy="10" r="2"/>
      <circle cx="12" cy="4" r="2"/>
      <circle cx="6" cy="14" r="2"/>
    </svg>
  ),
}
```

### Info hinzufügen:

```typescript
const BLOCK_TYPE_INFO: Record<BlockTypeKey, { name: string; description: string }> = {
  // ... bestehende Infos
  multi_question_poll: {
    name: "Multi-Question Poll",
    description: "Umfrage mit bis zu 3 Fragen, horizontal scrollbar"
  },
}
```

## 4. ContentBlockEditor erweitern

**Datei:** `src/components/cms/ContentBlockEditor.tsx`

### Import hinzufügen:

```typescript
import MultiQuestionPollBlockEditor from "./blocks/MultiQuestionPollBlockEditor"
```

### Case hinzufügen:

```typescript
function renderBlockEditor() {
  switch (block.type) {
    // ... bestehende Cases
    case "multi_question_poll":
      return (
        <MultiQuestionPollBlockEditor
          content={content}
          onChange={handleContentChange}
        />
      )
    // ...
  }
}
```

## 5. MultiQuestionPollBlockEditor kopieren

**Datei:** `src/components/cms/blocks/MultiQuestionPollBlockEditor.tsx`

Die Datei wurde bereits im `main` Branch erstellt und kann direkt übernommen werden:
- `/Users/alexanderberlin/Documents/DPP/src/components/cms/blocks/MultiQuestionPollBlockEditor.tsx`

## 6. Content Schema erweitern (optional)

**Datei:** `src/lib/cms/schemas.ts` (falls vorhanden)

Falls es ein Schema-System gibt, sollte `multi_question_poll` dort ebenfalls definiert werden:

```typescript
export const blockSchemas = {
  // ... bestehende Schemas
  multi_question_poll: {
    type: "object",
    properties: {
      questions: {
        type: "array",
        minItems: 1,
        maxItems: 3,
        items: {
          type: "object",
          properties: {
            question: { type: "string", minLength: 1 },
            options: {
              type: "array",
              minItems: 2,
              maxItems: 5,
              items: { type: "string", minLength: 1 }
            }
          },
          required: ["question", "options"]
        }
      },
      completionMessage: {
        type: "string",
        default: "Vielen Dank für Ihre Teilnahme!"
      }
    },
    required: ["questions"]
  }
}
```

## Zusammenfassung

Nach diesen Änderungen im **CMS Branch** ist der Multi-Question Poll vollständig integriert:

✅ Block kann im BlockPickerModal ausgewählt werden (nach CMS-Branch Integration)
✅ Block kann im ContentBlockEditor bearbeitet werden (nach CMS-Branch Integration)
✅ Block wird im Frontend korrekt gerendert (bereits im main Branch)
✅ Antworten werden gespeichert (bereits im main Branch)
✅ Ergebnisse werden im Dashboard angezeigt (bereits im main Branch)

## Alle konfigurierbaren Elemente

Der `MultiQuestionPollBlockEditor` unterstützt bereits **alle Elemente** der Poll-Komponente:

1. **Fragen (1-3):**
   - Fragetext (max. 300 Zeichen)
   - Hinzufügen/Entfernen von Fragen

2. **Antwortoptionen pro Frage (2-5):**
   - Optionstext (max. 200 Zeichen)
   - Hinzufügen/Entfernen von Optionen

3. **Dankesnachricht:**
   - Anpassbarer Text (max. 200 Zeichen)
   - Wird nach dem Absenden angezeigt

**Alle diese Elemente sind bereits im Editor implementiert und werden nach der CMS-Branch Integration vollständig konfigurierbar sein.**

## Test-Checkliste

- [ ] Block erscheint im BlockPickerModal
- [ ] Block kann erstellt werden
- [ ] Editor funktioniert (Fragen/Optionen hinzufügen/entfernen)
- [ ] Config wird korrekt gespeichert
- [ ] Block wird im Frontend gerendert
- [ ] Umfrage kann ausgefüllt werden
- [ ] Antworten werden gespeichert
- [ ] Ergebnisse erscheinen im Dashboard
