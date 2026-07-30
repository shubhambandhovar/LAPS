/**
 * ReportCardTemplate Model — Collection #43
 *
 * Configures printable report card layout, branding, signatures, and section toggles.
 */

import { Schema, model, Document, Types } from 'mongoose';
import { ReportCardTemplateStatus } from '@laps/shared';

export interface IReportCardTemplateBranding {
  schoolLogoUrl?: string;
  headerText?: string;
  footerText?: string;
  watermarkText?: string;
  customCss?: string;
}

export interface IReportCardTemplateSignatures {
  showPrincipalSignature: boolean;
  principalSignatureUrl?: string;
  principalTitle: string;
  showClassTeacherSignature: boolean;
  classTeacherTitle: string;
}

export interface IReportCardTemplateLayout {
  showGradingScale: boolean;
  showMarksBreakdown: boolean;
  showAttendance: boolean;
  showRemarks: boolean;
  showPromotionSection: boolean;
  showClassRank: boolean;
  showSectionRank: boolean;
}

export interface IReportCardTemplate {
  name: string;
  description?: string;
  academicSessionId: Types.ObjectId;
  classIds?: Types.ObjectId[];
  isDefault: boolean;
  branding: IReportCardTemplateBranding;
  signatures: IReportCardTemplateSignatures;
  layout: IReportCardTemplateLayout;
  status: ReportCardTemplateStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  archivedAt?: Date;
  archivedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReportCardTemplateDocument extends IReportCardTemplate, Document {}

const ReportCardTemplateBrandingSchema = new Schema(
  {
    schoolLogoUrl: { type: String },
    headerText: { type: String },
    footerText: { type: String },
    watermarkText: { type: String },
    customCss: { type: String },
  },
  { _id: false }
);

const ReportCardTemplateSignaturesSchema = new Schema(
  {
    showPrincipalSignature: { type: Boolean, default: true },
    principalSignatureUrl: { type: String },
    principalTitle: { type: String, default: 'Principal' },
    showClassTeacherSignature: { type: Boolean, default: true },
    classTeacherTitle: { type: String, default: 'Class Teacher' },
  },
  { _id: false }
);

const ReportCardTemplateLayoutSchema = new Schema(
  {
    showGradingScale: { type: Boolean, default: true },
    showMarksBreakdown: { type: Boolean, default: true },
    showAttendance: { type: Boolean, default: true },
    showRemarks: { type: Boolean, default: true },
    showPromotionSection: { type: Boolean, default: true },
    showClassRank: { type: Boolean, default: true },
    showSectionRank: { type: Boolean, default: true },
  },
  { _id: false }
);

const ReportCardTemplateSchema = new Schema<IReportCardTemplateDocument>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    academicSessionId: { type: Schema.Types.ObjectId, ref: 'AcademicSession', required: true },
    classIds: [{ type: Schema.Types.ObjectId, ref: 'Class' }],
    isDefault: { type: Boolean, default: false },
    branding: { type: ReportCardTemplateBrandingSchema, default: () => ({}) },
    signatures: {
      type: ReportCardTemplateSignaturesSchema,
      default: () => ({
        showPrincipalSignature: true,
        principalTitle: 'Principal',
        showClassTeacherSignature: true,
        classTeacherTitle: 'Class Teacher',
      }),
    },
    layout: {
      type: ReportCardTemplateLayoutSchema,
      default: () => ({
        showGradingScale: true,
        showMarksBreakdown: true,
        showAttendance: true,
        showRemarks: true,
        showPromotionSection: true,
        showClassRank: true,
        showSectionRank: true,
      }),
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    archivedAt: { type: Date },
    archivedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ReportCardTemplateSchema.index({ name: 1, academicSessionId: 1 }, { unique: true });
ReportCardTemplateSchema.index({ academicSessionId: 1, isDefault: 1 });
ReportCardTemplateSchema.index({ status: 1 });

export const ReportCardTemplate = model<IReportCardTemplateDocument>(
  'ReportCardTemplate',
  ReportCardTemplateSchema
);
