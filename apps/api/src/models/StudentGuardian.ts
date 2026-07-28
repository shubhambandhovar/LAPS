import { Schema, model, Document, Types } from 'mongoose';
import { GuardianRelationship } from '@laps/shared';

export interface IStudentGuardian {
  studentId: Types.ObjectId;
  guardianId: Types.ObjectId;
  relationship: GuardianRelationship;
  isPrimaryGuardian: boolean;
  pickupPermission: boolean;
  emergencyContactPermission: boolean;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStudentGuardianDocument extends IStudentGuardian, Document {}

const StudentGuardianSchema = new Schema<IStudentGuardianDocument>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    guardianId: {
      type: Schema.Types.ObjectId,
      ref: 'Guardian',
      required: true,
      index: true,
    },
    relationship: {
      type: String,
      enum: ['FATHER', 'MOTHER', 'LEGAL_GUARDIAN', 'OTHER'],
      required: true,
    },
    isPrimaryGuardian: {
      type: Boolean,
      default: false,
    },
    pickupPermission: {
      type: Boolean,
      default: true,
    },
    emergencyContactPermission: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.__v;
        ret.id = ret._id ? ret._id.toString() : undefined;
        return ret;
      },
    },
    toObject: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.__v;
        ret.id = ret._id ? ret._id.toString() : undefined;
        return ret;
      },
    },
  },
);

StudentGuardianSchema.index({ studentId: 1, guardianId: 1 }, { unique: true });
StudentGuardianSchema.index({ studentId: 1, isPrimaryGuardian: 1 });

export const StudentGuardian = model<IStudentGuardianDocument>('StudentGuardian', StudentGuardianSchema);
