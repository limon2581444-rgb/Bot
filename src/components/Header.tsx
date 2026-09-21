import React from 'react';
import { User, Page } from '../types';
import { TrendingUp, User as UserIcon, LogOut, Shield } from 'lucide-react';

interface HeaderProps {
  currentUser: User | null;
  page: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  page,
  onNavigate,
  onLogout,
}) => {
  if (!currentUser) return null;

  return (
    <header
      id="app-header"
      className="sticky top-0 z-40 h-[70px] px-4 md:px-8 flex items-center justify-between border-b border-cyan-400/20 bg-[#020a19]/90 backdrop-blur-md"
    >
      {/* Brand */}
      <button
        id="header-logo-btn"
        onClick={() => onNavigate('dashboard')}
        className="flex items-center gap-2.5 text-left focus:outline-none group"
      >
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-[#00f2fe] to-[#2377ff] shadow-[0_0_20px_rgba(0,242,254,0.4)] group-hover:scale-105 transition-transform">
          <TrendingUp className="w-5 h-5 text-black" />
        </div>
        <div>
          <span className="font-extrabold text-lg md:text-xl tracking-wider text-white">
            TRADE <span className="text-[#00dfff]">LENS</span>
          </span>
        </div>
      </button>

      {/* User Controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* User Status pill */}
        {currentUser.status && (
          <span
            id="header-status-badge"
            className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
              currentUser.status === 'approved'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : currentUser.status === 'pending'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : currentUser.status === 'removed'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
            }`}
          >
            {currentUser.status}
          </span>
        )}

        {/* User Email Info */}
        <div
          id="header-user-info"
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#0c1f3b] border border-[#1b3d6a] text-xs text-slate-200"
        >
          <div className="w-6 h-6 rounded-full bg-[#163560] flex items-center justify-center text-cyan-400">
            <UserIcon className="w-3.5 h-3.5" />
          </div>
          <span className="max-w-[140px] md:max-w-[200px] truncate font-medium">
            {currentUser.email}
          </span>
        </div>

        {/* Admin Portal Shortcut - ONLY shown if logged in as Admin */}
        {currentUser.role === 'admin' && (
          <button
            id="header-admin-shortcut-btn"
            onClick={() => onNavigate('admin')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1236] border border-purple-500/40 text-purple-300 hover:bg-purple-900/30 text-xs font-medium transition cursor-pointer"
            title="Go to Admin Panel"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Panel</span>
          </button>
        )}

        {/* Logout Button */}
        <button
          id="header-logout-btn"
          onClick={onLogout}
          className="p-2 rounded-lg bg-[#0b1a33] hover:bg-rose-950/40 border border-slate-700/60 hover:border-rose-500/40 text-slate-300 hover:text-rose-400 transition"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
