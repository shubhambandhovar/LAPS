const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'apps/web/src/modules/reports');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  let content = fs.readFileSync(path.join(dir, file), 'utf8');

  // Remove unused React imports
  content = content.replace(/import React(?:, \{[^}]+\})? from 'react';\n?/g, '');
  
  // Fix apiClient to api
  content = content.replace(/\.\.\/\.\.\/lib\/apiClient/g, '../../lib/api');
  
  // Replace missing UI components with standard tailwind HTML elements or correct imports
  // For Card, we have Card.tsx
  content = content.replace(/@\/components\/ui\/card/g, '../../components/ui/Card');
  // For Button, we have Button.tsx
  content = content.replace(/@\/components\/ui\/button/g, '../../components/ui/Button');
  
  // For Select and Badge, which don't exist, we will just remove the imports and change the tags to native html
  content = content.replace(/import \{ Select, SelectContent, SelectItem, SelectTrigger, SelectValue \} from '@\/components\/ui\/select';\n?/g, '');
  content = content.replace(/import \{ Badge \} from '@\/components\/ui\/badge';\n?/g, '');
  
  // Remove Trash2 from SavedReports if unused
  content = content.replace(/, Trash2/g, '');
  
  // Fix unused CardHeader, CardTitle, CardFooter in ScheduledReports if we only import Card
  content = content.replace(/import \{ Card, CardHeader, CardTitle, CardContent, CardFooter \} from '\.\.\/\.\.\/components\/ui\/Card';/g, "import { Card } from '../../components/ui/Card';");
  content = content.replace(/import \{ Card, CardHeader, CardTitle, CardContent \} from '\.\.\/\.\.\/components\/ui\/Card';/g, "import { Card } from '../../components/ui/Card';");
  
  // Transform Select component tags to native select tags for simplicity
  content = content.replace(/<SelectTrigger[^>]*>\s*<SelectValue[^>]*\/>\s*<\/SelectTrigger>/g, '');
  content = content.replace(/<SelectContent>/g, '');
  content = content.replace(/<\/SelectContent>/g, '');
  content = content.replace(/<Select /g, '<select className="border rounded p-2" ');
  content = content.replace(/<\/Select>/g, '</select>');
  content = content.replace(/<SelectItem value=/g, '<option value=');
  content = content.replace(/<\/SelectItem>/g, '</option>');
  
  // Transform Badge to span
  content = content.replace(/<Badge /g, '<span className="px-2 py-1 bg-gray-100 rounded text-sm" ');
  content = content.replace(/<\/Badge>/g, '</span>');
  
  // Remove unused CardHeader, CardTitle, CardFooter tags since Card is just a div in Card.tsx
  content = content.replace(/<CardHeader>/g, '<div className="p-4 border-b">');
  content = content.replace(/<\/CardHeader>/g, '</div>');
  content = content.replace(/<CardTitle>/g, '<h2 className="text-xl font-bold">');
  content = content.replace(/<\/CardTitle>/g, '</h2>');
  content = content.replace(/<CardContent>/g, '<div className="p-4">');
  content = content.replace(/<\/CardContent>/g, '</div>');
  content = content.replace(/<CardFooter>/g, '<div className="p-4 border-t">');
  content = content.replace(/<\/CardFooter>/g, '</div>');

  // Also fix onValueChange to onChange for the native select
  content = content.replace(/onValueChange=\{([^}]+)\}/g, 'onChange={(e) => $1(e.target.value)}');

  fs.writeFileSync(path.join(dir, file), content);
}
console.log('Fixed Web UI components');
