import { hash } from 'bcrypt';
import mongoose from 'mongoose';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Import models directly using require for compatibility
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  createdAt: Date
}));

const Post = mongoose.models.Post || mongoose.model('Post', new mongoose.Schema({
  title: String,
  slug: String,
  date: Date,
  readTime: Number,
  excerpt: String,
  content: String,
  tags: [String],
  author: mongoose.Schema.Types.ObjectId,
  published: Boolean,
  updatedAt: Date
}));

const Project = mongoose.models.Project || mongoose.model('Project', new mongoose.Schema({
  title: String,
  slug: String,
  description: String,
  image: String,
  technologies: [String],
  liveDemo: String,
  sourceCode: String,
  featured: Boolean,
  createdAt: Date,
  updatedAt: Date
}));

async function seedDatabase() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    // Clear existing data
    await User.deleteMany({});
    await Post.deleteMany({});
    await Project.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const hashedPassword = await hash('admin12345', 12);
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date()
    });
    console.log('Created admin user');

    // Create sample posts
    const posts = [
      {
        title: 'Getting Started with Next.js and TypeScript',
        slug: 'getting-started-with-nextjs-and-typescript',
        date: new Date('2023-11-15'),
        readTime: 5,
        excerpt: 'Learn how to set up a new project with Next.js and TypeScript from scratch...',
        content: '# Getting Started with Next.js and TypeScript\n\nThis is a sample blog post content.',
        tags: ['Next.js', 'TypeScript', 'React'],
        author: adminUser._id,
        published: true,
        updatedAt: new Date()
      },
      {
        title: 'Why I Switched to Tailwind CSS',
        slug: 'why-i-switched-to-tailwind-css',
        date: new Date('2023-10-28'),
        readTime: 4,
        excerpt: 'After years of using traditional CSS and CSS-in-JS solutions...',
        content: '# Why I Switched to Tailwind CSS\n\nThis is a sample blog post content.',
        tags: ['CSS', 'Tailwind CSS', 'Web Development'],
        author: adminUser._id,
        published: true,
        updatedAt: new Date()
      }
    ];
    await Post.insertMany(posts);
    console.log('Created sample posts');

    // Create sample projects
    const projects = [
      {
        title: 'E-commerce Platform',
        slug: 'ecommerce-platform',
        description: 'A full-featured e-commerce platform built with Next.js.',
        image: 'https://images.unsplash.com/photo-1557821552-17105176677c',
        technologies: ['Next.js', 'React', 'MongoDB', 'Stripe', 'Tailwind CSS'],
        liveDemo: 'https://example.com/ecommerce',
        sourceCode: 'https://github.com/johndoe/ecommerce',
        featured: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Task Management App',
        slug: 'task-management-app',
        description: 'A productivity application for managing tasks and projects.',
        image: 'https://images.unsplash.com/photo-1540350394557-8d14678e7f91',
        technologies: ['React', 'TypeScript', 'Redux', 'Firebase'],
        liveDemo: 'https://example.com/taskmanager',
        sourceCode: 'https://github.com/johndoe/taskmanager',
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    await Project.insertMany(projects);
    console.log('Created sample projects');

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

seedDatabase(); 