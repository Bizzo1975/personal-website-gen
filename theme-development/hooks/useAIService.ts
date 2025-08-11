import { useState, useEffect, useCallback, useMemo } from 'react';
import { AIService } from '../services/ai/AIService';
import { 
  ImageGenerationRequest, 
  GeneratedAsset, 
  AssetManagerConfig,
  AssetSearchFilters,
  AssetUsageStats,
  PromptTemplate,
  GenerationJob,
  BatchGenerationRequest
} from '../types/ai';

interface UseAIServiceState {
  isLoading: boolean;
  error: string | null;
  assets: GeneratedAsset[];
  activeJobs: GenerationJob[];
  usageStats: AssetUsageStats | null;
  isConfigured: { openai: boolean; stability: boolean };
}

interface UseAIServiceReturn extends UseAIServiceState {
  generateImage: (request: ImageGenerationRequest) => Promise<GeneratedAsset>;
  generateBatch: (batchRequest: BatchGenerationRequest) => Promise<GenerationJob[]>;
  searchAssets: (filters: AssetSearchFilters) => Promise<GeneratedAsset[]>;
  getAssetsByTheme: (theme: 'comic' | 'startrek' | 'default') => Promise<GeneratedAsset[]>;
  getUsageStats: () => Promise<AssetUsageStats>;
  getPromptTemplates: (theme: 'comic' | 'startrek') => PromptTemplate[];
  getTemplateSuggestions: (theme: 'comic' | 'startrek', category?: string) => PromptTemplate[];
  generatePromptFromTemplate: (template: PromptTemplate, variables: Record<string, string>) => string;
  deleteAsset: (id: string) => Promise<boolean>;
  updateAssetMetadata: (id: string, metadata: Partial<import('../types/ai').AssetMetadata>) => Promise<boolean>;
  exportAssets: () => Promise<string>;
  importAssets: (jsonData: string) => Promise<number>;
  clearAllAssets: () => Promise<void>;
  clearCache: () => void;
  getJobStatus: (jobId: string) => GenerationJob | null;
  refreshAssets: () => Promise<void>;
}

export const useAIService = (config?: Partial<AssetManagerConfig>): UseAIServiceReturn => {
  const [state, setState] = useState<UseAIServiceState>({
    isLoading: false,
    error: null,
    assets: [],
    activeJobs: [],
    usageStats: null,
    isConfigured: { openai: false, stability: false }
  });

  // Create AI service instance
  const aiService = useMemo(() => {
    const defaultConfig: AssetManagerConfig = {
      storageType: 'local',
      cacheEnabled: true,
      maxCacheSize: 100,
      compressionEnabled: false,
      backupEnabled: false,
      ...config
    };
    return new AIService(defaultConfig);
  }, [config]);

  // Check configuration on mount
  useEffect(() => {
    const config = aiService.isConfigured();
    setState(prev => ({ ...prev, isConfigured: config }));
  }, [aiService]);

  // Load initial assets
  useEffect(() => {
    loadInitialAssets();
  }, [aiService]);

  // Poll for active jobs updates
  useEffect(() => {
    const interval = setInterval(() => {
      const activeJobs = aiService.getActiveJobs();
      setState(prev => ({ ...prev, activeJobs }));
    }, 1000);

    return () => clearInterval(interval);
  }, [aiService]);

  const loadInitialAssets = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const assets = await aiService.getAssetsByTheme('default');
      setState(prev => ({ ...prev, assets, isLoading: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to load assets',
        isLoading: false 
      }));
    }
  }, [aiService]);

  const generateImage = useCallback(async (request: ImageGenerationRequest): Promise<GeneratedAsset> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const asset = await aiService.generateImage(request);
      
      // Add to assets list
      setState(prev => ({ 
        ...prev, 
        assets: [...prev.assets, asset],
        isLoading: false 
      }));
      
      return asset;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate image';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      throw error;
    }
  }, [aiService]);

  const generateBatch = useCallback(async (batchRequest: BatchGenerationRequest): Promise<GenerationJob[]> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const jobs = await aiService.generateBatch(batchRequest);
      setState(prev => ({ ...prev, isLoading: false }));
      return jobs;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate batch';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      throw error;
    }
  }, [aiService]);

  const searchAssets = useCallback(async (filters: AssetSearchFilters): Promise<GeneratedAsset[]> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const assets = await aiService.searchAssets(filters);
      setState(prev => ({ ...prev, assets, isLoading: false }));
      return assets;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search assets';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      throw error;
    }
  }, [aiService]);

  const getAssetsByTheme = useCallback(async (theme: 'comic' | 'startrek' | 'default'): Promise<GeneratedAsset[]> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const assets = await aiService.getAssetsByTheme(theme);
      setState(prev => ({ ...prev, assets, isLoading: false }));
      return assets;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get assets by theme';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      throw error;
    }
  }, [aiService]);

  const getUsageStats = useCallback(async (): Promise<AssetUsageStats> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const stats = await aiService.getUsageStats();
      setState(prev => ({ ...prev, usageStats: stats, isLoading: false }));
      return stats;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get usage stats';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      throw error;
    }
  }, [aiService]);

  const getPromptTemplates = useCallback((theme: 'comic' | 'startrek'): PromptTemplate[] => {
    return aiService.getPromptTemplates(theme);
  }, [aiService]);

  const getTemplateSuggestions = useCallback((theme: 'comic' | 'startrek', category?: string): PromptTemplate[] => {
    return aiService.getTemplateSuggestions(theme, category);
  }, [aiService]);

  const generatePromptFromTemplate = useCallback((template: PromptTemplate, variables: Record<string, string>): string => {
    return aiService.generatePromptFromTemplate(template, variables);
  }, [aiService]);

  const deleteAsset = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = await aiService.deleteAsset(id);
      if (success) {
        setState(prev => ({ 
          ...prev, 
          assets: prev.assets.filter(asset => asset.id !== id) 
        }));
      }
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete asset';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [aiService]);

  const updateAssetMetadata = useCallback(async (id: string, metadata: Partial<import('../types/ai').AssetMetadata>): Promise<boolean> => {
    try {
      const success = await aiService.updateAssetMetadata(id, metadata);
      if (success) {
        setState(prev => ({
          ...prev,
          assets: prev.assets.map(asset => 
            asset.id === id 
              ? { ...asset, metadata: { ...asset.metadata, ...metadata } }
              : asset
          )
        }));
      }
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update asset metadata';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [aiService]);

  const exportAssets = useCallback(async (): Promise<string> => {
    try {
      return await aiService.exportAssets();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export assets';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [aiService]);

  const importAssets = useCallback(async (jsonData: string): Promise<number> => {
    try {
      const count = await aiService.importAssets(jsonData);
      await loadInitialAssets(); // Refresh assets after import
      return count;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import assets';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [aiService, loadInitialAssets]);

  const clearAllAssets = useCallback(async (): Promise<void> => {
    try {
      await aiService.clearAllAssets();
      setState(prev => ({ ...prev, assets: [] }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear assets';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [aiService]);

  const clearCache = useCallback((): void => {
    aiService.clearCache();
  }, [aiService]);

  const getJobStatus = useCallback((jobId: string): GenerationJob | null => {
    return aiService.getJobStatus(jobId);
  }, [aiService]);

  const refreshAssets = useCallback(async (): Promise<void> => {
    await loadInitialAssets();
  }, [loadInitialAssets]);

  return {
    ...state,
    generateImage,
    generateBatch,
    searchAssets,
    getAssetsByTheme,
    getUsageStats,
    getPromptTemplates,
    getTemplateSuggestions,
    generatePromptFromTemplate,
    deleteAsset,
    updateAssetMetadata,
    exportAssets,
    importAssets,
    clearAllAssets,
    clearCache,
    getJobStatus,
    refreshAssets
  };
};
