import { z } from 'zod';

export const departmentSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const designationSchema = z.object({
  name: z.string().min(2),
  departmentId: z.string(),
  level: z.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
});

export const emergencyContactSchema = z.object({
  name: z.string().min(2),
  relation: z.string().min(2),
  phone: z.string().min(10),
});

export const employeeSchema = z.object({
  userId: z.string().optional(),
  type: z.enum(['TEACHING', 'NON_TEACHING']),
  departmentId: z.string(),
  designationId: z.string(),
  joiningDate: z.string(), // ISO date
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT']),
  status: z.enum(['ACTIVE', 'ON_LEAVE', 'TERMINATED', 'RESIGNED']).default('ACTIVE'),
  emergencyContact: emergencyContactSchema.optional(),
  qualifications: z.array(z.string()).optional(),
  experience: z.string().optional(),
});

export const salaryComponentSchema = z.object({
  name: z.string().min(2),
  amount: z.number().min(0),
  type: z.enum(['FIXED', 'PERCENTAGE']),
});

export const salaryStructureSchema = z.object({
  employeeId: z.string(),
  effectiveFrom: z.string(),
  basicSalary: z.number().min(0),
  allowances: z.array(salaryComponentSchema).default([]),
  deductions: z.array(salaryComponentSchema).default([]),
  employerContributions: z.array(z.object({
    name: z.string(),
    amount: z.number().min(0)
  })).default([]),
  isActive: z.boolean().default(true),
});

export const generatePayrollSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2000),
});

export const updatePayrollStatusSchema = z.object({
  status: z.enum(['APPROVED', 'PAID']),
});
