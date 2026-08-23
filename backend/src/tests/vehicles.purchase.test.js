'use strict';

const request = require('supertest');
const bcrypt  = require('bcryptjs');
const app = require('../app');
const { db, initialize } = require('../config/database');

// ── helpers ──────────────────────────────────────────────────────────────────

async function getAuthToken() {
  await request(app)
    .post('/api/auth/register')
    .send({ name: 'Buyer', email: 'buyer@example.com', password: 'pass1234' });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'buyer@example.com', password: 'pass1234' });
  return res.body.token;
}

async function getAdminToken() {
  const hashedPassword = await bcrypt.hash('adminpass', 10);
  await new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
      ['Admin User', 'admin@example.com', hashedPassword, 'ADMIN'],
      (err) => (err ? reject(err) : resolve())
    );
  });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@example.com', password: 'adminpass' });
  return res.body.token;
}

async function addVehicle(adminToken, quantity = 3) {
  const res = await request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ make: 'Toyota', model: 'Camry', category: 'Sedan', price: 25000, quantity });
  return res.body.vehicle;
}

// ── lifecycle ─────────────────────────────────────────────────────────────────

beforeAll(async () => { await initialize(); });

beforeEach((done) => {
  db.serialize(() => {
    db.run('DELETE FROM vehicles', () => db.run('DELETE FROM users', done));
  });
});

afterAll((done) => { db.close(done); });

// ── POST /api/vehicles/:id/purchase ──────────────────────────────────────────

describe('POST /api/vehicles/:id/purchase', () => {

  it('should return 401 when no token is provided', async () => {
    const res = await request(app).post('/api/vehicles/1/purchase');
    expect(res.statusCode).toBe(401);
  });

  it('should return 404 when the vehicle does not exist', async () => {
    const token = await getAuthToken();

    const res = await request(app)
      .post('/api/vehicles/99999/purchase')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 200 and decrease quantity by 1 on successful purchase', async () => {
    const adminToken = await getAdminToken();
    const userToken  = await getAuthToken();
    const vehicle    = await addVehicle(adminToken, 3);

    const res = await request(app)
      .post(`/api/vehicles/${vehicle.id}/purchase`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('vehicle');
    expect(res.body.vehicle.quantity).toBe(2);
  });

  it('should persist the decremented quantity in the database', async () => {
    const adminToken = await getAdminToken();
    const userToken  = await getAuthToken();
    const vehicle    = await addVehicle(adminToken, 3);

    await request(app)
      .post(`/api/vehicles/${vehicle.id}/purchase`)
      .set('Authorization', `Bearer ${userToken}`);

    const row = await new Promise((resolve, reject) => {
      db.get('SELECT quantity FROM vehicles WHERE id = ?', [vehicle.id], (err, r) => (err ? reject(err) : resolve(r)));
    });

    expect(row.quantity).toBe(2);
  });

  it('should allow purchasing down to exactly 0', async () => {
    const adminToken = await getAdminToken();
    const userToken  = await getAuthToken();
    const vehicle    = await addVehicle(adminToken, 1);

    const res = await request(app)
      .post(`/api/vehicles/${vehicle.id}/purchase`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.vehicle.quantity).toBe(0);
  });

  it('should reject purchase when quantity is already 0', async () => {
    const adminToken = await getAdminToken();
    const userToken  = await getAuthToken();
    const vehicle    = await addVehicle(adminToken, 0);

    const res = await request(app)
      .post(`/api/vehicles/${vehicle.id}/purchase`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should never allow quantity to go below 0', async () => {
    const adminToken = await getAdminToken();
    const userToken  = await getAuthToken();
    const vehicle    = await addVehicle(adminToken, 1);

    // First purchase — succeeds
    await request(app)
      .post(`/api/vehicles/${vehicle.id}/purchase`)
      .set('Authorization', `Bearer ${userToken}`);

    // Second purchase — should fail (quantity is now 0)
    const res = await request(app)
      .post(`/api/vehicles/${vehicle.id}/purchase`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(400);

    // Confirm DB has 0, not -1
    const row = await new Promise((resolve, reject) => {
      db.get('SELECT quantity FROM vehicles WHERE id = ?', [vehicle.id], (err, r) => (err ? reject(err) : resolve(r)));
    });
    expect(row.quantity).toBe(0);
  });

  it('should handle multiple independent purchases correctly', async () => {
    const adminToken = await getAdminToken();
    const userToken  = await getAuthToken();
    const vehicle    = await addVehicle(adminToken, 5);

    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .post(`/api/vehicles/${vehicle.id}/purchase`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(200);
    }

    const row = await new Promise((resolve, reject) => {
      db.get('SELECT quantity FROM vehicles WHERE id = ?', [vehicle.id], (err, r) => (err ? reject(err) : resolve(r)));
    });
    expect(row.quantity).toBe(2);
  });

});
