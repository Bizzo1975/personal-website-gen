import mongoose, { Schema, Document } from 'mongoose';

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
  updatedAt: Date;
}

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

// Hooks to update category post count
PostSchema.pre('save', async function(next) {
  // When adding a category or publishing a post with a category
  if (this.isModified('category') || 
     (this.isModified('published') && this.published && this.category)) {
    try {
      const Category = mongoose.models.Category;
      if (Category) {
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

export default mongoose.models.Post || mongoose.model<PostDocument>('Post', PostSchema); 