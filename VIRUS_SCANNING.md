# Virus Scanning Setup

Diese Anwendung verwendet **VirusTotal API** für Virenscanning von Datei-Uploads in der Produktionsumgebung.

## Setup

### 1. VirusTotal API Key erhalten

1. Registrieren Sie sich bei [VirusTotal](https://www.virustotal.com/gui/join-us)
2. Gehen Sie zu [API Key Settings](https://www.virustotal.com/gui/user/<your-username>/apikey)
3. Kopieren Sie Ihren API Key

### 2. Environment Variable setzen

#### Vercel Production

Fügen Sie in Ihren Vercel Project Settings → Environment Variables hinzu:

```
VIRUSTOTAL_API_KEY=your-virustotal-api-key-here
```

#### Local Development (Optional)

Fügen Sie in Ihre `.env.local` Datei hinzu:

```
VIRUSTOTAL_API_KEY=your-virustotal-api-key-here
ENABLE_VIRUS_SCAN=true
```

**Hinweis:** In Development wird Virus Scanning standardmäßig übersprungen (auch wenn kein API Key gesetzt ist). Setzen Sie `ENABLE_VIRUS_SCAN=true` um es auch lokal zu aktivieren.

### 3. Verhalten

- **Production:** Virus Scanning ist automatisch aktiviert (wenn `VIRUSTOTAL_API_KEY` gesetzt ist)
- **Development:** Virus Scanning ist standardmäßig deaktiviert (überspringbar)
- **Rate Limits:** VirusTotal Free Tier erlaubt 4 Requests/Minute. Bei Rate Limits wird die Datei trotzdem akzeptiert (mit Warnung im Log)

## Implementierung

### Dateien

- `src/lib/virus-scanner.ts` - Virus Scanning Service
- `src/app/api/app/dpps/preflight/pdf/route.ts` - PDF Upload für Preflight
- `src/app/api/app/dpp/[dppId]/media/route.ts` - Media Upload

### Sicherheit

- Dateien werden **vor** dem Speichern gescannt
- Bei Fehler im Virus Scan wird der Upload **blockiert**
- Bei Rate Limits wird die Datei akzeptiert (mit Log-Warnung)

## Kosten

- **VirusTotal Free Tier:** 4 Requests/Minute
- Für höhere Limits: [VirusTotal Premium](https://www.virustotal.com/gui/pricing)

## Alternative Services

Falls VirusTotal nicht ausreicht, können folgende Services verwendet werden:

- **Cloudmersive Virus Scan API** - Kommerziell, höhere Limits
- **OPSWAT MetaDefender** - Enterprise-Lösung
- **ClamAV** - Open Source (benötigt eigenen Server)

