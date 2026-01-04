# Testfälle: Versionsgebundener Medienupload

## Testfall 1: Medienupload in Content-Block mit Rollen

**Ziel:** Prüfen, ob Medien in Content-Blöcken mit Block-Kontext und semantischen Rollen hochgeladen werden können.

### Voraussetzungen:
- DPP existiert (Draft-Status)
- Content-Tab ist verfügbar
- Mindestens ein Content-Block existiert (z.B. Image-Block)

### Testschritte:

1. **DPP öffnen**
   - Navigiere zu `/app/dpps/[dppId]`
   - Wechsle zum Tab "Mehrwert" (Content)

2. **Image-Block erstellen/bearbeiten**
   - Erstelle einen neuen Image-Block oder bearbeite einen bestehenden
   - Klicke auf "Bild hochladen"

3. **Bild mit Rolle hochladen**
   - Wähle ein Testbild (JPEG, PNG, max. 5 MB)
   - Wähle im Dropdown "Verwendungszweck":
     - Teste verschiedene Rollen:
       - `primary_product_image` (Hauptproduktbild)
       - `gallery_image` (Galeriebild)
       - `certificate` (Zertifikat)
   - Lade das Bild hoch

4. **Erwartetes Ergebnis:**
   - ✅ Bild wird hochgeladen
   - ✅ Erfolgsmeldung erscheint
   - ✅ Bild-Vorschau wird angezeigt
   - ✅ In der Datenbank (`dpp_media`):
     - `role` ist gesetzt (z.B. "primary_product_image")
     - `blockId` ist gesetzt (ID des Image-Blocks)
     - `fieldKey` ist gesetzt (z.B. "url")
     - `dppId` ist korrekt

5. **Verifizierung in Datenbank:**
   ```sql
   SELECT id, "dppId", "blockId", "fieldKey", role, "fileName", "storageUrl"
   FROM dpp_media
   WHERE "dppId" = '[DEINE_DPP_ID]'
   ORDER BY "uploadedAt" DESC;
   ```
   - Prüfe: `blockId`, `fieldKey`, `role` sind alle gesetzt

---

## Testfall 2: Versionsgebundene Medien beim Publish

**Ziel:** Prüfen, ob Medien beim Veröffentlichen korrekt in die Version kopiert werden.

### Voraussetzungen:
- DPP mit Draft-Status
- Mindestens 2 Medien in verschiedenen Blöcken hochgeladen
- Medien mit verschiedenen Rollen (z.B. `primary_product_image`, `certificate`)

### Testschritte:

1. **Medien im Draft hochladen**
   - Lade 2-3 Medien in verschiedenen Content-Blöcken hoch
   - Verwende verschiedene Rollen:
     - Block 1: `primary_product_image`
     - Block 2: `gallery_image`
     - Block 3: `certificate`

2. **DPP veröffentlichen**
   - Klicke auf "Neue Version veröffentlichen"
   - Warte auf Erfolgsmeldung

3. **Erwartetes Ergebnis:**
   - ✅ Version wird erstellt
   - ✅ Alle Medien werden in `dpp_version_media` kopiert
   - ✅ Medien behalten ihre Rollen und Block-Kontext
   - ✅ Draft-Medien bleiben unverändert

4. **Verifizierung in Datenbank:**

   **a) Prüfe Version-Medien:**
   ```sql
   SELECT 
     v.version,
     vm."fileName",
     vm.role,
     vm."blockId",
     vm."fieldKey",
     vm."storageUrl"
   FROM dpp_versions v
   JOIN dpp_version_media vm ON vm."versionId" = v.id
   WHERE v."dppId" = '[DEINE_DPP_ID]'
   ORDER BY v.version DESC, vm."uploadedAt" DESC;
   ```
   - Erwartung: Alle Draft-Medien sind in der Version vorhanden

   **b) Prüfe Draft-Medien (unverändert):**
   ```sql
   SELECT id, role, "blockId", "fieldKey"
   FROM dpp_media
   WHERE "dppId" = '[DEINE_DPP_ID]';
   ```
   - Erwartung: Draft-Medien bleiben unverändert

5. **Neue Medien nach Veröffentlichung hochladen**
   - Lade ein neues Medium in einem Block hoch
   - **Erwartung:** 
     - ✅ Neues Medium erscheint nur im Draft
     - ✅ Alte Version bleibt unverändert (keine neuen Medien)

6. **Zweite Version veröffentlichen**
   - Veröffentliche erneut
   - **Erwartung:**
     - ✅ Neue Version enthält alle Medien (alte + neue)
     - ✅ Alte Version bleibt unverändert

---

## Testfall 3: Medien in verschiedenen Block-Typen

**Ziel:** Prüfen, ob File-Felder in verschiedenen Block-Typen funktionieren.

### Voraussetzungen:
- DPP existiert
- Content-Tab verfügbar

### Testschritte:

1. **Image-Block testen**
   - Erstelle Image-Block
   - Lade Bild hoch
   - **Erwartung:** 
     - ✅ `blockId` = Image-Block-ID
     - ✅ `fieldKey` = "url"

2. **ImageText-Block testen**
   - Erstelle ImageText-Block
   - Lade Bild hoch
   - **Erwartung:**
     - ✅ `blockId` = ImageText-Block-ID
     - ✅ `fieldKey` = "imageUrl" (oder entsprechend)

3. **Storytelling-Block testen**
   - Erstelle Storytelling-Block
   - Lade mehrere Bilder hoch (Storytelling hat oft mehrere Bilder)
   - **Erwartung:**
     - ✅ Jedes Bild hat `blockId` = Storytelling-Block-ID
     - ✅ `fieldKey` ist korrekt gesetzt

4. **Verifizierung:**
   ```sql
   SELECT 
     b.type as block_type,
     m."blockId",
     m."fieldKey",
     m.role,
     m."fileName"
   FROM dpp_media m
   JOIN dpp_content dc ON dc."dppId" = m."dppId"
   JOIN jsonb_array_elements(dc.blocks) AS block_data ON block_data->>'id' = m."blockId"
   CROSS JOIN LATERAL jsonb_populate_record(null::record, block_data) AS b(type)
   WHERE m."dppId" = '[DEINE_DPP_ID]'
   ORDER BY m."uploadedAt" DESC;
   ```

---

## Zusätzliche Edge-Cases zum Testen:

### Edge-Case 1: Medien ohne Block-Kontext (Legacy)
- **Szenario:** Alte Medien ohne `blockId`/`fieldKey`
- **Erwartung:** System sollte weiterhin funktionieren (Backward Compatibility)

### Edge-Case 2: Medien mit ungültiger Rolle
- **Szenario:** Rolle wird manuell in DB geändert zu "invalid_role"
- **Erwartung:** System sollte nicht abstürzen, Rolle wird ignoriert oder als "other" behandelt

### Edge-Case 3: Medien-Löschung
- **Szenario:** Medium wird aus Block entfernt
- **Erwartung:** 
  - ✅ Medium wird aus `dpp_media` gelöscht
  - ✅ Version-Medien bleiben unverändert (Immutable)

---

## Quick-Check-Liste:

- [ ] Medienupload in Image-Block funktioniert
- [ ] Rolle wird korrekt gespeichert
- [ ] `blockId` und `fieldKey` werden gesetzt
- [ ] Medien werden beim Publish in Version kopiert
- [ ] Alte Versionen bleiben unverändert
- [ ] Neue Medien erscheinen nicht in alten Versionen
- [ ] Verschiedene Block-Typen funktionieren
- [ ] Medien-Löschung funktioniert
- [ ] Frontend zeigt Medien korrekt an

---

## SQL-Queries für Verifizierung:

### Alle Medien eines DPPs mit Kontext:
```sql
SELECT 
  m.id,
  m."fileName",
  m.role,
  m."blockId",
  m."fieldKey",
  m."storageUrl",
  m."uploadedAt"
FROM dpp_media m
WHERE m."dppId" = '[DEINE_DPP_ID]'
ORDER BY m."uploadedAt" DESC;
```

### Medien einer Version:
```sql
SELECT 
  v.version,
  vm."fileName",
  vm.role,
  vm."blockId",
  vm."fieldKey"
FROM dpp_versions v
JOIN dpp_version_media vm ON vm."versionId" = v.id
WHERE v."dppId" = '[DEINE_DPP_ID]' AND v.version = 1
ORDER BY vm."uploadedAt" DESC;
```

### Vergleich Draft vs. Version:
```sql
-- Draft-Medien
SELECT 'Draft' as source, COUNT(*) as media_count
FROM dpp_media
WHERE "dppId" = '[DEINE_DPP_ID]'

UNION ALL

-- Version-Medien
SELECT 'Version ' || v.version::text as source, COUNT(*) as media_count
FROM dpp_versions v
JOIN dpp_version_media vm ON vm."versionId" = v.id
WHERE v."dppId" = '[DEINE_DPP_ID]'
GROUP BY v.version;
```

