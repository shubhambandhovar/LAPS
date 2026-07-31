const fs = require('fs');
const path = require('path');

const updateRoadmap = () => {
  const filePath = path.join(__dirname, 'docs/DEVELOPMENT_ROADMAP.md');
  let content = fs.readFileSync(filePath, 'utf8');

  const phase18 = `
### Phase 18 — Reports & Analytics
* **Objective**: Design a comprehensive Reports & Analytics module consuming data from all existing ERP modules.
* **Dependencies**: All preceding functional modules (Phases 1-17).
* **Deliverables**: Executive Dashboard, Academic, Attendance, Fee, HR, Library, Inventory, Transport, Admission, and Communication reports. Export support for PDF/Excel/CSV, and Scheduled Reports via email.
* **Acceptance Criteria**: Reports generate accurately without duplicating business logic. Scheduled reports execute reliably via cron jobs. RBAC is enforced strictly for report access.
* **Tests Required**: Report generation unit tests, large dataset aggregation performance tests, and RBAC isolation tests.

---
`;

  // Insert Phase 18 right before Phase 19 (which was formerly Phase 18)
  content = content.replace(/### Phase 19 — Final Security Hardening/, phase18 + '\n### Phase 19 — Final Security Hardening');
  fs.writeFileSync(filePath, content);
};

const updateDatabaseSchema = () => {
  const filePath = path.join(__dirname, 'docs/DATABASE_SCHEMA.md');
  let content = fs.readFileSync(filePath, 'utf8');

  const newSchemas = `
## 19. Reports & Analytics Module

### ReportTemplate Collection
* \`_id\`: ObjectId
* \`schoolId\`: String
* \`name\`: String
* \`category\`: String (Academic, Fee, HR, etc.)
* \`module\`: String
* \`configuration\`: Object (columns, filters, sorting options)
* \`createdBy\`: ObjectId (User)
* \`createdAt\`: Date
* \`updatedAt\`: Date

### SavedReport Collection
* \`_id\`: ObjectId
* \`schoolId\`: String
* \`templateId\`: ObjectId (ReportTemplate)
* \`name\`: String
* \`description\`: String
* \`parameters\`: Object (saved filter values like academic session, date range)
* \`createdBy\`: ObjectId (User)
* \`createdAt\`: Date
* \`updatedAt\`: Date

### ScheduledReport Collection
* \`_id\`: ObjectId
* \`schoolId\`: String
* \`savedReportId\`: ObjectId (SavedReport)
* \`frequency\`: String (DAILY, WEEKLY, MONTHLY)
* \`cronExpression\`: String
* \`recipients\`: Array of Strings (email addresses)
* \`format\`: String (PDF, EXCEL, CSV)
* \`status\`: String (ACTIVE, PAUSED)
* \`nextRunAt\`: Date
* \`createdBy\`: ObjectId (User)
* \`createdAt\`: Date
* \`updatedAt\`: Date

### ReportExecutionLog Collection
* \`_id\`: ObjectId
* \`schoolId\`: String
* \`scheduledReportId\`: ObjectId (ScheduledReport)
* \`status\`: String (SUCCESS, FAILED)
* \`executionTime\`: Date
* \`durationMs\`: Number
* \`errorMessage\`: String
* \`fileUrl\`: String (if saved to cloud storage)

`;

  // Append new schemas before the end or just at the bottom
  if (!content.includes('Reports & Analytics Module')) {
    content += newSchemas;
    fs.writeFileSync(filePath, content);
  }
};

const updateApiDesign = () => {
  const filePath = path.join(__dirname, 'docs/API_DESIGN.md');
  let content = fs.readFileSync(filePath, 'utf8');

  const newApis = `
### 18. Reports & Analytics (\`/api/v1/reports\`, \`/api/v1/analytics\`)

* \`GET /api/v1/analytics/dashboard/executive\` - Get high-level KPI aggregations (Super Admin / School Admin)
* \`GET /api/v1/reports/academic\` - Generate academic reports (Result analysis, promotion, enrollment)
* \`GET /api/v1/reports/attendance\` - Generate attendance trends and reports
* \`GET /api/v1/reports/fees\` - Generate fee collection and outstanding reports
* \`GET /api/v1/reports/hr\` - Generate employee, payroll, and leave reports
* \`POST /api/v1/reports/generate\` - Generate a dynamic report with specific filters
* \`POST /api/v1/reports/export\` - Export a dynamic report (query param \`format=pdf|excel|csv\`)
* \`GET /api/v1/report-templates\` - List available report templates
* \`POST /api/v1/reports/saved\` - Save a report configuration
* \`GET /api/v1/reports/saved\` - Get user's saved reports
* \`POST /api/v1/scheduled-reports\` - Schedule a report for automated delivery
* \`GET /api/v1/scheduled-reports\` - List scheduled reports
* \`DELETE /api/v1/scheduled-reports/:id\` - Cancel a scheduled report

`;

  if (!content.includes('/api/v1/reports')) {
    content += newApis;
    fs.writeFileSync(filePath, content);
  }
};

updateRoadmap();
updateDatabaseSchema();
updateApiDesign();

console.log('Docs updated successfully.');
