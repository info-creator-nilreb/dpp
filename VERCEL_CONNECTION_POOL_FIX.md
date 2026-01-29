# Vercel Connection Pool Fix - MaxClientsInSessionMode

## Problem

Fehler in Vercel Logs:
```
FATAL: MaxClientsInSessionMode: max clients reached - in Session mode max clients are limited to pool_size
```

Dieser Fehler tritt auf, wenn:
- Viele parallele Serverless Function Requests gleichzeitig laufen
- Die DATABASE_URL eine direkte Verbindung verwendet (nicht über Connection Pooler)
- Supabase Connection Pool Limit wird überschritten

## Lösung

### 1. DATABASE_URL in Vercel prüfen und anpassen

Die `DATABASE_URL` in Vercel Environment Variables **MUSS** den Supabase Connection Pooler verwenden:

#### ✅ RICHTIG (mit Connection Pooler):
```
postgresql://postgres.[project-ref]:[password]@aws-1-eu-north-1.pooler.supabase.com:5432/postgres?sslmode=require
```

#### ❌ FALSCH (direkte Verbindung):
```
postgresql://postgres.[project-ref]:[password]@aws-1-eu-north-1.supabase.co:5432/postgres?sslmode=require
```

### 2. Vercel Environment Variables konfigurieren

1. Gehe zu Vercel Dashboard → Projekt → Settings → Environment Variables
2. Prüfe `DATABASE_URL`:
   - Enthält die URL `.pooler.supabase.com`? ✅ Gut
   - Enthält die URL `.supabase.co`? ❌ Muss geändert werden
3. Falls falsch:
   - Kopiere die aktuelle `DATABASE_URL`
   - Ersetze `.supabase.co` durch `.pooler.supabase.com`
   - Ersetze den Port durch `5432` (wenn nötig)
   - Füge `?sslmode=require` hinzu (falls nicht vorhanden)
   - Speichere die neue `DATABASE_URL`
4. **WICHTIG**: Nach Änderung neues Deployment triggern (oder warte auf automatisches Deployment)

### 3. Connection Limit Parameter (Optional)

Falls das Problem weiterhin besteht, können Sie ein Connection Limit hinzufügen:

```
postgresql://...@aws-1-eu-north-1.pooler.supabase.com:5432/postgres?sslmode=require&connection_limit=1
```

**Hinweis**: `connection_limit=1` ist für Serverless Functions empfohlen, da jede Function-Instanz nur eine Verbindung benötigt.

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

