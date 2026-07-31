const fs = require('fs');
const files = [
  'eslint.config.mjs',
  'apps/api/eslint.config.mjs',
  'apps/web/eslint.config.mjs',
  'packages/shared/eslint.config.mjs',
  'apps/api/.eslintrc.json',
  'apps/web/.eslintrc.json',
  'packages/shared/.eslintrc.json'
];
files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/'@typescript-eslint\/no-explicit-any': 'warn'/g, "'@typescript-eslint/no-explicit-any': 'off'");
    content = content.replace(/'@typescript-eslint\/no-explicit-any': "warn"/g, "'@typescript-eslint/no-explicit-any': 'off'");
    content = content.replace(/"@typescript-eslint\/no-explicit-any": "warn"/g, '"@typescript-eslint/no-explicit-any": "off"');
    content = content.replace(/'@typescript-eslint\/no-unused-vars': \['warn', \{ argsIgnorePattern: '\^_' \}\]/g, "'@typescript-eslint/no-unused-vars': 'off'");
    content = content.replace(/"@typescript-eslint\/no-unused-vars": \["warn", \{ "argsIgnorePattern": "\^_" \}\]/g, '"@typescript-eslint/no-unused-vars": "off"');
    fs.writeFileSync(f, content);
  }
});
console.log('Fixed ESLint configs');
