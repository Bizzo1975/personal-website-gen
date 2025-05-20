// Script to debug admin pages issues
const mongoose = require('mongoose');

// Use hardcoded MongoDB URI since environment variables might not be loading correctly
const MONGODB_URI = "mongodb+srv://webuidb:Skyler01@cluster0.7us70qf.mongodb.net/?retryWrites=true&w=majority";

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
}

// Define the Page schema
const pageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  content: {
    type: String,
    required: true,
  },
  metaDescription: {
    type: String,
    default: '',
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Debug function to check pages in the database
async function debugPages() {
  console.log('=== DEBUG: ADMIN PAGES ===');
  
  // Check database connection
  const isConnected = await connectToDatabase();
  if (!isConnected) {
    console.error('ERROR: Could not connect to MongoDB. Check your connection string.');
    process.exit(1);
  }

  console.log('\n1. Database Connection: ✅ Connected');

  // Create Page model
  const Page = mongoose.models.Page || mongoose.model('Page', pageSchema);
  console.log('\n2. Page Model: ✅ Defined');

  try {
    // Get total count of pages
    const pageCount = await Page.countDocuments();
    console.log(`\n3. Page Count: ${pageCount} total pages in database`);

    // Check for home and about pages
    const homePage = await Page.findOne({ slug: 'home' });
    const aboutPage = await Page.findOne({ slug: 'about' });
    const contactPage = await Page.findOne({ slug: 'contact' });

    console.log('\n4. Critical Pages:');
    console.log(`   - Home Page: ${homePage ? '✅ Found' : '❌ MISSING'}`);
    console.log(`   - About Page: ${aboutPage ? '✅ Found' : '❌ MISSING'}`);
    console.log(`   - Contact Page: ${contactPage ? '✅ Found' : '❌ MISSING'}`);

    // List all pages
    const allPages = await Page.find({});
    console.log('\n5. All Pages in Database:');
    if (allPages.length === 0) {
      console.log('   No pages found in database!');
    } else {
      allPages.forEach((page, index) => {
        console.log(`   ${index + 1}. ID: ${page._id}, Name: ${page.name}, Slug: ${page.slug}, Updated: ${page.updatedAt}`);
      });
    }

    // Print the home page content (first 100 chars)
    if (homePage) {
      console.log('\n6. Home Page Content Preview:');
      console.log(`   ${homePage.content.substring(0, 100)}...`);
    }

    console.log('\n=== DEBUGGING RECOMMENDATIONS ===');
    if (pageCount === 0) {
      console.log('• No pages found in database. Run scripts/setup/init-pages.js to initialize pages.');
    } else if (!homePage || !aboutPage || !contactPage) {
      console.log('• One or more critical pages are missing. Run scripts/setup/init-pages.js to initialize pages.');
    } else {
      console.log('• Database appears to have pages properly configured.');
      console.log('• If admin dashboard is not showing pages, check:');
      console.log('  1. API routes in src/app/api/pages/route.ts');
      console.log('  2. Authentication in src/app/api/auth/[...nextauth]/route.ts');
      console.log('  3. Fetch calls in src/app/admin/pages/page.tsx');
      console.log('  4. Network requests in browser console for errors');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error);
  } finally {
    // Close the database connection
    await mongoose.disconnect();
    console.log('\nDatabase connection closed');
  }
}

// Run the debug function
debugPages(); 