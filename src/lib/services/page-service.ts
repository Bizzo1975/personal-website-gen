import dbConnect, { isMockMode } from '@/lib/db';
import Page from '@/lib/models/Page';
import { Document } from 'mongoose';

export interface PageData {
  _id: string;
  name: string;
  title: string;
  slug: string;
  content: string;
  metaDescription: string;
  updatedAt: Date;
}

// Type helper to convert Mongoose document to PageData
const convertToPageData = (doc: any): PageData | null => {
  if (!doc) return null;
  return {
    _id: doc._id.toString(),
    name: doc.name,
    title: doc.title,
    slug: doc.slug,
    content: doc.content,
    metaDescription: doc.metaDescription,
    updatedAt: doc.updatedAt,
  };
};

// Mock data for development when MongoDB is not available
let mockPages: PageData[] = [
  {
    _id: '1',
    name: 'Home',
    title: 'Welcome to My Portfolio',
    slug: 'home',
    content: `
# Welcome to My Portfolio

I'm a full-stack developer specializing in modern web technologies. This site showcases my projects, skills, and experience.

## What I Do

I build responsive, accessible, and performant web applications using React, Next.js, and other modern frameworks.

## Let's Connect

Feel free to explore my projects and blog posts, or get in touch via the contact page.
    `,
    metaDescription: 'Personal website and portfolio of a full-stack developer',
    updatedAt: new Date(),
  },
  {
    _id: '2',
    name: 'About',
    title: 'About Me',
    slug: 'about',
    content: `
# About Me

I'm a passionate developer with 5+ years of experience building web applications. I specialize in JavaScript and TypeScript, with expertise in React, Next.js, and Node.js.

## My Journey

I started programming in college and quickly fell in love with web development. Since then, I've worked on a variety of projects, from e-commerce platforms to SaaS applications.

## Skills & Expertise

- Frontend: React, Next.js, TypeScript, Tailwind CSS
- Backend: Node.js, Express, MongoDB, PostgreSQL
- DevOps: Docker, AWS, CI/CD
- Tools: Git, Jest, Cypress

## Education

- Bachelor's in Computer Science, University of Technology (2018)
    `,
    metaDescription: 'Learn more about my background, skills, and experience as a developer',
    updatedAt: new Date(),
  }
];

// Mock data storage key for Node.js global object
const MOCK_PAGES_KEY = 'mockPagesData';

// Function to initialize mock data (if it hasn't been initialized yet)
const initMockPages = () => {
  // Check if we have already stored mock pages in the global object
  if (!(global as any)[MOCK_PAGES_KEY]) {
    console.log('📋 Initializing mock pages data');
    (global as any)[MOCK_PAGES_KEY] = mockPages;
  }
  return (global as any)[MOCK_PAGES_KEY];
};

// Function to get mock pages (from global store)
const getMockPages = (): PageData[] => {
  return initMockPages();
};

// Function to save mock pages (to global store)
const saveMockPages = (pages: PageData[]) => {
  console.log('💾 Saving mock pages data:', pages.length, 'pages');
  (global as any)[MOCK_PAGES_KEY] = pages;
  return pages;
};

// Helper function to determine if we should use mock data
const useMockData = () => {
  // Use the isMockMode function from db.ts
  return isMockMode();
};

export async function getPageBySlug(slug: string): Promise<PageData | null> {
  try {
    // Handle the home page case - when slug is empty or 'home'
    const pageSlug = slug === '' ? 'home' : slug;
    
    // Use mock data if MongoDB is not available
    if (useMockData()) {
      const mockPagesList = getMockPages();
      const page = mockPagesList.find(p => p.slug === pageSlug);
      console.log(`📖 Getting page by slug: ${pageSlug}`, page ? 'Found' : 'Not found');
      return page || null;
    }
    
    // Otherwise, use MongoDB
    await dbConnect();
    const page = await Page.findOne({ slug: pageSlug });
    return convertToPageData(page);
  } catch (error) {
    console.error('Error fetching page by slug:', error);
    
    // Fallback to mock data on error
    if (slug === 'home' || slug === 'about') {
      const mockPagesList = getMockPages();
      const page = mockPagesList.find(p => p.slug === slug);
      return page || null;
    }
    
    return null;
  }
}

export async function getPageById(id: string): Promise<PageData | null> {
  try {
    // Use mock data if MongoDB is not available
    if (useMockData()) {
      const mockPagesList = getMockPages();
      const page = mockPagesList.find(p => p._id === id);
      console.log(`🔍 Getting page by ID: ${id}`, page ? 'Found' : 'Not found');
      return page || null;
    }
    
    // Otherwise, use MongoDB
    await dbConnect();
    const page = await Page.findById(id);
    return convertToPageData(page);
  } catch (error) {
    console.error('Error fetching page by ID:', error);
    return null;
  }
}

export async function getAllPages(): Promise<PageData[]> {
  try {
    // Use mock data if MongoDB is not available
    if (useMockData()) {
      const mockPagesList = getMockPages();
      console.log(`📚 Getting all pages:`, mockPagesList.length, 'pages');
      return [...mockPagesList];
    }
    
    // Otherwise, use MongoDB
    await dbConnect();
    const pages = await Page.find({}).sort({ updatedAt: -1 });
    return pages.map(page => convertToPageData(page)).filter(Boolean) as PageData[];
  } catch (error) {
    console.error('Error fetching all pages:', error);
    return getMockPages(); // Return mock pages as fallback
  }
}

export async function createPage(pageData: Omit<PageData, '_id' | 'updatedAt'>): Promise<PageData | null> {
  try {
    // Handle mock data creation in development
    if (useMockData()) {
      console.log('📝 Using mock creation for new page:', pageData.slug);
      
      const mockPagesList = getMockPages();
      
      // Check if slug already exists
      if (mockPagesList.some(p => p.slug === pageData.slug)) {
        console.error('❌ Page with slug already exists:', pageData.slug);
        return null;
      }
      
      // Create a new mock page
      const newMockPage: PageData = {
        _id: `mock-${Date.now()}`,
        ...pageData,
        updatedAt: new Date()
      };
      
      // Add to mock pages and save
      mockPagesList.push(newMockPage);
      saveMockPages(mockPagesList);
      console.log('✅ Mock page created successfully');
      
      return newMockPage;
    }
    
    // Otherwise, use MongoDB
    await dbConnect();
    
    const newPage = new Page({
      ...pageData,
      updatedAt: new Date(),
    });
    
    await newPage.save();
    return convertToPageData(newPage);
  } catch (error) {
    console.error('Error creating page:', error);
    return null;
  }
}

export async function updatePage(id: string, pageData: Partial<PageData>): Promise<PageData | null> {
  try {
    // Handle mock data updates in development
    if (useMockData()) {
      console.log('✏️ Using mock update for page:', id);
      
      const mockPagesList = getMockPages();
      
      // Find the mock page to update
      const pageIndex = mockPagesList.findIndex(p => p._id === id);
      
      if (pageIndex === -1) {
        console.error('❌ Mock page not found with ID:', id);
        return null;
      }
      
      // Log the changes being made
      console.log('📄 Original page content:', mockPagesList[pageIndex].content.substring(0, 50) + '...');
      console.log('📄 New page content:', (pageData.content || '').substring(0, 50) + '...');
      
      // Update the mock page
      const updatedMockPage = {
        ...mockPagesList[pageIndex],
        ...pageData,
        updatedAt: new Date()
      };
      
      // Replace the page in the mockPages array and save
      mockPagesList[pageIndex] = updatedMockPage;
      saveMockPages(mockPagesList);
      
      console.log('✅ Mock page updated successfully');
      return updatedMockPage;
    }
    
    // Otherwise, use MongoDB
    await dbConnect();
    
    const updatedPage = await Page.findByIdAndUpdate(
      id,
      {
        ...pageData,
        updatedAt: new Date(),
      },
      { new: true }
    );
    
    return convertToPageData(updatedPage);
  } catch (error) {
    console.error('Error updating page:', error);
    return null;
  }
}

export async function deletePage(id: string): Promise<boolean> {
  try {
    // Handle mock data deletion in development
    if (useMockData()) {
      console.log('🗑️ Using mock deletion for page:', id);
      
      const mockPagesList = getMockPages();
      
      // Find the mock page to delete
      const pageIndex = mockPagesList.findIndex(p => p._id === id);
      
      if (pageIndex === -1) {
        console.error('❌ Mock page not found with ID:', id);
        return false;
      }
      
      // Don't allow deletion of essential pages
      if (['home', 'about'].includes(mockPagesList[pageIndex].slug)) {
        console.error('❌ Cannot delete essential page:', mockPagesList[pageIndex].slug);
        return false;
      }
      
      // Remove the page from the mockPages array and save
      mockPagesList.splice(pageIndex, 1);
      saveMockPages(mockPagesList);
      
      console.log('✅ Mock page deleted successfully');
      return true;
    }
    
    // Otherwise, use MongoDB
    await dbConnect();
    
    const result = await Page.findByIdAndDelete(id);
    return !!result;
  } catch (error) {
    console.error('Error deleting page:', error);
    return false;
  }
}

export async function getPageIdBySlug(slug: string): Promise<string | null> {
  try {
    // Handle the home page case - when slug is empty or 'home'
    const pageSlug = slug === '' ? 'home' : slug;
    
    // Use mock data if MongoDB is not available
    if (useMockData()) {
      const mockPagesList = getMockPages();
      const page = mockPagesList.find(p => p.slug === pageSlug);
      return page?._id || null;
    }
    
    // Otherwise, use MongoDB
    await dbConnect();
    const page = await Page.findOne({ slug: pageSlug });
    return page?._id ? page._id.toString() : null;
  } catch (error) {
    console.error('Error fetching page ID by slug:', error);
    return null;
  }
}
