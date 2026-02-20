# Audit-Log: Spaltenbewertung Tabellenansicht vs. Detailansicht

## Zwingend in der Tabellenansicht (für schnelle Orientierung)

| Spalte | Begründung |
|--------|------------|
| **Zeit** | Wann etwas passiert ist – zentral für zeitliche Einordnung und Suche. |
| **Ausführende Person** | Wer hat gehandelt – Kernfrage für Verantwortung und Nachvollziehbarkeit. |
| **Aktion** | Was wurde getan (Erstellen, Veröffentlichen, Ändern …) – zentraler Inhalt des Logs. |
| **Objekt** | Worauf bezieht sich die Aktion (DPP, Benutzer, …) – notwendig, um den Eintrag einzuordnen. |

## Im Zweifel nur in der Detailansicht

| Spalte | Begründung |
|--------|------------|
| **Feld** | Oft leer („–“) oder technisch; für die Übersicht selten nötig, in der Detailansicht ausreichend. |
| **Änderung** | Vorher/Nachher-Werte sind oft lang und technisch; sinnvoll nur bei Klick auf den Eintrag. |
| **Quelle** | UI/API/KI/System – wichtig für Compliance/KI-Transparenz, aber für die Liste entbehrlich; in der Detailansicht vollständig sichtbar. |

## Umsetzung

- **Tabelle:** Nur Zeit, Ausführende Person, Aktion, Objekt → übersichtlich, passt auch bei ausgeklappter Sidebar ohne horizontales Scrollen.
- **Detail-Drawer:** Alle Infos (inkl. Feld, Änderung, Quelle, KI-Kontext, Raw JSON) bleiben unverändert.
