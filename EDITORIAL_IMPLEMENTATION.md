# Editorial DPP Implementation Guide

## Overview

The editorial frontend is built on layout primitives that separate structure, content, and branding. This architecture enables:

- **Future brand customization** without refactoring
- **Easy extension** with new content types
- **Consistent editorial rhythm** across all pages
- **Mobile-first responsive design** for QR code scanning

## Architecture Principles

### 1. Separation of Concerns

```
Structure (Section) → Content (Block) → Branding (Tokens)
```

- **Section** handles layout and spacing
- **Block** handles content presentation
- **Tokens** handle visual styling

This separation means you can:
- Swap design tokens for different brands
- Add new block types without touching sections
- Change layouts without affecting content

### 2. Composition Over Configuration

Instead of creating feature-specific components, we compose layouts from primitives:

```tsx
// ❌ Feature component (hard to customize)
<ProductHero product={product} />

// ✅ Composed from primitives (flexible)
<Section variant="full-bleed">
  <Image src={heroImage} />
  <TextBlock size="lg">{product.name}</TextBlock>
</Section>
```

### 3. Mobile-First, QR-Optimized

- Large touch targets
- Clear visual hierarchy for quick scanning
- Full-bleed images for impact
- Minimal text, maximum visuals

## Usage Examples

### Basic Page Structure

```tsx
import { Page, Section, TextBlock, Image } from '@/components/editorial'

export default function DppPage() {
  return (
    <Page>
      <Section variant="full-bleed">
        <Image src="/hero.jpg" alt="Product" />
      </Section>
      
      <Section variant="contained">
        <TextBlock size="lg">
          Product description goes here...
        </TextBlock>
      </Section>
    </Page>
  )
}
```

### Split Layout

```tsx
<Section variant="split">
  <div>
    <TextBlock size="xl">Left column content</TextBlock>
  </div>
  <div>
    <Image src="/visual.jpg" aspectRatio="1:1" />
  </div>
</Section>
```

### Quote Block

```tsx
<QuoteBlock attribution="Brand Name">
  "This product represents our commitment to sustainability..."
</QuoteBlock>
```

## Design Token Customization

To customize for a specific brand:

1. **Create brand-specific tokens:**

```ts
// tokens/brand-customer-a.ts
export const brandColors = {
  brand: {
    primary: '#123456',  // Brand's primary color
    accent: '#789ABC',   // Brand's accent
  },
  // ... override other colors
}
```

2. **Use in components:**

```tsx
<Section 
  variant="contained"
  backgroundColor={brandColors.background.secondary}
>
  <TextBlock style={{ color: brandColors.text.primary }}>
    Content
  </TextBlock>
</Section>
```

## Extending the System

### Adding a New Block Type

1. Create new block component in `Block.tsx`:

```tsx
export function StatsBlock({ stats }: { stats: Array<{label: string, value: string}> }) {
  return (
    <div className="editorial-block--stats">
      {stats.map((stat, i) => (
        <div key={i}>
          <TextBlock size="2xl" weight="bold">{stat.value}</TextBlock>
          <TextBlock size="sm">{stat.label}</TextBlock>
        </div>
      ))}
    </div>
  )
}
```

2. Export from `Block.tsx`
3. Use in pages - no section changes needed

### Adding a New Section Variant

1. Add variant to `Section.tsx`:

```tsx
const SECTION_STYLES = {
  // ... existing variants
  'three-column': {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: editorialSpacing.xl,
  },
}
```

2. Use in pages immediately

## Best Practices

### DO:
- ✅ Use semantic block types (TextBlock, QuoteBlock)
- ✅ Compose layouts from primitives
- ✅ Keep content separate from structure
- ✅ Use design tokens for all styling

### DON'T:
- ❌ Create feature-specific components
- ❌ Hard-code colors or spacing
- ❌ Mix layout logic with content
- ❌ Create one-off custom styles

## Migration Path

To migrate existing public DPP view:

1. Replace feature components with primitives
2. Map existing styles to design tokens
3. Restructure using Section variants
4. Test QR code scanning experience
5. Validate mobile responsiveness

