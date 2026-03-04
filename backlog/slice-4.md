# SLICE-4: Subscription & Notifications – Backlog Issues

**Parity Spec:** PARITY_SPEC.md | **Ziel:** Subscription, Upgrade, Notifications, Pricing

**UI-Mapping:** [SLICE_UI_MAPPING.md](SLICE_UI_MAPPING.md)

---

## Issue 1: Gateway – SLICE-4 Pricing & Public Endpoints

**Service:** gateway  
**Typ:** Story / Task

### Ziel

Routing für Pricing-, Subscription- und öffentliche Endpoints. Stripe-Webhook und Checkout müssen erreichbar sein; Password Protection für geschützte Bereiche.

### Betroffene IDs

| Kategorie | IDs |
|-----------|-----|
| CAP | CAP-027 (Pricing Public), CAP-028 (Stripe Webhook) |
| API | API-097, API-098, API-099, API-100, API-101 |
| FLOW | FLOW-017 (Abo-Upgrade) |

### Akzeptanzkriterien

- [ ] GET /api/pricing/plans: Öffentlich, keine Auth
- [ ] POST /api/pricing/checkout: Session oder Checkout-Parameter
- [ ] POST /api/pricing/webhooks/stripe: Stripe-Signatur prüfen, an user-service weiterleiten
- [ ] GET /api/subscription/context, POST /api/subscription/assign
- [ ] Fehlerantworten folgen dem Platform-Error-Schema `{ error: string }`

### Test Cases

| ID | Beschreibung | Erwartung |
|----|--------------|-----------|
| TC-G4-1 | GET pricing/plans ohne Auth | 200 |
| TC-G4-2 | POST pricing/checkout mit Session | Weiterleitung zu Stripe |
| TC-G4-3 | POST pricing/webhooks/stripe | Signatur-Validierung, 200 |

### Definition of Done

- [ ] Routing dokumentiert
- [ ] Stripe-Webhook-Signatur geprüft
- [ ] Code-Review abgeschlossen

---

## Issue 2: User-Service – Subscription, Account & Notifications

**Service:** user-service  
**Typ:** Story / Epic

### Ziel

Account, Profil, Onboarding, Subscription-Status, Notifications und Abo-Upgrade implementieren. Alle API-Endpunkte gemäß PARITY_SPEC SLICE-4.

### Betroffene IDs

| Kategorie | IDs |
|-----------|-----|
| CAP | CAP-022 (Subscription), CAP-023 (Notifications), CAP-025 (Account), CAP-026 (Onboarding), CAP-027, CAP-028, CAP-007 (Org-Billing) |
| API | API-014 bis API-021, API-091 bis API-101, **API-168 bis API-180** (Org-Billing: overview, invoices, payment-method, setup-intent, subscription, select-plan-context) |
| FLOW | FLOW-017 (Abo-Upgrade) |
| OBJ | OBJ-018 (Subscription), OBJ-027 bis OBJ-036, **OBJ-041 bis OBJ-045** (Invoice, InvoiceLine, Payment, CreditNote, BillingEventLog) |
| EVT | EVT-015 (checkout.session.completed), EVT-016 (subscription.updated), EVT-017 (subscription.deleted) |

### Akzeptanzkriterien

**Account & Profil (API-014–021):**
- [ ] GET/PUT profile: User-Profil
- [ ] GET/PUT account: Account-Daten
- [ ] POST account/change-password
- [ ] GET account/subscription, POST account/subscription/upgrade
- [ ] GET onboarding/check

**Subscription (API-091–093, 100, 101):**
- [ ] GET subscription/status, usage, trial-status
- [ ] GET subscription/context
- [ ] POST subscription/assign (Super-Admin)

**Notifications (API-094–096):**
- [ ] GET notifications: Liste mit Deep-Links
- [ ] PUT notifications: Bulk als gelesen
- [ ] PUT notifications/[notificationId]: Einzeln als gelesen

**Pricing (API-097–099):**
- [ ] GET pricing/plans: Öffentliche Pläne
- [ ] POST pricing/checkout: Stripe Checkout Session
- [ ] POST pricing/webhooks/stripe: checkout.session.completed, subscription.updated/deleted

**Org-Billing (API-168–180):**
- [ ] GET organization/billing/overview: Kennzahlen, offene Beträge
- [ ] GET organization/billing/invoices, GET invoices/[id], GET invoices/[id]/pdf
- [ ] GET/POST/DELETE organization/billing/payment-method, POST setup-intent (Stripe Elements)
- [ ] GET organization/subscription, POST cancel, GET plans, POST reactivate
- [ ] GET app/select-plan-context

**Side Effects:**
- [ ] EVT-015, EVT-016, EVT-017: Stripe-Webhook-Events verarbeiten

### Test Cases

| ID | Beschreibung | Success | Negative 1 | Negative 2 |
|----|--------------|---------|------------|------------|
| TC-U4-1 | FLOW-017 Abo-Upgrade | Checkout → Stripe → Subscription | Kein Plan → 400 | Stripe-Fehler |
| TC-U4-2 | GET notifications | Liste mit targetRoute, read | Keine Session → 401 | — |
| TC-U4-3 | PUT notifications als gelesen | read=true, readAt gesetzt | Notification nicht gefunden → 404 | — |
| TC-U4-4 | GET subscription/status | status, trialExpiresAt etc. | Keine Org → 400 | — |
| TC-U4-5 | Stripe Webhook checkout.session.completed | Subscription erstellt | Ungültige Signatur → 400 | — |

### Definition of Done

- [ ] Alle API-IDs 014–021, 091–101, **168–180** implementiert
- [ ] OBJ-018, OBJ-027 bis OBJ-036, **OBJ-041 bis OBJ-045** korrekt persistiert
- [ ] EVT-015, EVT-016, EVT-017 verarbeitet
- [ ] Parity-Harness läuft grün für SLICE-4
- [ ] Code-Review abgeschlossen
- [ ] Stripe-Integration getestet (Test-Mode)

---

## Issue 3: DPP-Management-Service – SLICE-4 (keine Änderung)

**Service:** dpp-management-service  
**Typ:** Task

### Ziel

Keine direkten Änderungen. Subscription-Limits (z.B. max_dpp) werden vom user-service/pricing geprüft und an dpp-management weitergegeben; keine neuen APIs.

### Betroffene IDs

| Kategorie | IDs |
|-----------|-----|
| CAP | — |
| API | — |
| FLOW | — |

### Akzeptanzkriterien

- [ ] Bestehende Entitlement-Prüfungen (canPublishDpp etc.) bleiben kompatibel
- [ ] Keine Breaking Changes

### Test Cases

- Keine neuen Test Cases erforderlich

### Definition of Done

- [ ] Bestätigung: Keine Änderungen nötig für SLICE-4

---

---

## [GATE] Parität SLICE-4 grün

**Typ:** Abnahme-Ticket  
**Bedingung:** Issue 1 + 2 abgeschlossen.

### Abnahmekriterien (messbar)

1. [ ] Golden Requests: API-014, API-091, API-094, API-097, API-098, **API-168 (billing/overview), API-169 (invoices), API-176 (subscription)**
2. [ ] `MODE=compare ALT_BASE_URL=... NEW_BASE_URL=... npm run parity:ci` endet mit Exit 0
3. [ ] FLOW-017 (Abo-Upgrade) abgedeckt (Success + Stripe-Fehler-Negative)
4. [ ] Stripe Test-Mode; Webhook-Payloads als Fixtures (EVT-015/016/017)
5. [ ] `notifications[]` sortiert (createdAt DESC), `readAt` in ignorePaths

### Test Notes

- Stripe: test_* Keys; Webhook-Signatur mit Test-Signing-Secret
- Referenz: PARITY_SPEC.md L) SLICE-4 Gate

---

## [GATE][UI][SLICE-4] UI-Parität grün (optional/vorbereitet)

**UI-IDs:** UI-021..UI-025, UI-029, UI-030, UI-031. Details: ui-parity/UI_PARITY_SPEC.md.

---

## Slice-4 Übersicht

| Service | Issue | Priorität |
|---------|-------|-----------|
| gateway | Pricing & Public Endpoints | Hoch |
| user-service | Subscription, Account, Notifications | Hoch |
| dpp-management-service | Keine Änderung | N/A |
