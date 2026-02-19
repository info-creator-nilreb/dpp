# Parity Harness

Kleines Testprojekt zum Vergleich von API-Responses zwischen zwei Basis-URLs (ALT vs NEW).
CI-ready für Golden-Master-Parity-Tests.

## Voraussetzungen

- Node.js 18+
- `ALT_BASE_URL` und `NEW_BASE_URL` (oder Konfiguration in `parity.config.json`)

## Installation

```bash
cd parity-harness
npm install
```

## Modi

| MODE | Beschreibung |
|------|--------------|
| `compare` (default) | Führt Requests gegen ALT und NEW aus, vergleicht Responses (normalisiert), schreibt Diff-Report |
| `record` | Führt Requests nur gegen ALT aus, speichert normalisierte Snapshots in `tests/golden/snapshots/` |

## Verwendung

```bash
# Compare-Modus (Default): ALT vs NEW vergleichen
npm run parity
ALT_BASE_URL=https://alt.example.com NEW_BASE_URL=https://new.example.com npm run parity

# Record-Modus: Snapshots gegen ALT aufnehmen (für spätere Verwendung)
MODE=record ALT_BASE_URL=https://alt.example.com npm run parity

# Mit eigener Normalize-Config
NORMALIZE_CONFIG=config/normalize.json npm run parity

# CI-Modus (exit code 1 bei Fehlern)
npm run parity:ci

# Dry-Run (nur Requests auflisten, keine Ausführung)
npm run parity -- --dry-run
```

## Umgebungsvariablen

| Variable | Beschreibung |
|----------|--------------|
| `ALT_BASE_URL` | Basis-URL für das alte System |
| `NEW_BASE_URL` | Basis-URL für das neue System |
| `MODE` | `record` oder `compare` (default: `compare`) |
| `NORMALIZE_CONFIG` | Pfad zur `normalize.json` (default: `config/normalize.json`) |
| `PARITY_OUTPUT` | Output-Verzeichnis für Reports (default: `parity-reports`) |

## Request-Format

JSON-Dateien in `tests/golden/requests/*.json`:

```json
{
  "name": "GET /api/app/dpps",
  "method": "GET",
  "path": "/api/app/dpps",
  "headers": {},
  "body": null
}
```

Mit Pfad-Parametern:

```json
{
  "name": "GET /api/app/dpp/{dppId}/media",
  "method": "GET",
  "path": "/api/app/dpp/{{DPP_ID}}/media",
  "pathParams": {
    "DPP_ID": "konkrete-id-hier"
  }
}
```

Requests mit Placeholder-Werten (z.B. `REPLACE_WITH_REAL_DPP_ID`) werden übersprungen.

## Konfiguration

`parity.config.json`:

| Option | Beschreibung |
|--------|--------------|
| `altBaseUrl` | Basis-URL für „altes“ System |
| `newBaseUrl` | Basis-URL für „neues“ System |
| `timeoutMs` | Request-Timeout (Default: 10000) |
| `normalizeConfigPath` | Pfad zur `normalize.json` |
| `toleratedFields` | Feldnamen, die beim Vergleich ignoriert werden (z.B. `createdAt`, `id`) |
| `toleratedPathPatterns` | Glob-Muster für tolerierte Pfade (z.B. `*.id`, `media[].id`) |

`config/normalize.json` (Normalisierung vor Snapshot-Vergleich bzw. -Speicherung):

| Option | Beschreibung |
|--------|--------------|
| `ignorePaths` | Feldnamen → werden zu `[TOLERATED]` (analog toleratedFields) |
| `ignorePathPatterns` | Pfad-Muster → `[TOLERATED]` |
| `redactPaths` | Feldnamen → werden zu `[REDACTED]` (Token, Secrets) |
| `redactPathPatterns` | Pfad-Muster → `[REDACTED]` |
| `sortRules` | Arrays sortieren: `{ path, by, order }` vor Vergleich |
| `urlSanitizePaths` | Bei diesen Feldern: `?` und Query-Parameter aus URLs entfernen |

## Output

- `parity-reports/parity-report.json` – Vollständiger Report
- `parity-reports/parity-report.md` – Markdown-Report

Output-Verzeichnis überschreiben: `PARITY_OUTPUT=out npm run parity`

## CI

GitHub Actions Workflow: `.github/workflows/parity.yml`

- Manuell mit `workflow_dispatch` und Eingabe von `alt_base_url` / `new_base_url`
- Oder Repository-Variablen `ALT_BASE_URL`, `NEW_BASE_URL` setzen
- Artefakt `parity-report` enthält die Reports
