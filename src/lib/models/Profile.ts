import mongoose, { Schema, Document } from 'mongoose';

export interface ProfileDocument extends Document {
  name: string;
  imageUrl: string;
  skills: string[];
  location: string;
  email: string;
  socialLinks: {
    github: string;
    twitter: string;
    linkedin: string;
    website: string;
  };
  updatedAt: Date;
}

const ProfileSchema = new Schema<ProfileDocument>({
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
const Profile = (mongoose.models && mongoose.models.Profile) 
  ? mongoose.models.Profile as mongoose.Model<ProfileDocument>
  : mongoose.model<ProfileDocument>('Profile', ProfileSchema);

export default Profile; 