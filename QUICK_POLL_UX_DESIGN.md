# Quick Poll - UX Design & Implementation Plan

## UX-Bewertung & Empfehlung

### Aktuelle Situation
- Einfache Quick Poll existiert bereits als statischer Block
- Nur eine Frage mit mehreren Antwortoptionen
- Keine Ergebnis-Tracking-Funktionalität
- Keine Multi-Question-Unterstützung

### Anforderungen
1. **Erstellung (CMS):**
   - Bis zu 3 Fragen konfigurierbar
   - Jede Frage mit eigenen Antwortoptionen
   - Konfigurierbare Abschlussnachricht
   - Einfache, intuitive UI

2. **Teilnahme (Frontend):**
   - Horizontales Scrollen durch Fragen (Slide-Show)
   - Klare Navigation (Vor/Zurück)
   - Fortschrittsanzeige
   - Abschlussnachricht nach Beantwortung

3. **Ergebnisse (Dashboard):**
   - Übersichtliche Darstellung der Ergebnisse
   - Pro Frage: Antwortverteilung
   - Optional: Zeitstempel, Teilnehmeranzahl

### UX-Prinzipien

#### Für Ersteller (CMS)
1. **Progressive Disclosure:** Schritt-für-Schritt Konfiguration
2. **Live Preview:** Sofortige Vorschau der Umfrage
3. **Validation:** Klare Fehlermeldungen bei fehlenden Daten
4. **Default Values:** Sinnvolle Voreinstellungen

#### Für Teilnehmer (Frontend)
1. **Klare Orientierung:** Fortschrittsanzeige (1/3, 2/3, 3/3)
2. **Einfache Navigation:** Große, gut sichtbare Buttons
3. **Feedback:** Visuelle Bestätigung bei Auswahl
4. **Mobile-First:** Touch-optimiert, Swipe-Gesten
5. **Accessibility:** Keyboard-Navigation, Screen-Reader-Support

## Technische Umsetzungslösung

### 1. Datenmodell (Prisma Schema)

```prisma
model PollResponse {
  id          String   @id @default(cuid())
  pollBlockId String  // Referenz zum DppContent Block
  dppId      String
  responses  Json     // Array von Antworten: [{questionIndex: 0, answer: "Option 1"}, ...]
  createdAt  DateTime @default(now())
  sessionId  String?  // Optional: Session-Tracking für Duplikat-Prävention
  
  dpp        Dpp      @relation(fields: [dppId], references: [id], onDelete: Cascade)
  
  @@index([pollBlockId])
  @@index([dppId])
  @@map("poll_responses")
}
```

### 2. BlockType Definition

**BlockType Key:** `multi_question_poll`

**Config Schema:**
```json
{
  "type": "object",
  "properties": {
    "questions": {
      "type": "array",
      "minItems": 1,
      "maxItems": 3,
      "items": {
        "type": "object",
        "properties": {
          "question": {"type": "string", "minLength": 1},
          "options": {
            "type": "array",
            "minItems": 2,
            "maxItems": 5,
            "items": {"type": "string", "minLength": 1}
          }
        },
        "required": ["question", "options"]
      }
    },
    "completionMessage": {
      "type": "string",
      "default": "Vielen Dank für Ihre Teilnahme!"
    }
  },
  "required": ["questions"]
}
```

### 3. CMS Editor Komponente

**Datei:** `src/components/cms/blocks/MultiQuestionPollEditor.tsx`

**Features:**
- Dynamisches Hinzufügen/Entfernen von Fragen (max. 3)
- Pro Frage: Textfeld für Frage + dynamische Antwortoptionen
- Live Preview der Umfrage
- Validierung: Mindestens 1 Frage, jede Frage mindestens 2 Optionen
- Textfeld für Abschlussnachricht

**UI-Struktur:**
```
┌─────────────────────────────────────┐
│ Multi-Question Poll                 │
├─────────────────────────────────────┤
│                                     │
│ Frage 1                             │
│ ┌─────────────────────────────────┐ │
│ │ Frage: [Textfeld]                │ │
│ │ Option 1: [Textfeld]  [×]        │ │
│ │ Option 2: [Textfeld]  [×]        │ │
│ │ [+ Option hinzufügen]             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [+ Frage hinzufügen] (max. 3)      │
│                                     │
│ Abschlussnachricht:                 │
│ ┌─────────────────────────────────┐ │
│ │ [Textfeld]                       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Live Preview]                      │
└─────────────────────────────────────┘
```

### 4. Frontend Renderer

**Datei:** `src/components/editorial/data/MultiQuestionPollRenderer.tsx`

**Features:**
- Horizontales Scrollen (CSS Scroll Snap oder React Swiper)
- Fortschrittsanzeige (1/3, 2/3, 3/3)
- Navigation: Vor/Zurück Buttons
- Antwort-Speicherung in LocalStorage (für Duplikat-Prävention)
- API-Call nach letzter Frage
- Abschlussnachricht nach erfolgreichem Submit

**UI-Struktur:**
```
┌─────────────────────────────────────┐
│ [1/3] ────────●──────                │
│                                     │
│ Wie wichtig ist Ihnen              │
│ Nachhaltigkeit bei Kleidung?        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Sehr wichtig                    │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Wichtig                         │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Eher unwichtig                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [← Zurück]  [Weiter →]              │
└─────────────────────────────────────┘
```

### 5. API Endpoints

**POST `/api/polls/submit`**
- Body: `{ pollBlockId, dppId, responses: [{questionIndex, answer}] }`
- Response: `{ success: true, message: "..." }`
- Validierung: Session-Check (optional), Duplikat-Prävention

**GET `/api/polls/results?pollBlockId=xxx&dppId=xxx`**
- Response: `{ totalResponses, questions: [{question, options: [{option, count, percentage}]}] }`
- Aggregation der Antworten pro Frage

### 6. Dashboard Kachel

**Datei:** `src/app/app/dashboard/components/PollResultsCard.tsx`

**Features:**
- Liste aller aktiven Umfragen (mit Ergebnissen)
- Pro Umfrage: Anzahl Teilnehmer, Link zu Details
- Optional: Mini-Chart (Bar Chart pro Frage)
- Filter: Nur Umfragen mit Ergebnissen anzeigen

**UI-Struktur:**
```
┌─────────────────────────────────────┐
│ Umfrage-Ergebnisse                  │
├─────────────────────────────────────┤
│                                     │
│ 📊 Nachhaltigkeit bei Kleidung      │
│    15 Teilnehmer                    │
│    [Details anzeigen →]             │
│                                     │
│ 📊 Produktqualität                  │
│    8 Teilnehmer                     │
│    [Details anzeigen →]             │
│                                     │
│ [Alle Ergebnisse anzeigen →]        │
└─────────────────────────────────────┘
```

## Implementierungsreihenfolge

### Phase 1: Datenmodell & API
1. Prisma Migration für `PollResponse`
2. API Endpoints (`/api/polls/submit`, `/api/polls/results`)
3. Validierung & Duplikat-Prävention

### Phase 2: CMS Editor
1. BlockType in Datenbank anlegen
2. `MultiQuestionPollEditor` Komponente
3. Integration in CMS Modal (Mehrwertinformationen)

### Phase 3: Frontend Renderer
1. `MultiQuestionPollRenderer` Komponente
2. Integration in `CmsBlockRenderer`
3. Scroll-Logik & Navigation
4. API-Integration

### Phase 4: Dashboard
1. `PollResultsCard` Komponente
2. Integration in Dashboard
3. Detail-Seite für Ergebnisse (optional)

## Technische Details

### State Management
- **Frontend:** React `useState` für lokalen State (aktuelle Frage, Antworten)
- **API:** Prisma für Datenpersistenz
- **Session:** Optional: `sessionId` für Duplikat-Prävention (LocalStorage)

### Scroll-Implementierung
**Option A: CSS Scroll Snap (Empfohlen)**
```css
.poll-container {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
}

.poll-slide {
  scroll-snap-align: start;
  flex: 0 0 100%;
}
```

**Option B: React Swiper (Falls mehr Features benötigt)**
- Library: `swiper/react`
- Vorteil: Mehr Kontrolle, Touch-Gesten, Animationen

### Duplikat-Prävention
1. **LocalStorage:** `poll_${pollBlockId}_answered` Flag
2. **Session-ID:** Optional für Server-seitige Validierung
3. **UI:** Nach Beantwortung: Umfrage als "Beantwortet" markieren

### Styling
- Nutzung bestehender `editorialColors` und `editorialSpacing`
- Konsistent mit bestehender Quick Poll
- Mobile-First Responsive Design

## Offene Fragen / Entscheidungen

1. **Session-Tracking:** Soll eine Session-ID verwendet werden für Duplikat-Prävention?
2. **Anonymität:** Sollen IP-Adressen oder andere Identifikatoren gespeichert werden?
3. **Ergebnis-Details:** Soll eine separate Detail-Seite für Ergebnisse erstellt werden?
4. **Export:** Sollen Ergebnisse als CSV exportierbar sein?

## Nächste Schritte

1. ✅ UX-Design & Technische Spezifikation (dieses Dokument)
2. ⏳ Prisma Migration erstellen
3. ⏳ API Endpoints implementieren
4. ⏳ CMS Editor Komponente
5. ⏳ Frontend Renderer
6. ⏳ Dashboard Integration
7. ⏳ Testing & Refinement
