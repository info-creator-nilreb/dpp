# SLICE-1: Media & Publish – Backlog Issues

**Parity Spec:** PARITY_SPEC.md | **Ziel:** Medien, Veröffentlichung, Versionen, QR-Code

**UI-Mapping:** [SLICE_UI_MAPPING.md](SLICE_UI_MAPPING.md)

---

## Issue 1: Gateway – SLICE-1 Routing & Auth

**Service:** gateway  
**Typ:** Story / Task

### Ziel

Routing und Authentifizierung für alle DPP Media- und Publish-APIs bereitstellen. Anfragen an `/api/app/dpp/{dppId}/media`, `/api/app/dpp/{dppId}/template`, `/api/app/dpp/{dppId}/publish` und `/api/app/dpp/{dppId}/versions` werden authentifiziert und an den dpp-management-service weitergeleitet.

### Betroffene IDs

| Kategorie | IDs |
|-----------|-----|
| CAP | CAP-012 (DPP Media), CAP-013 (DPP Publish) |
| API | API-061, API-062, API-063, API-064, API-065, API-066, API-077, API-080, API-081, API-082, API-083, API-084 |
| FLOW | FLOW-010 (Medien hochladen), FLOW-011 (DPP veröffentlichen), FLOW-020 (Öffentliche DPP-Ansicht) |

### Akzeptanzkriterien

- [ ] Alle genannten API-Pfade werden korrekt weitergeleitet
- [ ] Session-basierte Authentifizierung wird geprüft (401 bei fehlender Session)
- [ ] Fehlerantworten folgen dem Platform-Error-Schema `{ error: string }`
- [ ] Öffentliche DPP-Ansicht (/public/dpp/[dppId]) erfolgt ohne Auth für publizierte DPPs

### Test Cases

| ID | Beschreibung | Erwartung |
|----|--------------|-----------|
| TC-G1-1 | GET /api/app/dpp/{dppId}/media ohne Auth | 401 |
| TC-G1-2 | GET /api/app/dpp/{dppId}/media mit gültiger Session | Weiterleitung, 200/404 |
| TC-G1-3 | POST /api/app/dpp/{dppId}/publish mit gültiger Session | Weiterleitung an dpp-management-service |

### Definition of Done

- [ ] Routing-Konfiguration dokumentiert
- [ ] Parity-Harness-Golden-Requests für betroffene APIs hinzugefügt
- [ ] Code-Review abgeschlossen

---

## Issue 2: DPP-Management-Service – Media & Publish

**Service:** dpp-management-service  
**Typ:** Story / Epic

### Ziel

Implementierung von Media-Upload/-Management, DPP-Veröffentlichung, Versionen und QR-Code-Generierung. Alle API-Endpunkte gemäß PARITY_SPEC SLICE-1 bereitstellen.

### Betroffene IDs

| Kategorie | IDs |
|-----------|-----|
| CAP | CAP-012 (DPP Media), CAP-013 (DPP Publish) |
| API | API-061, API-062, API-063, API-064, API-065, API-066, API-077, API-080, API-081, API-082, API-083, API-084 |
| FLOW | FLOW-010, FLOW-011, FLOW-020 |
| OBJ | OBJ-007 (DppMedia), OBJ-008 (DppVersion), OBJ-009 (DppVersionMedia) |
| EVT | EVT-005 (dpp_published), EVT-012 (Audit), EVT-013 (saveFile), EVT-014 (deleteFile) |

### Akzeptanzkriterien

**Media (API-061–066):**
- [ ] GET: Alle Medien eines DPPs auflisten, sortiert nach sortOrder/uploadedAt
- [ ] POST: Datei-Upload (Bilder, PDF, Video), Validierung Typ/Größe, Speicherung in Storage
- [ ] PATCH: Reihenfolge (mediaIds) und Metadaten (displayName) aktualisierbar
- [ ] DELETE: Medium löschen (by mediaId oder storageUrl), Hard-Delete nur wenn nicht in Version genutzt

**Publish & Versions (API-077, 080–084):**
- [ ] GET template: Template des DPP abrufen
- [ ] POST publish: DRAFT → PUBLISHED, neue Version, Content-Snapshot, Media-Kopie
- [ ] GET versions: Alle Versionen auflisten
- [ ] GET versions/{n}: Einzelversion inkl. publicUrl
- [ ] GET versions/{n}/qr-code: SVG für Download
- [ ] GET versions/{n}/qr-code-preview: SVG für Anzeige

**Side Effects:**
- [ ] EVT-005: Notification bei Veröffentlichung
- [ ] EVT-012: PlatformAuditLog bei Media-/Publish-Aktionen
- [ ] EVT-013/EVT-014: Storage save/delete

### Test Cases

| ID | Beschreibung | Success | Negative 1 | Negative 2 |
|----|--------------|---------|------------|------------|
| TC-D1-1 | FLOW-010 Medien hochladen | Datei → DppMedia, Storage-URL | Dateityp nicht erlaubt → 400 | Größe überschritten → 400 |
| TC-D1-2 | FLOW-011 DPP veröffentlichen | DRAFT → PUBLISHED, Version | Validierung fehlgeschlagen → 400 | Keine Publish-Rechte → 403 |
| TC-D1-3 | FLOW-020 Öffentliche DPP-Ansicht | /public/dpp/[dppId] → Inhalt | DPP nicht publiziert → 404 | Nicht gefunden → 404 |
| TC-D1-4 | Media DELETE (by mediaId) | 200, Medium gelöscht | Medium nicht gefunden → 404 | Keine Edit-Rechte → 403 |
| TC-D1-5 | QR-Code Endpoints | SVG zurück | Version nicht gefunden → 404 | publicUrl fehlt → 404 |

### Definition of Done

- [ ] Alle API-IDs 061–066, 077, 080–084 implementiert
- [ ] OpenAPI-Spec (contracts/openapi-slice1.yaml) erfüllt
- [ ] OBJ-007, OBJ-008, OBJ-009 korrekt persistiert
- [ ] EVT-005, EVT-012, EVT-013, EVT-014 ausgelöst
- [ ] Parity-Harness läuft grün für SLICE-1
- [ ] UI (UI-009 Media, UI-010, UI-011, UI-026): design-tokens (Regel 11), [GATE][UI][SLICE-1]
- [ ] Code-Review abgeschlossen

---

## Issue 3: User-Service – SLICE-1 (keine Änderung)

**Service:** user-service  
**Typ:** Task

### Ziel

Keine direkten Änderungen im user-service für SLICE-1. Die Notification (EVT-005) wird vom dpp-management-service ausgelöst und zielt auf User; der user-service stellt die Notification-API (API-094–096) bereit, die in SLICE-4 abgedeckt wird.

### Betroffene IDs

| Kategorie | IDs |
|-----------|-----|
| CAP | — |
| API | — |
| FLOW | — |

### Akzeptanzkriterien

- [ ] Bestehende Notification-Infrastruktur bleibt kompatibel
- [ ] Keine Breaking Changes für Notification-Empfang

### Test Cases

- Keine neuen Test Cases erforderlich

### Definition of Done

- [ ] Bestätigung: Keine Änderungen nötig für SLICE-1

---

---

## [GATE] Parität SLICE-1 grün

**Typ:** Abnahme-Ticket  
**Bedingung:** Issue 1 + 2 abgeschlossen.

### Abnahmekriterien (messbar)

1. [ ] Golden Requests: API-061 (media GET), API-062 (media POST), API-081 (versions), API-080 (publish)
2. [ ] `MODE=compare ALT_BASE_URL=... NEW_BASE_URL=... npm run parity:ci` endet mit Exit 0
3. [ ] FLOW-010, FLOW-011, FLOW-020 abgedeckt (Success + Negative)
4. [ ] `storageUrl`, `publicUrl`, `qrCodeImageUrl` in normalize.json urlSanitizePaths (Query strip)
5. [ ] Arrays `media`, `versions` sortiert (sortRules) vor Vergleich

### Test Notes

- FIXTURE_DPP_ID: Publizierter DPP mit Medien
- Referenz: PARITY_SPEC.md L) SLICE-1 Gate

---

## [GATE][UI][SLICE-1] UI-Parität grün

**Typ:** Abnahme-Sub-Gate

### UI-IDs (SLICE-1)

| UI-ID | Route |
|-------|-------|
| UI-009 (Media-Tab) | /app/dpps/[id] – Media-Bereich |
| UI-010 | /app/dpps/[id]/versions |
| UI-011 | /app/dpps/[id]/versions/[n] |
| UI-026 | /public/dpp/[dppId] |

### Abnahmekriterien

1. [ ] `cd ui-parity && npm run ui:parity` – UI-010, UI-011, UI-026: 0 Diffs
2. [ ] Viewports: Desktop, Tablet, Mobile
3. [ ] Public DPP: Fixture FIXTURE_DPP_ID (publiziert)

**Referenz:** ui-parity/UI_PARITY_SPEC.md

---

## Slice-1 Übersicht

| Service | Issue | Priorität |
|---------|-------|-----------|
| gateway | Routing & Auth für Media/Publish | Hoch |
| dpp-management-service | Media & Publish Implementierung | Hoch |
| user-service | Keine Änderung | N/A |
