'use strict';

const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../app');
const { db, initialize } = require('../config/database');

// ── helpers ──────────────────────────────────────────────────────────────────

async function getUserToken() {
  await request(app)
    .post('/api/auth/register')
    .send({ name: 'Regular User', email: 'user@example.com', password: 'pass1234' });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'user@example.com', password: 'pass1234' });
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

async function addVehicle(token, quantity = 2) {
  const res = await request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${token}`)
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

// ── POST /api/vehicles/:id/restock ────────────────────────────────────────────

describe('POST /api/vehicles/:id/restock', () => {

  // 1. No token → 401
  it('should return 401 when no token is provided', async () => {
    const res = await request(app).post('/api/vehicles/1/restock').send({ quantity: 5 });
    expect(res.statusCode).toBe(401);
  });

  // 2. USER role → 403
  it('should return 403 when a USER (non-admin) tries to restock', async () => {
    const userToken  = await getUserToken();
    const adminToken = await getAdminToken();
    const vehicle    = await addVehicle(adminToken);

    const res = await request(app)
      .post(`/api/vehicles/${vehicle.id}/restock`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ quantity: 5 });

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty('error');
  });

  // 3. Vehicle not found → 404
  it('should return 404 when the vehicle does not exist', async () => {
    const token = await getAdminToken();

    const res = await request(app)
      .post('/api/vehicles/99999/restock')
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 5 });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  // 4. ADMIN success — quantity increases
  it('should allow ADMIN to restock and return the updated vehicle with increased quantity', async () => {
    const token   = await getAdminToken();
    const vehicle = await addVehicle(token, 2);

    const res = await request(app)
      .post(`/api/vehicles/${vehicle.id}/restock`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 10 });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('vehicle');
    expect(res.body.vehicle.quantity).toBe(12); // 2 + 10
  });

  // 5. Persisted in DB
  it('should persist the restocked quantity in the database', async () => {
    const token   = await getAdminToken();
    const vehicle = await addVehicle(token, 3);

    await request(app)
      .post(`/api/vehicles/${vehicle.id}/restock`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 7 });

    const row = await new Promise((resolve, reject) => {
      db.get('SELECT quantity FROM vehicles WHERE id = ?', [vehicle.id], (err, r) => (err ? reject(err) : resolve(r)));
    });

    expect(row.quantity).toBe(10); // 3 + 7
  });

  // 6. Restock by exactly 1
  it('should allow restocking by quantity of 1', async () => {
    const token   = await getAdminToken();
    const vehicle = await addVehicle(token, 0);

    const res = await request(app)
      .post(`/api/vehicles/${vehicle.id}/restock`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 1 });

    expect(res.statusCode).toBe(200);
    expect(res.body.vehicle.quantity).toBe(1);
  });

  // 7. Zero quantity → 400
  it('should return 400 when restock quantity is zero', async () => {
    const token   = await getAdminToken();
    const vehicle = await addVehicle(token);

    const res = await request(app)
      .post(`/api/vehicles/${vehicle.id}/restock`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 0 });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // 8. Negative quantity → 400
  it('should return 400 when restock quantity is negative', async () => {
    const token   = await getAdminToken();
    const vehicle = await addVehicle(token);

    const res = await request(app)
      .post(`/api/vehicles/${vehicle.id}/restock`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: -5 });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // 9. Missing quantity → 400
  it('should return 400 when restock quantity is missing', async () => {
    const token   = await getAdminToken();
    const vehicle = await addVehicle(token);

    const res = await request(app)
      .post(`/api/vehicles/${vehicle.id}/restock`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // 10. Non-integer quantity → 400
  it('should return 400 when restock quantity is not an integer', async () => {
    const token   = await getAdminToken();
    const vehicle = await addVehicle(token);

    const res = await request(app)
      .post(`/api/vehicles/${vehicle.id}/restock`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 2.5 });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // 11. requireAdmin middleware — valid ADMIN token passes
  it('should confirm ADMIN token is accepted (not blocked by requireAdmin)', async () => {
    const token   = await getAdminToken();
    const vehicle = await addVehicle(token, 5);

    const res = await request(app)
      .post(`/api/vehicles/${vehicle.id}/restock`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 5 });

    expect(res.statusCode).toBe(200);
  });

});
