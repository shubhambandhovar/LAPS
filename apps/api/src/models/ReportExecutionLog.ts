import mongoose, { Document, Schema } from 'mongoose';

export interface IReportExecutionLogDocument extends Document {
  schoolId: string;
  scheduledReportId: mongoose.Types.ObjectId;
  status: 'SUCCESS' | 'FAILED';
  executionTime: Date;
  durationMs: number;
  errorMessage?: string;
  fileUrl?: string;
}

const ReportExecutionLogSchema = new Schema<IReportExecutionLogDocument>(
  {
    schoolId: { type: String, required: true, index: true },
    scheduledReportId: { type: Schema.Types.ObjectId, ref: 'ScheduledReport', required: true },
    status: { type: String, enum: ['SUCCESS', 'FAILED'], required: true },
    executionTime: { type: Date, required: true },
    durationMs: { type: Number, required: true },
    errorMessage: { type: String },
    fileUrl: { type: String },
  }
);

export const ReportExecutionLog = mongoose.model<IReportExecutionLogDocument>('ReportExecutionLog', ReportExecutionLogSchema);
