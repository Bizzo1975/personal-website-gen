import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Page from '@/lib/models/Page';

export async function GET(request: Request) {
  try {
    await dbConnect();

    // Get pages from database
    const pages = await Page.find({}).sort({ updatedAt: -1 });
    
    return NextResponse.json(pages);
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

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const { name, title, slug, content, metaDescription } = await request.json();
    
    // Basic validation
    if (!name || !title || !slug || !content) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if page with this slug already exists
    const existingPage = await Page.findOne({ slug });
    if (existingPage) {
      return NextResponse.json(
        { message: 'A page with this slug already exists' },
        { status: 400 }
      );
    }
    
    // Create page
    const page = await Page.create({
      name,
      title,
      slug,
      content,
      metaDescription: metaDescription || '',
      updatedAt: new Date()
    });
    
    return NextResponse.json(
      { message: 'Page created successfully', page },
      { status: 201 }
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