/**
 * StudyMaterial Model — Collection #32
 *
 * Governs teacher study material uploads. Maintains immutable version history snapshots
 * in versionHistory array on any URL or type update. Supports optional publishAt/expireAt windows.
 */

import { Schema, model, Document, Types } from 'mongoose';
import { StudyMaterialType, EntityStatus } from '@laps/shared';

export interface IStudyMaterialVersion {
  version: number;
  fileUrl: string;
  materialType: StudyMaterialType;
  changedAt: Date;
  changedBy: Types.ObjectId;
  changelog?: string;
}

export interface IStudyMaterial {
  academicSessionId: Types.ObjectId;
  teachingAssignmentId: Types.ObjectId;
  classSubjectId: Types.ObjectId;
  classId: Types.ObjectId;
  sectionId: Types.ObjectId;
  subjectId: Types.ObjectId;
  uploaderTeacherId: Types.ObjectId;
  title: string;
  description?: string;
  materialType: StudyMaterialType;
  fileUrl: string;
  fileMimeType?: string;
  publishAt?: Date;
  expireAt?: Date;
  versionHistory: IStudyMaterialVersion[];
  currentVersion: number;
  status: EntityStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  archivedBy?: Types.ObjectId;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStudyMaterialDocument extends IStudyMaterial, Document {}

const StudyMaterialVersionSchema = new Schema<IStudyMaterialVersion>(
  {
    version: { type: Number, required: true },
    fileUrl: { type: String, required: true },
    materialType: {
      type: String,
      enum: ['NOTES', 'PDF', 'PRESENTATION', 'VIDEO', 'LINK', 'REFERENCE_MATERIAL'],
      required: true,
    },
    changedAt: { type: Date, required: true, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    changelog: { type: String, required: false },
  },
  { _id: false }
);

const StudyMaterialSchema = new Schema<IStudyMaterialDocument>(
  {
    academicSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: true,
      index: true,
    },
    teachingAssignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'TeachingAssignment',
      required: true,
      index: true,
    },
    classSubjectId: {
      type: Schema.Types.ObjectId,
      ref: 'ClassSubject',
      required: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
      index: true,
    },
    sectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Section',
      required: true,
      index: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    uploaderTeacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: false,
    },
    materialType: {
      type: String,
      enum: ['NOTES', 'PDF', 'PRESENTATION', 'VIDEO', 'LINK', 'REFERENCE_MATERIAL'],
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileMimeType: {
      type: String,
      required: false,
    },
    publishAt: {
      type: Date,
      required: false,
    },
    expireAt: {
      type: Date,
      required: false,
    },
    versionHistory: {
      type: [StudyMaterialVersionSchema],
      default: [],
    },
    currentVersion: {
      type: Number,
      required: true,
      default: 1,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    archivedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    archivedAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

StudyMaterialSchema.index({ classId: 1, sectionId: 1, subjectId: 1, status: 1 });
StudyMaterialSchema.index({ uploaderTeacherId: 1, academicSessionId: 1 });
StudyMaterialSchema.index({ publishAt: 1, expireAt: 1 });

export const StudyMaterial = model<IStudyMaterialDocument>(
  'StudyMaterial',
  StudyMaterialSchema
);
export default StudyMaterial;
