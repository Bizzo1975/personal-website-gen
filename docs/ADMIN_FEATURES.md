# Admin Features Documentation

This document outlines all the administrative features and content management capabilities implemented in the personal website project.

## Overview

The admin system provides a comprehensive content management interface that allows administrators to:
- Manage site settings and branding
- Edit page content and headers
- Manage blog posts and projects
- Configure contact information
- Upload and manage media files
- Control access and user permissions

## Authentication & Security

### NextAuth.js Integration
- Secure authentication using NextAuth.js with credentials provider
- Role-based access control (admin/user roles)
- Protected routes with middleware
- Session management and token rotation
- CSRF protection and rate limiting

### Default Admin Credentials
```
Email: admin@example.com
Password: admin12345
```

### Security Features
- JWT-based session management
- Protected API endpoints
- Role-based route protection
- Input validation and sanitization
- Rate limiting on API endpoints

## Admin Dashboard

### Dashboard Overview
- Quick stats for posts, projects, and users
- Recent activity summary
- Quick action buttons for common tasks
- Links to all admin sections

### Navigation Structure
```
├── Dashboard
├── Content Management
│   ├── Home Page
│   ├── About Me
│   ├── Projects
│   ├── Posts
│   └── Contact
├── Settings
│   ├── Profile Settings
│   └── Site Settings
└── Additional Management
    ├── Slideshow
    └── Access Requests
```

## Content Management Features

### Page Header Editing
All main pages (Projects, Posts, Contact) now support editable headers:
- **Header Title**: The main heading displayed at the top of the page
- **Header Subtitle**: Descriptive text below the main heading
- Real-time updates to frontend when saved
- Fallback to default values if not customized

#### Implementation Details
- Headers are stored in the database as part of page data
- `HeaderSection` component accepts `pageData` prop
- Admin forms include header editing fields
- Frontend pages fetch and display header data

### Site Settings Management

#### Branding & Logo
- Logo upload and management
- Logo text/name customization
- Logo positioning and styling options

#### Footer Content
- **Footer Text**: Technical or copyright information
- **Bio Text**: Personal or professional description
- Inline editing capabilities for admin users
- Live preview of changes

#### Navigation
- Customizable navigation menu
- Link management (internal/external)
- Navigation style options

### Project Management
- Create, edit, and delete projects
- Project image upload and gallery
- Technology tags and categories
- Live demo and repository links
- Project status and visibility control

### Blog Post Management
- Rich text editor (SimpleMDE) for Markdown content
- Post categories and tags
- Publishing status control
- Featured image upload
- SEO metadata management

### Contact Page Management
- Contact form configuration
- Contact information editing
- Custom content above contact form
- Header customization

## Database Models

### Site Settings
```typescript
{
  logoUrl: string
  logoText: string
  footerText: string
  bioText: string
  navbarStyle: string
  navbarLinks: NavbarLink[]
}
```

### Page Data
```typescript
{
  id: string
  slug: string
  title: string
  headerTitle?: string
  headerSubtitle?: string
  content: string
  metaDescription?: string
  isPublished: boolean
}
```

### User Model
```typescript
{
  name: string
  email: string
  password: string (hashed)
  role: 'admin' | 'user'
  createdAt: Date
}
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/auth/session` - Current session
- `POST /api/auth/signout` - User logout

### Site Settings
- `GET /api/site-settings` - Fetch site settings
- `PUT /api/site-settings` - Update site settings

### Page Management
- `GET /api/pages/[id]` - Fetch page data
- `PUT /api/pages/[id]` - Update page data
- `POST /api/pages` - Create new page
- `DELETE /api/pages/[id]` - Delete page

### Content Management
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

## File Upload System

### Image Management
- Secure file upload to `/public/uploads/images/`
- Image validation and processing
- Multiple format support (JPG, PNG, WebP)
- Automatic thumbnail generation
- File size limits and validation

### Upload API
- `POST /api/admin/upload` - File upload endpoint
- Content-type validation
- File size limits
- Secure file naming

## Testing Coverage

### Unit Tests
- Admin component testing
- Authentication flow testing
- API endpoint testing
- Form validation testing

### Integration Tests
- Admin workflow testing
- Database operation testing
- API integration testing

### E2E Tests (Cypress)
- Complete admin workflows
- Authentication scenarios
- Content management flows
- Form submission testing
- Error handling verification

## Usage Guide

### Getting Started
1. Start the development server: `npm run dev`
2. Navigate to `/admin/login`
3. Login with admin credentials
4. Access the dashboard at `/admin/dashboard`

### Managing Site Settings
1. Navigate to **Settings > Site Settings**
2. Update logo, branding, and footer content
3. Configure navigation menu
4. Save changes to apply site-wide

### Editing Page Headers
1. Go to respective admin page (Projects, Posts, Contact)
2. Use the header editing form at the top
3. Enter custom title and subtitle
4. Save to update frontend display

### Content Creation
1. Use **Add New Page** for custom pages
2. Use **Create New Post** for blog content
3. Use **Create New Project** for portfolio items
4. Fill required fields and publish when ready

## Troubleshooting

### Common Issues
1. **Login Issues**: Check environment variables and database connection
2. **File Upload Errors**: Verify upload directory permissions
3. **API Errors**: Check authentication and role permissions
4. **Database Issues**: Run database connection tests

### Debug Scripts
- `node scripts/maintenance/debug-auth.js` - Check authentication setup
- `node scripts/maintenance/debug-admin-pages.js` - Check page data
- `node scripts/setup/init-admin.js` - Reset admin user

### Environment Setup
Ensure `.env.local` contains:
```
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
MONGODB_URI="your-mongodb-connection-string"
```

## Future Enhancements

### Planned Features
- Content scheduling and publishing workflow
- Multi-user collaboration features
- Enhanced SEO optimization tools
- Backup and restore functionality
- Analytics dashboard integration

### Technical Improvements
- Real-time content preview
- Advanced image optimization
- Improved caching strategies
- Enhanced security measures

## Contributing

When adding new admin features:
1. Follow the existing component structure
2. Implement proper authentication checks
3. Add appropriate API endpoints
4. Include unit and E2E tests
5. Update this documentation

## Support

For technical issues or feature requests:
1. Check existing troubleshooting guides
2. Review debug script outputs
3. Consult the development logs
4. Submit detailed issue reports 