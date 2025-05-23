require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

async function resetAdminUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully!');
    
    // Define User model 
    const UserSchema = new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
      createdAt: Date
    });
    
    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    
    // Delete existing admin user if exists
    const deleted = await User.deleteOne({ email: 'admin@example.com' });
    console.log(`Deleted ${deleted.deletedCount} existing admin users`);
    
    // Create new admin user with default password
    const hashedPassword = await bcrypt.hash('admin12345', 12);
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date()
    });
    
    console.log('✅ New admin user created successfully:');
    console.log({
      id: adminUser._id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role
    });
    console.log('\n✅ Login with these credentials:');
    console.log('Email: admin@example.com');
    console.log('Password: admin12345');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

resetAdminUser(); 