'use strict';

const request = require('supertest');
const app = require('../app');
const { db, initialize } = require('../config/database');
const { getUserToken, getAdminToken: _getAdminToken } = require('./helpers/auth');

// ── helpers ──────────────────────────────────────────────────────────────────

function getAuthToken() {
  return getUserToken(app, 'updater@example.com', 'pass1234', 'Updater');
}

function getAdminToken() {
  return _getAdminToken(app, db);
}

async function addVehicle(adminToken) {
  const res = await request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${adminToken}`)
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

// ── PUT /api/vehicles/:id ─────────────────────────────────────────────────────

describe('PUT /api/vehicles/:id', () => {

  it('should return 401 when no token is provided', async () => {
    const res = await request(app).put('/api/vehicles/1').send({ make: 'Honda' });
    expect(res.statusCode).toBe(401);
  });

  it('should return 404 when the vehicle does not exist', async () => {
    const token = await getAdminToken();

    const res = await request(app)
      .put('/api/vehicles/99999')
      .set('Authorization', `Bearer ${token}`)
      .send({ make: 'Honda', model: 'Civic', category: 'Sedan', price: 22000, quantity: 3 });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('should update all fields and return the updated vehicle', async () => {
    const token   = await getAdminToken();
    const vehicle = await addVehicle(token);

    const res = await request(app)
      .put(`/api/vehicles/${vehicle.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ make: 'Honda', model: 'Accord', category: 'Sedan', price: 28000, quantity: 4 });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('vehicle');
    expect(res.body.vehicle.make).toBe('Honda');
    expect(res.body.vehicle.model).toBe('Accord');
    expect(res.body.vehicle.price).toBe(28000);
    expect(res.body.vehicle.quantity).toBe(4);
  });

  it('should persist the update in the database', async () => {
    const token   = await getAdminToken();
    const vehicle = await addVehicle(token);

    await request(app)
      .put(`/api/vehicles/${vehicle.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ make: 'Honda', model: 'Accord', category: 'Sedan', price: 28000, quantity: 4 });

    const row = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM vehicles WHERE id = ?', [vehicle.id], (err, r) => (err ? reject(err) : resolve(r)));
    });

    expect(row.make).toBe('Honda');
    expect(row.model).toBe('Accord');
    expect(row.price).toBe(28000);
    expect(row.quantity).toBe(4);
  });

  it('should return 400 when price is invalid', async () => {
    const token   = await getAdminToken();
    const vehicle = await addVehicle(token);

    const res = await request(app)
      .put(`/api/vehicles/${vehicle.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ make: 'Honda', model: 'Accord', category: 'Sedan', price: -100, quantity: 4 });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 when quantity is invalid', async () => {
    const token   = await getAdminToken();
    const vehicle = await addVehicle(token);

    const res = await request(app)
      .put(`/api/vehicles/${vehicle.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ make: 'Honda', model: 'Accord', category: 'Sedan', price: 28000, quantity: -5 });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 when required fields are missing', async () => {
    const token   = await getAdminToken();
    const vehicle = await addVehicle(token);

    const res = await request(app)
      .put(`/api/vehicles/${vehicle.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ model: 'Accord', category: 'Sedan', price: 28000, quantity: 4 }); // missing make

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

});
