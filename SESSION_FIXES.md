# Session & Logout Fixes

## Behobene Probleme

### 1. Session-Dauer auf 60 Minuten reduziert
**Datei**: `src/lib/super-admin-auth.ts`
- **Vorher**: `SESSION_DURATION = 60 * 60 * 24 * 7` (7 Tage)
- **Nachher**: `SESSION_DURATION = 60 * 60` (60 Minuten)

### 2. Middleware prüft explizit Ablaufzeit
**Datei**: `src/middleware-super-admin.ts`
- Explizite Prüfung der `exp`-Claim im JWT
- `jwtVerify` lehnt abgelaufene Tokens automatisch ab, aber explizite Prüfung für Klarheit

### 3. Logout-Endpoint funktioniert immer
**Datei**: `src/app/api/super-admin/auth/logout/route.ts`
- Cookie wird **IMMER** zuerst gelöscht (auch bei abgelaufener Session)
- Keine Abhängigkeit von `requireSession()` mehr
- DB-Session-Invalidierung ist optional (best effort)

### 4. Session Resolver prüft Ablaufzeit explizit
**Datei**: `src/lib/session-resolver.ts`
- Explizite Prüfung der `exp`-Claim
- Logging für Debugging (temporär)

### 5. Feature Registry verwendet apiFetch
**Datei**: `src/app/super-admin/feature-registry/FeatureRegistryContent.tsx`
- `mutate()` verwendet jetzt `apiFetch` statt `fetch`
- Konsistente 401-Behandlung

## Verhalten nach Fixes

### Session-Ablauf
- Sessions laufen nach **60 Minuten Inaktivität** ab
- Middleware lehnt abgelaufene Sessions ab
- API-Routen lehnen abgelaufene Sessions ab
- Frontend erhält 401 und leitet automatisch zu Login weiter

### Logout
- Funktioniert **IMMER**, auch bei abgelaufener Session
- Cookie wird bedingungslos gelöscht
- DB-Session wird invalidiert (wenn möglich)
- Redirect zu Login-Seite

### Feature Registry
- Nur für `super_admin` Rolle
- Keine Subscription/Trial-Prüfung
- Automatische 401-Behandlung durch `apiFetch`

## Test-Checkliste

1. ✅ Login im Super-Admin-Bereich
2. ✅ Feature Registry aufrufen (sollte funktionieren)
3. ✅ 60 Minuten warten → Session sollte abgelaufen sein
4. ✅ Nach 60 Minuten: Zugriff sollte zu Login weiterleiten
5. ✅ Logout-Button klicken → sollte zu Login weiterleiten
6. ✅ Nach Logout: Direkter Zugriff auf Dashboard sollte zu Login weiterleiten

## Wichtige Hinweise

- **Cookie-Pfad**: Alle Cookies verwenden `path: "/"` für Konsistenz
- **Cookie-Sicherheit**: `httpOnly: true`, `secure` nur in Production
- **Session-Dauer**: 60 Minuten = 3600 Sekunden
- **Auto-Logout**: Client-seitig nach 60 Minuten Inaktivität (zusätzlich zu Server-seitigem Ablauf)

