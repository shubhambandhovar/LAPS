import { Schema, model, Document, Types, Model } from 'mongoose';
import { StudentStatus } from '@laps/shared';

export interface IEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface IStudentDocument {
  title: string;
  category?: string;
  fileUrl: string;
  uploadedAt: Date;
}

export interface IStudent {
  admissionNumber: string;
  admissionDate: Date;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth: Date;
  bloodGroup?: string;
  category?: 'GENERAL' | 'OBC' | 'SC' | 'ST' | 'OTHER';
  religion?: string;
  nationality: string;
  photoUrl?: string;
  email?: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;
  emergencyContacts: IEmergencyContact[];
  documents: IStudentDocument[];
  status: StudentStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  archivedBy?: Types.ObjectId;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStudentDocumentModel extends IStudent, Document {}

export interface IStudentModel extends Model<IStudentDocumentModel> {
  generateAdmissionNumber(year?: number): Promise<string>;
}

const EmergencyContactSubschema = new Schema<IEmergencyContact>(
  {
    name: { type: String, required: true, trim: true },
    relationship: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const StudentDocumentSubschema = new Schema<IStudentDocument>(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    fileUrl: { type: String, required: true, trim: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const StudentSchema = new Schema<IStudentDocumentModel, IStudentModel>(
  {
    admissionNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    admissionDate: {
      type: Date,
      default: Date.now,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER'],
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    bloodGroup: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ['GENERAL', 'OBC', 'SC', 'ST', 'OTHER'],
    },
    religion: {
      type: String,
      trim: true,
    },
    nationality: {
      type: String,
      default: 'Indian',
      trim: true,
    },
    photoUrl: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    phone: {
      type: String,
      trim: true,
      index: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      default: 'Gohad',
      trim: true,
    },
    state: {
      type: String,
      default: 'Madhya Pradesh',
      trim: true,
    },
    country: {
      type: String,
      default: 'India',
      trim: true,
    },
    pinCode: {
      type: String,
      required: true,
      trim: true,
    },
    emergencyContacts: {
      type: [EmergencyContactSubschema],
      required: true,
      default: [],
    },
    documents: {
      type: [StudentDocumentSubschema],
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

StudentSchema.index({ firstName: 1, lastName: 1 });

StudentSchema.statics.generateAdmissionNumber = async function (year?: number): Promise<string> {
  const targetYear = year || new Date().getFullYear();
  const prefix = `LAPS-${targetYear}-`;

  const lastStudent = await this.findOne({
    admissionNumber: { $regex: `^${prefix}` },
  })
    .sort({ admissionNumber: -1 })
    .exec();

  let nextSequence = 1;
  if (lastStudent && lastStudent.admissionNumber) {
    const parts = lastStudent.admissionNumber.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextSequence = lastNum + 1;
    }
  }

  const paddedSequence = String(nextSequence).padStart(4, '0');
  return `${prefix}${paddedSequence}`;
};

export const Student = model<IStudentDocumentModel, IStudentModel>('Student', StudentSchema);
