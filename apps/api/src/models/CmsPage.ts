import { Schema, model, Document, Types } from 'mongoose';

export interface ICmsPage {
  schoolId: string;
  title: string;
  slug: string;
  content: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  seoMetadata?: {
    metaTitle?: string;
    metaDescription?: string;
    openGraphImageUrl?: string;
    canonicalUrl?: string;
    robots?: string;
  };
  authorId?: Types.ObjectId;
  publishedAt?: Date;
  versionHistory: Array<{
    version: number;
    content: string;
    updatedBy: Types.ObjectId;
    updatedAt: Date;
  }>;
}

export interface ICmsPageDocument extends ICmsPage, Document {
  createdAt: Date;
  updatedAt: Date;
}

const CmsPageSchema = new Schema<ICmsPageDocument>(
  {
    schoolId: {
      type: String,
      required: true,
      index: true,
      default: 'LAPS-GOHAD',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    content: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
      default: 'DRAFT',
      index: true,
    },
    seoMetadata: {
      metaTitle: String,
      metaDescription: String,
      openGraphImageUrl: String,
      canonicalUrl: String,
      robots: String,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    publishedAt: {
      type: Date,
    },
    versionHistory: [
      {
        version: { type: Number, required: true },
        content: { type: String, required: true },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        updatedAt: { type: Date, required: true },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret) {
        ret.id = ret._id;
        delete (ret as any)._id;
        delete (ret as any).__v;
      },
    },
  }
);

CmsPageSchema.index({ schoolId: 1, slug: 1 }, { unique: true });

export const CmsPage = model<ICmsPageDocument>('CmsPage', CmsPageSchema);
