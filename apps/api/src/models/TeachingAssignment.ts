import { Schema, model, Document, Types } from 'mongoose';
import { EntityStatus } from '@laps/shared';

export interface ITeachingAssignment {
  teacherId: Types.ObjectId;
  academicSessionId: Types.ObjectId;
  classId: Types.ObjectId;
  sectionId: Types.ObjectId;
  subjectId: Types.ObjectId;
  isClassTeacher: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date;
  status: EntityStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  archivedBy?: Types.ObjectId;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITeachingAssignmentDocument extends ITeachingAssignment, Document {}

const TeachingAssignmentSchema = new Schema<ITeachingAssignmentDocument>(
  {
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
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
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    isClassTeacher: {
      type: Boolean,
      default: false,
    },
    effectiveFrom: {
      type: Date,
      required: true,
    },
    effectiveTo: {
      type: Date,
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

TeachingAssignmentSchema.index(
  {
    academicSessionId: 1,
    teacherId: 1,
    classId: 1,
    sectionId: 1,
    subjectId: 1,
  },
  { unique: true },
);
TeachingAssignmentSchema.index({ academicSessionId: 1, sectionId: 1, subjectId: 1, status: 1 });
TeachingAssignmentSchema.index({ teacherId: 1, academicSessionId: 1, status: 1 });

TeachingAssignmentSchema.pre('validate', async function (next) {
  if (this.status === 'ACTIVE') {
    const from = this.effectiveFrom;
    const to = this.effectiveTo || new Date('2099-12-31T23:59:59.999Z');

    const overlapping = await model<ITeachingAssignmentDocument>('TeachingAssignment').findOne({
      _id: { $ne: this._id },
      academicSessionId: this.academicSessionId,
      sectionId: this.sectionId,
      subjectId: this.subjectId,
      status: 'ACTIVE',
      effectiveFrom: { $lte: to },
      $or: [
        { effectiveTo: { $exists: false } },
        { effectiveTo: null },
        { effectiveTo: { $gte: from } },
      ],
    });

    if (overlapping) {
      return next(
        new Error(
          'Section already has an active teacher assigned to this subject with overlapping effective dates',
        ),
      );
    }
  }
  next();
});

export const TeachingAssignment = model<ITeachingAssignmentDocument>(
  'TeachingAssignment',
  TeachingAssignmentSchema,
);
