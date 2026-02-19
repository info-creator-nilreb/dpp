# Prompt-Template: Umsetzung eines Slices

Kopiere diesen Block und ergänze/ersetze die Platzhalter. So bleiben alle Inputs präzise und im Zusammenhang verarbeitbar.

---

## Beispiel-Prompt: SLICE-0 umsetzen

```markdown
## Aufgabe

Setze SLICE-0 (Foundation) vollständig um. Folge den EXECUTION_RULES und den Specs exakt.

---

## 1. Eingabedateien (in dieser Reihenfolge lesen)

| Priorität | Datei | Inhalt |
|-----------|-------|--------|
| 1 | `backlog/EXECUTION_RULES.md` | Alle Regeln, Befehle, ENV, Checklisten |
| 2 | `backlog/slice-0.md` | User Stories (Issue 1–3), [GATE], [GATE][UI] |
| 3 | `PARITY_SPEC.md` | Abschnitte D (API-Inventory), E (Data Dictionary), L (Slice-Gates) für Kontext |
| 4 | `backlog/SLICE_UI_MAPPING.md` | Slice → Issue → UI-IDs |
| 5 | `prisma/schema.prisma` | OBJ-Definitionen (User, Organization, Dpp, etc.) |
| 6 | `contracts/schemas/error.json` | Error-Schema |

---

## 2. Slice-0 Kontext (explizit)

**Ziel:** Auth + DPP-Basis ohne Lieferanten/Subscription

**CAP-IDs:** CAP-001 (Login), CAP-002 (Signup), CAP-003 (E-Mail-Verifizierung), CAP-005 (2FA), CAP-010 (DPP CRUD), CAP-011 (DPP Content), CAP-024 (Audit Logs)

**API-IDs:** API-001 bis API-013 (Auth), API-110, API-111 (Audit), API-041 bis API-060 (DPP)

**FLOW-IDs:** FLOW-001 (Login), FLOW-002 (Signup), FLOW-003 (E-Mail verifizieren), FLOW-008 (DPP erstellen), FLOW-009 (DPP bearbeiten)

**OBJ-IDs:** OBJ-001 (User), OBJ-002 (Organization), OBJ-003 (Membership), OBJ-004 (Dpp), OBJ-021–026 (Template etc.), OBJ-017 (PlatformAuditLog)

**UI-IDs:** UI-001 (/login), UI-002 (/signup), UI-003–006 (verify, forgot, reset, password), UI-007–009 (dashboard, dpps, dpp editor), UI-012–013 (create), UI-015 (audit-logs)

**EVT-IDs:** EVT-012 (PlatformAuditLog)

---

## 3. Issues (Reihenfolge der Umsetzung)

1. **Issue 1** (Gateway): Auth-Routing, API-001–013, API-110, 111. Akzeptanzkriterien aus slice-0.md.
2. **Issue 2** (User-Service): User, Organization, Membership. OBJ-001, 002, 003.
3. **Issue 3** (DPP-Management): DPP CRUD, Content. API-041–060, OBJ-004, 021–026, 017.

---

## 4. Gate-Bedingungen (Abnahme)

**[GATE] Parität SLICE-0 grün:**
- Golden Requests für: API-003, API-005, API-001, API-041, API-044, API-051, API-110
- Befehl: `cd parity-harness && MODE=compare ALT_BASE_URL=<alt> NEW_BASE_URL=<new> npm run parity:ci` → Exit 0
- FLOW-001, 002, 003, 008, 009: Success + mind. 1 Negative jeweils

**[GATE][UI][SLICE-0]:**
- UI-Komponenten nutzen `import { tokens } from '@/lib/design-tokens'` (keine Hardcodings)
- Befehl: `cd ui-parity && npm run ui:parity` → 0 Diffs
- Betroffene UI-IDs: 001, 002, 003, 004, 005, 006, 007, 008, 009, 012, 013, 015

---

## 5. Technische Vorgaben

- **Error-Schema:** `{ "error": "string" }` (contracts/schemas/error.json)
- **Fixture-IDs:** FIXTURE_USER_ID, FIXTURE_DPP_ID, FIXTURE_ORG_ID in pathParams
- **Normalisierung:** parity-harness/config/normalize.json für tolerierte Felder
- **Auth:** Parität zum Alt-System (Option 1), PARITY_SPEC Abschnitt J

---

## 6. Erwartete Ausgabe

- Implementierter Code für alle drei Issues
- Golden Requests in `parity-harness/tests/golden/requests/` für die genannten API-IDs
- Keine neuen CAP/API/FLOW/OBJ/EVT-IDs; bestehende exakt verwenden
- DoD aller drei Issues erfüllt; [GATE] und [GATE][UI] bestanden
```

---

## Anpassung für andere Slices

Ersetze für SLICE-1 bis SLICE-5:

- `slice-0` → `slice-1` … `slice-5`
- Abschnitt 2: CAP/API/FLOW/OBJ/UI/EVT aus der jeweiligen slice-X.md und PARITY_SPEC.md M) Slice Plan
- Abschnitt 4: [GATE]- und [GATE][UI]-Kriterien aus der jeweiligen slice-X.md

Die Struktur (Eingabedateien, Kontext, Issues, Gate-Bedingungen, Technische Vorgaben) bleibt gleich.
