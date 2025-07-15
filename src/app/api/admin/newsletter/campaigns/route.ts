import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

// GET - Fetch newsletter campaigns
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status') || 'all';
    const type = url.searchParams.get('type') || 'all';
    const search = url.searchParams.get('search') || '';
    
    const offset = (page - 1) * limit;
    
    // Build query conditions
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;
    
    if (search) {
      whereConditions.push(`(title ILIKE $${paramIndex} OR subject ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }
    
    if (status !== 'all') {
      whereConditions.push(`status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }
    
    if (type !== 'all') {
      whereConditions.push(`type = $${paramIndex}`);
      queryParams.push(type);
      paramIndex++;
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM newsletter_campaigns ${whereClause}`,
      queryParams
    );
    
    const total = parseInt(countResult.rows[0].total);
    
    // Get campaigns
    const result = await query(
      `SELECT nc.id, nc.title, nc.slug, nc.subject, nc.preview_text, nc.status, nc.type, 
              nc.scheduled_send_at, nc.sent_at, nc.recipient_count, nc.author, nc.created_at, nc.updated_at,
              nt.name as template_name
       FROM newsletter_campaigns nc
       LEFT JOIN newsletter_templates nt ON nc.template_id = nt.id
       ${whereClause}
       ORDER BY nc.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    );
    
    return NextResponse.json({
      campaigns: result.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching newsletter campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch newsletter campaigns' },
      { status: 500 }
    );
  }
}

// POST - Create new newsletter campaign
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const {
      title,
      subject,
      previewText,
      content,
      htmlContent,
      plainTextContent,
      templateId,
      type,
      permissions,
      targetAccessLevels,
      scheduledSendAt
    } = body;
    
    // Basic validation
    if (!title || !subject || !content) {
      return NextResponse.json(
        { error: 'Title, subject, and content are required' },
        { status: 400 }
      );
    }
    
    // Generate slug from title
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    
    // Check if slug already exists
    const existingResult = await query(
      'SELECT id FROM newsletter_campaigns WHERE slug = $1',
      [slug]
    );
    
    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Campaign with this title already exists' },
        { status: 409 }
      );
    }
    
    // Create new campaign
    const result = await query(
      `INSERT INTO newsletter_campaigns 
       (title, slug, subject, preview_text, content, html_content, plain_text_content, 
        template_id, type, permissions, target_access_levels, scheduled_send_at, 
        author, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING id, title, slug, subject, preview_text, status, type, 
                 scheduled_send_at, sent_at, recipient_count, author, created_at, updated_at`,
      [
        title,
        slug,
        subject,
        previewText || null,
        content,
        htmlContent || null,
        plainTextContent || null,
        templateId || null,
        type || 'manual',
        permissions || {
          level: 'all',
          allowedRoles: ['admin', 'editor', 'author', 'subscriber', 'guest'],
          allowedUsers: [],
          restrictedUsers: [],
          requiresAuth: false,
          customRules: []
        },
        targetAccessLevels || ['all'],
        scheduledSendAt || null,
        session.user.name || 'admin',
        session.user.id
      ]
    );
    
    return NextResponse.json({
      success: true,
      campaign: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating newsletter campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create newsletter campaign' },
      { status: 500 }
    );
  }
}

// PUT - Update newsletter campaign
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const {
      id,
      title,
      subject,
      previewText,
      content,
      htmlContent,
      plainTextContent,
      templateId,
      type,
      permissions,
      targetAccessLevels,
      scheduledSendAt,
      status
    } = body;
    
    // Basic validation
    if (!id || !title || !subject || !content) {
      return NextResponse.json(
        { error: 'ID, title, subject, and content are required' },
        { status: 400 }
      );
    }
    
    // Check if campaign exists and can be modified
    const campaignResult = await query(
      'SELECT status FROM newsletter_campaigns WHERE id = $1',
      [id]
    );
    
    if (campaignResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }
    
    const currentStatus = campaignResult.rows[0].status;
    
    if (currentStatus === 'sent' && !status) {
      return NextResponse.json(
        { error: 'Cannot modify sent campaign' },
        { status: 409 }
      );
    }
    
    // Generate slug from title
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    
    // Check if slug is already used by another campaign
    const existingResult = await query(
      'SELECT id FROM newsletter_campaigns WHERE slug = $1 AND id != $2',
      [slug, id]
    );
    
    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Campaign with this title already exists' },
        { status: 409 }
      );
    }
    
    // Update campaign
    const result = await query(
      `UPDATE newsletter_campaigns 
       SET title = $1, slug = $2, subject = $3, preview_text = $4, content = $5, 
           html_content = $6, plain_text_content = $7, template_id = $8, type = $9, 
           permissions = $10, target_access_levels = $11, scheduled_send_at = $12, 
           status = $13, updated_at = CURRENT_TIMESTAMP
       WHERE id = $14
       RETURNING id, title, slug, subject, preview_text, status, type, 
                 scheduled_send_at, sent_at, recipient_count, author, created_at, updated_at`,
      [
        title,
        slug,
        subject,
        previewText || null,
        content,
        htmlContent || null,
        plainTextContent || null,
        templateId || null,
        type || 'manual',
        permissions || {
          level: 'all',
          allowedRoles: ['admin', 'editor', 'author', 'subscriber', 'guest'],
          allowedUsers: [],
          restrictedUsers: [],
          requiresAuth: false,
          customRules: []
        },
        targetAccessLevels || ['all'],
        scheduledSendAt || null,
        status || currentStatus,
        id
      ]
    );
    
    return NextResponse.json({
      success: true,
      campaign: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating newsletter campaign:', error);
    return NextResponse.json(
      { error: 'Failed to update newsletter campaign' },
      { status: 500 }
    );
  }
}

// DELETE - Delete newsletter campaign
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { campaignId } = await request.json();
    
    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }
    
    // Check if campaign exists and can be deleted
    const campaignResult = await query(
      'SELECT status FROM newsletter_campaigns WHERE id = $1',
      [campaignId]
    );
    
    if (campaignResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }
    
    const status = campaignResult.rows[0].status;
    
    if (status === 'sending') {
      return NextResponse.json(
        { error: 'Cannot delete campaign that is currently sending' },
        { status: 409 }
      );
    }
    
    // Delete campaign (this will also delete related analytics due to CASCADE)
    await query(
      'DELETE FROM newsletter_campaigns WHERE id = $1',
      [campaignId]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting newsletter campaign:', error);
    return NextResponse.json(
      { error: 'Failed to delete newsletter campaign' },
      { status: 500 }
    );
  }
} 