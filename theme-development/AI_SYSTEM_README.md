# AI Asset Generation System

This system provides AI-powered image generation for the comic book and Star Trek themes, integrating with OpenAI DALL-E 3 and Stability AI.

## Features

- **Theme-Specific Image Generation**: Generate images optimized for comic book and Star Trek themes
- **Prompt Templates**: Pre-built templates for common image types
- **Asset Management**: Store, search, and manage generated assets
- **Batch Generation**: Generate multiple images at once
- **Usage Statistics**: Track costs and usage patterns
- **Local Storage**: Store assets locally with browser storage

## Setup

### 1. API Keys Configuration

Create a `.env.local` file in the `theme-development` directory with your API keys:

```bash
# OpenAI API Key for DALL-E 3 image generation
# Get your key from: https://platform.openai.com/api-keys
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here

# Stability AI API Key for Stable Diffusion
# Get your key from: https://platform.stability.ai/
NEXT_PUBLIC_STABILITY_API_KEY=your_stability_api_key_here
```

### 2. API Key Sources

- **OpenAI DALL-E 3**: 
  - Visit https://platform.openai.com/api-keys
  - Create a new API key
  - Cost: $0.040 per image (1024x1024)

- **Stability AI**:
  - Visit https://platform.stability.ai/
  - Sign up and get your API key
  - Cost: $0.002 per image

## Usage

### 1. Access the AI Generator

1. Start the development server: `npm run dev`
2. Navigate to the demo page
3. Click "Show AI Generator" button in the top-right corner

### 2. Generate Images

#### Using Prompt Templates
1. Select a theme (Comic Book or Star Trek)
2. Choose a prompt template from the dropdown
3. Fill in the template variables
4. Click "Generate Prompt from Template"
5. Adjust the generated prompt if needed
6. Select size and aspect ratio
7. Click "Generate Image"

#### Using Custom Prompts
1. Select a theme
2. Enter your custom prompt in the text area
3. Choose size and aspect ratio
4. Add a category for organization
5. Click "Generate Image"

### 3. Manage Assets

- **View Generated Assets**: All generated images appear in the gallery
- **Delete Assets**: Hover over an image and click "Delete"
- **View Statistics**: Click "Stats" to see usage statistics
- **Clear All**: Click "Clear All" to remove all assets

## System Architecture

### Core Components

1. **ImageGenerator** (`services/ai/ImageGenerator.ts`)
   - Handles API calls to OpenAI and Stability AI
   - Manages image generation requests
   - Implements caching for efficiency

2. **AssetManager** (`services/ai/AssetManager.ts`)
   - Stores and retrieves generated assets
   - Provides search and filtering capabilities
   - Manages local storage

3. **PromptTemplates** (`services/ai/PromptTemplates.ts`)
   - Pre-built templates for theme-specific images
   - Variable substitution system
   - Template validation

4. **AIService** (`services/ai/AIService.ts`)
   - Main service that combines all components
   - Provides unified interface for the application
   - Manages job tracking and batch operations

5. **useAIService** (`hooks/useAIService.ts`)
   - React hook for using the AI service
   - Provides state management and error handling
   - Integrates with React components

### Type Definitions

All TypeScript interfaces are defined in `types/ai.ts`:

- `ImageGenerationRequest`: Request structure for image generation
- `GeneratedAsset`: Generated image asset with metadata
- `AssetMetadata`: Detailed metadata about generated assets
- `PromptTemplate`: Template structure for prompt generation
- `GenerationJob`: Job tracking for batch operations

## Theme-Specific Features

### Comic Book Theme
- **Style**: Golden Age comic book aesthetic (1930s-1950s)
- **Colors**: Bold primary colors (red, blue, yellow)
- **Elements**: Halftone patterns, Ben-Day dots, comic panels
- **Templates**: Superhero portraits, action scenes, city backgrounds

### Star Trek Theme
- **Style**: LCARS interface and Federation technology
- **Colors**: Orange, blue, and gray color scheme
- **Elements**: Geometric shapes, holographic displays, computer consoles
- **Templates**: LCARS interfaces, holographic displays, starship exteriors

## Cost Management

### Pricing
- **OpenAI DALL-E 3**: $0.040 per image (1024x1024)
- **Stability AI**: $0.002 per image
- **Estimated Monthly Cost**: $200-500 for active usage

### Cost Optimization
- Use smaller image sizes for testing
- Leverage caching to avoid regenerating similar images
- Use templates to reduce prompt engineering time
- Monitor usage statistics regularly

## Development

### Adding New Providers

To add a new AI provider:

1. Update `ImageGenerator.ts` with new provider methods
2. Add provider configuration to `types/ai.ts`
3. Update the `AIService` to handle the new provider
4. Add provider-specific prompt templates

### Extending Templates

To add new prompt templates:

1. Update `PromptTemplates.ts` with new template definitions
2. Add template variables and examples
3. Test template generation with different variables

### Customizing Styles

To customize theme styles:

1. Modify the prompt enhancement methods in `ImageGenerator.ts`
2. Update template base prompts in `PromptTemplates.ts`
3. Test with various prompts to ensure consistency

## Troubleshooting

### Common Issues

1. **API Key Not Configured**
   - Ensure `.env.local` file exists with correct API keys
   - Restart the development server after adding keys

2. **Image Generation Fails**
   - Check API key validity
   - Verify internet connection
   - Review error messages in browser console

3. **Assets Not Loading**
   - Check browser storage permissions
   - Clear browser cache if needed
   - Verify asset URLs are accessible

### Debug Mode

Enable debug logging by adding to `.env.local`:
```bash
NEXT_PUBLIC_DEBUG_AI=true
```

## Future Enhancements

- **Midjourney Integration**: Add support for Midjourney API
- **Image Editing**: Add image editing capabilities
- **Advanced Filtering**: Enhanced search and filtering options
- **Cloud Storage**: Add cloud storage integration
- **Batch Operations**: Improved batch generation workflows
- **Cost Analytics**: Detailed cost tracking and analytics

## Security Considerations

- API keys are stored in environment variables
- No sensitive data is stored in local storage
- Generated images are stored locally only
- Consider implementing rate limiting for production use

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console for error messages
3. Verify API key configuration
4. Test with simple prompts first
