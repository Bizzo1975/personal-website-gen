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

const Page = mongoose.models.Page || mongoose.model('Page', new mongoose.Schema({
  name: String,
  title: String,
  slug: String,
  content: String,
  metaDescription: String,
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
    await Page.deleteMany({});
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

    // Create sample pages
    const pages = [
      {
        name: 'Homepage',
        title: 'Home',
        slug: 'home',
        content: `# Welcome to My Personal Website

I'm a full-stack developer with a passion for creating modern, intuitive web applications using cutting-edge technologies.

## What I Do

- Frontend Development with React and Next.js
- Backend Development with Node.js and MongoDB
- UI/UX Design and Implementation
- Performance Optimization and Accessibility

Check out my [projects](/projects) or read my latest [blog posts](/blog).`,
        metaDescription: 'Personal website and portfolio of a full-stack developer specializing in React, Next.js, and modern web technologies.',
        updatedAt: new Date()
      },
      {
        name: 'About Page',
        title: 'About Me',
        slug: 'about',
        content: `# About Me

## My Journey

I started my coding journey over 5 years ago, initially working with HTML, CSS, and JavaScript. As I grew as a developer, I expanded my skill set to include modern frameworks and technologies like React, Next.js, Node.js, and MongoDB.

## Technologies I Work With

- **Frontend**: React, Next.js, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB, PostgreSQL
- **Tools**: Git, Docker, VS Code, Figma
- **Testing**: Jest, React Testing Library, Cypress

## My Philosophy

I believe in creating clean, maintainable code that solves real problems. User experience is at the center of everything I build, and I'm constantly learning and adapting to new technologies and best practices.

## Beyond Coding

When I'm not coding, you can find me hiking in the mountains, reading science fiction, or experimenting with new recipes in the kitchen.

## Let's Connect

Interested in working together? Feel free to [contact me](/contact) or connect with me on [GitHub](https://github.com) and [LinkedIn](https://linkedin.com).`,
        metaDescription: 'Learn more about my background, skills, and experience as a full-stack developer.',
        updatedAt: new Date()
      }
    ];
    await Page.insertMany(pages);
    console.log('Created sample pages');

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

seedDatabase(); 