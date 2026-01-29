# Fix für Bildupload im Mehrwert-Bereich

## Problem
Der Bildupload schlägt fehl mit dem Fehler:
```
Unknown argument `role`. Available options are marked with ?.
```

## Ursache
Die Migration `20260102000000_add_versioned_media` wurde noch nicht ausgeführt, oder der Prisma Client wurde nicht neu generiert.

## ⚠️ WICHTIG: Migration ist sicher!

**Die Migration überschreibt KEINE Daten!**

Die Migration verwendet `ADD COLUMN IF NOT EXISTS`, was bedeutet:
- ✅ **Nur neue Spalten werden hinzugefügt** (wenn sie noch nicht existieren)
- ✅ **Bestehende Daten bleiben unverändert**
- ✅ **Bestehende Spalten werden nicht geändert**
- ✅ **Migration ist idempotent** (kann mehrfach ausgeführt werden)

Die Migration fügt nur folgende **neue, nullable Spalten** hinzu:
- `role` (TEXT, nullable) - für neue Uploads
- `blockId` (TEXT, nullable) - für neue Uploads
- `fieldKey` (TEXT, nullable) - für neue Uploads

**Alle bestehenden Datensätze bleiben unverändert!**

## Lösung

### Schritt 1: Migration ausführen
```bash
npx prisma migrate deploy
```

Oder für Development:
```bash
npx prisma migrate dev
```

### Schritt 2: Prisma Client neu generieren
```bash
npx prisma generate
```

### Schritt 3: Server neu starten
Nach dem Generieren des Prisma Clients muss der Next.js Server neu gestartet werden:
```bash
# Stoppe den Server (Ctrl+C) und starte neu:
npm run dev
```

## Verifikation
Nach den Schritten sollte der Bildupload wieder funktionieren. Die Migration fügt folgende Felder zur `dpp_media` Tabelle hinzu:
- `role` (TEXT, nullable) - Semantische Rolle des Mediums
- `blockId` (TEXT, nullable) - ID des Blocks, dem das Medium zugeordnet ist
- `fieldKey` (TEXT, nullable) - Key des File-Felds im Block

## Falls das Problem weiterhin besteht
1. Prüfe, ob die Migration erfolgreich ausgeführt wurde:
   ```bash
   npx prisma migrate status
   ```

2. Prüfe, ob die Felder in der Datenbank existieren:
   ```sql
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'dpp_media'
   ORDER BY ordinal_position;
   ```

3. Falls die Felder fehlen, führe die Migration manuell aus oder erstelle eine neue Migration.
