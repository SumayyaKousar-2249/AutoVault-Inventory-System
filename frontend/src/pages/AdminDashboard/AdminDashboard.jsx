import React, { useState, useEffect, useCallback } from 'react';
import AdminNavbar from '../../components/Navbar/AdminNavbar.jsx';
import SearchFilter from '../../components/SearchFilter/SearchFilter.jsx';
import Modal from '../../components/Modal/Modal.jsx';
import {
  apiGetVehicles,
  apiAddVehicle,
  apiUpdateVehicle,
  apiDeleteVehicle,
  apiRestockVehicle,
} from '../../services/api.js';
import {
  Plus, Pencil, Trash2, Package, ShieldCheck,
  Car, AlertTriangle, CheckCircle, RotateCcw, Loader, AlertCircle,
} from 'lucide-react';

const BLANK = { make: '', model: '', category: 'Sedan', price: '', quantity: '' };

function applyFilters(vehicles, { query, category, minPrice, maxPrice }) {
  return vehicles.filter((v) => {
    const q = query.toLowerCase();
    if (q && !v.make.toLowerCase().includes(q) && !v.model.toLowerCase().includes(q)) return false;
    if (category && category !== 'All' && v.category !== category) return false;
    if (minPrice && v.price < Number(minPrice)) return false;
    if (maxPrice && v.price > Number(maxPrice)) return false;
    return true;
  });
}

export default function AdminDashboard() {
  const [vehicles, setVehicles]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [fetchErr, setFetchErr]   = useState('');
  const [filters, setFilters]     = useState({ query: '', category: 'All', minPrice: '', maxPrice: '' });

  // Modals
  const [addOpen, setAddOpen]               = useState(false);
  const [editTarget, setEditTarget]         = useState(null);
  const [deleteTarget, setDeleteTarget]     = useState(null);
  const [restockTarget, setRestockTarget]   = useState(null);

  const [toast, setToast] = useState(null);
  const displayed = applyFilters(vehicles, filters);
  const totalStock = vehicles.reduce((s, v) => s + v.quantity, 0);
  const outOfStock = vehicles.filter((v) => v.quantity === 0).length;

  // ── Load inventory ────────────────────────────────────────────────────────
  const loadVehicles = useCallback(async () => {
    setLoading(true);
    setFetchErr('');
    const { data, error } = await apiGetVehicles();
    if (error) setFetchErr(error);
    else setVehicles(data.vehicles || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadVehicles(); }, [loadVehicles]);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  // ── ADD ───────────────────────────────────────────────────────────────────
  async function handleAdd(fields, setSubmitError) {
    const { data, error } = await apiAddVehicle(fields);
    if (error) { setSubmitError(error); return; }
    setVehicles((prev) => [data.vehicle, ...prev]);
    setAddOpen(false);
    showToast(`${data.vehicle.make} ${data.vehicle.model} added to inventory.`);
  }

  // ── EDIT ──────────────────────────────────────────────────────────────────
  async function handleEdit(fields, setSubmitError) {
    const { data, error } = await apiUpdateVehicle(editTarget.id, fields);
    if (error) { setSubmitError(error); return; }
    setVehicles((prev) => prev.map((v) => (v.id === editTarget.id ? data.vehicle : v)));
    setEditTarget(null);
    showToast(`${data.vehicle.make} ${data.vehicle.model} updated.`);
  }

  // ── DELETE ────────────────────────────────────────────────────────────────
  async function handleDelete() {
    const target = deleteTarget;
    setDeleteTarget(null);
    const { error } = await apiDeleteVehicle(target.id);
    if (error) { showToast(error, 'error'); return; }
    setVehicles((prev) => prev.filter((v) => v.id !== target.id));
    showToast(`${target.make} ${target.model} removed.`, 'error');
  }

  // ── RESTOCK ───────────────────────────────────────────────────────────────
  async function handleRestock(amount, setSubmitError) {
    const target = restockTarget;
    const { data, error } = await apiRestockVehicle(target.id, amount);
    if (error) { setSubmitError(error); return; }
    setVehicles((prev) => prev.map((v) => (v.id === target.id ? data.vehicle : v)));
    setRestockTarget(null);
    showToast(`${target.make} ${target.model} restocked by ${amount}. New stock: ${data.vehicle.quantity}`);
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <AdminNavbar />

      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600/20 p-2.5 rounded-xl">
              <ShieldCheck size={22} className="text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Inventory Management</h1>
              {!loading && !fetchErr && (
                <p className="text-gray-400 text-sm">
                  {vehicles.length} vehicles · {totalStock} units · {outOfStock} out of stock
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus size={16} /> Add Vehicle
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="lg:grid lg:grid-cols-[280px_1fr] gap-6">
          <aside className="mb-6 lg:mb-0">
            <SearchFilter onFilter={setFilters} />
          </aside>

          <section>
            {loading && <AdminLoadingState />}

            {!loading && fetchErr && (
              <AdminErrorState message={fetchErr} onRetry={loadVehicles} />
            )}

            {!loading && !fetchErr && (
              <>
                <p className="text-sm text-gray-400 mb-4">
                  Showing <span className="font-semibold text-white">{displayed.length}</span>{' '}
                  vehicle{displayed.length !== 1 ? 's' : ''}
                </p>

                {displayed.length === 0 ? (
                  <AdminEmptyState />
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-gray-800">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                          <th className="px-4 py-3 text-left">ID</th>
                          <th className="px-4 py-3 text-left">Vehicle</th>
                          <th className="px-4 py-3 text-left">Category</th>
                          <th className="px-4 py-3 text-right">Price</th>
                          <th className="px-4 py-3 text-center">Stock</th>
                          <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {displayed.map((v) => (
                          <AdminRow
                            key={v.id}
                            vehicle={v}
                            onEdit={() => setEditTarget(v)}
                            onDelete={() => setDeleteTarget(v)}
                            onRestock={() => setRestockTarget(v)}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      {/* ADD MODAL */}
      {addOpen && (
        <Modal title="Add New Vehicle" onClose={() => setAddOpen(false)}>
          <VehicleForm initial={BLANK} onSubmit={handleAdd} submitLabel="Add Vehicle" />
        </Modal>
      )}

      {/* EDIT MODAL */}
      {editTarget && (
        <Modal title="Edit Vehicle" onClose={() => setEditTarget(null)}>
          <VehicleForm initial={editTarget} onSubmit={handleEdit} submitLabel="Save Changes" />
        </Modal>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteTarget && (
        <Modal title="Confirm Delete" onClose={() => setDeleteTarget(null)} maxWidth="max-w-sm">
          <div className="text-center">
            <div className="bg-red-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} className="text-red-500" />
            </div>
            <p className="text-gray-800 font-semibold mb-1">Delete this vehicle?</p>
            <p className="text-gray-500 text-sm mb-6">
              <strong>{deleteTarget.make} {deleteTarget.model}</strong> will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* RESTOCK MODAL */}
      {restockTarget && (
        <Modal title="Restock Vehicle" onClose={() => setRestockTarget(null)} maxWidth="max-w-sm">
          <RestockForm vehicle={restockTarget} onSubmit={handleRestock} />
        </Modal>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 text-white ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          <CheckCircle size={18} />
          <span className="font-medium text-sm">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}

// ── Admin table row ───────────────────────────────────────────────────────────
function AdminRow({ vehicle: v, onEdit, onDelete, onRestock }) {
  return (
    <tr className="bg-gray-900 hover:bg-gray-800/60 transition-colors">
      <td className="px-4 py-3 text-gray-500 text-xs">#{v.id}</td>
      <td className="px-4 py-3">
        <p className="font-semibold text-white">{v.make} {v.model}</p>
      </td>
      <td className="px-4 py-3">
        <span className="bg-indigo-900/50 text-indigo-300 text-xs px-2 py-0.5 rounded-full">
          {v.category}
        </span>
      </td>
      <td className="px-4 py-3 text-right text-gray-300 font-medium">
        ${v.price.toLocaleString()}
      </td>
      <td className="px-4 py-3 text-center">
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
          v.quantity === 0
            ? 'bg-red-900/50 text-red-400'
            : v.quantity <= 2
            ? 'bg-yellow-900/50 text-yellow-400'
            : 'bg-green-900/50 text-green-400'
        }`}>
          <Package size={11} /> {v.quantity}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-2">
          <ActionBtn onClick={onRestock} icon={<RotateCcw size={14} />} color="text-cyan-400 hover:bg-cyan-900/30"    title="Restock" />
          <ActionBtn onClick={onEdit}    icon={<Pencil size={14} />}    color="text-indigo-400 hover:bg-indigo-900/30" title="Edit"    />
          <ActionBtn onClick={onDelete}  icon={<Trash2 size={14} />}    color="text-red-400 hover:bg-red-900/30"       title="Delete"  />
        </div>
      </td>
    </tr>
  );
}

function ActionBtn({ onClick, icon, color, title }) {
  return (
    <button onClick={onClick} title={title} className={`p-1.5 rounded-lg transition-colors ${color}`}>
      {icon}
    </button>
  );
}

// ── Vehicle form (shared by add + edit) ───────────────────────────────────────
function VehicleForm({ initial, onSubmit, submitLabel }) {
  const [form, setForm]         = useState({
    make:     initial.make     || '',
    model:    initial.model    || '',
    category: initial.category || 'Sedan',
    price:    initial.price    || '',
    quantity: initial.quantity ?? '',
  });
  const [errors, setErrors]         = useState({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving]         = useState(false);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
    setSubmitError('');
  }

  function validate() {
    const e = {};
    if (!form.make.trim())    e.make     = 'Required';
    if (!form.model.trim())   e.model    = 'Required';
    if (!form.category)       e.category = 'Required';
    const p = Number(form.price);
    if (!form.price || isNaN(p) || p <= 0) e.price = 'Must be a positive number';
    const q = Number(form.quantity);
    if (form.quantity === '' || isNaN(q) || !Number.isInteger(q) || q < 0)
      e.quantity = 'Non-negative integer required';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    await onSubmit(
      {
        make:     form.make.trim(),
        model:    form.model.trim(),
        category: form.category,
        price:    Number(form.price),
        quantity: Number(form.quantity),
      },
      setSubmitError
    );
    setSaving(false);
  }

  const CATS = ['Sedan', 'SUV', 'Truck', 'Sports', 'Electric', 'Minivan'];

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {submitError && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-100 rounded-xl px-4 py-2.5 text-sm">
          <AlertCircle size={15} className="flex-shrink-0" /> {submitError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Make"  error={errors.make}>
          <input type="text" value={form.make}  onChange={(e) => set('make', e.target.value)}  className={inputCls(errors.make)}  placeholder="Toyota" />
        </Field>
        <Field label="Model" error={errors.model}>
          <input type="text" value={form.model} onChange={(e) => set('model', e.target.value)} className={inputCls(errors.model)} placeholder="Camry" />
        </Field>
      </div>

      <Field label="Category" error={errors.category}>
        <select value={form.category} onChange={(e) => set('category', e.target.value)} className={inputCls(errors.category)}>
          {CATS.map((c) => <option key={c}>{c}</option>)}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Price ($)" error={errors.price}>
          <input type="number" value={form.price}    onChange={(e) => set('price', e.target.value)}    className={inputCls(errors.price)}    placeholder="25000" min={1} />
        </Field>
        <Field label="Quantity" error={errors.quantity}>
          <input type="number" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} className={inputCls(errors.quantity)} placeholder="5"     min={0} />
        </Field>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-60"
      >
        {saving ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function inputCls(err) {
  return `w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
    err ? 'border-red-300 bg-red-50' : 'border-gray-200'
  }`;
}

// ── Restock form ──────────────────────────────────────────────────────────────
function RestockForm({ vehicle, onSubmit }) {
  const [amount, setAmount]     = useState('');
  const [error, setError]       = useState('');
  const [saving, setSaving]     = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const n = Number(amount);
    if (!amount || isNaN(n) || !Number.isInteger(n) || n <= 0) {
      setError('Enter a positive whole number to add.');
      return;
    }
    setSaving(true);
    await onSubmit(n, setError);
    setSaving(false);
  }

  const preview = amount && Number(amount) > 0 && Number.isInteger(Number(amount))
    ? vehicle.quantity + Number(amount)
    : null;

  return (
    <div>
      <div className="bg-indigo-50 rounded-xl p-4 mb-4 text-center">
        <p className="text-sm text-gray-500">Current stock for</p>
        <p className="font-bold text-gray-800">{vehicle.make} {vehicle.model}</p>
        <p className="text-3xl font-extrabold text-indigo-600 mt-1">{vehicle.quantity} units</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Add Quantity</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setError(''); }}
          placeholder="e.g. 10"
          min={1}
          className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-1 ${
            error ? 'border-red-300 bg-red-50' : 'border-gray-200'
          }`}
        />
        {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
        {preview !== null && (
          <p className="text-xs text-gray-400 mb-3">
            New stock will be:{' '}
            <strong className="text-indigo-600">{preview}</strong>
            {' '}({vehicle.quantity} + {Number(amount)})
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors mt-2 disabled:opacity-60"
        >
          {saving ? 'Restocking…' : 'Confirm Restock'}
        </button>
      </form>
    </div>
  );
}

// ── Empty / loading / error states ────────────────────────────────────────────
function AdminLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-600">
      <Loader size={36} className="animate-spin text-indigo-400" />
      <p className="text-sm">Loading inventory…</p>
    </div>
  );
}

function AdminErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <AlertCircle size={40} className="text-red-400" />
      <div>
        <p className="font-semibold text-gray-300">Could not load inventory</p>
        <p className="text-sm text-gray-500 mt-1">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

function AdminEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Car size={48} className="text-gray-700 mb-4" />
      <h3 className="text-lg font-semibold text-gray-400">No vehicles found</h3>
      <p className="text-gray-600 text-sm mt-1">Adjust your filters or add a new vehicle.</p>
    </div>
  );
}
