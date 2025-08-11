import { 
  ComicBookPromptTemplates, 
  StarTrekPromptTemplates, 
  PromptTemplate 
} from '../../types/ai';

export class PromptTemplates {
  private comicBookTemplates: ComicBookPromptTemplates;
  private starTrekTemplates: StarTrekPromptTemplates;

  constructor() {
    this.comicBookTemplates = {
      superhero: 'A powerful superhero in a dynamic pose, wearing a colorful costume with cape, standing against a dramatic sky, golden age comic book style',
      villain: 'A menacing supervillain with dark costume and evil expression, surrounded by shadows and dramatic lighting, comic book panel style',
      action: 'Explosive action scene with dynamic movement, flying debris, energy blasts, and dramatic poses, comic book illustration style',
      background: 'City skyline at sunset with tall buildings, dramatic clouds, and golden age comic book aesthetic',
      panel: 'Comic book panel layout with multiple scenes, speech bubbles, and action lines, vintage comic style',
      speechBubble: 'Classic comic book speech bubble with bold text, white background, and black outline, vintage style',
      soundEffect: 'Dynamic sound effect text like POW! or BAM! with bold letters, action lines, and comic book styling'
    };

    this.starTrekTemplates = {
      lcarsInterface: 'Star Trek LCARS computer interface with orange and blue geometric panels, futuristic touch screen, Federation technology',
      hologram: 'Holographic projection with blue light, floating in space, Star Trek technology, transparent and glowing',
      computerConsole: 'Futuristic computer console with multiple screens, control panels, and Star Trek bridge aesthetic',
      starship: 'Federation starship in space, sleek design, warp engines glowing, Star Trek TNG style',
      alien: 'Humanoid alien with distinctive features, Star Trek species design, futuristic clothing',
      technology: 'Advanced Federation technology, clean lines, geometric shapes, 24th century design',
      spaceScene: 'Deep space with stars, nebula, and cosmic phenomena, Star Trek aesthetic'
    };
  }

  /**
   * Get comic book prompt template
   */
  getComicBookTemplate(type: keyof ComicBookPromptTemplates): string {
    return this.comicBookTemplates[type];
  }

  /**
   * Get Star Trek prompt template
   */
  getStarTrekTemplate(type: keyof StarTrekPromptTemplates): string {
    return this.starTrekTemplates[type];
  }

  /**
   * Get all comic book templates
   */
  getAllComicBookTemplates(): ComicBookPromptTemplates {
    return { ...this.comicBookTemplates };
  }

  /**
   * Get all Star Trek templates
   */
  getAllStarTrekTemplates(): StarTrekPromptTemplates {
    return { ...this.starTrekTemplates };
  }

  /**
   * Create custom comic book prompt
   */
  createComicBookPrompt(basePrompt: string, elements: string[] = []): string {
    const comicStyle = 'golden age comic book style, bold colors, halftone dots, Action Comics aesthetic, 1930s-1950s comic book illustration, dramatic lighting, high contrast, vibrant colors';
    const elementsString = elements.length > 0 ? `, ${elements.join(', ')}` : '';
    return `${basePrompt}${elementsString}, ${comicStyle}`;
  }

  /**
   * Create custom Star Trek prompt
   */
  createStarTrekPrompt(basePrompt: string, elements: string[] = []): string {
    const starTrekStyle = 'Star Trek LCARS interface, futuristic computer console, orange and blue color scheme, geometric shapes, Federation technology, 24th century design, clean lines, angular design, Star Trek TNG style';
    const elementsString = elements.length > 0 ? `, ${elements.join(', ')}` : '';
    return `${basePrompt}${elementsString}, ${starTrekStyle}`;
  }

  /**
   * Get predefined prompt templates for different categories
   */
  getPredefinedTemplates(): Record<string, PromptTemplate[]> {
    return {
      comicBook: [
        {
          name: 'Superhero Portrait',
          description: 'A classic superhero in a dynamic pose',
          basePrompt: 'A powerful superhero in a dynamic pose, wearing a colorful costume with cape',
          variables: ['hero_name', 'costume_color', 'pose_type'],
          examples: [
            'Superman flying over Metropolis',
            'Batman standing on a rooftop',
            'Wonder Woman in battle stance'
          ]
        },
        {
          name: 'Action Scene',
          description: 'Explosive action with dynamic movement',
          basePrompt: 'Explosive action scene with dynamic movement, flying debris, energy blasts',
          variables: ['action_type', 'location', 'intensity'],
          examples: [
            'Superhero vs villain battle',
            'Car chase through city streets',
            'Explosion in laboratory'
          ]
        },
        {
          name: 'City Background',
          description: 'Urban landscape with comic book styling',
          basePrompt: 'City skyline with tall buildings, dramatic clouds',
          variables: ['time_of_day', 'weather', 'city_style'],
          examples: [
            'Metropolis at sunset',
            'Gotham City at night',
            'Future city with flying cars'
          ]
        }
      ],
      starTrek: [
        {
          name: 'LCARS Interface',
          description: 'Star Trek computer interface',
          basePrompt: 'Star Trek LCARS computer interface with orange and blue geometric panels',
          variables: ['interface_type', 'complexity', 'color_scheme'],
          examples: [
            'Bridge main viewer',
            'Engineering console',
            'Science station display'
          ]
        },
        {
          name: 'Holographic Display',
          description: 'Futuristic holographic projection',
          basePrompt: 'Holographic projection with blue light, floating in space',
          variables: ['content_type', 'size', 'intensity'],
          examples: [
            'Starship schematics',
            'Alien communication',
            'Data visualization'
          ]
        },
        {
          name: 'Starship Exterior',
          description: 'Federation starship in space',
          basePrompt: 'Federation starship in space, sleek design, warp engines glowing',
          variables: ['ship_class', 'view_angle', 'background'],
          examples: [
            'Enterprise-D from above',
            'Voyager in orbit',
            'Defiant in battle'
          ]
        }
      ]
    };
  }

  /**
   * Generate prompt from template with variables
   */
  generatePromptFromTemplate(template: PromptTemplate, variables: Record<string, string>): string {
    let prompt = template.basePrompt;
    
    // Replace variables in the prompt
    template.variables.forEach(variable => {
      const value = variables[variable];
      if (value) {
        prompt = prompt.replace(new RegExp(`\\{${variable}\\}`, 'g'), value);
      }
    });

    return prompt;
  }

  /**
   * Get random example from template
   */
  getRandomExample(template: PromptTemplate): string {
    if (template.examples.length === 0) return template.basePrompt;
    const randomIndex = Math.floor(Math.random() * template.examples.length);
    return template.examples[randomIndex];
  }

  /**
   * Validate prompt template
   */
  validateTemplate(template: PromptTemplate): boolean {
    return !!(
      template.name &&
      template.description &&
      template.basePrompt &&
      Array.isArray(template.variables) &&
      Array.isArray(template.examples)
    );
  }

  /**
   * Get template suggestions based on theme and category
   */
  getTemplateSuggestions(theme: 'comic' | 'startrek', category?: string): PromptTemplate[] {
    const templates = this.getPredefinedTemplates();
    const themeTemplates = templates[theme === 'comic' ? 'comicBook' : 'starTrek'] || [];
    
    if (category) {
      return themeTemplates.filter(template => 
        template.name.toLowerCase().includes(category.toLowerCase()) ||
        template.description.toLowerCase().includes(category.toLowerCase())
      );
    }
    
    return themeTemplates;
  }
}
