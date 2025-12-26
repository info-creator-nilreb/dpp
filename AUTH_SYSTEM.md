# Authentication & Authorization System

## Übersicht

Dieses Dokument beschreibt das zentrale Authentifizierungs- und Autorisierungssystem für die B2B SaaS Anwendung.

## Architektur

### 1. Central Session Resolver (`src/lib/session-resolver.ts`)

**Zweck**: Einzige Quelle für Session-Auflösung. Alle API-Routen verwenden diese Funktion.

**Funktionen**:
- `resolveSession()`: Liest und validiert Session/JWT aus Cookies
- `resolveSessionWithDebug()`: Wie oben, mit Debug-Informationen

**Wichtig**: Keine Route sollte manuell Tokens lesen - immer `resolveSession()` verwenden.

### 2. Authorization Guards (`src/lib/auth-guards.ts`)

**Strikte Trennung der Verantwortlichkeiten**:

#### `requireSession()`
- Prüft, ob Session existiert und gültig ist
- **KEINE** Rollenprüfung
- Gibt User zurück oder wirft Fehler

#### `requireRole(session, role)`
- Setzt voraus, dass Session existiert (erst `requireSession()` aufrufen)
- Prüft nur die Rolle

#### `requireSessionApi()` / `requireSessionAndRoleApi()`
- Wrapper für API-Routen mit automatischer Fehlerbehandlung
- Gibt `NextResponse` bei Fehlern zurück

**Verwendungsbeispiele**:

```typescript
// ✅ KORREKT: Feature Registry
export async function GET() {
  const session = await requireSessionAndRoleApi("super_admin");
  if (session instanceof NextResponse) return session;
  // Session ist gültig und User ist super_admin
}

// ✅ KORREKT: Logout (keine Rollenprüfung!)
export async function POST() {
  const session = await requireSession(); // Keine Rolle prüfen!
  await destroySession();
  return NextResponse.json({ success: true });
}

// ❌ FALSCH: Rollenprüfung im Logout
export async function POST() {
  const session = await requireSession();
  requireRole(session, "super_admin"); // FALSCH!
}

// ❌ FALSCH: Subscription-Prüfung in Feature Registry
export async function GET() {
  const session = await requireSession();
  const subscription = await getSubscription(session.id); // FALSCH!
  if (subscription.status !== "active") { // FALSCH!
    return NextResponse.json({ error: "..." }, { status: 403 });
  }
}
```

### 3. Logout Endpoint (`src/app/api/super-admin/auth/logout/route.ts`)

**Harte Anforderung**: Logout muss IMMER funktionieren, wenn eine Session existiert.

**Eigenschaften**:
- Löscht Cookies/Tokens bedingungslos
- Funktioniert auch bei abgelaufenen/ungültigen Sessions
- Wirft **NIE** 401 selbst
- Prüft **KEINE** Rolle (jeder mit Session kann sich abmelden)

### 4. Global 401 Handler (`src/lib/api-client.ts`)

**Zweck**: Interceptiert alle API-Aufrufe und behandelt 401-Antworten global.

**Funktionalität**:
- Erkennt HTTP 401 Responses
- Löscht sofort Client-Auth-State
- Ruft Logout-Endpoint auf (best effort)
- Leitet zu `/login` weiter
- Verhindert Endlosschleifen

**Verwendung**:
```typescript
import { apiFetch } from "@/lib/api-client";

// Statt fetch() verwenden:
const response = await apiFetch("/api/endpoint", {
  method: "GET",
});
```

### 5. Auto Logout nach 60 Minuten (`src/hooks/useAutoLogout.ts`)

**Client-seitige Inaktivitäts-Erkennung**:
- Verfolgt Maus-, Tastatur-, Navigations-Events
- Setzt Timer bei Aktivität zurück
- Nach 60 Minuten ohne Aktivität:
  - Ruft Logout auf
  - Leitet zu Login weiter

**Integration**:
```typescript
// In Layout-Komponenten:
import { AutoLogoutProvider } from "@/components/AutoLogoutProvider";

export default function Layout({ children }) {
  return (
    <>
      <AutoLogoutProvider />
      {children}
    </>
  );
}
```

### 6. Feature Registry Access

**Regeln**:
- **NICHT** abhängig von Subscription-Status
- **NICHT** abhängig von Trial-Status
- **NUR** prüft:
  - Gültige Session
  - `super_admin` Rolle

**Implementierung**:
```typescript
export async function GET() {
  const session = await requireSessionAndRoleApi("super_admin");
  if (session instanceof NextResponse) return session;
  // Weiter mit Feature Registry Logik
}
```

## Migration Guide

### Bestehende API-Routen aktualisieren

**Vorher**:
```typescript
export async function GET() {
  const session = await getSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ...
}
```

**Nachher**:
```typescript
import { requireSessionAndRoleApi } from "@/lib/auth-guards";

export async function GET() {
  const session = await requireSessionAndRoleApi("super_admin");
  if (session instanceof NextResponse) return session;
  // ...
}
```

### Frontend API-Aufrufe aktualisieren

**Vorher**:
```typescript
const response = await fetch("/api/endpoint", {
  credentials: "include",
});
```

**Nachher**:
```typescript
import { apiFetch } from "@/lib/api-client";

const response = await apiFetch("/api/endpoint");
```

## Debugging Aids (Temporär)

Die folgenden Debug-Logs sind temporär und sollten vor Production entfernt werden:

1. **Session Resolver** (`src/lib/session-resolver.ts`):
   - Loggt aufgelöste Session mit Email, Rolle, Ablaufzeit

2. **Feature Registry** (`src/app/api/super-admin/feature-registry/route.ts`):
   - Loggt Session-Info bei jedem Request

3. **Logout** (`src/app/super-admin/components/Sidebar.tsx`):
   - Loggt Logout-Ausführung und Response-Status

**Entfernen vor Production**: Alle `console.log()` Statements mit `[Session Resolver]`, `[Feature Registry]`, `[Logout]` Präfixen.

## Wichtige Regeln

1. **Logout muss immer funktionieren**: Keine Rollenprüfung, keine Subscription-Prüfung
2. **Feature Registry nur für super_admin**: Keine Subscription/Trial-Prüfung
3. **401 = sofortiger Logout**: Frontend leitet automatisch weiter
4. **Keine "Zombie"-Sessions**: Session Resolver prüft Ablaufzeit
5. **Zentrale Session-Auflösung**: Keine Route liest manuell Tokens

## Fehlerbehandlung

### 401 Unauthorized
- Frontend: Automatischer Logout + Redirect zu Login
- Backend: Session ist ungültig oder abgelaufen

### 403 Forbidden
- Backend: Session ist gültig, aber Rolle ist nicht ausreichend
- Frontend: Zeige Fehlermeldung (kein automatischer Logout)

### Session abgelaufen
- Session Resolver gibt `null` zurück
- Guards werfen "Unauthorized" Fehler
- Frontend erhält 401 und leitet weiter

