import { compare, hash } from 'bcrypt';
import dbConnect from './db';
import User from './models/User';

export async function createUser(userData: {
  name: string;
  email: string;
  password: string;
}) {
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
  await dbConnect();
  const user = await User.findOne({ email });
  return user;
}

export async function verifyPassword(password: string, hashedPassword: string) {
  const isValid = await compare(password, hashedPassword);
  return isValid;
} 