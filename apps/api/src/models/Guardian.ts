import { Schema, model, Document, Types } from 'mongoose';
import { GuardianStatus, GuardianRelationship } from '@laps/shared';
import { IEmergencyContact } from './Student';

export interface IGuardian {
  name: string;
  relationship: GuardianRelationship;
  phone: string;
  email?: string;
  occupation?: string;
  annualIncome?: number;
  photoUrl?: string;
  sameAsStudentAddress: boolean;
  address?: string;
  emergencyContacts: IEmergencyContact[];
  status: GuardianStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  archivedBy?: Types.ObjectId;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGuardianDocument extends IGuardian, Document {}

const EmergencyContactSubschema = new Schema<IEmergencyContact>(
  {
    name: { type: String, required: true, trim: true },
    relationship: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const GuardianSchema = new Schema<IGuardianDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    relationship: {
      type: String,
      enum: ['FATHER', 'MOTHER', 'LEGAL_GUARDIAN', 'OTHER'],
      required: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    occupation: {
      type: String,
      trim: true,
    },
    annualIncome: {
      type: Number,
      min: 0,
    },
    photoUrl: {
      type: String,
      trim: true,
    },
    sameAsStudentAddress: {
      type: Boolean,
      default: false,
    },
    address: {
      type: String,
      trim: true,
    },
    emergencyContacts: {
      type: [EmergencyContactSubschema],
      default: [],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
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
    archivedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    archivedAt: {
      type: Date,
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

export const Guardian = model<IGuardianDocument>('Guardian', GuardianSchema);
