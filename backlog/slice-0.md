# SLICE-0: Foundation (MVP-Core) – Backlog Issues

**Parity Spec:** PARITY_SPEC.md | **Ziel:** Auth + DPP-Basis ohne Lieferanten/Subscription

---

## Issue 1: Gateway – SLICE-0 Auth & Routing

**Service:** gateway  
**Typ:** Story / Epic

### Ziel

Authentifizierung (Login, Signup, E-Mail-Verifizierung, 2FA) und Routing für Foundation-APIs bereitstellen. Auth-Endpoints sowie DPP- und Audit-Log-Routen werden korrekt weitergeleitet.

### Betroffene IDs

| Kategorie | IDs |
|-----------|-----|
| CAP | CAP-001 (Auth Login), CAP-002 (Signup), CAP-003 (E-Mail-Verifizierung), CAP-005 (2FA), CAP-024 (Audit Logs) |
| API | API-001 bis API-013 (Auth), API-110, API-111 (Audit Logs) |
| FLOW | FLOW-001 (Login), FLOW-002 (Signup Phase 1), FLOW-003 (E-Mail verifizieren) |

### Akzeptanzkriterien

**Auth (API-001–013):**
- [ ] NextAuth Handler (API-001) für Session, Credentials
- [ ] Signup Phase 1 (API-003): User anlegen, Verification-Mail
- [ ] E-Mail-Verifizierung (API-005, API-006, API-010)
- [ ] Passwort (API-007, API-008, API-009)
- [ ] 2FA (API-012, API-013)
- [ ] Invitation abrufen (API-004), Logout (API-011)

**Audit Logs (API-110, 111):**
- [ ] GET audit-logs: Gefilterte Platform-Audit-Logs
- [ ] GET audit-logs/[logId]: Einzelner Log
- [ ] Session erforderlich, Org-Scoping

**Allgemein:**
- [ ] Fehlerantworten folgen dem Platform-Error-Schema `{ error: string }`
- [ ] Öffentliche Auth-Routen (verify-email, forgot-password etc.) ohne Session erreichbar

### Test Cases

| ID | Beschreibung | Success | Negative 1 | Negative 2 |
|----|--------------|---------|------------|------------|
| TC-G0-1 | FLOW-001 Login | Credentials OK → Session | Falsches Passwort → 401 | Deaktivierter User → 401 |
| TC-G0-2 | FLOW-002 Signup Phase 1 | User + Verification-Mail | E-Mail vorhanden → 400 | Passwort zu kurz → 400 |
| TC-G0-3 | FLOW-003 E-Mail verifizieren | Token → emailVerified=true | Token abgelaufen | Token ungültig |
| TC-G0-4 | GET audit-logs ohne Auth | 401 | — | — |
| TC-G0-5 | GET audit-logs mit Session | 200, gefilterte Logs | — | — |

### Definition of Done

- [ ] Alle API-IDs 001–013, 110, 111 implementiert
- [ ] Parity-Harness-Golden-Requests für Auth-Flows
- [ ] UI (UI-001..006): Komponenten nutzen design-tokens (Regel 11)
- [ ] Code-Review abgeschlossen

---

## Issue 2: User-Service – SLICE-0 User & Session

**Service:** user-service  
**Typ:** Story

### Ziel

User-Anlage, Session-Verwaltung und Nutzerdaten für Auth-Flows bereitstellen. Objekte User, Organization, Membership als Grundlage für SLICE-0.

### Betroffene IDs

| Kategorie | IDs |
|-----------|-----|
| CAP | CAP-001, CAP-002, CAP-003, CAP-005 |
| API | — (bereitgestellt für Auth via gateway) |
| FLOW | FLOW-001, FLOW-002, FLOW-003 |
| OBJ | OBJ-001 (User), OBJ-002 (Organization), OBJ-003 (Membership) |

### Akzeptanzkriterien

- [ ] User-CRUD für Signup (email, password, verificationToken)
- [ ] E-Mail-Verifizierung: emailVerified setzen
- [ ] 2FA: totpSecret, totpEnabled
- [ ] Membership als Quelle der Wahrheit für Org-Zuordnung
- [ ] Session-Kompatibilität mit NextAuth

### Test Cases

- [ ] Signup erstellt User mit verificationToken
- [ ] Verify-Email setzt emailVerified=true
- [ ] Login prüft Credentials und 2FA falls aktiv

### Definition of Done

- [ ] OBJ-001, OBJ-002, OBJ-003 korrekt persistiert
- [ ] Keine Breaking Changes für bestehende Auth-Flows
- [ ] Code-Review abgeschlossen

---

## Issue 3: DPP-Management-Service – DPP CRUD & Content

**Service:** dpp-management-service  
**Typ:** Story / Epic

### Ziel

DPP-Erstellung, -Bearbeitung und Content-Verwaltung ohne Lieferanten und Subscription. Basis für alle weiteren DPP-Funktionen.

### Betroffene IDs

| Kategorie | IDs |
|-----------|-----|
| CAP | CAP-010 (DPP CRUD), CAP-011 (DPP Content) |
| API | API-041 bis API-060 |
| FLOW | FLOW-008 (DPP erstellen), FLOW-009 (DPP bearbeiten) |
| OBJ | OBJ-004 (Dpp), OBJ-021 bis OBJ-026 (Template, TemplateBlock, TemplateField, FeatureRegistry, BlockType, DppContent), OBJ-017 (PlatformAuditLog) |

### Akzeptanzkriterien

**DPP CRUD (API-041–050):**
- [ ] GET/POST dpps, dpp: Liste, Erstellen
- [ ] GET/PUT dpp/[dppId]: Einzeln lesen/aktualisieren
- [ ] GET template-by-category
- [ ] POST import, GET csv-template, preflight/url, preflight/pdf

**Content & Blöcke (API-051–060):**
- [ ] GET/POST/PUT content: DppContent mit blocks (JSON)
- [ ] GET/PUT content/styling
- [ ] GET unified-blocks
- [ ] POST/PUT/DELETE content/blocks, POST blocks/reorder

**Side Effects:**
- [ ] EVT-012: PlatformAuditLog bei DPP/Content-Aktionen

### Test Cases

| ID | Beschreibung | Success | Negative 1 | Negative 2 |
|----|--------------|---------|------------|------------|
| TC-D0-1 | FLOW-008 DPP erstellen | Template → DPP + Content | Keine Org → Fehler | Template nicht gefunden → 404 |
| TC-D0-2 | FLOW-009 DPP bearbeiten | Content/Blocks speichern | Keine Edit-Rechte → 403 | DPP nicht gefunden → 404 |
| TC-D0-3 | GET dpps | Liste für Org | Keine Session → 401 | — |
| TC-D0-4 | POST content/blocks | Block hinzugefügt | Ungültiger Block → 400 | DPP nicht gefunden → 404 |

### Definition of Done

- [ ] Alle API-IDs 041–060 implementiert
- [ ] OBJ-004, OBJ-021 bis OBJ-026, OBJ-017 korrekt persistiert
- [ ] Parity-Harness läuft grün für SLICE-0 DPP/Content
- [ ] UI (UI-007..009, UI-012, UI-013, UI-015): design-tokens (Regel 11), [GATE][UI][SLICE-0]
- [ ] Code-Review abgeschlossen

---

---

## [GATE] Parität SLICE-0 grün

**Typ:** Abnahme-Ticket  
**Bedingung:** Alle Implementierungs-Issues (1–3) abgeschlossen.

### Abnahmekriterien (messbar)

1. [ ] Golden Requests für folgende API-IDs vorhanden: API-003, API-005, API-001, API-041, API-044, API-051, API-110
2. [ ] `MODE=compare ALT_BASE_URL=<alt> NEW_BASE_URL=<new> npm run parity:ci` endet mit Exit 0
3. [ ] FLOW-001, FLOW-002, FLOW-003, FLOW-008, FLOW-009 über Request-Sequenzen abgedeckt (Success + mind. 1 Negative pro Flow)
4. [ ] Snapshots nutzen Normalisierung (config/normalize.json): Zeitstempel, IDs, Token → [TOLERATED]/[REDACTED]

### Test Notes

- Auth-Fixtures: FIXTURE_USER_ID, Session-Cookie aus Login-Flow
- DPP-Fixtures: FIXTURE_DPP_ID für content/media-Endpunkte
- Referenz: PARITY_SPEC.md Abschnitt L) Slice-Gates – SLICE-0 Gate

---

## [GATE][UI][SLICE-0] UI-Parität grün

**Typ:** Abnahme-Sub-Gate (zusätzlich zu API-Parität)

### UI-IDs (SLICE-0)

| UI-ID | Route |
|-------|-------|
| UI-001 | /login |
| UI-002 | /signup |
| UI-003 | /verify-email |
| UI-004 | /forgot-password |
| UI-005 | /reset-password |
| UI-006 | /password |
| UI-007 | /app/dashboard |
| UI-008 | /app/dpps |
| UI-009 | /app/dpps/[id] |
| UI-012, UI-013 | /app/create, /app/create/new |
| UI-015 | /app/audit-logs |

### Abnahmekriterien

1. [ ] `cd ui-parity && npm run ui:parity` (compare) endet mit 0 Diffs
2. [ ] Alle Viewports (Desktop 1440×900, Tablet 768×1024, Mobile 390×844) für UI-001, UI-002, UI-008
3. [ ] Baseline nur bewusst mit Review aktualisieren (Record-Modus)

**Referenz:** ui-parity/UI_PARITY_SPEC.md, ui-parity/README.md

---

## Slice-0 Übersicht

| Service | Issue | Priorität |
|---------|-------|-----------|
| gateway | Auth & Audit-Logs Routing | Hoch |
| user-service | User & Session für Auth | Hoch |
| dpp-management-service | DPP CRUD & Content | Hoch |
