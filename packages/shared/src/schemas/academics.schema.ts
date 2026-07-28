import { z } from 'zod';

export const CreateAcademicSessionSchema = z
  .object({
    name: z.string().min(4, 'Session name must be at least 4 characters').max(30),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid start date is required'),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid end date is required'),
    status: z.enum(['PLANNED', 'ACTIVE', 'ARCHIVED']).default('PLANNED'),
    isPromotionLocked: z.boolean().default(false),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate).getTime();
      const end = new Date(data.endDate).getTime();
      return end > start;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  );

export type CreateAcademicSessionInput = z.infer<typeof CreateAcademicSessionSchema>;

export const UpdateAcademicSessionSchema = z.object({
  name: z.string().min(4).max(30).optional(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid start date is required').optional(),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid end date is required').optional(),
  status: z.enum(['PLANNED', 'ACTIVE', 'ARCHIVED']).optional(),
  isPromotionLocked: z.boolean().optional(),
});

export type UpdateAcademicSessionInput = z.infer<typeof UpdateAcademicSessionSchema>;

export const CreateClassSchema = z.object({
  name: z.string().min(2, 'Class name is required').max(50),
  code: z.string().min(2).max(20).optional(),
  level: z.enum(['PRE_PRIMARY', 'PRIMARY', 'MIDDLE', 'SECONDARY']),
  orderSequence: z.number().int().min(0, 'Order sequence must be 0 or greater'),
  status: z.enum(['ACTIVE', 'ARCHIVED']).default('ACTIVE'),
});

export type CreateClassInput = z.infer<typeof CreateClassSchema>;

export const UpdateClassSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  code: z.string().min(2).max(20).optional(),
  level: z.enum(['PRE_PRIMARY', 'PRIMARY', 'MIDDLE', 'SECONDARY']).optional(),
  orderSequence: z.number().int().min(0).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

export type UpdateClassInput = z.infer<typeof UpdateClassSchema>;

export const CreateSectionSchema = z.object({
  academicSessionId: z.string().min(1, 'Academic session is required'),
  classId: z.string().min(1, 'Class is required'),
  name: z.string().min(1, 'Section name is required').max(10).toUpperCase(),
  roomNumber: z.string().max(20).optional(),
  maxCapacity: z.number().int().min(1, 'Capacity must be at least 1').max(150).default(40),
  status: z.enum(['ACTIVE', 'ARCHIVED']).default('ACTIVE'),
});

export type CreateSectionInput = z.infer<typeof CreateSectionSchema>;

export const UpdateSectionSchema = z.object({
  name: z.string().min(1).max(10).toUpperCase().optional(),
  roomNumber: z.string().max(20).optional(),
  maxCapacity: z.number().int().min(1).max(150).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

export type UpdateSectionInput = z.infer<typeof UpdateSectionSchema>;

export const CreateSubjectSchema = z.object({
  name: z.string().min(2, 'Subject name is required').max(100),
  code: z.string().min(2).max(20).optional(),
  shortName: z.string().min(1, 'Short name is required').max(10).toUpperCase(),
  subjectType: z.enum(['THEORY', 'PRACTICAL', 'CO_CURRICULAR']).default('THEORY'),
  isOptional: z.boolean().default(false),
  status: z.enum(['ACTIVE', 'ARCHIVED']).default('ACTIVE'),
});

export type CreateSubjectInput = z.infer<typeof CreateSubjectSchema>;

export const UpdateSubjectSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  code: z.string().min(2).max(20).optional(),
  shortName: z.string().min(1).max(10).toUpperCase().optional(),
  subjectType: z.enum(['THEORY', 'PRACTICAL', 'CO_CURRICULAR']).optional(),
  isOptional: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

export type UpdateSubjectInput = z.infer<typeof UpdateSubjectSchema>;

export const CreateTeacherSchema = z.object({
  userId: z.string().optional(),
  employeeId: z.string().min(2).max(30).optional(),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid 10-digit phone is required').max(20),
  qualification: z.string().min(2, 'Qualification is required').max(200),
  designation: z.enum(['PRT', 'TGT', 'PGT', 'HEAD_MISTRESS', 'ASSISTANT_TEACHER']),
  joiningDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid joining date is required'),
  isClassTeacher: z.boolean().default(false),
  photoUrl: z.string().url('Must be a valid URL').optional(),
  status: z.enum(['ACTIVE', 'ON_LEAVE', 'INACTIVE', 'ARCHIVED']).default('ACTIVE'),
});

export type CreateTeacherInput = z.infer<typeof CreateTeacherSchema>;

export const UpdateTeacherSchema = z.object({
  userId: z.string().optional(),
  employeeId: z.string().min(2).max(30).optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(20).optional(),
  qualification: z.string().min(2).max(200).optional(),
  designation: z.enum(['PRT', 'TGT', 'PGT', 'HEAD_MISTRESS', 'ASSISTANT_TEACHER']).optional(),
  joiningDate: z.string().refine((val) => !isNaN(Date.parse(val))).optional(),
  isClassTeacher: z.boolean().optional(),
  photoUrl: z.string().url().optional(),
  status: z.enum(['ACTIVE', 'ON_LEAVE', 'INACTIVE', 'ARCHIVED']).optional(),
});

export type UpdateTeacherInput = z.infer<typeof UpdateTeacherSchema>;

export const CreateTeachingAssignmentSchema = z
  .object({
    teacherId: z.string().min(1, 'Teacher is required'),
    academicSessionId: z.string().min(1, 'Academic session is required'),
    classId: z.string().min(1, 'Class is required'),
    sectionId: z.string().min(1, 'Section is required'),
    subjectId: z.string().min(1, 'Subject is required'),
    isClassTeacher: z.boolean().default(false),
    effectiveFrom: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid effective from date is required'),
    effectiveTo: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid effective to date is required').optional(),
    status: z.enum(['ACTIVE', 'ARCHIVED']).default('ACTIVE'),
  })
  .refine(
    (data) => {
      if (!data.effectiveTo) return true;
      const start = new Date(data.effectiveFrom).getTime();
      const end = new Date(data.effectiveTo).getTime();
      return end > start;
    },
    {
      message: 'Effective to date must be after effective from date',
      path: ['effectiveTo'],
    }
  );

export type CreateTeachingAssignmentInput = z.infer<typeof CreateTeachingAssignmentSchema>;

export const UpdateTeachingAssignmentSchema = z.object({
  isClassTeacher: z.boolean().optional(),
  effectiveFrom: z.string().refine((val) => !isNaN(Date.parse(val))).optional(),
  effectiveTo: z.string().refine((val) => !isNaN(Date.parse(val))).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

export type UpdateTeachingAssignmentInput = z.infer<typeof UpdateTeachingAssignmentSchema>;
