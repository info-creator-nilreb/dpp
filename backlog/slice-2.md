# SLICE-2: Organisation & Collaboration – Backlog Issues

**Parity Spec:** PARITY_SPEC.md | **Ziel:** Org-Management, Einladungen, Join Requests

---

## Issue 1: Gateway – SLICE-2 Routing & Auth

**Service:** gateway  
**Typ:** Story / Task

### Ziel

Routing und Authentifizierung für alle Organisation- und Invitation-APIs bereitstellen. Anfragen an `/api/app/organization/*` und `/api/app/invitations/*` werden authentifiziert und an den user-service weitergeleitet.

### Betroffene IDs

| Kategorie | IDs |
|-----------|-----|
| CAP | CAP-006 (Invitation Accept), CAP-007 (Organisation), CAP-008 (Invitations), CAP-009 (Join Requests) |
| API | API-022, API-023, API-024, API-025, API-026, API-027, API-028, API-029, API-030, API-031, API-032, API-033, API-034, API-035, API-036, API-037, API-038, API-039, API-040 |
| FLOW | FLOW-006 (Einladung annehmen), FLOW-007 (User einladen), FLOW-016 (Join Request stellen) |

### Akzeptanzkriterien

- [ ] Alle Pfade `/api/app/organization/*` und `/api/app/invitations/accept` werden korrekt weitergeleitet
- [ ] Session-basierte Authentifizierung wird geprüft (401 bei fehlender Session)
- [ ] POST /api/app/invitations/accept erfordert gültige Session
- [ ] Fehlerantworten folgen dem Platform-Error-Schema `{ error: string }`

### Test Cases

| ID | Beschreibung | Erwartung |
|----|--------------|-----------|
| TC-G2-1 | GET /api/app/organization/users ohne Auth | 401 |
| TC-G2-2 | GET /api/app/organization/invitations mit gültiger Session | Weiterleitung, 200 |
| TC-G2-3 | POST /api/app/invitations/accept ohne Auth | 401 |
| TC-G2-4 | POST /api/app/organization/join-requests mit gültiger Session | Weiterleitung |

### Definition of Done

- [ ] Routing-Konfiguration dokumentiert
- [ ] Parity-Harness-Golden-Requests für betroffene APIs hinzugefügt
- [ ] Code-Review abgeschlossen

---

## Issue 2: User-Service – Organisation & Collaboration

**Service:** user-service  
**Typ:** Story / Epic

### Ziel

Implementierung von Organisationsverwaltung, Einladungen und Join Requests. Alle API-Endpunkte gemäß PARITY_SPEC SLICE-2 bereitstellen.

### Betroffene IDs

| Kategorie | IDs |
|-----------|-----|
| CAP | CAP-006, CAP-007, CAP-008, CAP-009 |
| API | API-022 bis API-040 |
| FLOW | FLOW-006, FLOW-007, FLOW-016 |
| OBJ | OBJ-037 (Invitation), OBJ-038 (JoinRequest), OBJ-039 (Notification) |
| EVT | EVT-003 (sendInvitationEmail), EVT-009 (join_request), EVT-010 (invitation_accepted), EVT-011 (user_removed) |

### Akzeptanzkriterien

**Organisation (API-022–036):**
- [ ] GET/PUT organizations: Organisationen des Users abrufen/aktualisieren
- [ ] GET access: Zugriffsrechte
- [ ] GET users: Benutzer der Organisation mit Rollen (über Membership)
- [ ] DELETE users/[userId]: User aus Organisation entfernen (Soft-Remove)
- [ ] GET/POST/DELETE invitations: Einladungen auflisten, erstellen, löschen
- [ ] GET/PUT billing, company-details, general: Org-Einstellungen
- [ ] POST update-name: Organisationsname aktualisieren

**Join Requests (API-037–039):**
- [ ] GET join-requests: Liste (nur ORG_ADMIN)
- [ ] POST join-requests: Beitrittsanfrage erstellen
- [ ] PUT join-requests/[requestId]: Genehmigen oder Ablehnen (action: approve | reject)

**Invitation Accept (API-040):**
- [ ] POST invitations/accept: Token validieren, Membership erstellen, Invitation auf accepted setzen

**Side Effects:**
- [ ] EVT-003: sendInvitationEmail bei neuer Einladung
- [ ] EVT-009: notifyOrgAdmins (join_request) bei neuem Join Request
- [ ] EVT-010: createNotification (invitation_accepted) bei Genehmigung
- [ ] EVT-011: createNotification (user_removed) bei User-Entfernung

### Test Cases

| ID | Beschreibung | Success | Negative 1 | Negative 2 |
|----|--------------|---------|------------|------------|
| TC-U2-1 | FLOW-006 Einladung annehmen | Token gültig → Membership | Token abgelaufen → Fehlerseite | Bereits akzeptiert → Hinweis |
| TC-U2-2 | FLOW-007 User einladen | Einladung + E-Mail | Bereits Mitglied → Fehler | Limit erreicht → Fehler |
| TC-U2-3 | FLOW-016 Join Request stellen | Anfrage, Admins benachrichtigt | Bereits Mitglied → Fehler | Org nicht gefunden → 404 |
| TC-U2-4 | PUT join-requests approve | Membership erstellt, Notification | Join Request nicht pending → 400 | Keine Berechtigung → 403 |
| TC-U2-5 | DELETE users/[userId] | User entfernt, Notification | User gehört nicht zu Org → 400 | Sich selbst entfernen → 400 |
| TC-U2-6 | POST invitations (bereits Mitglied) | 400 | — | — |
| TC-U2-7 | POST join-requests (bereits Mitglied) | 400 | — | — |

### Definition of Done

- [ ] Alle API-IDs 022–040 implementiert
- [ ] OpenAPI-Spec (contracts/openapi-slice2.yaml) erfüllt
- [ ] OBJ-037, OBJ-038, OBJ-039 korrekt persistiert
- [ ] EVT-003, EVT-009, EVT-010, EVT-011 ausgelöst
- [ ] Parity-Harness läuft grün für SLICE-2
- [ ] UI (UI-016..020): design-tokens (Regel 11), [GATE][UI][SLICE-2]
- [ ] Code-Review abgeschlossen
- [ ] Rollenprüfung (ORG_ADMIN für Einladen, Join-Request-Management) implementiert

---

## Issue 3: DPP-Management-Service – SLICE-2 (keine Änderung)

**Service:** dpp-management-service  
**Typ:** Task

### Ziel

Keine direkten Änderungen im dpp-management-service für SLICE-2. Organisation und Collaboration werden vollständig vom user-service abgedeckt.

### Betroffene IDs

| Kategorie | IDs |
|-----------|-----|
| CAP | — |
| API | — |
| FLOW | — |

### Akzeptanzkriterien

- [ ] Keine Änderungen an DPP-spezifischen APIs
- [ ] Bestehende DPP-Permissions (organisationId) bleiben kompatibel

### Test Cases

- Keine neuen Test Cases erforderlich

### Definition of Done

- [ ] Bestätigung: Keine Änderungen nötig für SLICE-2

---

## [GATE] Parität SLICE-2 grün

**Typ:** Abnahme-Ticket  
**Bedingung:** Issue 1 + 2 abgeschlossen.

### Abnahmekriterien (messbar)

1. [ ] Golden Requests: API-025, API-027, API-028, API-037, API-040
2. [ ] `MODE=compare ALT_BASE_URL=... NEW_BASE_URL=... npm run parity:ci` endet mit Exit 0
3. [ ] FLOW-006, FLOW-007, FLOW-016 abgedeckt (Success + Negative)
4. [ ] `invitations[].token`, `invitations[].expiresAt` in ignorePaths/redactPaths
5. [ ] contracts/openapi-slice2.yaml erfüllt, Error-Schema referenziert

### Test Notes

- FIXTURE_INVITATION_TOKEN für FLOW-006 (Accept)
- FIXTURE_ORG_ID für join-requests, invitations
- Referenz: PARITY_SPEC.md L) SLICE-2 Gate

---

## [GATE][UI][SLICE-2] UI-Parität grün

**Typ:** Abnahme-Sub-Gate

### UI-IDs (SLICE-2)

| UI-ID | Route |
|-------|-------|
| UI-016 | /app/organization |
| UI-017 | /app/organization/users |
| UI-018 | /app/organization/general |
| UI-019 | /app/organization/billing |
| UI-020 | /app/organization/company-details |

### Abnahmekriterien

1. [ ] `cd ui-parity && npm run ui:parity` – UI-016 bis UI-020: 0 Diffs
2. [ ] Auth + FIXTURE_ORG_ID für stabile Darstellung

**Referenz:** ui-parity/UI_PARITY_SPEC.md

---

## Slice-2 Übersicht

| Service | Issue | Priorität |
|---------|-------|-----------|
| gateway | Routing & Auth für Organization/Invitations | Hoch |
| user-service | Organisation & Collaboration Implementierung | Hoch |
| dpp-management-service | Keine Änderung | N/A |
