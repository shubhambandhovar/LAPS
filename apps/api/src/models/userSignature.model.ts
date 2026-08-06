import mongoose, { Schema, Document } from 'mongoose';
import { SignatureType, UserSignature as UserSignatureType } from '@laps/shared';

export interface UserSignatureDocument extends Document, Omit<UserSignatureType, 'id' | 'createdAt' | 'updatedAt'> {}

const userSignatureSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    designation: { type: String, required: true },
    type: { type: String, enum: Object.values(SignatureType), default: SignatureType.SIGNATURE },
    imageUrl: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    validFrom: { type: Date },
    validUntil: { type: Date },
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

export const UserSignatureDb = mongoose.model<UserSignatureDocument>('UserSignature', userSignatureSchema);
