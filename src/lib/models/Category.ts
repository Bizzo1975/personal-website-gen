import mongoose, { Schema, Document } from 'mongoose';

export interface CategoryDocument extends Document {
  name: string;
  slug: string;
  description: string;
  color: string;
  postCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<CategoryDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters']
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: [50, 'Slug cannot be more than 50 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters']
    },
    color: {
      type: String,
      default: '#3B82F6', // Default blue color
      validate: {
        validator: (value: string) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value),
        message: 'Color must be a valid hex color code'
      }
    },
    postCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Fix for "mongoose.models is undefined" error
const Category = (mongoose.models && mongoose.models.Category) 
  ? mongoose.models.Category 
  : mongoose.model<CategoryDocument>('Category', CategorySchema);

export default Category;
