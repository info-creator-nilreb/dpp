# Migration Safety: add_poll_responses

## ✅ Diese Migration ist 100% sicher - löscht KEINE Daten

### Was die Migration macht:

1. **Erstellt eine neue Tabelle** `poll_responses` (nur wenn sie nicht existiert)
   - `CREATE TABLE IF NOT EXISTS` - fügt nur hinzu, überschreibt nichts

2. **Erstellt Indizes** (nur wenn sie nicht existieren)
   - Alle Indizes werden mit `IF NOT EXISTS` Prüfung erstellt
   - Keine bestehenden Indizes werden gelöscht oder geändert

3. **Erstellt Foreign Key Constraint** (nur wenn er nicht existiert)
   - `ON DELETE CASCADE` bedeutet: Wenn ein DPP gelöscht wird, werden auch die zugehörigen Poll-Responses gelöscht
   - **WICHTIG**: Die Migration selbst löscht keine Daten - sie definiert nur die Regel für zukünftige Löschungen

### Was die Migration NICHT macht:

❌ Keine `DELETE` Statements
❌ Keine `DROP` Statements  
❌ Keine `TRUNCATE` Statements
❌ Keine `ALTER TABLE ... DROP` Statements
❌ Keine Änderungen an bestehenden Tabellen
❌ Keine Änderungen an bestehenden Daten

### Sicherheitsprüfungen:

- ✅ `CREATE TABLE IF NOT EXISTS` - Tabelle wird nur erstellt, wenn sie nicht existiert
- ✅ Alle Indizes werden mit Existenz-Prüfung erstellt
- ✅ Foreign Key wird nur erstellt, wenn `dpps` Tabelle existiert
- ✅ Foreign Key wird nur erstellt, wenn er nicht bereits existiert

### Idempotenz:

Diese Migration kann mehrfach ausgeführt werden ohne Probleme:
- Bei erneuter Ausführung werden keine Fehler auftreten
- Bestehende Daten bleiben unverändert
- Nur fehlende Strukturen werden hinzugefügt

### Empfohlene Ausführung:

```bash
# Für Produktion (sicher, überschreibt keine Daten)
npx prisma migrate deploy

# Für Entwicklung
npx prisma migrate dev --name add_poll_responses
```
