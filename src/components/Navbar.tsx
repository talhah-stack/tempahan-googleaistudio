import React from 'react';
import { 
  Calendar, 
  PlusCircle, 
  CheckSquare, 
  Database, 
  RotateCcw, 
  Shield, 
  User as UserIcon,
  Server,
  Layers
} from 'lucide-react';
import { User, DatabaseStatus } from '../types';

interface NavbarProps {
  activeTab: 'calendar' | 'booking' | 'admin' | 'db_guide';
  setActiveTab: (tab: 'calendar' | 'booking' | 'admin' | 'db_guide') => void;
  currentUser: User | null;
  users: User[];
  onSelectUser: (user: User) => void;
  pendingCount: number;
  dbStatus: DatabaseStatus | null;
  onResetData: () => void;
  isResetting: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  users,
  onSelectUser,
  pendingCount,
  dbStatus,
  onResetData,
  isResetting,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top bar info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  TempahBilik<span className="text-blue-600">.my</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  MySQL + Express
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">Sistem Tempahan Bilik Mesyuarat Pintar</p>
            </div>
          </div>

          {/* Right Action Controls: Role Switcher & DB status */}
          <div className="flex items-center gap-3">
            {/* Status Pangkalan Data */}
            <button
              onClick={() => setActiveTab('db_guide')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                dbStatus?.isConnectedToMySQL
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
              title="Klik untuk melihat Skrip SQL & Panduan Setup"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {dbStatus?.isConnectedToMySQL ? 'MySQL Aktif' : 'Mod Memori (SQL)'}
              </span>
              <span className={`w-2 h-2 rounded-full ${dbStatus?.isConnectedToMySQL ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            </button>

            {/* Simulasi Penukaran Pengguna (Role Switcher) */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <div className="hidden lg:flex items-center gap-1 px-2 text-xs text-slate-500">
                {currentUser?.role === 'admin' ? (
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                ) : (
                  <UserIcon className="w-3.5 h-3.5 text-slate-600" />
                )}
                <span className="font-medium text-slate-700">Peranan:</span>
              </div>
              <select
                aria-label="Pilih Pengguna dan Peranan"
                value={currentUser?.id || ''}
                onChange={(e) => {
                  const target = users.find((u) => u.id === Number(e.target.value));
                  if (target) onSelectUser(target);
                }}
                className="bg-white text-xs font-semibold text-slate-800 rounded-lg px-2.5 py-1 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.role === 'admin' ? '🛡️ [Admin] ' : '👤 [Staf] '}
                    {u.name.split(' (')[0]}
                  </option>
                ))}
              </select>
            </div>

            {/* Butang Reset Data */}
            <button
              onClick={onResetData}
              disabled={isResetting}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              title="Set Semula Data Sampel (Reset Demo)"
            >
              <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 sm:space-x-4 border-t border-slate-100 overflow-x-auto py-1">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'calendar'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Kalendar & Jadual Bilik</span>
          </button>

          <button
            onClick={() => setActiveTab('booking')}
            className={`flex items-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'booking'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Permohonan Tempahan</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`relative flex items-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'admin'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Modul Kelulusan Admin</span>
            {pendingCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold leading-none ${
                activeTab === 'admin' ? 'bg-white text-blue-700' : 'bg-amber-500 text-white'
              }`}>
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('db_guide')}
            className={`flex items-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'db_guide'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Skrip SQL & Setup</span>
          </button>
        </div>
      </div>
    </header>
  );
};
