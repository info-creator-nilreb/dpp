-- EU-weite DPP-Lösung: EORI und Land der Registrierung für Organisationen
-- Nur ergänzend: neue Spalten hinzufügen, keine bestehenden Daten ändern oder löschen.

ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "eori" TEXT,
  ADD COLUMN IF NOT EXISTS "registrationCountry" TEXT;
