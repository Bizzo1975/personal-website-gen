import { ImageGenerator } from './ImageGenerator';
import { AssetManager } from './AssetManager';
import { PromptTemplates } from './PromptTemplates';
import { 
  ImageGenerationRequest, 
  GeneratedAsset, 
  AssetManagerConfig,
  AssetSearchFilters,
  AssetUsageStats,
  PromptTemplate,
  GenerationJob,
  BatchGenerationRequest
} from '../../types/ai';

export class AIService {
  private imageGenerator: ImageGenerator;
  private assetManager: AssetManager;
  private promptTemplates: PromptTemplates;
  private activeJobs: Map<string, GenerationJob> = new Map();

  constructor(config: AssetManagerConfig) {
    this.imageGenerator = new ImageGenerator();
    this.assetManager = new AssetManager(config);
    this.promptTemplates = new PromptTemplates();
  }

  /**
   * Generate a single image
   */
  async generateImage(request: ImageGenerationRequest): Promise<GeneratedAsset> {
    const jobId = this.createJobId();
    const job: GenerationJob = {
      id: jobId,
      status: 'pending',
      request,
      createdAt: new Date()
    };

    this.activeJobs.set(jobId, job);

    try {
      job.status = 'processing';
      job.progress = 10;

      // Generate the image based on theme
      let asset: GeneratedAsset;
      if (request.theme === 'comic') {
        asset = await this.imageGenerator.generateComicImage(request);
      } else if (request.theme === 'startrek') {
        asset = await this.imageGenerator.generateStarTrekImage(request);
      } else {
        throw new Error(`Unsupported theme: ${request.theme}`);
      }

      job.progress = 80;

      // Store the asset
      await this.assetManager.storeAsset(asset);
      
      job.progress = 100;
      job.status = 'completed';
      job.result = asset;
      job.completedAt = new Date();

      return asset;
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.completedAt = new Date();
      
      console.error('Error generating image:', error);
      throw error;
    } finally {
      // Clean up job after a delay
      setTimeout(() => {
        this.activeJobs.delete(jobId);
      }, 60000); // Keep job info for 1 minute
    }
  }

  /**
   * Generate multiple images in batch
   */
  async generateBatch(batchRequest: BatchGenerationRequest): Promise<GenerationJob[]> {
    const jobs: GenerationJob[] = [];

    for (const request of batchRequest.requests) {
      const jobId = this.createJobId();
      const job: GenerationJob = {
        id: jobId,
        status: 'pending',
        request,
        createdAt: new Date()
      };

      jobs.push(job);
      this.activeJobs.set(jobId, job);

      // Process job asynchronously
      this.processJob(job, batchRequest.callback);
    }

    return jobs;
  }

  /**
   * Process a single job asynchronously
   */
  private async processJob(job: GenerationJob, callback?: (job: GenerationJob) => void): Promise<void> {
    try {
      job.status = 'processing';
      job.progress = 10;

      const asset = await this.generateImage(job.request);
      
      job.status = 'completed';
      job.result = asset;
      job.progress = 100;
      job.completedAt = new Date();

      if (callback) {
        callback(job);
      }
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.completedAt = new Date();

      if (callback) {
        callback(job);
      }
    }
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): GenerationJob | null {
    return this.activeJobs.get(jobId) || null;
  }

  /**
   * Get all active jobs
   */
  getActiveJobs(): GenerationJob[] {
    return Array.from(this.activeJobs.values());
  }

  /**
   * Search assets
   */
  async searchAssets(filters: AssetSearchFilters): Promise<GeneratedAsset[]> {
    return this.assetManager.searchAssets(filters);
  }

  /**
   * Get assets by theme
   */
  async getAssetsByTheme(theme: 'comic' | 'startrek' | 'default'): Promise<GeneratedAsset[]> {
    return this.assetManager.getAssetsByTheme(theme);
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(): Promise<AssetUsageStats> {
    return this.assetManager.getUsageStats();
  }

  /**
   * Get prompt templates
   */
  getPromptTemplates(theme: 'comic' | 'startrek'): PromptTemplate[] {
    const templates = this.promptTemplates.getPredefinedTemplates();
    return templates[theme === 'comic' ? 'comicBook' : 'starTrek'] || [];
  }

  /**
   * Get template suggestions
   */
  getTemplateSuggestions(theme: 'comic' | 'startrek', category?: string): PromptTemplate[] {
    return this.promptTemplates.getTemplateSuggestions(theme, category);
  }

  /**
   * Generate prompt from template
   */
  generatePromptFromTemplate(template: PromptTemplate, variables: Record<string, string>): string {
    return this.promptTemplates.generatePromptFromTemplate(template, variables);
  }

  /**
   * Get comic book template
   */
  getComicBookTemplate(type: keyof import('../../types/ai').ComicBookPromptTemplates): string {
    return this.promptTemplates.getComicBookTemplate(type);
  }

  /**
   * Get Star Trek template
   */
  getStarTrekTemplate(type: keyof import('../../types/ai').StarTrekPromptTemplates): string {
    return this.promptTemplates.getStarTrekTemplate(type);
  }

  /**
   * Create custom comic book prompt
   */
  createComicBookPrompt(basePrompt: string, elements: string[] = []): string {
    return this.promptTemplates.createComicBookPrompt(basePrompt, elements);
  }

  /**
   * Create custom Star Trek prompt
   */
  createStarTrekPrompt(basePrompt: string, elements: string[] = []): string {
    return this.promptTemplates.createStarTrekPrompt(basePrompt, elements);
  }

  /**
   * Delete asset
   */
  async deleteAsset(id: string): Promise<boolean> {
    return this.assetManager.deleteAsset(id);
  }

  /**
   * Update asset metadata
   */
  async updateAssetMetadata(id: string, metadata: Partial<import('../../types/ai').AssetMetadata>): Promise<boolean> {
    return this.assetManager.updateAssetMetadata(id, metadata);
  }

  /**
   * Export assets
   */
  async exportAssets(): Promise<string> {
    return this.assetManager.exportAssets();
  }

  /**
   * Import assets
   */
  async importAssets(jsonData: string): Promise<number> {
    return this.assetManager.importAssets(jsonData);
  }

  /**
   * Clear all assets
   */
  async clearAllAssets(): Promise<void> {
    return this.assetManager.clearAllAssets();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return this.imageGenerator.getCacheStats();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.imageGenerator.clearCache();
  }

  /**
   * Get storage statistics
   */
  getStorageStats(): { totalAssets: number; storageSize: number } {
    return this.assetManager.getStorageStats();
  }

  /**
   * Check if API keys are configured
   */
  isConfigured(): { openai: boolean; stability: boolean } {
    const openaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    const stabilityKey = process.env.NEXT_PUBLIC_STABILITY_API_KEY;
    
    return {
      openai: !!openaiKey,
      stability: !!stabilityKey
    };
  }

  /**
   * Create unique job ID
   */
  private createJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
