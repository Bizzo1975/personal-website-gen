import mongoose, { Schema, Document } from 'mongoose';
import { ContentPermissions } from '@/types/content/permissions';

export interface PostDocument extends Document {
  title: string;
  slug: string;
  date: Date;
  readTime: number;
  excerpt: string;
  content: string;
  tags: string[];
  category: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  published: boolean;
  featuredImage?: string;
  seoDescription?: string;
  permissions: ContentPermissions;
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

const PostSchema = new Schema<PostDocument>({
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  date: {
    type: Date,
    required: true,
  },
  readTime: {
    type: Number,
    default: 5,
  },
  excerpt: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  tags: {
    type: [String],
    default: [],
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  featuredImage: {
    type: String,
  },
  seoDescription: {
    type: String,
    maxlength: [160, 'SEO description cannot be more than 160 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  published: {
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
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Add indexes for better query performance
PostSchema.index({ slug: 1 });
PostSchema.index({ category: 1 });
PostSchema.index({ tags: 1 });
PostSchema.index({ published: 1, date: -1 });
PostSchema.index({ 'permissions.level': 1 });
PostSchema.index({ 'permissions.allowedRoles': 1 });

// Hooks to update category post count
PostSchema.pre('save', async function(next) {
  // When adding a category or publishing a post with a category
  if (this.isModified('category') || 
     (this.isModified('published') && this.published && this.category)) {
    try {
      // Check if Category model exists
      if (mongoose.models && mongoose.models.Category) {
        const Category = mongoose.models.Category;
        // Update the post count for the category
        await Category.findByIdAndUpdate(
          this.category,
          { $inc: { postCount: 1 } }
        );
      }
    } catch (error) {
      console.error('Error updating category post count:', error);
    }
  }
  next();
});

// Fix for "mongoose.models is undefined" error
const Post = (mongoose.models && mongoose.models.Post) 
  ? mongoose.models.Post as mongoose.Model<PostDocument>
  : mongoose.model<PostDocument>('Post', PostSchema);

export default Post;