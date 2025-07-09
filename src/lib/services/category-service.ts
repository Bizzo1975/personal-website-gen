import dbConnect from '@/lib/db';
import Category, { CategoryDocument } from '@/lib/models/Category';
import { SortOrder } from 'mongoose';

export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  postCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryQuery {
  limit?: number;
  skip?: number;
  sort?: Record<string, SortOrder>;
}

/**
 * Get all categories or filter by criteria
 */
export async function getCategories(query: CategoryQuery = {}): Promise<CategoryData[]> {
  await dbConnect();
  
  const { limit = 100, skip = 0, sort = { name: 1 } } = query;
  
  const categories = await (Category as any).find()
    .sort(sort)
    .skip(skip)
    .limit(limit);
  
  return categories.map(formatCategoryData);
}

/**
 * Get a category by its slug
 */
export async function getCategoryBySlug(slug: string): Promise<CategoryData | null> {
  await dbConnect();
  
  const category = await (Category as any).findOne({ slug });
  if (!category) return null;
  
  return formatCategoryData(category);
}

/**
 * Create a new category
 */
export async function createCategory(data: Omit<CategoryData, 'id' | 'createdAt' | 'updatedAt' | 'postCount'>): Promise<CategoryData> {
  await dbConnect();
  
  const category = new Category({
    name: data.name,
    slug: data.slug,
    description: data.description,
    color: data.color,
    postCount: 0
  });
  
  await category.save();
  return formatCategoryData(category);
}

/**
 * Helper function to format category data from the database
 */
function formatCategoryData(category: any): CategoryData {
  return {
    id: category._id.toString(),
    name: category.name,
    slug: category.slug,
    description: category.description,
    color: category.color,
    postCount: category.postCount,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt
  };
}
