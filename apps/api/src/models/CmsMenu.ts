import { Schema, model, Document } from 'mongoose';

export interface ICmsMenuItem {
  label: string;
  url: string;
  displayOrder: number;
  parentId?: string;
}

export interface ICmsMenu {
  schoolId: string;
  location: string;
  items: ICmsMenuItem[];
}

export interface ICmsMenuDocument extends ICmsMenu, Document {
  createdAt: Date;
  updatedAt: Date;
}

const CmsMenuItemSchema = new Schema<ICmsMenuItem>(
  {
    label: { type: String, required: true },
    url: { type: String, required: true },
    displayOrder: { type: Number, default: 0 },
    parentId: { type: String },
  },
  { _id: true }
);

const CmsMenuSchema = new Schema<ICmsMenuDocument>(
  {
    schoolId: {
      type: String,
      required: true,
      index: true,
      default: 'LAPS-GOHAD',
    },
    location: {
      type: String,
      required: true,
    },
    items: {
      type: [CmsMenuItemSchema],
      default: [],
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

CmsMenuSchema.index({ schoolId: 1, location: 1 }, { unique: true });

export const CmsMenu = model<ICmsMenuDocument>('CmsMenu', CmsMenuSchema);
