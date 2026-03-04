# Abrechnungsbereich – Testen

## Wo testen?

1. **Super-Admin einloggen**  
   `/super-admin/login`

2. **Abrechnung & Erlöse**  
   `/super-admin/billing`  
   - Tab **Kennzahlen:** MRR, ARR, Offene Forderungen, Fehlgeschlagene Zahlungen  
   - Tab **Rechnungen:** alle Rechnungen, Buttons „Als bezahlt“ und „Rechnung versenden“  
   - Tab **Ereignisprotokoll:** chronologische Abrechnungs- und Zahlungsereignisse

3. **Eine Organisation → Tab „Abrechnung“**  
   - Navigation: Super-Admin → Organisationen → Organisation wählen → Tab **Abrechnung**  
   - Oder direkt: `/super-admin/organizations/[ORGANISATION_ID]?tab=billing`  
   - Dort: Rechnungen mit Aktionen, Gutschriften, Rabatt, Ereignisprotokoll Abrechnung

4. **Nutzerbereich (Org-Admin)**  
   `/app/organization/billing`  
   - Nur sichtbar für Nutzer mit Abrechnungsrecht (ORG_ADMIN). Zeigt Übersicht und Rechnungen der eigenen Organisation.

---

## Keine Daten? Testdaten anlegen

Wenn noch keine Rechnungen existieren, eine **Test-Rechnung** (Status „offen“) und ein **Billing-Event** anlegen:

```bash
npm run seed:billing
```

(Oder manuell: `node --env-file=.env scripts/seed-billing-test-data.mjs` – aus dem Projektroot, damit `DATABASE_URL` aus `.env` geladen wird.)

Ohne `--env-file` (z. B. ältere Node-Version):

```bash
export $(grep -v '^#' .env | xargs)
node scripts/seed-billing-test-data.mjs
```

Optional: Nur für eine bestimmte Organisation:

```bash
BILLING_SEED_ORGANIZATION_ID=clxy... node --env-file=.env scripts/seed-billing-test-data.mjs
```

Das Script nutzt die erste Organisation in der DB (oder die mit `BILLING_SEED_ORGANIZATION_ID`), legt eine offene Rechnung mit zwei Positionen an und ein Event `invoice.created`. Danach kannst du unter **Super-Admin → Abrechnung & Erlöse** (Tabs Rechnungen / Ereignisprotokoll) bzw. **Organisation → Abrechnung** „Als bezahlt“, „Rechnung versenden“ und das Ereignisprotokoll testen.

**Rechnung versenden:** Funktioniert nur, wenn die Organisation eine **Rechnungs-E-Mail** hat (unter Super-Admin → Organisation → Rechnungsinformationen / Company Details).
