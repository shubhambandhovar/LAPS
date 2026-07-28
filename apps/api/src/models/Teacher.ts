import { Schema, model, Document, Types } from 'mongoose';
import { TeacherDesignation, TeacherStatus } from '@laps/shared';

export interface ITeacher {
  userId?: Types.ObjectId;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  qualification: string;
  designation: TeacherDesignation;
  joiningDate: Date;
  isClassTeacher: boolean;
  photoUrl?: string;
  status: TeacherStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  archivedBy?: Types.ObjectId;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITeacherDocument extends ITeacher, Document {}

const TeacherSchema = new Schema<ITeacherDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      sparse: true,
      index: true,
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    qualification: {
      type: String,
      required: true,
      trim: true,
    },
    designation: {
      type: String,
      enum: ['PRT', 'TGT', 'PGT', 'HEAD_MISTRESS', 'ASSISTANT_TEACHER'],
      required: true,
      index: true,
    },
    joiningDate: {
      type: Date,
      required: true,
    },
    isClassTeacher: {
      type: Boolean,
      default: false,
    },
    photoUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ON_LEAVE', 'INACTIVE', 'ARCHIVED'],
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

export async function generateNextTeacherEmployeeId(): Promise<string> {
  const lastTeacher = await model<ITeacherDocument>('Teacher')
    .findOne({ employeeId: /^TCH-\d+$/ })
    .sort({ employeeId: -1 })
    .select('employeeId')
    .exec();

  if (!lastTeacher || !lastTeacher.employeeId) {
    return 'TCH-0001';
  }

  const numPart = parseInt(lastTeacher.employeeId.replace('TCH-', ''), 10);
  if (isNaN(numPart)) {
    return 'TCH-0001';
  }

  return `TCH-${String(numPart + 1).padStart(4, '0')}`;
}

TeacherSchema.pre('validate', async function (next) {
  if (!this.employeeId) {
    try {
      this.employeeId = await generateNextTeacherEmployeeId();
    } catch (err) {
      return next(err as Error);
    }
  }
  next();
});

export const Teacher = model<ITeacherDocument>('Teacher', TeacherSchema);
