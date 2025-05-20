# Animations and Accessibility Features

This document outlines the animations and accessibility improvements implemented in the personal website project.

## Animations

### Animation Components

1. **AnimatedElement Component** (`src/components/AnimatedElement.tsx`)
   - Reusable animation wrapper that can be applied to any element
   - Supports multiple animation types:
     - `fadeIn`: Simple fade in animation
     - `slideUp`, `slideDown`, `slideLeft`, `slideRight`: Directional slide animations
     - `scale`: Scale up animation
     - `pulse`: Continuous pulse effect
     - `bounce`: Continuous bounce effect
   - Customizable properties:
     - `delay`: Start delay in seconds
     - `duration`: Animation duration
     - `className`: Custom CSS classes
     - `as`: Element type (div, span, etc.)

2. **PageTransition Component** (`src/components/PageTransition.tsx`)
   - Handles smooth transitions between pages using Framer Motion
   - Animation modes:
     - `fade`: Fade transition
     - `slide`: Slide transition
     - `none`: No animation

3. **Staggered Animations**
   - Helper function `createStaggeredChildren` to create sequenced animations
   - Supports different stagger directions:
     - `left-to-right`
     - `right-to-left`
     - `top-to-bottom`
     - `bottom-to-top`

### Implemented Animations

- **Blog Posts**: Staggered slide-up animations with delayed tag reveals
- **Blog Header**: Sequential animations for title, RSS link, and subtitle
- **Cards**: Hover and focus animations with smooth scaling
- **Page Transitions**: Smooth fade transitions between routes

## Accessibility Improvements

### Components

1. **SkipToContent Component** (`src/components/SkipToContent.tsx`)
   - Skip-to-content link for keyboard users
   - Visually hidden until focused
   - Smooth scrolls to main content

2. **Enhanced Card Component** (`src/components/Card.tsx`)
   - Added proper keyboard interaction
   - Support for `aria-label` attribute
   - Interactive mode with proper focus styles
   - ARIA roles for interactive elements

### General Improvements

1. **Keyboard Navigation**
   - All interactive elements are keyboard accessible
   - Visible focus indicators
   - Proper tab order

2. **ARIA Attributes**
   - Added `aria-label` to elements without visible text
   - Assigned proper ARIA roles
   - Added `tabindex` attributes where needed

3. **Semantic HTML**
   - Added `id="main-content"` to main content area
   - Ensured proper heading hierarchy
   - Made links more descriptive

## Usage Examples

### Using AnimatedElement

```tsx
// Simple fade in
<AnimatedElement>
  <p>This content will fade in</p>
</AnimatedElement>

// Slide up with delay
<AnimatedElement type="slideUp" delay={0.3}>
  <h2>This heading slides up after a delay</h2>
</AnimatedElement>

// Continuous animation
<AnimatedElement type="pulse">
  <Button>Pulsing Button</Button>
</AnimatedElement>
```

### Creating Staggered Animations

```tsx
const items = ['Item 1', 'Item 2', 'Item 3'];

createStaggeredChildren(
  items.map(item => <li key={item}>{item}</li>),
  'fadeIn',
  0.1,
  0.5,
  'top-to-bottom'
)
```

### Using SkipToContent

```tsx
// In your main layout
<SkipToContent contentId="main-content" />

// Ensure your main content has matching ID
<main id="main-content" tabIndex={-1}>
  {children}
</main>
```

## Future Enhancements

1. Add more complex animation patterns
2. Implement screen reader-specific instructions
3. Add automated accessibility testing
4. Implement reduced motion preferences detection 