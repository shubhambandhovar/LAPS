import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app';

describe('GET /api/v1/health', () => {
  it('should return 200 OK with standardized health response envelope', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.statusCode).toBe(200);
    expect(res.body.message).toBe('Service health check passed');
    expect(res.body.data).toBeDefined();
    expect(res.body.data.service).toBe('Little Angels School ERP API');
    expect(res.body.data.status).toBeDefined();
    expect(res.body.data.apiVersion).toBe('v1');
    expect(res.body.data.database).toBeDefined();
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.timestamp).toBeDefined();
  });
});
