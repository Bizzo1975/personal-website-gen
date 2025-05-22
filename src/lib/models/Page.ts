import mongoose, { Schema, model, Model } from 'mongoose';

interface PageDocument extends Document {
  name: string;
  title: string;
  slug: string;
  content: string;
  metaDescription: string;
  headerTitle: string;
  headerSubtitle: string;
  updatedAt: Date;
}

const PageSchema = new Schema<PageDocument>({
  name: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  content: {
    type: String,
    required: true,
  },
  metaDescription: {
    type: String,
    default: '',
  },
  headerTitle: {
    type: String,
    default: '', // Will default to the title if not set
  },
  headerSubtitle: {
    type: String,
    default: '',
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Use mongoose.models to check if the model exists already
// This prevents "Cannot overwrite model once compiled" errors
let Page: Model<PageDocument>;

try {
  // Check if the model is already defined
  Page = mongoose.models.Page as Model<PageDocument>;
} catch {
  // If not, define it
  Page = mongoose.model<PageDocument>('Page', PageSchema);
}

export default Page;
