/**
 * Thin API client for the AutoVault backend (http://localhost:5000).
 *
 * Every function reads the JWT from localStorage key "av_token" and
 * attaches it as an Authorization: Bearer header automatically.
 *
 * All functions return { data, error } — callers never need a try/catch.
 *   data  — parsed JSON body on success
 *   error — human-readable string on failure (HTTP or network)
 */

const BASE = 'http://localhost:5000';
const TOKEN_KEY = 'av_token';

// ── Token helpers ─────────────────────────────────────────────────────────────

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || null;
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else        localStorage.removeItem(TOKEN_KEY);
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────

async function request(method, path, body = undefined) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    return { data: null, error: 'Cannot reach the server. Is the backend running?' };
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    return { data: null, error: data.error || `Request failed (${response.status})` };
  }

  return { data, error: null };
}

// ── Auth API ──────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * body: { name, email, password }
 * Returns: { data: { user }, error }
 */
export function apiRegister(name, email, password) {
  return request('POST', '/api/auth/register', { name, email, password });
}

/**
 * POST /api/auth/login
 * body: { email, password }
 * Returns: { data: { token, user: { id, name, email, role } }, error }
 */
export function apiLogin(email, password) {
  return request('POST', '/api/auth/login', { email, password });
}

// ── Vehicle API ───────────────────────────────────────────────────────────────

/**
 * GET /api/vehicles
 * Returns: { data: { vehicles: [] }, error }
 */
export function apiGetVehicles() {
  return request('GET', '/api/vehicles');
}

/**
 * GET /api/vehicles/search?make=&model=&category=&minPrice=&maxPrice=
 * All params optional — only truthy values are appended.
 * Returns: { data: { vehicles: [] }, error }
 */
export function apiSearchVehicles({ make, model, category, minPrice, maxPrice } = {}) {
  const params = new URLSearchParams();
  if (make)     params.set('make',     make);
  if (model)    params.set('model',    model);
  if (category && category !== 'All') params.set('category', category);
  if (minPrice) params.set('minPrice', minPrice);
  if (maxPrice) params.set('maxPrice', maxPrice);
  const qs = params.toString();
  return request('GET', `/api/vehicles/search${qs ? '?' + qs : ''}`);
}

/**
 * POST /api/vehicles
 * body: { make, model, category, price, quantity }
 * Returns: { data: { vehicle }, error }
 */
export function apiAddVehicle(fields) {
  return request('POST', '/api/vehicles', fields);
}

/**
 * PUT /api/vehicles/:id
 * body: { make, model, category, price, quantity }
 * Returns: { data: { vehicle }, error }
 */
export function apiUpdateVehicle(id, fields) {
  return request('PUT', `/api/vehicles/${id}`, fields);
}

/**
 * DELETE /api/vehicles/:id
 * Returns: { data: { message }, error }
 */
export function apiDeleteVehicle(id) {
  return request('DELETE', `/api/vehicles/${id}`);
}

/**
 * POST /api/vehicles/:id/purchase
 * Returns: { data: { vehicle }, error }
 */
export function apiPurchaseVehicle(id) {
  return request('POST', `/api/vehicles/${id}/purchase`);
}

/**
 * POST /api/vehicles/:id/restock  (ADMIN only)
 * body: { quantity }
 * Returns: { data: { vehicle }, error }
 */
export function apiRestockVehicle(id, quantity) {
  return request('POST', `/api/vehicles/${id}/restock`, { quantity });
}
