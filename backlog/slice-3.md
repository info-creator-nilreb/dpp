# SLICE-3: Supplier & Contribute – Backlog Issues

**Parity Spec:** PARITY_SPEC.md | **Ziel:** Lieferanten-Einladungen, Data Requests, Contribute-Flow

**UI-Mapping:** [SLICE_UI_MAPPING.md](SLICE_UI_MAPPING.md)

---

## Issue 1: Gateway – SLICE-3 Routing

**Service:** gateway  
**Typ:** Story / Task

### Ziel

Routing für Supplier- und Contribute-APIs bereitstellen. Supplier-APIs erfordern Auth, Contribute-APIs sind öffentlich (token-basiert).

### Betroffene IDs

| Kategorie | IDs |
|-----------|-----|
| CAP | CAP-014, CAP-015, CAP-016, CAP-017, CAP-018 |
| API | API-067 bis API-076, API-107 bis API-109, API-047 |
| FLOW | FLOW-012, FLOW-013, FLOW-014, FLOW-015 |

### Akzeptanzkriterien

**Supplier (API-067–076):**
- [ ] Pfade unter /api/app/dpp/[dppId]/supplier-*, data-requests* werden weitergeleitet
- [ ] Session erforderlich (401 ohne Auth)

**Contribute (API-107–109):**
- [ ] GET/POST /api/contribute/[token], /api/contribute/supplier/[token] – öffentlich, kein Auth
- [ ] Token-Validierung im Backend

**Import (API-047):**
- [ ] POST /api/app/dpps/import – Session erforderlich

- [ ] Fehlerantworten folgen dem Platform-Error-Schema `{ error: string }`

### Test Cases

| ID | Beschreibung | Erwartung |
|----|--------------|-----------|
| TC-G3-1 | GET /api/app/dpp/{dppId}/supplier-invites ohne Auth | 401 |
| TC-G3-2 | GET /api/contribute/{token} ohne Auth | 200 (öffentlich) |
| TC-G3-3 | POST /api/contribute/{token}/submit ohne Auth | 200/400 (token-basiert) |
| TC-G3-4 | POST /api/app/dpps/import ohne Auth | 401 |

### Definition of Done

- [ ] Routing-Konfiguration dokumentiert
- [ ] Parity-Harness-Golden-Requests hinzugefügt
- [ ] Code-Review abgeschlossen

---

## Issue 2: DPP-Management-Service – Supplier & Contribute

**Service:** dpp-management-service  
**Typ:** Story / Epic

### Ziel

Supplier-Config, Supplier-Invites, Data-Requests (ContributorToken) und Contribute-Flow implementieren. CSV-Import mit Notification.

### Betroffene IDs

| Kategorie | IDs |
|-----------|-----|
| CAP | CAP-014, CAP-015, CAP-016, CAP-017, CAP-018 |
| API | API-067 bis API-076, API-107 bis API-109, API-047 |
| FLOW | FLOW-012, FLOW-013, FLOW-014, FLOW-015 |
| OBJ | OBJ-005 (DppBlockSupplierConfig), OBJ-006 (DppSupplierInvite), OBJ-012 (ContributorToken) |
| EVT | EVT-004 (sendSupplierDataRequestEmail), EVT-006 (import_finished_success), EVT-007 (import_finished_error), EVT-008 (supplier_submitted_data) |

### Akzeptanzkriterien

**Supplier Config (API-067, 068):**
- [ ] GET/PUT supplier-config: DppBlockSupplierConfig pro Block (enabled, mode, allowedRoles)

**Supplier Invites (API-069–072):**
- [ ] GET supplier-invites: Liste DppSupplierInvite
- [ ] POST supplier-invites: Erstellen, optional E-Mail (EVT-004)
- [ ] POST supplier-invites/send-pending: Ausstehende E-Mails senden
- [ ] DELETE supplier-invites/[inviteId]

**Data Requests (API-073–076):**
- [ ] GET data-requests: Liste ContributorToken
- [ ] POST data-requests: Token erstellen, optional E-Mail (EVT-004)
- [ ] DELETE data-requests
- [ ] POST data-requests/send-pending: Ausstehende E-Mails senden

**Contribute (API-107–109):**
- [ ] GET contribute/[token]: Formular für Lieferanten (blockIds, fieldInstances)
- [ ] POST contribute/[token]/submit: Daten speichern, EVT-008 (supplier_submitted_data)
- [ ] GET contribute/supplier/[token]: Supplier-spezifische Ansicht

**Import (API-047):**
- [ ] POST dpps/import: CSV → DPPs, EVT-006/EVT-007

**Side Effects:**
- [ ] EVT-004: sendSupplierDataRequestEmail bei Create/Send-Pending
- [ ] EVT-006/007: Notifications bei Import
- [ ] EVT-008: Notification bei Supplier-Submit

### Test Cases

| ID | Beschreibung | Success | Negative 1 | Negative 2 |
|----|--------------|---------|------------|------------|
| TC-D3-1 | FLOW-012 Supplier Invite erstellen | DppSupplierInvite + E-Mail | DPP nicht gefunden → 404 | E-Mail ungültig → 400 |
| TC-D3-2 | FLOW-013 Data Request senden | ContributorToken + E-Mail | Block-IDs ungültig → 400 | Limit erreicht → 403 |
| TC-D3-3 | FLOW-014 Contribute (Supplier) | Token → Formular → Submit | Token abgelaufen | Token ungültig → 404 |
| TC-D3-4 | FLOW-015 DPP importieren | CSV → DPPs, Notification | CSV ungültig | Limit erreicht |
| TC-D3-5 | POST contribute/submit | Daten gespeichert, Notification | Token expired → 400 | Ungültige Felder → 400 |

### Definition of Done

- [ ] Alle API-IDs 067–076, 107–109, 047 implementiert
- [ ] OBJ-005, OBJ-006, OBJ-012 korrekt persistiert
- [ ] EVT-004, EVT-006, EVT-007, EVT-008 ausgelöst
- [ ] Parity-Harness läuft grün für SLICE-3
- [ ] Code-Review abgeschlossen

---

## Issue 3: User-Service – SLICE-3 (keine Änderung)

**Service:** user-service  
**Typ:** Task

### Ziel

Keine direkten Änderungen. Notifications (EVT-006, 007, 008) werden vom dpp-management-service erstellt und an User gerichtet; der user-service stellt die Notification-Infrastruktur bereit (SLICE-4).

### Betroffene IDs

| Kategorie | IDs |
|-----------|-----|
| CAP | — |
| API | — |
| FLOW | — |

### Akzeptanzkriterien

- [ ] Notification-Empfang kompatibel
- [ ] Keine Breaking Changes

### Test Cases

- Keine neuen Test Cases erforderlich

### Definition of Done

- [ ] Bestätigung: Keine Änderungen nötig für SLICE-3

---

---

## [GATE] Parität SLICE-3 grün

**Typ:** Abnahme-Ticket  
**Bedingung:** Issue 1 + 2 abgeschlossen.

### Abnahmekriterien (messbar)

1. [ ] Golden Requests: API-067, API-070, API-074, API-107, API-108, API-047
2. [ ] `MODE=compare ALT_BASE_URL=... NEW_BASE_URL=... npm run parity:ci` endet mit Exit 0
3. [ ] FLOW-012, FLOW-013, FLOW-014, FLOW-015 abgedeckt (Success + Negative)
4. [ ] ContributorToken `token` in redactPaths (contributorTokens[].token)
5. [ ] Contribute-Endpoints öffentlich (kein Session); token-basierte Validierung

### Test Notes

- FIXTURE_CONTRIBUTOR_TOKEN für FLOW-014 (GET/POST contribute)
- FIXTURE_DPP_ID für supplier-invites, data-requests
- Referenz: PARITY_SPEC.md L) SLICE-3 Gate

---

## [GATE][UI][SLICE-3] UI-Parität grün (optional/vorbereitet)

**UI-IDs:** UI-014 (import), UI-027, UI-028 (contribute). Details: ui-parity/UI_PARITY_SPEC.md.

---

## Slice-3 Übersicht

| Service | Issue | Priorität |
|---------|-------|-----------|
| gateway | Routing für Supplier/Contribute | Hoch |
| dpp-management-service | Supplier & Contribute Implementierung | Hoch |
| user-service | Keine Änderung | N/A |
