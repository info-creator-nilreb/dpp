# Editorial-Frontend in die Vorschau integrieren

Der Branch **editorialFE** enthält das Redesign der Editorial-Ansicht (Spine, Data Sections, Content-Adapter, unified-blocks API). Der Branch ist **~70 Commits hinter CMS** und hat **einen eigenen Commit** mit allen Editorial-Features. Die Vorschau im CMS-Branch nutzt aktuell noch die alte `EditorialDppView` ohne diese Elemente.

## Stand der Branches

| Branch     | Editorial-Komponenten |
|-----------|------------------------|
| **CMS**   | `EditorialDppView`, `Page`, `Section`, `Block`, `Media`, `Accent`, Tokens; **kein** Spine, **keine** Data Sections, **kein** content-adapter |
| **editorialFE** | Alles von CMS **plus**: `EditorialDppViewRedesign`, `EditorialSpine`, `Logo`, `data/*`, `spine/*`, `content-adapter`, unified-blocks API, angepasste `DppFrontendPreview`/`DppPublicView` |

Commit mit dem Redesign auf editorialFE: `e6a79fb` („Editorial FE: Redesign, Spine, Data Sections; …“).

---

## Option A: Cherry-Pick des Editorial-Commit (empfohlen)

Nur den einen Redesign-Commit von editorialFE in CMS holen. Konflikte entstehen nur in den Dateien, die in **beiden** Branches geändert wurden.

### Ablauf

```bash
# 1. Sicherstellen: Du bist auf CMS, Arbeitsverzeichnis sauber
git checkout CMS
git status   # sollte clean sein; ggf. committen oder stashen

# 2. Cherry-Pick des Editorial-Commit
git cherry-pick e6a79fb
```

### Bei Konflikten

Konflikte sind möglich in:

- `src/components/dpp/tabs/DppFrontendPreview.tsx`
- `src/components/editorial/EditorialDppView.tsx`
- `src/components/editorial/Page.tsx`
- `src/components/editorial/tokens/colors.ts`
- `src/components/public/DppPublicView.tsx`

**Auflösung:** Für die **Vorschau/Public-Ansicht** die Version aus dem Editorial-Commit („incoming“) nehmen, damit Spine, Redesign und Data Sections aktiv sind.

- Nach Konflikt in einer Datei: Datei bearbeiten, Konfliktmarker entfernen, **die Variante behalten, die EditorialDppViewRedesign / Spine / content-adapter nutzt**.
- Dann:
  ```bash
  git add <datei>
  git cherry-pick --continue
  ```

Cherry-Pick abbrechen: `git cherry-pick --abort`.

### Nach dem Cherry-Pick

- App bauen und Vorschau testen: `npm run dev` → DPP öffnen → Tab „Vorschau“.
- Public-Seite prüfen: `/public/dpp/[dppId]`.
- Fehlende Imports/Abhängigkeiten (z. B. `@/lib/content-adapter`, `@/lib/media/hero-logic`) kommen mit dem Commit; ggf. Linter/TypeScript-Fehler nachziehen und beheben.

---

## Option B: Merge editorialFE in CMS

Den gesamten editorialFE-Branch in CMS mergen. Bringt den gleichen Redesign-Commit, kann je nach History etwas anders konfligieren als der Cherry-Pick.

```bash
git checkout CMS
git merge editorialFE
# Konflikte auflösen wie bei Option A (Editorial-Version bevorzugen)
git add .
git commit -m "Merge editorialFE: Editorial Redesign, Spine, Data Sections in Vorschau"
```

---

## Option C: Nur neue Dateien übernehmen (ohne Merge/Cherry-Pick)

Wenn du **keine Git-Konflikte** in gemeinsamen Dateien haben willst, kannst du nur die **neuen** Dateien und Ordner aus editorialFE in CMS holen und die Anbindung selbst vornehmen.

### 1. Neue Dateien von editorialFE in CMS übernehmen

```bash
git checkout CMS

# Editorial: neue Komponenten + data + spine
git checkout editorialFE -- \
  src/components/editorial/EditorialDppViewRedesign.tsx \
  src/components/editorial/EditorialSpine.tsx \
  src/components/editorial/Logo.tsx \
  src/components/editorial/data/ \
  src/components/editorial/spine/

# Content-Adapter + API
git checkout editorialFE -- \
  src/lib/content-adapter/ \
  src/app/api/app/dpp/\[dppId\]/unified-blocks/

# Optional: Public-Layout und Test-Seite
git checkout editorialFE -- \
  src/app/public/dpp/\[dppId\]/layout.tsx \
  src/app/public/test-dpp/
```

### 2. Bestehende Dateien manuell anpassen

- **Vorschau:** In `src/components/dpp/tabs/DppFrontendPreview.tsx` die neue View und Datenquelle nutzen (z. B. `EditorialDppViewRedesign`, Daten aus unified-blocks oder content-adapter statt nur lokaler `blocks`/`dpp`).
- **Public-Ansicht:** In `src/components/public/DppPublicView.tsx` auf die gleiche Editorial-Redesign-View und Datenquelle umstellen.
- **Editorial-Exports:** In `src/components/editorial/index.ts` ggf. `EditorialDppViewRedesign`, `EditorialSpine`, `Logo` und data/spine exportieren.

Vorteil: Keine Merge-Konflikte. Nachteil: Du musst die Anbindung (Datenfluss, welches View wo) selbst konsistent machen.

---

## Empfehlung

- **Schnell und vollständig:** **Option A (Cherry-Pick)**. Ein Befehl, alle Änderungen inkl. Anbindung von Vorschau/Public kommen mit; Konflikte nur in wenigen Dateien und klar zuzuordnen.
- **Maximal kontrolliert ohne Konflikte in Git:** **Option C**, wenn du bewusst keine gemeinsamen Dateien (DppFrontendPreview, DppPublicView, EditorialDppView) von editorialFE übernehmen willst.

Nach Option A oder B die Vorschau und `/public/dpp/[dppId]` testen; danach kannst du den editorialFE-Branch ggf. auf CMS rebasen oder archivieren.

---

## Checkliste nach der Integration

- [ ] `npm run build` läuft ohne Fehler
- [ ] Tab „Vorschau“ im DPP-Editor zeigt die neue Editorial-Ansicht (Spine/Data Sections, falls eingebaut)
- [ ] Public-Seite `/public/dpp/[dppId]` rendert korrekt
- [ ] Keine fehlenden Imports (`@/lib/content-adapter`, `theme-resolver`, `hero-logic` etc.) – ggf. Pfade anpassen
- [ ] Optional: editorialFE-Branch mit CMS synchronisieren (`git checkout editorialFE && git merge CMS`) oder als erledigt markieren
