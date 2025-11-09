import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templateId = resolvedParams.id;
    
    // Mock template data - in real app, fetch from database
    const mockTemplate = {
      id: templateId,
      name: 'Technical Blog Post',
      type: 'post',
      description: 'Template for technical blog posts with code examples and explanations',
      content: `# {{title}}

## Introduction

{{introduction}}

## Technical Details

\`\`\`{{language}}
{{code_example}}
\`\`\`

## Explanation

{{explanation}}

## Key Points

- {{point_1}}
- {{point_2}}
- {{point_3}}

## Conclusion

{{conclusion}}

## References

{{references}}`,
      createdAt: '2024-01-10T00:00:00Z',
      usageCount: 24,
      author: session.user.name || 'Admin User',
      variables: ['title', 'introduction', 'language', 'code_example', 'explanation', 'point_1', 'point_2', 'point_3', 'conclusion', 'references']
    };

    return NextResponse.json(mockTemplate);

  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templateId = resolvedParams.id;
    const updateData = await request.json();

    // In a real app, you would:
    // 1. Validate the template data
    // 2. Extract variables from content
    // 3. Update the template in database
    // 4. Update search indexes

    console.log(`Updating template ${templateId}:`, updateData);

    const updatedTemplate = {
      id: templateId,
      ...updateData,
      updatedAt: new Date().toISOString(),
      author: session.user.name || 'Admin User'
    };

    return NextResponse.json({
      success: true,
      message: 'Template updated successfully',
      template: updatedTemplate
    });

  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templateId = resolvedParams.id;

    // In a real app, you would:
    // 1. Check if user has permission to delete templates
    // 2. Check if template is in use
    // 3. Delete from database
    // 4. Update search indexes

    console.log(`Deleting template ${templateId}`);

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
} 