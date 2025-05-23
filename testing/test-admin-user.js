const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '.env.local' });

async function testAdminUser() {
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
    
    // Find admin user
    const adminUser = await User.findOne({ email: 'admin@example.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found. Creating new admin user...');
      
      // Create admin user if not exists
      const hashedPassword = await bcrypt.hash('admin12345', 12);
      const newAdmin = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date()
      });
      
      console.log('✅ Admin user created successfully:', {
        id: newAdmin._id,
        email: newAdmin.email,
        role: newAdmin.role
      });
    } else {
      console.log('✅ Admin user found:', {
        id: adminUser._id,
        email: adminUser.email,
        role: adminUser.role
      });
      
      // Verify password is correct
      const testPassword = 'admin12345';
      const passwordValid = await bcrypt.compare(testPassword, adminUser.password);
      
      if (passwordValid) {
        console.log('✅ Password is valid for admin@example.com');
      } else {
        console.log('❌ Invalid password for admin@example.com');
        
        // Update password
        console.log('Updating admin password...');
        const hashedPassword = await bcrypt.hash(testPassword, 12);
        adminUser.password = hashedPassword;
        await adminUser.save();
        console.log('✅ Admin password updated successfully');
      }
    }
    
    // Check NextAuth configuration
    console.log('\nChecking NextAuth configuration:');
    console.log('- NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'Not set');
    console.log('- NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set');
    
    if (!process.env.NEXTAUTH_URL || !process.env.NEXTAUTH_SECRET) {
      console.log('❌ Required NextAuth environment variables are missing');
    } else {
      console.log('✅ NextAuth environment variables are set correctly');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testAdminUser(); 