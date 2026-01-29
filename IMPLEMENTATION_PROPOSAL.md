# Implementierungs-Vorschlag: Produktidentität vs. Lieferketten-Daten

## Zusammenfassung

**Kernänderung:** Supplier-Config wird von Template-Ebene auf DPP-Ebene verschoben.

**Begründung:**
- Template = Strukturdefinition (abstrakt)
- DPP = Operative Entscheidungen (konkret)
- Produktidentität = Systemisch geschützt (Economic Operator allein)

---

## 1. Datenmodell-Änderungen

### Schema-Änderungen

**ENTFERNT aus `TemplateBlock`:**
```prisma
// ENTFERNT:
supplierConfig Json?  // Nicht mehr im Template
```

**NEU: `DppBlockSupplierConfig`**
```prisma
model DppBlockSupplierConfig {
  id            String   @id @default(cuid())
  dppId         String
  dpp           Dpp      @relation(fields: [dppId], references: [id], onDelete: Cascade)
  blockId       String   // TemplateBlock ID (Referenz)
  enabled       Boolean  @default(false)
  mode          String?  // "input" | "declaration"
  allowedRoles  String[] // Array von Rollen
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@unique([dppId, blockId])
  @@index([dppId])
  @@map("dpp_block_supplier_configs")
}
```

**Alternative (einfacher, aber weniger strukturiert):**
- Nutze `DppContent.blocks` (JSONB) und erweitere um `supplierConfig` pro Block
- Keine separate Tabelle nötig

**Empfehlung:** Separate Tabelle für bessere Abfragbarkeit und Validierung

---

## 2. Template Editor UI-Änderungen

### Dateien
- `src/app/super-admin/templates/[id]/TemplateEditorContent.tsx`
- `src/app/super-admin/templates/new/NewTemplateContent.tsx`

### Änderungen

**ENTFERNT:**
```typescript
// ENTFERNT: Supplier-Config Icon im Block-Header
{isEditable && (
  <div style={{ position: "relative" }}>
    <button title="Datenquelle konfigurieren">
      {/* LKW-Icon */}
    </button>
    {/* Popover */}
  </div>
)}
```

**ENTFERNT:**
```typescript
// ENTFERNT: supplierConfig aus State
const [blocks, setBlocks] = useState<Block[]>([])
// Block-Interface: supplierConfig entfernen

// ENTFERNT: updateSupplierConfig Funktion
const updateSupplierConfig = (blockId: string, config: SupplierConfig | null) => {
  // ...
}
```

**ENTFERNT:**
```typescript
// ENTFERNT: supplierConfig aus Template-Submit
const templateData = {
  blocks: blocks.map(block => ({
    name: block.name,
    // ENTFERNT: supplierConfig: block.supplierConfig || null,
    fields: block.fields.map(...)
  }))
}
```

**Ergebnis:**
- Template Editor zeigt nur noch Block-Struktur
- Keine Supplier-Konfiguration mehr
- Einfacher, klarer Fokus

---

## 3. DPP Editor UI-Änderungen

### Datei
- `src/components/DppEditor.tsx`
- `src/components/TemplateBlocksSection.tsx`

### Änderungen

**NEU: Supplier-Config State pro Block**
```typescript
// Im DPP Editor
const [blockSupplierConfigs, setBlockSupplierConfigs] = useState<Record<string, {
  enabled: boolean
  mode: "input" | "declaration"
  allowedRoles?: string[]
}>>({})

// Load Supplier-Configs beim DPP-Laden
useEffect(() => {
  if (!isNew && dpp.id) {
    fetch(`/api/app/dpp/${dpp.id}/supplier-config`)
      .then(res => res.json())
      .then(data => setBlockSupplierConfigs(data.configs || {}))
  }
}, [dpp.id, isNew])
```

**NEU: Supplier-Config UI in TemplateBlocksSection**
```typescript
// In TemplateBlocksSection.tsx
{template.blocks.map((block) => {
  const isIdentityBlock = block.order === 0
  const supplierConfig = blockSupplierConfigs[block.id]
  const canInviteSupplier = !isIdentityBlock && supplierConfig?.enabled === true
  
  return (
    <AccordionSection>
      {/* Block-Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <h2>{block.name}</h2>
        
        {/* Supplier-Config Icon (nur wenn nicht Identity-Block) */}
        {!isIdentityBlock && (
          <SupplierConfigButton
            blockId={block.id}
            config={supplierConfig}
            onUpdate={(config) => {
              // API Call: PUT /api/app/dpp/${dppId}/supplier-config
              updateBlockSupplierConfig(block.id, config)
            }}
          />
        )}
      </div>
      
      {/* Fields */}
      {block.fields.map(field => ...)}
      
      {/* Lieferant einladen Button (wenn aktiviert) */}
      {canInviteSupplier && (
        <button onClick={() => onInviteSupplier([block.id])}>
          Lieferant einladen
        </button>
      )}
    </AccordionSection>
  )
})}
```

**NEU: SupplierConfigButton Komponente**
```typescript
// Neue Komponente: src/components/SupplierConfigButton.tsx
function SupplierConfigButton({ blockId, config, onUpdate }) {
  const [open, setOpen] = useState(false)
  
  return (
    <div style={{ position: "relative" }}>
      <button
        title="Datenquelle konfigurieren"
        onClick={() => setOpen(!open)}
        style={{
          color: config?.enabled ? "#24c598" : "#7A7A7A",
          border: config?.enabled ? "1px solid #24c598" : "1px solid #CDCDCD",
          // ... gleiche Styles wie aktuell im Template Editor
        }}
      >
        {/* LKW-Icon */}
      </button>
      
      {open && (
        <Popover>
          {/* Gleiche UX wie aktuell im Template Editor */}
          <label>
            <input
              type="checkbox"
              checked={config?.enabled || false}
              onChange={(e) => {
                onUpdate({
                  enabled: e.target.checked,
                  mode: config?.mode || "input",
                  allowedRoles: config?.allowedRoles || []
                })
              }}
            />
            <div>
              <div>Datenquelle: Lieferkette</div>
              <p>Lieferanten können Daten bereitstellen. Verantwortung verbleibt beim Economic Operator.</p>
            </div>
          </label>
          
          {config?.enabled && (
            <div>
              {/* Modus-Auswahl */}
              {/* Rollen-Filter */}
            </div>
          )}
        </Popover>
      )}
    </div>
  )
}
```

---

## 4. API-Änderungen

### NEU: DPP Supplier-Config Endpoints

**`src/app/api/app/dpp/[dppId]/supplier-config/route.ts`**

```typescript
// GET: Lädt Supplier-Configs für alle Blöcke eines DPPs
export async function GET(
  request: Request,
  { params }: { params: { dppId: string } }
) {
  const configs = await prisma.dppBlockSupplierConfig.findMany({
    where: { dppId: params.dppId }
  })
  
  // Transform zu Record<blockId, config>
  const configMap = configs.reduce((acc, config) => {
    acc[config.blockId] = {
      enabled: config.enabled,
      mode: config.mode,
      allowedRoles: config.allowedRoles
    }
    return acc
  }, {} as Record<string, any>)
  
  return NextResponse.json({ configs: configMap })
}

// PUT: Speichert/aktualisiert Supplier-Config für einen Block
export async function PUT(
  request: Request,
  { params }: { params: { dppId: string } }
) {
  const { blockId, enabled, mode, allowedRoles } = await request.json()
  
  // Validierung: Block darf nicht order === 0 sein
  const template = await getTemplateForDpp(params.dppId)
  const block = template.blocks.find(b => b.id === blockId)
  if (block?.order === 0) {
    return NextResponse.json(
      { error: "Basisdaten-Block kann keine Lieferanten-Konfiguration haben" },
      { status: 400 }
    )
  }
  
  await prisma.dppBlockSupplierConfig.upsert({
    where: {
      dppId_blockId: {
        dppId: params.dppId,
        blockId: blockId
      }
    },
    update: {
      enabled,
      mode,
      allowedRoles
    },
    create: {
      dppId: params.dppId,
      blockId,
      enabled,
      mode,
      allowedRoles
    }
  })
  
  return NextResponse.json({ success: true })
}
```

### ÄNDERUNG: Template API

**`src/app/api/super-admin/templates/[id]/route.ts`**

```typescript
// ENTFERNT: supplierConfig aus Template-Submit
const templateData = {
  blocks: blocks.map(block => ({
    name: block.name,
    // ENTFERNT: supplierConfig: block.supplierConfig || null,
    fields: block.fields.map(...)
  }))
}
```

### ÄNDERUNG: Data Requests API

**`src/app/api/app/dpp/[dppId]/data-requests/route.ts`**

```typescript
// ÄNDERUNG: Nutzt DPP Supplier-Config statt Template Config
export async function POST(
  request: Request,
  { params }: { params: { dppId: string } }
) {
  const { blockIds, email, partnerRole, message } = await request.json()
  
  // Validierung: Prüfe DPP Supplier-Config
  const supplierConfigs = await prisma.dppBlockSupplierConfig.findMany({
    where: {
      dppId: params.dppId,
      blockId: { in: blockIds },
      enabled: true
    }
  })
  
  if (supplierConfigs.length !== blockIds.length) {
    return NextResponse.json(
      { error: "Nicht alle ausgewählten Blöcke sind für Lieferanten konfiguriert" },
      { status: 400 }
    )
  }
  
  // Erstelle ContributorToken mit blockIds
  // ...
}
```

---

## 5. Migration

### SQL Migration

```sql
-- 1. Neue Tabelle erstellen
CREATE TABLE IF NOT EXISTS "dpp_block_supplier_configs" (
  "id" TEXT NOT NULL,
  "dppId" TEXT NOT NULL,
  "blockId" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "mode" TEXT,
  "allowedRoles" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "dpp_block_supplier_configs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "dpp_block_supplier_configs_dppId_blockId_key" UNIQUE ("dppId", "blockId")
);

-- 2. Foreign Key zu DPP
ALTER TABLE "dpp_block_supplier_configs"
ADD CONSTRAINT "dpp_block_supplier_configs_dppId_fkey"
FOREIGN KEY ("dppId") REFERENCES "dpps"("id") ON DELETE CASCADE;

-- 3. Index für Performance
CREATE INDEX IF NOT EXISTS "dpp_block_supplier_configs_dppId_idx"
ON "dpp_block_supplier_configs"("dppId");

-- 4. ENTFERNEN: supplierConfig aus template_blocks (optional, wenn Migration abgeschlossen)
-- ALTER TABLE "template_blocks" DROP COLUMN IF EXISTS "supplierConfig";
```

### Daten-Migration (optional)

```typescript
// Script: migrate-template-supplier-config-to-dpp.ts
// Nur wenn bestehende DPPs bereits Supplier-Config aus Template nutzen

async function migrateSupplierConfigs() {
  // 1. Lade alle aktiven Templates mit supplierConfig
  const templates = await prisma.template.findMany({
    where: { status: "active" },
    include: { blocks: true }
  })
  
  // 2. Für jeden DPP, der ein Template nutzt:
  const dpps = await prisma.dpp.findMany({
    include: { template: { include: { blocks: true } } }
  })
  
  for (const dpp of dpps) {
    if (!dpp.template) continue
    
    // 3. Migriere supplierConfig von Template → DPP
    for (const block of dpp.template.blocks) {
      if (block.supplierConfig?.enabled === true) {
        await prisma.dppBlockSupplierConfig.upsert({
          where: {
            dppId_blockId: {
              dppId: dpp.id,
              blockId: block.id
            }
          },
          update: {
            enabled: true,
            mode: block.supplierConfig.mode || "input",
            allowedRoles: block.supplierConfig.allowedSupplierRoles || []
          },
          create: {
            dppId: dpp.id,
            blockId: block.id,
            enabled: true,
            mode: block.supplierConfig.mode || "input",
            allowedRoles: block.supplierConfig.allowedSupplierRoles || []
          }
        })
      }
    }
  }
}
```

**Empfehlung:** Clean Slate (keine Migration) - nur neue DPPs haben Supplier-Config

---

## 6. Begründungen

### ESPR-Konformität

**Produktidentität:**
- ✅ Systemische Absicherung: `order === 0` kann niemals Supplier-Config haben
- ✅ Keine Möglichkeit, Identitätsdaten durch Lieferanten zu ändern
- ✅ Economic Operator bleibt allein verantwortlich für Basisdaten

**Lieferketten-Daten:**
- ✅ Economic Operator entscheidet pro DPP, welche Daten durch Lieferanten bereitgestellt werden
- ✅ Flexibilität: Verschiedene DPPs können unterschiedliche Strategien haben
- ✅ Template bleibt abstrakt (keine operative Logik)

### UX-Verbesserungen

**Template Editor:**
- ✅ Einfacher: Weniger Konfiguration
- ✅ Klarer Fokus: Nur Strukturdefinition
- ✅ Keine Verwirrung über operative Entscheidungen

**DPP Editor:**
- ✅ Kontextbezogen: Supplier-Config dort, wo sie genutzt wird
- ✅ Flexibel: Pro DPP unterschiedliche Lieferanten-Strategien
- ✅ Klar: Basisdaten = Economic Operator, Rest = Optional

### Architektur-Klarheit

**Trennung der Verantwortlichkeiten:**
- ✅ Template = Struktur (Was?)
- ✅ DPP = Inhalt + operative Entscheidungen (Wie? Wer?)
- ✅ Keine Vermischung von Definition und Ausführung

---

## 7. Implementierungs-Reihenfolge

1. **Datenmodell** (Prisma Schema + Migration)
2. **API-Endpoints** (DPP Supplier-Config)
3. **Template Editor UI entfernen** (Supplier-Config UI)
4. **DPP Editor UI hinzufügen** (Supplier-Config UI)
5. **Integration** (Data Requests nutzen DPP-Config)
6. **Testing** (Alle Flows testen)

**Geschätzte Komplexität:** Mittel
**Breaking Changes:** Ja (Template API entfernt `supplierConfig`)
**Migration nötig:** Optional (nur wenn bestehende DPPs betroffen)


