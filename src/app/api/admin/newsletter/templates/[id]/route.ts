import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

// GET - Fetch single newsletter template
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
    
    const templateId = params.id;
    
    const result = await query(
      `SELECT id, name, description, type, html_content, plain_text_content,
              subject_template, preview_text_template, variables, 
              is_active, is_system, usage_count, created_at, updated_at
       FROM newsletter_templates 
       WHERE id = $1`,
      [templateId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      template: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching newsletter template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch newsletter template' },
      { status: 500 }
    );
  }
}

// PUT - Update newsletter template
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
    
    const templateId = params.id;
    const body = await request.json();
    
    const {
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
    if (!name || !type || !htmlContent || !subjectTemplate) {
      return NextResponse.json(
        { error: 'Name, type, HTML content, and subject template are required' },
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
        { error: 'Cannot modify system templates' },
        { status: 403 }
      );
    }
    
    // Check if name is already used by another template
    const existingResult = await query(
      'SELECT id FROM newsletter_templates WHERE name = $1 AND id != $2',
      [name, templateId]
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
        templateId
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
    
    const templateId = params.id;
    
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
    await query('DELETE FROM newsletter_templates WHERE id = $1', [templateId]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting newsletter template:', error);
    return NextResponse.json(
      { error: 'Failed to delete newsletter template' },
      { status: 500 }
    );
  }
} 