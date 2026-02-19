# Vercel Connection Pool Fix - MaxClientsInSessionMode

## Problem

Fehler in Vercel Logs:
```
FATAL: MaxClientsInSessionMode: max clients reached - in Session mode max clients are limited to pool_size
```

Dieser Fehler tritt auf, wenn:
- Viele parallele Serverless Function Requests gleichzeitig laufen (jede Instanz öffnet mindestens 1 DB-Verbindung)
- Die **DATABASE_URL Session-Modus** (Port 5432) verwendet – Session-Modus ist stark limitiert
- Oder eine direkte Verbindung statt des Poolers verwendet wird

**Ursache:** Supabase hat zwei Pooler-Modi:
- **Session-Modus (Port 5432)**: Jede Client-Verbindung = 1 Server-Verbindung → schnell Limit erreicht
- **Transaction-Modus (Port 6543)**: Viele Client-Verbindungen teilen sich wenige Server-Verbindungen → ideal für Serverless

## Lösung: DATABASE_URL muss Transaction-Modus (Port 6543) verwenden

Die `DATABASE_URL` in Vercel **muss** den **Transaction-Modus-Pooler** (Port **6543**) verwenden.

### Supabase – Vercel Environment Variables

#### ✅ RICHTIG (Transaction-Modus, Port 6543):
```
postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:6543/postgres?pgbouncer=true&connection_limit=1
```
Oder bei Shared Pooler (ähnlicher Host):
```
postgresql://postgres.[project-ref]:[password]@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

#### ❌ FALSCH (Session-Modus, Port 5432 – löst MaxClientsInSessionMode aus):
```
postgresql://...@pooler.supabase.com:5432/...
postgresql://...@db.xxx.supabase.co:5432/...
```

#### ❌ FALSCH (direkte Verbindung ohne Pooler):
```
postgresql://...@db.xxx.supabase.co:5432/postgres
```

### Neon

Im Neon Dashboard unter **Connection details** die **„Pooled connection“** (nicht „Direct connection“) kopieren und in Vercel als `DATABASE_URL` eintragen.

- **Direct connection** (❌ für Vercel): Host z.B. `ep-xxx-xxx.region.aws.neon.tech` → begrenzte Verbindungen, führt zu MaxClientsInSessionMode.
- **Pooled connection** (✅): Nutzt den Neon-Pooler (z.B. Host mit `-pooler` oder separater Pooler-Endpoint), viele App-Verbindungen teilen sich wenige echte DB-Verbindungen.

Dokumentation: https://neon.tech/docs/connect/connection-pooling

### 2. Vercel Environment Variables konfigurieren

1. Gehe zu **Vercel Dashboard** → Projekt → **Settings** → **Environment Variables**
2. Prüfe `DATABASE_URL`:
   - Enthält die URL **`:6543`** (Transaction-Modus)? ✅ Gut
   - Enthält die URL **`:5432`**? ❌ Führt zu MaxClientsInSessionMode – Port muss 6543 sein
3. Falls Port 5432:
   - Kopiere die aktuelle `DATABASE_URL`
   - **Ändere den Port von 5432 auf 6543**
   - Füge `?pgbouncer=true&connection_limit=1` hinzu (oder ergänze bei bestehendem `?` mit `&`)
   - Speichere die neue `DATABASE_URL`
4. `DIRECT_URL` (für Prisma Migrations) soll Port 5432 behalten – das ist korrekt.
5. **WICHTIG**: Nach Änderung **neues Deployment** triggern (Redeploy).

### 3. Supabase Connection String kopieren

Im Supabase Dashboard: **Settings** → **Database** → **Connection string** → **URI**  
Wähle **"Transaction"** (nicht "Session"!) und kopiere die URL. Port muss **6543** sein.

```
# Transaction-Modus (korrekt für Vercel)
postgresql://postgres.[ref]:[password]@db.[ref].supabase.co:6543/postgres?pgbouncer=true&connection_limit=1
```

## Prüfung

Nach dem Deployment:

1. Prüfe Vercel Logs für "MaxClientsInSessionMode" Fehler
2. Fehler sollten nicht mehr auftreten
3. API-Routen sollten erfolgreich antworten (200 statt 500)

## Zusätzliche Optimierungen

### Prisma Client Konfiguration

Der Prisma Client ist bereits als Singleton konfiguriert (`src/lib/prisma.ts`), was bedeutet:
- Eine Prisma Client Instanz wird zwischen Serverless Function Invocations geteilt
- Verbindungen werden wiederverwendet
- Das reduziert den Connection Pool Verbrauch

### Serverless Function Best Practices

- Verwende `connection_limit=1` in DATABASE_URL für Serverless
- Prisma Client wird bereits als Singleton verwendet
- Verbindungen werden automatisch verwaltet

## Troubleshooting

Falls das Problem weiterhin besteht:

1. **Prüfe Supabase Dashboard**:
   - Connection Pool Status
   - Aktuelle Verbindungen
   - Pool Limit

2. **Prüfe Vercel Logs**:
   - Wann tritt der Fehler auf?
   - Wie viele parallele Requests?
   - Welche API-Routen sind betroffen?

3. **Temporäres Connection Limit**:
   - Füge `&connection_limit=1` zur DATABASE_URL hinzu
   - Teste ob das Problem behoben ist

4. **Supabase Plan prüfen**:
   - Free Plan: Sehr limitiert (kleiner Pool)
   - Pro Plan: Mehr Connections verfügbar
   - Upgrade könnte notwendig sein für hohen Traffic

