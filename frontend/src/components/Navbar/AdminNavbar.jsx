import React from 'react';
import { Car, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function AdminNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="bg-gray-900 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl">
            <Car size={20} className="text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-white">Auto<span className="text-indigo-400">Vault</span></span>
            <span className="ml-2 text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-medium uppercase tracking-wider">Admin</span>
          </div>
        </div>

        {/* Admin info + logout */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-full">
            <ShieldCheck size={14} className="text-indigo-400" />
            <span className="text-sm text-gray-300 font-medium">{user?.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700 transition-colors"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
