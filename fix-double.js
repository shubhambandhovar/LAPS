const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'apps/api/src/controllers');
const files = fs.readdirSync(controllersDir).filter(f => f.startsWith('library') || f.startsWith('inventory'));

files.forEach(file => {
  const filePath = path.join(controllersDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix double inserted error codes
  content = content.replace(/sendError\(res,\s*(\d+),\s*'([^']+)',\s*'([^']+)',\s*'([^']+)'\)/g, (match, p1, p2, p3, p4) => {
    // p2 and p3 are probably the same error code, p4 is the message
    return `sendError(res, ${p1}, '${p2}', '${p4}')`;
  });

  // Also remove unused imports like Student, Employee, Department
  content = content.replace(/,\s*Student/g, '');
  content = content.replace(/Student,\s*/g, '');
  content = content.replace(/,\s*Employee/g, '');
  content = content.replace(/Employee,\s*/g, '');
  content = content.replace(/,\s*Department/g, '');
  content = content.replace(/Department,\s*/g, '');
  content = content.replace(/,\s*AssetAssignment/g, '');

  fs.writeFileSync(filePath, content);
});

console.log('Fixed double error codes and unused models');
