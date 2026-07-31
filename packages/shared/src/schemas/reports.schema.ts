import { z } from 'zod';

export const ReportFrequencyEnum = z.enum(['DAILY', 'WEEKLY', 'MONTHLY']);
export const ReportFormatEnum = z.enum(['PDF', 'EXCEL', 'CSV']);
export const ReportStatusEnum = z.enum(['ACTIVE', 'PAUSED']);

export const ReportTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  module: z.string().min(1).max(50),
  configuration: z.record(z.any()),
});

export const CreateReportTemplateSchema = ReportTemplateSchema;
export const UpdateReportTemplateSchema = ReportTemplateSchema.partial();

export const SavedReportSchema = z.object({
  templateId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Template ID'),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  parameters: z.record(z.any()),
});

export const CreateSavedReportSchema = SavedReportSchema;
export const UpdateSavedReportSchema = SavedReportSchema.partial();

export const ScheduledReportSchema = z.object({
  savedReportId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Saved Report ID'),
  frequency: ReportFrequencyEnum,
  cronExpression: z.string().min(1).max(50),
  recipients: z.array(z.string().email()),
  format: ReportFormatEnum,
  status: ReportStatusEnum.default('ACTIVE'),
});

export const CreateScheduledReportSchema = ScheduledReportSchema;
export const UpdateScheduledReportSchema = ScheduledReportSchema.partial();
