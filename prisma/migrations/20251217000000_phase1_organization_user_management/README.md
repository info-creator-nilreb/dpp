# Phase 1: Organization & User Management Migration

## Übersicht

Diese Migration implementiert die strukturellen Grundlagen für Phase 1:
- Erweiterte User-Felder (firstName, lastName, status, etc.)
- Organisation Company Details & Billing Information
- Invitations-System
- Join Requests-System
- Notifications-System
- User-Organisation 1:N Beziehung

## Änderungen

### 1. User Model Extensions
- `firstName`, `lastName` (zusätzlich zu `name` für Kompatibilität)
- `status` (active | invited | suspended)
- `lastLoginAt`
- `jobTitle`, `phone`, `preferredLanguage`, `timeZone`
- `organizationId` (Foreign Key zu Organization)

### 2. Organization Model Extensions
- **Company Details**: `legalName`, `companyType`, `vatId`, `commercialRegisterId`, Adressfelder, `country`
- **Billing Information**: `billingEmail`, `billingContactUserId`, Rechnungsadresse, `billingCountry`

### 3. Membership Updates
- Default-Rolle geändert von `ORG_MEMBER` zu `VIEWER`
- Index auf `role` hinzugefügt

### 4. Neue Tabellen
- **invitations**: Einladungen per E-Mail
- **join_requests**: Beitrittsanfragen
- **notifications**: To-Do-Benachrichtigungen

### 5. Data Migration
- Bestehende User: `organizationId` wird aus Memberships migriert
- `name` wird in `firstName`/`lastName` aufgeteilt
- Bestehende User erhalten Status `active`

## Wichtig

- Migration ist **idempotent** (kann mehrfach ausgeführt werden)
- Verwendet `IF NOT EXISTS` für alle CREATE-Statements
- Bestehende Daten bleiben erhalten
- Foreign Keys verwenden `ON DELETE SET NULL` oder `CASCADE` je nach Kontext

## Anwenden

```bash
# Development
npx prisma migrate dev

# Production (mit Backup!)
npx prisma migrate deploy
```

## Rollback

Falls ein Rollback nötig ist, müssen die Tabellen und Spalten manuell entfernt werden.
**WICHTIG**: Erstelle vorher ein Backup!

