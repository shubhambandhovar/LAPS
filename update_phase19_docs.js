const fs = require('fs');
const path = require('path');

const updateRoadmap = () => {
  const filePath = path.join(__dirname, 'docs/DEVELOPMENT_ROADMAP.md');
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace everything from Phase 19 onwards with the new unified Phase 19
  const phase19Index = content.indexOf('### Phase 19');
  if (phase19Index !== -1) {
    content = content.substring(0, phase19Index);
  }

  const phase19 = `
### Phase 19 — Production Readiness, Security Hardening & DevOps
* **Objective**: Design and implement the complete production deployment architecture, CI/CD pipeline, security hardening, monitoring, and backups.
* **Dependencies**: All preceding functional modules (Phases 1-18).
* **Deliverables**: Production Dockerfiles, \`docker-compose.prod.yml\`, NGINX configs, GitHub Actions CI/CD workflows, MongoDB backup scripts, security headers (CSP, HSTS), and monitoring setup.
* **Acceptance Criteria**: Application securely deployable via CI/CD. All static assets cached. A+ rating on security headers. Automated backups configured.
* **Tests Required**: CI/CD pipeline execution, security headers verification, load testing, backup/restore drill.

---
`;

  content += phase19;
  fs.writeFileSync(filePath, content);
};

updateRoadmap();

const updateSystemArchitecture = () => {
  const filePath = path.join(__dirname, 'docs/SYSTEM_ARCHITECTURE.md');
  let content = fs.readFileSync(filePath, 'utf8');

  // Append Deployment Architecture section if not present
  if (!content.includes('Deployment Architecture')) {
    content += `
## Deployment Architecture (Phase 19)

### Docker & Containerization
- **Backend**: Containerized Node.js API (\`Dockerfile.api\`)
- **Frontend**: Containerized Nginx serving static React Vite build (\`Dockerfile.web\`)
- **Orchestration**: \`docker-compose.prod.yml\` orchestrating the network.

### Nginx Reverse Proxy
- **Role**: SSL Termination, Load Balancing, Static Asset Caching, Request Routing.
- **Security**: CSP, Strict-Transport-Security, X-Frame-Options, X-Content-Type-Options.

### Monitoring & Backups
- **Logs**: Structured JSON logging routed via Docker standard streams.
- **Backups**: \`mongodump\` cron jobs synced to secure offsite object storage (AWS S3).
- **Metrics**: PM2 / Node metrics for the API container.
`;
    fs.writeFileSync(filePath, content);
  }
}
updateSystemArchitecture();

console.log('Docs updated successfully.');
