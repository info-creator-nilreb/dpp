# Backend Testing Guide: Multi-Question Poll

## 🧪 Backend-Test-Möglichkeiten

### 1. API-Endpunkte direkt testen

#### Option A: Test-Script verwenden

```bash
# Test-Script ausführen
node scripts/test-poll-api.mjs
```

Das Script testet:
- ✅ Poll-Antwort absenden
- ✅ Duplikat-Prävention (gleiche Session-ID)
- ✅ Mehrere Antworten mit verschiedenen Sessions
- ⚠️  Ergebnisse abrufen (benötigt Login)

#### Option B: cURL verwenden

**Poll-Antwort absenden:**
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

**Ergebnisse abrufen (benötigt Cookie/Session):**
```bash
# Mit Session-Cookie (aus Browser DevTools kopieren)
curl "http://localhost:3000/api/polls/results?pollBlockId=cms-multi-poll-1&dppId=test-dpp-id" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

#### Option C: Postman/Insomnia

**POST `/api/polls/submit`**
- Method: POST
- URL: `http://localhost:3000/api/polls/submit`
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "pollBlockId": "cms-multi-poll-1",
  "dppId": "test-dpp-id",
  "responses": [
    {"questionIndex": 0, "answer": "Sehr wichtig"},
    {"questionIndex": 1, "answer": "Regelmäßig"},
    {"questionIndex": 2, "answer": "Umweltschutz"}
  ],
  "sessionId": "test-session-123"
}
```

**GET `/api/polls/results`**
- Method: GET
- URL: `http://localhost:3000/api/polls/results?pollBlockId=cms-multi-poll-1&dppId=test-dpp-id`
- Headers: `Cookie: next-auth.session-token=YOUR_SESSION_TOKEN`

---

### 2. Datenbank direkt prüfen

#### Prisma Studio (GUI)

```bash
npx prisma studio
```

Öffnet eine Web-Oberfläche unter `http://localhost:5555`:
- Navigiere zu `PollResponse` Tabelle
- Sieh alle gespeicherten Antworten
- Prüfe `responses` JSON-Feld
- Prüfe `sessionId` für Duplikat-Prävention

#### SQL direkt

```sql
-- Alle Poll-Antworten anzeigen
SELECT * FROM poll_responses;

-- Antworten für einen spezifischen Poll
SELECT * FROM poll_responses 
WHERE "pollBlockId" = 'cms-multi-poll-1' 
AND "dppId" = 'test-dpp-id';

-- Anzahl Antworten pro Poll
SELECT "pollBlockId", COUNT(*) as total_responses
FROM poll_responses
GROUP BY "pollBlockId";

-- Antworten mit JSON-Details
SELECT 
  id,
  "pollBlockId",
  "dppId",
  responses,
  "sessionId",
  "createdAt"
FROM poll_responses
ORDER BY "createdAt" DESC;
```

---

### 3. Frontend-Integration testen

#### Test-Seite mit Backend

1. **Migration ausführen:**
   ```bash
   npx prisma migrate deploy
   ```

2. **BlockType seeden:**
   ```bash
   node scripts/seed-multi-question-poll.mjs
   ```

3. **Test-Seite öffnen:**
   ```
   http://localhost:3000/public/test-dpp
   ```

4. **Umfrage ausfüllen:**
   - Scrolle zu "Ihre Meinung"
   - Beantworte alle 3 Fragen
   - Klicke auf "Absenden"

5. **Prüfe Browser-Konsole:**
   - Suche nach `[MultiQuestionPollRenderer]` Logs
   - Prüfe Network-Tab für `/api/polls/submit` Request
   - Prüfe Response (sollte `success: true` sein)

6. **Prüfe Datenbank:**
   ```bash
   npx prisma studio
   ```
   Oder SQL:
   ```sql
   SELECT * FROM poll_responses WHERE "pollBlockId" = 'cms-multi-poll-1';
   ```

---

### 4. Dashboard-Integration testen

1. **Erstelle einen echten DPP:**
   - Gehe zu `/app/create`
   - Erstelle einen neuen DPP
   - Notiere die DPP-ID

2. **Füge Multi-Question Poll hinzu:**
   - Im CMS-Branch: `/app/dpp/[dppId]/cms`
   - Füge "Multi-Question Poll" Block hinzu
   - Konfiguriere Fragen
   - Speichere und veröffentliche

3. **Fülle Umfrage mehrmals aus:**
   - Öffne `/public/dpp/[dppId]`
   - Fülle die Umfrage aus (verschiedene Antworten)
   - Wiederhole 3-5x mit verschiedenen Antworten

4. **Prüfe Dashboard:**
   - Gehe zu `/app/dashboard`
   - Prüfe "Umfrage-Ergebnisse" Kachel
   - Klicke auf die Umfrage
   - Prüfe, ob Ergebnisse korrekt angezeigt werden

---

### 5. API-Validierung testen

#### Fehlerhafte Requests testen

**Fehlende Parameter:**
```bash
curl -X POST http://localhost:3000/api/polls/submit \
  -H "Content-Type: application/json" \
  -d '{}'
# Erwartet: 400 Bad Request
```

**Ungültige DPP-ID:**
```bash
curl -X POST http://localhost:3000/api/polls/submit \
  -H "Content-Type: application/json" \
  -d '{
    "pollBlockId": "invalid",
    "dppId": "non-existent",
    "responses": []
  }'
# Erwartet: 404 Not Found
```

**Leere Antworten:**
```bash
curl -X POST http://localhost:3000/api/polls/submit \
  -H "Content-Type: application/json" \
  -d '{
    "pollBlockId": "cms-multi-poll-1",
    "dppId": "test-dpp-id",
    "responses": []
  }'
# Erwartet: 400 Bad Request
```

---

### 6. Performance-Test

**Mehrere Antworten schnell hintereinander:**
```bash
# Test-Script für Load-Test
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/polls/submit \
    -H "Content-Type: application/json" \
    -d "{
      \"pollBlockId\": \"cms-multi-poll-1\",
      \"dppId\": \"test-dpp-id\",
      \"responses\": [
        {\"questionIndex\": 0, \"answer\": \"Option $i\"}
      ],
      \"sessionId\": \"load-test-session-$i\"
    }" &
done
wait
```

---

## 📊 Test-Checkliste

### API-Endpunkte
- [ ] `/api/polls/submit` - Erfolgreiche Antwort
- [ ] `/api/polls/submit` - Duplikat-Prävention (409)
- [ ] `/api/polls/submit` - Fehlende Parameter (400)
- [ ] `/api/polls/submit` - Ungültige DPP-ID (404)
- [ ] `/api/polls/results` - Ohne Login (401)
- [ ] `/api/polls/results` - Mit Login (200)
- [ ] `/api/polls/results` - Keine Berechtigung (403)
- [ ] `/api/polls/results` - Keine Ergebnisse (200, empty)

### Datenbank
- [ ] Antworten werden gespeichert
- [ ] `sessionId` wird korrekt gespeichert
- [ ] `responses` JSON ist korrekt formatiert
- [ ] `createdAt` wird automatisch gesetzt
- [ ] Foreign Key zu `dpps` funktioniert
- [ ] Cascade Delete funktioniert (wenn DPP gelöscht wird)

### Frontend-Integration
- [ ] Poll wird gerendert
- [ ] Antworten können ausgewählt werden
- [ ] Submit-Request wird gesendet
- [ ] Success-Message wird angezeigt
- [ ] Duplikat wird verhindert (LocalStorage)
- [ ] Completion Message wird angezeigt

### Dashboard
- [ ] PollResultsCard erscheint
- [ ] Umfragen werden gelistet
- [ ] Teilnehmer-Anzahl ist korrekt
- [ ] Klick führt zu DPP-Details
- [ ] Ergebnisse werden korrekt aggregiert

---

## 🔍 Debugging

### Server-Logs prüfen

```bash
# Next.js Dev-Server zeigt Logs in der Konsole
# Suche nach:
# - "[Poll API]"
# - "Error submitting poll response"
# - "Error fetching poll results"
```

### Browser DevTools

**Network-Tab:**
- Prüfe `/api/polls/submit` Requests
- Prüfe Response-Status (200, 400, 404, 409, 500)
- Prüfe Response-Body
- Prüfe Request-Payload

**Console-Tab:**
- Prüfe `[MultiQuestionPollRenderer]` Logs
- Prüfe Fehler-Meldungen
- Prüfe API-Response

### Datenbank-Logs

```sql
-- Prüfe letzte Antworten
SELECT * FROM poll_responses 
ORDER BY "createdAt" DESC 
LIMIT 10;

-- Prüfe Antworten-Struktur
SELECT 
  id,
  "pollBlockId",
  responses,
  "sessionId"
FROM poll_responses
WHERE "pollBlockId" = 'cms-multi-poll-1';
```

---

## 🚀 Schnellstart

**1. Backend-Test ohne Frontend:**
```bash
node scripts/test-poll-api.mjs
```

**2. Backend-Test mit Frontend:**
```bash
# Migration
npx prisma migrate deploy

# Seed
node scripts/seed-multi-question-poll.mjs

# Dev-Server
npm run dev

# Test-Seite öffnen
# http://localhost:3000/public/test-dpp
```

**3. Datenbank prüfen:**
```bash
npx prisma studio
# Öffnet http://localhost:5555
```
