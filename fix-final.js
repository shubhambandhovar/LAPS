const fs = require('fs');
const path = require('path');

const fixWeb = (filename) => {
  const file = path.join(__dirname, 'apps/web/src/modules/reports', filename);
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\\`/g, '`').replace(/\\\$/g, '$');
  fs.writeFileSync(file, content);
};

fixWeb('AnalyticsDashboard.tsx');
fixWeb('ScheduledReports.tsx');

const fixApiTests = () => {
  const file = path.join(__dirname, 'apps/api/src/__tests__/reports.test.ts');
  let content = fs.readFileSync(file, 'utf8');
  // Remove the commented out block that was causing errors.
  content = content.replace(/\/\/ const admin = new User\(\{[\s\S]*?\}\);/g, '');
  // Because my earlier replacement might have left '{' and '}' hanging:
  content = content.replace(/\{\s*_id: adminId,\s*schoolId: 'LAPS-GOHAD',\s*identifier: 'ADMIN123',\s*passwordHash: 'hashed',\s*roleId: new mongoose\.Types\.ObjectId\(\),\s*roleCode: 'SUPER_ADMIN',\s*userType: 'SUPER_ADMIN',\s*status: 'ACTIVE'\s*\}/g, '');
  fs.writeFileSync(file, content);
};

fixApiTests();
