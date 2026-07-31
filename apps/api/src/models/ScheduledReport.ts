import mongoose, { Document, Schema } from 'mongoose';

export interface IScheduledReportDocument extends Document {
  schoolId: string;
  savedReportId: mongoose.Types.ObjectId;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  cronExpression: string;
  recipients: string[];
  format: 'PDF' | 'EXCEL' | 'CSV';
  status: 'ACTIVE' | 'PAUSED';
  nextRunAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduledReportSchema = new Schema<IScheduledReportDocument>(
  {
    schoolId: { type: String, required: true, index: true },
    savedReportId: { type: Schema.Types.ObjectId, ref: 'SavedReport', required: true },
    frequency: { type: String, enum: ['DAILY', 'WEEKLY', 'MONTHLY'], required: true },
    cronExpression: { type: String, required: true },
    recipients: [{ type: String }],
    format: { type: String, enum: ['PDF', 'EXCEL', 'CSV'], required: true },
    status: { type: String, enum: ['ACTIVE', 'PAUSED'], default: 'ACTIVE' },
    nextRunAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const ScheduledReport = mongoose.model<IScheduledReportDocument>('ScheduledReport', ScheduledReportSchema);
