import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Page from '@/lib/models/Page';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = params;

    // Get the page by ID
    const page = await Page.findById(id);
    
    if (!page) {
      return NextResponse.json(
        { message: 'Page not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(page);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: 'An error occurred' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = params;
    const { name, title, slug, content, metaDescription } = await request.json();
    
    // Basic validation
    if (!name || !title || !slug || !content) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Find page
    const page = await Page.findById(id);
    if (!page) {
      return NextResponse.json(
        { message: 'Page not found' },
        { status: 404 }
      );
    }
    
    // Check slug uniqueness if changing slug
    if (page.slug !== slug) {
      const existingPage = await Page.findOne({ slug, _id: { $ne: id } });
      if (existingPage) {
        return NextResponse.json(
          { message: 'A page with this slug already exists' },
          { status: 400 }
        );
      }
    }
    
    // Update page
    const updatedPage = await Page.findByIdAndUpdate(
      id,
      {
        name,
        title,
        slug,
        content,
        metaDescription: metaDescription || '',
        updatedAt: new Date()
      },
      { new: true }
    );
    
    return NextResponse.json(
      { message: 'Page updated successfully', page: updatedPage }
    );
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: 'An error occurred' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = params;
    
    // Find page
    const page = await Page.findById(id);
    if (!page) {
      return NextResponse.json(
        { message: 'Page not found' },
        { status: 404 }
      );
    }
    
    // Prevent deletion of essential pages
    if (page.slug === 'home' || page.slug === 'about') {
      return NextResponse.json(
        { message: 'Cannot delete essential pages' },
        { status: 400 }
      );
    }
    
    // Delete page
    await Page.findByIdAndDelete(id);
    
    return NextResponse.json(
      { message: 'Page deleted successfully' }
    );
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: 'An error occurred' },
      { status: 500 }
    );
  }
} 