'use strict';

const request = require('supertest');
const app = require('../app');
const { db, initialize } = require('../config/database');

// Ensure schema exists before any test runs
beforeAll(async () => {
  await initialize();
});

// Wipe the users table before each test for isolation
beforeEach((done) => {
  db.run('DELETE FROM users', done);
});

// Close the DB connection after all tests
afterAll((done) => {
  db.close(done);
});

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------

describe('POST /api/auth/register', () => {

  // 1. Successful registration
  it('should register a new user and return 201 with user data (no password)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice Smith', email: 'alice@example.com', password: 'secret123' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.name).toBe('Alice Smith');
    expect(res.body.user.email).toBe('alice@example.com');
    expect(res.body.user.role).toBe('USER');
    // Password must never be returned
    expect(res.body.user).not.toHaveProperty('password');
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  // 2a. Validation — missing name
  it('should return 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'bob@example.com', password: 'secret123' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // 2b. Validation — missing email
  it('should return 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bob', password: 'secret123' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // 2c. Validation — missing password
  it('should return 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bob', email: 'bob@example.com' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // 2d. Validation — invalid email format
  it('should return 400 for an invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bob', email: 'not-an-email', password: 'secret123' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // 2e. Validation — password too short (< 6 chars)
  it('should return 400 when password is too short', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bob', email: 'bob@example.com', password: '123' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // 3. Duplicate email rejection
  it('should return 409 when email is already registered', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'duplicate@example.com', password: 'secret123' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice 2', email: 'duplicate@example.com', password: 'secret456' });

    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  // 4. Password hashing — stored hash must differ from plain-text input
  it('should store a hashed password, not the plain-text password', async () => {
    const plainPassword = 'secret123';

    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Carol', email: 'carol@example.com', password: plainPassword });

    // Query the DB directly to inspect the stored value
    const row = await new Promise((resolve, reject) => {
      db.get('SELECT password FROM users WHERE email = ?', ['carol@example.com'], (err, r) => {
        if (err) reject(err);
        else resolve(r);
      });
    });

    expect(row).toBeDefined();
    expect(row.password).toBeDefined();
    expect(row.password).not.toBe(plainPassword);
    // bcrypt hashes start with $2b$
    expect(row.password).toMatch(/^\$2[ab]\$/);
  });

  // 5. User persistence — user must actually exist in SQLite after registration
  it('should persist the user in the database', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Dave', email: 'dave@example.com', password: 'secret123' });

    const row = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', ['dave@example.com'], (err, r) => {
        if (err) reject(err);
        else resolve(r);
      });
    });

    expect(row).toBeDefined();
    expect(row.name).toBe('Dave');
    expect(row.email).toBe('dave@example.com');
    expect(row.role).toBe('USER');
  });

});
