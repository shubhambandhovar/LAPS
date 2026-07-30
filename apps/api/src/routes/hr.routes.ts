import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';

import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/hrDepartment.controller';

import {
  getDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation,
} from '../controllers/hrDesignation.controller';

import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
} from '../controllers/hrEmployee.controller';

import {
  getSalaryStructures,
  getSalaryStructureByEmployee,
  createSalaryStructure,
} from '../controllers/hrSalaryStructure.controller';

import {
  getPayrolls,
  generatePayroll,
  updatePayrollStatus,
} from '../controllers/hrPayroll.controller';

import {
  getPayslips,
  getMyPayslips,
} from '../controllers/hrPayslip.controller';

import { getHrAnalytics } from '../controllers/hrAnalytics.controller';

const router = Router();

router.use(authenticate);

// Employee Self-Service
router.get('/payslips/me', getMyPayslips);

// HR Only Routes
router.use(requireRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR_MANAGER']));

// Analytics
router.get('/analytics', getHrAnalytics);

// Departments
router.get('/departments', getDepartments);
router.post('/departments', createDepartment);
router.put('/departments/:id', updateDepartment);
router.delete('/departments/:id', deleteDepartment);

// Designations
router.get('/designations', getDesignations);
router.post('/designations', createDesignation);
router.put('/designations/:id', updateDesignation);
router.delete('/designations/:id', deleteDesignation);

// Employees
router.get('/employees', getEmployees);
router.get('/employees/:id', getEmployeeById);
router.post('/employees', createEmployee);
router.put('/employees/:id', updateEmployee);

// Salary Structures
router.get('/salary-structures', getSalaryStructures);
router.get('/salary-structures/employee/:employeeId', getSalaryStructureByEmployee);
router.post('/salary-structures', createSalaryStructure);

// Payroll
router.get('/payroll', getPayrolls);
router.post('/payroll/generate', generatePayroll);
router.patch('/payroll/:id/status', updatePayrollStatus);

// Payslips (HR view all)
router.get('/payslips', getPayslips);

export default router;
