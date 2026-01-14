# Architektur-Refactoring: Produktidentität vs. Lieferketten-Daten

## Zielarchitektur

### Kernprinzip

**Trennung zwischen:**
1. **Produktidentität** (Basisdaten) = Economic Operator allein verantwortlich
2. **Produktbeschreibung / Lieferketteninformationen** = Optional durch Lieferanten

**Entscheidungslogik:**
- Template Engine = Strukturdefinition (keine operative Logik)
- DPP Editor = Operative Entscheidungen (Supplier-Einladungen)

---

## 1. Template Engine (Super-Admin)

### Aktueller Zustand
- ❌ Supplier-Config wird im Template gespeichert (`supplierConfig` auf Block-Ebene)
- ❌ Template definiert, welche Blöcke lieferkettenfähig sind
- ❌ Operative Logik (Supplier-Einladungen) wird im Template konfiguriert

### Zielzustand
- ✅ Templates definieren **nur** Struktur (Blöcke, Felder, Typen, Validierungen)
- ✅ Erster Block (`order === 0`) ist systemisch als "Produktidentität" behandelt
- ✅ Keine Supplier-Config im Template
- ✅ Template Engine bleibt abstrakt und nicht-operativ

### Datenmodell-Änderungen

**Prisma Schema (`TemplateBlock`):**
```prisma
model TemplateBlock {
  id            String          @id @default(cuid())
  templateId    String
  name          String
  order         Int             @default(0)
  // ENTFERNT: supplierConfig Json?  // Nicht mehr im Template
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  template      Template        @relation(fields: [templateId], references: [id], onDelete: Cascade)
  fields        TemplateField[]
  
  @@index([templateId])
  @@index([templateId, order])
  @@map("template_blocks")
}
```

**Logik:**
- `order === 0` = Produktidentität (systemisch, nicht konfigurierbar)
- Alle anderen Blöcke = Potentiell lieferkettenfähig (aber nicht im Template konfiguriert)

### UI-Änderungen (Template Editor)

**ENTFERNT:**
- ❌ Supplier-Config Icon im Block-Header
- ❌ Popover für Supplier-Konfiguration
- ❌ Alle Supplier-bezogenen UI-Elemente

**BLEIBT:**
- ✅ Block-Name, Felder, Validierungen
- ✅ Block-Reihenfolge
- ✅ Feld-Typen und Konfigurationen

---

## 2. DPP Editor (Economic Operator)

### Aktueller Zustand
- ❌ Supplier-Einladung basiert auf Template-Config
- ❌ Nur Blöcke mit `supplierConfig.enabled === true` können Lieferanten einladen
- ❌ Template bestimmt, welche Blöcke lieferkettenfähig sind

### Zielzustand
- ✅ Economic Operator entscheidet pro DPP, welche Blöcke (außer Basisdaten) Lieferanten einladen
- ✅ Supplier-Config wird pro DPP/Block gespeichert (nicht im Template)
- ✅ Basisdaten-Block (`order === 0`) hat keine Supplier-Option
- ✅ Alle anderen Blöcke bieten Supplier-Option im DPP Editor

### Datenmodell-Änderungen

**Neues Modell: `DppBlockSupplierConfig`**
```prisma
model DppBlockSupplierConfig {
  id            String   @id @default(cuid())
  dppId         String
  dpp           Dpp      @relation(fields: [dppId], references: [id], onDelete: Cascade)
  blockId       String   // TemplateBlock ID
  enabled       Boolean  @default(false)
  mode          String?  // "input" | "declaration"
  allowedRoles  String[] // Array von Rollen (optional)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@unique([dppId, blockId])
  @@index([dppId])
  @@map("dpp_block_supplier_configs")
}
```

**Alternative (einfacher):**
- Erweitere `DppContent` (JSONB) um `supplierConfig` pro Block
- Oder: Nutze bestehende `ContributorToken` mit `blockIds` und erweitere um `DppBlockSupplierConfig`

### UI-Änderungen (DPP Editor)

**Basisdaten-Block (`order === 0`):**
- ❌ Kein Supplier-Config Icon
- ❌ Keine Supplier-Einladung möglich
- ✅ Nur Economic Operator kann Daten eingeben

**Alle anderen Blöcke:**
- ✅ Supplier-Config Icon im Block-Header (wie aktuell im Template Editor)
- ✅ Popover mit:
  - Toggle: "Datenquelle: Lieferkette"
  - Modus: "Direkte Datenerfassung" / "Bestätigung vorhandener Daten"
  - Rollen-Filter (optional)
- ✅ "Lieferant einladen" Button (wenn aktiviert)
- ✅ Status-Anzeige (Pending / Eingegangen / Bestätigt)

**Logik:**
```typescript
// Im DPP Editor
const isIdentityBlock = block.order === 0
const canInviteSupplier = !isIdentityBlock && blockSupplierConfig?.enabled === true

// Supplier-Config wird pro DPP gespeichert, nicht im Template
```

---

## 3. API-Änderungen

### Template API (`/api/super-admin/templates`)

**ENTFERNT:**
- ❌ `supplierConfig` aus TemplateBlock-Schema
- ❌ Supplier-Config Validierung beim Template-Speichern

**BLEIBT:**
- ✅ Block-Struktur, Felder, Validierungen

### DPP API (`/api/app/dpp/[dppId]`)

**NEU:**
- ✅ `GET /api/app/dpp/[dppId]/supplier-config` - Lädt Supplier-Config pro Block
- ✅ `PUT /api/app/dpp/[dppId]/supplier-config` - Speichert Supplier-Config pro Block

**ERWEITERT:**
- ✅ `POST /api/app/dpp/[dppId]/data-requests` - Nutzt DPP-spezifische Supplier-Config statt Template-Config

### Contributor Token API

**BLEIBT:**
- ✅ `/api/contribute/[token]` - Lädt DPP-Daten basierend auf `blockIds`
- ✅ `/api/contribute/[token]/submit` - Speichert Supplier-Daten
- ✅ Nutzt weiterhin `blockIds` aus `ContributorToken`

---

## 4. Migration-Strategie

### Schritt 1: Datenmodell erweitern
```sql
-- Neue Tabelle für DPP-spezifische Supplier-Config
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

-- Migration: Template supplierConfig → DPP supplierConfig (optional)
-- Nur wenn bestehende DPPs bereits Supplier-Config aus Template nutzen
```

### Schritt 2: Template Editor UI entfernen
- Supplier-Config Icon und Popover entfernen
- `supplierConfig` aus Template-Submit-Logik entfernen

### Schritt 3: DPP Editor UI hinzufügen
- Supplier-Config Icon für alle Blöcke außer `order === 0`
- Popover mit gleicher UX wie aktuell im Template Editor
- API-Integration für DPP-spezifische Config

### Schritt 4: API-Anpassungen
- Template API: `supplierConfig` entfernen
- DPP API: Neue Endpoints für Supplier-Config
- Contributor Token: Weiterhin `blockIds`-basiert

---

## 5. Begründungen

### ESPR-Konformität

**Produktidentität:**
- ✅ Economic Operator ist allein verantwortlich für Identitätsdaten (EAN, SKU, Name)
- ✅ Keine Möglichkeit, Identitätsdaten durch Lieferanten ändern zu lassen
- ✅ Systemische Absicherung (nicht nur UI-Beschränkung)

**Lieferketten-Daten:**
- ✅ Economic Operator entscheidet pro DPP, welche Daten durch Lieferanten bereitgestellt werden
- ✅ Flexibilität: Verschiedene DPPs können unterschiedliche Lieferanten einbinden
- ✅ Template bleibt abstrakt (keine operative Logik)

### UX-Verbesserungen

**Template Editor:**
- ✅ Einfacher: Weniger Konfiguration, weniger Komplexität
- ✅ Klarer Fokus: Nur Strukturdefinition
- ✅ Keine Verwirrung: "Warum kann ich hier Supplier konfigurieren?"

**DPP Editor:**
- ✅ Kontextbezogen: Supplier-Config dort, wo sie genutzt wird
- ✅ Flexibel: Pro DPP unterschiedliche Lieferanten-Strategien
- ✅ Klar: Basisdaten = Economic Operator, Rest = Optional Lieferanten

### Architektur-Klarheit

**Trennung der Verantwortlichkeiten:**
- ✅ Template = Struktur (Was?)
- ✅ DPP = Inhalt + operative Entscheidungen (Wie? Wer?)
- ✅ Keine Vermischung von Definition und Ausführung

**Wartbarkeit:**
- ✅ Template-Änderungen beeinflussen keine Supplier-Configs
- ✅ DPP-spezifische Anpassungen ohne Template-Änderung
- ✅ Klare Datenflüsse

---

## 6. Implementierungs-Checkliste

### Phase 1: Datenmodell
- [ ] Prisma Schema: `supplierConfig` aus `TemplateBlock` entfernen
- [ ] Prisma Schema: `DppBlockSupplierConfig` Modell hinzufügen
- [ ] Migration erstellen und testen
- [ ] Prisma Client regenerieren

### Phase 2: Template Editor
- [ ] Supplier-Config UI komplett entfernen
- [ ] API: `supplierConfig` aus Template-Submit entfernen
- [ ] Validierung: Keine `supplierConfig` mehr akzeptieren

### Phase 3: DPP Editor
- [ ] Supplier-Config UI für Blöcke `order > 0` hinzufügen
- [ ] API: Neue Endpoints für DPP Supplier-Config
- [ ] Logik: `order === 0` = Keine Supplier-Option
- [ ] Integration: Supplier-Einladung nutzt DPP-Config statt Template-Config

### Phase 4: Testing & Migration
- [ ] Bestehende DPPs: Supplier-Config aus Template migrieren (falls nötig)
- [ ] Neue DPPs: Supplier-Config nur im DPP Editor
- [ ] Contributor Token Flow testen
- [ ] Regulatorische Compliance prüfen

---

## 7. Offene Fragen / Entscheidungen

1. **Migration bestehender Daten:**
   - Sollen bestehende `supplierConfig` aus Templates in DPP-Configs migriert werden?
   - Oder: Clean Slate (nur neue DPPs haben Supplier-Config)?

2. **Datenmodell:**
   - Separate Tabelle `DppBlockSupplierConfig`?
   - Oder: JSONB in `DppContent`?
   - Oder: Erweitere `ContributorToken` um `supplierConfig`?

3. **UI-Konsistenz:**
   - Gleiche Popover-UX wie aktuell im Template Editor?
   - Oder: Vereinfachte Version für DPP Editor?

**Empfehlung:**
- Separate Tabelle für bessere Abfragbarkeit und Validierung
- Migration nur wenn nötig (Clean Slate bevorzugt)
- Gleiche UX für Konsistenz


