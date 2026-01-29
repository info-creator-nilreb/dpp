# Testing Guide: Multi-Question Poll

## 🧪 Test-Möglichkeiten

### 1. Frontend-Rendering testen (ohne Backend)

**Route:** `/public/test-dpp`

Die Test-Seite zeigt bereits einen Multi-Question Poll Block mit 3 Beispiel-Fragen:

1. Öffne: `http://localhost:3000/public/test-dpp`
2. Scrolle zu "Ihre Meinung" (unter den Mehrwertinformationen)
3. Teste:
   - ✅ Horizontaler Scroll durch die 3 Fragen
   - ✅ Fortschrittsanzeige (1/3, 2/3, 3/3)
   - ✅ Navigation (Zurück/Weiter)
   - ✅ Antworten auswählen
   - ✅ Absenden-Button
   - ✅ Completion Message nach Absenden

**Hinweis:** Da es eine Test-Seite ist, werden Antworten nicht gespeichert (API-Call würde fehlschlagen).

---

### 2. Vollständiger Test mit Backend

#### Schritt 1: Migration ausführen

```bash
# Migration ausführen (erstellt PollResponse Tabelle)
npx prisma migrate deploy

# Oder für Entwicklung:
npx prisma migrate dev --name add_poll_responses
```

#### Schritt 2: BlockType seeden

```bash
# BlockType multi_question_poll erstellen
node scripts/seed-multi-question-poll.mjs
```

#### Schritt 3: Test mit echten DPPs

**Option A: Bestehenden DPP verwenden**

1. Öffne einen DPP im Editor: `/app/dpp/[dppId]`
2. **WICHTIG:** Im CMS-Branch: Gehe zu `/app/dpp/[dppId]/cms`
3. Füge einen "Multi-Question Poll" Block hinzu
4. Konfiguriere 1-3 Fragen mit je 2-5 Optionen
5. Speichere und veröffentliche den DPP
6. Öffne die öffentliche Ansicht: `/public/dpp/[dppId]`
7. Teste die Umfrage

**Option B: Neuen DPP erstellen**

1. Erstelle einen neuen DPP: `/app/create`
2. Fülle die Pflichtfelder aus
3. Im CMS-Branch: Gehe zu `/app/dpp/[dppId]/cms`
4. Füge einen "Multi-Question Poll" Block hinzu
5. Veröffentliche den DPP
6. Teste die öffentliche Ansicht

---

### 3. API-Endpunkte testen

#### Poll-Antwort absenden

```bash
curl -X POST http://localhost:3000/api/polls/submit \
  -H "Content-Type: application/json" \
  -d '{
    "pollBlockId": "cms-multi-poll-1",
    "dppId": "test-dpp-id",
    "responses": [
      {"questionIndex": 0, "answer": "Sehr wichtig"},
      {"questionIndex": 1, "answer": "Regelmäßig"},
      {"questionIndex": 2, "answer": "Umweltschutz"}
    ],
    "sessionId": "test-session-123"
  }'
```

#### Ergebnisse abrufen

```bash
curl "http://localhost:3000/api/polls/results?pollBlockId=cms-multi-poll-1&dppId=test-dpp-id"
```

**Hinweis:** Für `/api/polls/results` musst du eingeloggt sein und Mitglied der Organisation sein.

---

### 4. Dashboard-Integration testen

**Route:** `/app/dashboard`

1. Erstelle einen DPP mit Multi-Question Poll
2. Veröffentliche den DPP
3. Fülle die Umfrage mehrmals aus (verschiedene Antworten)
4. Gehe zum Dashboard: `/app/dashboard`
5. Prüfe, ob die "Umfrage-Ergebnisse" Kachel erscheint
6. Klicke auf eine Umfrage, um Details zu sehen

---

### 5. CMS-Editor testen (CMS-Branch)

**Route:** `/app/dpp/[dppId]/cms`

**Voraussetzung:** CMS-Branch Integration muss abgeschlossen sein (siehe `CMS_BRANCH_INTEGRATION.md`)

1. Öffne einen DPP im CMS-Editor
2. Klicke auf "Block hinzufügen"
3. Wähle "Multi-Question Poll" aus
4. Teste den Editor:
   - ✅ Frage hinzufügen (max. 3)
   - ✅ Frage entfernen (min. 1)
   - ✅ Option hinzufügen (max. 5 pro Frage)
   - ✅ Option entfernen (min. 2 pro Frage)
   - ✅ Completion Message anpassen
5. Speichere den Block
6. Prüfe, ob der Block im Frontend korrekt gerendert wird

---

## 🐛 Troubleshooting

### Poll wird nicht angezeigt

- Prüfe Browser-Konsole auf Fehler
- Prüfe, ob `dppId` korrekt übergeben wird
- Prüfe, ob `config.questions` im Block vorhanden ist

### Antworten werden nicht gespeichert

- Prüfe, ob Migration ausgeführt wurde
- Prüfe, ob BlockType geseedet wurde
- Prüfe Browser-Konsole auf API-Fehler
- Prüfe Server-Logs

### Ergebnisse erscheinen nicht im Dashboard

- Prüfe, ob Umfrage mindestens einmal ausgefüllt wurde
- Prüfe, ob User Mitglied der Organisation ist
- Prüfe Browser-Konsole auf API-Fehler

### CMS-Editor funktioniert nicht

- Prüfe, ob CMS-Branch Integration abgeschlossen ist
- Prüfe, ob `multi_question_poll` in `BlockTypeKey` enthalten ist
- Prüfe, ob `MultiQuestionPollBlockEditor` importiert ist

---

## ✅ Test-Checkliste

### Frontend
- [ ] Poll wird korrekt gerendert
- [ ] Horizontaler Scroll funktioniert
- [ ] Fortschrittsanzeige aktualisiert sich
- [ ] Navigation (Zurück/Weiter) funktioniert
- [ ] Antworten können ausgewählt werden
- [ ] Absenden-Button funktioniert
- [ ] Completion Message wird angezeigt
- [ ] LocalStorage verhindert Duplikate

### Backend
- [ ] Migration erfolgreich
- [ ] BlockType geseedet
- [ ] API `/api/polls/submit` funktioniert
- [ ] API `/api/polls/results` funktioniert
- [ ] Antworten werden in DB gespeichert
- [ ] Ergebnisse werden korrekt aggregiert

### CMS-Editor (CMS-Branch)
- [ ] Block erscheint im BlockPickerModal
- [ ] Editor öffnet sich korrekt
- [ ] Fragen können hinzugefügt/entfernt werden
- [ ] Optionen können hinzugefügt/entfernt werden
- [ ] Completion Message kann bearbeitet werden
- [ ] Config wird korrekt gespeichert

### Dashboard
- [ ] PollResultsCard erscheint
- [ ] Umfragen mit Ergebnissen werden angezeigt
- [ ] Klick führt zu DPP-Details
- [ ] Anzahl der Teilnehmer wird angezeigt

---

## 📍 Test-Routen Übersicht

| Route | Zweck | Status |
|-------|-------|--------|
| `/public/test-dpp` | Frontend-Rendering testen (ohne Backend) | ✅ Bereit |
| `/public/dpp/[dppId]` | Öffentliche DPP-Ansicht mit Poll | ✅ Bereit |
| `/app/dpp/[dppId]/cms` | CMS-Editor (CMS-Branch) | ⏳ Nach Integration |
| `/app/dashboard` | Dashboard mit Poll-Ergebnissen | ✅ Bereit |
| `/api/polls/submit` | API: Antwort absenden | ✅ Bereit |
| `/api/polls/results` | API: Ergebnisse abrufen | ✅ Bereit |

---

## 🚀 Schnellstart

**Schnellster Weg zum Testen (ohne Backend):**

1. Starte den Dev-Server: `npm run dev`
2. Öffne: `http://localhost:3000/public/test-dpp`
3. Scrolle zu "Ihre Meinung"
4. Teste die Umfrage

**Vollständiger Test (mit Backend):**

1. Migration: `npx prisma migrate deploy`
2. Seed: `node scripts/seed-multi-question-poll.mjs`
3. Öffne: `http://localhost:3000/public/test-dpp`
4. Teste die Umfrage (API-Calls funktionieren jetzt)
