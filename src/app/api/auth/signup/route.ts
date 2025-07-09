import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();
    
    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Missing required fields: name, email, and password are required' 
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Please enter a valid email address' 
        },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Password must be at least 8 characters long' 
        },
        { status: 400 }
      );
    }

    // Validate name length
    if (name.trim().length < 2) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Name must be at least 2 characters long' 
        },
        { status: 400 }
      );
    }

    console.log('Attempting to create user:', { name: name.trim(), email: email.toLowerCase() });
    
    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    
    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { 
          success: false,
          message: 'An account with this email address already exists. Please sign in instead.' 
        },
        { status: 400 }
      );
    }
    
    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    // Insert new user
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
       RETURNING id, name, email, role`,
      [name.trim(), email.toLowerCase().trim(), password_hash, 'subscriber']
    );
    
    const user = result.rows[0];
    
    console.log('User created successfully:', { id: user.id, email: user.email, role: user.role });
    
    return NextResponse.json(
      { 
        success: true,
        message: 'User account created successfully. You can now sign in.',
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email,
          role: user.role
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in signup route:', error);
    
    if (error instanceof Error) {
      // Handle specific error cases
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { 
            success: false,
            message: 'An account with this email address already exists. Please sign in instead.' 
          },
          { status: 400 }
        );
      }
      
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        return NextResponse.json(
          { 
            success: false,
            message: 'An account with this email address already exists. Please sign in instead.' 
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false,
          message: error.message 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        message: 'An error occurred while creating your account. Please try again later.' 
      },
      { status: 500 }
    );
  }
} 
