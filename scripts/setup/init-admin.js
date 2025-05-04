// Script to initialize an admin user in the database
const mongoose = require('mongoose');
const { hash } = require('bcrypt');

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

// Initialize the admin user
async function initializeAdminUser() {
  // Check if we're connected to the database
  const isConnected = await connectToDatabase();
  if (!isConnected) {
    process.exit(1);
  }

  // Create User model
  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  try {
    // Admin user data
    const adminUser = {
      name: 'Admin User',
      email: 'admin@example.com',
      password: await hash('admin12345', 12),
      role: 'admin',
      createdAt: new Date(),
    };

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminUser.email });

    if (existingAdmin) {
      console.log('Admin user already exists, updating password...');
      existingAdmin.password = adminUser.password;
      await existingAdmin.save();
      console.log('Admin user password updated');
    } else {
      console.log('Creating admin user...');
      await User.create(adminUser);
      console.log('Admin user created successfully');
    }

    console.log('\n=== ADMIN LOGIN CREDENTIALS ===');
    console.log('Email: admin@example.com');
    console.log('Password: admin12345');
    console.log('================================');

  } catch (error) {
    console.error('Error initializing admin user:', error);
  } finally {
    // Close the database connection
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
}

// Run the initialization
initializeAdminUser(); 