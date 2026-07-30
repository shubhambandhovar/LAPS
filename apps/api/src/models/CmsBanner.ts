import { Schema, model, Document } from 'mongoose';

export interface ICmsBanner {
  schoolId: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  position: string;
  displayOrder: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ICmsBannerDocument extends ICmsBanner, Document {
  createdAt: Date;
  updatedAt: Date;
}

const CmsBannerSchema = new Schema<ICmsBannerDocument>(
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
    imageUrl: {
      type: String,
      required: true,
    },
    linkUrl: {
      type: String,
    },
    position: {
      type: String,
      required: true,
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true,
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

export const CmsBanner = model<ICmsBannerDocument>('CmsBanner', CmsBannerSchema);
