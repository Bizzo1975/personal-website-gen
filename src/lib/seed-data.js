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

const Profile = mongoose.models.Profile || mongoose.model('Profile', new mongoose.Schema({
  name: String,
  imageUrl: String,
  skills: [String],
  bio: String,
  location: String,
  email: String,
  socialLinks: {
    github: String,
    twitter: String,
    linkedin: String,
    website: String
  },
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
    await Profile.deleteMany({});
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
        featured: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'AI Image Generator',
        slug: 'ai-image-generator',
        description: 'An application that generates images from text descriptions using AI.',
        image: 'https://images.unsplash.com/photo-1526378722484-bd91ca387e72',
        technologies: ['Python', 'TensorFlow', 'FastAPI', 'React'],
        liveDemo: 'https://example.com/ai-image-generator',
        sourceCode: 'https://github.com/johndoe/ai-image',
        featured: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    await Project.insertMany(projects);
    console.log('Created sample projects');

    // Create profile
    const profile = {
      name: 'John Doe',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
      skills: [
        'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js',
        'Express', 'MongoDB', 'PostgreSQL', 'HTML5', 'CSS3',
        'Tailwind CSS', 'Git', 'Docker', 'AWS'
      ],
      bio: "Full-stack developer with a passion for building web applications",
      location: "New York, USA",
      email: "john@example.com",
      socialLinks: {
        github: "https://github.com/johndoe",
        twitter: "https://twitter.com/johndoe",
        linkedin: "https://linkedin.com/in/johndoe",
        website: "https://johndoe.com"
      },
      updatedAt: new Date()
    };
    await Profile.create(profile);
    console.log('Created profile');

    // Create sample pages
    const pages = [
      {
        name: 'About Page',
        title: 'About Me | John Doe',
        slug: 'about',
        content: `# About Me

I am a passionate developer with experience in web technologies. I love building apps with React, Next.js, and TypeScript.

## Experience

Over 5 years of experience in web development, specializing in modern JavaScript frameworks. I've worked on a variety of projects from e-commerce solutions to content management systems.

## Education

- Bachelor's Degree in Computer Science
- Various online courses and certifications in modern web development

## Interests

When I'm not coding, I enjoy hiking, reading science fiction, and exploring new technologies.`,
        metaDescription: 'Learn more about John Doe, a full stack developer specializing in React and Next.js',
        updatedAt: new Date()
      },
      {
        name: 'Home Page',
        title: 'John Doe | Developer Portfolio',
        slug: 'home',
        content: `# Welcome to My Portfolio

I'm a full-stack developer specializing in building exceptional digital experiences. Currently, I'm focused on creating accessible, human-centered products.

## My Skills

I have expertise in modern web development technologies, including React, Next.js, Node.js, and more. I'm passionate about creating clean, efficient, and user-friendly applications.`,
        metaDescription: 'John Doe - Full Stack Developer portfolio showcasing projects and skills in React, Next.js, and more',
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