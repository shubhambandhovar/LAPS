import { Schema, model, Document, Types } from 'mongoose';

export interface IMediaAsset {
  schoolId: string;
  originalName: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  category: 'IMAGE' | 'DOCUMENT' | 'VIDEO';
  tags?: string[];
  uploadedBy?: Types.ObjectId;
}

export interface IMediaAssetDocument extends IMediaAsset, Document {
  createdAt: Date;
  updatedAt: Date;
}

const MediaAssetSchema = new Schema<IMediaAssetDocument>(
  {
    schoolId: {
      type: String,
      required: true,
      index: true,
      default: 'LAPS-GOHAD',
    },
    originalName: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    sizeBytes: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      enum: ['IMAGE', 'DOCUMENT', 'VIDEO'],
      required: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
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

export const MediaAsset = model<IMediaAssetDocument>('MediaAsset', MediaAssetSchema);
