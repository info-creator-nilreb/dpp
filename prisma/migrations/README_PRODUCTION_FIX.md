# Fehlende Spalten in Produktion beheben

Wenn nach dem Deploy Fehler wie „column X does not exist“ auftreten, wurden Migrationen in Produktion noch nicht ausgeführt.

## Option 1: Migrationen ausführen (bevorzugt)

Auf dem Produktions-Server im Projektverzeichnis:

```bash
npx prisma migrate deploy
```

Damit werden alle ausstehenden Migrationen (inkl. `notifications.readAt`, `dpp_media.sortOrder`) in der richtigen Reihenfolge angewendet.

## Option 2: SQL manuell ausführen

Falls `migrate deploy` nicht genutzt werden kann (z. B. nur DB-Zugriff), die fehlenden Spalten per SQL anlegen.

**PostgreSQL – in der Produktions-Datenbank ausführen:**

```sql
-- 1) Notifications (falls 20260130000000_notification_deep_link_fields nicht lief)
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP(3);
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "message" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "targetRoute" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "targetEntityId" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "targetTab" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "organisationId" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "actorRole" TEXT;

-- 2) DPP Media sortOrder (falls 20260206000000_add_media_sort_order nicht lief)
ALTER TABLE "dpp_media" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;
```

`IF NOT EXISTS` verhindert Fehler, wenn die Spalte schon existiert.

## Deploy absichern

Im Deploy-Prozess nach dem Ausrollen des Codes sicherstellen, dass Migrationen laufen, z. B.:

```bash
npx prisma migrate deploy
```

oder im CI/CD als Schritt vor/beim Start der App.
