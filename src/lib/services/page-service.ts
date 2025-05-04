import dbConnect from '@/lib/db';
import Page from '@/lib/models/Page';

export interface PageData {
  _id: string;
  name: string;
  title: string;
  slug: string;
  content: string;
  metaDescription: string;
  updatedAt: Date;
}

export async function getPageBySlug(slug: string): Promise<PageData | null> {
  try {
    await dbConnect();
    
    // Handle the home page case - when slug is empty or 'home'
    const pageSlug = slug === '' ? 'home' : slug;
    
    const page = await Page.findOne({ slug: pageSlug });
    return page;
  } catch (error) {
    console.error('Error fetching page by slug:', error);
    return null;
  }
}

export async function getPageById(id: string): Promise<PageData | null> {
  try {
    await dbConnect();
    
    const page = await Page.findById(id);
    return page;
  } catch (error) {
    console.error('Error fetching page by ID:', error);
    return null;
  }
}

export async function getAllPages(): Promise<PageData[]> {
  try {
    await dbConnect();
    
    const pages = await Page.find({}).sort({ updatedAt: -1 });
    return pages;
  } catch (error) {
    console.error('Error fetching all pages:', error);
    return [];
  }
}

export async function createPage(pageData: Omit<PageData, '_id' | 'updatedAt'>): Promise<PageData | null> {
  try {
    await dbConnect();
    
    const newPage = new Page({
      ...pageData,
      updatedAt: new Date(),
    });
    
    await newPage.save();
    return newPage;
  } catch (error) {
    console.error('Error creating page:', error);
    return null;
  }
}

export async function updatePage(id: string, pageData: Partial<PageData>): Promise<PageData | null> {
  try {
    await dbConnect();
    
    const updatedPage = await Page.findByIdAndUpdate(
      id,
      {
        ...pageData,
        updatedAt: new Date(),
      },
      { new: true }
    );
    
    return updatedPage;
  } catch (error) {
    console.error('Error updating page:', error);
    return null;
  }
}

export async function deletePage(id: string): Promise<boolean> {
  try {
    await dbConnect();
    
    const result = await Page.findByIdAndDelete(id);
    return !!result;
  } catch (error) {
    console.error('Error deleting page:', error);
    return false;
  }
}
