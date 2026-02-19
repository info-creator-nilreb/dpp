# Design-Tokens – Anwendungsleitfaden

**Quelle:** Extrahiert aus bestehendem Frontend (editorial/tokens, Login, Signup, App-Komponenten).

**Pflicht:** Bei Neuentwicklung/Nachbau sind Tokens verpflichtend. Siehe `ENTWICKLUNGSREGELN.md`.

---

## Do – Pflicht bei neuer Entwicklung

| Regel | Beschreibung |
|-------|---------------|
| **Zentraler Import** | Tokens aus `ui-parity/tokens.css` oder `tokens.json` importieren. Keine Hardcodings. |
| **CSS Variables** | Für neue Komponenten: `color: var(--ui-brand-accent)` statt `#24c598` |
| **Editorial-Komponenten** | Nutzen weiterhin `editorial/tokens/*.ts` – diese sind mit tokens.json abgeglichen |
| **Konsistenz** | Inputs: `--ui-radius-sm`, `--ui-border-medium`, `--ui-space-md` |
| **Semantic Colors** | Fehler: `--ui-error`, `--ui-error-bg`; Erfolg: `--ui-success` |

---

## Don’t – Vermeiden

| Regel | Beschreibung |
|-------|---------------|
| **Keine Duplikate** | Hex-Werte (#24c598, #0A0A0A) nicht erneut in Komponenten definieren |
| **Keine Abweichungen** | Neue Farben nur nach Review und Token-Update |
| **Keine Inline-Hex** | Statt `style={{ color: "#24c598" }}` → `style={{ color: "var(--ui-brand-accent)" }}` oder Token-Import |
| **Keine Tailwind-Arbitrary** | Falls Tailwind eingeführt wird: Theme in tailwind.config erweitern, nicht `text-[#24c598]` |

---

## Integration in Next.js

### Bereits umgesetzt

- `app/layout.tsx` importiert `../../ui-parity/tokens.css` → CSS Variables global verfügbar
- `src/lib/design-tokens.ts` → TypeScript-Import für inline styles: `import { tokens } from '@/lib/design-tokens'`

### Option A: CSS Variables

```tsx
style={{ color: 'var(--ui-brand-accent)', padding: 'var(--ui-space-md)' }}
```

### Option B: TypeScript Tokens (empfohlen für inline styles)

```tsx
import { tokens } from '@/lib/design-tokens'
style={{ color: tokens.colors.brand.accent, padding: tokens.spacing.md }}
```

### Option B: Tailwind (falls vorhanden)

`tailwind.config.js`:
```js
theme: {
  extend: {
    colors: {
      brand: {
        primary: "#0A0A0A",
        accent: "#24c598",
      },
    },
    fontFamily: {
      sans: ["system-ui", "-apple-system", "sans-serif"],
    },
  },
}
```

### Option D: Editorial-Komponenten (bestehend)

```ts
import { editorialColors } from "@/components/editorial/tokens/colors"
// editorialColors.brand.accent === "#24c598"
```

---

## Token-Mapping (Alt → Neu)

| Verwendung Alt | Token (Neu) |
|----------------|--------------|
| `#24c598` | `--ui-brand-accent` |
| `#0A0A0A` | `--ui-text-primary` / `--ui-brand-primary` |
| `#7A7A7A` | `--ui-text-secondary` |
| `#CDCDCD` | `--ui-border-medium` |
| `borderRadius: "6px"` | `--ui-radius-sm` |
| `padding: "0.75rem"` | `--ui-space-md` |
