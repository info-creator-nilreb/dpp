# Vercel Blob Storage Setup

## Problem

In Vercel (Serverless-Umgebung) ist das Dateisystem schreibgeschützt. Dateien können nicht in `public/uploads` gespeichert werden.

## Lösung

Die Anwendung verwendet jetzt **Vercel Blob Storage** für Media-Uploads in Production.

## Setup in Vercel

1. **Blob Store erstellen:**
   - Gehe zu deinem Vercel-Projekt
   - Navigiere zu **Storage** → **Create Database/Store**
   - Wähle **Blob** aus
   - Erstelle einen neuen Blob Store (z.B. `dpp-media`)

2. **Umgebungsvariable setzen:**
   - Gehe zu **Settings** → **Environment Variables**
   - Füge folgende Variable hinzu:
     - **Name:** `BLOB_READ_WRITE_TOKEN`
     - **Value:** (wird automatisch von Vercel gesetzt, wenn Blob Store erstellt wurde)
   - Stelle sicher, dass die Variable für **Production**, **Preview** und **Development** aktiviert ist

3. **Redeploy:**
   - Nach dem Setzen der Umgebungsvariable muss die Anwendung neu deployed werden
   - Vercel sollte automatisch ein neues Deployment starten

## Funktionsweise

- **In Vercel (Production/Preview):**
  - Dateien werden in Vercel Blob Storage gespeichert
  - URLs sind öffentlich zugängliche Blob-URLs
  - Automatische Erkennung über `VERCEL=1` oder `BLOB_READ_WRITE_TOKEN`

- **Lokal (Development):**
  - Fallback auf lokales File-System (`public/uploads/dpp-media/`)
  - Relative URLs für lokale Entwicklung

## Migration bestehender Dateien

Bestehende Dateien, die im lokalen File-System gespeichert sind, müssen nicht migriert werden. Neue Uploads verwenden automatisch Vercel Blob Storage.

## Troubleshooting

**Fehler: "ENOENT: no such file or directory, mkdir '/var/task/public/uploads'"**
- Lösung: Stelle sicher, dass `BLOB_READ_WRITE_TOKEN` in Vercel gesetzt ist
- Prüfe, ob ein Blob Store erstellt wurde

**Fehler: "Missing required environment variable: BLOB_READ_WRITE_TOKEN"**
- Lösung: Setze die Umgebungsvariable in Vercel (siehe oben)

