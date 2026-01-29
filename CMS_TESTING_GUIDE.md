# CMS Editor Testing Guide

## Route zum CMS-Editor

Der CMS-Editor ist unter folgender Route erreichbar:

```
/app/dpp/[dppId]/cms
```

## So testen Sie den Multi-Question Poll Block

### Schritt 1: DPP-ID finden

**Option A: Über die DPP-Liste**
1. Gehen Sie zu `/app/dpps`
2. Öffnen Sie einen DPP (klicken Sie auf einen DPP)
3. Kopieren Sie die DPP-ID aus der URL
   - Beispiel: `http://localhost:3000/app/dpp/cmjgb404e000211fy61z5g2tb` 
   - Die DPP-ID ist: `cmjgb404e000211fy61z5g2tb`

**Option B: Über die Datenbank**
```sql
SELECT id, name, status 
FROM dpps 
LIMIT 5;
```

### Schritt 2: CMS-Editor öffnen

1. Navigieren Sie zu:
   ```
   http://localhost:3000/app/dpp/[Ihre-DPP-ID]/cms
   ```
   
   Beispiel:
   ```
   http://localhost:3000/app/dpp/cmjgb404e000211fy61z5g2tb/cms
   ```

2. Sie sollten jetzt den CMS-Editor sehen mit:
   - Block-Liste (links oder oben)
   - "Block hinzufügen" Button
   - Styling-Optionen (falls verfügbar)

### Schritt 3: Multi-Question Poll Block hinzufügen

1. **Klicken Sie auf "Block hinzufügen"** (oder ähnlichen Button)
   - Das `BlockPickerModal` sollte sich öffnen

2. **Suchen Sie nach "Multi-Question Poll"**
   - Das Icon zeigt 3 Linien mit Kreisen
   - Name: "Multi-Question Poll"
   - Beschreibung: "Umfrage mit bis zu 3 Fragen, horizontal scrollbar"

3. **Klicken Sie auf den Block**
   - Der Block wird erstellt
   - Der Editor sollte sich öffnen

### Schritt 4: Block konfigurieren

Im `MultiQuestionPollBlockEditor` können Sie:

1. **Fragen hinzufügen (max. 3):**
   - Klicken Sie auf "+ Frage hinzufügen"
   - Geben Sie den Fragetext ein (max. 300 Zeichen)

2. **Antwortoptionen hinzufügen (2-5 pro Frage):**
   - Klicken Sie auf "+ Option" bei jeder Frage
   - Geben Sie den Optionstext ein (max. 200 Zeichen)

3. **Dankesnachricht anpassen:**
   - Geben Sie eine benutzerdefinierte Nachricht ein (max. 200 Zeichen)
   - Standard: "Vielen Dank für Ihre Teilnahme!"

4. **Speichern:**
   - Änderungen werden automatisch gespeichert (Auto-Save)

### Schritt 5: Block im Frontend testen

1. **Öffnen Sie die Public DPP-Ansicht:**
   ```
   http://localhost:3000/public/dpp/[Ihre-DPP-ID]
   ```

2. **Scrollen Sie zu "Ihre Meinung"** (oder dem Namen, den Sie vergeben haben)

3. **Testen Sie die Umfrage:**
   - Wählen Sie Antworten aus
   - Navigieren Sie zwischen Fragen
   - Klicken Sie auf "Absenden"
   - Prüfen Sie die Dankesnachricht mit Check-Icon

### Schritt 6: Ergebnisse im Dashboard prüfen

1. **Gehen Sie zum Dashboard:**
   ```
   http://localhost:3000/app/dashboard
   ```

2. **Suchen Sie nach "Umfrage-Ergebnisse" Kachel**
   - Klicken Sie auf die Umfrage
   - Prüfen Sie die aggregierten Ergebnisse

## Troubleshooting

### Problem: CMS-Editor zeigt keine Blöcke an

**Lösung:**
- Prüfen Sie, ob Sie die richtige Route verwenden: `/app/dpp/[dppId]/cms`
- Prüfen Sie, ob Sie eingeloggt sind
- Prüfen Sie, ob Sie Zugriff auf den DPP haben

### Problem: "Multi-Question Poll" erscheint nicht im BlockPickerModal

**Lösung:**
1. Prüfen Sie, ob Sie im **CMS Branch** sind:
   ```bash
   git branch
   # Sollte "CMS" anzeigen
   ```

2. Prüfen Sie, ob die Änderungen vorhanden sind:
   ```bash
   # Prüfe BlockTypeKey
   grep "multi_question_poll" src/lib/cms/types.ts
   
   # Prüfe Feature Mapping
   grep "multi_question_poll" src/lib/cms/validation.ts
   
   # Prüfe BlockPickerModal
   grep "multi_question_poll" src/components/cms/BlockPickerModal.tsx
   ```

3. Prüfen Sie, ob das Feature verfügbar ist:
   - Der Block benötigt das Feature `interaction_blocks`
   - Prüfen Sie Ihre Capabilities: `/api/app/capabilities/check?organizationId=[orgId]`

### Problem: Editor öffnet sich nicht

**Lösung:**
- Prüfen Sie, ob `MultiQuestionPollBlockEditor.tsx` existiert:
  ```bash
  ls src/components/cms/blocks/MultiQuestionPollBlockEditor.tsx
  ```
- Prüfen Sie, ob der Import in `ContentBlockEditor.tsx` korrekt ist

### Problem: Block wird nicht im Frontend gerendert

**Lösung:**
1. Prüfen Sie, ob der Block gespeichert wurde:
   - Öffnen Sie Browser DevTools → Network Tab
   - Prüfen Sie den `/api/app/dpp/[dppId]/content` Request

2. Prüfen Sie, ob der Block-Type korrekt ist:
   - Der Block sollte `type: "multi_question_poll"` haben
   - Prüfen Sie in der Datenbank: `SELECT blocks FROM dpp_content WHERE "dppId" = '[dppId]'`

3. Prüfen Sie die Console-Logs:
   - `[CmsBlockRenderer] Rendering Multi-Question Poll mit dppId: ...`
   - `[MultiQuestionPollRenderer] Initialized`

## Vollständiger Test-Ablauf

```bash
# 1. Stelle sicher, dass du im CMS Branch bist
git checkout CMS

# 2. Starte den Dev-Server
npm run dev

# 3. Öffne den CMS-Editor
# http://localhost:3000/app/dpp/[DPP-ID]/cms

# 4. Füge Multi-Question Poll Block hinzu
# - Klicke auf "Block hinzufügen"
# - Wähle "Multi-Question Poll"
# - Konfiguriere Fragen und Optionen
# - Speichere

# 5. Teste im Frontend
# http://localhost:3000/public/dpp/[DPP-ID]

# 6. Prüfe Ergebnisse
# http://localhost:3000/app/dashboard
```

## Erwartetes Verhalten

✅ **BlockPickerModal:**
- "Multi-Question Poll" erscheint als Kachel
- Icon zeigt 3 Linien mit Kreisen
- Beschreibung ist sichtbar

✅ **ContentBlockEditor:**
- Editor öffnet sich nach Block-Auswahl
- Alle Felder sind editierbar
- Auto-Save funktioniert

✅ **Frontend:**
- Block wird unter "Mehrwertinformationen" gerendert
- Umfrage ist interaktiv
- Antworten werden gespeichert
- Dankesnachricht mit Check-Icon erscheint

✅ **Dashboard:**
- Ergebnisse werden angezeigt
- Aggregation funktioniert korrekt
