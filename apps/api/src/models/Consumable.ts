import { Schema, model, Document } from 'mongoose';

export interface IConsumable {
  schoolId: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  maximumStock?: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

export interface IConsumableDocument extends IConsumable, Document {}

const ConsumableSchema = new Schema<IConsumableDocument>(
  {
    schoolId: { type: String, required: true, default: 'LAPS-GOHAD', index: true },
    name: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true },
    unit: { type: String, required: true },
    currentStock: { type: Number, required: true, default: 0, min: 0 },
    minimumStock: { type: Number, required: true, default: 0, min: 0 },
    maximumStock: { type: Number, min: 0 },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true,
    },
  },
  { timestamps: true }
);

ConsumableSchema.index({ schoolId: 1, name: 1, category: 1 }, { unique: true });

export const Consumable = model<IConsumableDocument>('Consumable', ConsumableSchema);
