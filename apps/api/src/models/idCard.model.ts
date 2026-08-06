import mongoose, { Schema, Document } from 'mongoose';
import { IdCardUserType, IdCardStatus, IdCardRecord } from '@laps/shared';

export interface IdCardRecordDocument extends Document, Omit<IdCardRecord, 'id' | 'createdAt' | 'updatedAt'> {}

const idCardRecordSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School' },
    referenceId: { type: String, required: true },
    userType: { type: String, enum: Object.values(IdCardUserType), required: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'IdCardTemplate', required: true },
    status: { type: String, enum: Object.values(IdCardStatus), default: IdCardStatus.ACTIVE },
    issueDate: { type: Date, required: true },
    expiryDate: { type: Date },
    qrCodeToken: { type: String },
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

export const IdCardRecordDb = mongoose.model<IdCardRecordDocument>('IdCardRecord', idCardRecordSchema);
