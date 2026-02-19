# API-Routen Übersicht

Übersicht aller API-Routen des DPP-Projekts (Next.js App Router). Pfade mit `[param]` sind dynamische Segmente.

---

## 1. Auth (`/api/auth/*`)

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET, POST | `/api/auth/[...nextauth]` | NextAuth Handler (Session, OAuth, Callbacks) |
| POST | `/api/auth/signup` | Registrierung |
| POST | `/api/auth/signup-phase1` | Registrierung Phase 1 |
| GET | `/api/auth/invitation` | Einladung abrufen |
| POST | `/api/auth/verify-email` | E-Mail verifizieren |
| GET | `/api/auth/check-verification` | Verifizierungsstatus prüfen |
| POST | `/api/auth/verify-password` | Passwort verifizieren |
| POST | `/api/auth/forgot-password` | Passwort vergessen |
| POST | `/api/auth/reset-password` | Passwort zurücksetzen |
| POST | `/api/auth/resend-verification` | Verifizierung erneut senden |
| POST | `/api/auth/logout` | Abmelden |
| GET | `/api/auth/check-2fa` | 2FA-Status prüfen |
| GET | `/api/auth/setup-2fa` | 2FA-Setup abrufen |
| POST | `/api/auth/setup-2fa` | 2FA einrichten |

**Öffentliche Auth-Routen (ohne Auth):**  
`verify-email`, `check-verification`, `signup`, `signup-phase1`, `invitation`, `verify-password`, `forgot-password`

---

## 2. App – Profil & Account (`/api/app/*`)

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET | `/api/app/profile` | User-Profil abrufen |
| PUT | `/api/app/profile` | User-Profil aktualisieren |
| GET | `/api/app/account` | Account abrufen |
| PUT | `/api/app/account` | Account aktualisieren |
| POST | `/api/app/account/change-password` | Passwort ändern |
| GET | `/api/app/account/subscription` | Abo des Accounts |
| POST | `/api/app/account/subscription/upgrade` | Abo-Upgrade |
| GET | `/api/app/onboarding/check` | Onboarding-Status prüfen |

---

## 3. App – Organisation (`/api/app/organization/*`)

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET | `/api/app/organizations` | Organisationen des Users |
| PUT | `/api/app/organizations` | Organisation aktualisieren |
| GET | `/api/app/organization/access` | Zugriffsrechte |
| GET | `/api/app/organization/users` | Benutzer der Organisation |
| DELETE | `/api/app/organization/users/[userId]` | Benutzer entfernen |
| GET | `/api/app/organization/invitations` | Einladungen auflisten |
| POST | `/api/app/organization/invitations` | Einladung erstellen |
| DELETE | `/api/app/organization/invitations/[invitationId]` | Einladung löschen |
| GET | `/api/app/organization/billing` | Abrechnung |
| PUT | `/api/app/organization/billing` | Abrechnung aktualisieren |
| GET | `/api/app/organization/company-details` | Firmendaten |
| PUT | `/api/app/organization/company-details` | Firmendaten aktualisieren |
| GET | `/api/app/organization/general` | Allgemeine Org-Einstellungen |
| PUT | `/api/app/organization/general` | Allgemeine Org-Einstellungen aktualisieren |
| POST | `/api/app/organization/update-name` | Organisationsname aktualisieren |
| GET | `/api/app/organization/join-requests` | Join-Requests auflisten |
| POST | `/api/app/organization/join-requests` | Join-Request erstellen |
| PUT | `/api/app/organization/join-requests/[requestId]` | Join-Request bearbeiten |
| POST | `/api/app/invitations/accept` | Einladung annehmen |

---

## 4. App – DPPs (Digital Product Passports) (`/api/app/dpp*`)

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET | `/api/app/dpps` | DPP-Liste abrufen |
| POST | `/api/app/dpp` | Neuen DPP erstellen |
| GET | `/api/app/dpp` | DPPs abrufen (Liste/Filter) |
| GET | `/api/app/dpp/[dppId]` | Einzelnen DPP abrufen |
| PUT | `/api/app/dpp/[dppId]` | DPP aktualisieren |
| GET | `/api/app/dpp/template-by-category` | Template nach Kategorie |
| POST | `/api/app/dpps/import` | DPPs importieren |
| GET | `/api/app/dpps/csv-template` | CSV-Vorlage |
| POST | `/api/app/dpps/preflight/url` | Preflight-Check (URL) |
| POST | `/api/app/dpps/preflight/pdf` | Preflight-Check (PDF) |

---

## 5. App – DPP-Inhalt & Blöcke (`/api/app/dpp/[dppId]/*`)

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET | `/api/app/dpp/[dppId]/content` | Content abrufen |
| POST | `/api/app/dpp/[dppId]/content` | Content anlegen |
| PUT | `/api/app/dpp/[dppId]/content` | Content aktualisieren |
| GET | `/api/app/dpp/[dppId]/content/styling` | Styling abrufen |
| PUT | `/api/app/dpp/[dppId]/content/styling` | Styling aktualisieren |
| GET | `/api/app/dpp/[dppId]/unified-blocks` | Unified Blocks abrufen |
| POST | `/api/app/dpp/[dppId]/content/blocks` | Block erstellen |
| PUT | `/api/app/dpp/[dppId]/content/blocks/[blockId]` | Block aktualisieren |
| DELETE | `/api/app/dpp/[dppId]/content/blocks/[blockId]` | Block löschen |
| POST | `/api/app/dpp/[dppId]/content/blocks/reorder` | Blöcke umsortieren |
| GET | `/api/app/dpp/[dppId]/template` | Template des DPP |
| GET | `/api/app/dpp/[dppId]/capabilities` | DPP-Capabilities |
| POST | `/api/app/dpp/[dppId]/publish` | DPP veröffentlichen |
| GET | `/api/app/dpp/[dppId]/access` | DPP-Zugriff |
| GET | `/api/app/dpp/[dppId]/versions` | Versionen auflisten |
| GET | `/api/app/dpp/[dppId]/versions/[versionNumber]` | Einzelne Version |
| GET | `/api/app/dpp/[dppId]/versions/[versionNumber]/qr-code` | QR-Code |
| GET | `/api/app/dpp/[dppId]/versions/[versionNumber]/qr-code-preview` | QR-Code-Vorschau |

---

## 6. App – DPP Media, Supplier, Data Requests (`/api/app/dpp/[dppId]/*`)

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET | `/api/app/dpp/[dppId]/media` | Medien auflisten |
| POST | `/api/app/dpp/[dppId]/media` | Medium hochladen |
| PATCH | `/api/app/dpp/[dppId]/media` | Medien (Bulk) aktualisieren |
| DELETE | `/api/app/dpp/[dppId]/media` | Medien (Bulk) löschen |
| PATCH | `/api/app/dpp/[dppId]/media/[mediaId]` | Einzelnes Medium aktualisieren |
| DELETE | `/api/app/dpp/[dppId]/media/[mediaId]` | Einzelnes Medium löschen |
| GET | `/api/app/dpp/[dppId]/supplier-config` | Lieferanten-Konfiguration |
| PUT | `/api/app/dpp/[dppId]/supplier-config` | Lieferanten-Konfiguration aktualisieren |
| GET | `/api/app/dpp/[dppId]/supplier-invites` | Supplier-Invites auflisten |
| POST | `/api/app/dpp/[dppId]/supplier-invites` | Supplier-Invite erstellen |
| POST | `/api/app/dpp/[dppId]/supplier-invites/send-pending` | Ausstehende Invites senden |
| DELETE | `/api/app/dpp/[dppId]/supplier-invites/[inviteId]` | Supplier-Invite löschen |
| GET | `/api/app/dpp/[dppId]/data-requests` | Data-Requests auflisten |
| POST | `/api/app/dpp/[dppId]/data-requests` | Data-Request erstellen |
| DELETE | `/api/app/dpp/[dppId]/data-requests` | Data-Request löschen |
| POST | `/api/app/dpp/[dppId]/data-requests/send-pending` | Ausstehende Data-Requests senden |

---

## 7. App – Templates, Kategorien, Features, CO2 (`/api/app/*`)

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET | `/api/app/templates` | Templates abrufen |
| GET | `/api/app/categories` | Kategorien abrufen |
| GET | `/api/app/features` | Verfügbare Features (Org) |
| GET | `/api/app/capabilities/check` | Capability-Check |
| GET | `/api/app/co2/options` | CO2-Optionen |
| POST | `/api/app/co2/calculate` | CO2 berechnen |

---

## 8. App – Subscription & Notifications (`/api/app/*`)

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET | `/api/app/subscription/status` | Abo-Status |
| GET | `/api/app/subscription/usage` | Nutzungsdaten |
| GET | `/api/app/subscription/trial-status` | Trial-Status |
| GET | `/api/app/notifications` | Benachrichtigungen abrufen |
| PUT | `/api/app/notifications` | Benachrichtigungen aktualisieren (z. B. als gelesen) |
| PUT | `/api/app/notifications/[notificationId]` | Einzelne Benachrichtigung aktualisieren |

---

## 9. Pricing & Subscription (Tenant/Public) (`/api/pricing/*`, `/api/subscription/*`)

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET | `/api/pricing/plans` | Verfügbare Pläne |
| POST | `/api/pricing/checkout` | Checkout starten |
| POST | `/api/pricing/webhooks/stripe` | Stripe-Webhook |
| GET | `/api/subscription/context` | Abo-Kontext |
| POST | `/api/subscription/assign` | Abo zuweisen |

---

## 10. Password Protection (`/api/password/*`)

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET | `/api/password/check` | Passwortschutz-Status prüfen |
| POST | `/api/password/verify` | Passwort verifizieren (z. B. für geschützte Seiten) |

---

## 11. Audit Logs (`/api/audit-logs/*`)

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET | `/api/audit-logs` | Audit-Logs abrufen (gefiltert) |
| GET | `/api/audit-logs/[logId]` | Einzelnen Audit-Log abrufen |

---

## 12. Contribute (öffentliche Beiträge) (`/api/contribute/*`)

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET | `/api/contribute/[token]` | Beitragsformular/Seite abrufen |
| POST | `/api/contribute/[token]/submit` | Beitrag absenden |
| GET | `/api/contribute/supplier/[token]` | Supplier-Beitragsseite |

---

## 13. Polls (`/api/polls/*`)

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| POST | `/api/polls/submit` | Umfrage absenden |
| GET | `/api/polls/results` | Umfrage-Ergebnisse |

---

## 14. VAT (`/api/vat/*`)

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| POST | `/api/vat/validate` | USt-IdNr. validieren |

---

## 15. Super Admin (`/api/super-admin/*`)

*Hinweis: Super-Admin-Routen sind unabhängig vom normalen Auth geschützt (eigener Super-Admin-Check).*

### Auth
| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| POST | `/api/super-admin/auth/login` | Super-Admin Login |
| POST | `/api/super-admin/auth/logout` | Super-Admin Logout |
| POST | `/api/super-admin/auth/forgot-password` | Passwort vergessen |

### Dashboard & KPIs
| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET | `/api/super-admin/dashboard/kpis` | KPIs für Dashboard |

### Organisationen
| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET | `/api/super-admin/organizations` | Alle Organisationen |
| POST | `/api/super-admin/organizations` | Organisation anlegen |
| GET | `/api/super-admin/organizations/[id]` | Organisation abrufen |
| PUT | `/api/super-admin/organizations/[id]` | Organisation aktualisieren |
| PUT | `/api/super-admin/organizations/[id]/subscription` | Abo der Organisation |
| GET | `/api/super-admin/organizations/[id]/audit-logs` | Audit-Logs der Organisation |
| POST | `/api/super-admin/organizations/[id]/members` | Mitglied hinzufügen |
| DELETE | `/api/super-admin/organizations/[id]/members` | Mitglied entfernen |

### Users
| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| POST | `/api/super-admin/users` | User anlegen |
| PUT | `/api/super-admin/users/[id]` | User aktualisieren |
| POST | `/api/super-admin/users/[id]/password-reset` | Passwort zurücksetzen |
| POST | `/api/super-admin/users/[id]/suspend` | User sperren |
| POST | `/api/super-admin/users/[id]/reactivate` | User reaktivieren |
| GET | `/api/super-admin/users/[id]/audit-logs` | Audit-Logs des Users |

### Templates
| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| POST | `/api/super-admin/templates` | Template anlegen |
| PUT | `/api/super-admin/templates/[id]` | Template aktualisieren |
| DELETE | `/api/super-admin/templates/[id]` | Template löschen |
| POST | `/api/super-admin/templates/[id]/new-version` | Neue Template-Version |

### Feature Registry
| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET | `/api/super-admin/feature-registry` | Feature-Registry auflisten |
| POST | `/api/super-admin/feature-registry` | Feature registrieren |
| GET | `/api/super-admin/feature-registry/[id]` | Feature abrufen |
| PATCH | `/api/super-admin/feature-registry/[id]` | Feature aktualisieren |
| DELETE | `/api/super-admin/feature-registry/[id]` | Feature löschen |
| POST | `/api/super-admin/features/sync` | Features synchronisieren |

### Pricing (Super Admin)
| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET | `/api/super-admin/pricing/plans` | Pläne verwalten |
| POST | `/api/super-admin/pricing/plans` | Plan anlegen |
| GET | `/api/super-admin/pricing/plans/[id]` | Plan abrufen |
| PUT | `/api/super-admin/pricing/plans/[id]` | Plan aktualisieren |
| DELETE | `/api/super-admin/pricing/plans/[id]` | Plan löschen |
| GET | `/api/super-admin/pricing/prices` | Preise auflisten |
| POST | `/api/super-admin/pricing/prices` | Preis anlegen |
| GET | `/api/super-admin/pricing/subscription-models` | Subscription-Modelle |
| POST | `/api/super-admin/pricing/subscription-models` | Subscription-Modell anlegen |
| GET | `/api/super-admin/pricing/subscription-models/[id]` | Modell abrufen |
| PUT | `/api/super-admin/pricing/subscription-models/[id]` | Modell aktualisieren |
| DELETE | `/api/super-admin/pricing/subscription-models/[id]` | Modell löschen |
| GET | `/api/super-admin/pricing/entitlements` | Entitlements |
| POST | `/api/super-admin/pricing/entitlements` | Entitlement anlegen |
| POST | `/api/super-admin/pricing/trial-entitlement-overrides` | Trial-Entitlement-Override setzen |
| DELETE | `/api/super-admin/pricing/trial-entitlement-overrides` | Trial-Entitlement-Override löschen |
| POST | `/api/super-admin/pricing/trial-feature-overrides` | Trial-Feature-Override setzen |
| DELETE | `/api/super-admin/pricing/trial-feature-overrides` | Trial-Feature-Override löschen |

### Settings & Sonstiges
| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET | `/api/super-admin/settings/password-protection` | Passwortschutz-Status |
| PUT | `/api/super-admin/settings/password-protection` | Passwortschutz setzen |
| GET | `/api/super-admin/settings/password-protection/status` | Passwortschutz-Status (Status-Endpoint) |
| GET | `/api/super-admin/audit-logs` | Globale Audit-Logs |
| GET | `/api/super-admin/dpps/suggestions` | DPP-Vorschläge |
| GET | `/api/super-admin/subscriptions/cleanup` | Cleanup-Status Abos |
| POST | `/api/super-admin/subscriptions/cleanup` | Cleanup ausführen |

---

## 16. Debug (`/api/debug/*`)

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET | `/api/debug/templates` | Templates (Debug) |

---

## Kurzreferenz: Öffentliche Routen (ohne Session)

- `/api/auth/verify-email`
- `/api/auth/check-verification`
- `/api/auth/signup`
- `/api/auth/signup-phase1`
- `/api/auth/invitation`
- `/api/auth/verify-password`
- `/api/auth/forgot-password`
- `/api/contribute/[token]`, `/api/contribute/[token]/submit`, `/api/contribute/supplier/[token]`
- `/api/pricing/webhooks/stripe` (Stripe-Signatur-Check)
- `/api/polls/submit`, `/api/polls/results` (je nach Konfiguration)

**Super-Admin:** Alle `/api/super-admin/*` werden separat per Super-Admin-Middleware geschützt.

---

*Stand: Erzeugt aus dem aktuellen Codebase-Stand. Bei neuen Routen diese Übersicht anpassen.*
