import { Schema, model, Document } from 'mongoose';

export interface IVendor {
  schoolId: string;
  vendorCode: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

export interface IVendorDocument extends IVendor, Document {}

const VendorSchema = new Schema<IVendorDocument>(
  {
    schoolId: { type: String, required: true, default: 'LAPS-GOHAD', index: true },
    vendorCode: { type: String, required: true, index: true },
    name: { type: String, required: true },
    contactPerson: { type: String },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    address: { type: String },
    gstNumber: { type: String },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true,
    },
  },
  { timestamps: true }
);

VendorSchema.index({ schoolId: 1, vendorCode: 1 }, { unique: true });

export const Vendor = model<IVendorDocument>('Vendor', VendorSchema);
