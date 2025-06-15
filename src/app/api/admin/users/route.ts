import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// Mock user data - in a real app, this would come from a database
const mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin' as const,
    status: 'active' as const,
    lastLogin: '2024-01-15T10:30:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    permissions: ['manage_users', 'manage_settings', 'view_analytics', 'manage_media', 'edit_posts', 'delete_posts']
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'editor' as const,
    status: 'active' as const,
    lastLogin: '2024-01-14T15:45:00Z',
    createdAt: '2024-01-02T00:00:00Z',
    permissions: ['edit_posts', 'write_posts', 'read_posts', 'manage_media']
  },
  {
    id: '3',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    role: 'author' as const,
    status: 'active' as const,
    lastLogin: '2024-01-13T09:20:00Z',
    createdAt: '2024-01-03T00:00:00Z',
    permissions: ['write_posts', 'read_posts', 'edit_posts']
  },
  {
    id: '4',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'subscriber' as const,
    status: 'pending' as const,
    createdAt: '2024-01-10T00:00:00Z',
    permissions: ['read_posts']
  },
  {
    id: '5',
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    role: 'author' as const,
    status: 'inactive' as const,
    lastLogin: '2024-01-05T12:00:00Z',
    createdAt: '2024-01-05T00:00:00Z',
    permissions: ['write_posts', 'read_posts']
  }
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a real app, you would fetch from database with proper filtering and pagination
    return NextResponse.json(mockUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = await request.json();
    
    // Validate required fields
    if (!userData.name || !userData.email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = mockUsers.find(u => u.email === userData.email);
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    // Create new user
    const newUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: userData.name,
      email: userData.email,
      role: userData.role || 'subscriber',
      status: userData.status || 'active',
      createdAt: new Date().toISOString(),
      permissions: userData.permissions || ['read_posts']
    };

    // In a real app, you would save to database
    mockUsers.push(newUser);

    return NextResponse.json({ 
      success: true, 
      user: newUser,
      message: 'User created successfully'
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
} 

