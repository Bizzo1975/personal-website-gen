// init-pages.js
// This script initializes the home and about pages

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const path = require('path');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

console.log('Connecting to MongoDB...');
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define Page schema
const PageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  metaDescription: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now },
});

// Create model (handle case when model already exists)
let Page;
try {
  Page = mongoose.model('Page');
} catch (e) {
  Page = mongoose.model('Page', PageSchema);
}

// Default pages
const defaultPages = [
  {
    name: 'Home Page',
    title: 'Welcome to My Personal Website',
    slug: 'home',
    content: `# Welcome to My Website

This is the home page of my personal website. Here you'll find information about me, my projects, and my blog.

## Featured Projects

- Project 1: A brief description
- Project 2: A brief description
- Project 3: A brief description

## Latest Blog Posts

- [Blog Post 1](/blog/post-1)
- [Blog Post 2](/blog/post-2)
- [Blog Post 3](/blog/post-3)

Feel free to [contact me](/contact) if you have any questions or would like to collaborate on a project.`,
    metaDescription: 'Personal website showcasing projects, blog posts, and professional information.',
  },
  {
    name: 'About Page',
    title: 'About Me',
    slug: 'about',
    content: `# About Me

I'm a passionate developer with experience in web development, cloud computing, and machine learning.

## Skills

- Frontend: React, Vue.js, TypeScript
- Backend: Node.js, Express, Python
- Cloud: AWS, Google Cloud Platform
- DevOps: Docker, Kubernetes, CI/CD

## Experience

### Senior Developer at XYZ Company (2019-Present)

- Led the development of a high-traffic web application
- Implemented CI/CD pipelines that reduced deployment time by 70%
- Mentored junior developers and conducted code reviews

### Developer at ABC Inc. (2016-2019)

- Built RESTful APIs using Node.js and Express
- Worked on frontend development with React
- Implemented automated testing with Jest and Cypress

## Education

- M.S. in Computer Science, University of Technology
- B.S. in Computer Engineering, State University

## Contact

Feel free to reach out to me at example@email.com or connect with me on [LinkedIn](https://linkedin.com).`,
    metaDescription: 'Learn about my professional background, skills, experience, and education.',
  },
];

async function initPages() {
  console.log('Initializing default pages...');
  
  for (const pageData of defaultPages) {
    try {
      // Check if the page already exists
      const existingPage = await Page.findOne({ slug: pageData.slug });
      
      if (existingPage) {
        console.log(`Page '${pageData.name}' (${pageData.slug}) already exists.`);
      } else {
        // Create the page
        const newPage = new Page(pageData);
        await newPage.save();
        console.log(`Created page: ${pageData.name} (${pageData.slug})`);
      }
    } catch (error) {
      console.error(`Error creating/checking page ${pageData.name}:`, error);
    }
  }
  
  console.log('Page initialization complete!');
  mongoose.connection.close();
}

initPages();
