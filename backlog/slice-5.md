# SLICE-5: Super Admin & System – Backlog Issues

**Parity Spec:** PARITY_SPEC.md | **Ziel:** Super Admin, Templates, Pricing-Verwaltung, Feature Registry

**Interne Priorisierung (nur Backlog-Notation):**
- **5a:** API-112, API-116, API-124, API-102 (SA Auth, Orgs, Users, Password Protection)
- **5b:** API-130, API-136, API-142–159, API-115, API-163 (Templates, Feature Registry, Pricing, Dashboard)

**UI-Mapping:** [SLICE_UI_MAPPING.md](SLICE_UI_MAPPING.md)

---

## Issue 1: Gateway – SLICE-5 Super Admin Auth & System Endpoints

**Service:** gateway  
**Typ:** Story / Epic

### Ziel

Super-Admin-Authentifizierung, Password Protection, VAT-Validierung und Polls bereitstellen. Routing für alle Super-Admin- und System-APIs.

### Betroffene IDs

| Kategorie | IDs |
|-----------|-----|
| CAP | CAP-029 (Password Protection), CAP-030 (VAT), CAP-031 (Polls), CAP-032 (Super Admin Auth) |
| API | API-102, API-103, API-104, API-105, API-106, API-112, API-113, API-114, API-160, API-161, API-162 |
| FLOW | — |

### Akzeptanzkriterien

**Super Admin Auth (API-112–114):**
- [ ] POST super-admin/auth/login: Credentials → SuperAdminSession
- [ ] POST super-admin/auth/logout
- [ ] POST super-admin/auth/forgot-password
- [ ] Eigener Auth-Check (nicht NextAuth)

**Password Protection (API-102, 103, 160–162):**
- [ ] GET password/check: Status (aktiv/inaktiv)
- [ ] POST password/verify: Session-Cookie bei erfolgreicher Prüfung
- [ ] GET/PUT super-admin/settings/password-protection
- [ ] GET super-admin/settings/password-protection/status

**VAT & Polls (API-104–106):**
- [ ] POST vat/validate: USt-IdNr. validieren (öffentlich oder Auth)
- [ ] POST polls/submit, GET polls/results

- [ ] Fehlerantworten folgen dem Platform-Error-Schema `{ error: string }`

### Test Cases

| ID | Beschreibung | Erwartung |
|----|--------------|-----------|
| TC-G5-1 | POST super-admin/auth/login | Session bei gültigen Credentials |
| TC-G5-2 | POST super-admin/auth/login falsches Passwort | 401 |
| TC-G5-3 | GET password/check | { enabled: boolean } |
| TC-G5-4 | POST vat/validate | Validierungsergebnis |
| TC-G5-5 | POST polls/submit | Response gespeichert |

### Definition of Done

- [ ] Alle genannten APIs implementiert
- [ ] Super-Admin-Middleware aktiv
- [ ] Code-Review abgeschlossen

---

## Issue 2: User-Service – Super Admin Users & Organizations

**Service:** user-service  
**Typ:** Story / Epic

### Ziel

Super-Admin-Verwaltung von Usern und Organisationen. CRUD, Suspend, Reactivate, Audit-Logs, Subscription-Zuweisung.

### Betroffene IDs

| Kategorie | IDs |
|-----------|-----|
| CAP | CAP-033 (Super Admin Orgs), CAP-034 (Super Admin Users) |
| API | API-116 bis API-123, API-124 bis API-129 |
| FLOW | FLOW-018 (Super Admin Login), FLOW-019 (Template erstellen – SA, in dpp-service) |
| OBJ | OBJ-013 (SuperAdmin), OBJ-014 (SuperAdmin2FA), OBJ-015 (SuperAdminSession), OBJ-016 (AuditLog) |
| EVT | EVT-001 (E-Mail-Verifizierung), EVT-002 (Passwort-Reset), EVT-018 (AuditLog Legacy) |

### Akzeptanzkriterien

**Organizations (API-116–123):**
- [ ] GET/POST organizations: Liste, Erstellen
- [ ] GET/PUT organizations/[id]
- [ ] PUT organizations/[id]/subscription
- [ ] GET organizations/[id]/audit-logs
- [ ] POST/DELETE organizations/[id]/members

**Users (API-124–129):**
- [ ] POST users: Anlegen, optional sendInvitationEmail (EVT-003)
- [ ] PUT users/[id]
- [ ] POST users/[id]/password-reset (EVT-002)
- [ ] POST users/[id]/suspend, reactivate
- [ ] GET users/[id]/audit-logs

**Side Effects:**
- [ ] EVT-001, EVT-002: E-Mails bei User-Aktionen
- [ ] EVT-018: AuditLog (Legacy) bei Super-Admin-Aktionen

### Test Cases

| ID | Beschreibung | Success | Negative 1 | Negative 2 |
|----|--------------|---------|------------|------------|
| TC-U5-1 | FLOW-018 Super Admin Login | Credentials → Session | Falsches Passwort → 401 | 2FA erforderlich |
| TC-U5-2 | POST super-admin/users | User + optional E-Mail | E-Mail bereits vorhanden → 400 | — |
| TC-U5-3 | POST users/[id]/suspend | status=suspended | User nicht gefunden → 404 | — |
| TC-U5-4 | PUT organizations/[id]/subscription | Abo zugewiesen | Org nicht gefunden → 404 | — |

### Definition of Done

- [ ] Alle API-IDs 116–129 implementiert
- [ ] OBJ-013, OBJ-014, OBJ-015, OBJ-016 korrekt genutzt
- [ ] EVT-001, EVT-002, EVT-018 ausgelöst
- [ ] Code-Review abgeschlossen

---

## Issue 3: DPP-Management-Service – Super Admin Templates, DPPs & Feature Registry

**Service:** dpp-management-service  
**Typ:** Story / Epic

### Ziel

Super-Admin-Verwaltung von Templates, DPP-Vorschlägen und Feature Registry. Templates CRUD, neue Versionen, Feature-Sync.

### Betroffene IDs

| Kategorie | IDs |
|-----------|-----|
| CAP | CAP-019, CAP-020, CAP-021 (Templates, Categories, CO2), CAP-035 (SA Templates), CAP-036 (Feature Registry), CAP-039 (SA DPPs) |
| API | API-085 bis API-090 (App), API-130 bis API-141, API-164 |
| FLOW | FLOW-019 (Template erstellen SA) |
| OBJ | OBJ-019 (Feature), OBJ-020 (OrganizationFeature), OBJ-024 (FeatureRegistry), OBJ-025 (BlockType) |
| EVT | — |

### Akzeptanzkriterien

**App Templates/Features (API-085–090):**
- [ ] GET app/templates, app/categories, app/features
- [ ] GET app/capabilities/check
- [ ] GET/POST app/co2/options, app/co2/calculate

**Super Admin Templates (API-130–135):**
- [ ] GET/POST super-admin/templates
- [ ] GET/PUT/DELETE super-admin/templates/[id]
- [ ] POST super-admin/templates/[id]/new-version

**Feature Registry (API-136–141):**
- [ ] GET/POST super-admin/feature-registry
- [ ] GET/PATCH/DELETE super-admin/feature-registry/[id]
- [ ] POST super-admin/features/sync

**DPP Suggestions (API-164):**
- [ ] GET super-admin/dpps/suggestions

### Test Cases

| ID | Beschreibung | Success | Negative 1 | Negative 2 |
|----|--------------|---------|------------|------------|
| TC-D5-1 | FLOW-019 Template erstellen (SA) | Template angelegt | Duplikat category/version → 400 | Validierung fehlgeschlagen → 400 |
| TC-D5-2 | POST templates/[id]/new-version | Neue Version erstellt | Template nicht gefunden → 404 | — |
| TC-D5-3 | POST features/sync | Features synchronisiert | — | — |
| TC-D5-4 | GET dpps/suggestions | Vorschlagsliste | — | — |

### Definition of Done

- [ ] Alle API-IDs 085–090, 130–141, 164 implementiert
- [ ] OBJ-019, OBJ-020, OBJ-024, OBJ-025 korrekt genutzt
- [ ] Code-Review abgeschlossen

---

## Issue 4: User-Service – Super Admin Pricing & Subscriptions

**Service:** user-service  
**Typ:** Story / Epic

### Ziel

Super-Admin-Verwaltung von Pricing Plans, Subscription Models, Entitlements, Trial-Overrides und Subscription-Cleanup.

### Betroffene IDs

| Kategorie | IDs |
|-----------|-----|
| CAP | CAP-037 (Super Admin Pricing), CAP-039 |
| API | API-142 bis API-159, API-165, API-166 |
| FLOW | — |
| OBJ | (Pricing-Objekte in OBJ-027–036) |
| EVT | — |

### Akzeptanzkriterien

**Pricing Plans (API-142–146):**
- [ ] GET/POST super-admin/pricing/plans
- [ ] GET/PUT/DELETE super-admin/pricing/plans/[id]

**Prices & Models (API-147–153):**
- [ ] GET/POST super-admin/pricing/prices
- [ ] GET/POST super-admin/pricing/subscription-models
- [ ] GET/PUT/DELETE super-admin/pricing/subscription-models/[id]

**Entitlements & Trial (API-154–159):**
- [ ] GET/POST super-admin/pricing/entitlements
- [ ] POST/DELETE trial-feature-overrides
- [ ] POST/DELETE trial-entitlement-overrides

**Cleanup (API-165, 166):**
- [ ] GET super-admin/subscriptions/cleanup
- [ ] POST super-admin/subscriptions/cleanup

### Test Cases

| ID | Beschreibung | Erwartung |
|----|--------------|-----------|
| TC-U5-5 | POST pricing/plans | Plan erstellt |
| TC-U5-6 | POST subscription-models | Modell erstellt |
| TC-U5-7 | POST trial-feature-overrides | Override gesetzt |
| TC-U5-8 | POST subscriptions/cleanup | Cleanup ausgeführt |

### Definition of Done

- [ ] Alle API-IDs 142–159, 165, 166 implementiert
- [ ] Code-Review abgeschlossen

---

## Issue 5: Gateway – Super Admin Audit & Dashboard

**Service:** gateway  
**Typ:** Task

### Ziel

Routing für Super-Admin Dashboard und Audit-Logs. KPIs und globale Audit-Logs.

### Betroffene IDs

| Kategorie | IDs |
|-----------|-----|
| CAP | CAP-039 |
| API | API-115, API-163 |
| FLOW | — |

### Akzeptanzkriterien

- [ ] GET super-admin/dashboard/kpis
- [ ] GET super-admin/audit-logs: Globale Audit-Logs
- [ ] Super-Admin-Session erforderlich

### Test Cases

| ID | Beschreibung | Erwartung |
|----|--------------|-----------|
| TC-G5-6 | GET dashboard/kpis ohne SA-Session | 401 |
| TC-G5-7 | GET dashboard/kpis mit SA-Session | 200, KPIs |
| TC-G5-8 | GET super-admin/audit-logs | Gefilterte Logs |

### Definition of Done

- [ ] APIs 115, 163 implementiert
- [ ] Code-Review abgeschlossen

---

---

## [GATE] Parität SLICE-5 grün

**Typ:** Abnahme-Ticket  
**Bedingung:** Alle Issues 1–5 abgeschlossen (oder 5a+5b sequenziell).

### Abnahmekriterien (messbar)

1. [ ] Golden Requests: API-112, API-116, API-124, API-130, API-136, API-102
2. [ ] `MODE=compare ALT_BASE_URL=... NEW_BASE_URL=... npm run parity:ci` endet mit Exit 0
3. [ ] FLOW-018 (SA Login), FLOW-019 (Template erstellen SA) abgedeckt
4. [ ] Super-Admin-Session (separater Auth) für geschützte Endpoints
5. [ ] Optional 5a vor 5b: SA Auth, Orgs, Users zuerst; danach Templates, Feature Registry, Pricing

### Test Notes

- SA-Credentials als Fixture; eigener Auth-Flow (nicht NextAuth)
- Referenz: PARITY_SPEC.md L) SLICE-5 Gate

---

## [GATE][UI][SLICE-5] UI-Parität grün (optional/vorbereitet)

**UI-IDs:** UI-032..UI-040 (SA Login, Dashboard, Orgs, Users, Templates, Pricing, Feature Registry, Settings). Details: ui-parity/UI_PARITY_SPEC.md.

---

## Slice-5 Übersicht

| Service | Issue | Priorität |
|---------|-------|-----------|
| gateway | Super Admin Auth & System Endpoints | Hoch |
| gateway | Super Admin Audit & Dashboard | Mittel |
| user-service | Super Admin Users & Organizations | Hoch |
| user-service | Super Admin Pricing & Subscriptions | Hoch |
| dpp-management-service | Templates, DPPs & Feature Registry | Hoch |
