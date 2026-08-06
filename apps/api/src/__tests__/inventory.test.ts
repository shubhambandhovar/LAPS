import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../models';
import { generateAccessToken as generateToken } from '../utils/jwt';

let mongoServer: MongoMemoryServer;
let app: ReturnType<typeof createApp>;

describe('Inventory API', () => {
  let adminToken: string;
  let adminId: mongoose.Types.ObjectId;
  let consumableId: string;
  let vendorId: string;
  let assetId: string;
  let deptId: string;
  let assignmentId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await connectDatabase(uri);
    app = createApp();

    adminId = new mongoose.Types.ObjectId();
    deptId = new mongoose.Types.ObjectId().toString();

    await User.create({
      _id: adminId,
      schoolId: 'LAPS-GOHAD',
      identifier: 'inv_admin',
      passwordHash: 'hashed',
      roleId: new mongoose.Types.ObjectId(),
      roleCode: 'SUPER_ADMIN',
      userType: 'SUPER_ADMIN',
      status: 'ACTIVE',
    });
    adminToken = generateToken(
      {
        _id: adminId,
        schoolId: 'LAPS-GOHAD',
        roleCode: 'SUPER_ADMIN',
        userType: 'SUPER_ADMIN',
      } as any,
      'sid',
      'sfid',
    );
  });

  afterAll(async () => {
    await disconnectDatabase();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it('should create a vendor', async () => {
    const res = await request(app)
      .post('/api/v1/inventory/vendors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        vendorCode: 'V-001',
        name: 'ABC Supplies',
      });

    expect(res.status).toBe(201);
    vendorId = res.body.data.vendor._id;
  });

  it('should create a consumable', async () => {
    const res = await request(app)
      .post('/api/v1/inventory/consumables')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'A4 Paper Ream',
        category: 'Stationery',
        unit: 'Ream',
        minimumStock: 10,
      });

    expect(res.status).toBe(201);
    consumableId = res.body.data.consumable._id;
  });

  it('should record a stock purchase movement', async () => {
    const res = await request(app)
      .post('/api/v1/inventory/stock/movement')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        consumableId,
        movementType: 'PURCHASE',
        quantity: 50,
        vendorId,
        movementDate: '2026-08-01',
        remarks: 'Purchase from ABC Supplies',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.currentStock).toBe(50);
  });

  it('should record a stock consumption movement', async () => {
    const res = await request(app)
      .post('/api/v1/inventory/stock/movement')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        consumableId,
        movementType: 'ISSUE',
        quantity: 5,
        departmentId: deptId,
        movementDate: '2026-08-02',
        remarks: 'Issued to Dept',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.currentStock).toBe(45);
  });

  it('should fetch stock movements for a consumable', async () => {
    const res = await request(app)
      .get(`/api/v1/inventory/stock/movements?consumableId=${consumableId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.movements.length).toBe(2);
  });

  it('should create an asset', async () => {
    const res = await request(app)
      .post('/api/v1/inventory/assets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        assetCode: 'IT-001',
        name: 'Dell Latitude 3420',
        category: 'IT_EQUIPMENT',
        purchaseDate: '2026-07-15',
        purchasePrice: 45000,
        status: 'IN_STORAGE',
      });

    expect(res.status).toBe(201);
    assetId = res.body.data.asset._id;
  });

  it('should assign an asset to a user', async () => {
    const res = await request(app)
      .post('/api/v1/inventory/assets/assign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        assetId,
        assignedToType: 'EMPLOYEE',
        employeeId: adminId.toString(),
        assignedDate: '2026-08-01',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.assignment.employeeId).toBe(adminId.toString());
    assignmentId = res.body.data.assignment._id;
  });

  it('should return an assigned asset', async () => {
    const res = await request(app)
      .patch(`/api/v1/inventory/assets/assignments/${assignmentId}/return`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        returnDate: '2026-08-04',
        returnCondition: 'GOOD',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.assignment.status).toBe('RETURNED');
  });
});
