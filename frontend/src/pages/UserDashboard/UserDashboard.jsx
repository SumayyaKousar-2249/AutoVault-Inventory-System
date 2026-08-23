import React, { useState, useEffect, useCallback } from 'react';
import UserNavbar from '../../components/Navbar/UserNavbar.jsx';
import VehicleCard from '../../components/VehicleCard/VehicleCard.jsx';
import SearchFilter from '../../components/SearchFilter/SearchFilter.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { apiGetVehicles, apiPurchaseVehicle } from '../../services/api.js';
import { Car, CheckCircle, ShoppingBag, TrendingDown, AlertCircle, Loader } from 'lucide-react';

// Client-side substring filter on the already-fetched list
// (backend search is exact-match; we keep filtering in-memory for better UX)
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

export default function UserDashboard() {
  const { user } = useAuth();

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [fetchErr, setFetchErr] = useState('');
  const [filters, setFilters]   = useState({ query: '', category: 'All', minPrice: '', maxPrice: '' });
  const [toast, setToast]       = useState(null);

  // ── Load inventory from backend ──────────────────────────────────────────
  const loadVehicles = useCallback(async () => {
    setLoading(true);
    setFetchErr('');
    const { data, error } = await apiGetVehicles();
    if (error) {
      setFetchErr(error);
    } else {
      setVehicles(data.vehicles || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadVehicles(); }, [loadVehicles]);

  // ── Purchase ─────────────────────────────────────────────────────────────
  async function handlePurchase(id) {
    const vehicle = vehicles.find((v) => v.id === id);
    const { data, error } = await apiPurchaseVehicle(id);
    if (error) {
      showToast(error, 'error');
      return;
    }
    // Update only the affected vehicle in local state using the server-returned quantity
    setVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, quantity: data.vehicle.quantity } : v))
    );
    showToast(`${vehicle.make} ${vehicle.model} purchased!`);
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  const displayed = applyFilters(vehicles, filters);
  const available = vehicles.filter((v) => v.quantity > 0).length;
  const prices    = vehicles.map((v) => v.price);
  const cheapest  = prices.length ? Math.min(...prices) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <UserNavbar />

      {/* Hero banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-blue-200 text-sm font-medium mb-1">Welcome back,</p>
          <h1 className="text-3xl font-extrabold mb-2">{user?.name} 👋</h1>
          <p className="text-blue-100 text-sm">Find your perfect car from our curated inventory.</p>

          {!loading && !fetchErr && (
            <div className="grid grid-cols-3 gap-4 mt-6 max-w-sm">
              <StatBadge icon={<Car size={16} />}          label="Models"   value={vehicles.length} />
              <StatBadge icon={<ShoppingBag size={16} />}  label="In Stock" value={available} />
              <StatBadge icon={<TrendingDown size={16} />} label="From"     value={cheapest ? `$${cheapest.toLocaleString()}` : '—'} />
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-[280px_1fr] gap-6">

          {/* Sidebar filters */}
          <aside className="mb-6 lg:mb-0">
            <SearchFilter onFilter={setFilters} />
          </aside>

          {/* Vehicle grid */}
          <section>
            {loading && <LoadingState />}

            {!loading && fetchErr && (
              <ErrorState message={fetchErr} onRetry={loadVehicles} />
            )}

            {!loading && !fetchErr && (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  Showing{' '}
                  <span className="font-semibold text-gray-800">{displayed.length}</span>{' '}
                  vehicle{displayed.length !== 1 ? 's' : ''}
                </p>

                {displayed.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {displayed.map((v) => (
                      <VehicleCard key={v.id} vehicle={v} onPurchase={handlePurchase} />
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>

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

// ── Helper sub-components ─────────────────────────────────────────────────────

function StatBadge({ icon, label, value }) {
  return (
    <div className="bg-white/10 rounded-xl px-3 py-2 text-center">
      <div className="flex justify-center mb-1 text-blue-200">{icon}</div>
      <p className="text-white font-bold text-base leading-none">{value}</p>
      <p className="text-blue-200 text-xs mt-0.5">{label}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
      <Loader size={36} className="animate-spin" />
      <p className="text-sm">Loading inventory…</p>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <AlertCircle size={40} className="text-red-400" />
      <div>
        <p className="font-semibold text-gray-700">Could not load inventory</p>
        <p className="text-sm text-gray-500 mt-1">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Car size={48} className="text-gray-300 mb-4" />
      <h3 className="text-lg font-semibold text-gray-600">No vehicles found</h3>
      <p className="text-gray-400 text-sm mt-1">Try adjusting your filters.</p>
    </div>
  );
}
