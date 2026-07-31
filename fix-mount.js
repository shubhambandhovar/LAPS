const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'apps/api/src/routes/index.ts');
let content = fs.readFileSync(file, 'utf8');

// Filter out null bytes if any
content = content.replace(/\0/g, '');

// Clean up any trailing broken imports I appended
content = content.replace(/import reportsRoutes from '\.\/reports\.routes'; router\.use\('\/', reportsRoutes\);/g, '');

// Insert import at the top
if (!content.includes('import reportsRoutes')) {
  content = content.replace(/import { Router } from 'express';/, "import { Router } from 'express';\nimport reportsRoutes from './reports.routes';");
}

// Insert router.use at the end
if (!content.includes("router.use('/', reportsRoutes)")) {
  content = content.replace(/export default router;/, "router.use('/', reportsRoutes);\n\nexport default router;");
}

fs.writeFileSync(file, content);
