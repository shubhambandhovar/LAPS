const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'apps/web/src/modules/reports');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  let content = fs.readFileSync(path.join(dir, file), 'utf8');
  content = content.replace(/import api from '\.\.\/\.\.\/lib\/api';/g, "import { apiClient as api } from '../../lib/api';");
  fs.writeFileSync(path.join(dir, file), content);
}
console.log('Fixed api import');
