import mongoose, { Schema } from 'mongoose';

const ProfileSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  skills: {
    type: [String],
    default: [],
  },
  bio: {
    type: String,
    default: '',
  },
  location: {
    type: String,
    default: '',
  },
  email: {
    type: String,
    default: '',
  },
  socialLinks: {
    github: { type: String, default: '' },
    twitter: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    website: { type: String, default: '' },
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Fix for "mongoose.models is undefined" error
// Check if mongoose.models exists before trying to access it
export default (mongoose.models && mongoose.models.Profile) 
  ? mongoose.models.Profile 
  : mongoose.model('Profile', ProfileSchema); 