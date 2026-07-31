const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'apps/api/src/controllers');
const files = fs.readdirSync(controllersDir).filter(f => f.startsWith('library') || f.startsWith('inventory'));

files.forEach(file => {
  const filePath = path.join(controllersDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix sendSuccess
  // replace sendSuccess(res, { data }, 201) -> sendSuccess(res, 201, 'Success', { data })
  content = content.replace(/sendSuccess\(res,\s*(\{.*?\})\s*,\s*(\d+)\)/g, "sendSuccess(res, $2, 'Success', $1)");
  
  // replace sendSuccess(res, { data }) -> sendSuccess(res, 200, 'Success', { data })
  content = content.replace(/sendSuccess\(res,\s*(\{.*?\})\)/g, "sendSuccess(res, 200, 'Success', $1)");

  // Fix sendError
  // replace sendError(res, 500, 'msg', error) -> sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'msg')
  content = content.replace(/sendError\(res,\s*500,\s*('.*?'),\s*error\)/g, "sendError(res, 500, 'INTERNAL_SERVER_ERROR', $1)");

  // replace sendError(res, 400, 'msg', error) -> sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'msg')
  content = content.replace(/sendError\(res,\s*400,\s*('.*?'),\s*error\)/g, "sendError(res, 400, 'BUSINESS_RULE_VIOLATION', $1)");

  // replace sendError(res, 400, 'msg') -> sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'msg')
  content = content.replace(/sendError\(res,\s*400,\s*('.*?')\)/g, "sendError(res, 400, 'BUSINESS_RULE_VIOLATION', $1)");

  // replace sendError(res, 404, 'msg') -> sendError(res, 404, 'RESOURCE_NOT_FOUND', 'msg')
  content = content.replace(/sendError\(res,\s*404,\s*('.*?')\)/g, "sendError(res, 404, 'RESOURCE_NOT_FOUND', $1)");

  // replace sendError(res, 409, 'msg') -> sendError(res, 409, 'DUPLICATE_RESOURCE', 'msg')
  content = content.replace(/sendError\(res,\s*409,\s*('.*?')\)/g, "sendError(res, 409, 'DUPLICATE_RESOURCE', $1)");

  // replace sendError(res, 403, 'msg') -> sendError(res, 403, 'RBAC_PERMISSION_DENIED', 'msg')
  content = content.replace(/sendError\(res,\s*403,\s*('.*?')\)/g, "sendError(res, 403, 'RBAC_PERMISSION_DENIED', $1)");

  fs.writeFileSync(filePath, content);
});

console.log('Fixed controllers');
