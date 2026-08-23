'use strict';

const request = require('supertest');
const app = require('../app');
const { db, initialize } = require('../config/database');
const { getUserToken, getAdminToken: _getAdminToken } = require('./helpers/auth');

// ── helpers ──────────────────────────────────────────────────────────────────

function getAuthToken() {
  return getUserToken(app, 'searcher@example.com', 'pass1234', 'Searcher');
}

function getAdminToken() {
  return _getAdminToken(app, db);
}

async function addVehicle(adminToken, data) {
  return request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(data);
}

// ── lifecycle ─────────────────────────────────────────────────────────────────

beforeAll(async () => { await initialize(); });

beforeEach((done) => {
  db.serialize(() => {
    db.run('DELETE FROM vehicles', () => db.run('DELETE FROM users', done));
  });
});

afterAll((done) => { db.close(done); });

// ── seed data ─────────────────────────────────────────────────────────────────

const VEHICLES = [
  { make: 'Toyota', model: 'Camry',   category: 'Sedan',  price: 25000, quantity: 5 },
  { make: 'Toyota', model: 'RAV4',    category: 'SUV',    price: 32000, quantity: 3 },
  { make: 'Honda',  model: 'Civic',   category: 'Sedan',  price: 22000, quantity: 7 },
  { make: 'Ford',   model: 'F-150',   category: 'Truck',  price: 40000, quantity: 2 },
  { make: 'BMW',    model: 'X5',      category: 'SUV',    price: 65000, quantity: 1 },
];

async function seedVehicles(adminToken) {
  for (const v of VEHICLES) {
    await addVehicle(adminToken, v);
  }
}

// ── GET /api/vehicles/search ──────────────────────────────────────────────────

describe('GET /api/vehicles/search', () => {

  it('should return 401 when no token is provided', async () => {
    const res = await request(app).get('/api/vehicles/search');
    expect(res.statusCode).toBe(401);
  });

  it('should return all vehicles when no filters are provided', async () => {
    const adminToken = await getAdminToken();
    const userToken  = await getAuthToken();
    await seedVehicles(adminToken);

    const res = await request(app)
      .get('/api/vehicles/search')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('vehicles');
    expect(res.body.vehicles.length).toBe(5);
  });

  it('should filter by make (case-insensitive)', async () => {
    const adminToken = await getAdminToken();
    const userToken  = await getAuthToken();
    await seedVehicles(adminToken);

    const res = await request(app)
      .get('/api/vehicles/search?make=toyota')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.vehicles.length).toBe(2);
    res.body.vehicles.forEach((v) => expect(v.make).toBe('Toyota'));
  });

  it('should filter by model (case-insensitive)', async () => {
    const adminToken = await getAdminToken();
    const userToken  = await getAuthToken();
    await seedVehicles(adminToken);

    const res = await request(app)
      .get('/api/vehicles/search?model=civic')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.vehicles.length).toBe(1);
    expect(res.body.vehicles[0].model).toBe('Civic');
  });

  it('should filter by category (case-insensitive)', async () => {
    const adminToken = await getAdminToken();
    const userToken  = await getAuthToken();
    await seedVehicles(adminToken);

    const res = await request(app)
      .get('/api/vehicles/search?category=SUV')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.vehicles.length).toBe(2);
    res.body.vehicles.forEach((v) => expect(v.category).toBe('SUV'));
  });

  it('should filter by minPrice', async () => {
    const adminToken = await getAdminToken();
    const userToken  = await getAuthToken();
    await seedVehicles(adminToken);

    const res = await request(app)
      .get('/api/vehicles/search?minPrice=40000')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.vehicles.length).toBe(2); // F-150 + BMW X5
    res.body.vehicles.forEach((v) => expect(v.price).toBeGreaterThanOrEqual(40000));
  });

  it('should filter by maxPrice', async () => {
    const adminToken = await getAdminToken();
    const userToken  = await getAuthToken();
    await seedVehicles(adminToken);

    const res = await request(app)
      .get('/api/vehicles/search?maxPrice=25000')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.vehicles.length).toBe(2); // Camry + Civic
    res.body.vehicles.forEach((v) => expect(v.price).toBeLessThanOrEqual(25000));
  });

  it('should filter by combined make + category', async () => {
    const adminToken = await getAdminToken();
    const userToken  = await getAuthToken();
    await seedVehicles(adminToken);

    const res = await request(app)
      .get('/api/vehicles/search?make=Toyota&category=SUV')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.vehicles.length).toBe(1);
    expect(res.body.vehicles[0].model).toBe('RAV4');
  });

  it('should filter by combined minPrice + maxPrice range', async () => {
    const adminToken = await getAdminToken();
    const userToken  = await getAuthToken();
    await seedVehicles(adminToken);

    const res = await request(app)
      .get('/api/vehicles/search?minPrice=22000&maxPrice=32000')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.vehicles.length).toBe(3); // Civic, Camry, RAV4
  });

  it('should return empty array when no vehicles match the filter', async () => {
    const adminToken = await getAdminToken();
    const userToken  = await getAuthToken();
    await seedVehicles(adminToken);

    const res = await request(app)
      .get('/api/vehicles/search?make=Ferrari')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.vehicles).toEqual([]);
  });

  it('should return empty array when inventory is empty', async () => {
    const token = await getAuthToken();

    const res = await request(app)
      .get('/api/vehicles/search')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.vehicles).toEqual([]);
  });

});
