import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app';

describe('Global 404 & Error Handling', () => {
  it('should return 404 Not Found with standardized error response for unknown routes', async () => {
    const res = await request(app).get('/api/v1/unknown-route-for-test');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.statusCode).toBe(404);
    expect(res.body.errorCode).toBe('RESOURCE_NOT_FOUND');
    expect(res.body.message).toContain('Route not found: GET /api/v1/unknown-route-for-test');
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.timestamp).toBeDefined();
  });
});
