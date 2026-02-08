# Bewertung: Persistenz gelöschter Werte (Medien, GTIN) – DPP-konform & datensparsam

## Befund

### 1. Medien (Bilder)

**Technik:**
- **Löschung:** `DELETE /api/app/dpp/[dppId]/media/[mediaId]` führt **Hard-Delete** aus: Eintrag in `dpp_media` und Datei im Storage werden entfernt.
- **Draft:** Anzeige nutzt `dpp.media` (Relation) bzw. `GET /media`; nach Löschung und Refetch sind gelöschte Medien weg.
- **Produktion (öffentliche Ansicht):** Es wird die **veröffentlichte Version** aus `dpp_versions` + `dpp_version_media` geladen. Das ist ein **Snapshot zum Zeitpunkt des Veröffentlichens**. Medien, die **nach** dieser Veröffentlichung im Draft gelöscht wurden, bleiben in der öffentlichen Ansicht sichtbar, bis **neu veröffentlicht** wird.

**Warum „gelöschte“ Bilder in Produktion noch sichtbar sind:**
- Die öffentliche Seite zeigt immer die **letzte veröffentlichte Version** (DPP-konform: Version = unveränderlicher Stand).
- Gelöscht wurde nur im **Entwurf**; die bereits veröffentlichte Version wurde nicht neu erstellt.

**Bewertung (DPP & Datensparsamkeit):**
- **DPP-konform:** Versionen sind unveränderlich; Reproduzierbarkeit der veröffentlichten Inhalte ist gegeben.
- **Datensparsam:** Im Draft werden Medien und Dateien tatsächlich gelöscht. In der Version bleiben nur die zum Veröffentlichungszeitpunkt referenzierten Medien (Snapshot) – keine doppelte „weiche“ Speicherung.

---

### 2. Feldwerte (z. B. GTIN)

**Technik (vor Anpassung):**
- Werte liegen an zwei Stellen: in **`dpp_content.blocks`** (JSON, pro Block/Feld) und in den **Denormalisierungs-Spalten** der Tabelle **`dpps`** (z. B. `gtin`, `sku`, `name`).
- Beim **Speichern nur über PUT /content** wurden nur `dpp_content.blocks` aktualisiert, **nicht** die Spalten in `dpps`.
- Beim **Laden (GET /dpp)** werden zuerst die Feldwerte aus Content gelesen; **falls ein Feld dort fehlt**, wird aus den DPP-Spalten ergänzt (Fallback). Wenn Nutzer:innen GTIN löschen und nur Content gespeichert wird, blieb `dpps.gtin` unverändert und wurde beim nächsten Laden wieder in die Anzeige übernommen.

**Bewertung:**
- Das Verhalten war **nicht datensparsam**: In der DB blieben Werte erhalten, die in der fachlichen Nutzung als „gelöscht“ gelten.
- **DPP-relevant:** GTIN/EAN sind regulatorisch relevant; eine klare, eindeutige „eine Quelle“ und Löschung = wirklich weg ist sinnvoll.

---

## Umgesetzte Anpassungen

### Content-Speicherung synchronisiert DPP-Spalten (datensparsam)

- Beim **PUT /content** (Speichern der template-basierten Feldwerte) werden die zugehörigen Spalten in **`dpps`** aus den `fieldValues` mitgeführt.
- Es werden nur Spalten aktualisiert, die **tatsächlich in `fieldValues` vorkommen** (inkl. leerer String/„gelöscht“).
- **GTIN:** Wenn `fieldValues.gtin` (oder `ean`) fehlt oder leer ist, wird `dpps.gtin` auf `null` gesetzt – gelöschte Werte bleiben nicht in der DB.
- Mapping berücksichtigt Template-Keys (z. B. `ean` → `gtin`, `produktname` → `name` usw.).

Damit gilt:
- **Eine inhaltliche Quelle** für die Anzeige (Content + DPP-Spalten sind nach jedem Content-Save abgeglichen).
- **Datensparsam:** Gelöschte/geleerte Werte werden in der Datenbank tatsächlich entfernt bzw. auf `null`/leer gesetzt.

---

## Konkrete Empfehlungen

### Medien

1. **Öffentliche Ansicht (Produktion)**  
   - Verhalten so belassen: Anzeige = letzte veröffentlichte Version (Snapshot).  
   - **Kommunikation:** „Nach dem Löschen von Bildern im Entwurf die Änderung durch **erneutes Veröffentlichen** freigeben, damit die öffentliche Ansicht aktualisiert wird.“

2. **Optional (nicht zwingend)**  
   - Beim **Veröffentlichen** nur Medien in die Version übernehmen, die zu diesem Zeitpunkt noch in `dpp_media` existieren (bereits der Fall: es wird der aktuelle Stand von `dpp.media` gesnapshottet).

3. **Caching**  
   - GET-Routen für DPP und Medien im Editor mit `Cache-Control: no-store` oder `no-cache` versehen, damit nach Löschung/Änderung sofort der aktuelle Stand geladen wird (kein veralteter Cache).

### Feldwerte (GTIN etc.)

1. **Client**  
   - Beim Speichern (z. B. PUT /content) **alle relevanten Felder** in `fieldValues` mitsenden, inkl. leerer Werte für bewusst gelöschte Felder (z. B. `gtin: ""` oder Key mit leerem Wert). So stellt das Backend in der DB konsistent auf „gelöscht“ (null/leer).

2. **Backend**  
   - Die beschriebene **Sync-Logik** (PUT /content schreibt DPP-Spalten aus `fieldValues`) ist umgesetzt und sollte beibehalten werden.

### Datensparsamkeit (allgemein)

- **Medien:** Kein Soft-Delete nötig; Hard-Delete + Version-Snapshot ist ausreichend und datensparsam.
- **Felder:** Keine zusätzlichen „Historisierungstabellen“ für gelöschte Werte nötig; Löschen = `null`/leer in der einen fachlichen Quelle (Content + DPP-Spalten) ist DPP-konform und datensparsam.
