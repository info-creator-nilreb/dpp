# UI-Parität – Screen-Inventar

**Ziel:** Look & Feel 1:1 reproduzierbar. Automatisierter visueller Vergleich (Screenshot-Regression).

**Referenz:** PARITY_SPEC.md, Backlogs slice-0..5

---

## UI-IDs (Screens)

| UI-ID | Route | Kurzbeschreibung | CAP-IDs | FLOW-IDs | API-IDs (grob) |
|-------|-------|------------------|---------|----------|-----------------|
| UI-001 | /login | Login-Formular, 2FA-Feld | CAP-001 | FLOW-001 | API-001, API-007, API-012 |
| UI-002 | /signup | Registrierung Phase 1 | CAP-002 | FLOW-002 | API-003 |
| UI-003 | /verify-email | E-Mail-Verifizierung (Token) | CAP-003 | FLOW-003 | API-005, API-006 |
| UI-004 | /forgot-password | Passwort vergessen | CAP-004 | — | API-008 |
| UI-005 | /reset-password | Passwort zurücksetzen (Token) | CAP-004 | — | API-009 |
| UI-006 | /password | Globaler Passwortschutz-Check | CAP-029 | — | API-102, API-103 |
| UI-007 | /app/dashboard | Dashboard Übersicht | CAP-010 | — | API-041, API-091 |
| UI-008 | /app/dpps | DPP-Liste, Filter, Pagination | CAP-010 | — | API-041 |
| UI-009 | /app/dpps/[id] | DPP-Editor (Tabs, Content, Media) | CAP-010, CAP-011, CAP-012 | FLOW-008, FLOW-009 | API-044, API-051, API-061 |
| UI-010 | /app/dpps/[id]/versions | Versionen-Liste | CAP-013 | — | API-081 |
| UI-011 | /app/dpps/[id]/versions/[n] | Einzelversion, QR-Code | CAP-013 | — | API-082, API-083 |
| UI-012 | /app/create | DPP erstellen (Wahl: Neu/Import/AI) | CAP-010 | FLOW-008 | API-041, API-047 |
| UI-013 | /app/create/new | DPP neu (Template-Auswahl) | CAP-010 | FLOW-008 | API-041 |
| UI-014 | /app/create/import | CSV-Import | CAP-018 | FLOW-015 | API-047 |
| UI-015 | /app/audit-logs | Audit-Logs Tabelle, Filter | CAP-024 | — | API-110 |
| UI-016 | /app/organization | Org-Übersicht | CAP-007 | — | API-022–024 |
| UI-017 | /app/organization/users | Benutzerliste, Rollen | CAP-007 | FLOW-007 | API-025, API-027 |
| UI-018 | /app/organization/general | Org-Einstellungen allgemein | CAP-007 | — | API-022 |
| UI-019 | /app/organization/billing | Billing: Übersicht, Rechnungen, Rechnungsdaten, Zahlungsarten (4 Tabs) | CAP-007 | — | API-030, API-031, API-168–175 |
| UI-020 | /app/organization/company-details | Firmenstammdaten | CAP-007 | — | API-022 |
| UI-021 | /app/account | Account-Übersicht | CAP-025 | — | API-016, API-019 |
| UI-022 | /app/account/subscription | Subscription, Upgrade | CAP-022 | FLOW-017 | API-091, API-098 |
| UI-023 | /app/account/personal | Persönliche Daten | CAP-025 | — | API-016 |
| UI-024 | /app/account/security | Passwort ändern | CAP-025 | — | API-018 |
| UI-025 | /app/notifications | Benachrichtigungsliste | CAP-023 | — | API-094 |
| UI-026 | /public/dpp/[dppId] | Öffentliche DPP-Ansicht (Editorial) | CAP-013 | FLOW-020 | API-077, API-080 |
| UI-027 | /contribute/[token] | Lieferanten-Beitrag (öffentlich) | CAP-017 | FLOW-014 | API-107, API-108 |
| UI-028 | /contribute/supplier/[token] | Lieferanten-Beitrag (Supplier) | CAP-017 | FLOW-014 | API-109 |
| UI-029 | /pricing | Pricing-Pläne (öffentlich) | CAP-027 | — | API-097 |
| UI-030 | /onboarding | Onboarding-Check | CAP-026 | — | API-021 |
| UI-031 | /app/select-plan | Plan-Auswahl nach Registrierung | CAP-027 | FLOW-017 | API-097, API-098 |
| UI-032 | /super-admin/login | Super-Admin Login | CAP-032 | FLOW-018 | API-112 |
| UI-033 | /super-admin/dashboard | SA Dashboard, KPIs | CAP-039 | — | API-115 |
| UI-034 | /super-admin/organizations | SA Organisationen | CAP-033 | — | API-116–123 |
| UI-035 | /super-admin/users | SA Benutzer | CAP-034 | — | API-124–129 |
| UI-036 | /super-admin/templates | SA Templates | CAP-035 | FLOW-019 | API-130–135 |
| UI-037 | /super-admin/pricing | SA Pricing-Verwaltung | CAP-037 | — | API-142–159 |
| UI-038 | /super-admin/feature-registry | SA Feature Registry | CAP-036 | — | API-136–141 |
| UI-039 | /super-admin/audit-logs | SA Audit-Logs | CAP-039 | — | API-163 |
| UI-040 | /super-admin/settings | SA Einstellungen (Password Protection) | CAP-038 | — | API-102, API-160–162 |

---

## Zustände pro UI (Standard-Set)

| Zustand | Beschreibung | Test-Strategie |
|---------|--------------|----------------|
| loading | Skeleton/Spinner sichtbar | Route interception → delayed response |
| empty | Keine Daten (leere Liste/Tabelle) | Mock: leeres Array |
| error | Fehlermeldung angezeigt | Mock: 400/401/404/500 |
| success | Normale Daten geladen | Mock: Fixture-JSON |
| disabled | Buttons/Inputs disabled | Zustand durch Fixture-Setup |
| validation-error | Formular-Validierung sichtbar | Submit mit ungültigen Werten |

---

## Slice-Zuordnung (UI-Parität)

| Slice | UI-IDs |
|-------|--------|
| SLICE-0 | UI-001, UI-002, UI-003, UI-004, UI-005, UI-006, UI-007, UI-008, UI-009, UI-012, UI-013, UI-015 |
| SLICE-1 | UI-009 (Media-Tab), UI-010, UI-011, UI-026 |
| SLICE-2 | UI-016, UI-017, UI-018, UI-019, UI-020 |
| SLICE-3 | UI-014, UI-027, UI-028 |
| SLICE-4 | UI-021, UI-022, UI-023, UI-024, UI-025, UI-029, UI-030, UI-031 |
| SLICE-5 | UI-032, UI-033, UI-034, UI-035, UI-036, UI-037, UI-038, UI-039, UI-040, UI-041 |

---

## Viewports (fest)

| Name | Breite × Höhe |
|------|---------------|
| Desktop | 1440 × 900 |
| Tablet | 768 × 1024 |
| Mobile | 390 × 844 |

### Viewport-Matrix (Breakpoints)

Zentrale Definition: **`src/lib/breakpoints.ts`**. Diese Viewports sind für Playwright; die App nutzt folgende Grenzen:

| Bereich | Editorial (DPP-Seite) | App / Super-Admin |
|--------|------------------------|-------------------|
| Mobile | ≤639px (Slider), 640–1023px (Tablet 2-Spalten) | ≤767px |
| Tablet | 640–1023px | – (ab 768px = Desktop) |
| Desktop | ≥1024px | ≥768px |
| Sticky-Nav | – | ≥1200px |

- **Editorial:** `EDITORIAL_SLIDER_MAX` 639, `EDITORIAL_TABLET_MIN` 640, `EDITORIAL_DESKTOP_MIN` 1024.
- **App/SA:** `APP_MOBILE_MAX` 767, `APP_DESKTOP_MIN` 768, `DESKTOP_NAV_MIN` 1200.

---

## Datenabhängigkeiten & Mock-Strategie

| UI-ID | Kritische Daten | Fixture-Datei |
|-------|-----------------|---------------|
| UI-001 | Session, 2FA-Status | auth-login.json |
| UI-008 | dpps[], Pagination | app-dpps.json |
| UI-009 | dpp, content, media | app-dpp-[id].json |
| UI-026 | dppVersion, publicUrl | public-dpp.json |
| UI-017 | users[], invitations[] | org-users.json |
| UI-027/028 | contribute form, blockIds | contribute-[token].json |

**Regel:** Alle visuellen Tests nutzen Route Interception (Playwright `page.route`) mit JSON-Fixtures. Keine Live-DB.
