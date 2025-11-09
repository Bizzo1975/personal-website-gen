import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

// GET - Fetch all newsletter templates
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
    const type = url.searchParams.get('type') || 'all';
    const includeInactive = url.searchParams.get('include_inactive') === 'true';
    
    // Build query conditions
    let whereConditions = [];
    let queryParams: any[] = [];
    let paramIndex = 1;
    
    if (type !== 'all') {
      whereConditions.push(`type = $${paramIndex}`);
      queryParams.push(type);
      paramIndex++;
    }
    
    if (!includeInactive) {
      whereConditions.push('is_active = true');
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const result = await query(
      `SELECT id, name, description, type, subject_template, preview_text_template, 
              variables, is_active, is_system, usage_count, created_at, updated_at
       FROM newsletter_templates ${whereClause}
       ORDER BY is_system DESC, name ASC`,
      queryParams
    );
    
    return NextResponse.json({
      templates: result.rows
    });
  } catch (error) {
    console.error('Error fetching newsletter templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch newsletter templates' },
      { status: 500 }
    );
  }
}

// POST - Create new newsletter template
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
      name,
      description,
      type,
      htmlContent,
      plainTextContent,
      subjectTemplate,
      previewTextTemplate,
      variables
    } = body;
    
    // Basic validation
    if (!name || !type || !htmlContent || !subjectTemplate) {
      return NextResponse.json(
        { error: 'Name, type, HTML content, and subject template are required' },
        { status: 400 }
      );
    }
    
    // Check if template name already exists
    const existingResult = await query(
      'SELECT id FROM newsletter_templates WHERE name = $1',
      [name]
    );
    
    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Template name already exists' },
        { status: 409 }
      );
    }
    
    // Create new template
    const result = await query(
      `INSERT INTO newsletter_templates 
       (name, description, type, html_content, plain_text_content, 
        subject_template, preview_text_template, variables, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, name, description, type, subject_template, preview_text_template, 
                 variables, is_active, is_system, usage_count, created_at, updated_at`,
      [
        name,
        description || null,
        type,
        htmlContent,
        plainTextContent || null,
        subjectTemplate,
        previewTextTemplate || null,
        variables || {},
        session.user.id
      ]
    );
    
    return NextResponse.json({
      success: true,
      template: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating newsletter template:', error);
    return NextResponse.json(
      { error: 'Failed to create newsletter template' },
      { status: 500 }
    );
  }
}

// PUT - Update newsletter template
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
      name,
      description,
      type,
      htmlContent,
      plainTextContent,
      subjectTemplate,
      previewTextTemplate,
      variables,
      isActive
    } = body;
    
    // Basic validation
    if (!id || !name || !type || !htmlContent || !subjectTemplate) {
      return NextResponse.json(
        { error: 'ID, name, type, HTML content, and subject template are required' },
        { status: 400 }
      );
    }
    
    // Check if template exists and is not system template
    const templateResult = await query(
      'SELECT is_system FROM newsletter_templates WHERE id = $1',
      [id]
    );
    
    if (templateResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    if (templateResult.rows[0].is_system) {
      return NextResponse.json(
        { error: 'Cannot modify system templates' },
        { status: 403 }
      );
    }
    
    // Check if name is already used by another template
    const existingResult = await query(
      'SELECT id FROM newsletter_templates WHERE name = $1 AND id != $2',
      [name, id]
    );
    
    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Template name already exists' },
        { status: 409 }
      );
    }
    
    // Update template
    const result = await query(
      `UPDATE newsletter_templates 
       SET name = $1, description = $2, type = $3, html_content = $4, 
           plain_text_content = $5, subject_template = $6, preview_text_template = $7, 
           variables = $8, is_active = $9, updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING id, name, description, type, subject_template, preview_text_template, 
                 variables, is_active, is_system, usage_count, created_at, updated_at`,
      [
        name,
        description || null,
        type,
        htmlContent,
        plainTextContent || null,
        subjectTemplate,
        previewTextTemplate || null,
        variables || {},
        isActive !== undefined ? isActive : true,
        id
      ]
    );
    
    return NextResponse.json({
      success: true,
      template: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating newsletter template:', error);
    return NextResponse.json(
      { error: 'Failed to update newsletter template' },
      { status: 500 }
    );
  }
}

// DELETE - Delete newsletter template
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { templateId } = await request.json();
    
    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }
    
    // Check if template exists and is not system template
    const templateResult = await query(
      'SELECT is_system FROM newsletter_templates WHERE id = $1',
      [templateId]
    );
    
    if (templateResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    if (templateResult.rows[0].is_system) {
      return NextResponse.json(
        { error: 'Cannot delete system templates' },
        { status: 403 }
      );
    }
    
    // Check if template is being used in campaigns
    const campaignResult = await query(
      'SELECT COUNT(*) as count FROM newsletter_campaigns WHERE template_id = $1',
      [templateId]
    );
    
    const campaignCount = parseInt(campaignResult.rows[0].count);
    
    if (campaignCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete template: it is used in ${campaignCount} campaign(s)` },
        { status: 409 }
      );
    }
    
    // Delete template
    await query(
      'DELETE FROM newsletter_templates WHERE id = $1',
      [templateId]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting newsletter template:', error);
    return NextResponse.json(
      { error: 'Failed to delete newsletter template' },
      { status: 500 }
    );
  }
} 