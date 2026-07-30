/**
 * ReportCardVersion Model — Collection #44
 *
 * Audit snapshot of a previously generated report card version.
 */

import { Schema, model, Document, Types } from 'mongoose';

export interface IReportCardVersion {
  reportCardId: Types.ObjectId;
  versionNumber: number;
  generatedAt: Date;
  generatedBy: Types.ObjectId;
  changeReason?: string;
  snapshotData: any;
  pdfUrl?: string;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReportCardVersionDocument extends IReportCardVersion, Document {}

const ReportCardVersionSchema = new Schema<IReportCardVersionDocument>(
  {
    reportCardId: { type: Schema.Types.ObjectId, ref: 'ReportCard', required: true },
    versionNumber: { type: Number, required: true },
    generatedAt: { type: Date, required: true, default: Date.now },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    changeReason: { type: String },
    snapshotData: { type: Schema.Types.Mixed, required: true },
    pdfUrl: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ReportCardVersionSchema.index({ reportCardId: 1, versionNumber: 1 }, { unique: true });

export const ReportCardVersion = model<IReportCardVersionDocument>(
  'ReportCardVersion',
  ReportCardVersionSchema
);
