# User Stories: CO₂-Emissionen Feld & Premium-Berechnung (Climatiq)

## Kontext
- Neuer Feldtyp `co2_emissions` für DPP-Pflichtangaben (CO₂e).
- Premium-Feature: automatische CO₂-Berechnung über Climatiq API.
- UX-Parität mit Supplier Invitation: kontextueller Button, Modal-Wizard, explizite Bestätigung, kein Autosave.

---

## User Stories

### Feldtyp & Datenmodell

| ID | Als … | möchte ich … | damit … |
|----|--------|----------------|---------|
| US1 | Super-Admin | im Template-Engine den Feldtyp „CO₂-Emissionen“ auswählen können | Templates CO₂e-Pflichtangaben abbilden. |
| US2 | Redakteur | bei einem CO₂-Feld ein numerisches Eingabefeld mit Einheit „kg CO₂e“ sehen und manuell eingeben können | ich die Mindestanforderungen auch ohne Premium erfülle. |
| US3 | Redakteur | Quelle (manuell/berechnet) und Methodik angezeigt bekommen, sofern vorhanden | die Herkunft des Werts nachvollziehbar ist. |
| US4 | System | bei manueller Eingabe `source = "manual"` setzen | die Herkunft konsistent gespeichert wird. |

### Premium: Berechnung

| ID | Als … | möchte ich … | damit … |
|----|--------|----------------|---------|
| US5 | Premium-Redakteur | neben dem CO₂-Feld einen Button „CO₂ automatisch berechnen“ sehen (Desktop: rechts, Mobile: darunter) | ich den Wert optional per Berechnung fülle. |
| US6 | System | den Berechnen-Button nur im bearbeitbaren Entwurf und nur für Premium anzeigen | in read-only/veröffentlichten Ansichten keine Schreibaktion angeboten wird. |
| US7 | Redakteur | beim Klick auf „CO₂ automatisch berechnen“ ein Modal öffnen (ohne Navigation/Autosave) | ich bewusst den Ablauf starte und der Editor unverändert bleibt bis zur Bestätigung. |
| US8 | Redakteur | im Modal einen Wizard durchlaufen: Bereich wählen → Eingaben → Berechnung → Ergebnisvorschau mit Hinweis „Schätzung …“ und „Ergebnis übernehmen“ | ich das Ergebnis prüfen und explizit übernehmen kann. |
| US9 | Redakteur | nach „Ergebnis übernehmen“ den Wert im CO₂-Feld sehen mit source = „calculated“, methodology = „Climatiq estimate“ | der Wert versioniert gespeichert wird und nur bei Bestätigung überschrieben wird. |
| US10 | Nicht-Premium-Redakteur | keinen Berechnen-Button sehen, ggf. Hinweis „Automatische CO₂-Berechnung verfügbar in Premium.“ | die Grenze zwischen Tarifen klar ist. |

### Versionierung & Verantwortung

| ID | Als … | möchte ich … | damit … |
|----|--------|----------------|---------|
| US11 | System | berechnete CO₂-Werte als Teil der DPP-Version speichern | alte Versionen unverändert bleiben und Recalculation nur bei expliziter Aktion erfolgt. |
| US12 | Economic Operator | Werkzeug nur als Unterstützung nutzen, rechtlich verantwortlich für den Wert bleiben | regulatorische Korrektheit gewahrt ist. |

---

## Abnahmekriterien (kurz)

- Feldtyp `co2_emissions` im Super-Admin wählbar.
- Editor: Numerisches Input + „kg CO₂e“, Anzeige von source/methodology bei Vorhandensein.
- Manuelle Eingabe setzt `source = "manual"`.
- Premium: Button „CO₂ automatisch berechnen“ nur inline am Feld, nur Entwurf, nur Premium.
- Modal: Wizard (Bereich → Eingaben → Climatiq → Ergebnis + Disclaimer), „Ergebnis übernehmen“ schreibt Wert + source/methodology/calculationMeta.
- Kein Überschreiben ohne Bestätigung, kein Autosave durch das Modal.
- Nicht-Premium: Kein Button, optional Hinweis zu Premium.
