# Cursor Coding Rules – React / Next.js (ESLint-safe)

## JSX Text Safety (CRITICAL)

When writing text content inside JSX / TSX:

- NEVER use raw apostrophes `'` or quotation marks `"` directly in JSX text nodes.
- ALWAYS escape apostrophes using `&apos;` or use template literals `{`...`}`.
- This rule is mandatory to comply with `react/no-unescaped-entities`.
- Assume all JSX text is rendered directly in the UI.

### ❌ Forbidden
<p>This product's version is published</p>

### ✅ Allowed
<p>This product&apos;s version is published</p>
<p>{`This product's version is published`}</p>

---

## UI Copy Rule (MANDATORY)

All user-facing UI copy must be ESLint-safe by default.

- Assume UI text will be rendered inside JSX.
- Prefer escaped entities (`&apos;`, `&quot;`) over raw characters.
- If unsure, ALWAYS use template literals `{`...`}`.
- UI copy must never introduce build-blocking ESLint errors.
- Natural language must be adapted to React/Next.js constraints.

Examples:

❌
```tsx
<h1>You're about to publish this DPP</h1>
