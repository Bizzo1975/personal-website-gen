import dbConnect, { isMockMode } from '@/lib/db';
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

// Mock data for development when MongoDB is not available
const mockCategories: CategoryData[] = [
  {
    id: '1',
    name: 'Web Development',
    slug: 'web-development',
    description: 'Articles about web development technologies and techniques',
    color: '#3B82F6', // blue
    postCount: 5,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  {
    id: '2',
    name: 'Design',
    slug: 'design',
    description: 'Articles about UI/UX design principles and tools',
    color: '#EC4899', // pink
    postCount: 3,
    createdAt: new Date('2023-01-02'),
    updatedAt: new Date('2023-01-02')
  },
  {
    id: '3',
    name: 'Career',
    slug: 'career',
    description: 'Articles about professional development in tech',
    color: '#10B981', // green
    postCount: 2,
    createdAt: new Date('2023-01-03'),
    updatedAt: new Date('2023-01-03')
  },
  {
    id: '4',
    name: 'Tools',
    slug: 'tools',
    description: 'Reviews and guides for development tools',
    color: '#F59E0B', // amber
    postCount: 4,
    createdAt: new Date('2023-01-04'),
    updatedAt: new Date('2023-01-04')
  }
];

export interface CategoryQuery {
  limit?: number;
  skip?: number;
  sort?: Record<string, SortOrder>;
}

// Helper function to determine if we should use mock data
const useMockData = () => {
  return isMockMode();
};

/**
 * Get all categories or filter by criteria
 */
export async function getCategories(query: CategoryQuery = {}): Promise<CategoryData[]> {
  // Use mock data if MongoDB is not available
  if (useMockData()) {
    const { limit = 100, skip = 0 } = query;
    
    // Apply sorting - default to name ascending
    const sortedCategories = [...mockCategories].sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
    
    // Apply pagination
    return sortedCategories.slice(skip, skip + limit);
  }
  
  // Otherwise, use MongoDB
  try {
    await dbConnect();
    
    const { limit = 100, skip = 0, sort = { name: 1 } } = query;
    
    const categories = await Category.find()
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    return categories.map(formatCategoryData);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return mockCategories; // Return mock categories as fallback
  }
}

/**
 * Get a category by its slug
 */
export async function getCategoryBySlug(slug: string): Promise<CategoryData | null> {
  // Use mock data if MongoDB is not available
  if (useMockData()) {
    const category = mockCategories.find(c => c.slug === slug);
    return category || null;
  }
  
  // Otherwise, use MongoDB
  try {
    await dbConnect();
    
    const category = await Category.findOne({ slug });
    if (!category) return null;
    
    return formatCategoryData(category);
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    
    // Fallback to mock data
    const category = mockCategories.find(c => c.slug === slug);
    return category || null;
  }
}

/**
 * Create a new category
 */
export async function createCategory(data: Omit<CategoryData, 'id' | 'createdAt' | 'updatedAt' | 'postCount'>): Promise<CategoryData> {
  if (useMockData()) {
    // Create a mock category
    const newCategory: CategoryData = {
      id: `mock-${Date.now()}`,
      ...data,
      postCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockCategories.push(newCategory);
    return newCategory;
  }
  
  try {
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
  } catch (error) {
    console.error('Error creating category:', error);
    throw new Error('Failed to create category');
  }
}

/**
 * Helper function to format category data from the database
 */
function formatCategoryData(category: CategoryDocument): CategoryData {
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
