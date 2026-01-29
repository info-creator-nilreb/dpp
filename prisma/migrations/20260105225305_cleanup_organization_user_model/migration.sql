-- Migration: Bereinigung des Organisations- und Nutzermodells
-- Ziel: Membership als einzige Quelle der Wahrheit etablieren
-- Datum: 2026-01-05

-- ============================================
-- SCHRITT 1: Doppelte Memberships entfernen (behalte die älteste)
-- ============================================

-- HINWEIS: DELETE-Statement auskommentiert, um Daten zu erhalten
-- Falls Duplikate entfernt werden sollen, kann dies manuell oder über die Anwendung erfolgen
-- 
-- Entferne doppelte Memberships (gleicher userId + organizationId)
-- Behalte die älteste Membership (nach createdAt)
-- DELETE FROM "memberships" m1
-- WHERE EXISTS (
--     SELECT 1 FROM "memberships" m2
--     WHERE m2."userId" = m1."userId"
--       AND m2."organizationId" = m1."organizationId"
--       AND m2."id" != m1."id"
--       AND m2."createdAt" < m1."createdAt"
-- );

-- ============================================
-- SCHRITT 2: Doppelte Nutzer mit identischer E-Mail zusammenführen
-- ============================================

-- Hinweis: Diese Logik ist komplex und sollte manuell überprüft werden
-- Für jetzt: Stelle sicher, dass keine doppelten Memberships für dieselbe E-Mail in derselben Organisation existieren
-- Die eigentliche Zusammenführung sollte über die Anwendung erfolgen

-- Finde und markiere potenzielle Duplikate (nur zur Information, keine Aktion)
-- Diese sollten manuell überprüft werden

-- ============================================
-- SCHRITT 3: User.organizationId aus der ersten Membership ableiten (Cache)
-- ============================================

-- Stelle sicher, dass die Spalte organizationId existiert
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.columns 
       WHERE table_name = 'users' AND column_name = 'organizationId'
     ) THEN
    ALTER TABLE "users" ADD COLUMN "organizationId" TEXT;
  END IF;
END $$;

-- Setze organizationId für jeden Nutzer basierend auf seiner ersten Membership
-- (nur wenn die Spalte existiert)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'organizationId'
  ) THEN
    UPDATE "users" u
    SET "organizationId" = (
        SELECT m."organizationId"
        FROM "memberships" m
        WHERE m."userId" = u."id"
        ORDER BY m."createdAt" ASC
        LIMIT 1
    )
    WHERE EXISTS (
        SELECT 1 FROM "memberships" m WHERE m."userId" = u."id"
    );
  END IF;
END $$;

-- ============================================
-- SCHRITT 4: Sicherstellen, dass jede Organisation mindestens eine Membership hat
-- ============================================

-- HINWEIS: DELETE-Statement auskommentiert, um Daten zu erhalten
-- Organisationen ohne Memberships werden nicht gelöscht
-- Falls diese entfernt werden sollen, kann dies manuell erfolgen
--
-- Finde Organisationen ohne Memberships (sollten nicht existieren, aber sicherheitshalber)
-- Diese werden gelöscht, da sie gegen die Geschäftsregel verstoßen
-- DELETE FROM "organizations"
-- WHERE "id" NOT IN (
--     SELECT DISTINCT "organizationId" FROM "memberships"
-- );

-- ============================================
-- SCHRITT 5: Index für bessere Performance hinzufügen
-- ============================================

-- Index für schnelle Abfragen der Team-Mitglieder (bereits in Schema definiert, aber sicherheitshalber)
CREATE INDEX IF NOT EXISTS "memberships_organizationId_idx" ON "memberships"("organizationId");

-- ============================================
-- SCHRITT 6: Validierung - Prüfe Konsistenz
-- ============================================

-- Prüfe, ob es noch doppelte Memberships gibt (nur Warnung, kein Fehler)
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT "userId", "organizationId", COUNT(*) as cnt
        FROM "memberships"
        GROUP BY "userId", "organizationId"
        HAVING COUNT(*) > 1
    ) duplicates;

    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Hinweis: Es existieren noch % doppelte Memberships. Diese können manuell bereinigt werden.', duplicate_count;
    END IF;
END $$;

-- Prüfe, ob alle Organisationen mindestens eine Membership haben (nur Warnung, kein Fehler)
DO $$
DECLARE
    orgs_without_members INTEGER;
BEGIN
    SELECT COUNT(*) INTO orgs_without_members
    FROM "organizations" o
    WHERE NOT EXISTS (
        SELECT 1 FROM "memberships" m WHERE m."organizationId" = o."id"
    );

    IF orgs_without_members > 0 THEN
        RAISE NOTICE 'Hinweis: % Organisationen haben keine Memberships. Diese können manuell bereinigt werden.', orgs_without_members;
    END IF;
END $$;

