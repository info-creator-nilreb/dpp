# UI-Entwicklungsregeln – Pflicht bei Neuentwicklung

**Ziel:** Bei Nachbau/Neuentwicklung werden Farben, Formen und Strukturen exakt 1:1 übernommen – nicht nur geprüft, sondern während der Entwicklung erzwungen.

---

## Pflicht-Checkliste (jede neue Komponente)

| Nr | Prüfung | Erfüllt wenn |
|----|---------|--------------|
| 1 | **Tokens nutzen** | Keine Hex-Werte (#24c598 etc.) oder festen px in Komponenten. Stattdessen: `import { tokens } from '@/lib/design-tokens'` oder `var(--ui-brand-accent)` |
| 2 | **Quelle prüfen** | `src/lib/design-tokens.ts` und `ui-parity/tokens.css` sind die einzigen Quellen für Farben, Spacing, Typografie |
| 3 | **Strukturen** | Card: `borderRadius: tokens.borderRadius.lg`, `border: 1px solid + tokens.colors.border.medium`, Padding aus tokens.spacing |
| 4 | **Semantik** | Fehler: `tokens.colors.semantic.error`, Erfolg: `tokens.colors.semantic.success` |
| 5 | **Code-Review** | Reviewer prüft: Keine Hardcodings, Tokens verwendet |

---

## Wie Tokens nutzen

### Option 1: Inline Styles (React)

```tsx
import { tokens } from '@/lib/design-tokens'

<button style={{
  backgroundColor: tokens.colors.brand.accent,
  color: tokens.colors.text.inverse,
  borderRadius: tokens.borderRadius.sm,
  padding: tokens.spacing.md,
}}>
  Speichern
</button>
```

### Option 2: CSS Variables (nach Import in layout)

```tsx
<div style={{
  color: 'var(--ui-brand-accent)',
  padding: 'var(--ui-space-md)',
  borderRadius: 'var(--ui-radius-sm)',
}}>
```

### Option 3: Editorial-Komponenten

Bestehende `editorial/tokens/*.ts` sind mit design-tokens abgeglichen. Weiterverwenden.

---

## Verboten

- `#24c598`, `#0A0A0A`, `#7A7A7A` usw. direkt in Komponenten
- `borderRadius: "12px"` ohne Token
- Neue Farben/Styles erfinden ohne Token-Erweiterung und Review

---

## Integration in die App

- `app/layout.tsx` importiert `ui-parity/tokens.css` → CSS Variables global verfügbar
- `src/lib/design-tokens.ts` → TypeScript-Werte für inline styles
- Beide werden von ui-parity/ gepflegt; Änderungen nur mit Parity-Review

---

## Abnahme

- UI-Parität-Tests (Playwright) müssen grün sein
- Neue Screens werden in UI_PARITY_SPEC.md aufgenommen und getestet

---

## Verknüpfung mit Slices & User Stories

- **Pro Slice:** `backlog/slice-X.md` enthält [GATE][UI][SLICE-X] mit Liste der UI-IDs
- **Pro User Story:** Issues mit Frontend-Bezug haben in der DoD: "UI: design-tokens, [GATE][UI] prüfen"
- **Mapping:** `backlog/SLICE_UI_MAPPING.md` verknüpft Slice → Issue → UI-IDs → FLOW-IDs
