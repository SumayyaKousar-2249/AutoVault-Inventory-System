'use strict';

const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../app');
const { db, initialize } = require('../config/database');

// ── helpers ──────────────────────────────────────────────────────────────────

/** Register a normal USER and return their token. */
async function getUserToken() {
  await request(app)
    .post('/api/auth/register')
    .send({ name: 'Regular User', email: 'user@example.com', password: 'pass1234' });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'user@example.com', password: 'pass1234' });
  return res.body.token;
}

/** Insert an ADMIN user directly and return their token. */
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

/** Add a vehicle using any valid token. */
async function addVehicle(token) {
  const res = await request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${token}`)
    .send({ make: 'Toyota', model: 'Camry', category: 'Sedan', price: 25000, quantity: 5 });
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

// ── DELETE /api/vehicles/:id ──────────────────────────────────────────────────

describe('DELETE /api/vehicles/:id', () => {

  // Auth checks
  it('should return 401 when no token is provided', async () => {
    const res = await request(app).delete('/api/vehicles/1');
    expect(res.statusCode).toBe(401);
  });

  it('should return 403 when a USER (non-admin) tries to delete a vehicle', async () => {
    const userToken  = await getUserToken();
    const adminToken = await getAdminToken();
    const vehicle    = await addVehicle(adminToken);

    const res = await request(app)
      .delete(`/api/vehicles/${vehicle.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty('error');
  });

  // Not found
  it('should return 404 when the vehicle does not exist', async () => {
    const token = await getAdminToken();

    const res = await request(app)
      .delete('/api/vehicles/99999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  // ADMIN success
  it('should allow an ADMIN to delete an existing vehicle and return 200', async () => {
    const token   = await getAdminToken();
    const vehicle = await addVehicle(token);

    const res = await request(app)
      .delete(`/api/vehicles/${vehicle.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  it('should remove the vehicle from the database', async () => {
    const token   = await getAdminToken();
    const vehicle = await addVehicle(token);

    await request(app)
      .delete(`/api/vehicles/${vehicle.id}`)
      .set('Authorization', `Bearer ${token}`);

    const row = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM vehicles WHERE id = ?', [vehicle.id], (err, r) => (err ? reject(err) : resolve(r)));
    });

    expect(row).toBeUndefined();
  });

  it('should return 404 when attempting to delete an already-deleted vehicle', async () => {
    const token   = await getAdminToken();
    const vehicle = await addVehicle(token);

    await request(app)
      .delete(`/api/vehicles/${vehicle.id}`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .delete(`/api/vehicles/${vehicle.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
  });

});
