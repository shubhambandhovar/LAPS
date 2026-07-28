import { Schema, model, Document, Types } from 'mongoose';
import { ClassLevel, EntityStatus } from '@laps/shared';

export interface IClass {
  name: string;
  code: string;
  level: ClassLevel;
  orderSequence: number;
  status: EntityStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  archivedBy?: Types.ObjectId;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IClassDocument extends IClass, Document {}

const ClassSchema = new Schema<IClassDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    level: {
      type: String,
      enum: ['PRE_PRIMARY', 'PRIMARY', 'MIDDLE', 'SECONDARY'],
      required: true,
      index: true,
    },
    orderSequence: {
      type: Number,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
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
    },
    archivedAt: {
      type: Date,
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
  },
);

export function generateClassCode(name: string): string {
  const clean = name.trim().toUpperCase();
  if (clean === 'NURSERY') return 'CLS-NUR';
  if (clean === 'LKG') return 'CLS-LKG';
  if (clean === 'UKG') return 'CLS-UKG';
  const match = clean.match(/^CLASS\s+(\d+)$/i);
  if (match && match[1]) {
    const num = match[1].padStart(2, '0');
    return `CLS-${num}`;
  }
  return `CLS-${clean.replace(/[^A-Z0-9]/g, '').slice(0, 5)}`;
}

ClassSchema.pre('validate', function (next) {
  if (!this.code && this.name) {
    this.code = generateClassCode(this.name);
  }
  next();
});

export const Class = model<IClassDocument>('Class', ClassSchema);
