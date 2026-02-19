# UI-Parität – Visuelle Regressionstests

Look & Feel 1:1 reproduzierbar zwischen Alt- und Neu-Frontend.

**Referenz:** [UI_PARITY_SPEC.md](./UI_PARITY_SPEC.md) | [PARITY_SPEC.md](../PARITY_SPEC.md)

---

## Voraussetzungen

- Node.js 18+
- Playwright: `npm install -D @playwright/test && npx playwright install`
- Laufende App: `npm run dev` (Port 3000) für Tests gegen lokale Instanz

---

## Modi

| MODE | Befehl | Beschreibung |
|------|--------|---------------|
| **record** | `UI_PARITY_RECORD=1 npm run ui:parity` | Erstellt/aktualisiert Baseline-Screenshots |
| **compare** | `npm run ui:parity` | Vergleicht gegen Baseline, erzeugt Diff-Report |

---

## Befehle

```bash
# Compare-Modus (Default): Screenshots gegen Baseline vergleichen
npm run ui:parity

# Record-Modus: Baseline-Screenshots erstellen/aktualisieren
UI_PARITY_RECORD=1 npm run ui:parity

# Nur Login-Tests (ohne Auth)
npm run ui:parity -- tests/ui-001-login.spec.ts

# Mit laufender App auf anderem Host
UI_BASE_URL=http://localhost:3001 npm run ui:parity
```

---

## Umgebungsvariablen

| Variable | Beschreibung | Default |
|----------|--------------|---------|
| `UI_BASE_URL` | Basis-URL der zu testenden App | `http://localhost:3000` |
| `UI_PARITY_RECORD` | `1` = Baseline erstellen, sonst compare | — |
| `UI_HAS_AUTH` | `1` = Auth+Seed vorhanden, erlaubt /app/* Tests | — |

---

## Viewports

| Name | Auflösung |
|------|-----------|
| Desktop | 1440 × 900 |
| Tablet | 768 × 1024 |
| Mobile | 390 × 844 |

---

## Stabilitätsregeln

- **Animationen/Transitions:** Werden pro Test via `addInitScript` auf 0s gesetzt
- **Zeit:** Nutze Fixtures mit festen Datumswerten; Freeze optional via `page.addInitScript`
- **Daten:** 
  - Öffentliche Seiten (Login, Signup, Pricing): Keine Mocks nötig
  - Geschützte Seiten (/app/*): Seed-Daten + Auth (storageState oder Login-Flow)
  - API-Mocks: `page.route()` für client-seitige Fetches

---

## Outputs

| Pfad | Inhalt |
|------|--------|
| `reports/snapshots/` | Baseline-Screenshots (record) / Diff-Screenshots (compare) |
| `reports/html/` | HTML-Report |
| `reports/results.json` | JSON-Ergebnisse |

`.gitignore`: `reports/` (außer Baseline in `reports/snapshots/` – optional committen)

---

## Slice-Mapping

| Slice | UI-IDs | Gate |
|-------|--------|------|
| SLICE-0 | UI-001..UI-015 | [GATE][UI][SLICE-0] |
| SLICE-1 | UI-009 (Media), UI-010, UI-011, UI-026 | [GATE][UI][SLICE-1] |
| SLICE-2 | UI-016..UI-020 | [GATE][UI][SLICE-2] |

---

## CI

GitHub Actions: `.github/workflows/ui-parity.yml`

- Manuell über `workflow_dispatch`
- Oder bei PR mit Änderungen an `ui-parity/**`, `src/app/**`, `src/components/**`
- Nutzt PostgreSQL Service Container, build + start, dann Playwright (nur Desktop-Projekt für Geschwindigkeit)
