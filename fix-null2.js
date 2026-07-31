const fs = require('fs');
const file = 'apps/api/src/models/index.ts';
let buffer = fs.readFileSync(file);
buffer = buffer.filter(b => b !== 0);
fs.writeFileSync(file, buffer);
