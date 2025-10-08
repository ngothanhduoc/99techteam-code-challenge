import mongoose, { Document, Schema } from 'mongoose';

export interface INews extends Document {
  title: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NewsSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters long'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
      index: true, // Index for searching
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      minlength: [10, 'Content must be at least 10 characters long'],
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
      index: true, // Index for filtering by author
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['technology', 'business', 'sports', 'entertainment', 'health', 'science', 'other'],
      index: true, // Index for filtering by category
    },
    tags: {
      type: [String],
      default: [],
      index: true, // Index for searching by tags
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true, // Index for filtering by status
    },
    publishedAt: {
      type: Date,
      index: true, // Index for sorting by publish date
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt
  }
);

// Compound index for complex queries
NewsSchema.index({ status: 1, publishedAt: -1 }); // Filter by status and sort by publishedAt
NewsSchema.index({ category: 1, createdAt: -1 }); // Filter by category and sort by createdAt
NewsSchema.index({ title: 'text', content: 'text' }); // Text search index

export default mongoose.model<INews>('News', NewsSchema);

