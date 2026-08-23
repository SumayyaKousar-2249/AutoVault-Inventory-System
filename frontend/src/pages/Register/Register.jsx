import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form, setForm]           = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw]       = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [fieldErrors, setFErrors] = useState({});
  const [formError, setFormError] = useState(''); // top-level error (e.g. duplicate email)
  const [success, setSuccess]     = useState(false);
  const [loading, setLoading]     = useState(false);

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
    setFErrors((e) => ({ ...e, [key]: undefined }));
    setFormError('');
  }

  // ── Validation ──────────────────────────────────────────────────────────────
  function validate() {
    const errs = {};
    if (!form.name.trim())
      errs.name = 'Full name is required.';
    if (!form.email.trim())
      errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      errs.email = 'Enter a valid email address.';
    if (!form.password)
      errs.password = 'Password is required.';
    else if (form.password.length < 6)
      errs.password = 'Password must be at least 6 characters.';
    if (!form.confirm)
      errs.confirm = 'Please confirm your password.';
    else if (form.confirm !== form.password)
      errs.confirm = 'Passwords do not match.';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    const errs = validate();
    if (Object.keys(errs).length) { setFErrors(errs); return; }

    setLoading(true);
    const { error: authError } = await register({
      name:     form.name.trim(),
      email:    form.email.trim().toLowerCase(),
      password: form.password,
    });
    setLoading(false);

    if (authError) {
      setFormError(authError);
      return;
    }

    // Success — show confirmation then redirect to login (do NOT auto-login)
    setSuccess(true);
    setTimeout(() => navigate('/login'), 2000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-blue-600 w-14 h-14 rounded-2xl shadow-lg mb-3">
            <Car size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            Auto<span className="text-blue-600">Vault</span>
          </h1>
          <p className="text-gray-500 mt-1">Create your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
          {success ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center py-6 gap-3 text-center">
              <CheckCircle size={52} className="text-green-500" />
              <p className="text-green-700 font-bold text-lg">Account created!</p>
              <p className="text-gray-500 text-sm">
                Redirecting to login — sign in with your new credentials.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-gray-800 mb-5">Join AutoVault</h2>

              {/* Top-level error (e.g. duplicate email) */}
              {formError && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-100 rounded-xl px-4 py-3 mb-5 text-sm">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {/* Name */}
                <Field label="Full Name" error={fieldErrors.name}>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="Jane Smith"
                    className={inputCls(fieldErrors.name)}
                  />
                </Field>

                {/* Email */}
                <Field label="Email" error={fieldErrors.email}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="you@example.com"
                    className={inputCls(fieldErrors.email)}
                  />
                </Field>

                {/* Password */}
                <Field label="Password" error={fieldErrors.password}>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => set('password', e.target.value)}
                      placeholder="Min. 6 characters"
                      className={inputCls(fieldErrors.password) + ' pr-11'}
                    />
                    <TogglePw show={showPw} onToggle={() => setShowPw((s) => !s)} />
                  </div>
                </Field>

                {/* Confirm Password */}
                <Field label="Confirm Password" error={fieldErrors.confirm}>
                  <div className="relative">
                    <input
                      type={showConf ? 'text' : 'password'}
                      value={form.confirm}
                      onChange={(e) => set('confirm', e.target.value)}
                      placeholder="Repeat password"
                      className={inputCls(fieldErrors.confirm) + ' pr-11'}
                    />
                    <TogglePw show={showConf} onToggle={() => setShowConf((s) => !s)} />
                  </div>
                </Field>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 active:scale-[.98] transition-all mt-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating account…' : 'Create Account'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-5">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          New accounts are registered as <strong>USER</strong> role by default.
        </p>
      </div>
    </div>
  );
}

// ── Small reusable helpers ─────────────────────────────────────────────────────

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-600 mt-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}

function inputCls(err) {
  return `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
    err ? 'border-red-300 bg-red-50' : 'border-gray-200'
  }`;
}

function TogglePw({ show, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      aria-label={show ? 'Hide password' : 'Show password'}
    >
      {show ? <EyeOff size={17} /> : <Eye size={17} />}
    </button>
  );
}
