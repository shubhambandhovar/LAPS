declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeAll: any;
declare const afterAll: any;
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../app';
import { Vendor, Consumable, StockMovement, Asset, AssetAssignment, User } from '../models';
import { generateAccessToken as generateToken } from '../utils/jwt';

describe('Inventory API', () => {
  let adminToken: string;
  let adminId: mongoose.Types.ObjectId;
  let consumableId: mongoose.Types.ObjectId;
  let vendorId: mongoose.Types.ObjectId;
  let assetId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    adminId = new mongoose.Types.ObjectId();
    await User.create({
      _id: adminId,
      schoolId: 'LAPS-GOHAD',
      identifier: 'inv_admin',
      passwordHash: 'hashed',
      roleId: new mongoose.Types.ObjectId(),
      roleCode: 'SUPER_ADMIN',
      userType: 'SUPER_ADMIN',
      status: 'ACTIVE'
    });
    adminToken = generateToken({ _id: adminId, schoolId: 'LAPS-GOHAD', roleCode: 'SUPER_ADMIN', userType: 'SUPER_ADMIN' } as any, 'sid', 'sfid');
  });

  afterAll(async () => {
    await Vendor.deleteMany({ schoolId: 'LAPS-GOHAD' });
    await Consumable.deleteMany({ schoolId: 'LAPS-GOHAD' });
    await StockMovement.deleteMany({ schoolId: 'LAPS-GOHAD' });
    await Asset.deleteMany({ schoolId: 'LAPS-GOHAD' });
    await AssetAssignment.deleteMany({ schoolId: 'LAPS-GOHAD' });
    await User.deleteMany({ _id: adminId });
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
        minimumStock: 10
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
        movementDate: new Date().toISOString().split('T')[0]
      });
    
    expect(res.status).toBe(201);
    expect(res.body.data.currentStock).toBe(50);
  });

  it('should prevent issuing more stock than available', async () => {
    const res = await request(app)
      .post('/api/v1/inventory/stock/movement')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        consumableId,
        movementType: 'ISSUE',
        quantity: 100, // We only have 50
        movementDate: new Date().toISOString().split('T')[0]
      });
    
    expect(res.status).toBe(400); // Bad Request (Insufficient stock)
  });

  it('should create an asset', async () => {
    const res = await request(app)
      .post('/api/v1/inventory/assets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        assetCode: 'IT-001',
        name: 'Dell Laptop',
        category: 'IT_EQUIPMENT'
      });
    
    expect(res.status).toBe(201);
    assetId = res.body.data.asset._id;
  });

  it('should assign asset and change status', async () => {
    const res = await request(app)
      .post('/api/v1/inventory/assets/assign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        assetId,
        assignedToType: 'EMPLOYEE',
        employeeId: new mongoose.Types.ObjectId(), // Mock employee ID
        assignedDate: new Date().toISOString().split('T')[0]
      });
    
    expect(res.status).toBe(201);
    
    const asset = await Asset.findById(assetId);
    expect(asset?.status).toBe('IN_USE');
  });
});
