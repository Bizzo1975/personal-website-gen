# Dynamic Theme System - Development Environment

This is an isolated development environment for building and testing the comic book and Star Trek themes before integrating them into the main website.

## Features

- **Comic Book Theme**: Golden Age comic book aesthetic with bold colors, speech bubbles, and dynamic panels
- **Star Trek Theme**: LCARS interface with holographic displays and computer voice effects
- **Default Theme**: Clean, modern design for comparison
- **AI Asset Generation**: Generate theme-specific images using OpenAI DALL-E 3 and Stability AI
- **Real-time Theme Switching**: Instant theme changes with smooth transitions
- **Component Isolation**: Each theme component can be developed independently
- **Responsive Design**: Works on all device sizes

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key (for DALL-E 3 image generation)
- Stability AI API key (for Stable Diffusion image generation)

### Installation

1. Navigate to the theme development directory:
```bash
cd theme-development
```

2. Install dependencies:
```bash
npm install
```

3. Configure API keys (optional, for AI generation):
   - Create a `.env.local` file in the theme-development directory
   - Add your API keys:
   ```bash
   NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
   NEXT_PUBLIC_STABILITY_API_KEY=your_stability_api_key_here
   ```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Using AI Asset Generation

1. Click "Show AI Generator" button in the top-right corner
2. Select a theme (Comic Book or Star Trek)
3. Choose a prompt template or enter a custom prompt
4. Configure size and aspect ratio
5. Click "Generate Image"

For detailed AI system documentation, see [AI_SYSTEM_README.md](./AI_SYSTEM_README.md).

## Project Structure

```
theme-development/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with theme provider
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── comic/            # Comic book theme components
│   │   ├── ComicPanel.tsx
│   │   └── SpeechBubble.tsx
│   ├── startrek/         # Star Trek theme components
│   │   ├── LCARSPanel.tsx
│   │   └── HolographicDisplay.tsx
│   └── shared/           # Shared components
│       ├── ThemeProvider.tsx
│       └── ThemeSwitcher.tsx
├── config/               # Configuration files
│   └── themes/           # Theme configurations
├── demo/                 # Demo pages
│   ├── ComicBookDemo.tsx
│   ├── StarTrekDemo.tsx
│   └── ThemeShowcase.tsx
├── styles/               # CSS styles
│   ├── globals.css       # Global styles
│   └── themes/           # Theme-specific styles
│       ├── comic-book.css
│       └── star-trek.css
├── types/                # TypeScript type definitions
├── hooks/                # React hooks
│   └── useAIService.ts   # AI service hook
├── services/             # Service layer
│   └── ai/               # AI asset generation services
└── assets/               # Static assets (fonts, sounds, images)
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Theme Components

### Comic Book Theme

- **ComicPanel**: Container with comic book styling and animations
- **SpeechBubble**: Speech and thought bubbles with character names and emotions
- **ComicNavigation**: Comic book style navigation with issue numbers

### Star Trek Theme

- **LCARSPanel**: LCARS interface panels with different colors and sizes
- **HolographicDisplay**: Holographic projections with flicker and rotation effects
- **ComputerVoice**: Computer voice feedback system

## Customization

### Adding New Themes

1. Create theme configuration in `config/themes/index.ts`
2. Add theme styles in `styles/themes/`
3. Create theme components in `components/`
4. Add demo page in `demo/`
5. Update theme switcher in `components/shared/ThemeSwitcher.tsx`

### Modifying Existing Themes

- Colors: Update CSS custom properties in theme CSS files
- Animations: Modify keyframes in theme CSS files
- Components: Edit component files in respective theme directories

## Integration with Main Website

When ready to integrate with the main website:

1. Copy theme components to main project
2. Update theme provider to work with existing Next.js setup
3. Integrate theme switcher into main navigation
4. Test theme switching with existing content
5. Optimize performance and loading

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Considerations

- Theme assets are loaded on-demand
- CSS custom properties for efficient theme switching
- Component-level code splitting
- Optimized animations with CSS transforms

## Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader friendly
- High contrast mode support
- Reduced motion preferences respected

## Contributing

1. Create feature branch
2. Make changes in isolated environment
3. Test all themes thoroughly
4. Update documentation
5. Submit pull request

## License

This project is part of the Personal Website Generator and follows the same license terms.
