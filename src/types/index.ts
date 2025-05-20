// Re-export all types from subdirectories
export * from './content';
export * from './project';
export * from './user';

// Add any global types here
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  hasMore: boolean;
} 