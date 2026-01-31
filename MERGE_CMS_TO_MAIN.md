# Merge CMS (inkl. Editorial Frontend) nach main

Checkliste für einen reibungslosen Merge von Branch `CMS` nach `main`.

---

## 1. Vor dem Merge (auf Branch CMS)

### 1.1 Offene Änderungen committen

Aktuell sind viele Dateien geändert (Prisma, API, Editorial, Public View). Alles committen:

```bash
git status
git add -A
git commit -m "chore: CMS + Editorial FE – Public View vereinheitlicht, DppSupplierInvite-Schema, Fixes"
```

### 1.2 Main aktuell holen

Falls `main` auf origin weiter ist, zuerst einholen:

```bash
git fetch origin
git log CMS..origin/main --oneline   # Gibt es neue Commits auf main?
```

Wenn ja: **main in CMS mergen** und Konflikte lösen, dann lokal testen:

```bash
git checkout CMS
git merge origin/main -m "Merge origin/main into CMS"
# Konflikte beheben, dann:
git add -A && git commit --no-edit
```

### 1.3 Lokal testen (weiter auf CMS)

- **Prisma:** `npx prisma generate`
- **Build:** `rm -rf .next && npm run build`
- **Dev:** `npm run dev` – Vorschau, Public View, Pflichtdaten/Supplier-Invites prüfen

---

## 2. Merge durchführen

### Option A: CMS in main mergen (empfohlen)

```bash
git checkout main
git pull origin main
git merge CMS -m "Merge CMS into main – Editorial Frontend, Public View, Supplier Invites, Prisma DppSupplierInvite"
```

### Option B: Pull Request (GitHub/GitLab)

1. Branch `CMS` pushen: `git push origin CMS`
2. PR erstellen: `CMS` → `main`
3. CI/Build prüfen, dann mergen

---

## 3. Nach dem Merge (auf main)

### 3.1 Prisma & Build

```bash
npx prisma generate
rm -rf .next
npm run build
```

### 3.2 Datenbank (Migrationen)

- **Lokal/Staging:**  
  `npx prisma migrate deploy`  
  (oder `npm run db:migrate:dev` wenn ihr den Safe-Wrapper nutzt)

- **Production:**  
  Mit Production-`DATABASE_URL` (z. B. in Vercel/CI oder manuell):

  ```bash
  npx prisma migrate deploy
  ```

  Wichtig: Die Migration `20260129000000_add_supplier_invitation` legt nur die Tabelle `dpp_supplier_invites` an (nicht erneut `dpp_block_supplier_configs`). Wenn diese Migration auf Prod schon einmal (mit alter Version) gelaufen ist, prüfen:

  ```bash
  npx prisma migrate status
  ```

  Bei „already applied“ ist nichts weiter nötig.

### 3.3 Kurz prüfen

- Login, DPP-Liste, DPP bearbeiten
- Tab „Mehrwert“ / Vorschau (EditorialDppViewRedesign)
- Öffentliche URL: `/public/dpp/[dppId]` (gleiche Ansicht wie Vorschau)
- Pflichtdaten: Supplier-Einladungen laden (kein 500 mehr dank `DppSupplierInvite` im Schema)

---

## 4. Deployment (Vercel/o. Ä.)

- **Environment:** `DATABASE_URL` muss gesetzt sein (Supabase, inkl. Connection Pooler für Serverless).
- **Build:** `npm run build` nutzt bereits `prisma generate`; keine extra Schritte nötig.
- **Migrationen:** Vor oder beim ersten Deploy nach dem Merge auf der Production-DB ausführen:

  ```bash
  DATABASE_URL="<production-url>" npx prisma migrate deploy
  ```

  Oder über euer bestehendes Script (z. B. `./scripts/migrate-production.sh`), falls vorhanden.

---

## 5. Wichtige Punkte im Überblick

| Thema | Hinweis |
|--------|--------|
| **Prisma** | Schema enthält jetzt `DppSupplierInvite`; nach Merge `prisma generate` und ggf. `migrate deploy` ausführen. |
| **Migration 20260129000000** | Erstellt nur `dpp_supplier_invites` (nicht erneut `dpp_block_supplier_configs`). |
| **Public View** | `/public/dpp/[dppId]` und `/public/dpp/[dppId]/v/[version]` nutzen beide `DppPublicView` → EditorialDppViewRedesign. |
| **Vorschau = Public** | Editor-Vorschau und öffentliche Ansicht sind dieselbe Komponente (EditorialDppViewRedesign). |
| **Alte Komponente** | `EditorialDppView` wird von keiner Route mehr verwendet; kann später entfernt werden. |

---

## 6. Bei Konflikten

Typische Konflikt-Kandidaten:

- `next.config.js` – keine Merge-Marker (`<<<<<<`, `======`, `>>>>>>`) stehen lassen.
- `prisma/schema.prisma` – Relationen und neue Modelle (z. B. `DppSupplierInvite`, `supplierInvites` am `Dpp`) aus CMS übernehmen.
- `package.json` / `package-lock.json` – bei Abweichungen: CMS-Version prüfen, dann `npm install` und Build.

Nach Konflikt-Behebung:

```bash
git add -A
git commit --no-edit   # oder eine eigene Merge-Message
npx prisma generate
npm run build
```

Wenn du diese Schritte einhältst, sollte der Merge von CMS in main reibungslos laufen.
