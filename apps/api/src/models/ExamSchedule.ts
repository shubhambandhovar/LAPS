/**
 * ExamSchedule Model — Collection #35
 *
 * Governs timetable schedule slots for examinations with conflict detection across Room,
 * Invigilator, and Student Class/Section overlap.
 */

import { Schema, model, Document, Types, Model } from 'mongoose';
import { ExamScheduleStatus } from '@laps/shared';

export interface IExamSchedule {
  examId: Types.ObjectId;
  academicSessionId: Types.ObjectId;
  academicTermId: Types.ObjectId;
  classSubjectId: Types.ObjectId;
  classId: Types.ObjectId;
  sectionId?: Types.ObjectId;
  subjectId: Types.ObjectId;
  date: Date;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  roomId?: Types.ObjectId;
  room?: string;
  invigilatorId?: Types.ObjectId;
  maximumMarks: number;
  passingMarks: number;
  status: ExamScheduleStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IExamScheduleDocument extends IExamSchedule, Document {}

export interface IExamScheduleModel extends Model<IExamScheduleDocument> {
  checkConflicts(params: {
    examScheduleId?: string | Types.ObjectId;
    date: Date;
    startTime: string;
    endTime: string;
    classId: string | Types.ObjectId;
    sectionId?: string | Types.ObjectId;
    roomId?: string | Types.ObjectId;
    invigilatorId?: string | Types.ObjectId;
  }): Promise<{ hasConflict: boolean; conflictType?: string; message?: string }>;
}

const ExamScheduleSchema = new Schema<IExamScheduleDocument, IExamScheduleModel>(
  {
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    academicSessionId: { type: Schema.Types.ObjectId, ref: 'AcademicSession', required: true },
    academicTermId: { type: Schema.Types.ObjectId, ref: 'AcademicTerm', required: true },
    classSubjectId: { type: Schema.Types.ObjectId, ref: 'ClassSubject', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section' },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    durationMinutes: { type: Number, required: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room' },
    room: { type: String },
    invigilatorId: { type: Schema.Types.ObjectId, ref: 'Teacher' },
    maximumMarks: { type: Number, required: true, default: 100 },
    passingMarks: { type: Number, required: true, default: 33 },
    status: {
      type: String,
      enum: ['SCHEDULED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED', 'ARCHIVED'],
      default: 'SCHEDULED',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
);

ExamScheduleSchema.index({ examId: 1, classId: 1, sectionId: 1, status: 1 });
ExamScheduleSchema.index({ date: 1, roomId: 1 });
ExamScheduleSchema.index({ date: 1, invigilatorId: 1 });

ExamScheduleSchema.statics.checkConflicts = async function ({
  examScheduleId,
  date,
  startTime,
  endTime,
  classId,
  sectionId,
  roomId,
  invigilatorId,
}) {
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const baseQuery: Record<string, any> = {
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $nin: ['CANCELLED', 'ARCHIVED'] },
    // Time overlap check: startTime < newEndTime && endTime > newStartTime
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };

  if (examScheduleId) {
    baseQuery._id = { $ne: examScheduleId };
  }

  // 1. Room conflict check
  if (roomId) {
    const roomConflict = await this.findOne({
      ...baseQuery,
      roomId,
    });
    if (roomConflict) {
      return {
        hasConflict: true,
        conflictType: 'ROOM_OVERLAP',
        message: `Room is already scheduled for another exam from ${roomConflict.startTime} to ${roomConflict.endTime}.`,
      };
    }
  }

  // 2. Invigilator conflict check
  if (invigilatorId) {
    const invigilatorConflict = await this.findOne({
      ...baseQuery,
      invigilatorId,
    });
    if (invigilatorConflict) {
      return {
        hasConflict: true,
        conflictType: 'INVIGILATOR_OVERLAP',
        message: `Invigilator is already assigned to another exam from ${invigilatorConflict.startTime} to ${invigilatorConflict.endTime}.`,
      };
    }
  }

  // 3. Student schedule conflict check
  const studentQuery: Record<string, any> = {
    ...baseQuery,
    classId,
  };
  if (sectionId) {
    studentQuery.$or = [{ sectionId }, { sectionId: { $exists: false } }, { sectionId: null }];
  }
  const studentConflict = await this.findOne(studentQuery);
  if (studentConflict) {
    return {
      hasConflict: true,
      conflictType: 'STUDENT_SCHEDULE_OVERLAP',
      message: `An overlapping exam is already scheduled for this class/section from ${studentConflict.startTime} to ${studentConflict.endTime}.`,
    };
  }

  return { hasConflict: false };
};

export const ExamSchedule = model<IExamScheduleDocument, IExamScheduleModel>(
  'ExamSchedule',
  ExamScheduleSchema
);
