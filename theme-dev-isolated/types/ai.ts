export interface ImageGenerationRequest {
  prompt: string;
  theme: 'comic' | 'startrek';
  size: 'small' | 'medium' | 'large';
  aspectRatio: 'square' | 'landscape' | 'portrait';
  category?: string;
  tags?: string[];
  style?: string;
}

export interface GeneratedAsset {
  id: string;
  url: string;
  type: 'image' | 'sound' | 'font' | 'animation';
  theme: 'comic' | 'startrek' | 'default';
  category: string;
  metadata: AssetMetadata;
}

export interface AssetMetadata {
  prompt: string;
  generatedPrompt: string;
  size: 'small' | 'medium' | 'large';
  aspectRatio: 'square' | 'landscape' | 'portrait';
  provider: 'openai' | 'stability' | 'midjourney';
  model: string;
  generatedAt: Date;
  tags: string[];
  usage?: number;
  cost?: number;
}

export interface AssetManagerConfig {
  storageType: 'local' | 'database' | 'cloud';
  cacheEnabled: boolean;
  maxCacheSize: number;
  compressionEnabled: boolean;
  backupEnabled: boolean;
}

export interface AssetSearchFilters {
  theme?: 'comic' | 'startrek' | 'default';
  category?: string;
  tags?: string[];
  size?: 'small' | 'medium' | 'large';
  provider?: 'openai' | 'stability' | 'midjourney';
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface AssetUsageStats {
  totalAssets: number;
  assetsByTheme: Record<string, number>;
  assetsByCategory: Record<string, number>;
  assetsByProvider: Record<string, number>;
  totalCost: number;
  averageCost: number;
  mostUsedTags: Array<{ tag: string; count: number }>;
}

export interface ComicBookPromptTemplates {
  superhero: string;
  villain: string;
  action: string;
  background: string;
  panel: string;
  speechBubble: string;
  soundEffect: string;
}

export interface StarTrekPromptTemplates {
  lcarsInterface: string;
  hologram: string;
  computerConsole: string;
  starship: string;
  alien: string;
  technology: string;
  spaceScene: string;
}

export interface PromptTemplate {
  name: string;
  description: string;
  basePrompt: string;
  variables: string[];
  examples: string[];
}

export interface AIProviderConfig {
  openai: {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
  stability: {
    apiKey: string;
    model: string;
    cfgScale: number;
    steps: number;
  };
  midjourney: {
    apiKey: string;
    version: string;
    quality: string;
  };
}

export interface GenerationJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  request: ImageGenerationRequest;
  result?: GeneratedAsset;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  progress?: number;
}

export interface BatchGenerationRequest {
  requests: ImageGenerationRequest[];
  priority: 'low' | 'medium' | 'high';
  callback?: (job: GenerationJob) => void;
}

export interface AssetOptimizationConfig {
  imageQuality: number;
  maxWidth: number;
  maxHeight: number;
  format: 'webp' | 'png' | 'jpg';
  compressionLevel: number;
  generateThumbnails: boolean;
  thumbnailSize: number;
}
