// Script to debug authentication issues
const mongoose = require('mongoose');
const { compare } = require('bcrypt');

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

// Define the User schema
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Debug function to check auth configuration
async function debugAuth() {
  console.log('=== DEBUG: AUTHENTICATION SYSTEM ===');
  
  // Check database connection
  const isConnected = await connectToDatabase();
  if (!isConnected) {
    console.error('ERROR: Could not connect to MongoDB. Check your connection string.');
    process.exit(1);
  }

  console.log('\n1. Database Connection: ✅ Connected');

  // Check for NEXTAUTH_SECRET
  const nextAuthSecret = process.env.NEXTAUTH_SECRET || 'no-secret-found';
  console.log(`\n2. NextAuth Secret: ${nextAuthSecret === 'no-secret-found' ? '❌ MISSING' : '✅ Found (not shown for security)'}`);
  if (nextAuthSecret === 'no-secret-found') {
    console.log('   WARNING: NEXTAUTH_SECRET is missing. JWT operations may fail.');
    console.log('   Create a .env.local file with NEXTAUTH_SECRET="your-secret-here"');
  }

  // Create User model
  const User = mongoose.models.User || mongoose.model('User', UserSchema);
  console.log('\n3. User Model: ✅ Defined');

  try {
    // Check for admin user
    const adminUser = await User.findOne({ email: 'admin@example.com' });
    let passwordValid = false;
    
    console.log(`\n4. Admin User: ${adminUser ? '✅ Found' : '❌ MISSING'}`);
    
    if (adminUser) {
      console.log(`   - ID: ${adminUser._id}`);
      console.log(`   - Name: ${adminUser.name}`);
      console.log(`   - Role: ${adminUser.role}`);
      console.log(`   - Created: ${adminUser.createdAt}`);
      
      // Verify password
      const testPassword = 'admin12345';
      passwordValid = await compare(testPassword, adminUser.password);
      
      console.log(`\n5. Password Check: ${passwordValid ? '✅ Valid' : '❌ INVALID'}`);
      console.log(`   - Test credentials: admin@example.com / ${testPassword}`);
      
      if (!passwordValid) {
        console.log('   - Password mismatch. The stored hash doesn\'t match the test password.');
        console.log('   - Run scripts/setup/init-admin.js to reset the admin password.');
      }
    } else {
      console.log('\n❌ Admin user is missing! Authentication will fail.');
      console.log('   Run scripts/setup/init-admin.js to create the admin user.');
    }

    // Check middleware configuration
    console.log('\n6. Middleware: Review src/middleware.ts to ensure it\'s configured correctly');
    console.log('   - Check that admin routes are protected but login page is accessible');
    console.log('   - Verify that the NEXTAUTH_SECRET is being used correctly');

    console.log('\n=== DEBUGGING RECOMMENDATIONS ===');
    if (!adminUser) {
      console.log('• Run scripts/setup/init-admin.js to create the admin user');
    } else if (!passwordValid) {
      console.log('• Run scripts/setup/init-admin.js to reset the admin password');
    } else {
      console.log('• Auth configuration appears correct. Check these areas:');
      console.log('  1. Make sure .env.local has NEXTAUTH_SECRET set and environment variables are loading');
      console.log('  2. Check the browser console for errors during login');
      console.log('  3. Verify middleware is allowing access to login page but protecting admin routes');
      console.log('  4. Make sure the login form is sending credentials in the correct format');
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
debugAuth(); 