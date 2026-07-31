const fs = require('fs');
const path = require('path');

const fixRoutes = () => {
  const file = path.join(__dirname, 'apps/api/src/routes/reports.routes.ts');
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/import \{ authenticate, authorize \} from '\.\.\/middleware\/auth';/, "import { authenticate, requireRole } from '../middleware/auth';");
  content = content.replace(/authorize\('SUPER_ADMIN', 'SCHOOL_ADMIN'\)/g, "requireRole(['SUPER_ADMIN', 'SCHOOL_ADMIN'])");
  fs.writeFileSync(file, content);
};

const fixController = () => {
  const file = path.join(__dirname, 'apps/api/src/controllers/reports.controller.ts');
  let content = fs.readFileSync(file, 'utf8');
  // Remove unused ReportExecutionLog
  content = content.replace(/ReportExecutionLog,\s*/g, '');
  // Replace FeePayment with Payment
  content = content.replace(/FeePayment/g, 'Payment');
  
  // Fix unused variables schoolId and module in generateReport and exportReport
  // In generateReport:
  // const schoolId = req.user?.schoolId;
  // const { module, filters } = req.body;
  content = content.replace(/const schoolId = req\.user\?\.schoolId;\s*const \{ module, filters \} = req\.body;/g, "const { module } = req.body;");
  
  // In exportReport:
  content = content.replace(/const schoolId = req\.user\?\.schoolId;\s*const \{ format, module \} = req\.body;/g, "const { format } = req.body;");
  
  fs.writeFileSync(file, content);
};

fixRoutes();
fixController();

console.log('Fixed reports typescript errors');
