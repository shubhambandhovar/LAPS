import mongoose, { Document, Schema } from 'mongoose';

export interface IReportTemplateDocument extends Document {
  schoolId: string;
  name: string;
  category: string;
  module: string;
  configuration: Record<string, any>;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReportTemplateSchema = new Schema<IReportTemplateDocument>(
  {
    schoolId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    module: { type: String, required: true },
    configuration: { type: Schema.Types.Mixed, default: {} },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const ReportTemplate = mongoose.model<IReportTemplateDocument>('ReportTemplate', ReportTemplateSchema);
