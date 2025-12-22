# Migration Instructions

## Schema-Änderungen anwenden

Die folgenden Schema-Änderungen wurden vorgenommen:

### Organization Model
- `licenseTier String @default("free")` - License Tier: free | basic | premium | pro
- `status String @default("active")` - Status: active | suspended | archived

### Template Model
- `category String?` - Kategorie: TEXTILE | FURNITURE | OTHER
- `description String?` - Beschreibung des Templates
- `createdBy String?` - Super Admin ID (optional)

## Migration ausführen

**Wichtig:** Führen Sie die Migration manuell aus, da `prisma migrate dev` interaktiv ist.

### Lokal/Dev:
```bash
npx prisma migrate dev --name add_super_admin_extensions
```

Dies wird:
1. Eine neue Migration-Datei erstellen
2. Die Migration auf die lokale Datenbank anwenden
3. Den Prisma Client regenerieren

### Production:
```bash
npx prisma migrate deploy
```

## Nach der Migration

1. Prisma Client wird automatisch regeneriert
2. APIs können getestet werden
3. UI kann dann implementiert werden

## Rollback (falls nötig)

Falls ein Rollback nötig ist:
```bash
npx prisma migrate resolve --rolled-back <migration_name>
```

## Schema-Status prüfen

Schema-Status prüfen:
```bash
npx prisma migrate status
```

