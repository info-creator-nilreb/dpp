# Umsetzungsregeln (Execution Rules)

**Verwendung als Input:** Dieses Dokument kann vollständig in Prompts, Tickets oder Anweisungen kopiert werden. Alle Befehle, Pfade und ENV-Variablen sind exakt angegeben.

**Projektroot:** `/` (Verzeichnis mit PARITY_SPEC.md, backlog/, parity-harness/, ui-parity/, contracts/, src/)

---

## Projektstruktur (relevante Pfade)

| Pfad | Inhalt |
|------|--------|
| `PARITY_SPEC.md` | Spec mit CAP/API/FLOW/OBJ/EVT-IDs, Slice-Gates |
| `backlog/slice-0.md` … `slice-5.md` | User Stories, [GATE]-Tickets, [GATE][UI] |
| `backlog/SLICE_UI_MAPPING.md` | Slice → Issue → UI-IDs → FLOW-IDs |
| `parity-harness/` | API-Parität (ALT vs NEW) |
| `parity-harness/tests/golden/requests/*.json` | Golden Requests |
| `parity-harness/config/normalize.json` | Normalisierung (ignorePaths, redactPaths, sortRules) |
| `parity-harness/parity.config.json` | altBaseUrl, newBaseUrl, timeoutMs |
| `ui-parity/` | Visuelle Regression (Playwright) |
| `ui-parity/tokens.css`, `ui-parity/tokens.json` | Design-Tokens |
| `src/lib/design-tokens.ts` | Tokens für Inline-Styles |
| `contracts/schemas/error.json` | Platform-Error-Schema |
| `contracts/openapi-slice1.yaml`, `openapi-slice2.yaml` | OpenAPI SLICE-1, SLICE-2 |

---

## 1. Slice-Reihenfolge

Slices strikt sequenziell: **SLICE-0 → SLICE-1 → SLICE-2 → SLICE-3 → SLICE-4 → SLICE-5**.

- Kein Slice als „abgeschlossen“ markieren, solange [GATE] nicht grün.
- SLICE-5: intern 5a/5b priorisierbar; offizielle ID bleibt SLICE-5.
- **Prüfpfad:** `backlog/slice-X.md` → [GATE] Parität SLICE-X grün.

---

## 2. Gate-Regel (API-Parität)

**Bedingung:** [GATE] in `backlog/slice-X.md` gilt als bestanden, wenn:

1. Golden Requests für alle API-IDs des Slice-Gates in `parity-harness/tests/golden/requests/*.json` vorhanden sind.
2. Befehl mit Exit 0 endet (siehe unten).
3. Pro FLOW: mind. 1 Success- und 1 Negative-Fall abgedeckt.

**Befehl (kopierbar):**
```bash
cd parity-harness
MODE=compare ALT_BASE_URL=<ALT_URL> NEW_BASE_URL=<NEW_URL> npm run parity:ci
```

**ENV-Beispiel:**
```
ALT_BASE_URL=https://alt.example.com
NEW_BASE_URL=https://new.example.com
```

**Ohne grünes Gate:** Slice nicht als „done“ markieren.

---

## 3. Tests sind Pflicht (pro API-Gruppe)

| Typ | Bedeutung | Ort |
|-----|-----------|-----|
| **CONTRACT** | OpenAPI/Schema | `contracts/*` oder Backlog-Verweis |
| **TEST** | Parity Success + mind. 1 Negative | Golden Request + Test Case (TC-xxx) |
| **IMPL** | Implementierung | Issue mit messbaren Akzeptanzkriterien |

Fehlt eines → vor Slice-Abschluss ergänzen.

---

## 4. Snapshots neu aufnehmen

**Erlaubt (MODE=record):**
1. Bewusste Änderung am Alt-System (Schema, neues Feld).
2. `parity-harness/config/normalize.json` erweitert (ignorePaths etc.) und Snapshots damit inkonsistent.
3. Fixture-IDs geändert (neue Test-Org, neuer DPP).

**Nicht erlaubt:** Snapshots nur ändern, um Paritätsfehler zu verdecken.

**Befehl:**
```bash
cd parity-harness
MODE=record ALT_BASE_URL=<ALT_URL> npm run parity
```

---

## 5. Normalisierung

- **Config:** `parity-harness/config/normalize.json` (oder `NORMALIZE_CONFIG=<pfad>`).
- Zeitstempel, IDs, Token, signierte URLs werden vor Compare/Record normalisiert.
- Neue flaky-Felder → `ignorePaths` oder `redactPaths` ergänzen, ggf. Snapshots neu aufnehmen (Regel 4).

---

## 6. Fixture-Strategie

- **IDs:** FIXTURE_USER_ID, FIXTURE_DPP_ID, FIXTURE_ORG_ID etc. zentral (Seed/Fixtures).
- **Golden Requests:** `pathParams` nutzen, z.B. `{"DPP_ID": "FIXTURE_DPP_ID"}`.
- **Side Effects:** SMTP Stub, Stripe Test-Mode, Storage lokal/Fake.

**Golden-Request-Format** (`parity-harness/tests/golden/requests/<name>.json`):
```json
{
  "name": "GET /api/app/dpps",
  "method": "GET",
  "path": "/api/app/dpps",
  "headers": {},
  "body": null
}
```
Mit Pfadparametern: `"path": "/api/app/dpp/{{DPP_ID}}/media"`, `"pathParams": {"DPP_ID": "<id>"}`.

---

## 7. Auth-Entscheidung

- **Option 1 (gültig):** Parität zum Alt-System. API-001–013, API-112–114 in Parity-DoD.
- Auth-Änderung (z.B. IdP) nur mit Anpassung PARITY_SPEC.md Abschnitt J.

---

## 8. Error-Schema

- Alle Fehlerantworten: `{ "error": "string" }`.
- Referenz: `contracts/schemas/error.json`

---

## 9. IDs nicht erfinden

- Neue CAP/API/OBJ/FLOW/EVT-IDs nur nach Ergänzung in PARITY_SPEC.md.
- Bestehende IDs exakt verwenden; keine Umnummerierung.

---

## 10. Parity-Harness Befehle

**Working Directory:** `parity-harness/`

| Befehl | Zweck |
|--------|-------|
| `MODE=compare ALT_BASE_URL=... NEW_BASE_URL=... npm run parity:ci` | Compare, Exit 1 bei Fehler |
| `MODE=record ALT_BASE_URL=... npm run parity` | Snapshots gegen ALT aufnehmen |
| `npm run parity -- --dry-run` | Requests auflisten |
| `PARITY_OUTPUT=out npm run parity` | Report in anderes Verzeichnis |

**ENV:** `ALT_BASE_URL`, `NEW_BASE_URL`, `MODE` (record|compare), `NORMALIZE_CONFIG`, `PARITY_OUTPUT`

---

## 11. UI-Tokens (Neuentwicklung)

- **Quelle:** `src/lib/design-tokens.ts`, `ui-parity/tokens.css`
- **Regel:** Neue Komponenten ausschließlich Tokens. Keine Hardcodings (#24c598, "12px").
- **Layout:** `src/app/layout.tsx` importiert `../../ui-parity/tokens.css`.
- **Import-Beispiel:** `import { tokens } from '@/lib/design-tokens'` → `style={{ color: tokens.colors.brand.accent }}`
- **Referenz:** `ui-parity/ENTWICKLUNGSREGELN.md`, `ui-parity/TOKENS_GUIDE.md`
- **Mapping:** `backlog/SLICE_UI_MAPPING.md`

---

## 12. User Story mit Frontend = Dreiklang

Bei jeder Story mit UI-Bezug:

1. **API:** Golden Requests, Parity-Harness (Regel 2, 10)
2. **Flow:** Test Cases (TC-xxx) mit Success + Negative
3. **UI:** design-tokens (Regel 11), [GATE][UI][SLICE-X] in `backlog/slice-X.md`

**Mapping:** `backlog/SLICE_UI_MAPPING.md` → Slice/Issue → UI-IDs.

---

## 13. UI-Parität Befehle

**Working Directory:** `ui-parity/`

| Befehl | Zweck |
|--------|-------|
| `UI_BASE_URL=http://localhost:3000 npm run ui:parity` | Compare gegen Baseline |
| `UI_PARITY_RECORD=1 UI_BASE_URL=... npm run ui:parity` | Baseline-Screenshots erstellen |
| `npm run ui:parity -- tests/ui-001-login.spec.ts` | Nur Login-Tests |

**ENV:** `UI_BASE_URL` (default: localhost:3000), `UI_PARITY_RECORD` (1 = record)

**Viewports:** Desktop 1440×900, Tablet 768×1024, Mobile 390×844

---

## Checkliste Slice-Abnahme (kopierbar)

```
□ API: cd parity-harness && MODE=compare ALT_BASE_URL=... NEW_BASE_URL=... npm run parity:ci → Exit 0
□ Golden Requests für alle API-IDs des Slice-Gates vorhanden
□ Pro FLOW: Success + mind. 1 Negative
□ UI (falls Frontend): Komponenten nutzen design-tokens
□ UI (falls Frontend): cd ui-parity && npm run ui:parity → 0 Diffs
□ Code-Review abgeschlossen
□ [GATE] in backlog/slice-X.md als bestanden markiert
```
