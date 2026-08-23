'use strict';

const request = require('supertest');
const app = require('../app');
const { db, initialize } = require('../config/database');

// ── helpers ──────────────────────────────────────────────────────────────────

/** Register a user and return the response body. */
async function registerUser(name, email, password) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password });
  return res;
}

// ── lifecycle ────────────────────────────────────────────────────────────────

beforeAll(async () => {
  await initialize();
});

beforeEach((done) => {
  db.run('DELETE FROM users', done);
});

afterAll((done) => {
  db.close(done);
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {

  // 1. Successful login returns 200 + JWT
  it('should return 200 and a JWT token for valid credentials', async () => {
    await registerUser('Alice', 'alice@example.com', 'password123');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'password123' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(0);
  });

  // 2. JWT payload contains id, email, role — never password
  it('should return a JWT whose payload contains id, email, and role', async () => {
    await registerUser('Alice', 'alice@example.com', 'password123');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'password123' });

    expect(res.statusCode).toBe(200);

    // Decode payload (middle segment of JWT) — no signature verification needed here
    const payload = JSON.parse(
      Buffer.from(res.body.token.split('.')[1], 'base64url').toString('utf8')
    );
    expect(payload).toHaveProperty('id');
    expect(payload.email).toBe('alice@example.com');
    expect(payload.role).toBe('USER');
  });

  // 3. Password / hash must never appear in the response
  it('should never return password or passwordHash in the response', async () => {
    await registerUser('Alice', 'alice@example.com', 'password123');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'password123' });

    expect(res.statusCode).toBe(200);
    expect(res.body).not.toHaveProperty('password');
    expect(res.body).not.toHaveProperty('passwordHash');
    if (res.body.user) {
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.user).not.toHaveProperty('passwordHash');
    }
  });

  // 4. Login with unregistered email → 401
  it('should return 401 for an email that does not exist', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@example.com', password: 'password123' });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  // 5. Correct email, wrong password → 401
  it('should return 401 for a correct email but wrong password', async () => {
    await registerUser('Alice', 'alice@example.com', 'password123');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'wrongpassword' });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  // 6a. Missing email → 400
  it('should return 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'password123' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // 6b. Missing password → 400
  it('should return 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // 6c. Empty body → 400
  it('should return 400 when body is empty', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // 7. Multiple users can each log in independently
  it('should allow multiple users with different emails to log in independently', async () => {
    await registerUser('Alice', 'alice@example.com', 'alicePass1');
    await registerUser('Bob',   'bob@example.com',   'bobPass99');

    const resAlice = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'alicePass1' });

    const resBob = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob@example.com', password: 'bobPass99' });

    expect(resAlice.statusCode).toBe(200);
    expect(resAlice.body).toHaveProperty('token');

    expect(resBob.statusCode).toBe(200);
    expect(resBob.body).toHaveProperty('token');

    // Tokens must be different
    expect(resAlice.body.token).not.toBe(resBob.body.token);
  });

  // 8. User A's password does not work for User B's account
  it('should reject login when the right password is used with the wrong email', async () => {
    await registerUser('Alice', 'alice@example.com', 'sharedSecret');
    await registerUser('Bob',   'bob@example.com',   'differentSecret');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob@example.com', password: 'sharedSecret' });

    expect(res.statusCode).toBe(401);
  });

});

// ── JWT auth middleware ───────────────────────────────────────────────────────

describe('JWT auth middleware (GET /api/auth/me)', () => {

  // 9. Valid token → 200 with user info
  it('should return 200 and user info for a valid Bearer token', async () => {
    await registerUser('Carol', 'carol@example.com', 'carol123');

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'carol@example.com', password: 'carol123' });

    const { token } = loginRes.body;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.statusCode).toBe(200);
    expect(meRes.body).toHaveProperty('user');
    expect(meRes.body.user.email).toBe('carol@example.com');
    expect(meRes.body.user).not.toHaveProperty('password');
  });

  // 10. No token → 401
  it('should return 401 when no Authorization header is provided', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  // 11. Malformed / invalid token → 401
  it('should return 401 for an invalid or tampered token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer this.is.invalid');

    expect(res.statusCode).toBe(401);
  });

});
