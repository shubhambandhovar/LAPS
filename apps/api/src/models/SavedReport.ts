import mongoose, { Document, Schema } from 'mongoose';

export interface ISavedReportDocument extends Document {
  schoolId: string;
  templateId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  parameters: Record<string, any>;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SavedReportSchema = new Schema<ISavedReportDocument>(
  {
    schoolId: { type: String, required: true, index: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'ReportTemplate', required: true },
    name: { type: String, required: true },
    description: { type: String },
    parameters: { type: Schema.Types.Mixed, default: {} },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const SavedReport = mongoose.model<ISavedReportDocument>('SavedReport', SavedReportSchema);
