# Abrechnungsbereich – User Stories

**Sprache:** Deutsch  
**Nutzerbereich:** „Abrechnung“ (Organisation → Abrechnung)  
**Super-Admin:** „Abrechnung & Erlöse“

---

## A) Organisations-Nutzer (Owner/Admin)

| ID | Story | Priorität |
|----|--------|-----------|
| O-1 | **Rechnungen einsehen** – Als Owner/Admin möchte ich alle Rechnungen meiner Organisation in einer Liste sehen (Rechnungsnummer, Zeitraum, Datum, Beträge, Status), damit ich den Überblick behalte. | MVP |
| O-2 | **Rechnungen herunterladen (PDF)** – Als Owner/Admin möchte ich eine Rechnung als PDF herunterladen können, damit ich sie archivieren oder weiterleiten kann. | MVP |
| O-3 | **Zahlungsstatus prüfen** – Als Owner/Admin möchte ich pro Rechnung den Zahlungsstatus (offen, bezahlt, fehlgeschlagen, storniert) sehen, damit ich weiß, ob Handlungsbedarf besteht. | MVP |
| O-4 | **Aktuellen Tarif sehen** – Als Owner/Admin möchte ich auf der Abrechnungs-Übersicht meinen aktuellen Tarif (Plan + Intervall) sehen, damit ich meine Kosten einordnen kann. | MVP |
| O-5 | **Abrechnungszeitraum verstehen** – Als Owner/Admin möchte ich den aktuellen Abrechnungszeitraum und das nächste Abrechnungsdatum sehen, damit ich planen kann. | MVP |
| O-6 | **Zusatznutzung nachvollziehen** – Als Owner/Admin möchte ich nachvollziehen können, ob und welche Zusatznutzung (Overage) in einer Rechnung enthalten ist. | Phase 2 |
| O-7 | **Zahlungsmethode einsehen** – Als Owner/Admin möchte ich sehen, welche Zahlungsmethode hinterlegt ist (z. B. Karte, SEPA), damit ich sie bei Bedarf anpassen kann. | MVP |
| O-8 | **Offene Beträge erkennen** – Als Owner/Admin möchte ich auf der Übersicht offene Beträge bzw. eine Warnung bei offenen Rechnungen sehen, damit ich rechtzeitig zahlen kann. | MVP |

**RBAC:** Nur **Owner (ORG_ADMIN)** und ggf. Admin – in DPP: **ORG_ADMIN** (canEditBilling = Abrechnung einsehen & bearbeiten). VIEWER/EDITOR haben keinen Zugriff auf Abrechnung.

---

## B) Super-Admin (Abrechnung & Erlöse)

| ID | Story | Priorität |
|----|--------|-----------|
| S-1 | **Systemweite Übersicht über Umsätze** – Als Super-Admin möchte ich MRR, ARR, aktive Abos, Kündigungen auf einen Blick sehen, damit ich die Erlössituation beurteilen kann. | MVP |
| S-2 | **Offene Forderungen erkennen** – Als Super-Admin möchte ich sehen, welche Organisationen offene Rechnungen haben und über welchen Betrag, damit ich Mahnwesen steuern kann. | MVP |
| S-3 | **Fehlgeschlagene Zahlungen sehen** – Als Super-Admin möchte ich fehlgeschlagene Zahlungen (Status failed) systemweit sehen, damit ich eingreifen oder Support anbieten kann. | MVP |
| S-4 | **Rechnungen einzelner Organisationen einsehen** – Als Super-Admin möchte ich in der Organisations-Detailansicht alle Rechnungen einer Organisation sehen (wie der Org-Admin, aber für jede Org). | MVP |
| S-5 | **Rechnung erneut versenden** – Als Super-Admin möchte ich eine Rechnung erneut an die Rechnungs-E-Mail senden können, damit der Kunde sie erhält. | MVP |
| S-6 | **Zahlung manuell als bezahlt markieren** – Als Super-Admin möchte ich eine Zahlung/Rechnung manuell als „bezahlt“ markieren können (z. B. bei Barzahlung oder Banküberweisung). | MVP |
| S-7 | **Gutschrift erstellen** – Als Super-Admin möchte ich eine Gutschrift zu einer Rechnung oder pauschal für eine Organisation erstellen können. | Phase 2 |
| S-8 | **Rabatt hinterlegen** – Als Super-Admin möchte ich einen prozentualen Rabatt auf die Subscription einer Organisation hinterlegen können. | Phase 2 |
| S-9 | **Tarif wechseln** – Als Super-Admin möchte ich den Tarif (Plan/Intervall) einer Organisation ändern können (z. B. Upgrade/Downgrade). | MVP |
| S-10 | **Webhook-/Zahlungshistorie einsehen** – Als Super-Admin möchte ich Billing-Events (Webhooks, Zahlungseingänge) pro Organisation oder systemweit einsehen können, um Fehler zu debuggen. | MVP |

**Ergänzung (Skalierung):** Trial verlängern (bereits in Org-Detail vorhanden), Rechnungsnummern-Konfiguration, Multi-Currency.

---

## Priorisierung (Zusammenfassung)

- **MVP:** O-1 bis O-5, O-7, O-8 | S-1 bis S-6, S-9, S-10  
- **Phase 2:** O-6 (Zusatznutzung) | S-7 (Gutschrift), S-8 (Rabatt)  
- **Skalierung:** Weitere Metriken, Mahnläufe, Multi-Währung, erweiterte Exporte

---

## Akzeptanzkriterien (Beispiele MVP)

- **O-1:** Tabelle „Rechnungen“ mit Spalten: Rechnungsnummer, Zeitraum (von–bis), Rechnungsdatum, Nettobetrag, MwSt, Gesamtbetrag, Status, Aktion „Download“. Nur Rechnungen der eigenen Organisation.  
- **O-2:** Button „PDF herunterladen“ lädt die Rechnung als PDF (systemseitig gespeichert oder On-the-fly generiert).  
- **S-1:** Dashboard-Bereich „Abrechnung & Erlöse“ mit Kacheln: MRR, ARR, Aktive Abos, Kündigungen, Offene Forderungen, Fehlgeschlagene Zahlungen (Werte aus echten Daten, keine Mocks).  
- **S-6:** Aktion „Als bezahlt markieren“ setzt Rechnungs-Status auf `paid` und erzeugt ggf. einen Payment-Eintrag; Audit/Log wird geschrieben.

Diese User Stories bilden die Grundlage für Datenmodell, UI-Struktur und Implementierung.
