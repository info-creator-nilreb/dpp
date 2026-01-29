# Microservices-Architektur: Aufwand & Design

**Datum:** 2025-01-XX  
**Ziel:** Bewertung des Aufwands für Microservices-Umstellung und Integration mit Feature-Tiers

---

## Executive Summary

**Aufwand für vollständige Microservices-Umstellung:** 4-6 Monate (2-3 Entwickler)  
**Empfehlung:** Phasenweise Migration, beginnend mit Feature-Service für Tier-Management

**Kern-Erkenntnis:** Microservices können perfekt für Feature-Tier-Management genutzt werden, aber der Aufwand ist erheblich. Eine hybride Lösung (Monolith + Feature-Service) könnte schneller zum Ziel führen.

---

## 1. Aufwand-Schätzung: Microservices-Umstellung

### Aktuelle Situation

**Codebase-Größe:**
- ~100+ API-Routes
- ~60+ React-Komponenten
- ~30+ Lib-Funktionen
- Monolithische Next.js-App (Frontend + Backend)
- Shared Database (PostgreSQL)

**Geschätzte Komplexität:**
- **Hoch:** Business-Logic direkt in API-Routes
- **Mittel:** Klare Domänen-Trennung bereits vorhanden
- **Niedrig:** Keine Service-Layer-Abstraktion

### Aufwand nach Phasen

#### Phase 1: Vorbereitung & Service-Layer (2-3 Wochen)
- Service-Layer in Monolith einführen
- Business-Logic aus API-Routes extrahieren
- Shared Types & Interfaces definieren
- **Aufwand:** 2-3 Wochen (1 Entwickler)

#### Phase 2: Feature-Service extrahieren (2-3 Wochen)
- Feature-Service als ersten Microservice
- Feature Registry, Capabilities, Tier-Management
- API-Gateway für Feature-Checks
- **Aufwand:** 2-3 Wochen (1-2 Entwickler)

#### Phase 3: Weitere Services extrahieren (8-12 Wochen)
- Auth-Service
- DPP-Service
- Organization-Service
- Media-Service
- Subscription-Service
- **Aufwand:** 8-12 Wochen (2-3 Entwickler)

#### Phase 4: Infrastruktur & Deployment (2-3 Wochen)
- Service-Discovery
- API-Gateway (Kong, Traefik, etc.)
- Monitoring & Logging (ELK, Prometheus)
- CI/CD für alle Services
- **Aufwand:** 2-3 Wochen (1-2 Entwickler)

#### Phase 5: Testing & Migration (2-3 Wochen)
- Integration-Tests
- E2E-Tests
- Daten-Migration
- Rollout-Strategie
- **Aufwand:** 2-3 Wochen (2 Entwickler)

**Gesamtaufwand:** 16-24 Wochen (4-6 Monate) mit 2-3 Entwicklern

---

## 2. Microservices für Feature-Tiers: Design

### Konzept: Feature-Service als zentrale Tier-Verwaltung

**Idee:** Ein dedizierter Feature-Service verwaltet alle Feature-Tiers und Capabilities. Andere Services fragen diesen Service, ob Features verfügbar sind.

### Architektur

```
┌─────────────────────────────────────────────────────────┐
│                    API Gateway                            │
│              (Next.js / Kong / Traefik)                 │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   DPP        │  │  Feature     │  │ Subscription │
│   Service    │  │  Service     │  │  Service    │
│              │  │              │  │              │
│ - CRUD DPPs  │  │ - Feature    │  │ - Billing    │
│ - Templates  │  │   Registry   │  │ - Plans      │
│ - Media      │  │ - Capability │  │ - Trials     │
│              │  │   Checks     │  │              │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   Shared Database    │
              │   (PostgreSQL)       │
              └──────────────────────┘
```

### Feature-Service: Definition

**Verantwortlichkeiten:**
1. Feature Registry Management
2. Capability Resolution (welche Features sind für welche Tier verfügbar)
3. Tier-basierte Feature-Gates
4. Trial Feature Overrides
5. Feature Usage Tracking

**API-Endpoints:**
```
GET  /api/v1/features/check?organizationId=xxx&featureKey=yyy
POST /api/v1/features/check-batch
GET  /api/v1/features/available?organizationId=xxx
GET  /api/v1/features/registry
POST /api/v1/features/registry (Super Admin)
```

**Beispiel-Request:**
```typescript
// DPP-Service fragt Feature-Service
const response = await fetch(
  `https://feature-service/api/v1/features/check?organizationId=${orgId}&featureKey=ai_analysis`
)
const { available, reason } = await response.json()

if (!available) {
  throw new Error(`Feature nicht verfügbar: ${reason}`)
}
```

### Vorteile dieser Architektur

1. **Zentrale Tier-Verwaltung**
   - Alle Feature-Logik an einem Ort
   - Einfache Änderungen an Tiers ohne Code-Änderungen in anderen Services
   - A/B-Testing von Features möglich

2. **Skalierbarkeit**
   - Feature-Service kann unabhängig skaliert werden
   - Caching auf Feature-Service-Ebene (Redis)
   - Rate-Limiting pro Feature/Tier

3. **Flexibilität**
   - Neue Features ohne Code-Änderungen in anderen Services
   - Feature-Flags für Rollouts
   - Tier-Upgrades/Downgrades ohne Deployment

4. **Monitoring**
   - Feature-Usage-Tracking zentral
   - Welche Features werden am meisten genutzt?
   - Welche Tiers sind am beliebtesten?

---

## 3. Definition: Einzelne Microservices

### Service-Definition: Kriterien

Ein Microservice sollte:

1. **Eigene Verantwortlichkeit (Single Responsibility)**
   - Klar abgegrenzte Business-Domäne
   - Minimale Abhängigkeiten zu anderen Services

2. **Eigene Daten (Database per Service)**
   - Eigene Datenbank oder Schema
   - Keine direkten Foreign Keys zu anderen Services

3. **Eigene Deployment-Einheit**
   - Unabhängig deploybar
   - Eigene Versionierung

4. **Eigene Skalierung**
   - Kann unabhängig skaliert werden
   - Eigene Performance-Charakteristika

### Vorgeschlagene Microservices

#### 1. **Feature-Service** (Priorität: HOCH)
**Verantwortlichkeiten:**
- Feature Registry Management
- Capability Resolution
- Tier-basierte Feature-Gates
- Trial Feature Overrides

**Daten:**
- `FeatureRegistry`
- `PricingPlanFeature`
- `TrialFeatureOverride`
- `FeatureUsage` (Tracking)

**API:**
- `GET /api/v1/features/check`
- `GET /api/v1/features/available`
- `POST /api/v1/features/registry` (Super Admin)

**Größe:** Klein (2-3 Wochen)

---

#### 2. **Auth-Service** (Priorität: HOCH)
**Verantwortlichkeiten:**
- User-Authentifizierung
- Session-Management
- 2FA
- Password-Reset

**Daten:**
- `User` (nur Auth-relevante Felder)
- `SuperAdmin` (separate Auth)
- `SuperAdminSession`
- `PasswordResetToken`

**API:**
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/verify-2fa`

**Größe:** Mittel (2-3 Wochen)

---

#### 3. **Organization-Service** (Priorität: MITTEL)
**Verantwortlichkeiten:**
- Organization CRUD
- Membership Management
- Invitations
- Join Requests

**Daten:**
- `Organization`
- `Membership`
- `Invitation`
- `JoinRequest`

**API:**
- `GET /api/v1/organizations`
- `POST /api/v1/organizations`
- `GET /api/v1/organizations/:id/members`
- `POST /api/v1/organizations/:id/invitations`

**Größe:** Mittel (2-3 Wochen)

---

#### 4. **DPP-Service** (Priorität: HOCH)
**Verantwortlichkeiten:**
- DPP CRUD
- Template Management
- Content Management
- Versioning
- Publishing

**Daten:**
- `Dpp`
- `DppVersion`
- `DppContent`
- `DppMedia`
- `Template`
- `TemplateBlock`
- `TemplateField`

**API:**
- `GET /api/v1/dpps`
- `POST /api/v1/dpps`
- `GET /api/v1/dpps/:id`
- `PUT /api/v1/dpps/:id`
- `POST /api/v1/dpps/:id/publish`
- `GET /api/v1/templates`

**Größe:** Groß (3-4 Wochen)

**Abhängigkeiten:**
- Feature-Service (für Capability-Checks)
- Organization-Service (für Permissions)

---

#### 5. **Media-Service** (Priorität: NIEDRIG)
**Verantwortlichkeiten:**
- Media-Upload
- Media-Storage (Vercel Blob / S3)
- Media-Optimierung
- Virus-Scanning

**Daten:**
- `DppMedia` (nur Metadaten)
- Media-Dateien (extern: Vercel Blob / S3)

**API:**
- `POST /api/v1/media/upload`
- `GET /api/v1/media/:id`
- `DELETE /api/v1/media/:id`

**Größe:** Klein (1-2 Wochen)

**Abhängigkeiten:**
- DPP-Service (für DPP-Validierung)

---

#### 6. **Subscription-Service** (Priorität: HOCH)
**Verantwortlichkeiten:**
- Subscription Management
- Billing (Stripe Integration)
- Trial Management
- Entitlement Tracking

**Daten:**
- `Subscription`
- `SubscriptionModel`
- `PricingPlan`
- `Price`
- `Entitlement`
- `EntitlementSnapshot`

**API:**
- `GET /api/v1/subscriptions/:organizationId`
- `POST /api/v1/subscriptions/checkout`
- `POST /api/v1/subscriptions/webhooks/stripe`
- `GET /api/v1/subscriptions/:organizationId/entitlements`

**Größe:** Mittel (2-3 Wochen)

**Abhängigkeiten:**
- Feature-Service (für Feature-zu-Plan-Mapping)

---

#### 7. **Audit-Service** (Priorität: NIEDRIG)
**Verantwortlichkeiten:**
- Audit-Logging
- Compliance-Tracking
- Log-Aggregation

**Daten:**
- `PlatformAuditLog`
- `AuditLog` (Super Admin)

**API:**
- `POST /api/v1/audit-logs`
- `GET /api/v1/audit-logs`
- `GET /api/v1/audit-logs/:id`

**Größe:** Klein (1-2 Wochen)

**Abhängigkeiten:**
- Keine (append-only)

---

#### 8. **Notification-Service** (Priorität: NIEDRIG)
**Verantwortlichkeiten:**
- E-Mail-Versand
- In-App-Notifications
- Notification-Templates

**Daten:**
- `Notification`
- Notification-Templates (extern)

**API:**
- `POST /api/v1/notifications/send`
- `GET /api/v1/notifications/:userId`
- `PUT /api/v1/notifications/:id/read`

**Größe:** Klein (1-2 Wochen)

**Abhängigkeiten:**
- Keine (stateless)

---

#### 9. **Contribute-Service** (Priorität: NIEDRIG)
**Verantwortlichkeiten:**
- Contributor Token Management
- Supplier Data Collection
- Token-basierte Zugriffe

**Daten:**
- `ContributorToken`
- `DppBlockSupplierConfig`

**API:**
- `GET /api/v1/contribute/:token`
- `POST /api/v1/contribute/:token/submit`

**Größe:** Klein (1-2 Wochen)

**Abhängigkeiten:**
- DPP-Service (für DPP-Daten)

---

### Service-Abhängigkeits-Graph

```
Feature-Service (keine Abhängigkeiten)
    ↑
    ├── DPP-Service
    ├── Subscription-Service
    └── Organization-Service

Auth-Service (keine Abhängigkeiten)
    ↑
    └── Alle anderen Services

Organization-Service (keine Abhängigkeiten)
    ↑
    ├── DPP-Service
    └── Subscription-Service

DPP-Service
    ├── Feature-Service (Capability-Checks)
    ├── Organization-Service (Permissions)
    └── Media-Service (Media-Uploads)

Media-Service
    └── DPP-Service (DPP-Validierung)

Subscription-Service
    └── Feature-Service (Feature-zu-Plan-Mapping)

Audit-Service (keine Abhängigkeiten - append-only)

Notification-Service (keine Abhängigkeiten - stateless)

Contribute-Service
    └── DPP-Service (DPP-Daten)
```

---

## 4. Alternative: Hybride Architektur (Empfehlung)

### Konzept: Monolith + Feature-Service

**Idee:** Nur den Feature-Service extrahieren, Rest bleibt im Monolith.

**Vorteile:**
- ✅ Schneller umsetzbar (2-3 Wochen statt 4-6 Monate)
- ✅ Feature-Tier-Management sofort verfügbar
- ✅ Weniger Komplexität (keine Service-Discovery, etc.)
- ✅ Einfacheres Deployment (nur 2 Services)

**Nachteile:**
- ❌ Monolith bleibt monolithisch
- ❌ Keine unabhängige Skalierung der anderen Domänen

**Architektur:**
```
┌─────────────────────────────────────────┐
│         Next.js Monolith                │
│  (DPP, Auth, Organization, etc.)         │
└─────────────────┬───────────────────────┘
                  │
                  │ Feature-Checks
                  │
                  ▼
         ┌─────────────────┐
         │  Feature-Service│
         │  (Microservice)  │
         └─────────────────┘
```

**Migration-Pfad:**
1. Feature-Service extrahieren (2-3 Wochen)
2. Monolith fragt Feature-Service für Capability-Checks
3. Später: Weitere Services nach Bedarf extrahieren

---

## 5. Implementierungs-Plan

### Phase 1: Feature-Service (2-3 Wochen)

**Woche 1:**
- Feature-Service als Next.js API Routes erstellen
- Feature Registry API migrieren
- Capability Resolution Logic migrieren
- Tests schreiben

**Woche 2:**
- Monolith auf Feature-Service umstellen
- API-Gateway für Feature-Checks
- Caching (Redis) für Feature-Checks
- Monitoring einrichten

**Woche 3:**
- Performance-Tests
- Rollout-Strategie
- Dokumentation

### Phase 2: Weitere Services (optional, 8-12 Wochen)

Nach Bedarf weitere Services extrahieren:
- Auth-Service (wenn separate Auth-Infrastruktur gewünscht)
- DPP-Service (wenn DPP-Logik sehr komplex wird)
- etc.

---

## 6. Technologie-Stack für Microservices

### Option 1: Next.js API Routes (Empfehlung für Start)
**Vorteile:**
- ✅ Bekannte Technologie
- ✅ TypeScript out-of-the-box
- ✅ Einfaches Deployment (Vercel)
- ✅ Schneller Start

**Nachteile:**
- ❌ Nicht optimal für Microservices (zu viel Overhead)
- ❌ Serverless-Funktionen haben Cold-Start

### Option 2: Express.js + TypeScript
**Vorteile:**
- ✅ Leichtgewichtig
- ✅ Gute Performance
- ✅ Viele Middleware-Optionen

**Nachteile:**
- ❌ Mehr Setup-Aufwand
- ❌ Eigene Deployment-Infrastruktur nötig

### Option 3: tRPC (Type-Safe RPC)
**Vorteile:**
- ✅ Type-Safety zwischen Services
- ✅ Automatische API-Generierung
- ✅ Gute Developer Experience

**Nachteile:**
- ❌ Neuere Technologie (weniger Community)
- ❌ Lernen-Kurve

### Empfehlung: Next.js API Routes für Start, später Express.js

---

## 7. Service-Kommunikation

### Synchron: HTTP/REST
- Für Feature-Checks (schnell, synchron)
- Für CRUD-Operationen

### Asynchron: Message Queue (später)
- Für Audit-Logging (Fire-and-Forget)
- Für Notifications (Background-Jobs)
- Für Media-Processing (Async)

**Technologie:** BullMQ, RabbitMQ, oder AWS SQS

---

## 8. Datenbank-Strategie

### Option 1: Shared Database (Schnellstart)
- Alle Services teilen sich PostgreSQL
- Einfacher Start
- Später auf Database-per-Service migrieren

### Option 2: Database-per-Service (Langfristig)
- Jeder Service hat eigene Datenbank/Schema
- Bessere Isolation
- Mehr Komplexität

**Empfehlung:** Shared Database für Start, später Database-per-Service

---

## 9. Monitoring & Observability

### Erforderlich:
- **Logging:** ELK Stack oder Datadog
- **Metrics:** Prometheus + Grafana
- **Tracing:** OpenTelemetry
- **Error-Tracking:** Sentry

### Service-Health-Checks:
- `/health` Endpoint pro Service
- Automatische Health-Checks (Kubernetes, Vercel)

---

## 10. Kosten-Nutzen-Analyse

### Kosten:
- **Entwicklung:** 4-6 Monate (2-3 Entwickler) = ~€80.000 - €150.000
- **Infrastruktur:** +20-30% (mehr Services = mehr Ressourcen)
- **Wartung:** +30-40% (mehr Services = mehr Komplexität)

### Nutzen:
- ✅ Bessere Skalierbarkeit
- ✅ Unabhängige Deployment
- ✅ Feature-Tier-Management zentral
- ✅ Bessere Team-Autonomie

### ROI:
**Für KMU-fokussierte SaaS:** ROI ist fraglich. Microservices sind Overkill für die meisten KMU-Anwendungen.

**Empfehlung:** Hybride Lösung (Monolith + Feature-Service) bietet 80% des Nutzens bei 20% des Aufwands.

---

## 11. Fazit & Empfehlung

### Empfehlung: Hybride Architektur

**Phase 1 (2-3 Wochen):**
- Feature-Service extrahieren
- Feature-Tier-Management zentralisieren
- Monolith fragt Feature-Service für Capability-Checks

**Phase 2 (später, optional):**
- Weitere Services nach Bedarf extrahieren
- Nur wenn Skalierungsprobleme auftreten

### Warum diese Empfehlung?

1. **Schneller zum Ziel:** Feature-Tier-Management ist das Hauptproblem, nicht die Skalierung
2. **Weniger Komplexität:** Microservices sind komplex, hybride Lösung ist einfacher
3. **Bessere ROI:** 80% des Nutzens bei 20% des Aufwands
4. **Flexibilität:** Später können weitere Services extrahiert werden

### Wann vollständige Microservices?

**Nur wenn:**
- Skalierungsprobleme auftreten (aktuell nicht der Fall)
- Team größer wird (mehr als 5-6 Entwickler)
- Verschiedene Teams an verschiedenen Domänen arbeiten
- Verschiedene Deployment-Zyklen benötigt werden

**Für KMU-fokussierte SaaS:** Microservices sind meist Overkill. Hybride Lösung ist besser.

---

## 12. Nächste Schritte

1. **Entscheidung:** Hybride Lösung oder vollständige Microservices?
2. **Feature-Service Design:** Detailliertes API-Design erstellen
3. **Migration-Plan:** Schritt-für-Schritt-Migration planen
4. **Prototyp:** Feature-Service als Prototyp implementieren
5. **Testing:** Integration-Tests für Service-Kommunikation

---

**Fragen?** Gerne können wir die Details für den Feature-Service oder die hybride Architektur weiter ausarbeiten.


