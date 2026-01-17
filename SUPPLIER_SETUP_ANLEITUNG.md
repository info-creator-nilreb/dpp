# Anleitung: Supplier-Funktionalität aktivieren und testen

## Problem
Der "Lieferanten einbinden" Button erscheint nicht im DPP Editor, obwohl die Funktionalität implementiert ist.

## Lösung: Schritt-für-Schritt Anleitung

### Schritt 1: Server neu starten
```bash
# Stoppe den aktuellen Server (Ctrl+C im Terminal)
# Dann starte neu:
npm run dev
```

### Schritt 2: Supplier-Config für einen Block aktivieren

**Option A: Für einen NEUEN DPP**
1. Gehe zu `/app/create/new`
2. Wähle eine Kategorie aus
3. Warte bis das Template geladen ist
4. **WICHTIG**: Aktuell gibt es noch keine UI, um Supplier-Configs zu aktivieren!
   - Die Supplier-Configs müssen über die API oder direkt in der Datenbank gesetzt werden
   - Oder: Wir müssen eine UI hinzufügen, um Supplier-Configs zu aktivieren

**Option B: Für einen BESTEHENDEN DPP**
1. Gehe zu einem bestehenden DPP (z.B. `/app/dpps/[dppId]`)
2. Die Supplier-Configs werden jetzt automatisch geladen (dank des neuen useEffect)
3. Aber: Es gibt noch keine UI, um sie zu aktivieren

### Schritt 3: Supplier-Config manuell aktivieren (temporäre Lösung)

**Via API (mit curl oder Postman):**
```bash
# Setze Supplier-Config für Block-ID "block123" im DPP "dpp456"
curl -X PUT http://localhost:3000/api/app/dpp/dpp456/supplier-config \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "blockId": "block123",
    "enabled": true,
    "mode": "input",
    "allowedRoles": []
  }'
```

**Via Datenbank (SQL):**
```sql
-- Finde die Block-ID für einen Block in einem DPP
SELECT tb.id as block_id, tb.name, t.id as template_id
FROM template_blocks tb
JOIN templates t ON t.id = tb.template_id
WHERE t.category = 'FURNITURE' AND tb.order > 0
LIMIT 1;

-- Setze dann die Supplier-Config (ersetze dpp_id und block_id)
INSERT INTO dpp_block_supplier_configs (id, "dppId", "blockId", enabled, mode, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'dpp_id_hier',
  'block_id_hier',
  true,
  'input',
  NOW(),
  NOW()
)
ON CONFLICT ("dppId", "blockId") 
DO UPDATE SET enabled = true, mode = 'input', "updatedAt" = NOW();
```

### Schritt 4: UI für Supplier-Config hinzufügen (Empfohlen)

**Problem**: Es gibt aktuell keine UI, um Supplier-Configs im DPP Editor zu aktivieren.

**Lösung**: Wir müssen eine UI-Komponente hinzufügen, die es erlaubt, Supplier-Configs pro Block zu aktivieren.

Soll ich diese UI jetzt implementieren?

## Was sollte sichtbar sein?

Nach erfolgreicher Aktivierung sollten Sie sehen:

1. **"Lieferanten einbinden" Button** (grün, oben über den Blöcken)
   - Erscheint nur, wenn mindestens ein Block mit `order > 0` Supplier-Config aktiviert hat
   - Zeigt die Anzahl der aktiven Einladungen als Badge

2. **Supplier-Invite Modal** beim Klick auf den Button
   - Liste aller supplier-fähigen Blöcke
   - Möglichkeit, E-Mail, Rolle und Nachricht einzugeben
   - Block-Auswahl und Feld/Instanz-Auswahl

3. **Status-Badges** in den Block-Headern
   - "Ausstehend" (gelb) wenn Daten angefragt wurden
   - "Daten übermittelt" (grün) wenn Daten eingegangen sind

## Debugging

Falls der Button immer noch nicht erscheint:

1. **Browser-Konsole öffnen** (F12)
2. **Prüfe ob Fehler vorhanden sind**
3. **Prüfe die Network-Tab**:
   - Wird `/api/app/dpp/[dppId]/supplier-config` aufgerufen?
   - Gibt es eine Antwort?
4. **Prüfe React DevTools**:
   - Ist `blockSupplierConfigs` State gefüllt?
   - Ist `supplierEnabledBlocksCount > 0`?

## Nächste Schritte

1. ✅ Server neu starten
2. ⚠️ Supplier-Config UI implementieren (fehlt noch)
3. ⚠️ Supplier-Config für einen Block aktivieren
4. ✅ Button sollte erscheinen
5. ✅ Modal sollte funktionieren


