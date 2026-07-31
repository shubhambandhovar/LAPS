const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'apps/web/src/modules/reports');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  let content = fs.readFileSync(path.join(dir, file), 'utf8');

  // Fix CardHeader, CardTitle, CardContent, CardFooter with attributes
  content = content.replace(/<CardHeader([^>]*)>/g, '<div className="p-4 border-b"$1>');
  content = content.replace(/<CardTitle([^>]*)>/g, '<h2 className="text-xl font-bold"$1>');
  content = content.replace(/<CardContent([^>]*)>/g, '<div className="p-4"$1>');
  content = content.replace(/<CardFooter([^>]*)>/g, '<div className="p-4 border-t"$1>');

  fs.writeFileSync(path.join(dir, file), content);
}
console.log('Fixed Web UI components attributes');
