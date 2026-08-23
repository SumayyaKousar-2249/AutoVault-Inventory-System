import React from 'react';
import { Star, Tag, ShoppingCart, Package } from 'lucide-react';

export default function VehicleCard({ vehicle, onPurchase }) {
  const outOfStock = vehicle.quantity === 0;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow flex flex-col ${outOfStock ? 'opacity-75' : ''}`}>
      {/* Header strip */}
      <div className="h-2 rounded-t-2xl bg-gradient-to-r from-blue-500 to-indigo-600" />

      <div className="p-5 flex flex-col flex-1">
        {/* Make / Model / Category */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">{vehicle.category}</p>
            <h3 className="text-lg font-bold text-gray-800 leading-tight">
              {vehicle.make} {vehicle.model}
            </h3>
          </div>

          {/* Rating — only shown when the field exists (backend doesn't return it) */}
          {vehicle.rating != null && (
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full flex-shrink-0">
              <Star size={13} className="text-amber-500 fill-amber-500" />
              <span className="text-xs font-semibold text-amber-700">{vehicle.rating}</span>
            </div>
          )}
        </div>

        {/* Offer badge — only shown when the field exists */}
        {vehicle.offer && (
          <div className="flex items-center gap-1.5 bg-green-50 text-green-700 text-xs px-3 py-1.5 rounded-lg mb-3 border border-green-100">
            <Tag size={12} />
            <span>{vehicle.offer}</span>
          </div>
        )}

        {/* Price + Stock */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
          <div>
            <p className="text-2xl font-extrabold text-gray-900">
              ${vehicle.price.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Package size={11} />
              {outOfStock ? (
                <span className="text-red-500 font-medium">Out of Stock</span>
              ) : (
                <span>{vehicle.quantity} available</span>
              )}
            </p>
          </div>

          <button
            onClick={() => !outOfStock && onPurchase(vehicle.id)}
            disabled={outOfStock}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              outOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
            }`}
          >
            <ShoppingCart size={15} />
            {outOfStock ? 'Unavailable' : 'Purchase'}
          </button>
        </div>

        {/* ID */}
        <p className="text-xs text-gray-300 mt-2">ID: #{vehicle.id}</p>
      </div>
    </div>
  );
}
