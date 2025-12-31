# Environment Variables Troubleshooting

## Problem: DATABASE_URL nicht gefunden

Wenn der Fehler `Environment variable not found: DATABASE_URL` auftritt:

### Lösung 1: Server neu starten

Next.js lädt `.env` Dateien nur beim Start. Nach Änderungen an `.env`:

```bash
# Stoppe den Server (Ctrl+C)
# Starte neu
npm run dev
```

### Lösung 2: Prüfe .env Datei

Stelle sicher, dass die `.env` Datei im Root-Verzeichnis existiert und korrekt formatiert ist:

```env
DATABASE_URL="postgresql://postgres:password@host:port/database"
```

**Wichtig:**
- Keine Leerzeichen um das `=`
- Anführungszeichen um den Wert (wenn Leerzeichen oder Sonderzeichen enthalten)
- Keine Kommentare in derselben Zeile

### Lösung 3: Prüfe .env Datei-Location

Die `.env` Datei muss im Root-Verzeichnis des Projekts sein (gleiche Ebene wie `package.json`):

```
DPP/
├── .env          ← Hier!
├── package.json
├── next.config.js
└── ...
```

### Lösung 4: Prüfe .gitignore

Stelle sicher, dass `.env` in `.gitignore` ist (wird nicht committed):

```gitignore
.env
.env*.local
```

### Lösung 5: Manuelle Prüfung

Prüfe ob die Variable gesetzt ist:

```bash
# In der Shell
cd /Users/alexanderberlin/Documents/DPP
cat .env | grep DATABASE_URL

# Sollte zeigen:
# DATABASE_URL="postgresql://..."
```

### Lösung 6: Next.js Cache löschen

Manchmal hilft es, den Next.js Cache zu löschen:

```bash
rm -rf .next
npm run dev
```

### Lösung 7: Prisma Client neu generieren

```bash
npx prisma generate
npm run dev
```

## Häufige Fehler

### Fehler 1: Falsche Anführungszeichen
```env
# ❌ Falsch
DATABASE_URL='postgresql://...'

# ✅ Richtig
DATABASE_URL="postgresql://..."
```

### Fehler 2: Leerzeichen um =
```env
# ❌ Falsch
DATABASE_URL = "postgresql://..."

# ✅ Richtig
DATABASE_URL="postgresql://..."
```

### Fehler 3: Kommentar in derselben Zeile
```env
# ❌ Falsch
DATABASE_URL="postgresql://..." # My database

# ✅ Richtig
# My database
DATABASE_URL="postgresql://..."
```

## Debugging

Falls das Problem weiterhin besteht, füge temporär Debug-Logging hinzu:

```typescript
// In src/lib/prisma.ts (temporär)
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "SET" : "NOT SET")
console.log("All env vars:", Object.keys(process.env).filter(k => k.includes("DATABASE")))
```

## Production (Vercel)

In Production (Vercel) müssen Umgebungsvariablen in den Vercel Settings gesetzt werden:

1. Gehe zu Vercel Dashboard
2. Projekt → Settings → Environment Variables
3. Füge `DATABASE_URL` hinzu

