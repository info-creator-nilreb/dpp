# DPP Preflight Backend - Setup

## Dependencies installieren

Die folgenden NPM-Packages müssen installiert werden:

```bash
npm install pdf-parse cheerio openai @types/pdf-parse
```

## Environment Variables

Stelle sicher, dass die folgende Environment Variable gesetzt ist:

```bash
OPENAI_API_KEY=your-openai-api-key-here
```

## Model-Hinweis

Das Backend verwendet aktuell `gpt-4o` als OpenAI-Modell, da `gpt-4.1` nicht existiert.
Falls Sie ein anderes Modell verwenden möchten, ändern Sie die `model`-Property in:
`src/lib/preflight/openai-service.ts`

## API Endpoints

### POST /api/app/dpps/preflight/pdf
- Content-Type: `multipart/form-data`
- Body: PDF-Datei im Feld `file`
- Response: PreflightResponse JSON

### POST /api/app/dpps/preflight/url
- Content-Type: `application/json`
- Body: `{ "url": "https://example.com" }`
- Response: PreflightResponse JSON

## Funktionsweise

1. **Text-Extraktion**:
   - PDF: `pdf-parse` extrahiert Text
   - Website: `cheerio` parst HTML und entfernt Scripts/Navigation

2. **AI-Analyse**:
   - OpenAI GPT-4o analysiert extrahierten Text
   - Erkennt Produktkategorie
   - Prüft Pflichtfelder (aktuell: name, sku, brand, countryOfOrigin, materials)

3. **Response**:
   - Detected Category mit Confidence
   - Overall Score (Anzahl GREEN / Gesamt)
   - Results pro Feld mit Status (GREEN/YELLOW/RED)

## Hinweise

- Max. Text-Länge: 12.000 Zeichen (wird automatisch gekürzt)
- PDF Max-Größe: 10 MB
- Timeout für Website-Fetch: 10 Sekunden
- AI max_tokens: 900
- AI temperature: 0 (deterministic)

