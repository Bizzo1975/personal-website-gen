import mongoose, { Schema, Document } from 'mongoose';
import { ContentPermissions } from '@/types/content/permissions';

export interface ProjectDocument extends Document {
  title: string;
  slug: string;
  description: string;
  image: string;
  technologies: string[];
  liveDemo: string;
  sourceCode: string;
  featured: boolean;
  permissions: ContentPermissions;
  createdAt: Date;
  updatedAt: Date;
}

// Permission Rule Schema
const PermissionRuleSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  condition: {
    type: { type: String, enum: ['role', 'user', 'date', 'custom'], required: true },
    operator: { 
      type: String, 
      enum: ['equals', 'not_equals', 'in', 'not_in', 'before', 'after', 'between'], 
      required: true 
    },
    value: { type: Schema.Types.Mixed, required: true },
    field: { type: String }
  },
  action: { type: String, enum: ['allow', 'deny'], required: true },
  priority: { type: Number, default: 0 }
});

// Content Permissions Schema
const ContentPermissionsSchema = new Schema({
  level: { 
    type: String, 
    enum: ['personal', 'professional', 'all'], 
    default: 'all' 
  },
  allowedRoles: [{ 
    type: String, 
    enum: ['admin', 'editor', 'author', 'subscriber', 'guest'] 
  }],
  allowedUsers: [{ type: String }],
  restrictedUsers: [{ type: String }],
  requiresAuth: { type: Boolean, default: false },
  customRules: [PermissionRuleSchema]
});

const ProjectSchema = new Schema<ProjectDocument>({
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: '',
  },
  technologies: {
    type: [String],
    default: [],
  },
  liveDemo: {
    type: String,
    default: '',
  },
  sourceCode: {
    type: String,
    default: '',
  },
  featured: {
    type: Boolean,
    default: false,
  },
  permissions: {
    type: ContentPermissionsSchema,
    default: () => ({
      level: 'all',
      allowedRoles: ['admin', 'editor', 'author', 'subscriber', 'guest'],
      allowedUsers: [],
      restrictedUsers: [],
      requiresAuth: false,
      customRules: []
    })
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
ProjectSchema.index({ slug: 1 });
ProjectSchema.index({ featured: 1 });
ProjectSchema.index({ technologies: 1 });
ProjectSchema.index({ 'permissions.level': 1 });
ProjectSchema.index({ 'permissions.allowedRoles': 1 });

// Fix for "mongoose.models is undefined" error
const Project = (mongoose.models && mongoose.models.Project) 
  ? mongoose.models.Project as mongoose.Model<ProjectDocument>
  : mongoose.model<ProjectDocument>('Project', ProjectSchema);

export default Project; 