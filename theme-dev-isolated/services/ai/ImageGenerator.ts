import { ImageGenerationRequest, GeneratedAsset, AssetMetadata } from '../../types/ai';
import { AI_CONFIG } from '../../config/ai-config';

export class ImageGenerator {
  private openaiApiKey: string | null = null;
  private stabilityApiKey: string | null = null;
  private assetCache: Map<string, GeneratedAsset> = new Map();

  constructor() {
    // Initialize API keys from configuration
    this.openaiApiKey = AI_CONFIG.openai.isConfigured ? AI_CONFIG.openai.apiKey : null;
    this.stabilityApiKey = AI_CONFIG.stability.isConfigured ? AI_CONFIG.stability.apiKey : null;
  }

  /**
   * Generate comic book style image using OpenAI DALL-E 3
   */
  async generateComicImage(request: ImageGenerationRequest): Promise<GeneratedAsset> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = this.buildComicPrompt(request.prompt);
    const cacheKey = this.generateCacheKey('comic', prompt, request.size, request.aspectRatio);
    
    // Check cache first
    if (this.assetCache.has(cacheKey)) {
      return this.assetCache.get(cacheKey)!;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          size: this.mapSize(request.size),
          quality: 'hd',
          style: 'vivid',
          n: 1
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const imageUrl = data.data[0].url;
      
      const asset: GeneratedAsset = {
        id: this.generateAssetId(),
        url: imageUrl,
        type: 'image',
        theme: 'comic',
        category: request.category || 'general',
        metadata: {
          prompt: request.prompt,
          generatedPrompt: prompt,
          size: request.size,
          aspectRatio: request.aspectRatio,
          provider: 'openai',
          model: 'dall-e-3',
          generatedAt: new Date(),
          tags: request.tags || []
        }
      };

      // Cache the result
      this.assetCache.set(cacheKey, asset);
      
      return asset;
    } catch (error) {
      console.error('Error generating comic image:', error);
      throw new Error(`Failed to generate comic image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate Star Trek style image using Stability AI
   */
  async generateStarTrekImage(request: ImageGenerationRequest): Promise<GeneratedAsset> {
    if (!this.stabilityApiKey) {
      throw new Error('Stability AI API key not configured');
    }

    const prompt = this.buildStarTrekPrompt(request.prompt);
    const cacheKey = this.generateCacheKey('startrek', prompt, request.size, request.aspectRatio);
    
    // Check cache first
    if (this.assetCache.has(cacheKey)) {
      return this.assetCache.get(cacheKey)!;
    }

    try {
      const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.stabilityApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text_prompts: [
            {
              text: prompt,
              weight: 1
            }
          ],
          cfg_scale: 7,
          height: this.mapHeight(request.size),
          width: this.mapWidth(request.size),
          samples: 1,
          steps: 30,
          style_preset: 'cinematic'
        })
      });

      if (!response.ok) {
        throw new Error(`Stability AI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const imageBase64 = data.artifacts[0].base64;
      const imageUrl = `data:image/png;base64,${imageBase64}`;
      
      const asset: GeneratedAsset = {
        id: this.generateAssetId(),
        url: imageUrl,
        type: 'image',
        theme: 'startrek',
        category: request.category || 'general',
        metadata: {
          prompt: request.prompt,
          generatedPrompt: prompt,
          size: request.size,
          aspectRatio: request.aspectRatio,
          provider: 'stability',
          model: 'stable-diffusion-xl-1024-v1-0',
          generatedAt: new Date(),
          tags: request.tags || []
        }
      };

      // Cache the result
      this.assetCache.set(cacheKey, asset);
      
      return asset;
    } catch (error) {
      console.error('Error generating Star Trek image:', error);
      throw new Error(`Failed to generate Star Trek image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build enhanced prompt for comic book style
   */
  private buildComicPrompt(basePrompt: string): string {
    return `${basePrompt}, golden age comic book style, bold colors, halftone dots, comic book panel, Action Comics style, vintage comic book illustration, dramatic lighting, superhero comic book art style, 1930s-1950s comic book aesthetic, high contrast, vibrant colors`;
  }

  /**
   * Build enhanced prompt for Star Trek style
   */
  private buildStarTrekPrompt(basePrompt: string): string {
    return `${basePrompt}, Star Trek LCARS interface, futuristic computer console, orange and blue color scheme, geometric shapes, computer terminal aesthetic, holographic display, Federation technology, 24th century design, clean lines, angular design, Star Trek TNG style`;
  }

  /**
   * Map size to API-specific dimensions
   */
  private mapSize(size: 'small' | 'medium' | 'large'): string {
    switch (size) {
      case 'small': return '256x256';
      case 'medium': return '512x512';
      case 'large': return '1024x1024';
      default: return '1024x1024';
    }
  }

  /**
   * Map size to height for Stability AI
   */
  private mapHeight(size: 'small' | 'medium' | 'large'): number {
    switch (size) {
      case 'small': return 256;
      case 'medium': return 512;
      case 'large': return 1024;
      default: return 1024;
    }
  }

  /**
   * Map size to width for Stability AI
   */
  private mapWidth(size: 'small' | 'medium' | 'large'): number {
    switch (size) {
      case 'small': return 256;
      case 'medium': return 512;
      case 'large': return 1024;
      default: return 1024;
    }
  }

  /**
   * Generate unique asset ID
   */
  private generateAssetId(): string {
    return `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate cache key for asset
   */
  private generateCacheKey(theme: string, prompt: string, size: string, aspectRatio: string): string {
    return `${theme}_${prompt}_${size}_${aspectRatio}`.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  /**
   * Clear asset cache
   */
  clearCache(): void {
    this.assetCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.assetCache.size,
      keys: Array.from(this.assetCache.keys())
    };
  }
}
