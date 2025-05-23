// Simple script to test MongoDB connection and Page model
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not defined.');
  process.exit(1);
}

// Define Page schema
const PageSchema = new mongoose.Schema({
  name: String,
  title: String,
  slug: String,
  content: String,
  metaDescription: String,
  updatedAt: Date
});

// Connect to MongoDB
async function testConnection() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB!');

    // Create the Page model (if not already defined)
    const Page = mongoose.models.Page || mongoose.model('Page', PageSchema);
    
    // Fetch all pages
    console.log('Fetching pages...');
    const pages = await Page.find({});
    
    console.log(`Found ${pages.length} pages:`);
    
    // Log each page
    pages.forEach(page => {
      console.log(`- ${page.name} (${page.slug}): ${page.title.substring(0, 50)}...`);
    });

    // Check for home and about pages specifically
    const homePage = await Page.findOne({ slug: 'home' });
    const aboutPage = await Page.findOne({ slug: 'about' });

    console.log('\nSpecific pages check:');
    console.log('Home page exists:', !!homePage);
    console.log('About page exists:', !!aboutPage);

    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testConnection(); 