import React, { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { CATEGORIES } from '../../data/mockVehicles.js';

const empty = { query: '', category: 'All', minPrice: '', maxPrice: '' };

export default function SearchFilter({ onFilter }) {
  const [filters, setFilters] = useState(empty);

  function handle(key, value) {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onFilter(next);
  }

  function clear() {
    setFilters(empty);
    onFilter(empty);
  }

  const hasActive =
    filters.query || filters.category !== 'All' || filters.minPrice || filters.maxPrice;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <SlidersHorizontal size={18} className="text-blue-600" />
        <span className="font-semibold text-gray-700">Search &amp; Filter</span>
        {hasActive && (
          <button
            onClick={clear}
            className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
          >
            <X size={13} /> Clear all
          </button>
        )}
      </div>

      {/* Search input */}
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search make or model…"
          value={filters.query}
          onChange={(e) => handle('query', e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Category */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handle('category', cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                filters.category === cat
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Min Price</label>
          <input
            type="number"
            placeholder="$0"
            value={filters.minPrice}
            min={0}
            onChange={(e) => handle('minPrice', e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Max Price</label>
          <input
            type="number"
            placeholder="Any"
            value={filters.maxPrice}
            min={0}
            onChange={(e) => handle('maxPrice', e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}
