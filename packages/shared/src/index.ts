export * from './types/api';
export * from './types/auth';
export * from './types/academics';
export * from './constants/errorCodes';
export {
  BackendEnvSchema,
  type BackendEnv,
} from './schemas/env.schema';
export {
  PasswordPolicySchema,
  CreatePasswordSchema,
  type CreatePasswordInput,
  LoginSchema,
  type LoginInput,
  RevokeSessionSchema,
  type RevokeSessionInput,
} from './schemas/auth.schema';
export {
  CreateAcademicSessionSchema,
  type CreateAcademicSessionInput,
  UpdateAcademicSessionSchema,
  type UpdateAcademicSessionInput,
  CreateClassSchema,
  type CreateClassInput,
  UpdateClassSchema,
  type UpdateClassInput,
  CreateSectionSchema,
  type CreateSectionInput,
  UpdateSectionSchema,
  type UpdateSectionInput,
  CreateSubjectSchema,
  type CreateSubjectInput,
  UpdateSubjectSchema,
  type UpdateSubjectInput,
  CreateTeacherSchema,
  type CreateTeacherInput,
  UpdateTeacherSchema,
  type UpdateTeacherInput,
  CreateTeachingAssignmentSchema,
  type CreateTeachingAssignmentInput,
  UpdateTeachingAssignmentSchema,
  type UpdateTeachingAssignmentInput,
} from './schemas/academics.schema';
export * from './types/students';
export {
  EmergencyContactSchema,
  type EmergencyContactInput,
  StudentDocumentSchema,
  type StudentDocumentInput,
  CreateStudentSchema,
  type CreateStudentInput,
  UpdateStudentSchema,
  type UpdateStudentInput,
  CreateGuardianSchema,
  type CreateGuardianInput,
  UpdateGuardianSchema,
  type UpdateGuardianInput,
  CreateStudentGuardianSchema,
  type CreateStudentGuardianInput,
  UpdateStudentGuardianSchema,
  type UpdateStudentGuardianInput,
  CreateEnrollmentSchema,
  type CreateEnrollmentInput,
  UpdateEnrollmentSchema,
  type UpdateEnrollmentInput,
  PromoteEnrollmentSchema,
  type PromoteEnrollmentInput,
  TransferEnrollmentSchema,
  type TransferEnrollmentInput,
  WithdrawEnrollmentSchema,
  type WithdrawEnrollmentInput,
} from './schemas/students.schema';
export * from './types/curriculum';
export * from './schemas/curriculum.schema';
export * from './types/attendance';
export * from './schemas/attendance.schema';
export * from './schemas/homework.schema';
export * from './schemas/exam.schema';
export * from './schemas/reportCard.schema';
export * from './schemas/fee.schema';
export * from './schemas/communication.schema';
export * from './types/communication.types';
export * from './schemas/calendar.schema';
export * from './schemas/cms.schema';
export * from './schemas/transport.schema';
export * from './schemas/admission.schema';
export * from './schemas/hr.schema';
export * from './schemas/library.schema';
export * from './schemas/inventory.schema';
export * from './schemas/reports.schema';

