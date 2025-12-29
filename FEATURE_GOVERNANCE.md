# Feature Governance Model

## Overview

This document describes the feature governance model for the B2B SaaS application. Features are explicit product decisions, defined in code, and tightly coupled to subscriptions and behavior.

## Feature Classification

Features are classified into three categories:

### 1. Core Features (`core`)
- Always enabled
- Fundamental to the product
- Cannot be disabled
- Examples: `cms_access`

### 2. Optional Features (`optional`)
- Billable, tariff-based
- Can be enabled/disabled per pricing plan
- Examples: `csv_import`, `ai_analysis`, `publish_dpp`

### 3. System Features (`system`)
- Compliance/infrastructure related
- May be billable
- Examples: `audit_logs`

## Feature Manifest

The source of truth for all features is `src/features/feature-manifest.ts`. This manifest:

- Defines all product-level features
- Classifies features by kind (core/optional/system)
- Provides default names and descriptions
- Specifies billing and subscription requirements

### Adding a New Feature

1. **Define in Manifest**: Add feature definition to `FEATURE_MANIFEST` in `src/features/feature-manifest.ts`
2. **Sync to Database**: Run sync via Super Admin UI or API endpoint
3. **Use in Code**: Reference feature key in capability checks

**Example:**
```typescript
export const FEATURE_MANIFEST: Record<string, FeatureDefinition> = {
  my_new_feature: {
    key: "my_new_feature",
    kind: "optional",
    category: "content",
    defaultName: "My New Feature",
    defaultDescription: "Description of the feature",
    isCore: false,
    isBillable: true,
    systemFeature: false,
    minimumPlan: "basic",
    requiresActiveSubscription: true,
    visibleInTrial: true,
    usableInTrial: false,
  },
}
```

## Feature Sync

Features are automatically synced from the manifest to the database:

- **Idempotent**: Safe to run multiple times
- **Non-destructive**: Manually created features (systemDefined=false) are preserved
- **Automatic Updates**: System-defined features are updated from manifest

### Sync Process

1. Read all features from `FEATURE_MANIFEST`
2. For each feature:
   - If exists and `systemDefined=true`: Update (except key)
   - If exists and `systemDefined=false`: Skip (manual feature)
   - If doesn't exist: Create with `systemDefined=true`

### Running Sync

**Via Super Admin UI:**
- Navigate to `/super-admin/feature-registry`
- Click "Features synchronisieren"

**Via API:**
```bash
POST /api/super-admin/features/sync
```

## Capability Resolver

All feature checks must go through the central capability resolver:

```typescript
import { hasFeature } from "@/lib/capabilities/resolver"

// Check if feature is available
const canUse = await hasFeature("publish_dpp", {
  organizationId: orgId,
  userId: userId,
})
```

### Resolver Rules

1. **Core Features**: Always return `true`
2. **Optional/System Features**: 
   - Check if feature is enabled in registry
   - Check trial overrides (if in trial)
   - Check subscription and pricing plan
   - Return `true` only if included in plan

## Admin UI Rules

The Super Admin "Funktionen" area (`/super-admin/feature-registry`) enforces:

1. **No Manual Creation**: "Create Feature" button removed, replaced with "Sync Features"
2. **Core Features**: Cannot be disabled (toggle button disabled)
3. **System Features**: Key is read-only (cannot be edited)
4. **Visual Indicators**: 
   - "System" badge for system-defined features
   - "Core" badge for core features
   - Status badges for enabled/disabled state

## Feature Lifecycle

### 1. Definition
- Feature is defined in `src/features/feature-manifest.ts`
- Includes all metadata (name, description, billing requirements)

### 2. Sync
- Feature is synced to database via sync mechanism
- Marked as `systemDefined=true`

### 3. Configuration
- Feature can be assigned to pricing plans
- Trial overrides can be configured per subscription model

### 4. Usage
- Code checks feature availability via `hasFeature()`
- UI shows/hides features based on availability
- Actions are enabled/disabled based on capability

### 5. Deprecation
- Feature can be marked as `enabled=false` in database
- Or removed from manifest (will be skipped in sync)

## Migration Guide

### Existing Features

Existing features in the database will be preserved:
- Features with `systemDefined=false` remain as-is
- Features can be migrated to manifest by:
  1. Adding to manifest
  2. Running sync
  3. System will update existing feature

### Breaking Changes

- Feature keys are **immutable** once defined
- Changing a feature key requires:
  1. Create new feature with new key
  2. Migrate data/assignments
  3. Deprecate old feature

## Best Practices

1. **Feature Keys**: Use snake_case, descriptive names
2. **Core Features**: Keep minimal - only truly fundamental features
3. **Documentation**: Always provide clear descriptions
4. **Testing**: Test feature gates in all code paths
5. **Sync Regularly**: Run sync after manifest changes

## Example Usage

### Route Guard
```typescript
import { hasFeature } from "@/lib/capabilities/resolver"

export async function GET(request: Request) {
  const session = await auth()
  const orgId = session?.user?.organizationId
  
  if (!await hasFeature("publish_dpp", { organizationId: orgId })) {
    return NextResponse.json(
      { error: "Feature not available" },
      { status: 403 }
    )
  }
  
  // Feature is available, proceed
}
```

### UI Conditional Rendering
```typescript
"use client"

import { useEffect, useState } from "react"

export function FeatureButton() {
  const [hasFeature, setHasFeature] = useState(false)
  
  useEffect(() => {
    fetch("/api/app/capabilities/check?feature=publish_dpp")
      .then(r => r.json())
      .then(data => setHasFeature(data.available))
  }, [])
  
  if (!hasFeature) return null
  
  return <button>Publish</button>
}
```

## API Endpoints

### Check Feature Availability
```
GET /api/app/capabilities/check?feature={featureKey}&organizationId={orgId}
```

### Sync Features
```
POST /api/super-admin/features/sync
```

## Summary

- **Source of Truth**: `src/features/feature-manifest.ts`
- **Sync Mechanism**: Automatic, idempotent
- **Capability Resolver**: `hasFeature()` in `src/lib/capabilities/resolver.ts`
- **Admin UI**: Read-only for system features, no manual creation
- **Lifecycle**: Define → Sync → Configure → Use

