# Migrationen

## Regel: Nur ergänzen, keine Daten überschreiben

- **Erlaubt:** Neue Tabellen, neue Spalten (`ADD COLUMN IF NOT EXISTS`), neue Indizes
- **Nicht erlaubt:** `UPDATE`/`DELETE` auf bestehende Daten, `DROP COLUMN`/`DROP TABLE`, Daten überschreiben

Bestehende Daten bleiben unverändert; nur Tabellen bzw. Felder werden ergänzt.
