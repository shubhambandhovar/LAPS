import { z } from 'zod';

export const AssetStatusEnum = z.enum([
  'IN_USE',
  'IN_STORAGE',
  'UNDER_REPAIR',
  'DISCARDED',
]);

export const AssetCategoryEnum = z.enum([
  'IT_EQUIPMENT',
  'FURNITURE',
  'LAB_EQUIPMENT',
  'VEHICLE',
  'OTHER',
]);

export const VendorSchema = z.object({
  vendorCode: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  contactPerson: z.string().max(100).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  gstNumber: z.string().max(50).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const CreateVendorSchema = VendorSchema;
export const UpdateVendorSchema = VendorSchema.partial();

export const AssetSchema = z.object({
  assetCode: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  category: AssetCategoryEnum,
  vendorId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Vendor ID').optional(),
  purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  purchasePrice: z.number().min(0).optional(),
  warrantyExpiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  location: z.string().max(200).optional(),
  departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Department ID').optional(),
  status: AssetStatusEnum.default('IN_STORAGE'),
});

export const CreateAssetSchema = AssetSchema;
export const UpdateAssetSchema = AssetSchema.partial();

export const ConsumableSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().max(100),
  unit: z.string().max(50),
  currentStock: z.number().min(0).default(0),
  minimumStock: z.number().min(0).default(0),
  maximumStock: z.number().min(0).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const CreateConsumableSchema = ConsumableSchema;
export const UpdateConsumableSchema = ConsumableSchema.partial();

export const StockMovementSchema = z.object({
  consumableId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Consumable ID'),
  movementType: z.enum(['PURCHASE', 'ISSUE', 'RETURN', 'ADJUSTMENT']),
  quantity: z.number().refine(val => val !== 0, 'Quantity cannot be zero'),
  departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Department ID').optional(),
  vendorId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Vendor ID').optional(),
  movementDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  remarks: z.string().max(500).optional(),
}).refine(data => {
  if (data.movementType === 'PURCHASE' && !data.vendorId) return false;
  if (data.movementType === 'ISSUE' && !data.departmentId) return false;
  return true;
}, {
  message: 'Corresponding ID must be provided based on movement type',
  path: ['departmentId'],
});

export const AssetAssignmentSchema = z.object({
  assetId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Asset ID'),
  assignedToType: z.enum(['EMPLOYEE', 'DEPARTMENT']),
  employeeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Employee ID').optional(),
  departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Department ID').optional(),
  assignedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  conditionOnIssue: z.string().max(500).optional(),
}).refine(data => {
  if (data.assignedToType === 'EMPLOYEE' && !data.employeeId) return false;
  if (data.assignedToType === 'DEPARTMENT' && !data.departmentId) return false;
  return true;
}, {
  message: 'Corresponding ID must be provided based on assigned to type',
  path: ['employeeId'],
});

export const ReturnAssetSchema = z.object({
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  conditionOnReturn: z.string().max(500).optional(),
});
