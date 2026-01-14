# Implementierungs-Status: Supplier-Config von Template zu DPP

## ✅ Abgeschlossen

### 1. Prisma Schema
- ✅ `supplierConfig` aus `TemplateBlock` entfernt
- ✅ `DppBlockSupplierConfig` Modell hinzugefügt
- ✅ Relation zu `Dpp` hinzugefügt

### 2. Migration
- ✅ Migration SQL erstellt: `20260110000000_move_supplier_config_to_dpp/migration.sql`
- ✅ Neue Tabelle `dpp_block_supplier_configs` wird erstellt
- ✅ Index und Foreign Keys definiert

### 3. Template Editor (teilweise)
- ✅ `openSupplierConfigBlockId` State entfernt
- ✅ `useEffect` für Click-Outside entfernt
- ✅ `SupplierConfig` Interface entfernt
- ✅ `supplierConfig` aus `TemplateBlock` Interface entfernt
- ✅ `updateSupplierConfig` Funktion entfernt
- ✅ `supplierConfig` aus Template-Submit entfernt

## 🔄 In Arbeit

### 4. Template Editor UI entfernen
**Noch zu tun:**
- [ ] Supplier-Config Icon und Popover aus Block-Header entfernen (ca. Zeile 1254-1450)
- [ ] Gleiche Änderungen in `NewTemplateContent.tsx`

### 5. DPP Editor UI hinzufügen
**Noch zu tun:**
- [ ] `SupplierConfigButton` Komponente erstellen
- [ ] Supplier-Config State pro Block im DPP Editor
- [ ] Supplier-Config UI in `TemplateBlocksSection` für Blöcke `order > 0`
- [ ] Validierung: `order === 0` hat keine Supplier-Option

### 6. API-Endpoints
**Noch zu tun:**
- [ ] `GET /api/app/dpp/[dppId]/supplier-config` erstellen
- [ ] `PUT /api/app/dpp/[dppId]/supplier-config` erstellen
- [ ] Validierung: Block `order === 0` kann keine Supplier-Config haben

### 7. Data Requests API
**Noch zu tun:**
- [ ] `/api/app/dpp/[dppId]/data-requests` nutzt DPP-Config statt Template-Config
- [ ] Prüfung: Nur Blöcke mit `enabled: true` in DPP-Config können Lieferanten einladen

## 📝 Nächste Schritte

1. **Template Editor UI komplett entfernen** (manuell, da Tools langsam)
2. **DPP Editor UI hinzufügen** (neue Komponente + Integration)
3. **API-Endpoints implementieren**
4. **Testing**

## ⚠️ Wichtige Hinweise

- **Breaking Change:** Template API akzeptiert kein `supplierConfig` mehr
- **Migration:** Bestehende `supplierConfig` in Templates werden ignoriert
- **Clean Slate:** Neue DPPs haben Supplier-Config nur im DPP Editor


