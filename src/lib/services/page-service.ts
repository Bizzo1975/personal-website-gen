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
  await dbConnect();
  
  // Handle the home page case - when slug is empty or 'home'
  const pageSlug = slug === '' ? 'home' : slug;
  
  try {
    const page = await Page.findOne({ slug: pageSlug });
    return page;
  } catch (error) {
    console.error('Error fetching page by slug:', error);
    return null;
  }
}

export async function getAllPages(): Promise<PageData[]> {
  await dbConnect();
  
  try {
    const pages = await Page.find({}).sort({ updatedAt: -1 });
    return pages;
  } catch (error) {
    console.error('Error fetching all pages:', error);
    return [];
  }
} 