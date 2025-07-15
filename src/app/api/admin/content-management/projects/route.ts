import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:admin123@localhost:5436/personal_website',
});

// GET - Fetch all projects for Content Management
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
      FROM projects p
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
      ? 'SELECT COUNT(*) FROM projects WHERE status = $1'
      : 'SELECT COUNT(*) FROM projects';
    const countParams = status !== 'all' ? [status] : [];
    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    return NextResponse.json({
      projects: result.rows,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST - Create new project
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
      description,
      content,
      image,
      technologies,
      liveDemo,
      sourceCode,
      featured,
      status = 'draft',
      permissions,
      draft_content
    } = body;

    // Validate required fields
    if (!title || !slug || !description) {
      return NextResponse.json({ 
        error: 'Title, slug, and description are required' 
      }, { status: 400 });
    }

    // Check if slug already exists
    const slugCheck = await pool.query(
      'SELECT id FROM projects WHERE slug = $1',
      [slug]
    );

    if (slugCheck.rows.length > 0) {
      return NextResponse.json({ 
        error: 'A project with this slug already exists' 
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

    // Insert project
    const insertQuery = `
      INSERT INTO projects (
        title, slug, description, content, image, technologies, 
        live_demo, source_code, featured, status, permission_level,
        created_by, last_edited_by, draft_content
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const values = [
      title,
      slug,
      description,
      content || '',
      image || null,
      technologies || [],
      liveDemo || null,
      sourceCode || null,
      featured || false,
      status,
      permissions?.level || 'all',
      userId,
      userId,
      draft_content || content || ''
    ];

    const result = await pool.query(insertQuery, values);
    const newProject = result.rows[0];

    return NextResponse.json({
      success: true,
      project: newProject,
      message: 'Project created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}

// PUT - Update project
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
      description,
      content,
      image,
      technologies,
      liveDemo,
      sourceCode,
      featured,
      status,
      permissions,
      draft_content
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
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

    // Check if project exists
    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1',
      [id]
    );

    if (projectCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Update project
    const updateQuery = `
      UPDATE projects SET
        title = COALESCE($1, title),
        slug = COALESCE($2, slug),
        description = COALESCE($3, description),
        content = COALESCE($4, content),
        image = COALESCE($5, image),
        technologies = COALESCE($6, technologies),
        live_demo = COALESCE($7, live_demo),
        source_code = COALESCE($8, source_code),
        featured = COALESCE($9, featured),
        status = COALESCE($10, status),
        permission_level = COALESCE($11, permission_level),
        last_edited_by = $12,
        draft_content = COALESCE($13, draft_content)
      WHERE id = $14
      RETURNING *
    `;

    const values = [
      title,
      slug,
      description,
      content,
      image,
      technologies,
      liveDemo,
      sourceCode,
      featured,
      status,
      permissions?.level,
      userId,
      draft_content,
      id
    ];

    const result = await pool.query(updateQuery, values);
    const updatedProject = result.rows[0];

    return NextResponse.json({
      success: true,
      project: updatedProject,
      message: 'Project updated successfully'
    });

  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

// DELETE - Delete project
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Check if project exists
    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1',
      [id]
    );

    if (projectCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Delete project
    await pool.query('DELETE FROM projects WHERE id = $1', [id]);

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
} 