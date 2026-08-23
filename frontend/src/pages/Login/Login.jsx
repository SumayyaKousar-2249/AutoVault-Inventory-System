import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Eye, EyeOff, AlertCircle, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [selectedRole, setSelectedRole] = useState('USER');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPw, setShowPw]             = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);

  // ── Field-level validation ──────────────────────────────────────────────────
  function validate() {
    if (!email.trim())
      return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return 'Enter a valid email address.';
    if (!password)
      return 'Password is required.';
    if (password.length < 6)
      return 'Password must be at least 6 characters.';
    return null;
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const fieldError = validate();
    if (fieldError) { setError(fieldError); return; }

    setLoading(true);
    const { error: authError } = await login({ email, password, selectedRole });
    setLoading(false);
    if (authError) { setError(authError); return; }

    navigate(selectedRole === 'ADMIN' ? '/dashboard/admin' : '/dashboard/user');
  }

  // ── Role selector ───────────────────────────────────────────────────────────
  function selectRole(role) {
    setSelectedRole(role);
    setError(''); // clear errors when switching role
    // Intentionally does NOT log in or navigate
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-blue-600 w-14 h-14 rounded-2xl shadow-lg mb-3">
            <Car size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            Auto<span className="text-blue-600">Vault</span>
          </h1>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
          <h2 className="text-lg font-bold text-gray-800 mb-5">Welcome back</h2>

          {/* ── Role selector ── */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Login as
            </p>
            <div className="grid grid-cols-2 gap-3">
              <RoleButton
                label="User"
                icon={<User size={16} />}
                active={selectedRole === 'USER'}
                onClick={() => selectRole('USER')}
                activeClass="border-blue-500 bg-blue-50 text-blue-700"
              />
              <RoleButton
                label="Admin"
                icon={<ShieldCheck size={16} />}
                active={selectedRole === 'ADMIN'}
                onClick={() => selectRole('ADMIN')}
                activeClass="border-indigo-500 bg-indigo-50 text-indigo-700"
              />
            </div>
          </div>

          {/* ── Error banner ── */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-100 rounded-xl px-4 py-3 mb-5 text-sm">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all mt-2 shadow-sm text-white active:scale-[.98] disabled:opacity-60 disabled:cursor-not-allowed ${
                selectedRole === 'ADMIN'
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Signing in…' : `Sign In as ${selectedRole === 'ADMIN' ? 'Admin' : 'User'}`}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-blue-600 font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>

        {/* Demo hint — no passwords shown */}
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-500 space-y-1">
          <p className="font-semibold text-gray-600">Demo accounts</p>
          <p>Admin — <span className="font-mono">admin@autovault.com</span> / <span className="font-mono">Admin@123</span></p>
          <p>Register a new USER account or use any account you&apos;ve already created.</p>
        </div>
      </div>
    </div>
  );
}

// ── Role button sub-component ─────────────────────────────────────────────────
function RoleButton({ label, icon, active, onClick, activeClass }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
        active
          ? activeClass
          : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
