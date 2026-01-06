# Multi-Tenant-Struktur - Dokumentation

## Übersicht

Diese Dokumentation beschreibt die Multi-Tenant-Architektur von Easy Pass.

## Architektur

### Zwei Ebenen:

1. **Plattform-Ebene** (`/platform`)
   - Meta-Admin-Bereich
   - Zugriff nur für User mit `isPlatformAdmin = true`
   - Übersicht über alle Organizations und Users

2. **Organisations-Ebene** (`/app`)
   - App-Bereich für normale User
   - Zugriff nur mit gültiger Organization-Membership
   - Jeder User gehört mindestens einer Organization an

## Datenmodell

### Prisma Schema

```prisma
model User {
  id              String       @id @default(cuid())
  email           String       @unique
  password        String       // bcrypt hash
  name            String?
  isPlatformAdmin Boolean      @default(false) // Meta-Admin Flag
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  // Many-to-Many: User kann Mitglied mehrerer Organisationen sein
  memberships     Membership[]
}

model Organization {
  id        String       @id @default(cuid())
  name      String
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  // Many-to-Many: Organization hat mehrere Mitglieder
  memberships Membership[]
}

// Join-Tabelle für User ↔ Organization (Many-to-Many)
model Membership {
  id             String       @id @default(cuid())
  userId         String
  organizationId String
  createdAt      DateTime     @default(now())

  user           User         @relation(...)
  organization   Organization @relation(...)

  // Ein User kann nur einmal Mitglied einer Organisation sein
  @@unique([userId, organizationId])
}
```

### Beziehungen:

- **User ↔ Organization**: Many-to-Many über `Membership`
- **User**: Kann Mitglied mehrerer Organizations sein
- **Organization**: Kann mehrere Mitglieder haben
- **isPlatformAdmin**: Boolean-Flag am User (kein separates Rollensystem)

## Routing-Logik

### Middleware (`src/middleware.ts`)

Die Middleware prüft jede Route und leitet entsprechend um:

#### 1. Öffentliche Routen
- `/` - Landingpage
- `/login` - Login-Seite
- `/signup` - Signup-Seite

#### 2. Platform-Routen (`/platform/*`)
- **Zugriff**: Nur für User mit `isPlatformAdmin = true`
- **Wenn nicht autorisiert**: Redirect zu `/app/dashboard`

#### 3. App-Routen (`/app/*`)
- **Zugriff**: Nur für eingeloggte User mit mindestens einer Organization-Membership
- **Wenn nicht autorisiert**: Redirect zu `/login`

#### 4. Login/Signup-Redirect
- Wenn bereits eingeloggt: Redirect zu `/app/dashboard`

## Access-Checks

### Helper-Funktionen (`src/lib/access.ts`)

#### `isPlatformAdmin()`
Prüft ob User Platform-Admin ist.

```typescript
const isAdmin = await isPlatformAdmin()
```

#### `isOrganizationMember(organizationId)`
Prüft ob User Mitglied einer spezifischen Organization ist.

```typescript
const isMember = await isOrganizationMember(orgId)
```

#### `getUserOrganizations()`
Holt alle Organizations, in denen der User Mitglied ist.

```typescript
const orgs = await getUserOrganizations()
```

#### `requirePlatformAdmin(redirectTo?)`
Prüft Platform-Admin-Zugriff und leitet um wenn nicht autorisiert.

```typescript
await requirePlatformAdmin() // Redirect zu /app/dashboard
await requirePlatformAdmin("/custom") // Redirect zu /custom
```

#### `requireOrganizationMember(organizationId, redirectTo?)`
Prüft Organization-Membership und leitet um wenn nicht autorisiert.

```typescript
await requireOrganizationMember(orgId)
```

## Signup-Flow

### Automatische Organization-Erstellung

Beim Signup wird automatisch:

1. **User erstellt** (mit gehashtem Passwort)
2. **Organization erstellt** (Name = User-Name oder E-Mail-Prefix)
3. **Membership erstellt** (User wird Mitglied der neuen Organization)

```typescript
// In createUser() in src/auth.ts
const user = await prisma.user.create({ ... })
const organization = await prisma.organization.create({ ... })
await prisma.membership.create({ ... })
```

**Ergebnis**: Jeder neue User hat automatisch eine eigene Organization.

## Dateien-Struktur

### Neue/Geänderte Dateien:

```
src/
├── lib/
│   └── access.ts                    # Access-Control Helper-Funktionen
├── app/
│   ├── platform/
│   │   ├── layout.tsx               # Platform-Layout (geschützt)
│   │   └── page.tsx                 # Platform-Übersicht
│   └── app/
│       ├── layout.tsx               # Erweitert (zeigt Organizations)
│       └── dashboard/
│           └── page.tsx             # Erweitert (zeigt Organizations)

prisma/
└── schema.prisma                    # Erweitert (Organization, Membership)

src/
├── auth.ts                          # Erweitert (isPlatformAdmin in Session)
├── middleware.ts                    # Erweitert (Platform- & App-Route-Protection)
└── types/
    └── next-auth.d.ts               # Erweitert (isPlatformAdmin Typen)
```

## Verwendung im Code

### Platform-Admin-Check (Server Component)

```typescript
import { requirePlatformAdmin } from "@/lib/access"

export default async function PlatformPage() {
  await requirePlatformAdmin() // Leitet um wenn nicht autorisiert
  
  return <div>Platform-Content</div>
}
```

### Organization-Membership-Check

```typescript
import { getUserOrganizations } from "@/lib/access"

export default async function AppPage() {
  const organizations = await getUserOrganizations()
  
  return <div>
    {organizations.map(org => (
      <div key={org.id}>{org.name}</div>
    ))}
  </div>
}
```

### Platform-Admin-Flag in Session

```typescript
import { auth } from "@/auth"

export default async function Component() {
  const session = await auth()
  
  if (session?.user?.isPlatformAdmin) {
    // User ist Platform-Admin
  }
}
```

## Setup

### 1. Datenbank aktualisieren

Da das Schema erweitert wurde:

```bash
# Prisma Client neu generieren
npx prisma generate

# Datenbank Schema pushen
npx prisma db push
```

### 2. Platform-Admin erstellen

Um einen User zum Platform-Admin zu machen:

```typescript
// In Prisma Studio oder direkt in der DB
await prisma.user.update({
  where: { email: "admin@example.com" },
  data: { isPlatformAdmin: true }
})
```

Oder direkt in SQLite:

```sql
UPDATE users SET isPlatformAdmin = 1 WHERE email = 'admin@example.com';
```

## Wichtige Hinweise

1. **Kein Rollensystem**: Nur `isPlatformAdmin` Flag, keine komplexen Rollen
2. **Keine Lieferanten**: Fokus auf Organizations, keine zusätzlichen Entitäten
3. **Automatische Organization**: Jeder User bekommt beim Signup eine eigene Organization
4. **Many-to-Many**: User können Mitglied mehrerer Organizations sein
5. **Middleware-Protection**: Alle Routen werden automatisch geschützt

## Erweiterungsmöglichkeiten

- [ ] Organization-Rollen (z.B. Owner, Member)
- [ ] Invite-System für Organizations
- [ ] Organization-Switching (User wählt aktive Organization)
- [ ] Organization-Settings
- [ ] Billing pro Organization

