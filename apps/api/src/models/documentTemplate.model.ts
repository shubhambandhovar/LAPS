import mongoose, { Schema, Document } from 'mongoose';
import { DocumentType, DocumentLayoutType, DocumentElementType, DocumentTemplate as DocumentTemplateType } from '@laps/shared';

export interface DocumentTemplateDocument extends Document, Omit<DocumentTemplateType, 'id' | 'createdAt' | 'updatedAt'> {}

const DocumentElementSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, enum: Object.values(DocumentElementType), required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  width: { type: Number },
  height: { type: Number },
  value: { type: String },
  fontSize: { type: Number },
  fontFamily: { type: String },
  fontWeight: { type: String },
  color: { type: String },
  backgroundColor: { type: String },
  borderColor: { type: String },
  borderWidth: { type: Number },
  borderRadius: { type: Number },
  textAlign: { type: String, enum: ['left', 'center', 'right', 'justify'] },
  zIndex: { type: Number },
}, { _id: false });

const documentTemplateSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School' },
    name: { type: String, required: true },
    documentType: { type: String, enum: Object.values(DocumentType), required: true },
    layoutType: { type: String, enum: Object.values(DocumentLayoutType), required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    backgroundColor: { type: String },
    backgroundImageUrl: { type: String },
    watermarkUrl: { type: String },
    elements: [DocumentElementSchema],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        delete ret._id;
        delete ret.__v;
      },
    },
  },
);

export const DocumentTemplate = mongoose.model<DocumentTemplateDocument>('DocumentTemplate', documentTemplateSchema);
