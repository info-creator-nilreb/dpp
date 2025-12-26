# Subscription & Trial System Design

## Übersicht

Dieses Dokument beschreibt das vollständige Design für das Multi-Tenant B2B SaaS Subscription- und Trial-System für Digital Product Passports (DPP).

---

## 1. Subscription & Trial Model

### 1.1 Datenbank Schema

#### Subscription Tabelle (erweitert)

```prisma
model Subscription {
  id                   String    @id @default(cuid())
  organizationId       String    @unique
  organization         Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  // Plan: basic | pro | premium
  plan                 String    @default("basic")
  
  // Status: trial_active | active | past_due | canceled | expired
  status               String    @default("trial_active")
  
  // Trial Management
  trialExpiresAt       DateTime? // Nullable, nur gesetzt wenn status = trial_active
  trialStartedAt       DateTime?
  
  // Billing
  stripeSubscriptionId String?   @unique
  stripeCustomerId     String?
  currentPeriodStart   DateTime?
  currentPeriodEnd     DateTime?
  cancelAtPeriodEnd    Boolean   @default(false)
  canceledAt           DateTime?
  
  // Metadata
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  
  @@map("subscriptions")
}
```

#### Organization Tabelle (Relation hinzufügen)

```prisma
model Organization {
  // ... existing fields ...
  subscription         Subscription?
  // ... rest of fields ...
}
```

### 1.2 State Transition Diagram

```
┌─────────────────┐
│  trial_active   │◄───────────┐
│  (premium)      │            │
└────────┬────────┘            │
         │                     │
         │ Upgrade             │ Trial Expiry
         │ (upgrade)           │ (30 days)
         ▼                     │
┌─────────────────┐            │
│    active       │            │
│  (any plan)     │            │
└────────┬────────┘            │
         │                     │
         │ Payment Failed      │
         ▼                     │
┌─────────────────┐            │
│   past_due      │            │
└────────┬────────┘            │
         │                     │
         │ Payment Recovered   │
         │ OR Cancel           │
         ▼                     │
┌─────────────────┐            │
│   canceled      │            │
└────────┬────────┘            │
         │                     │
         │ Expiry              │
         ▼                     │
┌─────────────────┐            │
│    expired      │            │
│ (read-only)     │            │
└─────────────────┘            │
         │                     │
         └─────────────────────┘
               (Trial expired, no upgrade)
```

### 1.3 State Transition Regeln

#### Initial State (Neue Organization)
- `status`: `trial_active`
- `plan`: `premium`
- `trialStartedAt`: `now()`
- `trialExpiresAt`: `now() + 30 days`

#### Upgrade während Trial
- `status`: `trial_active` → `active`
- `plan`: `premium` (bleibt oder ändert sich je nach gewähltem Plan)
- `trialExpiresAt`: wird auf `null` gesetzt
- `currentPeriodStart`: `now()`
- `currentPeriodEnd`: `now() + billing_cycle`

#### Trial Expiry (ohne Upgrade)
- `status`: `trial_active` → `expired`
- `plan`: `premium` (bleibt für Historie)
- `trialExpiresAt`: bleibt bestehen (historie)

#### Downgrade während aktiver Subscription
- `cancelAtPeriodEnd`: `true`
- Status bleibt `active` bis Period Ende
- Am Period Ende: `plan` ändern, `status` bleibt `active`

#### Payment Failed
- `status`: `active` → `past_due`
- Grace Period: 7 Tage

#### Payment Recovery
- `status`: `past_due` → `active`

#### Cancel
- `status`: `active` → `canceled`
- `canceledAt`: `now()`
- Access bis Period Ende

#### Expiry nach Cancel
- `status`: `canceled` → `expired` (am Period Ende)

### 1.4 Publishing Capability Resolution Logic

```typescript
// Pseudocode für Publishing Capability

function hasPublishingCapability(subscription: Subscription): boolean {
  // Trial = premium plan + trial_active status
  const isTrial = subscription.plan === "premium" && 
                  subscription.status === "trial_active";
  
  if (isTrial) {
    return false; // Publishing disabled during trial
  }
  
  // Publishing enabled for active subscriptions only
  return subscription.status === "active";
}
```

**Konkrete Beispiele:**

| Plan    | Status       | Publishing | CMS Editing | Preview |
|---------|--------------|------------|-------------|---------|
| premium | trial_active | ❌         | ✅          | ✅      |
| premium | active       | ✅         | ✅          | ✅      |
| pro     | active       | ✅         | ✅          | ✅      |
| basic   | active       | ✅         | ✅          | ✅      |
| premium | expired      | ❌         | ❌          | ✅      |
| premium | past_due     | ❌         | ✅          | ✅      |

---

## 2. Capability System (Feature Flags)

### 2.1 Capability Definition

Capabilities sind granulare Berechtigungen, die aus mehreren Faktoren abgeleitet werden:
- Plan (basic | pro | premium)
- Subscription Status
- Feature Registry Einstellungen
- Trial State

### 2.2 Capability List

```typescript
type Capability = 
  | "cms_access"              // Zugriff auf CMS
  | "block_editor"            // Block-Editor verfügbar
  | "storytelling_blocks"     // Storytelling Blöcke
  | "interaction_blocks"      // Interaktive Blöcke
  | "styling_controls"        // Styling-Kontrollen
  | "publishing";             // Publishing erlaubt
```

### 2.3 Capability Resolution Logic

```typescript
// Pseudocode für Capability Resolution

interface SubscriptionContext {
  subscription: Subscription;
  features: FeatureRegistry[];
}

interface ResolvedCapabilities {
  cms_access: boolean;
  block_editor: boolean;
  storytelling_blocks: boolean;
  interaction_blocks: boolean;
  styling_controls: boolean;
  publishing: boolean;
}

function resolveCapabilities(context: SubscriptionContext): ResolvedCapabilities {
  const { subscription, features } = context;
  const isTrial = subscription.status === "trial_active";
  const isActive = subscription.status === "active";
  const isExpired = subscription.status === "expired";
  
  // Base capabilities based on subscription status
  const baseCapabilities = {
    cms_access: isActive || isTrial,  // Active or trial
    block_editor: isActive || isTrial,
    publishing: isActive && !isTrial,  // Only active, not trial
  };
  
  // Plan-based capabilities
  const planCapabilities = {
    basic: {
      storytelling_blocks: false,
      interaction_blocks: false,
      styling_controls: false,
    },
    pro: {
      storytelling_blocks: true,
      interaction_blocks: false,
      styling_controls: true,
    },
    premium: {
      storytelling_blocks: true,
      interaction_blocks: true,
      styling_controls: true,
    },
  };
  
  // Feature registry overrides
  const featureOverrides = resolveFeatureRegistry(features, subscription);
  
  // Merge: base + plan + feature registry
  return {
    ...baseCapabilities,
    ...planCapabilities[subscription.plan],
    ...featureOverrides,
    // Publishing always false in trial
    publishing: baseCapabilities.publishing && !isTrial,
  };
}

function resolveFeatureRegistry(
  features: FeatureRegistry[], 
  subscription: Subscription
): Partial<ResolvedCapabilities> {
  const overrides: Partial<ResolvedCapabilities> = {};
  
  for (const feature of features) {
    // Check if feature requires active subscription
    if (feature.requiresActiveSubscription && 
        subscription.status !== "active") {
      overrides[feature.capabilityKey] = false;
      continue;
    }
    
    // Check minimum plan
    const planHierarchy = { basic: 1, pro: 2, premium: 3 };
    const requiredLevel = planHierarchy[feature.minimumPlan];
    const currentLevel = planHierarchy[subscription.plan];
    
    if (currentLevel < requiredLevel) {
      overrides[feature.capabilityKey] = false;
      continue;
    }
    
    // Feature is enabled by default from plan/status
    // Overrides only disable features
  }
  
  return overrides;
}
```

### 2.4 Beispiel Resolved Capability Sets

#### Trial (premium, trial_active)
```typescript
{
  cms_access: true,
  block_editor: true,
  storytelling_blocks: true,
  interaction_blocks: true,
  styling_controls: true,
  publishing: false  // ← Trial restriction
}
```

#### Basic Plan (active)
```typescript
{
  cms_access: true,
  block_editor: true,
  storytelling_blocks: false,
  interaction_blocks: false,
  styling_controls: false,
  publishing: true
}
```

#### Pro Plan (active)
```typescript
{
  cms_access: true,
  block_editor: true,
  storytelling_blocks: true,
  interaction_blocks: false,
  styling_controls: true,
  publishing: true
}
```

#### Premium Plan (active)
```typescript
{
  cms_access: true,
  block_editor: true,
  storytelling_blocks: true,
  interaction_blocks: true,
  styling_controls: true,
  publishing: true
}
```

#### Expired Subscription
```typescript
{
  cms_access: false,
  block_editor: false,
  storytelling_blocks: false,
  interaction_blocks: false,
  styling_controls: false,
  publishing: false
}
```

---

## 3. Feature Registry (Super Admin)

### 3.1 Datenbank Schema

#### FeatureRegistry Tabelle (neu)

```prisma
model FeatureRegistry {
  id                        String   @id @default(cuid())
  
  // Feature Identification
  key                       String   @unique  // z.B. "storytelling_blocks"
  name                      String
  description               String?
  
  // Categorization
  category                  String   // core | content | interaction | styling | publishing
  capabilityKey             String?  // Optional: Maps to capability (for compatibility)
  
  // Plan Requirements
  minimumPlan               String   // basic | pro | premium
  requiresActiveSubscription Boolean @default(true)
  requiresPublishingCapability Boolean @default(false)
  
  // Trial Behavior
  visibleInTrial            Boolean  @default(true)   // Sichtbar aber nicht nutzbar?
  usableInTrial             Boolean  @default(true)   // Nutzbar aber nicht publishable?
  
  // Configuration
  configSchema              String?  // JSON Schema als String
  enabled                   Boolean  @default(true)   // Global enable/disable
  
  // Default Configuration
  defaultForNewDpps         Boolean  @default(false)
  
  // Metadata
  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt
  
  // Relations
  blockTypes                BlockType[]
  
  @@index([category])
  @@index([minimumPlan])
  @@map("feature_registry")
}
```

#### BlockType Tabelle (neu, für CMS Blocks)

```prisma
model BlockType {
  id                String          @id @default(cuid())
  featureRegistryId String?
  featureRegistry   FeatureRegistry? @relation(fields: [featureRegistryId], references: [id], onDelete: SetNull)
  
  // Block Definition
  key               String          @unique  // z.B. "text_block", "image_gallery"
  name              String
  description       String?
  category          String          // content | interaction | styling
  
  // Schema
  configSchema      String          // JSON Schema für Block Config
  defaultConfig     String?         // Default JSON Config
  
  // Behavior
  supportsStyling   Boolean         @default(false)
  requiresPublishing Boolean        @default(false)
  
  // Metadata
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  
  @@index([category])
  @@map("block_types")
}
```

### 3.2 Beispiel Feature Registry Records

```json
// Feature: Storytelling Blocks
{
  "id": "feat_storytelling",
  "key": "storytelling_blocks",
  "name": "Storytelling Blocks",
  "description": "Advanced content blocks for storytelling",
  "category": "content",
  "capabilityKey": "storytelling_blocks",
  "minimumPlan": "pro",
  "requiresActiveSubscription": true,
  "requiresPublishingCapability": false,
  "visibleInTrial": true,
  "usableInTrial": true,
  "configSchema": "{\"type\":\"object\",\"properties\":{\"maxBlocks\":{\"type\":\"number\"}}}",
  "enabled": true,
  "defaultForNewDpps": false
}

// Feature: Interaction Blocks
{
  "id": "feat_interaction",
  "key": "interaction_blocks",
  "name": "Interaction Blocks",
  "description": "Interactive elements (quizzes, forms, etc.)",
  "category": "interaction",
  "capabilityKey": "interaction_blocks",
  "minimumPlan": "premium",
  "requiresActiveSubscription": true,
  "requiresPublishingCapability": true,
  "visibleInTrial": true,
  "usableInTrial": true,
  "configSchema": "{\"type\":\"object\",\"properties\":{\"maxInteractions\":{\"type\":\"number\"}}}",
  "enabled": true,
  "defaultForNewDpps": false
}

// Feature: Publishing
{
  "id": "feat_publishing",
  "key": "publishing",
  "name": "Publishing",
  "description": "Ability to publish DPPs publicly",
  "category": "publishing",
  "capabilityKey": "publishing",
  "minimumPlan": "basic",
  "requiresActiveSubscription": true,
  "requiresPublishingCapability": true,
  "visibleInTrial": false,
  "usableInTrial": false,
  "configSchema": null,
  "enabled": true,
  "defaultForNewDpps": true
}
```

### 3.3 Super Admin Funktionen

#### Feature Management
- **Enable/Disable Features global**: `FeatureRegistry.enabled` toggle
- **Assign Features to Plans**: `FeatureRegistry.minimumPlan` ändern
- **Define Default Blocks**: `FeatureRegistry.defaultForNewDpps = true`
- **Trial Visibility**: `FeatureRegistry.visibleInTrial` und `usableInTrial` setzen

#### Block Type Management
- Erstellen/Löschen von Block Types
- Block Schema Definition (JSON Schema)
- Default Config für neue Blocks

---

## 4. Block-Based CMS (Pro, Premium, Trial)

### 4.1 Content Schema

#### DppContent Tabelle (neu)

```prisma
model DppContent {
  id            String          @id @default(cuid())
  dppId         String
  dpp           Dpp             @relation(fields: [dppId], references: [id], onDelete: Cascade)
  
  // Versioning (Draft vs Published)
  versionId     String?         // Optional: Link zu published version
  isPublished   Boolean         @default(false)
  
  // Block Data
  blocks        Json            // Array von Block Objects
  styling       Json?           // Global styling config (nur wenn capability vorhanden)
  
  // Metadata
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  createdBy     String?
  
  @@index([dppId])
  @@index([dppId, isPublished])
  @@map("dpp_content")
}
```

#### Block JSON Schema

```typescript
interface Block {
  id: string;                    // Unique block ID
  type: string;                  // Block type key (from BlockType)
  order: number;                 // Display order
  config: Record<string, any>;   // Block-specific config (validated against BlockType.configSchema)
  styling?: Record<string, any>; // Block-level styling (only if styling_controls capability)
  data: Record<string, any>;     // Block content data
}

interface DppContentData {
  blocks: Block[];
  styling?: {
    global?: {
      colors?: Record<string, string>;
      fonts?: Record<string, string>;
      spacing?: Record<string, number>;
    };
  };
}
```

### 4.2 Beispiel Block JSON

```json
{
  "blocks": [
    {
      "id": "block_1",
      "type": "text_block",
      "order": 0,
      "config": {
        "maxLength": 1000
      },
      "styling": {
        "fontSize": "18px",
        "color": "#333333"
      },
      "data": {
        "text": "Welcome to our Digital Product Passport"
      }
    },
    {
      "id": "block_2",
      "type": "image_gallery",
      "order": 1,
      "config": {
        "maxImages": 5,
        "layout": "grid"
      },
      "data": {
        "images": [
          {
            "mediaId": "media_123",
            "caption": "Product front view"
          }
        ]
      }
    },
    {
      "id": "block_3",
      "type": "interactive_quiz",
      "order": 2,
      "config": {
        "questions": [
          {
            "question": "What is the material?",
            "options": ["Wood", "Metal", "Plastic"]
          }
        ]
      },
      "data": {}
    }
  ],
  "styling": {
    "global": {
      "colors": {
        "primary": "#007bff",
        "secondary": "#6c757d"
      },
      "fonts": {
        "heading": "Inter",
        "body": "Roboto"
      }
    }
  }
}
```

### 4.3 Validation und Publish Guard Logic

```typescript
// Pseudocode für Validation und Publishing

interface ValidationContext {
  subscription: Subscription;
  capabilities: ResolvedCapabilities;
  featureRegistry: FeatureRegistry[];
  blockTypes: BlockType[];
}

function validateContentForPublishing(
  content: DppContentData,
  context: ValidationContext
): ValidationResult {
  const errors: string[] = [];
  
  // 1. Publishing Capability Check
  if (!context.capabilities.publishing) {
    errors.push("Publishing not available. Upgrade your plan or end trial.");
    return { valid: false, errors };
  }
  
  // 2. Block Type Validation
  for (const block of content.blocks) {
    const blockType = context.blockTypes.find(bt => bt.key === block.type);
    
    if (!blockType) {
      errors.push(`Unknown block type: ${block.type}`);
      continue;
    }
    
    // 3. Feature Registry Check
    if (blockType.featureRegistryId) {
      const feature = context.featureRegistry.find(
        f => f.id === blockType.featureRegistryId
      );
      
      if (feature) {
        // Check minimum plan
        const planHierarchy = { basic: 1, pro: 2, premium: 3 };
        const requiredLevel = planHierarchy[feature.minimumPlan];
        const currentLevel = planHierarchy[context.subscription.plan];
        
        if (currentLevel < requiredLevel) {
          errors.push(
            `Block type ${block.type} requires ${feature.minimumPlan} plan`
          );
        }
        
        // Check requires publishing capability
        if (feature.requiresPublishingCapability && 
            !context.capabilities.publishing) {
          errors.push(
            `Block type ${block.type} requires publishing capability`
          );
        }
      }
    }
    
    // 4. Schema Validation
    if (blockType.configSchema) {
      const schema = JSON.parse(blockType.configSchema);
      const validationResult = validateAgainstSchema(block.config, schema);
      if (!validationResult.valid) {
        errors.push(
          `Block ${block.id}: ${validationResult.errors.join(", ")}`
        );
      }
    }
    
    // 5. Styling Capability Check
    if (block.styling && !context.capabilities.styling_controls) {
      errors.push(
        `Block ${block.id}: Styling not available on current plan`
      );
    }
  }
  
  // 6. Global Styling Check
  if (content.styling && !context.capabilities.styling_controls) {
    errors.push("Global styling not available on current plan");
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

function canSaveDraft(
  content: DppContentData,
  context: ValidationContext
): boolean {
  // Draft saving is always allowed if CMS access is available
  // Validation is less strict (no publishing checks)
  return context.capabilities.cms_access;
}

function canPublish(
  content: DppContentData,
  context: ValidationContext
): boolean {
  // Publishing requires:
  // 1. Publishing capability
  // 2. Valid content
  if (!context.capabilities.publishing) {
    return false;
  }
  
  const validation = validateContentForPublishing(content, context);
  return validation.valid;
}
```

### 4.4 Trial Behavior

```typescript
// Trial-spezifische Logik

function handleTrialContentSave(
  content: DppContentData,
  subscription: Subscription
): SaveResult {
  const isTrial = subscription.status === "trial_active";
  
  if (isTrial) {
    // In trial: Save as draft only
    return {
      success: true,
      savedAs: "draft",
      message: "Content saved as draft. Upgrade to publish."
    };
  }
  
  // Normal save/publish flow
  return {
    success: true,
    savedAs: "draft_or_published"
  };
}
```

---

## 5. Editorial Frontend

### 5.1 Data Flow

```
┌─────────────────┐
│  Frontend App   │
└────────┬────────┘
         │
         │ GET /api/app/dpp/[id]/capabilities
         ▼
┌─────────────────┐
│  API Endpoint   │
└────────┬────────┘
         │
         │ resolveCapabilities(subscription, features)
         ▼
┌─────────────────┐
│ Capability      │
│ Resolution      │
└────────┬────────┘
         │
         │ ResolvedCapabilities
         ▼
┌─────────────────┐
│  Frontend       │
│  Guards         │
└─────────────────┘
```

### 5.2 Frontend Guard Pseudocode

```typescript
// Frontend Capability Hooks

interface UseCapabilitiesResult {
  capabilities: ResolvedCapabilities;
  isLoading: boolean;
  isTrial: boolean;
  trialDaysRemaining: number | null;
}

function useCapabilities(dppId: string): UseCapabilitiesResult {
  const { data, isLoading } = useSWR(
    `/api/app/dpp/${dppId}/capabilities`,
    fetcher
  );
  
  const capabilities = data?.capabilities || {};
  const subscription = data?.subscription;
  
  const isTrial = subscription?.status === "trial_active";
  const trialDaysRemaining = subscription?.trialExpiresAt
    ? Math.ceil(
        (new Date(subscription.trialExpiresAt).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : null;
  
  return {
    capabilities,
    isLoading,
    isTrial,
    trialDaysRemaining
  };
}

// Component Guards

function PublishingGuard({ children, dppId }) {
  const { capabilities, isTrial } = useCapabilities(dppId);
  
  if (!capabilities.publishing) {
    return (
      <TrialBanner>
        {isTrial
          ? "Upgrade to publish your DPP"
          : "Publishing not available"}
      </TrialBanner>
    );
  }
  
  return children;
}

function StylingControls({ blockId, children }) {
  const { capabilities } = useCapabilities(blockId);
  
  if (!capabilities.styling_controls) {
    return children; // Render without styling controls
  }
  
  return <StyledControls>{children}</StyledControls>;
}
```

### 5.3 URL Strategy

#### Preview Mode (Trial & Draft)
```
/app/dpp/[dppId]/preview
```
- **Trial**: Immer Preview Mode, keine public URL
- **Draft**: Preview Mode für nicht-publizierte Inhalte
- **Access**: Nur Organization Members

#### Published Mode (Active Subscription)
```
/public/dpp/[dppId]/v[version]
```
- **Access**: Öffentlich, keine Auth erforderlich
- **Versioning**: Jede Published Version hat eigene URL
- **Trial**: Diese URLs werden niemals während Trial generiert

#### Editorial Mode
```
/app/dpp/[dppId]/edit
```
- **Access**: Organization Members mit CMS Access
- **Trial**: Editing allowed, Publishing disabled

### 5.4 Frontend Guard Implementation

```typescript
// Beispiel: Editor Component

function DppEditor({ dppId }: { dppId: string }) {
  const { capabilities, isTrial, trialDaysRemaining } = useCapabilities(dppId);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  
  return (
    <div>
      {/* Trial Banner */}
      {isTrial && (
        <TrialBanner daysRemaining={trialDaysRemaining}>
          <p>Trial ends in {trialDaysRemaining} days</p>
          <Button onClick={handleUpgrade}>Upgrade Now</Button>
        </TrialBanner>
      )}
      
      {/* Mode Selector */}
      <ModeSelector>
        <Button active={mode === "edit"}>Edit</Button>
        <Button 
          active={mode === "preview"}
          onClick={() => setMode("preview")}
        >
          Preview
        </Button>
        {capabilities.publishing && (
          <PublishButton onClick={handlePublish}>
            Publish
          </PublishButton>
        )}
      </ModeSelector>
      
      {/* Editor */}
      {mode === "edit" && (
        <BlockEditor 
          capabilities={capabilities}
          dppId={dppId}
        />
      )}
      
      {/* Preview */}
      {mode === "preview" && (
        <DppPreview 
          dppId={dppId}
          previewMode={true}
          showPublicUrl={capabilities.publishing}
        />
      )}
    </div>
  );
}

function BlockEditor({ capabilities, dppId }) {
  return (
    <div>
      {/* Block List */}
      <BlockList>
        {/* Only show blocks user has access to */}
        {availableBlockTypes
          .filter(blockType => {
            // Check capability for block type
            return hasCapabilityForBlock(blockType, capabilities);
          })
          .map(blockType => (
            <BlockTypeButton 
              key={blockType.key}
              blockType={blockType}
              disabled={!capabilities.cms_access}
            />
          ))}
      </BlockList>
      
      {/* Styling Controls - conditional */}
      {capabilities.styling_controls && (
        <StylingPanel />
      )}
    </div>
  );
}
```

---

## 6. Account & Billing UI

### 6.1 UX Flow

#### Account Page Structure

```
/account
├── Overview
│   ├── Current Plan Badge
│   ├── Trial Countdown (if trial)
│   ├── Subscription Status
│   └── Quick Actions (Upgrade/Downgrade)
│
├── Subscription
│   ├── Plan Details
│   ├── Billing History
│   ├── Payment Method
│   └── Cancel Subscription
│
├── Usage
│   ├── DPPs Created
│   ├── Published DPPs
│   └── Storage Used
│
└── Billing
    ├── Invoices
    ├── Payment Methods
    └── Billing Address
```

### 6.2 Trial-Specific UI Components

#### Trial Banner Component

```typescript
function TrialStatusCard({ subscription }: { subscription: Subscription }) {
  const isTrial = subscription.status === "trial_active";
  const daysRemaining = subscription.trialExpiresAt
    ? Math.ceil(
        (new Date(subscription.trialExpiresAt).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : null;
  
  if (!isTrial) return null;
  
  return (
    <Card variant="warning">
      <h3>Trial Active - {daysRemaining} days remaining</h3>
      <p>
        You're currently on a Premium trial. Upgrade now to enable publishing
        and maintain access after the trial ends.
      </p>
      <div>
        <Button primary onClick={handleUpgrade}>
          Upgrade to Premium
        </Button>
        <Button onClick={handleViewPlans}>
          View All Plans
        </Button>
      </div>
    </Card>
  );
}
```

#### Publishing Disabled Indicator

```typescript
function PublishingStatus({ capabilities }: { capabilities: ResolvedCapabilities }) {
  if (capabilities.publishing) {
    return (
      <StatusBadge variant="success">
        Publishing Enabled
      </StatusBadge>
    );
  }
  
  return (
    <StatusBadge variant="warning">
      <Icon name="lock" />
      Publishing Disabled
      <Tooltip>
        Publishing is disabled during trial. Upgrade to enable publishing.
      </Tooltip>
    </StatusBadge>
  );
}
```

### 6.3 Required API Endpoints

#### GET /api/app/account/subscription
```typescript
// Response
{
  subscription: {
    id: string;
    plan: "basic" | "pro" | "premium";
    status: "trial_active" | "active" | "past_due" | "canceled" | "expired";
    trialExpiresAt: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  };
  capabilities: ResolvedCapabilities;
  trialDaysRemaining: number | null;
}
```

#### POST /api/app/account/subscription/upgrade
```typescript
// Request
{
  plan: "basic" | "pro" | "premium";
  paymentMethodId?: string; // If new customer
}

// Response
{
  success: boolean;
  subscription: Subscription;
  redirectUrl?: string; // Stripe checkout URL if needed
}
```

#### POST /api/app/account/subscription/downgrade
```typescript
// Request
{
  plan: "basic" | "pro" | "premium";
}

// Response
{
  success: boolean;
  message: string;
  effectiveDate: string; // When downgrade takes effect
}
```

#### POST /api/app/account/subscription/cancel
```typescript
// Response
{
  success: boolean;
  cancelAtPeriodEnd: boolean;
  accessUntil: string;
}
```

### 6.4 Edge Cases

#### Trial Expiration Handling

```typescript
// Pseudocode: Trial Expiration Check (Cron Job)

async function handleTrialExpiration() {
  const expiredTrials = await db.subscription.findMany({
    where: {
      status: "trial_active",
      trialExpiresAt: {
        lte: new Date()
      }
    }
  });
  
  for (const subscription of expiredTrials) {
    // Update status to expired
    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "expired",
        // Keep trialExpiresAt for history
      }
    });
    
    // Send expiration email
    await sendTrialExpiredEmail(subscription.organizationId);
    
    // Lock editing (handled by capability resolution)
    // Data remains accessible in read-only mode
  }
}
```

#### Upgrade During Trial

```typescript
async function upgradeFromTrial(
  subscriptionId: string,
  newPlan: string
) {
  const subscription = await db.subscription.findUnique({
    where: { id: subscriptionId }
  });
  
  if (subscription.status !== "trial_active") {
    throw new Error("Not in trial");
  }
  
  // Upgrade immediately
  await db.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: "active",
      plan: newPlan, // Can change plan during upgrade
      trialExpiresAt: null, // Clear trial expiration
      currentPeriodStart: new Date(),
      currentPeriodEnd: addBillingCycle(new Date(), newPlan),
    }
  });
  
  // Publishing is now enabled immediately
  // No need to wait for billing cycle
}
```

#### Payment Failed Recovery

```typescript
async function handlePaymentRecovery(subscriptionId: string) {
  const subscription = await db.subscription.findUnique({
    where: { id: subscriptionId }
  });
  
  if (subscription.status !== "past_due") {
    return;
  }
  
  // Check if payment was recovered (via webhook from Stripe)
  const paymentSucceeded = await checkPaymentStatus(
    subscription.stripeSubscriptionId
  );
  
  if (paymentSucceeded) {
    await db.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: "active",
      }
    });
  }
}
```

---

## 7. Risk Assessment

### 7.1 Trial Abuse Risks

#### Risiko: Mehrfache Trial Accounts
**Beschreibung**: User erstellen mehrere Accounts/Organizations für verlängerte Trial-Zeit.

**Mitigation**:
- Email-Verification erforderlich
- IP-basierte Rate Limiting (max. 3 Trials pro IP in 90 Tagen)
- Stripe Customer ID Tracking (wenn bereits Customer → kein Trial)
- Credit Card Verification für Upgrade (verhindert anonyme Accounts)

**Implementierung**:
```typescript
async function canStartTrial(organizationId: string, userId: string): Promise<boolean> {
  // Check if user already had trial
  const userTrialHistory = await db.subscription.findFirst({
    where: {
      organization: {
        memberships: {
          some: { userId }
        }
      },
      trialStartedAt: { not: null }
    }
  });
  
  if (userTrialHistory) {
    return false; // User already had trial
  }
  
  // Check IP-based limits
  const ipTrialCount = await checkIPTrialCount(userIp);
  if (ipTrialCount >= 3) {
    return false;
  }
  
  return true;
}
```

#### Risiko: Trial zur Produktion nutzen
**Beschreibung**: User nutzen Trial für produktive DPPs ohne Upgrade.

**Mitigation**:
- Klare Kommunikation: "Publishing disabled during trial"
- Prominente Upgrade-CTAs im Editor
- Auto-email 3 Tage vor Trial Ende
- Trial-Banner in jedem Editor

### 7.2 Feature Leakage Risks

#### Risiko: Premium Features in Basic Plan
**Beschreibung**: Bug erlaubt Zugriff auf Premium-Features in Basic Plan.

**Mitigation**:
- **Server-side Capability Checks**: Niemals Frontend-only
- **API-Level Guards**: Jede API Route prüft Capabilities
- **Database Constraints**: Feature-Zuordnung in DB validiert
- **Automated Tests**: Test Suite prüft alle Plan-Kombinationen

**Implementierung**:
```typescript
// API Route Guard Beispiel
async function apiRouteHandler(req, res) {
  const capabilities = await resolveCapabilities(req.user.organizationId);
  
  if (!capabilities.styling_controls) {
    return res.status(403).json({ error: "Feature not available" });
  }
  
  // Proceed with request
}
```

#### Risiko: Expired Subscription behält Access
**Beschreibung**: User behalten Zugriff nach Subscription Expiry.

**Mitigation**:
- **Middleware Capability Check**: Jede Request prüft Subscription Status
- **Cron Job**: Täglich Expired Subscriptions identifizieren
- **Capability Cache**: Short TTL (5 Minuten) für Capability Cache
- **Grace Period**: 7 Tage Read-Only nach Expiry, dann komplett gesperrt

### 7.3 UX Confusion Risks

#### Risiko: Trial User verstehen Publishing Restriction nicht
**Beschreibung**: User sind verwirrt, warum Publishing nicht funktioniert.

**Mitigation**:
- **Klare UI Indicators**: Publishing Button disabled mit Tooltip
- **Trial Banner**: Immer sichtbar im Editor
- **Onboarding**: Trial-Flow erklärt Publishing-Restriction
- **Help Docs**: FAQ zu Trial vs. Paid Plans

#### Risiko: Trial Expiry überrascht User
**Beschreibung**: User verlieren plötzlich Access ohne Warnung.

**Mitigation**:
- **Email Notifications**: 7, 3, 1 Tag vor Expiry
- **In-App Notifications**: 7, 3, 1 Tag vor Expiry
- **Countdown Timer**: Immer sichtbar im Editor während Trial
- **Grace Period**: 7 Tage Read-Only nach Expiry

### 7.4 Datenintegritäts-Risiken

#### Risiko: Data Loss bei Trial Expiry
**Beschreibung**: User verlieren Daten wenn Trial abläuft.

**Mitigation**:
- **Read-Only Mode**: Expired Subscriptions = Read-Only, keine Deletion
- **Data Retention**: Mindestens 90 Tage nach Expiry
- **Export Feature**: User können Daten exportieren bevor Expiry
- **Backup**: Automatisches Backup vor Expiry

#### Risiko: Concurrent Editing während Status-Change
**Beschreibung**: User editieren während Subscription Status sich ändert.

**Mitigation**:
- **Optimistic Locking**: Version-based locking für Content
- **Status Check vor Save**: Jeder Save prüft aktuellen Status
- **Transaction Isolation**: DB Transactions für Status Changes

### 7.5 Mitigation Strategy Summary

| Risiko | Wahrscheinlichkeit | Impact | Mitigation Priorität |
|--------|-------------------|--------|---------------------|
| Mehrfache Trial Accounts | Hoch | Mittel | Hoch |
| Premium Features in Basic | Mittel | Hoch | Hoch |
| Expired Subscription Access | Niedrig | Hoch | Hoch |
| Trial UX Confusion | Hoch | Niedrig | Mittel |
| Trial Expiry Überraschung | Mittel | Mittel | Mittel |
| Data Loss | Niedrig | Hoch | Hoch |

---

## 8. Implementation Checklist

### Phase 1: Database & Core Logic
- [ ] Subscription Schema erweitern (trialExpiresAt, trialStartedAt)
- [ ] FeatureRegistry Tabelle erstellen
- [ ] BlockType Tabelle erstellen
- [ ] DppContent Tabelle erstellen
- [ ] Capability Resolution Logic implementieren
- [ ] Publishing Guard Logic implementieren

### Phase 2: API Endpoints
- [ ] GET /api/app/account/subscription
- [ ] POST /api/app/account/subscription/upgrade
- [ ] POST /api/app/account/subscription/downgrade
- [ ] GET /api/app/dpp/[id]/capabilities
- [ ] POST /api/app/dpp/[id]/content (mit Publishing Guard)

### Phase 3: Frontend Components
- [ ] useCapabilities Hook
- [ ] TrialBanner Component
- [ ] PublishingGuard Component
- [ ] Account/Subscription Page
- [ ] Editor mit Capability-basierten Guards

### Phase 4: Super Admin
- [ ] Feature Registry Management UI
- [ ] Block Type Management UI
- [ ] Feature Assignment zu Plans

### Phase 5: Automation & Monitoring
- [ ] Trial Expiration Cron Job
- [ ] Email Notifications (Trial Reminders)
- [ ] Payment Recovery Webhooks
- [ ] Capability Cache (Redis?)

---

## Zusammenfassung

Dieses Design implementiert ein vollständiges Subscription- und Trial-System mit:

1. **Klarem Trial-Modell**: Premium Plan + trial_active Status, Publishing disabled
2. **Granularen Capabilities**: Plan- und Status-basierte Feature-Flags
3. **Super Admin Feature Registry**: Zentrales Feature Management
4. **Block-Based CMS**: Content mit Capability-Validierung
5. **Frontend Guards**: Server-side Capability Resolution, Frontend Guards
6. **Account & Billing UI**: Trial Countdown, Upgrade Flows, Edge Cases
7. **Risk Mitigation**: Abuse Prevention, Feature Leakage Prevention, UX Clarity

Das System ist skalierbar, sicher und benutzerfreundlich gestaltet.

