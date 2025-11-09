import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

// GET - Fetch all content templates
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
    
    // Build query conditions
    let whereConditions = [];
    let queryParams: any[] = [];
    let paramIndex = 1;
    
    if (type !== 'all') {
      whereConditions.push(`type = $${paramIndex}`);
      queryParams.push(type);
      paramIndex++;
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Check if content_templates table exists, if not create it
    try {
      await query('SELECT 1 FROM content_templates LIMIT 1');
    } catch (error) {
      // Table doesn't exist, create it
      await query(`
        CREATE TABLE IF NOT EXISTS content_templates (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          type VARCHAR(50) NOT NULL CHECK (type IN ('post', 'project', 'page')),
          content TEXT NOT NULL,
          usage_count INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          author VARCHAR(255) DEFAULT 'admin'
        )
      `);
      
      // Insert default templates
      await query(`
        INSERT INTO content_templates (name, description, type, content) VALUES 
        ('Technical Blog Post', 'Template for technical blog posts with code examples', 'post',
         '# {{title}}

## Introduction

{{introduction}}

## Problem/Challenge

{{problem_description}}

## Solution

{{solution_overview}}

### Technical Implementation

\`\`\`{{language}}
{{code_example}}
\`\`\`

## Results & Performance

{{results_description}}

## Conclusion

{{conclusion}}

---

*Published on {{publish_date}} | {{read_time}} min read*'),
        
        ('Tutorial Post', 'Step-by-step tutorial template', 'post',
         '# {{title}}

## What You''ll Learn

{{learning_objectives}}

## Prerequisites

{{#prerequisites}}
- {{.}}
{{/prerequisites}}

## Getting Started

{{getting_started}}

## Next Steps

{{next_steps}}

---

*Tutorial completed! Questions? Leave a comment below.*'),
        
        ('Simple Blog Post', 'Basic blog post template', 'post',
         '# {{title}}

{{content}}

## Summary

{{summary}}

---

*Published on {{publish_date}}*'),
        
        ('Project Case Study', 'Detailed project showcase template', 'project',
         '# {{project_title}}

## Project Overview

{{project_overview}}

**Project Type:** {{project_type}}
**Duration:** {{project_duration}}
**My Role:** {{my_role}}

## The Challenge

{{challenge_description}}

## Technical Stack

{{#tech_stack}}
- **{{category}}:** {{technologies}}
{{/tech_stack}}

## Key Features

{{#features}}
- {{.}}
{{/features}}

## Results & Impact

{{results_description}}

## Links & Resources

- **Live Demo:** [{{project_title}}]({{live_url}})
- **GitHub Repository:** [View Source]({{github_url}})

---

*Project completed {{completion_date}}*'),
        
        ('Web Application Project', 'Template for web application projects', 'project',
         '# {{app_name}}

## Project Summary

{{app_description}}

**Live Demo:** [{{app_name}}]({{live_url}})
**GitHub:** [View Source]({{github_url}})

## Features

{{#features}}
- ✅ {{.}}
{{/features}}

## Technology Stack

### Frontend
{{#frontend_tech}}
- {{.}}
{{/frontend_tech}}

### Backend
{{#backend_tech}}
- {{.}}
{{/backend_tech}}

## Installation & Setup

\`\`\`bash
# Clone the repository
git clone {{github_url}}

# Install dependencies
{{install_command}}

# Run the application
{{run_command}}
\`\`\`

---

*Built with ❤️ using {{primary_tech}}*'),
        
        ('Portfolio Project', 'Simple portfolio project template', 'project',
         '# {{project_name}}

## Description

{{description}}

## Technologies Used

{{technologies}}

## Features

{{features}}

## Live Demo

[View Project]({{demo_url}})

## Source Code

[View on GitHub]({{github_url}})')
        ON CONFLICT (name) DO NOTHING
      `);
    }
    
    const result = await query(
      `SELECT id, name, description, type, content, usage_count, created_at, updated_at, author
       FROM content_templates ${whereClause}
       ORDER BY type ASC, name ASC`,
      queryParams
    );
    
    return NextResponse.json({
      templates: result.rows || []
    });
  } catch (error) {
    console.error('Error fetching content templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content templates' },
      { status: 500 }
    );
  }
}

// POST - Create new content template
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
    const { name, description, type, content } = body;
    
    // Basic validation
    if (!name || !type || !content) {
      return NextResponse.json(
        { error: 'Name, type, and content are required' },
        { status: 400 }
      );
    }
    
    // Check if template name already exists
    const existingResult = await query(
      'SELECT id FROM content_templates WHERE name = $1',
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
      `INSERT INTO content_templates (name, description, type, content, author)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, description, type, content, usage_count, created_at, updated_at, author`,
      [name, description || null, type, content, session.user.name || 'admin']
    );
    
    return NextResponse.json({
      success: true,
      template: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating content template:', error);
    return NextResponse.json(
      { error: 'Failed to create content template' },
      { status: 500 }
    );
  }
}

// PUT - Update content template
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
    const { id, name, description, type, content } = body;
    
    // Basic validation
    if (!id || !name || !type || !content) {
      return NextResponse.json(
        { error: 'ID, name, type, and content are required' },
        { status: 400 }
      );
    }
    
    // Check if template exists
    const templateResult = await query(
      'SELECT id FROM content_templates WHERE id = $1',
      [id]
    );
    
    if (templateResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    // Check if name is already used by another template
    const existingResult = await query(
      'SELECT id FROM content_templates WHERE name = $1 AND id != $2',
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
      `UPDATE content_templates 
       SET name = $1, description = $2, type = $3, content = $4, 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, name, description, type, content, usage_count, created_at, updated_at, author`,
      [name, description || null, type, content, id]
    );
    
    return NextResponse.json({
      success: true,
      template: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating content template:', error);
    return NextResponse.json(
      { error: 'Failed to update content template' },
      { status: 500 }
    );
  }
}

// DELETE - Delete content template
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
    
    // Check if template exists
    const templateResult = await query(
      'SELECT id FROM content_templates WHERE id = $1',
      [templateId]
    );
    
    if (templateResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    // Delete template
    await query('DELETE FROM content_templates WHERE id = $1', [templateId]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting content template:', error);
    return NextResponse.json(
      { error: 'Failed to delete content template' },
      { status: 500 }
    );
  }
} 