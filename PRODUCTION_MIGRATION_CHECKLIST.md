# Produktions-Migrations-Checklist

## Migration: `20251225010453_add_trial_system`

### Was wird geändert?

#### 1. Subscriptions Tabelle
- ✅ **NEUE Spalten** (nullable, sicher):
  - `trialExpiresAt` TIMESTAMP(3)
  - `trialStartedAt` TIMESTAMP(3)
- ⚠️ **DEFAULT-Werte geändert**:
  - `plan` DEFAULT 'basic' (war vermutlich schon so)
  - `status` DEFAULT 'trial_active' (NEU - kann bestehende Subscriptions beeinflussen!)

#### 2. Neue Tabellen (sicher)
- ✅ `feature_registry` - Feature Registry
- ✅ `block_types` - Block-Typen
- ✅ `dpp_content` - DPP Content (CMS)

#### 3. Foreign Keys
- ✅ Foreign Keys verwenden `IF NOT EXISTS` - sicher

---

## ⚠️ WICHTIG: Produktions-Checkliste

### Vor der Migration

1. **Backup erstellen**
   ```bash
   # PostgreSQL Backup
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Bestehende Subscriptions prüfen**
   ```sql
   -- Prüfe aktuelle Subscription-Status
   SELECT status, COUNT(*) 
   FROM subscriptions 
   GROUP BY status;
   
   -- Prüfe ob es Subscriptions ohne Status gibt
   SELECT COUNT(*) 
   FROM subscriptions 
   WHERE status IS NULL;
   ```

3. **Migration testen (Staging/Dev)**
   ```bash
   # In Staging/Dev Umgebung testen
   npx prisma migrate deploy
   ```

### Migration ausführen

**Option 1: Prisma Migrate (empfohlen)**
```bash
# In Produktion
npx prisma migrate deploy
```

**Option 2: Manuell (wenn Prisma nicht verfügbar)**
```bash
# SQL-Datei direkt ausführen
psql $DATABASE_URL < prisma/migrations/20251225010453_add_trial_system/migration.sql
```

### Nach der Migration

1. **Migration-Status prüfen**
   ```bash
   npx prisma migrate status
   ```

2. **Tabellen prüfen**
   ```sql
   -- Prüfe ob neue Tabellen existieren
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('feature_registry', 'block_types', 'dpp_content');
   
   -- Prüfe neue Spalten in subscriptions
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'subscriptions'
   AND column_name IN ('trialExpiresAt', 'trialStartedAt');
   ```

3. **Bestehende Subscriptions prüfen (NICHT ändern)**
   
   ⚠️ **WICHTIG**: Nur Schema-Änderungen, KEINE Datenänderungen!
   
   Der DEFAULT `status = 'trial_active'` betrifft nur NEUE Subscriptions.
   Bestehende Subscriptions bleiben unverändert.
   
   ```sql
   -- Nur prüfen, nicht ändern
   SELECT status, COUNT(*) 
   FROM subscriptions 
   GROUP BY status;
   ```

4. **Feature Registry Seed-Daten laden** (optional, nur wenn gewünscht)
   ```bash
   # Falls Seed-Script vorhanden und gewünscht
   # NUR ausführen, wenn Feature Registry initial befüllt werden soll
   node scripts/seed-feature-registry.mjs
   ```
   
   ⚠️ **Hinweis**: Seed-Daten sind optional. Die Tabellen können auch leer bleiben.

---

## ⚠️ Potenzielle Probleme

### Problem 1: DEFAULT status = 'trial_active'
- **Risiko**: Neue Subscriptions werden automatisch als Trial erstellt
- **Lösung**: 
  - Entweder DEFAULT auf 'active' ändern (wenn keine Trials gewünscht)
  - Oder Logik in `auth.ts` anpassen, die Subscriptions erstellt

### Problem 2: Bestehende Subscriptions ohne Status
- **Risiko**: NULL-Werte könnten Probleme verursachen
- **Lösung**: Siehe SQL-Update oben

### Problem 3: Foreign Key Constraints
- **Risiko**: Falls `organizationId` in subscriptions nicht existiert
- **Lösung**: Migration verwendet `IF NOT EXISTS`, sollte sicher sein

---

## Empfohlener Ablauf für Produktion

1. ✅ **Backup erstellen**
2. ✅ **Migration in Staging testen**
3. ✅ **Wartungsfenster planen** (falls nötig)
4. ✅ **Migration ausführen**: `npx prisma migrate deploy`
   - **NUR Schema-Änderungen** (Tabellen/Spalten)
   - **KEINE Datenänderungen**
5. ✅ **Bestehende Subscriptions prüfen** (nur lesen, nicht ändern)
6. ✅ **Feature Registry Seed-Daten laden** (optional, nur wenn gewünscht)
7. ✅ **Anwendung testen**
8. ✅ **Monitoring aktivieren**

---

## Rollback-Plan (falls nötig)

```sql
-- Tabellen löschen (nur wenn nötig)
DROP TABLE IF EXISTS dpp_content;
DROP TABLE IF EXISTS block_types;
DROP TABLE IF EXISTS feature_registry;

-- Spalten entfernen (nur wenn nötig)
ALTER TABLE subscriptions 
  DROP COLUMN IF EXISTS "trialExpiresAt",
  DROP COLUMN IF EXISTS "trialStartedAt";

-- DEFAULT zurücksetzen (nur wenn nötig)
ALTER TABLE subscriptions 
  ALTER COLUMN "status" DROP DEFAULT;
```

---

## Migration ist idempotent

Die Migration verwendet `IF NOT EXISTS` und `IF EXISTS` Checks, daher:
- ✅ Kann mehrfach ausgeführt werden
- ✅ Keine Fehler bei bereits vorhandenen Objekten
- ✅ Sicher für Produktion

