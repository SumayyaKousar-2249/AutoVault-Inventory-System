import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiLogin, apiRegister, setToken, getToken } from '../services/api.js';

const AuthContext = createContext(null);

const SESSION_KEY = 'av_session';

// ── Session persistence helpers ───────────────────────────────────────────────

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveSession(user) {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else      localStorage.removeItem(SESSION_KEY);
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  // user shape: { id, name, email, role }  — populated from backend login response
  const [user, setUser] = useState(loadSession);

  // On first render: if there is a stored session but the token has been
  // cleared externally, wipe the session so protected routes redirect to login.
  useEffect(() => {
    if (user && !getToken()) {
      setUser(null);
      saveSession(null);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Register a new USER account via the backend.
   * Does NOT log the user in.
   *
   * selectedRole is 'USER' only from the UI — the backend always creates USER.
   * Returns { error: string | null }.
   */
  async function register({ name, email, password }) {
    const { data, error } = await apiRegister(name, email, password);
    if (error) return { error };
    // data.user is returned but we don't auto-login — user must sign in manually
    return { error: null, user: data.user };
  }

  /**
   * Log in via the backend.
   * selectedRole: 'USER' | 'ADMIN' — used only to validate the role returned
   * by the server so a USER account cannot pass the ADMIN role-gate.
   *
   * Returns { error: string | null }.
   */
  async function login({ email, password, selectedRole }) {
    const { data, error } = await apiLogin(email, password);

    if (error) {
      // Backend returns "Invalid email or password." for both bad email and bad password
      return { error };
    }

    // Role-gate: backend may return a different role than what was selected
    if (data.user.role !== selectedRole) {
      return {
        error: `These credentials are not registered for the ${selectedRole} role.`,
      };
    }

    // Persist JWT and session
    setToken(data.token);
    const sessionUser = {
      id:    data.user.id,
      name:  data.user.name,
      email: data.user.email,
      role:  data.user.role,
    };
    setUser(sessionUser);
    saveSession(sessionUser);
    return { error: null };
  }

  function logout() {
    setToken(null);
    setUser(null);
    saveSession(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
