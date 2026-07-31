const fs = require('fs');
const file = 'packages/shared/src/index.ts';
let buffer = fs.readFileSync(file);
// Remove null bytes
buffer = buffer.filter(b => b !== 0);
fs.writeFileSync(file, buffer);
