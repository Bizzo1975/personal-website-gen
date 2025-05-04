require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('Connection string:', process.env.MONGODB_URI.replace(/:([^:@]+)@/, ':****@')); // Hide password
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully!');
    
    // Test the Page model
    const Page = mongoose.models.Page || mongoose.model('Page', new mongoose.Schema({
      name: String,
      title: String,
      slug: String,
      content: String,
      metaDescription: String,
      updatedAt: Date
    }));
    
    const pages = await Page.find({}).limit(1);
    console.log('Found pages:', pages.length);
    
    if (pages.length > 0) {
      console.log('Sample page slug:', pages[0].slug);
    } else {
      console.log('No pages found in database. You may need to run the seed script.');
    }
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testConnection(); 