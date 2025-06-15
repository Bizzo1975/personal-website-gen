import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// Mock version data - in a real app, this would come from a database
const mockVersions: { [contentId: string]: any[] } = {
  '1': [
    {
      id: 'v1-1',
      contentId: '1',
      version: 3,
      title: 'Getting Started with Next.js 14',
      content: `# Getting Started with Next.js 14

Next.js 14 introduces several exciting features that make building React applications even more powerful and efficient.

## Key Features

### App Router (Stable)
The App Router is now stable and provides a new way to structure your Next.js applications with improved performance and developer experience.

### Server Components
Server Components allow you to render components on the server, reducing the JavaScript bundle size and improving performance.

### Turbopack (Beta)
Turbopack is a new bundler that's significantly faster than Webpack, especially for large applications.

## Getting Started

To create a new Next.js 14 project:

\`\`\`bash
npx create-next-app@latest my-app
cd my-app
npm run dev
\`\`\`

## Conclusion

Next.js 14 represents a significant step forward in React development, offering improved performance, better developer experience, and powerful new features.`,
      excerpt: 'Learn about the exciting new features in Next.js 14 and how to get started with them.',
      tags: ['Next.js', 'React', 'JavaScript', 'Web Development'],
      author: 'Admin User',
      createdAt: '2024-01-15T15:30:00Z',
      changeType: 'updated',
      changeDescription: 'Added Turbopack section and improved examples',
      isCurrent: true
    },
    {
      id: 'v1-2',
      contentId: '1',
      version: 2,
      title: 'Getting Started with Next.js 14',
      content: `# Getting Started with Next.js 14

Next.js 14 introduces several exciting features that make building React applications even more powerful and efficient.

## Key Features

### App Router (Stable)
The App Router is now stable and provides a new way to structure your Next.js applications with improved performance and developer experience.

### Server Components
Server Components allow you to render components on the server, reducing the JavaScript bundle size and improving performance.

## Getting Started

To create a new Next.js 14 project:

\`\`\`bash
npx create-next-app@latest my-app
cd my-app
npm run dev
\`\`\`

## Conclusion

Next.js 14 represents a significant step forward in React development.`,
      excerpt: 'Learn about the exciting new features in Next.js 14 and how to get started with them.',
      tags: ['Next.js', 'React', 'JavaScript'],
      author: 'Admin User',
      createdAt: '2024-01-15T12:00:00Z',
      changeType: 'updated',
      changeDescription: 'Expanded content with more detailed explanations',
      isCurrent: false
    },
    {
      id: 'v1-3',
      contentId: '1',
      version: 1,
      title: 'Getting Started with Next.js 14',
      content: `# Getting Started with Next.js 14

Next.js 14 introduces several exciting features.

## Key Features

### App Router
The App Router is now stable.

### Server Components
Server Components allow you to render components on the server.

## Getting Started

To create a new Next.js 14 project:

\`\`\`bash
npx create-next-app@latest my-app
\`\`\``,
      excerpt: 'Learn about Next.js 14 features.',
      tags: ['Next.js', 'React'],
      author: 'Admin User',
      createdAt: '2024-01-15T10:00:00Z',
      changeType: 'created',
      changeDescription: 'Initial post creation',
      isCurrent: false
    }
  ],
  '2': [
    {
      id: 'v2-1',
      contentId: '2',
      version: 2,
      title: 'Advanced TypeScript Patterns',
      content: `# Advanced TypeScript Patterns

TypeScript offers powerful features that can help you write more maintainable and type-safe code.

## Generic Constraints

Generic constraints allow you to limit the types that can be used with generics:

\`\`\`typescript
interface Lengthwise {
  length: number;
}

function loggingIdentity<T extends Lengthwise>(arg: T): T {
  console.log(arg.length);
  return arg;
}
\`\`\`

## Conditional Types

Conditional types enable you to create types that depend on a condition:

\`\`\`typescript
type ApiResponse<T> = T extends string ? string : T extends number ? number : never;
\`\`\`

## Mapped Types

Mapped types allow you to create new types based on existing ones:

\`\`\`typescript
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};
\`\`\`

## Template Literal Types

Template literal types provide powerful string manipulation at the type level:

\`\`\`typescript
type EventName<T extends string> = \`on\${Capitalize<T>}\`;
type ButtonEvent = EventName<'click'>; // 'onClick'
\`\`\``,
      excerpt: 'Explore advanced TypeScript patterns including generics, conditional types, and more.',
      tags: ['TypeScript', 'Patterns', 'Development', 'Advanced'],
      author: 'Admin User',
      createdAt: '2024-01-14T16:45:00Z',
      changeType: 'updated',
      changeDescription: 'Added template literal types section',
      isCurrent: true
    },
    {
      id: 'v2-2',
      contentId: '2',
      version: 1,
      title: 'Advanced TypeScript Patterns',
      content: `# Advanced TypeScript Patterns

TypeScript offers powerful features that can help you write more maintainable and type-safe code.

## Generic Constraints

Generic constraints allow you to limit the types that can be used with generics:

\`\`\`typescript
interface Lengthwise {
  length: number;
}

function loggingIdentity<T extends Lengthwise>(arg: T): T {
  console.log(arg.length);
  return arg;
}
\`\`\`

## Conditional Types

Conditional types enable you to create types that depend on a condition:

\`\`\`typescript
type ApiResponse<T> = T extends string ? string : T extends number ? number : never;
\`\`\`

## Mapped Types

Mapped types allow you to create new types based on existing ones:

\`\`\`typescript
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};
\`\`\``,
      excerpt: 'Explore advanced TypeScript patterns including generics, conditional types, and more.',
      tags: ['TypeScript', 'Patterns', 'Development'],
      author: 'Admin User',
      createdAt: '2024-01-14T14:20:00Z',
      changeType: 'created',
      changeDescription: 'Initial draft creation',
      isCurrent: false
    }
  ],
  '3': [
    {
      id: 'v3-1',
      contentId: '3',
      version: 1,
      title: 'E-commerce Platform',
      content: `# E-commerce Platform

A full-featured e-commerce platform built with modern web technologies.

## Features

- User authentication and authorization
- Product catalog with search and filtering
- Shopping cart functionality
- Payment processing with Stripe
- Order management system
- Admin dashboard for inventory management

## Technologies Used

- **Frontend**: React, Next.js, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Payment**: Stripe API
- **Authentication**: NextAuth.js

## Architecture

The platform follows a microservices architecture with separate services for:
- User management
- Product catalog
- Order processing
- Payment handling

## Key Challenges

1. **Performance**: Optimized database queries and implemented caching
2. **Security**: Implemented proper authentication and data validation
3. **Scalability**: Designed with horizontal scaling in mind

## Results

- 99.9% uptime
- Sub-second page load times
- Secure payment processing
- Positive user feedback`,
      excerpt: 'A comprehensive e-commerce platform with modern features and robust architecture.',
      tags: ['React', 'Node.js', 'MongoDB', 'E-commerce', 'Stripe'],
      author: 'Admin User',
      createdAt: '2024-01-10T14:30:00Z',
      changeType: 'created',
      changeDescription: 'Initial project documentation',
      isCurrent: true
    }
  ]
};

export async function GET(
  request: NextRequest,
  { params }: { params: { contentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentId = params.contentId;
    
    // Get versions for the content item
    const versions = mockVersions[contentId] || [];
    
    // Sort by version number descending (newest first)
    const sortedVersions = versions.sort((a, b) => b.version - a.version);

    return NextResponse.json(sortedVersions);

  } catch (error) {
    console.error('Error fetching content versions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 