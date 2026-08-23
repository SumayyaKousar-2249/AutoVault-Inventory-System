'use strict';

const request = require('supertest');
const app = require('../app');
const { db, initialize } = require('../config/database');

// ── helpers ──────────────────────────────────────────────────────────────────

/** Register + login a user, return the Bearer token. */
async function getAuthToken(email = 'driver@example.com', password = 'pass1234') {
  await request(app)
    .post('/api/auth/register')
    .send({ name: 'Driver', email, password });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  return res.body.token;
}

const VALID_VEHICLE = {
  make: 'Toyota',
  model: 'Camry',
  category: 'Sedan',
  price: 25000,
  quantity: 5,
};

// ── lifecycle ────────────────────────────────────────────────────────────────

beforeAll(async () => {
  await initialize();
});

beforeEach((done) => {
  db.serialize(() => {
    db.run('DELETE FROM vehicles', () => {
      db.run('DELETE FROM users', done);
    });
  });
});

afterAll((done) => {
  db.close(done);
});

// ── POST /api/vehicles ────────────────────────────────────────────────────────

describe('POST /api/vehicles', () => {

  // 1. Authenticated user can add a vehicle
  it('should allow an authenticated user to add a vehicle and return 201', async () => {
    const token = await getAuthToken();

    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send(VALID_VEHICLE);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('vehicle');
    expect(res.body.vehicle).toHaveProperty('id');
    expect(res.body.vehicle.make).toBe('Toyota');
    expect(res.body.vehicle.model).toBe('Camry');
    expect(res.body.vehicle.category).toBe('Sedan');
    expect(res.body.vehicle.price).toBe(25000);
    expect(res.body.vehicle.quantity).toBe(5);
  });

  // 2. Unauthenticated user is rejected
  it('should return 401 when no Authorization token is provided', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .send(VALID_VEHICLE);

    expect(res.statusCode).toBe(401);
  });

  // 3. Invalid / tampered token is rejected
  it('should return 401 for an invalid token', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', 'Bearer bad.token.here')
      .send(VALID_VEHICLE);

    expect(res.statusCode).toBe(401);
  });

  // 4a. Missing make → 400
  it('should return 400 when make is missing', async () => {
    const token = await getAuthToken();
    const { make, ...body } = VALID_VEHICLE;

    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // 4b. Missing model → 400
  it('should return 400 when model is missing', async () => {
    const token = await getAuthToken();
    const { model, ...body } = VALID_VEHICLE;

    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // 4c. Missing category → 400
  it('should return 400 when category is missing', async () => {
    const token = await getAuthToken();
    const { category, ...body } = VALID_VEHICLE;

    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // 4d. Missing price → 400
  it('should return 400 when price is missing', async () => {
    const token = await getAuthToken();
    const { price, ...body } = VALID_VEHICLE;

    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // 4e. Missing quantity → 400
  it('should return 400 when quantity is missing', async () => {
    const token = await getAuthToken();
    const { quantity, ...body } = VALID_VEHICLE;

    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // 4f. Price must be a positive number
  it('should return 400 when price is zero or negative', async () => {
    const token = await getAuthToken();

    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...VALID_VEHICLE, price: -500 });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // 4g. Quantity must be a non-negative integer
  it('should return 400 when quantity is negative', async () => {
    const token = await getAuthToken();

    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...VALID_VEHICLE, quantity: -1 });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // 5. Vehicle is persisted in SQLite
  it('should persist the vehicle in the database', async () => {
    const token = await getAuthToken();

    await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send(VALID_VEHICLE);

    const row = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM vehicles WHERE make = ? AND model = ?',
        ['Toyota', 'Camry'],
        (err, r) => (err ? reject(err) : resolve(r))
      );
    });

    expect(row).toBeDefined();
    expect(row.make).toBe('Toyota');
    expect(row.category).toBe('Sedan');
    expect(row.price).toBe(25000);
    expect(row.quantity).toBe(5);
  });

});

// ── GET /api/vehicles ─────────────────────────────────────────────────────────

describe('GET /api/vehicles', () => {

  // 6. Unauthenticated request is rejected
  it('should return 401 when no token is provided', async () => {
    const res = await request(app).get('/api/vehicles');
    expect(res.statusCode).toBe(401);
  });

  // 7. Authenticated user can view vehicles
  it('should return 200 and an array of vehicles for an authenticated user', async () => {
    const token = await getAuthToken();

    await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send(VALID_VEHICLE);

    const res = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('vehicles');
    expect(Array.isArray(res.body.vehicles)).toBe(true);
    expect(res.body.vehicles.length).toBe(1);
  });

  // 8. Response contains all required fields
  it('should return vehicles with id, make, model, category, price, and quantity', async () => {
    const token = await getAuthToken();

    await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send(VALID_VEHICLE);

    const res = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${token}`);

    const vehicle = res.body.vehicles[0];
    expect(vehicle).toHaveProperty('id');
    expect(vehicle).toHaveProperty('make');
    expect(vehicle).toHaveProperty('model');
    expect(vehicle).toHaveProperty('category');
    expect(vehicle).toHaveProperty('price');
    expect(vehicle).toHaveProperty('quantity');
  });

  // 9. Empty inventory returns empty array
  it('should return an empty array when no vehicles exist', async () => {
    const token = await getAuthToken();

    const res = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.vehicles).toEqual([]);
  });

  // 10. Multiple vehicles can exist independently
  it('should return all vehicles when multiple have been added', async () => {
    const token = await getAuthToken();

    await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send({ make: 'Toyota', model: 'Camry',   category: 'Sedan',  price: 25000, quantity: 3 });

    await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send({ make: 'Honda',  model: 'Civic',   category: 'Sedan',  price: 22000, quantity: 7 });

    await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send({ make: 'Ford',   model: 'F-150',   category: 'Truck',  price: 40000, quantity: 2 });

    const res = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.vehicles.length).toBe(3);

    const makes = res.body.vehicles.map((v) => v.make);
    expect(makes).toContain('Toyota');
    expect(makes).toContain('Honda');
    expect(makes).toContain('Ford');
  });

  // 11. Two different authenticated users see the same shared inventory
  it('should return the same vehicles regardless of which authenticated user queries', async () => {
    const tokenA = await getAuthToken('alice@example.com', 'alicePass1');
    const tokenB = await getAuthToken('bob@example.com',   'bobPass99');

    await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(VALID_VEHICLE);

    const resB = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(resB.statusCode).toBe(200);
    expect(resB.body.vehicles.length).toBe(1);
    expect(resB.body.vehicles[0].make).toBe('Toyota');
  });

});
