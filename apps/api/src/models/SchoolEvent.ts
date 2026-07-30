import { Schema, model, Document, Types } from 'mongoose';

export interface ISchoolEventDocument extends Document {
  name: string;
  eventType: 'ACADEMIC' | 'SPORTS' | 'CULTURAL' | 'PTM' | 'MEETING' | 'SEMINAR' | 'COMPETITION' | 'WORKSHOP' | 'EXAM' | 'FEE' | 'CUSTOM';
  startDate: string | Date;
  endDate: string | Date;
  isAllDay: boolean;
  description?: string;
  location?: string;
  visibility: 'SCHOOL_WIDE' | 'TEACHERS_ONLY' | 'CLASS_SPECIFIC';
  targetClassIds?: Types.ObjectId[];
  targetSectionIds?: Types.ObjectId[];
  academicSessionId: Types.ObjectId;
  attachments?: {
    fileName: string;
    fileUrl: string;
    fileSize?: number;
    mimeType?: string;
  }[];
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'ARCHIVED';
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SchoolEventSchema = new Schema<ISchoolEventDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    eventType: {
      type: String,
      enum: ['ACADEMIC', 'SPORTS', 'CULTURAL', 'PTM', 'MEETING', 'SEMINAR', 'COMPETITION', 'WORKSHOP', 'EXAM', 'FEE', 'CUSTOM'],
      required: true,
      index: true,
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
    description: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    visibility: {
      type: String,
      enum: ['SCHOOL_WIDE', 'TEACHERS_ONLY', 'CLASS_SPECIFIC'],
      required: true,
      index: true,
    },
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
    attachments: [
      {
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: true },
        fileSize: { type: Number },
        mimeType: { type: String },
      },
    ],
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'CANCELLED', 'ARCHIVED'],
      default: 'PUBLISHED',
      index: true,
    },
    createdBy: {
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
  }
);

SchoolEventSchema.index({ academicSessionId: 1, startDate: 1 });
SchoolEventSchema.index({ visibility: 1, targetClassIds: 1 });

export const SchoolEvent = model<ISchoolEventDocument>('SchoolEvent', SchoolEventSchema);
