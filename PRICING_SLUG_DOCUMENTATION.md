# Slug - Erklärung und Verwendung

## Was ist ein Slug?

Ein **Slug** ist eine URL-freundliche, lesbare Version eines Namens oder Titels. Er wird verwendet, um Ressourcen in URLs zu identifizieren, ohne die komplexe ID zu verwenden.

### Beispiel

- **Name**: "Professional Plan"
- **Slug**: `professional-plan`

- **Name**: "Enterprise Lösung mit Premium Support"
- **Slug**: `enterprise-loesung-mit-premium-support`

## Verwendung im Pricing System

### 1. Eindeutige Identifikation

Der Slug ist **eindeutig** (`@unique` in Prisma Schema) und dient als:
- **Technischer Identifier** für Pricing Plans
- **URL-freundlicher Name** (keine Sonderzeichen, nur Kleinbuchstaben, Bindestriche)
- **Menschlich lesbar** (im Gegensatz zu IDs wie `cmj4e5fpd0001pgg8sjuj4xvd`)

### 2. Automatische Generierung

Beim Erstellen eines neuen Pricing Plans wird der Slug automatisch aus dem Namen generiert:

```typescript
const generateSlug = (name: string) => {
  return name
    .toLowerCase()                    // Alles in Kleinbuchstaben
    .replace(/[^a-z0-9]+/g, "-")    // Sonderzeichen durch Bindestriche ersetzen
    .replace(/^-+|-+$/g, "")         // Führende/abschließende Bindestriche entfernen
}
```

**Beispiele:**
- "Basic Plan" → `basic-plan`
- "Pro Plan 2024" → `pro-plan-2024`
- "Enterprise Lösung" → `enterprise-loesung`

### 3. Manuelle Bearbeitung

Der Slug kann auch manuell bearbeitet werden, falls die automatische Generierung nicht passt:

- **Name**: "Premium Plan"
- **Automatischer Slug**: `premium-plan`
- **Manueller Slug**: `premium` (kürzer, prägnanter)

### 4. Verwendung in URLs (Zukunft)

Der Slug kann später für URL-Routing verwendet werden:

```
/pricing/professional-plan    ← Slug-basiert (lesbar)
/pricing/cmj4e5fpd0001pgg8sjuj4xvd  ← ID-basiert (nicht lesbar)
```

### 5. API und Datenbank

- **Datenbank**: Eindeutiger Index auf `slug` Feld
- **API**: Slug wird bei der Erstellung validiert (muss eindeutig sein)
- **Suche**: Slug kann für schnelle Suche verwendet werden

## Best Practices

### ✅ Gute Slugs
- `basic-plan`
- `professional`
- `enterprise-2024`
- `starter-package`

### ❌ Schlechte Slugs
- `Basic Plan` (Großbuchstaben)
- `professional plan` (Leerzeichen)
- `pro@plan` (Sonderzeichen)
- `premium-plan-` (abschließender Bindestrich)

## Technische Details

### Prisma Schema
```prisma
model PricingPlan {
  slug String @unique  // Eindeutig, URL-freundlich
  // ...
}
```

### Validierung
- Muss eindeutig sein (kein anderer Plan darf denselben Slug haben)
- Wird automatisch aus dem Namen generiert
- Kann manuell angepasst werden

### Verwendung im Code
- **Erstellung**: Automatische Generierung aus Name
- **Bearbeitung**: Manuelle Anpassung möglich
- **Suche**: Slug kann für schnelle Plan-Identifikation verwendet werden

## Zusammenfassung

Der **Slug** ist eine URL-freundliche, eindeutige Kennung für Pricing Plans:
- Wird automatisch aus dem Namen generiert
- Kann manuell angepasst werden
- Muss eindeutig sein
- Dient als technischer Identifier (lesbarer als IDs)
- Kann für zukünftige URL-Routing verwendet werden

