const fs = require('fs');
const path = require('path');

const fixAnalytics = () => {
  const file = path.join(__dirname, 'apps/api/src/controllers/inventoryAnalytics.controller.ts');
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/sendSuccess\(res,\s*\{/g, "sendSuccess(res, 200, 'Success', {");
  fs.writeFileSync(file, content);
};

const fixAssetController = () => {
  const file = path.join(__dirname, 'apps/api/src/controllers/inventoryAsset.controller.ts');
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/UpdateAssetSchemaSchema/g, 'UpdateAssetSchema');
  content = content.replace(/import \{ Asset \} from '\.\.\/models';/, "import { Asset, AssetAssignment } from '../models';");
  content = content.replace(/import \{ CreateAssetSchema \} from '@laps\/shared';/, "import { CreateAssetSchema, UpdateAssetSchema, AssetAssignmentSchema } from '@laps/shared';");
  fs.writeFileSync(file, content);
};

const fixLibraryIssueController = () => {
  const file = path.join(__dirname, 'apps/api/src/controllers/libraryIssue.controller.ts');
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/sendError\(res,\s*400,\s*'Book copy is currently unavailable for issue'\)/, "sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Book copy is currently unavailable for issue')");
  fs.writeFileSync(file, content);
};

const fixTests = () => {
  const libraryTest = path.join(__dirname, 'apps/api/src/__tests__/library.test.ts');
  if (fs.existsSync(libraryTest)) {
    let content = fs.readFileSync(libraryTest, 'utf8');
    if (!content.includes('@jest/globals')) {
      content = "import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';\n" + content;
      fs.writeFileSync(libraryTest, content);
    }
  }

  const inventoryTest = path.join(__dirname, 'apps/api/src/__tests__/inventory.test.ts');
  if (fs.existsSync(inventoryTest)) {
    let content = fs.readFileSync(inventoryTest, 'utf8');
    if (!content.includes('@jest/globals')) {
      content = "import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';\n" + content;
      fs.writeFileSync(inventoryTest, content);
    }
  }
};

fixAnalytics();
fixAssetController();
fixLibraryIssueController();
fixTests();

console.log('Fixed remaining errors');
