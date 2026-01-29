# Authentifizierung - Dokumentation

## Übersicht

Diese Dokumentation beschreibt die Auth.js (NextAuth.js) Implementierung für Easy Pass.

## Architektur

### Technologie-Stack
- **NextAuth.js v5** (Auth.js) - Authentifizierung
- **Prisma** - ORM für Datenbankzugriffe
- **bcryptjs** - Passwort-Hashing
- **SQLite** - Datenbank (MVP, später auf PostgreSQL umstellbar)

## Dateien-Struktur

### Neue/Geänderte Dateien

```
src/
├── auth.ts                          # NextAuth.js Konfiguration
├── middleware.ts                    # Route Protection
├── lib/
│   └── prisma.ts                    # Prisma Client Singleton
├── types/
│   └── next-auth.d.ts               # TypeScript-Typen
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── [...nextauth]/
│   │       │   └── route.ts         # NextAuth API Route
│   │       └── signup/
│   │           └── route.ts         # Signup API Route
│   ├── login/
│   │   └── page.tsx                 # Login-Seite (bereits vorhanden)
│   ├── signup/
│   │   └── page.tsx                 # Signup-Seite (bereits vorhanden)
│   └── app/
│       ├── layout.tsx               # Geschützter App-Layout
│       └── dashboard/
│           └── page.tsx             # Dashboard (geschützt)

prisma/
└── schema.prisma                    # Datenbankschema
```

## Auth-Flow

### 1. Signup-Flow

```
User → /signup (Seite)
  ↓
Formular ausfüllen (E-Mail, Passwort, Name)
  ↓
POST /api/auth/signup
  ↓
Validierung (E-Mail vorhanden?, Passwort ≥8 Zeichen?)
  ↓
Prüfung: E-Mail bereits registriert?
  ↓
createUser() → bcrypt.hash() → Prisma User.create()
  ↓
Response: { message: "Konto erfolgreich erstellt" }
  ↓
User wird zu /login weitergeleitet
```

### 2. Login-Flow

```
User → /login (Seite)
  ↓
Formular ausfüllen (E-Mail, Passwort)
  ↓
signIn("credentials", { email, password })
  ↓
NextAuth → authorize() in auth.ts
  ↓
Prisma: User.findUnique({ email })
  ↓
bcrypt.compare(password, user.password)
  ↓
Wenn gültig: Session erstellen (JWT)
  ↓
Redirect → /app/dashboard
```

### 3. Geschützte Routen

```
User versucht /app/* zu besuchen
  ↓
middleware.ts prüft: req.auth vorhanden?
  ↓
Wenn NEIN → Redirect zu /login
  ↓
Wenn JA → Route freigeben
```

### 4. Logout-Flow

```
User klickt "Abmelden" Button
  ↓
Server Action: signOut({ redirectTo: "/login" })
  ↓
Session wird gelöscht
  ↓
Redirect → /login
```

## Sicherheit

### Passwort-Hashing
- **Algorithmus**: bcrypt
- **Runden**: 10 (gute Balance zwischen Sicherheit und Performance)
- **Speicherung**: Nur Hash wird in DB gespeichert, niemals Klartext

### Session-Management
- **Strategie**: JWT (JSON Web Tokens)
- **Vorteil**: Keine DB-Sessions nötig, skalierbar
- **Speicherung**: Im Browser (Cookie)

### Route Protection
- **Middleware**: Prüft jede Route (außer API/Static)
- **Geschützte Routen**: `/app/*`
- **Öffentliche Routen**: `/`, `/login`, `/signup`

## Datenbank-Schema

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt hash
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Einfach & Minimal**: Nur User-Modell, keine Organisationen, keine Rollen.

## API-Endpunkte

### POST /api/auth/signup
Erstellt einen neuen User.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "Max Mustermann" // optional
}
```

**Response (201):**
```json
{
  "message": "Konto erfolgreich erstellt",
  "userId": "clx..."
}
```

**Fehler (400):**
```json
{
  "error": "E-Mail und Passwort sind erforderlich"
}
// oder
{
  "error": "Passwort muss mindestens 8 Zeichen lang sein"
}
// oder
{
  "error": "Diese E-Mail ist bereits registriert"
}
```

### GET/POST /api/auth/[...nextauth]
NextAuth.js API Route (automatisch generiert).

## Setup

### 1. Umgebungsvariablen

Erstelle `.env` Datei:

```env
# NextAuth.js Secret (generiere mit: openssl rand -base64 32)
AUTH_SECRET=your-secret-key-here

# Datenbank
DATABASE_URL="file:./dev.db"
```

### 2. Datenbank initialisieren

```bash
# Prisma Client generieren
npx prisma generate

# Datenbank erstellen & Schema pushen
npx prisma db push
```

### 3. Server starten

```bash
npm run dev
```

## Verwendung im Code

### Session in Server Components

```typescript
import { auth } from "@/auth"

export default async function Page() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }
  
  return <div>Hallo {session.user?.email}</div>
}
```

### Session in Client Components

```typescript
"use client"
import { useSession } from "next-auth/react"

export default function Component() {
  const { data: session } = useSession()
  
  if (!session) return <div>Nicht eingeloggt</div>
  
  return <div>Hallo {session.user?.email}</div>
}
```

### Sign In (Client)

```typescript
"use client"
import { signIn } from "next-auth/react"

await signIn("credentials", {
  email: "user@example.com",
  password: "password123",
  redirect: true
})
```

### Sign Out (Server Action)

```typescript
import { signOut } from "@/auth"

<form action={async () => {
  "use server"
  await signOut({ redirectTo: "/login" })
}}>
  <button type="submit">Abmelden</button>
</form>
```

## Wichtige Hinweise

1. **Landingpage bleibt unverändert**: `/` ist öffentlich zugänglich
2. **Keine Organisationen**: Einfaches User-Modell, keine Multi-Tenancy
3. **Keine Rollen**: Alle User haben gleiche Rechte (MVP)
4. **JWT Sessions**: Keine DB-Sessions, besser skalierbar
5. **Middleware**: Schützt automatisch alle `/app/*` Routen

## Nächste Schritte (Optional)

- [ ] E-Mail-Verifizierung
- [ ] Passwort-Reset
- [ ] Remember Me Funktion
- [ ] 2FA (Two-Factor Authentication)
- [ ] OAuth Provider (Google, GitHub, etc.)

