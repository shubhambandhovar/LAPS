import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app';

describe('Security Baseline Middleware', () => {
  it('should include Helmet security headers in responses', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
  });

  it('should reject CORS requests from disallowed origins', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'http://malicious-attacker-domain.com');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('AUTH_SCOPE_FORBIDDEN');
    expect(res.body.message).toContain('CORS policy violation');
  });

  it('should allow CORS requests from configured ALLOWED_ORIGINS', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'http://localhost:5173');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});
