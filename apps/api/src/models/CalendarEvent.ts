import { Schema, model, Document, Types } from 'mongoose';

export interface ICalendarEventDocument extends Document {
  title: string;
  description?: string;
  category: 'HOLIDAY' | 'EVENT' | 'EXAM' | 'HOMEWORK' | 'ATTENDANCE' | 'FEE';
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  colorHex?: string;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  referenceModule?: 'Holiday' | 'SchoolEvent' | 'Exam' | 'Homework' | 'Payment';
  referenceId?: Types.ObjectId;
  targetRoles?: string[];
  targetClassIds?: Types.ObjectId[];
  targetSectionIds?: Types.ObjectId[];
  academicSessionId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CalendarEventSchema = new Schema<ICalendarEventDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ['HOLIDAY', 'EVENT', 'EXAM', 'HOMEWORK', 'ATTENDANCE', 'FEE'],
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'NORMAL', 'HIGH'],
      default: 'NORMAL',
    },
    colorHex: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    isAllDay: {
      type: Boolean,
      default: false,
    },
    referenceModule: {
      type: String,
      enum: ['Holiday', 'SchoolEvent', 'Exam', 'Homework', 'Payment'],
      index: true,
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    targetRoles: [
      {
        type: String,
      },
    ],
    targetClassIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Class',
      },
    ],
    targetSectionIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Section',
      },
    ],
    academicSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: true,
      index: true,
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
  }
);

CalendarEventSchema.index({ academicSessionId: 1, startDate: 1, endDate: 1 });
CalendarEventSchema.index({ referenceModule: 1, referenceId: 1 });

export const CalendarEvent = model<ICalendarEventDocument>('CalendarEvent', CalendarEventSchema);
