import { Schema, model, Document, Types, Model } from 'mongoose';
import { EnrollmentStatus } from '@laps/shared';

export interface IEnrollment {
  studentId: Types.ObjectId;
  academicSessionId: Types.ObjectId;
  classId: Types.ObjectId;
  sectionId: Types.ObjectId;
  rollNumber: number;
  enrollmentDate: Date;
  enrollmentStatus: EnrollmentStatus;
  promotedToEnrollmentId?: Types.ObjectId;
  previousEnrollmentId?: Types.ObjectId;
  remarks?: string;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  archivedBy?: Types.ObjectId;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEnrollmentDocument extends IEnrollment, Document {}

export interface IEnrollmentModel extends Model<IEnrollmentDocument> {
  generateRollNumber(
    academicSessionId: string | Types.ObjectId,
    classId: string | Types.ObjectId,
    sectionId: string | Types.ObjectId,
  ): Promise<number>;
}

const EnrollmentSchema = new Schema<IEnrollmentDocument, IEnrollmentModel>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    academicSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: true,
      index: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
      index: true,
    },
    sectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Section',
      required: true,
      index: true,
    },
    rollNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    enrollmentStatus: {
      type: String,
      enum: [
        'ACTIVE',
        'PROMOTED',
        'TRANSFERRED',
        'WITHDRAWN',
        'COMPLETED',
        'ALUMNI',
        'ARCHIVED',
      ],
      default: 'ACTIVE',
      index: true,
    },
    promotedToEnrollmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
    },
    previousEnrollmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
    },
    remarks: {
      type: String,
      trim: true,
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

EnrollmentSchema.index({ academicSessionId: 1, studentId: 1 }, { unique: true });
EnrollmentSchema.index({ academicSessionId: 1, classId: 1, sectionId: 1, rollNumber: 1 }, { unique: true });
EnrollmentSchema.index({ studentId: 1, enrollmentStatus: 1 });

EnrollmentSchema.statics.generateRollNumber = async function (
  academicSessionId: string | Types.ObjectId,
  classId: string | Types.ObjectId,
  sectionId: string | Types.ObjectId,
): Promise<number> {
  const lastEnrollment = await this.findOne({
    academicSessionId,
    classId,
    sectionId,
  })
    .sort({ rollNumber: -1 })
    .exec();

  if (lastEnrollment && typeof lastEnrollment.rollNumber === 'number') {
    return lastEnrollment.rollNumber + 1;
  }

  return 1;
};

export const Enrollment = model<IEnrollmentDocument, IEnrollmentModel>('Enrollment', EnrollmentSchema);
