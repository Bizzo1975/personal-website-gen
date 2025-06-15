# Personal Website Theme Guide

## Overview

This document outlines the complete design system for the personal website, including color palettes, typography, spacing, and content guidelines. The theme is built with modern web standards, accessibility in mind, and supports both light and dark modes.

## Color System

### Primary Colors

The primary color palette uses a modern blue-to-emerald gradient system:

#### Light Mode Primary
```css
--primary: 16 185 129 (Emerald-500)
--primary-foreground: 255 255 255 (White)
```

#### Dark Mode Primary
```css
--primary: 14 165 233 (Sky-500)
--primary-foreground: 250 250 250 (Near White)
```

#### Primary Color Scale
- **50**: `#eef2ff` - Lightest tint
- **100**: `#e0e7ff` - Very light
- **200**: `#c7d2fe` - Light
- **300**: `#a5b4fc` - Medium light
- **400**: `#818cf8` - Medium
- **500**: `#6366f1` - Base (Indigo)
- **600**: `#4f46e5` - Medium dark
- **700**: `#4338ca` - Dark
- **800**: `#3730a3` - Very dark
- **900**: `#312e81` - Darkest
- **950**: `#1e1b4b` - Deepest

### Secondary Colors

The secondary palette uses teal/emerald tones:

#### Light Mode Secondary
```css
--secondary: 14 165 233 (Sky-500)
--secondary-foreground: 255 255 255 (White)
```

#### Dark Mode Secondary
```css
--secondary: 30 58 138 (Blue-800)
--secondary-foreground: 250 250 250 (Near White)
```

#### Secondary Color Scale
- **50**: `#f0fdfa` - Lightest tint
- **100**: `#ccfbf1` - Very light
- **200**: `#99f6e4` - Light
- **300**: `#5eead4` - Medium light
- **400**: `#2dd4bf` - Medium
- **500**: `#14b8a6` - Base (Teal)
- **600**: `#0d9488` - Medium dark
- **700**: `#0f766e` - Dark
- **800**: `#115e59` - Very dark
- **900**: `#134e4a` - Darkest
- **950**: `#042f2e` - Deepest

### Neutral Colors

#### Light Mode
```css
--background: 255 255 255 (White)
--foreground: 10 10 10 (Near Black)
--card: 255 255 255 (White)
--card-foreground: 10 10 10 (Near Black)
--muted: 240 240 240 (Gray-100)
--muted-foreground: 115 115 115 (Gray-500)
--border: 230 230 230 (Gray-200)
--input: 230 230 230 (Gray-200)
```

#### Dark Mode
```css
--background: 10 10 10 (Near Black)
--foreground: 250 250 250 (Near White)
--card: 25 25 25 (Dark Gray)
--card-foreground: 250 250 250 (Near White)
--muted: 40 40 40 (Dark Gray)
--muted-foreground: 160 160 160 (Gray-400)
--border: 40 40 40 (Dark Gray)
--input: 40 40 40 (Dark Gray)
```

### Semantic Colors

#### Success (Green)
- Light: `#10b981` (Emerald-500)
- Dark: `#34d399` (Emerald-400)

#### Warning (Yellow)
- Light: `#f59e0b` (Amber-500)
- Dark: `#fbbf24` (Amber-400)

#### Error/Destructive (Red)
- Light: `#ef4444` (Red-500)
- Dark: `#f87171` (Red-400)

#### Info (Blue)
- Light: `#3b82f6` (Blue-500)
- Dark: `#60a5fa` (Blue-400)

### Tech-Specific Colors

```css
--tech-dark: #0f172a (Slate-900)
--tech-light: #f8fafc (Slate-50)
--tech-accent: #3b82f6 (Blue-500)
--tech-highlight: #10b981 (Emerald-500)
--tech-code: #f1f5f9 (Slate-100)
--tech-code-dark: #1e293b (Slate-800)
```

## Typography

### Font Families

#### Primary Font (Sans-serif)
```css
font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
```
- Used for: Body text, headings, UI elements
- Characteristics: Modern, clean, highly readable
- Supports: Multiple weights, excellent web performance

#### Monospace Font
```css
font-family: 'JetBrains Mono', 'Fira Code', monospace;
```
- Used for: Code blocks, technical content, data display
- Characteristics: Programming ligatures, clear distinction between characters
- Supports: Code syntax highlighting, technical documentation

### Typography Scale

#### Headings
- **H1**: `text-4xl md:text-5xl lg:text-6xl` (36px → 48px → 60px)
- **H2**: `text-3xl md:text-4xl lg:text-5xl` (30px → 36px → 48px)
- **H3**: `text-2xl md:text-3xl lg:text-4xl` (24px → 30px → 36px)
- **H4**: `text-xl md:text-2xl lg:text-3xl` (20px → 24px → 30px)
- **H5**: `text-lg md:text-xl lg:text-2xl` (18px → 20px → 24px)
- **H6**: `text-base md:text-lg lg:text-xl` (16px → 18px → 20px)

#### Body Text
- **Large**: `text-lg` (18px) - Hero descriptions, important content
- **Base**: `text-base` (16px) - Standard body text
- **Small**: `text-sm` (14px) - Captions, metadata
- **Extra Small**: `text-xs` (12px) - Fine print, labels

#### Font Weights
- **Light**: `font-light` (300) - Subtle text, large headings
- **Normal**: `font-normal` (400) - Body text
- **Medium**: `font-medium` (500) - Emphasized text, buttons
- **Semibold**: `font-semibold` (600) - Headings, important labels
- **Bold**: `font-bold` (700) - Strong emphasis, titles

### Line Heights
- **Tight**: `leading-tight` (1.25) - Large headings
- **Snug**: `leading-snug` (1.375) - Subheadings
- **Normal**: `leading-normal` (1.5) - Body text
- **Relaxed**: `leading-relaxed` (1.625) - Long-form content
- **Loose**: `leading-loose` (2) - Spaced content

## Spacing System

### Base Unit: 4px (0.25rem)

#### Spacing Scale
- **0**: `0px`
- **1**: `4px` (0.25rem)
- **2**: `8px` (0.5rem)
- **3**: `12px` (0.75rem)
- **4**: `16px` (1rem)
- **5**: `20px` (1.25rem)
- **6**: `24px` (1.5rem)
- **8**: `32px` (2rem)
- **10**: `40px` (2.5rem)
- **12**: `48px` (3rem)
- **16**: `64px` (4rem)
- **20**: `80px` (5rem)
- **24**: `96px` (6rem)

#### Section Spacing
- **Small sections**: `py-12 md:py-16` (48px → 64px)
- **Medium sections**: `py-16 md:py-20` (64px → 80px)
- **Large sections**: `py-20 md:py-24` (80px → 96px)
- **Hero sections**: `py-24 md:py-32` (96px → 128px)

## Shadows & Effects

### Shadow System
```css
/* Subtle shadows for cards and components */
--shadow-tech: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
--shadow-tech-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03);
--shadow-tech-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
```

### Glass Morphism
```css
.glass-card {
  background: rgba(255, 255, 255, 0.9); /* Light mode */
  background: rgba(30, 41, 59, 0.9); /* Dark mode */
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

## Animations & Transitions

### Standard Transitions
```css
transition-duration: 150ms; /* Fast interactions */
transition-duration: 300ms; /* Standard interactions */
transition-duration: 500ms; /* Slow, deliberate animations */
```

### Custom Animations
```css
/* Floating effect for hero elements */
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

/* Subtle pulsing for attention */
@keyframes pulse-subtle {
  0% { opacity: 0.8; }
  50% { opacity: 1; }
  100% { opacity: 0.8; }
}

/* Gradient background animation */
@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

## Component Styles

### Buttons

#### Primary Button
```css
.btn-primary {
  background: linear-gradient(to right, #3b82f6, #2563eb);
  color: white;
  font-weight: 500;
  border-radius: 9999px;
  padding: 12px 24px;
  transition: all 300ms;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.btn-primary:hover {
  background: linear-gradient(to right, #2563eb, #1d4ed8);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
```

#### Secondary Button
```css
.btn-secondary {
  background: linear-gradient(to right, #7c3aed, #4338ca);
  color: white;
  font-weight: 500;
  border-radius: 9999px;
  padding: 12px 24px;
  transition: all 300ms;
  border: 1px solid rgba(124, 58, 237, 0.3);
}
```

### Cards

#### Modern Card
```css
.card-modern {
  border-radius: 12px;
  overflow: hidden;
  transition: all 300ms;
  box-shadow: var(--shadow-tech);
}

.card-modern:hover {
  box-shadow: var(--shadow-tech-xl);
  transform: translateY(-4px);
}
```

#### Project Card
```css
.card-project {
  background: white; /* Light mode */
  background: #1e293b; /* Dark mode */
  border-radius: 12px;
  box-shadow: var(--shadow-tech);
  overflow: hidden;
  transition: all 300ms;
}

.card-project:hover {
  box-shadow: var(--shadow-tech-xl);
  transform: translateY(-4px);
}
```

## Content Guidelines

### Writing Style
- **Tone**: Professional yet approachable, confident but not boastful
- **Voice**: First person for personal sections, third person for technical content
- **Length**: Concise and scannable, use bullet points and short paragraphs
- **Technical**: Explain complex concepts simply, provide context for jargon

### Content Hierarchy
1. **Hero Section**: Clear value proposition, call-to-action
2. **About**: Personal story, expertise, personality
3. **Projects**: Showcase best work, include metrics and outcomes
4. **Blog**: Share knowledge, demonstrate expertise
5. **Contact**: Multiple ways to connect, clear next steps

### Image Guidelines
- **Aspect Ratios**: 16:9 for hero images, 4:3 for project thumbnails, 1:1 for profile photos
- **Quality**: High resolution (2x for retina displays)
- **Format**: WebP with JPEG fallback, SVG for icons
- **Alt Text**: Descriptive, contextual, not redundant with surrounding text

### Accessibility

#### Color Contrast
- **AA Standard**: 4.5:1 for normal text, 3:1 for large text
- **AAA Standard**: 7:1 for normal text, 4.5:1 for large text
- All color combinations in this theme meet AA standards minimum

#### Focus States
```css
.focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
  border-radius: 4px;
}
```

#### Screen Reader Support
- Semantic HTML structure
- ARIA labels for interactive elements
- Skip navigation links
- Descriptive link text

## Responsive Design

### Breakpoints
```css
/* Mobile First Approach */
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Small laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

### Container Sizes
```css
.container-modern {
  max-width: 1280px; /* xl breakpoint */
  margin: 0 auto;
  padding: 0 16px; /* Mobile */
  padding: 0 24px; /* sm+ */
  padding: 0 32px; /* lg+ */
}
```

## Usage Examples

### Hero Section
```jsx
<section className="section-hero bg-gradient-primary">
  <div className="container-modern">
    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
      Building Digital Experiences
    </h1>
    <p className="text-xl text-white/90 mb-8 max-w-2xl">
      Full-stack developer creating modern web applications
    </p>
    <button className="btn-primary">
      View My Work
    </button>
  </div>
</section>
```

### Project Card
```jsx
<div className="card-project">
  <div className="img-hover-zoom">
    <img src="/project.jpg" alt="Project screenshot" />
  </div>
  <div className="p-6">
    <h3 className="text-xl font-semibold mb-2">Project Title</h3>
    <p className="text-muted-foreground mb-4">
      Brief project description
    </p>
    <div className="flex gap-2">
      <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
        React
      </span>
      <span className="px-3 py-1 bg-secondary-100 text-secondary-800 rounded-full text-sm">
        TypeScript
      </span>
    </div>
  </div>
</div>
```

### Blog Post
```jsx
<article className="prose prose-lg dark:prose-invert max-w-none">
  <h1>Article Title</h1>
  <p className="lead">
    Engaging introduction that hooks the reader
  </p>
  <h2>Section Heading</h2>
  <p>
    Well-structured content with clear hierarchy
  </p>
</article>
```

## Brand Personality

### Visual Characteristics
- **Modern**: Clean lines, contemporary typography, current design trends
- **Professional**: Polished execution, attention to detail, consistent quality
- **Approachable**: Warm colors, friendly copy, accessible design
- **Technical**: Code-focused elements, developer-friendly features

### Emotional Qualities
- **Confident**: Showcases expertise without arrogance
- **Innovative**: Demonstrates cutting-edge knowledge and techniques
- **Reliable**: Consistent quality and professional presentation
- **Passionate**: Genuine enthusiasm for technology and problem-solving

## Implementation Notes

### CSS Custom Properties
All colors are defined as CSS custom properties using RGB values for alpha transparency support:
```css
:root {
  --primary: 16 185 129;
}

.element {
  background-color: rgb(var(--primary) / 0.1); /* 10% opacity */
}
```

### Dark Mode Implementation
Uses `class` strategy with `next-themes`:
```css
.dark .element {
  /* Dark mode styles */
}
```

### Performance Considerations
- Use `will-change` sparingly for animations
- Prefer `transform` and `opacity` for animations
- Implement proper image optimization
- Use CSS containment where appropriate

---

*This theme guide is a living document that evolves with the website. Last updated: December 2024* 