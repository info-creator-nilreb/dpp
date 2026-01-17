# Supplier Config: Semantik-Refactoring für ESPR-Konformität

## Analyse der aktuellen Probleme

### 1. Verantwortungszuweisung
**Aktuell:** "Lieferant darf Inhalte beisteuern"
- ❌ Suggertiert, dass Lieferant "darf" (rechtliche Erlaubnis)
- ❌ "Beisteuern" impliziert Mitverantwortung
- ❌ Keine klare Trennung zwischen Datenbereitstellung und Verantwortung

**ESPR-Realität:**
- Economic Operator ist allein verantwortlich für DPP-Inhalt
- Lieferanten sind Datenquelle, keine Mitverantwortlichen
- Keine rechtliche "Erlaubnis" nötig - es ist eine technische Konfiguration

### 2. Modus-Benennung
**Aktuell:** 
- "Eingabe (Lieferant kann Werte eingeben)"
- "Deklaration (Lieferant bestätigt nur)"

**Probleme:**
- ❌ "kann Werte eingeben" suggeriert direkte Kontrolle
- ❌ "bestätigt nur" unklar - was wird bestätigt?
- ❌ Keine klare Unterscheidung zwischen Datenerfassungsart

### 3. Tooltip & Hilfetexte
**Aktuell:** "Lieferanteneingabe aktivieren"
- ❌ "Eingabe" suggeriert direkte Veröffentlichung
- ❌ "aktivieren" zu technisch, keine regulatorische Klarheit

**Aktuell:** "Wenn aktiviert, kann ein externer Lieferant diesen Abschnitt über einen sicheren Link ausfüllen."
- ❌ "ausfüllen" suggeriert finale Veröffentlichung
- ❌ Keine Erwähnung der Verantwortung des Economic Operators

### 4. Rollen-Filter
**Aktuell:** "Erlaubte Lieferantenrollen (optional)"
- ❌ "Erlaubt" suggeriert rechtliche Relevanz
- ❌ Keine Klarstellung, dass es nur ein Filter ist

---

## Vorgeschlagene Änderungen

### 1. Haupt-Toggle Label

**VON:** "Lieferant darf Inhalte beisteuern"  
**ZU:** "Datenquelle: Lieferkette"

**Begründung:**
- ✅ Neutral, beschreibt nur technische Konfiguration
- ✅ Keine rechtliche Implikation
- ✅ Klar: Es geht um die Quelle der Daten, nicht um Verantwortung
- ✅ ESPR-konform: Economic Operator bleibt verantwortlich

**Alternativ:** "Datenbereitstellung durch Lieferkette aktivieren"
- ✅ Expliziter, aber länger
- ✅ "aktivieren" bleibt technisch

**Empfehlung:** "Datenquelle: Lieferkette" (kürzer, klarer)

---

### 2. Tooltip (Icon)

**VON:** "Lieferanteneingabe aktivieren"  
**ZU:** "Datenquelle konfigurieren"

**Begründung:**
- ✅ Neutral, beschreibt nur die Aktion
- ✅ Keine Implikation von Verantwortung oder "Eingabe"
- ✅ Fokus auf Konfiguration, nicht auf Prozess

---

### 3. Hilfetext (unter Toggle)

**VON:** "Wenn aktiviert, kann ein externer Lieferant diesen Abschnitt über einen sicheren Link ausfüllen."

**ZU:** "Lieferanten können Daten für diesen Abschnitt bereitstellen. Die Veröffentlichung und rechtliche Verantwortung verbleibt beim Economic Operator."

**Begründung:**
- ✅ Klare Trennung: Datenbereitstellung vs. Verantwortung
- ✅ Explizite Erwähnung der Verantwortung des Economic Operators
- ✅ "bereitstellen" statt "ausfüllen" (keine finale Aktion)
- ✅ ESPR-konform: Klarstellung der Haftungslogik

**Alternativ (kürzer):**
"Lieferanten stellen Daten bereit. Verantwortung liegt beim Economic Operator."

**Empfehlung:** Längere Version (expliziter, regulatorisch sicherer)

---

### 4. Modus-Label

**VON:** "Modus"  
**ZU:** "Art der Datenerfassung"

**Begründung:**
- ✅ Beschreibt, was konfiguriert wird (Datenerfassung, nicht Veröffentlichung)
- ✅ Neutral, keine rechtliche Implikation

---

### 5. Modus-Optionen

**VON:**
- "Eingabe (Lieferant kann Werte eingeben)"
- "Deklaration (Lieferant bestätigt nur)"

**ZU:**
- "Direkte Eingabe (Lieferant erfasst neue Daten)"
- "Bestätigung vorhandener Daten (Lieferant bestätigt bereits vorhandene Informationen)"

**Begründung:**
- ✅ "Direkte Eingabe" vs. "Bestätigung" - klare Unterscheidung
- ✅ "erfasst" statt "eingibt" (neutraler)
- ✅ "vorhandene Informationen" statt "nur" (präziser)
- ✅ Keine Implikation von Veröffentlichung oder Verantwortung

**Alternativ (kürzer):**
- "Direkte Datenerfassung"
- "Bestätigung vorhandener Daten"

**Empfehlung:** Kürzere Version (UX-freundlicher, bleibt klar)

---

### 6. Rollen-Filter Label

**VON:** "Erlaubte Lieferantenrollen (optional)"  
**ZU:** "Lieferantenrollen (Filter für Einladungen, optional)"

**Begründung:**
- ✅ "Filter" macht klar: Nur technische Funktion, keine rechtliche Bedeutung
- ✅ "für Einladungen" erklärt den Zweck
- ✅ Keine "Erlaubnis"-Implikation

**Alternativ:**
"Lieferantenrollen (nur Filter, keine rechtliche Bedeutung)"

**Empfehlung:** Erste Version (freundlicher, bleibt klar)

---

### 7. Rollen-Hilfetext

**VON:** "Wenn keine Rollen ausgewählt werden, können alle Rollen diesen Block befüllen."

**ZU:** "Wenn keine Rollen ausgewählt werden, können alle Rollen für Einladungen verwendet werden."

**Begründung:**
- ✅ "für Einladungen verwendet" statt "Block befüllen"
- ✅ Klar: Es geht um Einladungslogik, nicht um finale Aktion
- ✅ Neutral, keine Verantwortungsimplikation

---

## Zusammenfassung der Änderungen

| Element | VON | ZU | Begründung |
|---------|-----|-----|------------|
| **Toggle Label** | "Lieferant darf Inhalte beisteuern" | "Datenquelle: Lieferkette" | Neutral, keine Verantwortungsimplikation |
| **Tooltip** | "Lieferanteneingabe aktivieren" | "Datenquelle konfigurieren" | Neutral, technisch |
| **Hilfetext** | "Wenn aktiviert, kann ein externer Lieferant..." | "Lieferanten können Daten bereitstellen. Verantwortung verbleibt beim Economic Operator." | Klare Trennung Verantwortung |
| **Modus-Label** | "Modus" | "Art der Datenerfassung" | Präziser, beschreibt Funktion |
| **Modus Option 1** | "Eingabe (Lieferant kann Werte eingeben)" | "Direkte Datenerfassung" | Neutral, klar |
| **Modus Option 2** | "Deklaration (Lieferant bestätigt nur)" | "Bestätigung vorhandener Daten" | Präziser, klarer |
| **Rollen-Label** | "Erlaubte Lieferantenrollen" | "Lieferantenrollen (Filter für Einladungen)" | Klar als Filter, nicht rechtlich |
| **Rollen-Hilfetext** | "können alle Rollen diesen Block befüllen" | "können alle Rollen für Einladungen verwendet werden" | Neutral, technisch |

---

## ESPR-Konformität Checkliste

- ✅ Keine Verantwortungszuweisung an Lieferanten
- ✅ Klare Trennung: Datenquelle vs. Verantwortung
- ✅ Economic Operator bleibt explizit verantwortlich
- ✅ Keine Begriffe wie "Freigabe", "Veröffentlichung" im Supplier-Kontext
- ✅ Template Engine bleibt abstrakt (keine operative Logik)
- ✅ Alle Begriffe sind regulatorisch neutral

---

## Implementierungs-Hinweise

1. **Keine Code-Änderungen** an Logik oder Datenmodell nötig
2. **Nur String-Ersetzungen** in UI-Komponenten
3. **Beide Dateien anpassen:**
   - `TemplateEditorContent.tsx`
   - `NewTemplateContent.tsx`
4. **Konsistenz prüfen:** Alle Vorkommen der alten Begriffe ersetzen


