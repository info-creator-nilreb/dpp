# Editorial DPP Ansicht - Testing Guide

## Route

Die neue Editorial-Ansicht ist unter folgender Route erreichbar:

```
/public/dpp/[dppId]/editorial
```

## So testen Sie die Ansicht

### Option 1: Mit einer DPP-ID

1. **Finden Sie eine DPP-ID:**
   - Gehen Sie zu `/app/dpps`
   - Öffnen Sie einen veröffentlichten DPP
   - Kopieren Sie die DPP-ID aus der URL oder der Datenbank

2. **Öffnen Sie die Editorial-Ansicht:**
   ```
   http://localhost:3000/public/dpp/[Ihre-DPP-ID]/editorial
   ```

### Option 2: DPP-Liste prüfen (falls vorhanden)

Falls es einen Endpoint gibt, der alle veröffentlichten DPPs listet, können Sie dort eine ID kopieren.

### Option 3: Datenbank direkt prüfen

Falls Sie Zugriff auf die Datenbank haben:

```sql
SELECT id, name, status 
FROM dpps 
WHERE status = 'PUBLISHED' 
LIMIT 5;
```

Dann verwenden Sie eine der IDs in der Route.

## Beispiel-URL

```
http://localhost:3000/public/dpp/cmjgb404e000211fy61z5g2tb/editorial
```

## Voraussetzungen

Die Editorial-Ansicht zeigt nur **veröffentlichte DPPs** an (`status = 'PUBLISHED'`).

Falls der DPP nicht veröffentlicht ist, erhalten Sie einen 404-Fehler.

## Alternative: Test-Route erstellen

Falls gewünscht, kann ich eine Test-Route erstellen, die automatisch den ersten verfügbaren DPP lädt, um die Ansicht schnell testen zu können.

