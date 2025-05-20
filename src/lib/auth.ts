import { compare, hash } from 'bcrypt';
import dbConnect from './db';
import User from './models/User';

// Mock user data for development
const mockUsers = [
  {
    _id: 'mock-user-id-1',
    name: 'Admin User',
    email: 'admin@example.com',
    // This is a bcrypt hash of 'admin12345'
    password: '$2b$10$5qaOkHjNJfZnJIoB9yBUkOjfXO2xGLAFfa/geHQJ7G/t2I7KFM5ie',
    role: 'admin',
    createdAt: new Date('2023-01-01')
  }
];

// Helper function to determine if we should use mock data
const useMockData = () => {
  // Use mock data if no MongoDB URI or in development mode
  return !process.env.MONGODB_URI || process.env.NODE_ENV === 'development';
};

export async function createUser(userData: {
  name: string;
  email: string;
  password: string;
}) {
  // In development mode with mock data, just return success
  if (useMockData()) {
    console.log('Mock mode: Simulating user creation for', userData.email);
    return { 
      id: 'mock-user-id-' + Date.now(),
      name: userData.name, 
      email: userData.email, 
      role: 'admin' 
    };
  }
  
  // Real implementation
  await dbConnect();
  
  const { name, email, password } = userData;
  
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('User already exists');
  }
  
  // Hash password
  const hashedPassword = await hash(password, 12);
  
  // Create user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: 'admin', // First user is admin for simplicity
  });
  
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}

export async function getUserByEmail(email: string) {
  // In development mode with mock data, use the mock users
  if (useMockData()) {
    console.log('Mock mode: Looking up user by email', email);
    const user = mockUsers.find(u => u.email === email);
    return user || null;
  }
  
  // Real implementation
  await dbConnect();
  const user = await User.findOne({ email });
  return user;
}

export async function verifyPassword(password: string, hashedPassword: string) {
  const isValid = await compare(password, hashedPassword);
  return isValid;
} 