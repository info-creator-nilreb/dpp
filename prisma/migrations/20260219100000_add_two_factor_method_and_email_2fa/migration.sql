-- 2FA für alle User: Methode (totp | email) + E-Mail-Code-Felder

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "twoFactorMethod" TEXT,
  ADD COLUMN IF NOT EXISTS "email2FACodeHash" TEXT,
  ADD COLUMN IF NOT EXISTS "email2FACodeExpiresAt" TIMESTAMP(3);
