# Checkliste: Editorial Frontend & Styling in Produktion

Wenn in der **Produktion** die Vorschau, das Public DPP oder der Styling-Bereich fehlen (im Gegensatz zur lokalen Umgebung), die folgenden Punkte prüfen.

---

## 1. Neuesten Stand deployen

- **Ursache:** Production läuft noch auf einem Stand vor dem CMS-Merge (ohne EditorialDppViewRedesign, DppPublicView, unified-blocks, Styling im Frontend-Tab).
- **Maßnahme:** Letzten Stand von `main` deployen (z. B. Vercel: neuer Deploy auslösen oder Git-Push auf `main`).
- **Prüfen:** Nach dem Deploy die betroffenen URLs im Browser ohne Cache testen (Hard Reload / Inkognito).

---

## 2. Vorschau im Editor („So wird Ihr Digitaler Produktpass angezeigt“)

Die Vorschau lädt die Blöcke über **`/api/app/dpp/[dppId]/unified-blocks`**.

- **401/403:** Session/Login prüfen; Nutzer muss Zugriff auf die DPP-Organisation haben.
- **500:** Server-Logs prüfen (z. B. Vercel Functions). Typisch: `transformDppToUnified` schlägt fehl (z. B. Prisma, DB-Schema, fehlende Tabellen).
- **Maßnahme:** `DATABASE_URL` in Produktion prüfen; ggf. Migrationen auf der Produktions-DB ausführen (`npx prisma migrate deploy`), dann neu deployen.

---

## 3. Öffentliche DPP-Ansicht (`/public/dpp/[dppId]`)

Die Public-Seite rendert serverseitig mit **DppPublicView** und **transformDppToUnified**.

- **404:** DPP nicht gefunden oder `status !== "PUBLISHED"`.
- **„Fehler beim Laden des Produktpasses“:** Meist Fehler in `transformDppToUnified` (Prisma/DB). Logs der Server-Funktion prüfen.
- **Alte Darstellung (ohne Editorial Redesign):** Alte Build-Version; siehe Abschnitt 1 (neu deployen, Cache umgehen).

---

## 4. Styling-Bereich im Vorschau-Tab fehlt

Der Styling-Bereich (Logo, Farben, Schrift) wird nur angezeigt, wenn die Organisation das Feature **`cms_styling`** hat.

- **Quelle:** `/api/app/capabilities/check?organizationId=...` → `features` (Array).
- **Bedingung:** `features` muss `"cms_styling"` (oder ggf. `"advanced_styling"`) enthalten.

**Typische Ursachen in Produktion:**

1. **Feature-Registry:** In der Tabelle `FeatureRegistry` ist `cms_styling` nicht vorhanden oder `enabled = false`.
2. **Subscription/Entitlements:** Die Organisation hat kein Abo oder das Abo-Modell enthält `cms_styling` nicht; Entitlements für die Org prüfen (Super-Admin: Organisation → Abo / Limits).
3. **Capabilities-API:** `/api/app/capabilities/check` gibt 500 oder leeres `features` zurück (z. B. DB-Fehler, fehlende Tabellen). Logs prüfen.

**Schnellprüfung im Browser (Produktion):**

- Im DPP-Editor: DevTools → Network → Request zu `capabilities/check?organizationId=...` öffnen.
- Response prüfen: Enthält `features` den Eintrag `"cms_styling"`? Wenn nein, Feature-Registry und Abo/Entitlements in der Produktions-DB prüfen.

---

## 5. Kurzüberblick

| Symptom                         | Wahrscheinliche Ursache              | Erste Maßnahme                    |
|---------------------------------|--------------------------------------|-----------------------------------|
| Vorschau/Public wie vor dem Merge | Alter Deploy                         | Neu deployen von `main`           |
| Vorschau: „Fehler beim Laden“   | unified-blocks API / transformDppToUnified | Server-Logs, DB/Migrationen       |
| Public: „Fehler beim Laden“     | transformDppToUnified / Prisma/DB    | Server-Logs, DB/Migrationen       |
| Styling-Bereich fehlt           | `cms_styling` nicht in capabilities  | Feature-Registry + Abo prüfen     |
