# Parity Spec – DPP SaaS (Easy Pass)

Dokumentation für Parity-Tests, Golden Master und Slicing. Stand: Februar 2025.

---

## A) Scope & Definition of Done

### Scope

**In Scope:**
- App-Bereich: `/app/*` (DPPs, Organisation, Account, Benachrichtigungen)
- Auth-Flows: Login, Signup, E-Mail-Verifizierung, Passwort-Reset, 2FA
- Contribute-Flow: `/contribute/[token]` (öffentlich, token-basiert)
- Super-Admin: Templates, Pricing, Nutzer, Organisationen, Feature-Registry
- Öffentliche DPP-Ansicht: `/public/dpp/[dppId]`, `/public/dpp/[dppId]/v/[versionNumber]`
- API-Routen unter `src/app/api/**`
- Datenmodell aus `prisma/schema.prisma`

**Out of Scope:**
- Neue Features
- Externe OAuth-Provider (falls nicht implementiert)
- Performance-Benchmarks
- E2E-Tests für Drittanbieter-Integrationen (Stripe-Live)

### Definition of Done

- [ ] Alle CAP-IDs in der Capability Matrix sind abgedeckt
- [ ] Alle API-IDs reagieren konsistent (Status, Payload, Fehler)
- [ ] Alle FLOW-IDs haben Success- und Negative-Testfälle
- [ ] Side Effects (EVT) sind katalogisiert und testbar
- [ ] Slice Plan SLICE-0 bis SLICE-5 abgeschlossen
- [ ] Golden Master Snapshots sind stabil und reproduzierbar

---

## B) Systemkontext

### High-Level

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           DPP SaaS (Easy Pass)                          │
├─────────────────────────────────────────────────────────────────────────┤
│  Öffentlich         │  App (Tenant)           │  Super Admin            │
│  - Landing          │  - DPP Editor           │  - Templates            │
│  - Login/Signup     │  - Organisation         │  - Pricing/Plans        │
│  - Contribute       │  - Account/Subscription │  - Users/Orgs           │
│  - Public DPP       │  - Notifications        │  - Feature Registry     │
│  - Polls            │  - Audit Logs           │  - Audit Logs           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  PostgreSQL (Prisma)  │  Storage (Vercel Blob / Local FS)  │  SMTP      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Technologie-Stack

- **Frontend:** Next.js App Router, React
- **Auth:** NextAuth.js v5 (Auth.js), Credentials, 2FA (TOTP)
- **DB:** PostgreSQL (Supabase), Prisma ORM
- **Storage:** Vercel Blob (Prod), lokales FS (Dev)
- **E-Mail:** Nodemailer (SMTP)
- **Pricing:** Stripe (Checkout, Webhooks)

---

## C) Capability Matrix (CAP-IDs)

| ID | Capability | Beschreibung | Haupt-APIs |
|----|------------|--------------|------------|
| CAP-001 | Auth Login | Credentials-Login | auth/[...nextauth] |
| CAP-002 | Auth Signup | Registrierung Phase 1 | auth/signup-phase1 |
| CAP-003 | E-Mail-Verifizierung | Verify, Resend | auth/verify-email, auth/resend-verification |
| CAP-004 | Passwort vergessen/reset | Forgot, Reset | auth/forgot-password, auth/reset-password |
| CAP-005 | 2FA | TOTP Setup, Check | auth/setup-2fa, auth/check-2fa |
| CAP-006 | Invitation Accept | Einladung annehmen | app/invitations/accept |
| CAP-007 | Organisation | Org CRUD, Users, Billing (Overview, Rechnungen, Zahlungsarten) | app/organization/* |
| CAP-008 | Invitations | Einladungen erstellen/löschen | app/organization/invitations/* |
| CAP-009 | Join Requests | Beitrittsanfragen | app/organization/join-requests/* |
| CAP-010 | DPP CRUD | DPP erstellen, lesen, aktualisieren | app/dpp/*, app/dpps/* |
| CAP-011 | DPP Content | Blöcke, Styling, Unified Blocks | app/dpp/[dppId]/content/* |
| CAP-012 | DPP Media | Medien hochladen, löschen | app/dpp/[dppId]/media/* |
| CAP-013 | DPP Publish | Veröffentlichen, Versionen, QR-Code | app/dpp/[dppId]/publish, versions/* |
| CAP-014 | Supplier Config | Block-Lieferanten-Konfiguration | app/dpp/[dppId]/supplier-config |
| CAP-015 | Supplier Invites | DPPSupplierInvite erstellen/senden | app/dpp/[dppId]/supplier-invites/* |
| CAP-016 | Data Requests | ContributorToken erstellen/senden | app/dpp/[dppId]/data-requests/* |
| CAP-017 | Contribute | Token-basierter Lieferanten-Beitrag | contribute/[token]/* |
| CAP-018 | DPP Import | CSV-Import | app/dpps/import |
| CAP-019 | Templates/Categories | Templates, Kategorien | app/templates, app/categories, app/dpp/template-by-category |
| CAP-020 | Capabilities/Features | Capability-Check, Org-Features | app/capabilities/check, app/features |
| CAP-021 | CO2 | CO2-Optionen und Berechnung | app/co2/* |
| CAP-022 | Subscription | Status, Usage, Trial, Upgrade | app/subscription/*, app/account/subscription/* |
| CAP-023 | Notifications | Liste, Update, Mark read | app/notifications/* |
| CAP-024 | Audit Logs | Platform Audit Logs | audit-logs/* |
| CAP-025 | Account/Profile | Profil, Passwort ändern | app/account/*, app/profile |
| CAP-026 | Onboarding | Onboarding-Check | app/onboarding/check |
| CAP-027 | Pricing Public | Pläne, Checkout | pricing/plans, pricing/checkout |
| CAP-028 | Stripe Webhook | Stripe-Events | pricing/webhooks/stripe |
| CAP-029 | Password Protection | Globaler Passwortschutz | password/check, password/verify |
| CAP-030 | VAT Validation | USt-IdNr. prüfen | vat/validate |
| CAP-031 | Polls | Umfragen submit/results | polls/submit, polls/results |
| CAP-032 | Super Admin Auth | Login, Logout, Forgot | super-admin/auth/* |
| CAP-033 | Super Admin Organizations | Org CRUD, Members, Subscription | super-admin/organizations/* |
| CAP-034 | Super Admin Users | User CRUD, Suspend, Reactivate, Audit | super-admin/users/* |
| CAP-035 | Super Admin Templates | Template CRUD, New Version | super-admin/templates/* |
| CAP-036 | Super Admin Feature Registry | Feature Registry CRUD, Sync | super-admin/feature-registry/*, features/sync |
| CAP-037 | Super Admin Pricing | Plans, Prices, Models, Entitlements | super-admin/pricing/* |
| CAP-038 | Super Admin Settings | Password Protection | super-admin/settings/password-protection/* |
| CAP-039 | Super Admin Audit/Dashboard/Billing | Audit Logs, KPIs, Billing (Revenue, Invoices, Events), Suggestions, Cleanup | super-admin/audit-logs, dashboard, billing/*, dpps/suggestions, subscriptions/cleanup |

---

## D) API Inventory (API-IDs)

Alle Routen unter `src/app/api/**`. Format: `API-XXX | Methode | Pfad`

### Auth
| ID | Methode | Pfad |
|----|---------|------|
| API-001 | GET/POST | /api/auth/[...nextauth] |
| API-002 | POST | /api/auth/signup |
| API-003 | POST | /api/auth/signup-phase1 |
| API-004 | GET | /api/auth/invitation |
| API-005 | POST | /api/auth/verify-email |
| API-006 | GET | /api/auth/check-verification |
| API-007 | POST | /api/auth/verify-password |
| API-008 | POST | /api/auth/forgot-password |
| API-009 | POST | /api/auth/reset-password |
| API-010 | POST | /api/auth/resend-verification |
| API-011 | POST | /api/auth/logout |
| API-012 | GET | /api/auth/check-2fa |
| API-013 | GET/POST | /api/auth/setup-2fa |

### App – Account, Profil, Onboarding
| ID | Methode | Pfad |
|----|---------|------|
| API-014 | GET | /api/app/profile |
| API-015 | PUT | /api/app/profile |
| API-016 | GET | /api/app/account |
| API-017 | PUT | /api/app/account |
| API-018 | POST | /api/app/account/change-password |
| API-019 | GET | /api/app/account/subscription |
| API-020 | POST | /api/app/account/subscription/upgrade |
| API-021 | GET | /api/app/onboarding/check |

### App – Organisation
| ID | Methode | Pfad |
|----|---------|------|
| API-022 | GET | /api/app/organizations |
| API-023 | PUT | /api/app/organizations |
| API-024 | GET | /api/app/organization/access |
| API-025 | GET | /api/app/organization/users |
| API-026 | DELETE | /api/app/organization/users/[userId] |
| API-027 | GET | /api/app/organization/invitations |
| API-028 | POST | /api/app/organization/invitations |
| API-029 | DELETE | /api/app/organization/invitations/[invitationId] |
| API-030 | GET | /api/app/organization/billing |
| API-031 | PUT | /api/app/organization/billing |
| API-032 | GET | /api/app/organization/company-details |
| API-033 | PUT | /api/app/organization/company-details |
| API-034 | GET | /api/app/organization/general |
| API-035 | PUT | /api/app/organization/general |
| API-036 | POST | /api/app/organization/update-name |
| API-037 | GET | /api/app/organization/join-requests |
| API-038 | POST | /api/app/organization/join-requests |
| API-039 | PUT | /api/app/organization/join-requests/[requestId] |
| API-040 | POST | /api/app/invitations/accept |
| API-168 | GET | /api/app/organization/billing/overview |
| API-169 | GET | /api/app/organization/billing/invoices |
| API-170 | GET | /api/app/organization/billing/invoices/[id] |
| API-171 | GET | /api/app/organization/billing/invoices/[id]/pdf |
| API-172 | GET | /api/app/organization/billing/payment-method |
| API-173 | POST | /api/app/organization/billing/payment-method |
| API-174 | DELETE | /api/app/organization/billing/payment-method |
| API-175 | POST | /api/app/organization/billing/setup-intent |
| API-176 | GET | /api/app/organization/subscription |
| API-177 | POST | /api/app/organization/subscription/cancel |
| API-178 | GET | /api/app/organization/subscription/plans |
| API-179 | POST | /api/app/organization/subscription/reactivate |
| API-180 | GET | /api/app/select-plan-context |

### App – DPPs
| ID | Methode | Pfad |
|----|---------|------|
| API-041 | GET | /api/app/dpps |
| API-042 | POST | /api/app/dpp |
| API-043 | GET | /api/app/dpp |
| API-044 | GET | /api/app/dpp/[dppId] |
| API-045 | PUT | /api/app/dpp/[dppId] |
| API-046 | GET | /api/app/dpp/template-by-category |
| API-047 | POST | /api/app/dpps/import |
| API-048 | GET | /api/app/dpps/csv-template |
| API-049 | POST | /api/app/dpps/preflight/url |
| API-050 | POST | /api/app/dpps/preflight/pdf |

### App – DPP Content & Blöcke
| ID | Methode | Pfad |
|----|---------|------|
| API-051 | GET | /api/app/dpp/[dppId]/content |
| API-052 | POST | /api/app/dpp/[dppId]/content |
| API-053 | PUT | /api/app/dpp/[dppId]/content |
| API-054 | GET | /api/app/dpp/[dppId]/content/styling |
| API-055 | PUT | /api/app/dpp/[dppId]/content/styling |
| API-056 | GET | /api/app/dpp/[dppId]/unified-blocks |
| API-057 | POST | /api/app/dpp/[dppId]/content/blocks |
| API-058 | PUT | /api/app/dpp/[dppId]/content/blocks/[blockId] |
| API-059 | DELETE | /api/app/dpp/[dppId]/content/blocks/[blockId] |
| API-060 | POST | /api/app/dpp/[dppId]/content/blocks/reorder |

### App – DPP Media, Supplier, Publish
| ID | Methode | Pfad |
|----|---------|------|
| API-061 | GET | /api/app/dpp/[dppId]/media |
| API-062 | POST | /api/app/dpp/[dppId]/media |
| API-063 | PATCH | /api/app/dpp/[dppId]/media |
| API-064 | DELETE | /api/app/dpp/[dppId]/media |
| API-065 | PATCH | /api/app/dpp/[dppId]/media/[mediaId] |
| API-066 | DELETE | /api/app/dpp/[dppId]/media/[mediaId] |
| API-067 | GET | /api/app/dpp/[dppId]/supplier-config |
| API-068 | PUT | /api/app/dpp/[dppId]/supplier-config |
| API-069 | GET | /api/app/dpp/[dppId]/supplier-invites |
| API-070 | POST | /api/app/dpp/[dppId]/supplier-invites |
| API-071 | POST | /api/app/dpp/[dppId]/supplier-invites/send-pending |
| API-072 | DELETE | /api/app/dpp/[dppId]/supplier-invites/[inviteId] |
| API-073 | GET | /api/app/dpp/[dppId]/data-requests |
| API-074 | POST | /api/app/dpp/[dppId]/data-requests |
| API-075 | DELETE | /api/app/dpp/[dppId]/data-requests |
| API-076 | POST | /api/app/dpp/[dppId]/data-requests/send-pending |
| API-077 | GET | /api/app/dpp/[dppId]/template |
| API-078 | GET | /api/app/dpp/[dppId]/capabilities |
| API-079 | GET | /api/app/dpp/[dppId]/access |
| API-080 | POST | /api/app/dpp/[dppId]/publish |
| API-081 | GET | /api/app/dpp/[dppId]/versions |
| API-082 | GET | /api/app/dpp/[dppId]/versions/[versionNumber] |
| API-083 | GET | /api/app/dpp/[dppId]/versions/[versionNumber]/qr-code |
| API-084 | GET | /api/app/dpp/[dppId]/versions/[versionNumber]/qr-code-preview |

### App – Templates, Kategorien, Features, CO2
| ID | Methode | Pfad |
|----|---------|------|
| API-085 | GET | /api/app/templates |
| API-086 | GET | /api/app/categories |
| API-087 | GET | /api/app/features |
| API-088 | GET | /api/app/capabilities/check |
| API-089 | GET | /api/app/co2/options |
| API-090 | POST | /api/app/co2/calculate |

### App – Subscription, Notifications
| ID | Methode | Pfad |
|----|---------|------|
| API-091 | GET | /api/app/subscription/status |
| API-092 | GET | /api/app/subscription/usage |
| API-093 | GET | /api/app/subscription/trial-status |
| API-094 | GET | /api/app/notifications |
| API-095 | PUT | /api/app/notifications |
| API-096 | PUT | /api/app/notifications/[notificationId] |

### Pricing, Subscription Context, Password, VAT, Polls
| ID | Methode | Pfad |
|----|---------|------|
| API-097 | GET | /api/pricing/plans |
| API-098 | POST | /api/pricing/checkout |
| API-099 | POST | /api/pricing/webhooks/stripe |
| API-100 | GET | /api/subscription/context |
| API-101 | POST | /api/subscription/assign |
| API-102 | GET | /api/password/check |
| API-103 | POST | /api/password/verify |
| API-104 | POST | /api/vat/validate |
| API-105 | POST | /api/polls/submit |
| API-106 | GET | /api/polls/results |

### Contribute (öffentlich)
| ID | Methode | Pfad |
|----|---------|------|
| API-107 | GET | /api/contribute/[token] |
| API-108 | POST | /api/contribute/[token]/submit |
| API-109 | GET | /api/contribute/supplier/[token] |

### Audit Logs
| ID | Methode | Pfad |
|----|---------|------|
| API-110 | GET | /api/audit-logs |
| API-111 | GET | /api/audit-logs/[logId] |

### Super Admin
| ID | Methode | Pfad |
|----|---------|------|
| API-112 | POST | /api/super-admin/auth/login |
| API-113 | POST | /api/super-admin/auth/logout |
| API-114 | POST | /api/super-admin/auth/forgot-password |
| API-115 | GET | /api/super-admin/dashboard/kpis |
| API-116 | GET | /api/super-admin/organizations |
| API-117 | POST | /api/super-admin/organizations |
| API-118 | GET | /api/super-admin/organizations/[id] |
| API-119 | PUT | /api/super-admin/organizations/[id] |
| API-120 | PUT | /api/super-admin/organizations/[id]/subscription |
| API-121 | GET | /api/super-admin/organizations/[id]/audit-logs |
| API-122 | POST | /api/super-admin/organizations/[id]/members |
| API-123 | DELETE | /api/super-admin/organizations/[id]/members |
| API-124 | POST | /api/super-admin/users |
| API-125 | PUT | /api/super-admin/users/[id] |
| API-126 | POST | /api/super-admin/users/[id]/password-reset |
| API-127 | POST | /api/super-admin/users/[id]/suspend |
| API-128 | POST | /api/super-admin/users/[id]/reactivate |
| API-129 | GET | /api/super-admin/users/[id]/audit-logs |
| API-130 | GET | /api/super-admin/templates |
| API-131 | POST | /api/super-admin/templates |
| API-132 | GET | /api/super-admin/templates/[id] |
| API-133 | PUT | /api/super-admin/templates/[id] |
| API-134 | DELETE | /api/super-admin/templates/[id] |
| API-135 | POST | /api/super-admin/templates/[id]/new-version |
| API-136 | GET | /api/super-admin/feature-registry |
| API-137 | POST | /api/super-admin/feature-registry |
| API-138 | GET | /api/super-admin/feature-registry/[id] |
| API-139 | PATCH | /api/super-admin/feature-registry/[id] |
| API-140 | DELETE | /api/super-admin/feature-registry/[id] |
| API-141 | POST | /api/super-admin/features/sync |
| API-142 | GET | /api/super-admin/pricing/plans |
| API-143 | POST | /api/super-admin/pricing/plans |
| API-144 | GET | /api/super-admin/pricing/plans/[id] |
| API-145 | PUT | /api/super-admin/pricing/plans/[id] |
| API-146 | DELETE | /api/super-admin/pricing/plans/[id] |
| API-147 | GET | /api/super-admin/pricing/prices |
| API-148 | POST | /api/super-admin/pricing/prices |
| API-149 | GET | /api/super-admin/pricing/subscription-models |
| API-150 | POST | /api/super-admin/pricing/subscription-models |
| API-151 | GET | /api/super-admin/pricing/subscription-models/[id] |
| API-152 | PUT | /api/super-admin/pricing/subscription-models/[id] |
| API-153 | DELETE | /api/super-admin/pricing/subscription-models/[id] |
| API-154 | GET | /api/super-admin/pricing/entitlements |
| API-155 | POST | /api/super-admin/pricing/entitlements |
| API-156 | POST | /api/super-admin/pricing/trial-feature-overrides |
| API-157 | DELETE | /api/super-admin/pricing/trial-feature-overrides |
| API-158 | POST | /api/super-admin/pricing/trial-entitlement-overrides |
| API-159 | DELETE | /api/super-admin/pricing/trial-entitlement-overrides |
| API-160 | GET | /api/super-admin/settings/password-protection |
| API-161 | PUT | /api/super-admin/settings/password-protection |
| API-162 | GET | /api/super-admin/settings/password-protection/status |
| API-163 | GET | /api/super-admin/audit-logs |
| API-164 | GET | /api/super-admin/dpps/suggestions |
| API-165 | GET | /api/super-admin/subscriptions/cleanup |
| API-166 | POST | /api/super-admin/subscriptions/cleanup |
| API-181 | GET | /api/super-admin/billing/overview |
| API-182 | GET | /api/super-admin/billing/invoices |
| API-183 | POST | /api/super-admin/billing/invoices/[id]/mark-paid |
| API-184 | POST | /api/super-admin/billing/invoices/[id]/resend |
| API-185 | GET | /api/super-admin/billing/credit-notes |
| API-186 | GET | /api/super-admin/billing/events |

### Debug
| ID | Methode | Pfad |
|----|---------|------|
| API-167 | GET | /api/debug/templates |

---

## E) Data Dictionary (OBJ-IDs)

Prisma-Modelle aus `prisma/schema.prisma`:

| ID | Modell | Tabelle | Beschreibung |
|----|--------|---------|--------------|
| OBJ-001 | User | users | Benutzer (App) |
| OBJ-002 | Organization | organizations | Organisationen |
| OBJ-003 | Membership | memberships | Org-Mitgliedschaften (Quelle der Wahrheit) |
| OBJ-004 | Dpp | dpps | Digital Product Passports |
| OBJ-005 | DppBlockSupplierConfig | dpp_block_supplier_configs | Lieferanten-Konfig pro Block |
| OBJ-006 | DppSupplierInvite | dpp_supplier_invites | Supplier-Einladungen |
| OBJ-007 | DppMedia | dpp_media | Medien pro DPP |
| OBJ-008 | DppVersion | dpp_versions | Publizierte Versionen |
| OBJ-009 | DppVersionMedia | dpp_version_media | Medien pro Version |
| OBJ-010 | PollResponse | poll_responses | Umfrage-Antworten |
| OBJ-011 | DppPermission | dpp_permissions | DPP-spezifische Rechte |
| OBJ-012 | ContributorToken | contributor_tokens | Token für Lieferanten-Beitrag |
| OBJ-013 | SuperAdmin | super_admins | Super-Admin-Benutzer |
| OBJ-014 | SuperAdmin2FA | super_admin_2fa | 2FA für Super Admin |
| OBJ-015 | SuperAdminSession | super_admin_sessions | Super-Admin-Sessions |
| OBJ-016 | AuditLog | audit_logs | Legacy Super-Admin Audit |
| OBJ-017 | PlatformAuditLog | platform_audit_logs | ESPR-aligned Platform Audit |
| OBJ-018 | Subscription | subscriptions | Org-Abonnements |
| OBJ-019 | Feature | features | Feature-Definitionen |
| OBJ-020 | OrganizationFeature | organization_features | Feature-Zuordnung pro Org |
| OBJ-021 | Template | templates | Content-Templates |
| OBJ-022 | TemplateBlock | template_blocks | Blöcke pro Template |
| OBJ-023 | TemplateField | template_fields | Felder pro Block |
| OBJ-024 | FeatureRegistry | feature_registry | Feature-Registry |
| OBJ-025 | BlockType | block_types | Block-Typen |
| OBJ-026 | DppContent | dpp_content | DPP-Inhalt (Blocks JSON) |
| OBJ-027 | PricingPlan | pricing_plans | Preispläne |
| OBJ-028 | PricingPlanFeature | pricing_plan_features | Feature pro Plan |
| OBJ-029 | Entitlement | entitlements | Systemweite Limits |
| OBJ-030 | PricingPlanEntitlement | pricing_plan_entitlements | Limits pro Plan |
| OBJ-031 | SubscriptionModel | subscription_models | Billing-Konfiguration |
| OBJ-032 | Price | prices | Versioned Pricing |
| OBJ-033 | PriceSnapshot | price_snapshots | Checkout-Snapshot |
| OBJ-034 | EntitlementSnapshot | entitlement_snapshots | Entitlement-Snapshot |
| OBJ-035 | TrialFeatureOverride | trial_feature_overrides | Trial-Feature-Overrides |
| OBJ-036 | TrialEntitlementOverride | trial_entitlement_overrides | Trial-Limit-Overrides |
| OBJ-037 | Invitation | invitations | Org-Einladungen |
| OBJ-038 | JoinRequest | join_requests | Beitrittsanfragen |
| OBJ-039 | Notification | notifications | In-App-Benachrichtigungen |
| OBJ-040 | PasswordProtectionConfig | password_protection_config | Globaler Passwortschutz |
| OBJ-041 | Invoice | invoices | Rechnungen (Billing) |
| OBJ-042 | InvoiceLine | invoice_lines | Rechnungszeilen |
| OBJ-043 | Payment | payments | Zahlungen |
| OBJ-044 | CreditNote | credit_notes | Gutschriften |
| OBJ-045 | BillingEventLog | billing_event_logs | Abrechnungs-Ereignisprotokoll |

---

## F) Top 20 User Flows (FLOW-IDs)

| ID | Flow | Success | Negative 1 | Negative 2 |
|----|-----|---------|------------|------------|
| FLOW-001 | Login | Credentials OK → Session, Redirect /app | Falsches Passwort → 401 | Deaktivierter User → 401 |
| FLOW-002 | Signup Phase 1 | E-Mail, Passwort → User, Verification-Mail | E-Mail bereits vorhanden → 400 | Passwort zu kurz → 400 |
| FLOW-003 | E-Mail verifizieren | Token gültig → emailVerified=true | Token abgelaufen → Fehlerseite | Token ungültig → Fehlerseite |
| FLOW-004 | Passwort vergessen | E-Mail gesendet → Reset-Link | E-Mail unbekannt → Kein Fehler (Security) | Rate Limit → 429 |
| FLOW-005 | Passwort zurücksetzen | Token + neues Passwort → Erfolg | Token abgelaufen → Fehlerseite | Token ungültig → Fehlerseite |
| FLOW-006 | Einladung annehmen | Token gültig → Membership, Redirect | Token abgelaufen → Fehlerseite | Bereits akzeptiert → Hinweis |
| FLOW-007 | Organisation: User einladen | Einladung erstellen + E-Mail | Bereits Mitglied → Fehler | Limit erreicht → Fehler |
| FLOW-008 | DPP erstellen | Template wählen → DPP + Content | Keine Org → Fehler | Template nicht gefunden → 404 |
| FLOW-009 | DPP bearbeiten | Content/Blocks speichern → Update | Keine Edit-Rechte → 403 | DPP nicht gefunden → 404 |
| FLOW-010 | Medien hochladen | Datei → DppMedia, Storage-URL | Dateityp nicht erlaubt → 400 | Größe überschritten → 400 |
| FLOW-011 | DPP veröffentlichen | DRAFT → PUBLISHED, Version, Notifications | Validierung fehlgeschlagen → 400 | Keine Publish-Rechte → 403 |
| FLOW-012 | Supplier Invite erstellen | DppSupplierInvite + E-Mail (optional) | DPP nicht gefunden → 404 | E-Mail ungültig → 400 |
| FLOW-013 | Data Request senden | ContributorToken + E-Mail | Block-IDs ungültig → 400 | Limit erreicht → 403 |
| FLOW-014 | Contribute (Supplier) | Token → Formular → Submit | Token abgelaufen → Fehlerseite | Token ungültig → 404 |
| FLOW-015 | DPP importieren | CSV → DPPs erstellt, Notification | CSV ungültig → Fehler | Limit erreicht → Fehler |
| FLOW-016 | Join Request stellen | Anfrage erstellt, Admins benachrichtigt | Bereits Mitglied → Fehler | Org nicht gefunden → 404 |
| FLOW-017 | Abo-Upgrade | Checkout → Stripe → Subscription | Kein Plan → 400 | Stripe-Fehler → Fehler |
| FLOW-018 | Super Admin Login | Credentials → SuperAdminSession | Falsches Passwort → 401 | 2FA erforderlich → 401 |
| FLOW-019 | Template erstellen (SA) | Template angelegt | Duplikat category/version → 400 | Validierung fehlgeschlagen → 400 |
| FLOW-020 | Öffentliche DPP-Ansicht | /public/dpp/[dppId] → DPP-Inhalt | DPP nicht publiziert → 404 | Nicht gefunden → 404 |

---

## G) Side Effects / Events Catalog (EVT-IDs)

### E-Mail (lib/email.ts)

| ID | Event | Funktion | Trigger (API/Flow) |
|----|-------|----------|--------------------|
| EVT-001 | E-Mail-Verifizierung | sendVerificationEmail | signup-phase1, resend-verification |
| EVT-002 | Passwort-Reset | sendPasswordResetEmail | auth/forgot-password, super-admin/users/[id]/password-reset |
| EVT-003 | Org-Einladung | sendInvitationEmail | app/organization/invitations, super-admin/users, super-admin/organizations |
| EVT-004 | Supplier Data Request | sendSupplierDataRequestEmail | data-requests (create), data-requests/send-pending, supplier-invites (create), supplier-invites/send-pending |

### Notifications (lib/phase1/notifications.ts)

| ID | Event | Typ | Trigger |
|----|-------|-----|---------|
| EVT-005 | DPP veröffentlicht | dpp_published | app/dpp/[dppId]/publish |
| EVT-006 | Import erfolgreich | import_finished_success | app/dpps/import |
| EVT-007 | Import Fehler | import_finished_error | app/dpps/import (catch) |
| EVT-008 | Supplier-Daten eingereicht | supplier_submitted_data | contribute/[token]/submit |
| EVT-009 | Join Request | join_request | app/organization/join-requests (POST) |
| EVT-010 | Einladung akzeptiert | invitation_accepted | app/organization/join-requests/[requestId] (PUT, approved) |
| EVT-011 | User entfernt | user_removed | app/organization/users/[userId] (DELETE) |

### Platform Audit (lib/audit/audit-service.ts)

| ID | Event | Aktion | Quelle |
|----|-------|--------|--------|
| EVT-012 | Audit Log Create | CREATE/UPDATE/DELETE etc. | Diverse APIs (UI, API, IMPORT, AI, SYSTEM) |

### Storage (lib/storage.ts)

| ID | Event | Funktion | Trigger |
|----|-------|----------|---------|
| EVT-013 | Datei speichern | saveFile | app/dpp/[dppId]/media (POST) |
| EVT-014 | Datei löschen | deleteFile | app/dpp/[dppId]/media (DELETE), DppMedia/DppVersionMedia Cascade |

### Stripe Webhook

| ID | Event | Event-Typ | Aktion |
|----|-------|-----------|--------|
| EVT-015 | checkout.session.completed | Stripe | Subscription erstellen |
| EVT-016 | customer.subscription.updated | Stripe | Subscription aktualisieren |
| EVT-017 | customer.subscription.deleted | Stripe | Subscription kündigen |

### Super Admin Audit (lib/super-admin-audit.ts)

| ID | Event | Modell | Trigger |
|----|-------|--------|---------|
| EVT-018 | AuditLog (Legacy) | AuditLog | Super-Admin-Aktionen |

---

## H) Parity Test Plan (Golden Master)

### Prinzipien

- **Deterministisch:** Gleiche Eingabe → gleiche Ausgabe (ohne Zeitstempel/IDs wo möglich)
- **Snapshot-basiert:** Antworten werden als Golden Master gespeichert
- **Isoliert:** Keine Abhängigkeit von externen Diensten (SMTP, Stripe Live)

### Test-Kategorien

| Kategorie | Inhalt | Beispiele |
|-----------|--------|-----------|
| API-Response | Status, JSON-Struktur | GET /api/app/dpps → 200, Array |
| API-Error | 400, 401, 403, 404 | POST ohne Auth → 401 |
| Flow-Integration | Mehrere APIs in Sequenz | Signup → Verify → Login |
| Side-Effect-Mock | E-Mail/Notification nicht gesendet, aber DB-Check | createInvitation → Invitation in DB |

### Golden Master Checkliste

- [ ] Auth-Flows: signup-phase1, verify-email, login, forgot-password, reset-password
- [ ] DPP CRUD: create, read, update, content, blocks
- [ ] DPP Publish: publish, versions, qr-code
- [ ] Media: upload, list, delete
- [ ] Supplier: supplier-invites, data-requests, contribute/submit
- [ ] Organisation: invitations, join-requests, users
- [ ] Super Admin: login, templates, pricing, users, organizations

### Snapshot-Dateien (Vorschlag)

```
__snapshots__/
  api/
    auth-signup-phase1.post.json
    app-dpps.get.json
    app-dpp-[dppId].get.json
    ...
  flows/
    flow-001-login.json
    flow-008-dpp-create.json
    ...
```

---

## I) Parity-Normalisierung & Snapshot-Regeln

Damit Snapshots nicht flaky sind, werden folgende Regeln bei Aufnahme und Vergleich angewendet.

### Tolerierte Abweichungen (ignorePaths)

| Pfad / Feld | Grund |
|-------------|-------|
| `*.createdAt`, `*.updatedAt`, `*.timestamp` | Zeitstempel variieren |
| `*.id` (cuid) | Dynamisch generiert |
| `*.uploadedAt`, `*.readAt`, `*.emailSentAt`, `*.submittedAt`, `*.reviewedAt` | Zeitabhängig |
| `*.expiresAt`, `*.verifiedAt`, `*.lastLoginAt` | Zeitabhängig |
| `*.trialExpiresAt`, `*.currentPeriodStart`, `*.currentPeriodEnd`, `*.lastSentAt` | Billing-Zeiten / Rechnungsversand |
| `*.validFrom`, `*.validTo`, `*.effectiveFrom` | Zeitbereiche |
| `*.token`, `invitations[].token` | Einmal-Token, nicht vergleichbar |
| `requestId` (falls von Client gesendet) | Idempotency-IDs |

### Sortierregeln für Arrays

| Response-Pfad | Sortierkriterium |
|---------------|------------------|
| `media`, `media[]` | `sortOrder` ASC, dann `uploadedAt` DESC |
| `versions`, `versions[]` | `version` DESC |
| `dpps`, `dpps[]` | `updatedAt` DESC |
| `invitations`, `invitations[]` | `createdAt` DESC |
| `joinRequests`, `joinRequests[]` | `createdAt` DESC |
| `notifications`, `notifications[]` | `createdAt` DESC |

Sortierung erfolgt vor Snapshot-Aufnahme bzw. vor Vergleich.

### URL-Sanitizing

- Signierte URLs (Storage, Blob): Query-Parameter (`?token=`, `?sig=`, `?expires=`) entfernen, nur Basis-URL vergleichen oder als `[REDACTED_URL]` ersetzen
- Vercel Blob URLs: `https://xxx.blob.vercel-storage.com/...` → Pfad ohne Query behalten, Query redacten

### Token/Secret Redaction

- `totpSecret`, `password`, `passwordHash`: Immer `[REDACTED]`
- `verificationToken`, `passwordResetToken`: `[REDACTED]`
- `token` in Invitation/ContributorToken-Responses: `[REDACTED]` (nur bei Snapshot-Speicherung, nicht bei Vergleich wenn aus Fixture)
- Cookie-Werte in Reports: niemals loggen

### Referenz

Konfiguration: `parity-harness/config/normalize.json` (ignorePaths, redactPaths, sortRules, urlSanitizeRules)

---

## J) Auth-Entscheidung

**Festlegung:** Option 1 – Parität zum Alt-System

- Credentials/2FA-Endpunkte bleiben unverändert.
- API-001 bis API-013 (Auth) sind vollständig in der Paritäts-DoD enthalten.
- Kein zentraler IdP; keine Fassade für Legacy-Endpunkte.

**Implikationen:**

- Login (API-001), Signup (API-003), Verify-Email (API-005, 006, 010), Passwort (API-007–009), 2FA (API-012, 013) werden parity-getestet.
- Super-Admin-Auth (API-112–114) separat; gleiche Regel: Parität zum Alt-System.

**Falls später Option 2 gewählt wird:**

- Explizit dokumentieren, welche Auth-APIs aus Paritäts-DoD rausfallen (mit API-IDs).
- Oder: Fassade-Endpunkte definieren, die kompatibles Verhalten liefern und parity-getestet werden.

---

## K) Daten- und Fixture-Strategie

### Testdaten-Bereitstellung

| Methode | Verwendung |
|---------|------------|
| **Seed** | `prisma/seed.ts` – Feste User (z.B. `parity-test@example.com`), Org, DPP mit bekannten IDs |
| **Fixtures** | JSON-Dateien in `tests/fixtures/` – Invitation-Token, ContributorToken für Contribute-Tests |
| **pathParams** | Golden Requests referenzieren Fixture-IDs: `public/dpp/FIXTURE_DPP_ID` |

### Fixture-IDs (Beispiele)

- `FIXTURE_USER_ID`: User für Session
- `FIXTURE_ORG_ID`: Organisation
- `FIXTURE_DPP_ID`: Publizierter DPP (für Media, Versions, Public View)
- `FIXTURE_INVITATION_TOKEN`: Gültiger Invitation-Token (für FLOW-006)
- `FIXTURE_CONTRIBUTOR_TOKEN`: Gültiger ContributorToken (für FLOW-014)

### Side-Effect-Isolierung

| System | Isolierung |
|--------|------------|
| **SMTP** | Stub: `SMTP_HOST` leer → Nodemailer jsonTransport (Log only). Oder: Mailhog/Ethereal |
| **Stripe** | Test-Mode (`STRIPE_SECRET_KEY` test_*). Webhook-Fixture-Payloads für EVT-015/016/017 |
| **Storage** | Lokales FS in Tests. Vercel Blob: `BLOB_READ_WRITE_TOKEN` optional, Fallback lokal |
| **Notification** | DB-Check statt Push: Notification-Eintrag vorhanden |

### Empfehlung

- Parity-Harness läuft gegen laufende Instanzen (ALT/NEW); keine DB-Seeding im Harness selbst.
- Seed/Fixtures werden von Test-Umgebung (z.B. vor CI-Run) bereitgestellt.
- Request-Dateien in `tests/golden/requests/` nutzen `pathParams` mit Fixture-IDs aus Env oder fester Datei.

---

## L) Slice-Gates (Abnahme je Slice)

Minimale Parity-Tests/Snapshots, die **grün** sein müssen, damit der Slice als „Parität OK“ gilt.

### SLICE-0 Gate

| API-IDs | FLOW-IDs |
|---------|----------|
| API-003 (signup-phase1), API-005 (verify-email), API-001 (nextauth session) | FLOW-001, FLOW-002, FLOW-003 |
| API-041 (dpps), API-044 (dpp/[id]), API-051 (content) | FLOW-008, FLOW-009 |
| API-110 (audit-logs) | — |

### SLICE-1 Gate

| API-IDs | FLOW-IDs |
|---------|----------|
| API-061 (media GET), API-062 (media POST), API-081 (versions), API-080 (publish) | FLOW-010, FLOW-011, FLOW-020 |

### SLICE-2 Gate

| API-IDs | FLOW-IDs |
|---------|----------|
| API-025 (users), API-027 (invitations), API-028 (invitations POST), API-037 (join-requests), API-040 (accept) | FLOW-006, FLOW-007, FLOW-016 |

### SLICE-3 Gate

| API-IDs | FLOW-IDs |
|---------|----------|
| API-067 (supplier-config), API-070 (supplier-invites), API-074 (data-requests), API-107 (contribute GET), API-108 (submit), API-047 (import) | FLOW-012, FLOW-013, FLOW-014, FLOW-015 |

### SLICE-4 Gate

| API-IDs | FLOW-IDs |
|---------|----------|
| API-014 (profile), API-091 (subscription/status), API-094 (notifications), API-097 (pricing/plans), API-098 (checkout) | FLOW-017 |
| API-168 bis API-180 (Org Billing: overview, invoices, payment-method, setup-intent, subscription, select-plan-context) | — |

### SLICE-5 Gate

| API-IDs | FLOW-IDs |
|---------|----------|
| API-112 (SA login), API-116 (SA orgs), API-124 (SA users), API-130 (SA templates), API-136 (feature-registry), API-102 (password/check) | FLOW-018, FLOW-019 |

**Gate-Regel:** Harness `npm run parity:ci` mit Requests für alle genannten API-IDs muss ohne Fehler durchlaufen. FLOW-IDs sind über Request-Sequenzen abgedeckt.

---

## M) Slice Plan (SLICE-0 bis SLICE-5)

### SLICE-0: Foundation (MVP-Core)

**Ziel:** Auth + DPP-Basis ohne Lieferanten/Subscription

| CAP | API | FLOW |
|-----|-----|------|
| CAP-001, CAP-002, CAP-003, CAP-005 | API-001 bis API-013 (Auth) | FLOW-001, FLOW-002, FLOW-003 |
| CAP-010, CAP-011 | API-041 bis API-060 (DPP, Content) | FLOW-008, FLOW-009 |
| CAP-024 | API-110, API-111 | — |

**OBJ:** OBJ-001, OBJ-002, OBJ-003, OBJ-004, OBJ-021 bis OBJ-026, OBJ-017

---

### SLICE-1: Media & Publish

**Ziel:** Medien, Veröffentlichung, Versionen, QR-Code

| CAP | API | FLOW |
|-----|-----|------|
| CAP-012, CAP-013 | API-061 bis API-066, API-077 bis API-084 | FLOW-010, FLOW-011, FLOW-020 |

**OBJ:** OBJ-007, OBJ-008, OBJ-009  
**EVT:** EVT-005, EVT-012, EVT-013, EVT-014

---

### SLICE-2: Organisation & Collaboration

**Ziel:** Org-Management, Einladungen, Join Requests

| CAP | API | FLOW |
|-----|-----|------|
| CAP-006, CAP-007, CAP-008, CAP-009 | API-022 bis API-040 | FLOW-006, FLOW-007, FLOW-016 |

**OBJ:** OBJ-037, OBJ-038, OBJ-039  
**EVT:** EVT-003, EVT-009, EVT-010, EVT-011

---

### SLICE-3: Supplier & Contribute

**Ziel:** Lieferanten-Einladungen, Data Requests, Contribute-Flow

| CAP | API | FLOW |
|-----|-----|------|
| CAP-014, CAP-015, CAP-016, CAP-017 | API-067 bis API-076, API-107 bis API-109 | FLOW-012, FLOW-013, FLOW-014 |
| CAP-018 | API-047 | FLOW-015 |

**OBJ:** OBJ-005, OBJ-006, OBJ-012  
**EVT:** EVT-004, EVT-006, EVT-007, EVT-008

---

### SLICE-4: Subscription & Notifications

**Ziel:** Subscription, Upgrade, Notifications, Pricing, Org-Billing (Übersicht, Rechnungen, Zahlungsarten)

| CAP | API | FLOW |
|-----|-----|------|
| CAP-022, CAP-023 | API-091 bis API-096 | — |
| CAP-025, CAP-026 | API-014 bis API-021 | — |
| CAP-027, CAP-028 | API-097 bis API-101 | FLOW-017 |
| CAP-007 (Billing) | API-168 bis API-180 (billing/overview, invoices, payment-method, setup-intent, subscription, select-plan-context) | — |

**OBJ:** OBJ-018, OBJ-027 bis OBJ-036, OBJ-041 bis OBJ-045 (Invoice, InvoiceLine, Payment, CreditNote, BillingEventLog)  
**EVT:** EVT-015, EVT-016, EVT-017

---

### SLICE-5: Super Admin & System

**Ziel:** Super Admin, Templates, Pricing-Verwaltung, Feature Registry

| CAP | API | FLOW |
|-----|-----|------|
| CAP-019, CAP-020, CAP-021 | API-085 bis API-090 | — |
| CAP-029, CAP-030, CAP-031 | API-102 bis API-106 | — |
| CAP-032 bis CAP-039 | API-112 bis API-166, API-181 bis API-186 (billing/overview, invoices, mark-paid, resend, credit-notes, events) | FLOW-018, FLOW-019 |

**OBJ:** OBJ-013 bis OBJ-016, OBJ-019, OBJ-020, OBJ-024, OBJ-025, OBJ-040  
**EVT:** EVT-001, EVT-002, EVT-018

---

## N) UI-Parität

**Ziel:** Look & Feel 1:1 reproduzierbar – nicht nur Funktion, sondern Design.

**Referenz:** [ui-parity/UI_PARITY_SPEC.md](ui-parity/UI_PARITY_SPEC.md)

### Inventar

- UI-IDs (UI-001 … UI-040): Screens mit Route, CAP/FLOW-Zuordnung, Zuständen (loading, empty, error, success)
- Design-Tokens: `ui-parity/tokens.json`, `ui-parity/tokens.css`, `src/lib/design-tokens.ts`
- **Pflicht bei Neuentwicklung:** Tokens sind die einzige erlaubte Quelle für Farben/Spacing. Keine Hardcodings. Siehe `ui-parity/ENTWICKLUNGSREGELN.md`, EXECUTION_RULES Regel 11.

### Visuelle Regression (Playwright)

| Aspekt | Regel |
|--------|-------|
| Viewports | Desktop 1440×900, Tablet 768×1024, Mobile 390×844 |
| Modi | `record`: Baseline erstellen; `compare`: gegen Baseline diffen |
| Stabilität | Animationen/Transitions deaktiviert; Freeze time wo nötig |
| Daten | Fixtures (JSON) + Route Interception; geschützte Seiten: Seed + Auth |

### Baseline-Update

- **Nur bewusst und mit Review.** Kein automatisches Update in CI.
- Record-Modus: `UI_PARITY_RECORD=1 npm run ui:parity` (in ui-parity/)
- Tolerierte Abweichungen: in `maxDiffPixelRatio` (z.B. 0.01–0.02) konfigurierbar

### Slice-Gates

- [GATE][UI][SLICE-0]: UI-001 … UI-015
- [GATE][UI][SLICE-1]: UI-009 (Media), UI-010, UI-011, UI-026
- [GATE][UI][SLICE-2]: UI-016 … UI-020

Details in `backlog/slice-X.md`.

---

## Zusammenfassung

| Kategorie | Anzahl |
|-----------|--------|
| CAP-IDs | 39 |
| API-IDs | 167 |
| OBJ-IDs | 40 |
| FLOW-IDs | 20 |
| EVT-IDs | 18 |
| Slices | 6 (SLICE-0 bis SLICE-5) |

---

*Erstellt aus Repo-Analyse. Keine neuen Features. IDs exakt wie spezifiziert.*
