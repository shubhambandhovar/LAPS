import { Schema, model, Document, Types } from 'mongoose';

export interface IStockMovement {
  schoolId: string;
  consumableId: Types.ObjectId;
  movementType: 'PURCHASE' | 'ISSUE' | 'RETURN' | 'ADJUSTMENT';
  quantity: number;
  departmentId?: Types.ObjectId;
  vendorId?: Types.ObjectId;
  movementDate: Date;
  remarks?: string;
  recordedByUserId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStockMovementDocument extends IStockMovement, Document {}

const StockMovementSchema = new Schema<IStockMovementDocument>(
  {
    schoolId: { type: String, required: true, default: 'LAPS-GOHAD', index: true },
    consumableId: { type: Schema.Types.ObjectId, ref: 'Consumable', required: true, index: true },
    movementType: {
      type: String,
      enum: ['PURCHASE', 'ISSUE', 'RETURN', 'ADJUSTMENT'],
      required: true,
      index: true,
    },
    quantity: { type: Number, required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', index: true },
    movementDate: { type: Date, required: true, default: Date.now },
    remarks: { type: String },
    recordedByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

StockMovementSchema.index({ schoolId: 1, movementDate: 1 });

export const StockMovement = model<IStockMovementDocument>('StockMovement', StockMovementSchema);
