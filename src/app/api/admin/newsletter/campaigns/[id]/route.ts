import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

// GET - Fetch individual newsletter campaign
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    // Get campaign with template information
    const result = await query(
      `SELECT nc.id, nc.title, nc.slug, nc.subject, nc.preview_text, nc.content, 
              nc.html_content, nc.plain_text_content, nc.status, nc.type, 
              nc.scheduled_send_at, nc.sent_at, nc.recipient_count, nc.author, 
              nc.created_at, nc.updated_at, nc.template_id, nc.permissions, 
              nc.target_access_levels,
              nt.name as template_name
       FROM newsletter_campaigns nc
       LEFT JOIN newsletter_templates nt ON nc.template_id = nt.id
       WHERE nc.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }
    
    const campaign = result.rows[0];
    
    // Parse JSON fields
    if (campaign.permissions) {
      try {
        campaign.permissions = JSON.parse(campaign.permissions);
      } catch (e) {
        campaign.permissions = {
          level: 'all',
          allowedRoles: ['admin', 'editor', 'author', 'subscriber', 'guest'],
          allowedUsers: [],
          restrictedUsers: [],
          requiresAuth: false
        };
      }
    }
    
    if (campaign.target_access_levels) {
      try {
        campaign.target_access_levels = JSON.parse(campaign.target_access_levels);
      } catch (e) {
        campaign.target_access_levels = ['all'];
      }
    }
    
    return NextResponse.json({
      campaign
    });
  } catch (error) {
    console.error('Error fetching newsletter campaign:', error);
    return NextResponse.json(
      { error: 'Failed to fetch newsletter campaign' },
      { status: 500 }
    );
  }
}

// PUT - Update newsletter campaign
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = params;
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
      scheduledSendAt,
      status
    } = body;
    
    // Basic validation
    if (!title || !subject || !content) {
      return NextResponse.json(
        { error: 'Title, subject, and content are required' },
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
    
    // Check if slug already exists (for other campaigns)
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
        JSON.stringify(permissions || {
          level: 'all',
          allowedRoles: ['admin', 'editor', 'author', 'subscriber', 'guest'],
          allowedUsers: [],
          restrictedUsers: [],
          requiresAuth: false
        }),
        JSON.stringify(targetAccessLevels || ['all']),
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
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    // Check if campaign exists and can be deleted
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
    
    if (currentStatus === 'sent' || currentStatus === 'sending') {
      return NextResponse.json(
        { error: 'Cannot delete sent or sending campaigns' },
        { status: 409 }
      );
    }
    
    // Delete campaign
    await query(
      'DELETE FROM newsletter_campaigns WHERE id = $1',
      [id]
    );
    
    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting newsletter campaign:', error);
    return NextResponse.json(
      { error: 'Failed to delete newsletter campaign' },
      { status: 500 }
    );
  }
} 