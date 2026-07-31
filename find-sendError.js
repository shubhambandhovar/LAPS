const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'apps/api/src/controllers');
const files = fs.readdirSync(controllersDir);

files.forEach(file => {
  const filePath = path.join(controllersDir, file);
  if (!fs.statSync(filePath).isFile()) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('sendError')) {
      const match = line.match(/sendError\(([^)]+)\)/);
      if (match) {
        const args = match[1].split(',');
        // If there are exactly 3 arguments (meaning 2 commas inside parentheses)
        if (args.length === 3) {
          console.log(`File: ${file} Line: ${i + 1} Args: 3 -> ${line.trim()}`);
        }
      }
    }
  });
});
