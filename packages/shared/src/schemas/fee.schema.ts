import { z } from 'zod';

// ==========================================
// 1. STATUS & ENUM DEFINITIONS
// ==========================================

export const FinancialYearStatusEnum = z.enum([
  'ACTIVE',
  'CLOSED',
  'ARCHIVED',
]);
export type FinancialYearStatus = z.infer<typeof FinancialYearStatusEnum>;

export const FeeHeadCategoryEnum = z.enum([
  'ADMISSION',
  'TUITION',
  'EXAMINATION',
  'LIBRARY',
  'LABORATORY',
  'SPORTS',
  'DEVELOPMENT',
  'TRANSPORT',
  'CUSTOM',
]);
export type FeeHeadCategory = z.infer<typeof FeeHeadCategoryEnum>;

export const FeeFrequencyEnum = z.enum([
  'ONE_TIME',
  'MONTHLY',
  'QUARTERLY',
  'BI_ANNUALLY',
  'ANNUALLY',
]);
export type FeeFrequency = z.infer<typeof FeeFrequencyEnum>;

export const FeeHeadStatusEnum = z.enum([
  'ACTIVE',
  'ARCHIVED',
]);
export type FeeHeadStatus = z.infer<typeof FeeHeadStatusEnum>;

export const FeeStructureStatusEnum = z.enum([
  'DRAFT',
  'ACTIVE',
  'ARCHIVED',
]);
export type FeeStructureStatus = z.infer<typeof FeeStructureStatusEnum>;

export const DiscountTypeEnum = z.enum([
  'FIXED_AMOUNT',
  'PERCENTAGE',
]);
export type DiscountType = z.infer<typeof DiscountTypeEnum>;

export const DiscountCategoryEnum = z.enum([
  'SIBLING',
  'MERIT',
  'NEED_BASED',
  'STAFF_WARD',
  'GENERAL',
  'SCHOLARSHIP',
]);
export type DiscountCategory = z.infer<typeof DiscountCategoryEnum>;

export const DiscountStatusEnum = z.enum([
  'ACTIVE',
  'ARCHIVED',
]);
export type DiscountStatus = z.infer<typeof DiscountStatusEnum>;

export const LateFeeRuleTypeEnum = z.enum([
  'FIXED',
  'PERCENTAGE',
  'PER_DAY',
]);
export type LateFeeRuleType = z.infer<typeof LateFeeRuleTypeEnum>;

export const LateFeeRuleStatusEnum = z.enum([
  'ACTIVE',
  'ARCHIVED',
]);
export type LateFeeRuleStatus = z.infer<typeof LateFeeRuleStatusEnum>;

export const InvoiceStatusEnum = z.enum([
  'DRAFT',
  'GENERATED',
  'ISSUED',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'WAIVED',
  'CANCELLED',
]);
export type InvoiceStatus = z.infer<typeof InvoiceStatusEnum>;

export const PaymentModeEnum = z.enum([
  'CASH',
  'UPI',
  'CARD',
  'BANK_TRANSFER',
  'CHEQUE',
  'ONLINE_GATEWAY',
]);
export type PaymentMode = z.infer<typeof PaymentModeEnum>;

export const PaymentStatusEnum = z.enum([
  'ACTIVE',
  'REVERSED',
  'COMPLETED',
  'PENDING_CLEARANCE',
  'BOUNCED',
  'REFUNDED',
]);
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

export const ReceiptStatusEnum = z.enum([
  'ACTIVE',
  'CANCELLED',
]);
export type ReceiptStatus = z.infer<typeof ReceiptStatusEnum>;

export const LedgerEntryTypeEnum = z.enum([
  'INVOICE',
  'PAYMENT',
  'WAIVER',
  'ADJUSTMENT',
  'REFUND',
]);
export type LedgerEntryType = z.infer<typeof LedgerEntryTypeEnum>;

// ==========================================
// 2. FINANCIAL YEAR SCHEMAS
// ==========================================

export const CreateFinancialYearSchema = z.object({
  code: z.string().min(3).max(20),
  name: z.string().min(3).max(100),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  status: FinancialYearStatusEnum.default('ACTIVE'),
});
export type CreateFinancialYearInput = z.infer<typeof CreateFinancialYearSchema>;

export const UpdateFinancialYearSchema = CreateFinancialYearSchema.partial();
export type UpdateFinancialYearInput = z.infer<typeof UpdateFinancialYearSchema>;

// ==========================================
// 3. FEE HEAD SCHEMAS
// ==========================================

export const CreateFeeHeadSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(30),
  category: FeeHeadCategoryEnum.default('TUITION'),
  frequency: FeeFrequencyEnum.default('QUARTERLY'),
  isRefundable: z.boolean().default(false),
  description: z.string().max(300).optional(),
  status: FeeHeadStatusEnum.default('ACTIVE'),
});
export type CreateFeeHeadInput = z.infer<typeof CreateFeeHeadSchema>;

export const UpdateFeeHeadSchema = CreateFeeHeadSchema.partial();
export type UpdateFeeHeadInput = z.infer<typeof UpdateFeeHeadSchema>;

// ==========================================
// 4. FEE STRUCTURE SCHEMAS
// ==========================================

export const FeeComponentSchema = z.object({
  feeHeadId: z.string().min(1),
  amount: z.number().int().nonnegative(),
  isOptional: z.boolean().default(false),
  isTransport: z.boolean().default(false),
});
export type FeeComponentInput = z.infer<typeof FeeComponentSchema>;

export const FeeInstallmentSchema = z.object({
  installmentNumber: z.number().int().positive(),
  name: z.string().min(2).max(50),
  percentage: z.number().min(0).max(100),
  amount: z.number().int().nonnegative(),
  dueDate: z.string().or(z.date()),
  lateFeeRuleId: z.string().optional(),
});
export type FeeInstallmentInput = z.infer<typeof FeeInstallmentSchema>;

export const CreateFeeStructureSchema = z.object({
  name: z.string().min(3).max(150),
  academicSessionId: z.string().min(1),
  financialYearId: z.string().optional(),
  classId: z.string().min(1),
  feeComponents: z.array(FeeComponentSchema).min(1),
  installments: z.array(FeeInstallmentSchema).min(1),
  applicableDiscountIds: z.array(z.string()).default([]),
  status: FeeStructureStatusEnum.default('DRAFT'),
});
export type CreateFeeStructureInput = z.infer<typeof CreateFeeStructureSchema>;

export const UpdateFeeStructureSchema = CreateFeeStructureSchema.partial();
export type UpdateFeeStructureInput = z.infer<typeof UpdateFeeStructureSchema>;

// ==========================================
// 5. FEE DISCOUNT SCHEMAS
// ==========================================

export const CreateFeeDiscountSchema = z.object({
  name: z.string().min(3).max(100),
  code: z.string().min(2).max(30),
  discountType: DiscountTypeEnum,
  value: z.number().nonnegative(),
  category: DiscountCategoryEnum.default('GENERAL'),
  requiresApproval: z.boolean().default(true),
  applicableFeeHeadIds: z.array(z.string()).default([]),
  status: DiscountStatusEnum.default('ACTIVE'),
});
export type CreateFeeDiscountInput = z.infer<typeof CreateFeeDiscountSchema>;

export const UpdateFeeDiscountSchema = CreateFeeDiscountSchema.partial();
export type UpdateFeeDiscountInput = z.infer<typeof UpdateFeeDiscountSchema>;

// ==========================================
// 6. LATE FEE RULE SCHEMAS
// ==========================================

export const CreateLateFeeRuleSchema = z.object({
  name: z.string().min(3).max(100),
  ruleType: LateFeeRuleTypeEnum,
  amountOrPercentage: z.number().nonnegative(),
  gracePeriodDays: z.number().int().nonnegative().default(0),
  maxLateFeeLimit: z.number().nonnegative().optional(),
  status: LateFeeRuleStatusEnum.default('ACTIVE'),
});
export type CreateLateFeeRuleInput = z.infer<typeof CreateLateFeeRuleSchema>;

export const UpdateLateFeeRuleSchema = CreateLateFeeRuleSchema.partial();
export type UpdateLateFeeRuleInput = z.infer<typeof UpdateLateFeeRuleSchema>;

// ==========================================
// 7. INVOICE SCHEMAS (WITH LINE ITEM SNAPSHOTS)
// ==========================================

export const InvoiceLineItemSnapshotSchema = z.object({
  feeHeadId: z.string().min(1),
  feeHeadName: z.string().min(1),
  feeHeadCode: z.string().min(1),
  baseAmount: z.number().int().nonnegative(),
  discountAmount: z.number().int().nonnegative().default(0),
  discountName: z.string().optional(),
  netAmount: z.number().int().nonnegative(),
});
export type InvoiceLineItemSnapshotInput = z.infer<typeof InvoiceLineItemSnapshotSchema>;

export const GenerateInvoicesSchema = z.object({
  academicSessionId: z.string().min(1),
  financialYearId: z.string().optional(),
  classId: z.string().min(1),
  installmentNumber: z.number().int().positive(),
  title: z.string().min(3).max(100),
  dueDate: z.string().or(z.date()),
  feeStructureId: z.string().optional(),
  status: InvoiceStatusEnum.default('GENERATED'),
});
export type GenerateInvoicesInput = z.infer<typeof GenerateInvoicesSchema>;

export const CreateCustomInvoiceSchema = z.object({
  academicSessionId: z.string().min(1),
  financialYearId: z.string().optional(),
  enrollmentId: z.string().min(1),
  studentId: z.string().min(1),
  classId: z.string().min(1),
  feeStructureId: z.string().optional(),
  installmentNumber: z.number().int().positive().default(1),
  title: z.string().min(3).max(100),
  dueDate: z.string().or(z.date()),
  lineItems: z.array(InvoiceLineItemSnapshotSchema).min(1),
  remarks: z.string().max(500).optional(),
  status: InvoiceStatusEnum.default('DRAFT'),
});
export type CreateCustomInvoiceInput = z.infer<typeof CreateCustomInvoiceSchema>;

export const WaiveInvoiceSchema = z.object({
  auditReason: z.string().min(5, 'Mandatory audit reason required for waiver'),
  approvedBy: z.string().min(1, 'Approver user ID required'),
  waivedAmount: z.number().nonnegative().optional(),
});
export type WaiveInvoiceInput = z.infer<typeof WaiveInvoiceSchema>;

export const CancelInvoiceSchema = z.object({
  auditReason: z.string().min(5, 'Mandatory audit reason required for cancellation'),
  approvedBy: z.string().min(1, 'Approver user ID required'),
});
export type CancelInvoiceInput = z.infer<typeof CancelInvoiceSchema>;

// ==========================================
// 8. PAYMENT SCHEMAS (WITH REVERSALS & REFUNDS)
// ==========================================

export const PaymentAllocationInputSchema = z.object({
  invoiceId: z.string().min(1),
  amountAllocated: z.number().int().positive(),
});
export type PaymentAllocationInput = z.infer<typeof PaymentAllocationInputSchema>;

export const RecordPaymentSchema = z.object({
  academicSessionId: z.string().min(1),
  financialYearId: z.string().optional(),
  enrollmentId: z.string().min(1),
  studentId: z.string().min(1),
  paidByGuardianId: z.string().optional(),
  recordedByUserId: z.string().min(1),
  amountPaid: z.number().int().positive(),
  paymentMode: PaymentModeEnum,
  referenceNumber: z.string().max(100).optional(),
  paymentDate: z.string().or(z.date()),
  allocations: z.array(PaymentAllocationInputSchema).min(1),
  remarks: z.string().max(500).optional(),
});
export type RecordPaymentInput = z.infer<typeof RecordPaymentSchema>;

export const RefundPaymentSchema = z.object({
  auditReason: z.string().min(5, 'Mandatory audit reason required for refund'),
  approvedBy: z.string().min(1, 'Approver user ID required'),
  refundedAmount: z.number().positive().optional(),
});
export type RefundPaymentInput = z.infer<typeof RefundPaymentSchema>;

export const ReversePaymentSchema = z.object({
  auditReason: z.string().min(5, 'Mandatory audit reason required for payment reversal'),
  approvedBy: z.string().min(1, 'Approver user ID required'),
});
export type ReversePaymentInput = z.infer<typeof ReversePaymentSchema>;

// ==========================================
// 9. REPORTING & QUERY SCHEMAS
// ==========================================

export const FeeReportQuerySchema = z.object({
  academicSessionId: z.string().min(1),
  financialYearId: z.string().optional(),
  classId: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  paymentMode: PaymentModeEnum.optional(),
  status: z.string().optional(),
});
export type FeeReportQueryInput = z.infer<typeof FeeReportQuerySchema>;
