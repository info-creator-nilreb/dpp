# Editorial DPP Frontend Architecture

## Vision
A premium editorial frontend for public Digital Product Passports that feels like a brand story platform, not a compliance tool.

## Component Architecture

```
src/
├── components/
│   ├── editorial/
│   │   ├── Page.tsx                 # Root container
│   │   ├── Section.tsx              # Layout sections (full-bleed, contained, split)
│   │   ├── Block.tsx                # Content blocks (text, quote, list)
│   │   ├── Media.tsx                # Image/video display
│   │   └── Accent.tsx               # Subtle emphasis elements
│   │
│   └── editorial/
│       ├── tokens/
│       │   ├── colors.ts            # Color palette
│       │   ├── typography.ts        # Type scale & fonts
│       │   └── spacing.ts           # Spacing system
│       │
│       └── utils/
│           └── formatContent.ts     # Content formatting helpers
│
└── app/
    └── public/
        └── dpp/
            └── [dppId]/
                └── page.tsx         # Editorial DPP page
```

## Design Principles

### 1. Layout Primitives (Future-Proof)

**Page** - Root container
- Handles global layout structure
- Sets base typography and spacing context
- Manages viewport and scroll behavior

**Section** - Layout container with variants
- `full-bleed`: Edge-to-edge, no container constraints
- `contained`: Max-width container with padding
- `split`: Two-column or asymmetric layouts
- Handles responsive breakpoints
- Sets vertical rhythm

**Block** - Content primitives
- `text`: Rich text content
- `quote`: Pull quotes and testimonials
- `list`: Ordered/unordered lists
- Focused on content, not layout

**Media** - Visual content
- `image`: Responsive images with aspect ratios
- `video`: Embedded video support
- Handles lazy loading and optimization

**Accent** - Subtle emphasis
- Dividers, highlights, decorative elements
- Low visual weight, high semantic value

### 2. Why Primitives Are Future-Proof

- **Separation of Concerns**: Layout vs. content vs. branding
- **Composability**: Mix and match without refactoring
- **Brand Customization**: Swap design tokens, keep structure
- **Extensibility**: Add new blocks without touching sections
- **Maintainability**: Clear boundaries and responsibilities

### 3. Design Token Strategy

**Colors**
- Semantic naming (brand-primary, text-primary, etc.)
- Supports per-customer branding
- Light/dark mode ready

**Typography**
- Scale-based system (h1-h6, body, small, caption)
- Line-height and letter-spacing included
- Font family abstraction

**Spacing**
- 8px base unit
- Semantic names (xs, sm, md, lg, xl, 2xl, etc.)
- Vertical rhythm system

## UX Rationale

### Editorial Logic for QR-Based Access

1. **Immediate Context**: Hero section instantly answers "What is this?"
2. **Visual First**: Images before text, story before specs
3. **Scannable Hierarchy**: Clear sections, no cognitive load
4. **Trust Building**: Transparency through narrative, not compliance language
5. **No Dead Ends**: Every section adds value, no filler

### QR-Driven Usage Patterns

- Users scan with phone → mobile-first design
- Quick glances, not deep reading → clear visual hierarchy
- Shareable moments → social-friendly layouts
- Trust building → authentic storytelling

