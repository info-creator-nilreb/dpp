# Phase 1 Migration - Troubleshooting

## Problem: "FATAL: Tenant or user not found"

Dieser Fehler tritt auf, wenn die Datenbankverbindung nicht funktioniert.

### Mögliche Ursachen:

1. **DATABASE_URL ist nicht korrekt gesetzt**
   - Prüfe `.env` Datei
   - Stelle sicher, dass die URL das richtige Format hat: `postgresql://user:password@host:port/database?sslmode=require`

2. **Datenbank ist nicht erreichbar**
   - Prüfe Netzwerkverbindung
   - Prüfe ob die Datenbank läuft

3. **Credentials sind falsch**
   - Prüfe Benutzername und Passwort
   - Stelle sicher, dass der User existiert

### Lösung 1: Migration manuell anwenden

Falls `prisma migrate dev` nicht funktioniert, kannst du die Migration manuell anwenden:

```bash
# 1. Prüfe DATABASE_URL
echo $DATABASE_URL

# 2. Wende Migration direkt an (wenn psql verfügbar ist)
psql $DATABASE_URL -f prisma/migrations/20250101000000_phase1_organization_user_management/migration.sql

# 3. Oder markiere Migration als angewendet (wenn bereits manuell angewendet)
npx prisma migrate resolve --applied 20250101000000_phase1_organization_user_management
```

### Lösung 2: Migration mit Prisma Studio prüfen

```bash
# 1. Öffne Prisma Studio
npx prisma studio

# 2. Prüfe ob Tabellen existieren
# 3. Prüfe ob Spalten hinzugefügt wurden
```

### Lösung 3: Migration neu erstellen

Falls die Migration-Datei Probleme hat:

```bash
# 1. Lösche die Migration-Datei
rm -rf prisma/migrations/20250101000000_phase1_organization_user_management

# 2. Erstelle Migration neu
npx prisma migrate dev --name phase1_organization_user_management --create-only

# 3. Prüfe die generierte SQL-Datei
cat prisma/migrations/*/migration.sql

# 4. Wende Migration an
npx prisma migrate dev
```

### Lösung 4: Schema validieren

```bash
# Prüfe ob Schema korrekt ist
npx prisma validate

# Generiere Prisma Client neu
npx prisma generate
```

## Migration-Datei prüfen

Die Migration-Datei sollte:
- ✅ Alle neuen Spalten hinzufügen
- ✅ Alle neuen Tabellen erstellen
- ✅ Foreign Keys hinzufügen
- ✅ Indizes erstellen
- ✅ `IF NOT EXISTS` verwenden (idempotent)

## Nächste Schritte

1. **Prüfe DATABASE_URL** in `.env`
2. **Teste Datenbankverbindung** (z.B. mit Prisma Studio)
3. **Wende Migration an** (manuell oder mit `prisma migrate dev`)
4. **Prüfe ob Migration erfolgreich war** (Tabellen/Spalten existieren)

## Wichtig

- ⚠️ **Backup erstellen** vor Migration in Production
- ⚠️ **Migration testen** in Development zuerst
- ⚠️ **Prüfe Logs** für weitere Fehlerdetails

