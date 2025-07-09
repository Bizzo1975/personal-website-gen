// PostgreSQL Category interface matching the categories table schema
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  post_count: number;
  created_at: Date;
  updated_at: Date;
}

// Type for creating a new category
export interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string;
  color?: string;
}

// Type for updating a category
export interface UpdateCategoryData {
  name?: string;
  slug?: string;
  description?: string;
  color?: string;
}
