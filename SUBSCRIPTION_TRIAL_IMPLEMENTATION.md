# Subscription & Trial System - Implementation Guide

## Übersicht

Dieses Dokument beschreibt die Implementierung des Subscription & Trial Systems basierend auf dem Design-Dokument.

---

## Dateien-Übersicht

### Core Logic
- `src/lib/capabilities.ts` - Capability Resolution Logic
- `src/lib/publishing-guards.ts` - Publishing Guards und Validierung

### Database Schema
- `prisma/schema.prisma` - Erweiterte Schema-Definitionen
- `prisma/migrations/20251225010453_add_trial_system/migration.sql` - Migration

---

## Verwendung

### 1. Capabilities prüfen

```typescript
import { getCapabilitiesForOrganization, hasCapability } from "@/lib/capabilities";

// Alle Capabilities für eine Organization holen
const capabilities = await getCapabilitiesForOrganization(organizationId);

if (capabilities.publishing) {
  // Publishing ist verfügbar
}

// Einzelnes Capability prüfen
const canPublish = await hasCapability(organizationId, "publishing");
```

### 2. Publishing Guards verwenden

```typescript
import { 
  canPublish, 
  validateContentForPublishing,
  handleContentSave 
} from "@/lib/publishing-guards";

// Prüfen ob Publishing erlaubt ist
const canPublishContent = await canPublish(contentData, organizationId);

// Content validieren
const validation = await validateContentForPublishing(contentData, organizationId);
if (!validation.valid) {
  console.error("Validation errors:", validation.errors);
}

// Content speichern (mit Trial-Handling)
const saveResult = await handleContentSave(contentData, organizationId, publish: true);
```

### 3. API Route Beispiel

```typescript
// app/api/app/dpp/[dppId]/publish/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getCapabilitiesForOrganization, hasCapability } from "@/lib/capabilities";
import { canPublish, validateContentForPublishing } from "@/lib/publishing-guards";

export async function POST(
  req: NextRequest,
  { params }: { params: { dppId: string } }
) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get DPP and organization
  const dpp = await prisma.dpp.findUnique({
    where: { id: params.dppId },
    include: { organization: true },
  });

  if (!dpp) {
    return NextResponse.json({ error: "DPP not found" }, { status: 404 });
  }

  // Check organization membership
  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      organizationId: dpp.organizationId,
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get capabilities
  const capabilities = await getCapabilitiesForOrganization(dpp.organizationId);

  // Check publishing capability
  if (!capabilities.publishing) {
    return NextResponse.json(
      { 
        error: "Publishing not available",
        reason: "trial" // or "expired", "past_due", etc.
      },
      { status: 403 }
    );
  }

  // Get content from request
  const body = await req.json();
  const content = body.content;

  // Validate content
  const validation = await validateContentForPublishing(
    content,
    dpp.organizationId
  );

  if (!validation.valid) {
    return NextResponse.json(
      { error: "Validation failed", errors: validation.errors },
      { status: 400 }
    );
  }

  // Save as published
  await prisma.dppContent.create({
    data: {
      dppId: dpp.id,
      blocks: content.blocks,
      styling: content.styling,
      isPublished: true,
      createdBy: session.user.id,
    },
  });

  return NextResponse.json({ success: true });
}
```

### 4. Frontend Hook Beispiel

```typescript
// hooks/useCapabilities.ts
import useSWR from "swr";

export function useCapabilities(dppId: string) {
  const { data, error, isLoading } = useSWR(
    `/api/app/dpp/${dppId}/capabilities`,
    fetcher
  );

  return {
    capabilities: data?.capabilities || {},
    subscription: data?.subscription,
    isTrial: data?.subscription?.status === "trial_active",
    trialDaysRemaining: data?.trialDaysRemaining,
    isLoading,
    error,
  };
}
```

### 5. Frontend Component Beispiel

```typescript
// components/PublishingGuard.tsx
"use client";

import { useCapabilities } from "@/hooks/useCapabilities";
import { Button } from "@/components/ui/button";

export function PublishingGuard({ 
  dppId, 
  children 
}: { 
  dppId: string; 
  children: React.ReactNode;
}) {
  const { capabilities, isTrial, trialDaysRemaining } = useCapabilities(dppId);

  if (!capabilities.publishing) {
    return (
      <div className="border-yellow-500 border-2 p-4 rounded">
        <h3 className="font-bold">Publishing Not Available</h3>
        {isTrial ? (
          <p>
            You're on a trial. Upgrade to publish your DPP.
            {trialDaysRemaining !== null && (
              <> {trialDaysRemaining} days remaining.</>
            )}
          </p>
        ) : (
          <p>Please upgrade your plan to enable publishing.</p>
        )}
        <Button href="/account/upgrade">Upgrade Now</Button>
      </div>
    );
  }

  return <>{children}</>;
}
```

---

## Feature Registry Seed Data

### Beispiel: Feature Registry Einträge anlegen

```typescript
// scripts/seed-feature-registry.ts
import { prisma } from "../src/lib/prisma";

async function seedFeatureRegistry() {
  // Storytelling Blocks
  await prisma.featureRegistry.upsert({
    where: { key: "storytelling_blocks" },
    update: {},
    create: {
      key: "storytelling_blocks",
      name: "Storytelling Blocks",
      description: "Advanced content blocks for storytelling",
      category: "content",
      capabilityKey: "storytelling_blocks",
      minimumPlan: "pro",
      requiresActiveSubscription: true,
      requiresPublishingCapability: false,
      visibleInTrial: true,
      usableInTrial: true,
      enabled: true,
      defaultForNewDpps: false,
      configSchema: JSON.stringify({
        type: "object",
        properties: {
          maxBlocks: { type: "number" },
        },
      }),
    },
  });

  // Interaction Blocks
  await prisma.featureRegistry.upsert({
    where: { key: "interaction_blocks" },
    update: {},
    create: {
      key: "interaction_blocks",
      name: "Interaction Blocks",
      description: "Interactive elements (quizzes, forms, etc.)",
      category: "interaction",
      capabilityKey: "interaction_blocks",
      minimumPlan: "premium",
      requiresActiveSubscription: true,
      requiresPublishingCapability: true,
      visibleInTrial: true,
      usableInTrial: true,
      enabled: true,
      defaultForNewDpps: false,
      configSchema: JSON.stringify({
        type: "object",
        properties: {
          maxInteractions: { type: "number" },
        },
      }),
    },
  });

  // Publishing
  await prisma.featureRegistry.upsert({
    where: { key: "publishing" },
    update: {},
    create: {
      key: "publishing",
      name: "Publishing",
      description: "Ability to publish DPPs publicly",
      category: "publishing",
      capabilityKey: "publishing",
      minimumPlan: "basic",
      requiresActiveSubscription: true,
      requiresPublishingCapability: true,
      visibleInTrial: false,
      usableInTrial: false,
      enabled: true,
      defaultForNewDpps: true,
    },
  });

  console.log("Feature Registry seeded successfully");
}

seedFeatureRegistry()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## Trial Initialization

### Neue Organization mit Trial erstellen

```typescript
import { prisma } from "@/lib/prisma";

async function createOrganizationWithTrial(
  name: string,
  userId: string
) {
  // Create organization
  const organization = await prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          userId,
          role: "ORG_OWNER",
        },
      },
      subscription: {
        create: {
          plan: "premium",
          status: "trial_active",
          trialStartedAt: new Date(),
          trialExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      },
    },
  });

  return organization;
}
```

---

## Trial Expiration Cron Job

### Beispiel: Vercel Cron Job

```typescript
// app/api/cron/trial-expiration/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find expired trials
  const expiredTrials = await prisma.subscription.findMany({
    where: {
      status: "trial_active",
      trialExpiresAt: {
        lte: new Date(),
      },
    },
    include: {
      organization: {
        include: {
          memberships: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  // Update to expired status
  for (const subscription of expiredTrials) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "expired",
      },
    });

    // Send expiration email to organization members
    for (const membership of subscription.organization.memberships) {
      // TODO: Send email
      console.log(`Trial expired for user: ${membership.user.email}`);
    }
  }

  return NextResponse.json({
    expired: expiredTrials.length,
  });
}
```

### Vercel cron.json

```json
{
  "crons": [
    {
      "path": "/api/cron/trial-expiration",
      "schedule": "0 0 * * *"
    }
  ]
}
```

---

## Upgrade während Trial

```typescript
// app/api/app/account/subscription/upgrade/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { plan } = body;

  // Get user's organization (simplified - you'd need to handle multiple orgs)
  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    include: { organization: { include: { subscription: true } } },
  });

  if (!membership) {
    return NextResponse.json({ error: "No organization found" }, { status: 404 });
  }

  const subscription = membership.organization.subscription;

  if (!subscription) {
    return NextResponse.json({ error: "No subscription found" }, { status: 404 });
  }

  // Upgrade from trial
  if (subscription.status === "trial_active") {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "active",
        plan,
        trialExpiresAt: null, // Clear trial expiration
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return NextResponse.json({ success: true });
  }

  // Normal upgrade (handle with Stripe webhook)
  // ...
}
```

---

## Nächste Schritte

1. **API Endpoints implementieren**:
   - `/api/app/account/subscription` - Subscription Status
   - `/api/app/account/subscription/upgrade` - Upgrade
   - `/api/app/dpp/[id]/capabilities` - Capabilities Endpoint

2. **Frontend Components**:
   - Trial Banner Component
   - Publishing Guard Component
   - Account/Subscription Page

3. **Super Admin UI**:
   - Feature Registry Management
   - Block Type Management

4. **Testing**:
   - Unit Tests für Capability Resolution
   - Integration Tests für Publishing Guards
   - E2E Tests für Trial Flow

5. **Monitoring**:
   - Trial Conversion Tracking
   - Subscription Status Monitoring
   - Capability Usage Analytics

