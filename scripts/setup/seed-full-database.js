// Comprehensive Database Seeding Script for Development
// This script creates a fully populated development environment

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const { hash } = require('bcrypt');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://webuidb:Skyler01@cluster0.7us70qf.mongodb.net/?retryWrites=true&w=majority";

console.log('🌱 Starting comprehensive database seeding...');

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    return false;
  }
}

// Define schemas
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  createdAt: Date,
});

const PostSchema = new mongoose.Schema({
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
});

const ProjectSchema = new mongoose.Schema({
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
});

const PageSchema = new mongoose.Schema({
  name: String,
  title: String,
  slug: String,
  content: String,
  metaDescription: String,
  updatedAt: Date
});

const ProfileSchema = new mongoose.Schema({
  name: String,
  imageUrl: String,
  skills: [String],
  location: String,
  email: String,
  socialLinks: {
    github: String,
    twitter: String,
    linkedin: String,
    website: String
  },
  updatedAt: Date
});

// Create models
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);
const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
const Page = mongoose.models.Page || mongoose.model('Page', PageSchema);
const Profile = mongoose.models.Profile || mongoose.model('Profile', ProfileSchema);

async function seedDatabase() {
  try {
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Post.deleteMany({});
    await Project.deleteMany({});
    await Page.deleteMany({});
    await Profile.deleteMany({});
    console.log('✅ Existing data cleared');

    // Create admin user
    console.log('👤 Creating admin user...');
    const hashedPassword = await hash('admin12345', 12);
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date()
    });
    console.log('✅ Admin user created (admin@example.com / admin12345)');

    // Create sample posts
    console.log('📝 Creating sample blog posts...');
    const posts = [
      {
        title: 'Getting Started with Next.js and TypeScript',
        slug: 'getting-started-with-nextjs-and-typescript',
        date: new Date('2023-11-15'),
        readTime: 5,
        excerpt: 'Learn how to set up a new project with Next.js and TypeScript from scratch. This guide covers installation, configuration, and best practices.',
        content: `# Getting Started with Next.js and TypeScript

Next.js is a powerful React framework that provides server-side rendering, static site generation, and many other features out of the box.

## Why Next.js?

- **Performance**: Built-in optimizations
- **SEO**: Server-side rendering support
- **Developer Experience**: Hot reloading and TypeScript support
- **Deployment**: Easy deployment with Vercel

## Installation

\`\`\`bash
npx create-next-app@latest my-app --typescript
cd my-app
npm run dev
\`\`\`

## Project Structure

Your project will have this structure:
- \`pages/\` - File-based routing
- \`public/\` - Static assets
- \`styles/\` - CSS files
- \`components/\` - Reusable components

## Best Practices

1. Use TypeScript for type safety
2. Implement proper SEO with Head component
3. Optimize images with next/image
4. Use API routes for backend functionality

Happy coding!`,
        tags: ['Next.js', 'TypeScript', 'React', 'Tutorial'],
        author: adminUser._id,
        published: true,
        updatedAt: new Date()
      },
      {
        title: 'Why I Switched to Tailwind CSS',
        slug: 'why-i-switched-to-tailwind-css',
        date: new Date('2023-10-28'),
        readTime: 4,
        excerpt: 'After years of using traditional CSS and CSS-in-JS solutions, I discovered Tailwind CSS and it completely changed my approach to styling.',
        content: `# Why I Switched to Tailwind CSS

For years, I struggled with CSS organization, naming conventions, and maintaining consistent designs across projects.

## The Problems with Traditional CSS

- **Naming conflicts**: BEM methodology helped but was verbose
- **Dead code**: Hard to know which styles are actually used
- **Consistency**: Difficult to maintain design systems
- **Size**: CSS files kept growing

## Enter Tailwind CSS

Tailwind is a utility-first CSS framework that provides low-level utility classes.

### Benefits I've Experienced

1. **Rapid Development**: Build UIs faster with pre-defined classes
2. **Consistent Design**: Built-in design system with spacing, colors, etc.
3. **No CSS Files**: Write styles directly in your markup
4. **Tree-shaking**: Only includes styles you actually use
5. **Responsive Design**: Mobile-first utilities make responsive design easy

## Example

\`\`\`html
<!-- Traditional CSS -->
<div class="card">
  <h2 class="card-title">Title</h2>
</div>

<!-- Tailwind CSS -->
<div class="bg-white rounded-lg shadow-md p-6">
  <h2 class="text-xl font-bold text-gray-800">Title</h2>
</div>
\`\`\`

## Getting Started

\`\`\`bash
npm install tailwindcss
npx tailwindcss init
\`\`\`

The learning curve is worth it!`,
        tags: ['CSS', 'Tailwind CSS', 'Web Development', 'Frontend'],
        author: adminUser._id,
        published: true,
        updatedAt: new Date()
      },
      {
        title: 'Building a RESTful API with Node.js and Express',
        slug: 'building-restful-api-nodejs-express',
        date: new Date('2023-09-12'),
        readTime: 8,
        excerpt: 'Learn how to build a robust RESTful API using Node.js and Express, including authentication, validation, and best practices.',
        content: `# Building a RESTful API with Node.js and Express

Building APIs is a fundamental skill for full-stack developers. In this guide, we'll create a complete RESTful API.

## What is REST?

REST (Representational State Transfer) is an architectural style for web services.

### REST Principles

- **Stateless**: Each request contains all necessary information
- **Cacheable**: Responses should be cacheable when possible
- **Uniform Interface**: Consistent way to interact with resources
- **Layered System**: Architecture can be composed of multiple layers

## Setting Up Express

\`\`\`bash
npm init -y
npm install express mongoose dotenv bcrypt jsonwebtoken
npm install -D nodemon
\`\`\`

## Basic Server Setup

\`\`\`javascript
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Routes
app.get('/api/users', (req, res) => {
  res.json({ message: 'Get all users' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
\`\`\`

## HTTP Methods

- **GET**: Retrieve data
- **POST**: Create new data
- **PUT**: Update existing data
- **DELETE**: Remove data

## Best Practices

1. Use proper HTTP status codes
2. Implement authentication and authorization
3. Validate input data
4. Handle errors gracefully
5. Use middleware for common functionality
6. Document your API

This foundation will serve you well in building scalable applications!`,
        tags: ['Node.js', 'Express', 'API', 'Backend', 'MongoDB'],
        author: adminUser._id,
        published: true,
        updatedAt: new Date()
      }
    ];
    await Post.insertMany(posts);
    console.log(`✅ Created ${posts.length} sample blog posts`);

    // Create sample projects
    console.log('🚀 Creating sample projects...');
    const projects = [
      {
        title: 'E-commerce Platform',
        slug: 'ecommerce-platform',
        description: 'A full-featured e-commerce platform built with Next.js, featuring user authentication, payment processing, inventory management, and an admin dashboard.',
        image: 'https://images.unsplash.com/photo-1557821552-17105176677c',
        technologies: ['Next.js', 'React', 'MongoDB', 'Stripe', 'Tailwind CSS', 'NextAuth.js'],
        liveDemo: 'https://example.com/ecommerce',
        sourceCode: 'https://github.com/johndoe/ecommerce',
        featured: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Task Management App',
        slug: 'task-management-app',
        description: 'A productivity application for managing tasks and projects with real-time collaboration, drag-and-drop interface, and team management features.',
        image: 'https://images.unsplash.com/photo-1540350394557-8d14678e7f91',
        technologies: ['React', 'TypeScript', 'Redux', 'Firebase', 'Material-UI'],
        liveDemo: 'https://example.com/taskmanager',
        sourceCode: 'https://github.com/johndoe/taskmanager',
        featured: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'AI Image Generator',
        slug: 'ai-image-generator',
        description: 'An application that generates images from text descriptions using AI models, with features for image editing, style transfer, and batch processing.',
        image: 'https://images.unsplash.com/photo-1526378722484-bd91ca387e72',
        technologies: ['Python', 'TensorFlow', 'FastAPI', 'React', 'OpenAI API'],
        liveDemo: 'https://example.com/ai-image-generator',
        sourceCode: 'https://github.com/johndoe/ai-image',
        featured: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Weather Dashboard',
        slug: 'weather-dashboard',
        description: 'A responsive weather application with location-based forecasts, interactive maps, and weather alerts.',
        image: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b',
        technologies: ['Vue.js', 'JavaScript', 'OpenWeather API', 'Chart.js'],
        liveDemo: 'https://example.com/weather',
        sourceCode: 'https://github.com/johndoe/weather-app',
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    await Project.insertMany(projects);
    console.log(`✅ Created ${projects.length} sample projects`);

    // Create profile
    console.log('👨‍💻 Creating profile...');
    const profile = {
      name: 'John Doe',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
      skills: [
        'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js',
        'Express', 'MongoDB', 'PostgreSQL', 'HTML5', 'CSS3',
        'Tailwind CSS', 'Git', 'Docker', 'AWS', 'Python'
      ],
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
    console.log('✅ Profile created');

    // Create sample pages
    console.log('📄 Creating sample pages...');
    const pages = [
      {
        name: 'Home Page',
        title: 'John Doe | Full Stack Developer',
        slug: 'home',
        content: `# Welcome to My Portfolio

I'm a passionate full-stack developer specializing in building exceptional digital experiences. Currently, I'm focused on creating accessible, human-centered products using modern technologies.

## What I Do

I build responsive, performant, and accessible web applications using:

- **Frontend**: React, Next.js, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB, PostgreSQL
- **Cloud & DevOps**: AWS, Docker, CI/CD

## Featured Work

Check out my latest projects showcasing modern web development practices, from e-commerce platforms to AI-powered applications.

## Let's Connect

Whether you're looking to hire a developer, collaborate on a project, or just want to chat about technology, I'd love to hear from you!`,
        metaDescription: 'John Doe - Full Stack Developer portfolio showcasing projects and skills in React, Next.js, and modern web technologies',
        updatedAt: new Date()
      },
      {
        name: 'About Page',
        title: 'About Me | John Doe',
        slug: 'about',
        content: `# About Me

Hi! I'm John, a passionate full-stack developer with over 5 years of experience building web applications that make a difference.

## My Journey

I started my journey in computer science at university, where I fell in love with programming. Since then, I've worked on everything from startup MVPs to enterprise applications, always focusing on writing clean, maintainable code.

## What Drives Me

I'm passionate about:
- **User Experience**: Creating intuitive, accessible interfaces
- **Performance**: Building fast, efficient applications
- **Code Quality**: Writing maintainable, testable code
- **Continuous Learning**: Staying up-to-date with the latest technologies

## Skills & Expertise

### Frontend Development
- React, Next.js, Vue.js
- TypeScript, JavaScript (ES6+)
- HTML5, CSS3, Sass
- Tailwind CSS, Styled Components
- Responsive Design, Accessibility

### Backend Development
- Node.js, Express.js
- Python, FastAPI
- RESTful APIs, GraphQL
- Authentication & Authorization

### Database & DevOps
- MongoDB, PostgreSQL, Redis
- Docker, Kubernetes
- AWS, Google Cloud Platform
- CI/CD, GitHub Actions

## Education

- **M.S. Computer Science** - University of Technology (2018)
- **B.S. Computer Engineering** - State University (2016)

## When I'm Not Coding

I enjoy hiking, reading science fiction novels, contributing to open source projects, and experimenting with new technologies. I'm also passionate about mentoring new developers and giving back to the community.

## Let's Work Together

I'm always interested in exciting projects and opportunities. Feel free to reach out if you'd like to collaborate!`,
        metaDescription: 'Learn about John Doe, a full stack developer with expertise in React, Next.js, Node.js, and modern web technologies',
        updatedAt: new Date()
      },
      {
        name: 'Contact Page',
        title: 'Contact Me | John Doe',
        slug: 'contact',
        content: `# Get in Touch

I'm always open to discussing new projects, opportunities, or just chatting about technology. Whether you're a potential client, collaborator, or fellow developer, I'd love to hear from you!

## Let's Connect

The best way to reach me is through the contact form below, but you can also find me on various social platforms:

- **Email**: Available through the contact form
- **LinkedIn**: Connect with me professionally
- **GitHub**: Check out my open source contributions
- **Twitter**: Follow me for tech insights and updates

## What I'm Looking For

I'm particularly interested in:
- **Freelance Projects**: Web development, consulting, and technical architecture
- **Collaboration**: Open source projects and interesting side projects
- **Mentoring**: Helping new developers grow their skills
- **Speaking**: Tech talks, workshops, and podcast appearances

## Response Time

I typically respond to messages within 24 hours during business days. For urgent inquiries, please mention that in your message subject line.

Looking forward to hearing from you!`,
        metaDescription: 'Contact John Doe for web development projects, collaborations, and opportunities',
        updatedAt: new Date()
      }
    ];
    await Page.insertMany(pages);
    console.log(`✅ Created ${pages.length} sample pages`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   👤 Admin user: admin@example.com / admin12345`);
    console.log(`   📝 Blog posts: ${posts.length}`);
    console.log(`   🚀 Projects: ${projects.length}`);
    console.log(`   📄 Pages: ${pages.length}`);
    console.log(`   👨‍💻 Profile: 1`);
    console.log('\n🌐 Access your seeded site at: http://localhost:3007');
    console.log('🔧 Admin panel at: http://localhost:3007/admin');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from database');
  }
}

// Run the seeding
async function main() {
  const isConnected = await connectToDatabase();
  if (!isConnected) {
    console.log('❌ Could not connect to database. Exiting...');
    process.exit(1);
  }
  await seedDatabase();
}

main(); 