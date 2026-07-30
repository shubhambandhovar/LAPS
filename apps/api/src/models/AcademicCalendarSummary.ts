import { Schema, model, Document, Types } from 'mongoose';

export interface IAcademicCalendarSummaryDocument extends Document {
  academicSessionId: Types.ObjectId;
  termId?: Types.ObjectId;
  totalDays: number;
  workingDays: number;
  holidayCount: number;
  teachingDays: number;
  examinationDays: number;
  updatedAt: Date;
}

const AcademicCalendarSummarySchema = new Schema<IAcademicCalendarSummaryDocument>(
  {
    academicSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: true,
      index: true,
    },
    termId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicTerm',
      index: true,
    },
    totalDays: {
      type: Number,
      default: 0,
    },
    workingDays: {
      type: Number,
      default: 0,
    },
    holidayCount: {
      type: Number,
      default: 0,
    },
    teachingDays: {
      type: Number,
      default: 0,
    },
    examinationDays: {
      type: Number,
      default: 0,
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

AcademicCalendarSummarySchema.index({ academicSessionId: 1, termId: 1 }, { unique: true });

export const AcademicCalendarSummary = model<IAcademicCalendarSummaryDocument>(
  'AcademicCalendarSummary',
  AcademicCalendarSummarySchema
);
