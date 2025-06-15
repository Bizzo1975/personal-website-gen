import { NextRequest, NextResponse } from 'next/server';
import { Newsletter, NewsletterFormData, NewsletterListResponse } from '@/types/newsletter';
import { ContentPermissions } from '@/types/content/permissions';

// Mock newsletter data for development
const mockNewsletters: Newsletter[] = [
  {
    id: '1',
    title: 'Weekly Web Dev Digest #47',
    slug: 'weekly-digest-47',
    subject: 'Advanced React Patterns & Next.js 14 Updates',
    previewText: 'This week: React patterns, Next.js updates, and performance tips',
    content: `
      <h2>Welcome to this week's digest!</h2>
      <p>We've got some exciting updates to share with you this week, including advanced React patterns and the latest Next.js 14 features.</p>
      
      <h3>Featured Articles</h3>
      <ul>
        <li>Understanding React Server Components</li>
        <li>Next.js 14 Performance Improvements</li>
        <li>TypeScript Best Practices for 2024</li>
      </ul>
      
      <p>Happy coding!</p>
    `,
    htmlContent: '',
    plainTextContent: '',
    status: 'sent',
    type: 'blog_digest',
    permissions: {
      level: 'all',
      allowedRoles: ['admin', 'editor', 'author', 'subscriber', 'guest'],
      allowedUsers: [],
      restrictedUsers: [],
      requiresAuth: false,
      customRules: []
    },
    template: 'digest',
    author: 'admin',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    sentAt: new Date('2024-01-15'),
    stats: {
      totalSent: 2683,
      delivered: 2671,
      opened: 1605,
      clicked: 483,
      unsubscribed: 12,
      bounced: 12,
      openRate: 60.1,
      clickRate: 18.0,
      unsubscribeRate: 0.4,
      bounceRate: 0.4,
      topLinks: [
        { url: 'https://example.com/react-patterns', clicks: 245 },
        { url: 'https://example.com/nextjs-14', clicks: 189 }
      ]
    }
  },
  {
    id: '2',
    title: 'New Project Launch Announcement',
    slug: 'project-launch-announcement',
    subject: 'Introducing Our Latest Open Source Project',
    previewText: 'We are excited to announce the launch of our new project',
    content: `
      <h2>Exciting News!</h2>
      <p>We're thrilled to announce the launch of our latest open source project!</p>
      
      <h3>What's New</h3>
      <p>This project brings together the best practices in modern web development...</p>
      
      <h3>Get Started</h3>
      <p>Check out the GitHub repository and documentation to get started.</p>
    `,
    htmlContent: '',
    plainTextContent: '',
    status: 'scheduled',
    type: 'announcement',
    permissions: {
      level: 'professional',
      allowedRoles: ['admin', 'editor', 'author'],
      allowedUsers: [],
      restrictedUsers: [],
      requiresAuth: true,
      customRules: []
    },
    template: 'announcement',
    author: 'admin',
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
    scheduledAt: new Date('2024-01-18')
  },
  {
    id: '3',
    title: 'Personal Update: Year in Review',
    slug: 'personal-year-review',
    subject: 'Reflecting on 2024 - A Personal Journey',
    previewText: 'A personal reflection on the year and what lies ahead',
    content: `
      <h2>Looking Back on 2024</h2>
      <p>This year has been incredible for personal and professional growth...</p>
      
      <h3>Key Achievements</h3>
      <ul>
        <li>Launched 5 new open source projects</li>
        <li>Grew the newsletter to 2,500+ subscribers</li>
        <li>Spoke at 3 major conferences</li>
      </ul>
      
      <h3>Looking Ahead</h3>
      <p>2025 is going to be an exciting year with new challenges and opportunities...</p>
    `,
    htmlContent: '',
    plainTextContent: '',
    status: 'draft',
    type: 'regular',
    permissions: {
      level: 'personal',
      allowedRoles: ['admin', 'editor'],
      allowedUsers: ['close-friend@email.com'],
      restrictedUsers: [],
      requiresAuth: true,
      customRules: []
    },
    template: 'basic',
    author: 'admin',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-13')
  }
];

// GET - List newsletters with filtering and pagination
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Handle different admin actions
    switch (action) {
      case 'stats':
        return handleGetStats();
      case 'newsletters':
        return handleGetNewsletters();
      case 'subscribers':
        return handleGetSubscribers();
      case 'analytics':
        return handleGetAnalytics();
      default:
        // Default to stats if no action specified (for dashboard compatibility)
        return handleGetStats();
    }
  } catch (error) {
    console.error('Newsletter admin API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new newsletter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      subject,
      previewText,
      content,
      type,
      permissions,
      template,
      headerImage,
      footerContent,
      includedPosts,
      includedProjects,
      scheduledAt
    }: NewsletterFormData = body;

    // Validation
    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Newsletter title is required' },
        { status: 400 }
      );
    }

    if (!subject?.trim()) {
      return NextResponse.json(
        { error: 'Email subject is required' },
        { status: 400 }
      );
    }

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Newsletter content is required' },
        { status: 400 }
      );
    }

    // Generate slug from title
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check for duplicate slug
    const existingNewsletter = mockNewsletters.find(n => n.slug === slug);
    if (existingNewsletter) {
      return NextResponse.json(
        { error: 'A newsletter with this title already exists' },
        { status: 409 }
      );
    }

    // Create new newsletter
    const newNewsletter: Newsletter = {
      id: Date.now().toString(),
      title: title.trim(),
      slug,
      subject: subject.trim(),
      previewText: previewText?.trim() || '',
      content: content.trim(),
      htmlContent: generateHtmlContent(content, template, headerImage, footerContent),
      plainTextContent: stripHtml(content),
      status: scheduledAt ? 'scheduled' : 'draft',
      type,
      permissions,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      template: template || 'basic',
      headerImage: headerImage || undefined,
      footerContent: footerContent || undefined,
      includedPosts: includedPosts || [],
      includedProjects: includedProjects || [],
      author: 'current-user-id', // Replace with actual user ID from session
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // In a real application, save to database
    mockNewsletters.push(newNewsletter);

    return NextResponse.json({
      message: 'Newsletter created successfully',
      newsletter: newNewsletter
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating newsletter:', error);
    return NextResponse.json(
      { error: 'Failed to create newsletter' },
      { status: 500 }
    );
  }
}

// PUT - Update newsletter
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData }: { id: string } & Partial<NewsletterFormData> = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Newsletter ID is required' },
        { status: 400 }
      );
    }

    const newsletterIndex = mockNewsletters.findIndex(n => n.id === id);
    if (newsletterIndex === -1) {
      return NextResponse.json(
        { error: 'Newsletter not found' },
        { status: 404 }
      );
    }

    const newsletter = mockNewsletters[newsletterIndex];

    // Update newsletter
    const updatedNewsletter: Newsletter = {
      ...newsletter,
      ...updateData,
      updatedAt: new Date(),
      htmlContent: updateData.content ? 
        generateHtmlContent(
          updateData.content, 
          updateData.template || newsletter.template,
          updateData.headerImage || newsletter.headerImage,
          updateData.footerContent || newsletter.footerContent
        ) : newsletter.htmlContent,
      plainTextContent: updateData.content ? stripHtml(updateData.content) : newsletter.plainTextContent
    };

    mockNewsletters[newsletterIndex] = updatedNewsletter;

    return NextResponse.json({
      message: 'Newsletter updated successfully',
      newsletter: updatedNewsletter
    });

  } catch (error) {
    console.error('Error updating newsletter:', error);
    return NextResponse.json(
      { error: 'Failed to update newsletter' },
      { status: 500 }
    );
  }
}

// DELETE - Delete newsletter
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Newsletter ID is required' },
        { status: 400 }
      );
    }

    const newsletterIndex = mockNewsletters.findIndex(n => n.id === id);
    if (newsletterIndex === -1) {
      return NextResponse.json(
        { error: 'Newsletter not found' },
        { status: 404 }
      );
    }

    const newsletter = mockNewsletters[newsletterIndex];

    // Prevent deletion of sent newsletters
    if (newsletter.status === 'sent') {
      return NextResponse.json(
        { error: 'Cannot delete sent newsletters. Archive them instead.' },
        { status: 403 }
      );
    }

    // Remove newsletter
    mockNewsletters.splice(newsletterIndex, 1);

    return NextResponse.json({
      message: 'Newsletter deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting newsletter:', error);
    return NextResponse.json(
      { error: 'Failed to delete newsletter' },
      { status: 500 }
    );
  }
}

// Helper functions
function generateHtmlContent(
  content: string, 
  template: string, 
  headerImage?: string, 
  footerContent?: string
): string {
  const templateStyles = getTemplateStyles(template);
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          ${templateStyles}
        </style>
      </head>
      <body>
        <div class="email-container">
          ${headerImage ? `<img src="${headerImage}" alt="Header" class="header-image">` : ''}
          <div class="content">
            ${content}
          </div>
          ${footerContent ? `<div class="footer">${footerContent}</div>` : ''}
          <div class="unsubscribe">
            <p><a href="{{unsubscribe_url}}">Unsubscribe</a> | <a href="{{preferences_url}}">Update Preferences</a></p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function getTemplateStyles(template: string): string {
  const baseStyles = `
    body { 
      font-family: Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 20px; 
    }
    .email-container { 
      background: #ffffff; 
      border-radius: 8px; 
      overflow: hidden; 
    }
    .header-image { 
      width: 100%; 
      height: auto; 
      display: block; 
    }
    .content { 
      padding: 30px; 
    }
    .footer { 
      background: #f8f9fa; 
      padding: 20px 30px; 
      border-top: 1px solid #dee2e6; 
    }
    .unsubscribe { 
      background: #f8f9fa; 
      padding: 15px 30px; 
      text-align: center; 
      font-size: 12px; 
      color: #6c757d; 
    }
    .unsubscribe a { 
      color: #007bff; 
      text-decoration: none; 
    }
    h1, h2, h3 { 
      color: #2c3e50; 
    }
    a { 
      color: #007bff; 
    }
  `;

  switch (template) {
    case 'digest':
      return baseStyles + `
        .content h2 { 
          border-bottom: 2px solid #007bff; 
          padding-bottom: 10px; 
        }
        .content ul { 
          background: #f8f9fa; 
          padding: 20px; 
          border-radius: 5px; 
        }
      `;
    case 'announcement':
      return baseStyles + `
        .content { 
          text-align: center; 
        }
        .content h1 { 
          color: #e74c3c; 
          font-size: 32px; 
        }
        .content p { 
          font-size: 18px; 
        }
      `;
    default:
      return baseStyles;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Get newsletter stats for dashboard
const handleGetStats = async (): Promise<NextResponse> => {
  // Mock data for now - replace with actual database queries
  const stats = {
    totalNewsletters: 24,
    totalSubscribers: 2683,
    activeSubscribers: 2683,
    totalCampaigns: 18,
    pendingCampaigns: 3,
    averageOpenRate: 0.582,
    averageClickRate: 0.167,
    subscriberGrowth: {
      newSubscribers: 47,
      unsubscribes: 12,
      netGrowth: 35
    }
  };

  return NextResponse.json(stats);
};

// Get newsletter stats for dashboard
const handleGetNewsletters = async (): Promise<NextResponse> => {
  // Mock data for now - replace with actual database queries
  const newsletters = mockNewsletters.map(newsletter => ({
    id: newsletter.id,
    title: newsletter.title,
    status: newsletter.status,
    type: newsletter.type,
    createdAt: newsletter.createdAt,
    updatedAt: newsletter.updatedAt
  }));

  return NextResponse.json({ newsletters });
};

// Get newsletter stats for dashboard
const handleGetSubscribers = async (): Promise<NextResponse> => {
  // Mock data for now - replace with actual database queries
  const subscribers = [
    { id: '1', email: 'john@example.com', subscribedAt: new Date('2024-01-01') },
    { id: '2', email: 'jane@example.com', subscribedAt: new Date('2024-01-05') },
    { id: '3', email: 'bob@example.com', subscribedAt: new Date('2024-01-10') }
  ];

  return NextResponse.json({ subscribers });
};

// Get newsletter stats for dashboard
const handleGetAnalytics = async (): Promise<NextResponse> => {
  // Mock data for now - replace with actual database queries
  const analytics = {
    totalClicks: 1200,
    totalOpens: 2000,
    openRate: 0.6,
    clickRate: 0.06,
    topLinks: [
      { url: 'https://example.com/react-patterns', clicks: 245 },
      { url: 'https://example.com/nextjs-14', clicks: 189 }
    ]
  };

  return NextResponse.json(analytics);
}; 