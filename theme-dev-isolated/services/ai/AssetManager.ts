import { 
  GeneratedAsset, 
  AssetMetadata, 
  AssetManagerConfig, 
  AssetSearchFilters, 
  AssetUsageStats,
  AssetOptimizationConfig 
} from '../../types/ai';

export class AssetManager {
  private config: AssetManagerConfig;
  private assets: Map<string, GeneratedAsset> = new Map();
  private localStorageKey = 'ai-generated-assets';

  constructor(config: AssetManagerConfig) {
    this.config = config;
    this.loadAssetsFromStorage();
  }

  /**
   * Store a generated asset
   */
  async storeAsset(asset: GeneratedAsset): Promise<string> {
    try {
      // Optimize asset if compression is enabled
      if (this.config.compressionEnabled) {
        asset = await this.optimizeAsset(asset);
      }

      // Store in memory
      this.assets.set(asset.id, asset);

      // Store in local storage
      if (this.config.storageType === 'local') {
        await this.saveAssetsToStorage();
      }

      // Create backup if enabled
      if (this.config.backupEnabled) {
        await this.createBackup(asset);
      }

      return asset.id;
    } catch (error) {
      console.error('Error storing asset:', error);
      throw new Error(`Failed to store asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve an asset by ID
   */
  async getAsset(id: string): Promise<GeneratedAsset | null> {
    return this.assets.get(id) || null;
  }

  /**
   * Search assets with filters
   */
  async searchAssets(filters: AssetSearchFilters): Promise<GeneratedAsset[]> {
    let results = Array.from(this.assets.values());

    // Apply theme filter
    if (filters.theme) {
      results = results.filter(asset => asset.theme === filters.theme);
    }

    // Apply category filter
    if (filters.category) {
      results = results.filter(asset => asset.category === filters.category);
    }

    // Apply tags filter
    if (filters.tags && filters.tags.length > 0) {
      results = results.filter(asset => 
        filters.tags!.some(tag => asset.metadata.tags.includes(tag))
      );
    }

    // Apply size filter
    if (filters.size) {
      results = results.filter(asset => asset.metadata.size === filters.size);
    }

    // Apply provider filter
    if (filters.provider) {
      results = results.filter(asset => asset.metadata.provider === filters.provider);
    }

    // Apply date range filter
    if (filters.dateRange) {
      results = results.filter(asset => 
        asset.metadata.generatedAt >= filters.dateRange!.start &&
        asset.metadata.generatedAt <= filters.dateRange!.end
      );
    }

    return results;
  }

  /**
   * Get assets by theme
   */
  async getAssetsByTheme(theme: 'comic' | 'startrek' | 'default'): Promise<GeneratedAsset[]> {
    return Array.from(this.assets.values()).filter(asset => asset.theme === theme);
  }

  /**
   * Get assets by category
   */
  async getAssetsByCategory(category: string): Promise<GeneratedAsset[]> {
    return Array.from(this.assets.values()).filter(asset => asset.category === category);
  }

  /**
   * Delete an asset
   */
  async deleteAsset(id: string): Promise<boolean> {
    const deleted = this.assets.delete(id);
    if (deleted && this.config.storageType === 'local') {
      await this.saveAssetsToStorage();
    }
    return deleted;
  }

  /**
   * Update asset metadata
   */
  async updateAssetMetadata(id: string, metadata: Partial<AssetMetadata>): Promise<boolean> {
    const asset = this.assets.get(id);
    if (!asset) return false;

    asset.metadata = { ...asset.metadata, ...metadata };
    
    if (this.config.storageType === 'local') {
      await this.saveAssetsToStorage();
    }

    return true;
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(): Promise<AssetUsageStats> {
    const assets = Array.from(this.assets.values());
    
    const assetsByTheme: Record<string, number> = {};
    const assetsByCategory: Record<string, number> = {};
    const assetsByProvider: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};
    
    let totalCost = 0;

    assets.forEach(asset => {
      // Count by theme
      assetsByTheme[asset.theme] = (assetsByTheme[asset.theme] || 0) + 1;
      
      // Count by category
      assetsByCategory[asset.category] = (assetsByCategory[asset.category] || 0) + 1;
      
      // Count by provider
      assetsByProvider[asset.metadata.provider] = (assetsByProvider[asset.metadata.provider] || 0) + 1;
      
      // Count tags
      asset.metadata.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
      
      // Sum costs
      if (asset.metadata.cost) {
        totalCost += asset.metadata.cost;
      }
    });

    // Get most used tags
    const mostUsedTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalAssets: assets.length,
      assetsByTheme,
      assetsByCategory,
      assetsByProvider,
      totalCost,
      averageCost: assets.length > 0 ? totalCost / assets.length : 0,
      mostUsedTags
    };
  }

  /**
   * Export assets to JSON
   */
  async exportAssets(): Promise<string> {
    const assets = Array.from(this.assets.values());
    return JSON.stringify(assets, null, 2);
  }

  /**
   * Import assets from JSON
   */
  async importAssets(jsonData: string): Promise<number> {
    try {
      const assets: GeneratedAsset[] = JSON.parse(jsonData);
      let importedCount = 0;

      for (const asset of assets) {
        if (!this.assets.has(asset.id)) {
          this.assets.set(asset.id, asset);
          importedCount++;
        }
      }

      if (this.config.storageType === 'local') {
        await this.saveAssetsToStorage();
      }

      return importedCount;
    } catch (error) {
      console.error('Error importing assets:', error);
      throw new Error(`Failed to import assets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear all assets
   */
  async clearAllAssets(): Promise<void> {
    this.assets.clear();
    if (this.config.storageType === 'local') {
      await this.saveAssetsToStorage();
    }
  }

  /**
   * Load assets from local storage
   */
  private async loadAssetsFromStorage(): Promise<void> {
    if (this.config.storageType !== 'local') return;

    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(this.localStorageKey);
        if (stored) {
          const assets: GeneratedAsset[] = JSON.parse(stored);
          assets.forEach(asset => {
            // Convert date strings back to Date objects
            asset.metadata.generatedAt = new Date(asset.metadata.generatedAt);
            this.assets.set(asset.id, asset);
          });
        }
      }
    } catch (error) {
      console.error('Error loading assets from storage:', error);
    }
  }

  /**
   * Save assets to local storage
   */
  private async saveAssetsToStorage(): Promise<void> {
    if (this.config.storageType !== 'local') return;

    try {
      if (typeof window !== 'undefined') {
        const assets = Array.from(this.assets.values());
        localStorage.setItem(this.localStorageKey, JSON.stringify(assets));
      }
    } catch (error) {
      console.error('Error saving assets to storage:', error);
    }
  }

  /**
   * Optimize asset for storage
   */
  private async optimizeAsset(asset: GeneratedAsset): Promise<GeneratedAsset> {
    // This is a placeholder for image optimization
    // In a real implementation, you would use a library like sharp or canvas
    // to resize and compress images
    return asset;
  }

  /**
   * Create backup of asset
   */
  private async createBackup(asset: GeneratedAsset): Promise<void> {
    // This is a placeholder for backup functionality
    // In a real implementation, you would save to cloud storage or database
    console.log('Creating backup for asset:', asset.id);
  }

  /**
   * Get storage statistics
   */
  getStorageStats(): { totalAssets: number; storageSize: number } {
    const totalAssets = this.assets.size;
    const storageSize = this.config.storageType === 'local' && typeof window !== 'undefined' 
      ? localStorage.getItem(this.localStorageKey)?.length || 0 
      : 0;

    return { totalAssets, storageSize };
  }
}
