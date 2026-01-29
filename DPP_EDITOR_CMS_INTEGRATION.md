# DPP-Editor & Supplier Invitation: Bewertung und nächste Schritte

## Was war das Ziel?

- Die **live auf Main/Vercel** laufende Logik für Pflichtdaten **1:1 übernehmen**:
  - Laden des **jeweils aktuellen Templates** (genau wie live)
  - **Supplier Invitation** (pro Block „durch Partner befüllbar“, Modal „Beteiligte einladen“)
- Diese Logik im CMS-Branch im **Tab „Pflichtdaten“** nutzen – **ohne** den bestehenden Pflichtdaten-Tab neu zu bauen/zu refactoren.

---

## Bewertung: Was wurde stattdessen gemacht?

- Es wurde **kein** 1:1-Übernahme der live-Main-Logik umgesetzt.
- Stattdessen wurde der **bestehende Pflichtdaten-Tab (DppDataTabV2) refactored**:
  - DppEditor blieb, **darunter** wurde eine neue Sektion „Partner-Befüllung (Pflichtdaten)“ ergänzt (eigene Template-/Config-/Invite-Lade-Logik, eigene Block-Toggles, eigenes SupplierInviteModal).
- Damit gilt:
  - **Template-Laden**: Eigenes API `/api/app/dpp/[dppId]/template` und clientseitiges Laden – nicht die gleiche Logik wie live (z. B. wo und wie auf Main das Template für die Pflichtdaten-Ansicht geladen wird).
  - **Supplier Invitation**: Eigenes UI (Block-Checkboxen + Modal) nachgebaut statt die **bestehende** Main-Komponente/Seite zu übernehmen.
- Zusätzlich: **Runtime-Fehler** `useRef is not defined` (in DppDataTabV2) – Ursache war fehlender `useRef`-Import; das ist behoben.

**Fazit:** Der Ansatz „Pflichtdaten-Tab refactoren und neue Sektion + Modal einbauen“ entspricht nicht dem Ziel „1:1 Übernahme der live Logik“. Refactoring des bestehenden Tabs ist – wie von dir festgestellt – nicht sinnvoll.

---

## Nächste Schritte (empfohlene Reihenfolge)

### 1. Pflichtdaten-Tab wiederherstellen (ohne Refactor)

- **DppDataTabV2** auf den **ursprünglichen Zustand** zurücksetzen:
  - Nur **DppEditor** mit denselben Props wie vorher (keine Sektion „Partner-Befüllung“, kein SupplierInviteModal, keine eigene Template-/Config-/Invite-Logik in diesem Tab).
- Damit läuft der Tab wieder wie vor der Änderung und der Fehler ist weg; die Frage „wo kommt die Supplier-Logik her?“ wird nicht mehr mit einem Refactor im Tab beantwortet.

### 2. Live-Main-Struktur klären

- Auf **Main** (oder Vercel) prüfen:
  - **Wo** wird das aktuelle Template für die Pflichtdaten-Ansicht geladen? (welche Route/Komponente, welche API/Helfer?)
  - **Wo** sitzt die Supplier Invitation (Block-Markierung + Modal)? (eine eigene Seite wie `/app/dpp/[dppId]`, eine Wrapper-Komponente um den Editor, oder **innerhalb** des Editors?)
  - Welche **genauen Komponenten** rendern „Pflichtdaten inkl. Template-Blöcke und Supplier-UI“?
- Ohne diese Klarheit bleibt jede Übernahme im CMS-Branch ein Nachbau statt 1:1.

### 3. 1:1-Übernahme im CMS-Branch planen

- Sobald die Main-Struktur klar ist:
  - **Option A:** Die **gleiche** Pflichtdaten-Komponente/Seite wie auf Main im CMS-Branch verwenden und im Tab „Pflichtdaten“ **nur diese** Komponente rendern (kein separates „DppEditor + eigene Sektion“).
  - **Option B:** Wenn die Logik auf Main **im DppEditor** steckt: DppEditor vom **Main** in den CMS-Branch übernehmen/mergen, sodass Template-Laden und Supplier Invitation dort identisch sind.
- Template-Laden und Supplier Invitation sollen **dieselbe** Logik wie live nutzen (gleiche APIs/Helfer, gleicher Ablauf), nicht eine neu gebaute.

### 4. Bereits angelegte Backend-Teile nutzen oder anpassen

- Bereits umgesetzt:
  - Prisma: **DppBlockSupplierConfig**, **DppSupplierInvite** + Migration
  - APIs: supplier-config, template, supplier-invites (CRUD, send-pending), contribute/supplier/[token]
  - Seite: `/contribute/supplier/[token]`
- Diese können beibehalten werden, **sobald** die Main-Logik bekannt ist:
  - Entweder die **Main-Frontend-Logik** ruft genau diese APIs auf (dann nur ggf. kleine Anpassungen).
  - Oder Main nutzt andere Endpunkte/Daten – dann entweder Main-APIs übernehmen oder die neuen APIs an die Main-Logik anpassen.

---

## Kurzfassung

- **Fehler:** `useRef is not defined` → behoben (Import ergänzt).
- **Bewertung:** Es wurde der Tab refactored und eine neue „Partner-Befüllung“-Sektion gebaut statt die **live** Template- und Supplier-Logik 1:1 zu übernehmen.
- **Nächste Schritte:**  
  1) DppDataTabV2 auf „nur DppEditor“ zurücksetzen.  
  2) Auf Main klären: Wo und wie Template-Laden und Supplier Invitation laufen.  
  3) Im CMS-Branch die **gleiche** Komponente/Logik wie auf Main für den Pflichtdaten-Tab verwenden (1:1).  
  4) Bestehende Backend-APIs/DB nur in Abgleich mit der Main-Logik nutzen oder anpassen.
