# Slice ↔ User Story ↔ UI-Mapping

Verbindung von Slices, Issues (User Stories) und UI-Parität für konsistente Umsetzung.

---

## Prinzip: Dreiklang pro User Story

| Ebene | Prüfung | Artefakt |
|-------|---------|----------|
| **API** | Parity-Harness, Contracts | Golden Requests, OpenAPI |
| **Flow** | Success + Negative | Test Cases (TC-xxx) |
| **UI** | Tokens + Screenshot | design-tokens, Playwright |

**Regel:** Jede User Story mit Frontend-Bezug erfordert alle drei Ebenen.

---

## Slice → Issue → UI-IDs

| Slice | Issue (Kurz) | UI-IDs | FLOW-IDs |
|-------|--------------|--------|----------|
| **SLICE-0** | Gateway Auth | UI-001..UI-006 | FLOW-001, 002, 003 |
| | User-Service | (Backend) | |
| | DPP-Management | UI-007, UI-008, UI-009, UI-012, UI-013, UI-015 | FLOW-008, 009 |
| **SLICE-1** | Gateway Routing | (Backend) | |
| | DPP Media/Publish | UI-009 (Media), UI-010, UI-011, UI-026 | FLOW-010, 011, 020 |
| **SLICE-2** | Gateway Routing | (Backend) | |
| | User-Service Org | UI-016, UI-017, UI-018, UI-019, UI-020 | FLOW-006, 007, 016 |
| **SLICE-3** | Gateway Routing | (Backend) | |
| | DPP Supplier/Contribute | UI-014, UI-027, UI-028 | FLOW-012..015 |
| **SLICE-4** | Gateway Pricing | (Backend) | |
| | User-Service Sub/Notif | UI-021..UI-025, UI-029, UI-030, UI-031 | FLOW-017 |
| **SLICE-5** | Gateway SA | UI-032, UI-040 | FLOW-018 |
| | User-Service SA | UI-033, UI-034, UI-035, UI-037 | |
| | DPP-Management SA | UI-036, UI-038, UI-039 | FLOW-019 |

---

## Checkliste pro User Story (mit Frontend)

Bei Umsetzung einer Story, die UI betrifft:

1. [ ] **UI-IDs ermitteln** – Aus dieser Tabelle oder `ui-parity/UI_PARITY_SPEC.md`
2. [ ] **Tokens nutzen** – Alle neuen/geänderten Komponenten: `import { tokens } from '@/lib/design-tokens'` (EXECUTION_RULES 11)
3. [ ] **Test Cases** – TC-xxx mit Success + Negative; bei Flows: welche UI-IDs betroffen
4. [ ] **Definition of Done** – Enthält: "Betroffene UI-Komponenten nutzen design-tokens", "[GATE][UI][SLICE-X] prüfen"

---

## Integration in slice-X.md

Jedes Slice enthält bereits [GATE][UI][SLICE-X]. Die User Stories (Issues) mit Frontend-Bezug sollten ergänzt werden:

**In Akzeptanzkriterien:**
> UI-Komponenten (Screens siehe [GATE][UI]) nutzen ausschließlich design-tokens (EXECUTION_RULES 11).

**In Definition of Done:**
> [GATE][UI][SLICE-X] UI-Parität grün (0 Diffs) für betroffene UI-IDs.

---

## Ablauf bei Slice-Abnahme

```
1. API-Parität: parity:ci ✓
2. UI-Tokens: Code-Review (keine Hardcodings) ✓
3. UI-Parität: npm run ui:parity ✓ (Betroffene UI-IDs)
4. Slice-Gate bestanden
```
