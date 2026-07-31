declare const describe: any; declare const it: any; declare const expect: any; declare const beforeAll: any;
import request from 'supertest';
import { app } from '../app';
import { generateAccessToken as generateToken } from '../utils/jwt';
import mongoose from 'mongoose';


describe('Reports API', () => {
  let adminToken: string;
  let adminId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    adminId = new mongoose.Types.ObjectId();
    
    adminToken = generateToken({ _id: adminId, schoolId: 'LAPS-GOHAD', roleCode: 'SUPER_ADMIN', userType: 'SUPER_ADMIN' } as any, 'sid', 'sfid');
  });

  it('GET /api/v1/dashboard/executive - should fetch executive dashboard', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/executive')
      .set('Authorization', `Bearer ${adminToken}`);
      
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totalStudents');
    expect(res.body.data).toHaveProperty('totalFees');
  });

  it('GET /api/v1/analytics/:module - should fetch module analytics', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/fees')
      .set('Authorization', `Bearer ${adminToken}`);
      
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('module', 'fees');
    expect(res.body.data).toHaveProperty('analytics');
  });
});
