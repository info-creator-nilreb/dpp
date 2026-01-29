-- CreateTable: PollResponse
-- Diese Tabelle speichert Antworten auf Multi-Question Polls
-- pollBlockId ist die ID des Poll-Blocks im DppContent.blocks JSON-Array (keine Foreign Key Relation)
-- 
-- WICHTIG: Diese Migration funktioniert auch auf einer leeren Shadow-Datenbank
-- Die Foreign Key Constraint wird nur erstellt, wenn die dpps Tabelle existiert

-- Erstelle Tabelle nur wenn sie nicht existiert
CREATE TABLE IF NOT EXISTS "poll_responses" (
    "id" TEXT NOT NULL,
    "pollBlockId" TEXT NOT NULL,
    "dppId" TEXT NOT NULL,
    "responses" JSONB NOT NULL,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_responses_pkey" PRIMARY KEY ("id")
);

-- Erstelle Indizes nur wenn sie nicht existieren
DO $$ 
BEGIN
  -- Index auf pollBlockId
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'poll_responses' 
    AND indexname = 'poll_responses_pollBlockId_idx'
  ) THEN
    CREATE INDEX "poll_responses_pollBlockId_idx" ON "poll_responses"("pollBlockId");
  END IF;

  -- Index auf dppId
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'poll_responses' 
    AND indexname = 'poll_responses_dppId_idx'
  ) THEN
    CREATE INDEX "poll_responses_dppId_idx" ON "poll_responses"("dppId");
  END IF;

  -- Index auf dppId und pollBlockId
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'poll_responses' 
    AND indexname = 'poll_responses_dppId_pollBlockId_idx'
  ) THEN
    CREATE INDEX "poll_responses_dppId_pollBlockId_idx" ON "poll_responses"("dppId", "pollBlockId");
  END IF;
END $$;

-- AddForeignKey: PollResponse -> Dpp
-- WICHTIG: Foreign Key wird nur erstellt, wenn dpps Tabelle existiert
-- Dies verhindert Fehler auf leeren Shadow-Datenbanken
DO $$ 
BEGIN
  -- Prüfe ob dpps Tabelle existiert
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'dpps'
  ) THEN
    -- Prüfe ob Foreign Key bereits existiert
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'poll_responses_dppId_fkey'
    ) THEN
      -- Erstelle Foreign Key
      ALTER TABLE "poll_responses" 
      ADD CONSTRAINT "poll_responses_dppId_fkey" 
      FOREIGN KEY ("dppId") REFERENCES "dpps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END IF;
END $$;
