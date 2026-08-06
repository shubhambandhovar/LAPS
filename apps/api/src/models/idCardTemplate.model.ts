import mongoose, { Schema, Document } from 'mongoose';
import { IdCardUserType, IdCardLayoutType, CardElementType, IdCardTemplate as IdCardTemplateType } from '@laps/shared';

export interface IdCardTemplateDocument extends Document, Omit<IdCardTemplateType, 'id' | 'createdAt' | 'updatedAt'> {}

const CardElementSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, enum: Object.values(CardElementType), required: true },
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
  textAlign: { type: String, enum: ['left', 'center', 'right'] },
  zIndex: { type: Number },
}, { _id: false });

const idCardTemplateSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School' },
    name: { type: String, required: true },
    targetUserType: { type: String, enum: Object.values(IdCardUserType), required: true },
    layoutType: { type: String, enum: Object.values(IdCardLayoutType), required: true },
    isDefault: { type: Boolean, default: false },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    backgroundColor: { type: String },
    backgroundImageUrl: { type: String },
    frontElements: [CardElementSchema],
    backElements: [CardElementSchema],
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

// Only one default template per userType per school
idCardTemplateSchema.index(
  { schoolId: 1, targetUserType: 1 },
  { unique: true, partialFilterExpression: { isDefault: true } }
);

export const IdCardTemplate = mongoose.model<IdCardTemplateDocument>('IdCardTemplate', idCardTemplateSchema);
