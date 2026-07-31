const fs = require('fs');
const path = require('path');

const fixIndex = () => {
  const file = path.join(__dirname, 'apps/api/src/routes/index.ts');
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/router\.use\('\/', reportsRoutes\);/, "router.use('/reports', reportsRoutes);");
  fs.writeFileSync(file, content);
};
fixIndex();

const fixReportsRoutes = () => {
  const file = path.join(__dirname, 'apps/api/src/routes/reports.routes.ts');
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/router\.use\(authenticate\);\n/g, '');
  content = content.replace(/router\.get\('\/dashboard\/executive', requireRole\(\['SUPER_ADMIN', 'SCHOOL_ADMIN'\]\), ReportsController\.getExecutiveDashboard\);/g, "router.get('/dashboard/executive', authenticate, requireRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), ReportsController.getExecutiveDashboard);");
  content = content.replace(/router\.get\('\/analytics\/:module', ReportsController\.getModuleAnalytics\);/g, "router.get('/analytics/:module', authenticate, ReportsController.getModuleAnalytics);");
  content = content.replace(/router\.post\('\/reports\/generate'/g, "router.post('/generate'");
  content = content.replace(/router\.post\('\/reports\/export'/g, "router.post('/export'");
  content = content.replace(/router\.get\('\/reports\/saved'/g, "router.get('/saved'");
  content = content.replace(/router\.post\('\/reports\/saved'/g, "router.post('/saved'");
  
  // Add authenticate where missing
  content = content.replace(/router\.post\('\/generate', ReportsController/g, "router.post('/generate', authenticate, ReportsController");
  content = content.replace(/router\.post\('\/export', ReportsController/g, "router.post('/export', authenticate, ReportsController");
  content = content.replace(/router\.get\('\/report-templates', ReportsController/g, "router.get('/report-templates', authenticate, ReportsController");
  content = content.replace(/router\.post\('\/report-templates', requireRole/g, "router.post('/report-templates', authenticate, requireRole");
  content = content.replace(/router\.get\('\/saved', ReportsController/g, "router.get('/saved', authenticate, ReportsController");
  content = content.replace(/router\.post\('\/saved', ReportsController/g, "router.post('/saved', authenticate, ReportsController");
  content = content.replace(/router\.get\('\/scheduled-reports', ReportsController/g, "router.get('/scheduled-reports', authenticate, ReportsController");
  content = content.replace(/router\.post\('\/scheduled-reports', ReportsController/g, "router.post('/scheduled-reports', authenticate, ReportsController");
  content = content.replace(/router\.delete\('\/scheduled-reports\/:id', ReportsController/g, "router.delete('/scheduled-reports/:id', authenticate, ReportsController");

  fs.writeFileSync(file, content);
};
fixReportsRoutes();

const fixReportsTests = () => {
  const file = path.join(__dirname, 'apps/api/src/__tests__/reports.test.ts');
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/'\/api\/v1\/dashboard\/executive'/g, "'/api/v1/reports/dashboard/executive'");
  content = content.replace(/'\/api\/v1\/analytics\/fees'/g, "'/api/v1/reports/analytics/fees'");
  // Also we must create the user in the database so authentication succeeds and doesn't timeout!
  const imports = `import request from 'supertest';
import { app } from '../app';
import { generateAccessToken as generateToken } from '../utils/jwt';
import mongoose from 'mongoose';
import { User } from '../models';`;
  content = content.replace(/import request from 'supertest';\nimport \{ app \} from '\.\.\/app';\nimport \{ generateAccessToken as generateToken \} from '\.\.\/utils\/jwt';\nimport mongoose from 'mongoose';/, imports);
  
  const setup = `  beforeAll(async () => {
    adminId = new mongoose.Types.ObjectId();
    
    await User.create({
      _id: adminId,
      schoolId: 'LAPS-GOHAD',
      identifier: 'ADMIN123',
      passwordHash: 'hashed',
      roleId: new mongoose.Types.ObjectId(),
      roleCode: 'SUPER_ADMIN',
      userType: 'SUPER_ADMIN',
      status: 'ACTIVE'
    });

    adminToken = generateToken({ _id: adminId, schoolId: 'LAPS-GOHAD', roleCode: 'SUPER_ADMIN', userType: 'SUPER_ADMIN' } as any, 'sid', 'sfid');
  });`;
  
  content = content.replace(/  beforeAll\(async \(\) => \{\n    adminId = new mongoose\.Types\.ObjectId\(\);\n    \n    adminToken = generateToken\(\{ _id: adminId, schoolId: 'LAPS-GOHAD', roleCode: 'SUPER_ADMIN', userType: 'SUPER_ADMIN' \} as any, 'sid', 'sfid'\);\n  \}\);/, setup);
  fs.writeFileSync(file, content);
};
fixReportsTests();

console.log('Fixed route mounting and tests.');
