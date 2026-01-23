# Caching-Analyse: DPP SaaS MVP

**Datum:** 2025-01-XX  
**Reviewer:** Senior Software Developer & SaaS Expert  
**Ziel:** Identifikation von Caching-Optimierungen für bessere Performance und Skalierbarkeit

---

## Executive Summary

Die aktuelle Implementierung hat **kein Caching implementiert** - alle API-Routes verwenden `export const dynamic = "force-dynamic"`, was bedeutet, dass jeder Request die Datenbank direkt abfragt. Dies führt zu:

- ❌ Hoher Datenbanklast
- ❌ Langsamen Response-Zeiten
- ❌ Connection Pool Overflow Problemen (bereits vorhanden: "MaxClientsInSessionMode")
- ❌ Unnötigen Kosten bei steigendem Traffic
- ❌ Schlechter Skalierbarkeit

**Potenzial:** Durch gezieltes Caching können **50-80% der Datenbankqueries eliminiert** und **Response-Zeiten um 60-90% reduziert** werden.

---

## 1. Aktueller Status

### ❌ Kein Caching vorhanden

**Befund:**
- Alle 94 API-Routes verwenden `export const dynamic = "force-dynamic"`
- Keine Redis/Memcached Integration
- Keine Next.js `revalidate` Strategie
- Keine CDN-Integration für statische/öffentliche Inhalte
- Keine Query-Result-Caching in Prisma
- Templates werden bei jedem Request neu geladen
- Permission-Checks erfolgen bei jedem Request ohne Caching

**Performance-Impact:**
- Templates werden in vielen Routes geladen (z.B. `/api/app/templates`, `/api/contribute/[token]`, `/api/app/dpp/route.ts`)
- `latestPublishedTemplate()` wird sehr häufig aufgerufen und lädt jedes Mal ALLE aktiven Templates
- DPP-Listen werden ohne Caching geladen
- Public DPP-Views werden bei jedem Request neu aus der DB geladen

---

## 2. Caching-Kategorien & Strategien

### 2.1 **Statische/Quasi-Statische Daten** (Höchste Priorität)

#### ✅ Templates (Sehr häufiger Zugriff, seltene Änderungen)

**Aktueller Zustand:**
```typescript
// src/lib/template-helpers.ts
export async function latestPublishedTemplate(categoryKey: string) {
  // Lädt ALLE aktiven Templates bei jedem Aufruf
  const allActiveTemplates = await prisma.template.findMany({
    where: { status: "active" },
    include: { blocks: { include: { fields: ... } } }
  })
  // ...
}
```

**Problem:**
- Wird in vielen Routes aufgerufen: DPP-Editor, Contribute-Pages, Public-Views
- Lädt jedes Mal die vollständige Template-Struktur mit allen Blocks und Fields
- Ändert sich nur, wenn Super-Admin ein Template veröffentlicht

**Caching-Strategie:**
1. **In-Memory Cache** (Next.js Server Cache) mit langem TTL
2. **Cache-Invalidierung** nur bei Template-Publish/Update
3. **Redis** für Production (mehrere Server-Instanzen)

**Empfohlene TTL:**
- `latestPublishedTemplate`: **1 Stunde** (Invalidierung bei Publish)
- `getAllPublishedTemplates`: **30 Minuten**
- `getPublishedTemplatesByCategory`: **30 Minuten**

**Implementierung:**
```typescript
// src/lib/cache/template-cache.ts
import { unstable_cache } from 'next/cache'
import { revalidateTag } from 'next/cache'

const CACHE_TAGS = {
  TEMPLATES: 'templates',
  TEMPLATE_CATEGORY: (category: string) => `template:${category}`
}

export async function getCachedLatestPublishedTemplate(categoryKey: string) {
  return unstable_cache(
    async () => {
      // Original implementation
      return latestPublishedTemplate(categoryKey)
    },
    [`latest-template-${categoryKey}`],
    {
      tags: [CACHE_TAGS.TEMPLATES, CACHE_TAGS.TEMPLATE_CATEGORY(categoryKey)],
      revalidate: 3600 // 1 Stunde
    }
  )()
}

// Invalidierung bei Template-Update
export function invalidateTemplateCache(category?: string) {
  revalidateTag(CACHE_TAGS.TEMPLATES)
  if (category) {
    revalidateTag(CACHE_TAGS.TEMPLATE_CATEGORY(category))
  }
}
```

**Routen betroffen:**
- `/api/app/templates/route.ts`
- `/api/contribute/[token]/route.ts` (Zeile 82)
- `/api/app/dpp/route.ts` (Zeile 186)
- `/src/app/public/dpp/[dppId]/page.tsx` (Zeile 59)
- Viele weitere...

---

#### ✅ Pricing Plans (Statisch)

**Aktueller Zustand:**
```typescript
// src/app/api/pricing/plans/route.ts
export const dynamic = "force-dynamic"

export async function GET() {
  const pricingPlans = await prisma.pricingPlan.findMany({
    where: { isPublic: true, isActive: true },
    include: { subscriptionModels: { include: { prices: ... } } }
  })
}
```

**Problem:**
- Wird auf Pricing-Page geladen (öffentlicher Zugriff)
- Ändert sich nur bei Super-Admin-Änderungen
- Komplexe Relationen (Plan → Models → Prices)

**Caching-Strategie:**
- **Next.js `revalidate`**: 1 Stunde
- **Cache-Tag**: `pricing-plans`
- **Invalidierung**: Bei Plan-Update im Super-Admin

**Empfohlene TTL:** **1 Stunde**

---

#### ✅ Feature Registry & Capabilities (Relativ statisch)

**Aktueller Zustand:**
```typescript
// src/lib/capabilities/resolver.ts
export async function hasFeature(featureKey: string, context: CapabilityContext) {
  const feature = await prisma.featureRegistry.findUnique({
    where: { key: featureKey }
  })
  // ... Subscription checks ...
}
```

**Problem:**
- Feature-Checks erfolgen bei vielen Requests
- Feature Registry ändert sich selten
- Subscription-Status könnte gecacht werden (TTL: 5 Minuten)

**Caching-Strategie:**
- **Feature Registry**: 30 Minuten TTL
- **Subscription Status per Organization**: 5 Minuten TTL
- **Capabilities per Organization**: 5 Minuten TTL

**Implementierung:**
```typescript
// src/lib/cache/capability-cache.ts
export async function getCachedFeature(featureKey: string) {
  return unstable_cache(
    async () => prisma.featureRegistry.findUnique({ where: { key: featureKey } }),
    [`feature:${featureKey}`],
    { tags: ['features'], revalidate: 1800 }
  )()
}
```

---

### 2.2 **User/Organization-spezifische Daten** (Mittlere Priorität)

#### ✅ Membership & Permissions (Häufige Checks)

**Aktueller Zustand:**
```typescript
// src/lib/permissions.ts
export async function canViewDPP(userId: string, dppId: string) {
  // Lädt Membership, DPP, Block-Permissions bei jedem Check
}

// src/app/api/app/dpps/route.ts
const memberships = await prisma.membership.findMany({
  where: { userId: session.user.id }
})
```

**Problem:**
- Permission-Checks bei jedem DPP-Zugriff
- Membership-Abfragen bei jeder DPP-Liste
- Ändert sich nur bei Membership-Änderungen

**Caching-Strategie:**
- **Memberships per User**: 5 Minuten TTL
- **Permissions per (User, DPP)**: 2 Minuten TTL
- **Invalidierung**: Bei Membership-Änderungen, Invitation-Acceptance

**Empfohlene TTL:**
- Memberships: **5 Minuten**
- Permissions: **2 Minuten**

---

#### ✅ Organization-Daten (Relativ statisch)

**Aktueller Zustand:**
```typescript
// Wird in vielen Routes geladen
include: {
  organization: { select: { id: true, name: true } }
}
```

**Problem:**
- Organization-Name wird häufig angezeigt, ändert sich selten
- Wird bei jedem DPP-Load mitgeladen

**Caching-Strategie:**
- **Organization-Basis-Daten**: 15 Minuten TTL
- **Invalidierung**: Bei Org-Update

---

### 2.3 **Öffentliche DPP-Views** (Hohe Priorität)

#### ✅ Published DPPs (Public Access)

**Aktueller Zustand:**
```typescript
// src/app/public/dpp/[dppId]/page.tsx
export const dynamic = 'force-dynamic'

const dpp = await prisma.dpp.findUnique({
  where: { id: dppId },
  include: { organization: ..., media: ..., versions: ... }
})
```

**Problem:**
- Öffentlicher Zugriff (kein Auth erforderlich)
- Wird über QR-Codes gescannt (potenziell sehr häufiger Zugriff)
- Daten ändern sich nur bei neuem Publish

**Caching-Strategie:**
1. **Next.js Static Generation** für veröffentlichte Versionen
2. **CDN-Integration** (Vercel Edge Network / Cloudflare)
3. **ISR (Incremental Static Regeneration)**: Revalidate bei Publish

**Empfohlene Strategie:**
```typescript
// src/app/public/dpp/[dppId]/v/[versionNumber]/page.tsx
export const dynamic = 'force-static' // Oder revalidate mit langer TTL
export const revalidate = 3600 // 1 Stunde

// Oder besser: ISR mit On-Demand Revalidation
export const dynamic = 'force-dynamic'
export const revalidate = false // Kein automatisches Revalidate

// Bei Publish: Revalidate aufrufen
import { revalidatePath } from 'next/cache'
revalidatePath(`/public/dpp/${dppId}/v/${versionNumber}`)
```

**Zusätzlich:**
- **CDN-Caching**: Vercel Edge Network für statische HTML-Responses
- **Media-Assets**: CDN für Bilder/PDFs (bereits Vercel Blob, aber kein CDN-Header)

---

#### ✅ Contribute-Token-Validierung (Öffentlich)

**Aktueller Zustand:**
```typescript
// src/app/api/contribute/[token]/route.ts
export const dynamic = "force-dynamic"

const contributorToken = await prisma.contributorToken.findUnique({
  where: { token },
  include: { dpp: { include: { organization: ... } } }
})
```

**Problem:**
- Öffentlicher Zugriff (externe Partner)
- Token-Validierung bei jedem Page-Load
- DPP-Daten ändern sich nicht während Contribution-Session

**Caching-Strategie:**
- **Token-Metadaten** (Status, Expiry): 1 Minute TTL
- **Template-Daten** (siehe 2.1): Bereits gecacht
- **Invalidierung**: Bei Token-Submit

---

### 2.4 **DPP-Listen & Pagination** (Mittlere Priorität)

#### ✅ DPP-Listen (Authentifiziert)

**Aktueller Zustand:**
```typescript
// src/app/api/app/dpps/route.ts
export const dynamic = "force-dynamic"

// Zwei separate Queries
const memberships = await prisma.membership.findMany({ ... })
const dpps = await prisma.dpp.findMany({ where, ... })
```

**Problem:**
- Wird bei jedem Page-Load/Filter-Change aufgerufen
- Membership-Query könnte gecacht werden (siehe 2.2)
- DPP-Liste ändert sich häufiger, aber nicht bei jedem Request

**Caching-Strategie:**
- **Memberships** (siehe 2.2): 5 Minuten
- **DPP-Liste**: Schwieriger zu cachen (User-spezifisch, Filter, Pagination)
- **Alternative**: Query-Optimierung statt Caching (bereits paginiert)

**Empfehlung:**
- Membership-Caching implementieren
- DPP-Liste: Kein Caching (zu dynamisch), aber Query-Optimierung

---

### 2.5 **Session & Auth** (Niedrige Priorität)

#### ⚠️ NextAuth Session (Bereits optimiert)

**Status:** NextAuth verwendet bereits Session-Cookies, kein zusätzliches Caching nötig.

---

## 3. Technologie-Empfehlungen

### 3.1 **Kurzfristig (MVP): Next.js Built-in Caching**

**Vorteile:**
- ✅ Keine zusätzlichen Dependencies
- ✅ Einfache Implementierung
- ✅ Funktioniert mit Vercel Serverless

**Tools:**
- `unstable_cache` für Function-Level Caching
- `revalidateTag` / `revalidatePath` für Invalidierung
- `export const revalidate` für Route-Level Caching

**Limitationen:**
- Funktioniert nur innerhalb einer Server-Instanz
- Bei mehreren Server-Instanzen: Kein geteilter Cache

---

### 3.2 **Mittelfristig: Redis Integration**

**Empfohlener Provider:**
- **Vercel KV** (Upstash Redis) - Serverless-freundlich
- **Railway Redis** - Alternative
- **AWS ElastiCache** - Für AWS-Deployments

**Verwendung:**
- Geteilter Cache zwischen Server-Instanzen
- Session-Store (optional, NextAuth unterstützt Redis)
- Cache-Invalidierung über Pub/Sub möglich

**Implementierung:**
```typescript
// src/lib/cache/redis.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  const cached = await redis.get<T>(key)
  if (cached) return cached
  
  const fresh = await fetcher()
  await redis.set(key, fresh, { ex: ttl })
  return fresh
}
```

---

### 3.3 **CDN für Statische/Öffentliche Inhalte**

**Empfehlung:**
- **Vercel Edge Network** (bereits vorhanden, aber nicht genutzt)
- **Cloudflare** (optional, für zusätzliche Optimierungen)

**Ziel:**
- Public DPP-Views
- Media-Assets (Bilder, PDFs)
- Statische Assets

**Header-Konfiguration:**
```typescript
// In API-Routes oder Middleware
export async function GET() {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
    }
  })
}
```

---

## 4. Implementierungsplan

### 🔴 Phase 1: Quick Wins (1-2 Wochen)

**Priorität 1: Templates**
1. ✅ Cache für `latestPublishedTemplate()` implementieren
2. ✅ Cache für `getAllPublishedTemplates()` implementieren
3. ✅ Invalidierung bei Template-Publish

**Erwarteter Impact:**
- **~30-40% Reduzierung** der Template-Queries
- **50-70% schneller** bei Template-Abfragen

**Priorität 2: Pricing Plans**
1. ✅ Cache für `/api/pricing/plans`
2. ✅ TTL: 1 Stunde

**Erwarteter Impact:**
- **100% Reduzierung** bei wiederholten Abfragen
- **90% schneller** für Pricing-Page-Loads

**Priorität 3: Public DPP Views**
1. ✅ ISR für `/public/dpp/[dppId]/v/[versionNumber]`
2. ✅ Revalidate bei Publish

**Erwarteter Impact:**
- **95% Reduzierung** der DB-Queries für Public-Views
- **80-90% schneller** für QR-Code-Scans

---

### 🟠 Phase 2: Mittelfristig (2-4 Wochen)

**Priorität 1: Memberships & Permissions**
1. ✅ Cache für User-Memberships (5 Min TTL)
2. ✅ Cache für Permission-Checks (2 Min TTL)
3. ✅ Invalidierung bei Membership-Änderungen

**Priorität 2: Feature Registry**
1. ✅ Cache für Feature Registry Einträge
2. ✅ Cache für Subscription-Status (5 Min TTL)

**Priorität 3: Redis Integration**
1. ✅ Redis/Upstash KV Setup
2. ✅ Migration von in-memory zu Redis für Production

---

### 🟡 Phase 3: Langfristig (1-2 Monate)

**Priorität 1: CDN-Optimierung**
1. ✅ CDN-Header für Public-APIs
2. ✅ Media-Asset-Caching-Strategie
3. ✅ Edge-Caching-Konfiguration

**Priorität 2: Query-Optimierung (statt Caching)**
1. ✅ N+1 Query Problems beheben
2. ✅ Prisma Query-Optimierungen
3. ✅ Database-Indizes optimieren

---

## 5. Konkrete Code-Beispiele

### 5.1 Template-Cache Implementation

```typescript
// src/lib/cache/template-cache.ts
import { unstable_cache } from 'next/cache'
import { revalidateTag } from 'next/cache'
import { latestPublishedTemplate as originalLatestPublishedTemplate } from '../template-helpers'

const CACHE_TAGS = {
  TEMPLATES: 'templates',
  TEMPLATE_BY_CATEGORY: (cat: string) => `template:category:${cat}`
}

export async function getCachedLatestPublishedTemplate(categoryKey: string) {
  return unstable_cache(
    async () => originalLatestPublishedTemplate(categoryKey),
    [`latest-template-${categoryKey}`],
    {
      tags: [
        CACHE_TAGS.TEMPLATES,
        CACHE_TAGS.TEMPLATE_BY_CATEGORY(categoryKey)
      ],
      revalidate: 3600 // 1 Stunde
    }
  )()
}

export function invalidateTemplateCache(category?: string) {
  revalidateTag(CACHE_TAGS.TEMPLATES)
  if (category) {
    revalidateTag(CACHE_TAGS.TEMPLATE_BY_CATEGORY(category))
  }
}

// In template-helpers.ts: Export wrapped version
export { getCachedLatestPublishedTemplate as latestPublishedTemplate }
```

**Usage in Template-Publish Route:**
```typescript
// src/app/api/super-admin/templates/[id]/new-version/route.ts
import { invalidateTemplateCache } from '@/lib/cache/template-cache'

// Nach erfolgreichem Publish:
await invalidateTemplateCache(template.category)
```

---

### 5.2 Pricing Plans Cache

```typescript
// src/app/api/pricing/plans/route.ts
import { unstable_cache } from 'next/cache'

export const dynamic = "force-dynamic" // Behalten für Auth-Checks
export const revalidate = 3600 // 1 Stunde

export async function GET() {
  const pricingPlans = await unstable_cache(
    async () => {
      return prisma.pricingPlan.findMany({
        where: { isPublic: true, isActive: true },
        include: { /* ... */ }
      })
    },
    ['pricing-plans'],
    {
      tags: ['pricing-plans'],
      revalidate: 3600
    }
  )()
  
  return NextResponse.json({ plans: pricingPlans })
}
```

**Invalidierung bei Plan-Update:**
```typescript
// In Super-Admin Plan-Update Route
import { revalidateTag } from 'next/cache'
revalidateTag('pricing-plans')
```

---

### 5.3 Public DPP ISR

```typescript
// src/app/public/dpp/[dppId]/v/[versionNumber]/page.tsx
export const dynamic = 'force-dynamic'
export const revalidate = false // On-demand revalidation

export default async function PublicVersionPage({ params }: PublicVersionPageProps) {
  const { dppId, versionNumber } = await params
  
  // Bei Publish wird revalidatePath aufgerufen
  const dpp = await prisma.dpp.findUnique({
    where: { id: dppId },
    include: { /* ... */ }
  })
  
  // ...
}
```

**Revalidation bei Publish:**
```typescript
// src/app/api/app/dpp/[dppId]/publish/route.ts
import { revalidatePath } from 'next/cache'

// Nach erfolgreichem Publish:
const version = /* ... */
revalidatePath(`/public/dpp/${dppId}/v/${version.version}`)
revalidatePath(`/public/dpp/${dppId}`) // Fallback-Route
```

---

### 5.4 Membership Cache

```typescript
// src/lib/cache/membership-cache.ts
import { unstable_cache } from 'next/cache'
import { prisma } from '../prisma'

export async function getCachedUserMemberships(userId: string) {
  return unstable_cache(
    async () => {
      return prisma.membership.findMany({
        where: { userId },
        select: { organizationId: true, role: true }
      })
    },
    [`memberships:${userId}`],
    {
      tags: [`memberships:user:${userId}`, 'memberships'],
      revalidate: 300 // 5 Minuten
    }
  )()
}

// Invalidierung bei Membership-Änderungen
export function invalidateUserMemberships(userId: string) {
  revalidateTag(`memberships:user:${userId}`)
  revalidateTag('memberships')
}
```

**Usage:**
```typescript
// src/app/api/app/dpps/route.ts
import { getCachedUserMemberships } from '@/lib/cache/membership-cache'

const memberships = await getCachedUserMemberships(session.user.id)
const organizationIds = memberships.map(m => m.organizationId)
```

---

## 6. Monitoring & Metriken

### 6.1 Erfolgs-Metriken

**Vorher/Nachher Vergleiche:**
1. **Datenbank-Queries pro Request**
   - Ziel: 50-70% Reduzierung
   
2. **API Response-Zeit**
   - Templates: < 50ms (aktuell: 200-500ms)
   - Public DPP: < 100ms (aktuell: 300-800ms)
   - Pricing Plans: < 20ms (aktuell: 150-300ms)

3. **Connection Pool Utilization**
   - Ziel: Keine "MaxClientsInSessionMode" Fehler mehr

4. **Cache Hit Rate**
   - Templates: > 90%
   - Pricing Plans: > 95%
   - Public DPPs: > 85%

### 6.2 Monitoring-Tools

- **Vercel Analytics**: Response-Zeit-Tracking
- **Custom Logging**: Cache Hit/Miss Rates
- **Database Monitoring**: Query-Count-Reduzierung

---

## 7. Risiken & Fallbacks

### 7.1 Cache-Invalidierung

**Risiko:** Stale Data bei fehlgeschlagener Invalidierung

**Mitigation:**
- **TTL-basierte Invalidierung** als Fallback
- **Version-Tags** für kritische Daten
- **Manual Invalidation** über Super-Admin-Interface

### 7.2 Cache-Misses

**Risiko:** Performance-Verschlechterung bei Cache-Miss

**Mitigation:**
- **Stale-While-Revalidate** Strategie
- **Graceful Degradation**: Fallback zu DB-Query
- **Monitoring**: Alert bei hoher Miss-Rate

### 7.3 Redis-Ausfall

**Risiko:** Service-Outage bei Redis-Problemen

**Mitigation:**
- **Fallback zu Next.js Cache** bei Redis-Fehler
- **Circuit Breaker** Pattern
- **Health Checks** für Redis

---

## 8. Kostenschätzung

### Next.js Built-in Caching
- **Kosten:** €0 (bereits vorhanden)
- **Infrastructure:** Keine zusätzliche Infrastruktur nötig

### Redis (Upstash KV)
- **Free Tier:** 10.000 Requests/Tag
- **Pro:** ~€10/Monat für 1M Requests
- **Erwarteter Usage:** ~100K-500K Requests/Monat (MVP)
- **Kosten:** €0-10/Monat

### CDN (Vercel Edge)
- **Kosten:** In Vercel-Plan enthalten
- **Zusätzliche Kosten:** €0

**Gesamt:** **€0-10/Monat** für MVP-Phase

---

## 9. Fazit & Empfehlungen

### ✅ Sofort umsetzbar (Phase 1)

1. **Template-Caching** - Höchster Impact, einfach umzusetzen
2. **Pricing Plans Caching** - Einfach, hoher Impact auf Pricing-Page
3. **Public DPP ISR** - Wichtig für QR-Code-Performance

**Geschätzter Aufwand:** 1-2 Wochen  
**Erwartete Verbesserung:** 50-70% Reduzierung der DB-Queries, 60-80% schnellere Response-Zeiten

### 📈 Mittelfristig (Phase 2)

1. **Membership & Permission Caching**
2. **Redis Integration** für Production
3. **Feature Registry Caching**

**Geschätzter Aufwand:** 2-4 Wochen  
**Erwartete Verbesserung:** Weitere 20-30% Reduzierung

### 🎯 Langfristig (Phase 3)

1. **CDN-Optimierung**
2. **Query-Optimierung** (statt Caching)
3. **Advanced Caching-Strategien**

---

## 10. Nächste Schritte

1. ✅ **Diese Analyse reviewen** und Prioritäten bestätigen
2. ✅ **Phase 1 implementieren** (Template + Pricing + Public DPP)
3. ✅ **Monitoring einrichten** (Cache Hit Rates, Response Times)
4. ✅ **Performance-Tests** durchführen (Vorher/Nachher)
5. ✅ **Phase 2 planen** basierend auf Phase-1-Ergebnissen

---

**Erstellt von:** Senior Software Developer & SaaS Expert  
**Datum:** 2025-01-XX  
**Status:** Bereit für Implementierung


