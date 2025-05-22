import mongoose, { Schema } from 'mongoose';

// Define the User schema
const UserSchema = new Schema({
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

// Fix for "mongoose.models is undefined" error
// Check if mongoose.models exists before trying to access it
const User = (mongoose.models && mongoose.models.User) 
  ? mongoose.models.User 
  : mongoose.model('User', UserSchema);

export default User; 