import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:admin123@localhost:5436/personal_website',
});

// GET - Fetch all posts for Content Management
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'all';
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = `
      SELECT 
        p.*,
        u.name as created_by_name,
        u.email as created_by_email,
        e.name as last_edited_by_name,
        e.email as last_edited_by_email
      FROM posts p
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN users e ON p.last_edited_by = e.id
    `;

    const params: any[] = [];
    
    if (status !== 'all') {
      query += ` WHERE p.status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY p.updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count for pagination
    const countQuery = status !== 'all' 
      ? 'SELECT COUNT(*) FROM posts WHERE status = $1'
      : 'SELECT COUNT(*) FROM posts';
    const countParams = status !== 'all' ? [status] : [];
    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    return NextResponse.json({
      posts: result.rows,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

// POST - Create new post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      slug,
      content,
      excerpt,
      tags,
      featuredImage,
      metaDescription,
      status = 'draft',
      permissions,
      draft_content,
      featured
    } = body;

    // Validate required fields
    if (!title || !slug || !content) {
      return NextResponse.json({ 
        error: 'Title, slug, and content are required' 
      }, { status: 400 });
    }

    // Check if slug already exists
    const slugCheck = await pool.query(
      'SELECT id FROM posts WHERE slug = $1',
      [slug]
    );

    if (slugCheck.rows.length > 0) {
      return NextResponse.json({ 
        error: 'A post with this slug already exists' 
      }, { status: 409 });
    }

    // Get user ID
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = userResult.rows[0].id;

    // Calculate reading time (rough estimate: 200 words per minute)
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    // Insert post
    const insertQuery = `
      INSERT INTO posts (
        title, slug, content, excerpt, tags, featured_image, 
        meta_description, status, permission_level, read_time, featured,
        created_by, last_edited_by, draft_content
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const values = [
      title,
      slug,
      content,
      excerpt || '',
      tags || [],
      featuredImage || null,
      metaDescription || '',
      status,
      permissions?.level || 'all',
      readingTime,
      featured || false,
      userId,
      userId,
      draft_content || content || ''
    ];

    const result = await pool.query(insertQuery, values);
    const newPost = result.rows[0];

    return NextResponse.json({
      success: true,
      post: newPost,
      message: 'Post created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}

// PUT - Update post
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      title,
      slug,
      content,
      excerpt,
      tags,
      featuredImage,
      metaDescription,
      status,
      permissions,
      draft_content,
      featured
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    // Get user ID
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = userResult.rows[0].id;

    // Check if post exists
    const postCheck = await pool.query(
      'SELECT id FROM posts WHERE id = $1',
      [id]
    );

    if (postCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Calculate reading time if content is provided
    let readingTime = null;
    if (content) {
      const wordCount = content.split(/\s+/).length;
      readingTime = Math.ceil(wordCount / 200);
    }

    // Update post
    const updateQuery = `
      UPDATE posts SET
        title = COALESCE($1, title),
        slug = COALESCE($2, slug),
        content = COALESCE($3, content),
        excerpt = COALESCE($4, excerpt),
        tags = COALESCE($5, tags),
        featured_image = COALESCE($6, featured_image),
        meta_description = COALESCE($7, meta_description),
        status = COALESCE($8, status),
        permission_level = COALESCE($9, permission_level),
        read_time = COALESCE($10, read_time),
        featured = COALESCE($11, featured),
        last_edited_by = $12,
        draft_content = COALESCE($13, draft_content)
      WHERE id = $14
      RETURNING *
    `;

    const values = [
      title,
      slug,
      content,
      excerpt,
      tags,
      featuredImage,
      metaDescription,
      status,
      permissions?.level,
      readingTime,
      featured,
      userId,
      draft_content,
      id
    ];

    const result = await pool.query(updateQuery, values);
    const updatedPost = result.rows[0];

    return NextResponse.json({
      success: true,
      post: updatedPost,
      message: 'Post updated successfully'
    });

  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

// DELETE - Delete post
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    // Check if post exists
    const postCheck = await pool.query(
      'SELECT id FROM posts WHERE id = $1',
      [id]
    );

    if (postCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Delete post
    await pool.query('DELETE FROM posts WHERE id = $1', [id]);

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
} 