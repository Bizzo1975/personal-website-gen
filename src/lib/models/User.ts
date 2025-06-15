import mongoose, { Schema, Document } from 'mongoose';
import { PermissionLevel, UserRole } from '@/types/content/permissions';

export interface UserDocument extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  accessLevel: PermissionLevel;
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'editor', 'author', 'subscriber', 'guest'],
    default: 'subscriber',
  },
  accessLevel: {
    type: String,
    enum: ['personal', 'professional', 'all'],
    default: 'all',
  },
  permissions: {
    type: [String],
    default: [],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Add indexes for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ accessLevel: 1 });
UserSchema.index({ isActive: 1 });

// Update the updatedAt field before saving
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Set default permissions based on role
UserSchema.pre('save', function(next) {
  if (this.isModified('role') && this.permissions.length === 0) {
    switch (this.role) {
      case 'admin':
        this.permissions = [
          'manage_users', 'manage_settings', 'manage_roles', 'view_analytics',
          'manage_media', 'edit_posts', 'delete_posts', 'write_posts', 'read_posts',
          'edit_projects', 'delete_projects', 'write_projects', 'read_projects',
          'manage_comments', 'manage_templates', 'system_admin'
        ];
        this.accessLevel = 'personal'; // Admin has highest access
        break;
      case 'editor':
        this.permissions = [
          'edit_posts', 'delete_posts', 'write_posts', 'read_posts',
          'edit_projects', 'write_projects', 'read_projects',
          'manage_media', 'manage_comments'
        ];
        this.accessLevel = 'professional';
        break;
      case 'author':
        this.permissions = [
          'write_posts', 'read_posts', 'edit_posts',
          'write_projects', 'read_projects'
        ];
        this.accessLevel = 'professional';
        break;
      case 'subscriber':
        this.permissions = ['read_posts', 'read_projects'];
        this.accessLevel = 'all';
        break;
      case 'guest':
        this.permissions = ['read_posts', 'read_projects'];
        this.accessLevel = 'all';
        break;
    }
  }
  next();
});

// Fix for "mongoose.models is undefined" error
const User = (mongoose.models && mongoose.models.User) 
  ? mongoose.models.User as mongoose.Model<UserDocument>
  : mongoose.model<UserDocument>('User', UserSchema);

export default User; 