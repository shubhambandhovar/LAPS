import { Schema, model, Document, Types } from 'mongoose';
import { TimetableStatus, DayOfWeek } from '@laps/shared';

export interface ITimetable {
  academicSessionId: Types.ObjectId;
  classId: Types.ObjectId;
  sectionId: Types.ObjectId;
  dayOfWeek: DayOfWeek;
  timetablePeriodId: Types.ObjectId;
  classSubjectId: Types.ObjectId;
  subjectId: Types.ObjectId;
  teachingAssignmentId: Types.ObjectId;
  teacherId: Types.ObjectId;
  roomId?: Types.ObjectId;
  status: TimetableStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  archivedBy?: Types.ObjectId;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITimetableDocument extends ITimetable, Document {}

const TimetableSchema = new Schema<ITimetableDocument>(
  {
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
    dayOfWeek: {
      type: String,
      enum: [
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
        'SUNDAY',
      ],
      required: true,
      index: true,
    },
    timetablePeriodId: {
      type: Schema.Types.ObjectId,
      ref: 'TimetablePeriod',
      required: true,
      index: true,
    },
    classSubjectId: {
      type: Schema.Types.ObjectId,
      ref: 'ClassSubject',
      required: true,
      index: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    teachingAssignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'TeachingAssignment',
      required: true,
      index: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
      index: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      index: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
      default: 'DRAFT',
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

TimetableSchema.index({ academicSessionId: 1, sectionId: 1, dayOfWeek: 1, timetablePeriodId: 1, status: 1 });
TimetableSchema.index({ academicSessionId: 1, teacherId: 1, dayOfWeek: 1, timetablePeriodId: 1, status: 1 });
TimetableSchema.index({ academicSessionId: 1, roomId: 1, dayOfWeek: 1, timetablePeriodId: 1, status: 1 }, { sparse: true });
TimetableSchema.index({ teacherId: 1, academicSessionId: 1, status: 1 });

export const Timetable = model<ITimetableDocument>('Timetable', TimetableSchema);
