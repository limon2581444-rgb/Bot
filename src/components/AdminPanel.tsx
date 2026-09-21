import React, { useState } from 'react';
import { User, Page } from '../types';
import {
  TrendingUp,
  ShieldCheck,
  LogOut,
  Check,
  X,
  Trash2,
  Search,
  RefreshCw,
  PlusCircle,
  Users,
  Clock,
  CheckCircle2,
  UserX,
  Filter,
  AlertTriangle,
} from 'lucide-react';

interface AdminPanelProps {
  users: User[];
  onApproveUser: (email: string) => void;
  onRejectUser: (email: string) => void;
  onRemoveUser: (email: string) => void;
  onRemoveAllApproved?: () => void;
  onAddTestUser: () => void;
  onResetDemoData: () => void;
  onNavigate: (page: Page) => void;
  onLogoutAdmin: () => void;
}

type FilterType = 'all' | 'pending' | 'approved' | 'removed';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  users,
  onApproveUser,
  onRejectUser,
  onRemoveUser,
  onRemoveAllApproved,
  onAddTestUser,
  onResetDemoData,
  onNavigate,
  onLogoutAdmin,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterType>('all');
  const [showRemoveAllConfirm, setShowRemoveAllConfirm] = useState(false);
  const [confirmingRemoveEmail, setConfirmingRemoveEmail] = useState<string | null>(null);

  // Defensively deduplicate users by email in case of multiple Firestore records
  const uniqueUsers = React.useMemo(() => {
    const map = new Map<string, User>();
    for (const u of users) {
      const emailKey = (u.email || '').toLowerCase().trim();
      if (!emailKey) continue;
      if (!map.has(emailKey)) {
        map.set(emailKey, u);
      } else {
        const prev = map.get(emailKey)!;
        const statusPriority: Record<string, number> = {
          approved: 3,
          pending: 2,
          active: 1,
          removed: 0,
        };
        const curScore = (statusPriority[u.status] ?? 1) + (u.payment ? 5 : 0);
        const prevScore = (statusPriority[prev.status] ?? 1) + (prev.payment ? 5 : 0);
        if (curScore >= prevScore) {
          map.set(emailKey, u);
        }
      }
    }
    return Array.from(map.values());
  }, [users]);

  const pendingUsers = uniqueUsers.filter((u) => u.status === 'pending');
  const approvedUsers = uniqueUsers.filter((u) => u.status === 'approved');
  const removedUsers = uniqueUsers.filter((u) => u.status === 'removed');

  // Filtered users for table based on search & selected card filter
  const displayedUsers = uniqueUsers.filter((u) => {
    const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    return u.status === statusFilter;
  });

  const scrollToUsersSection = () => {
    const el = document.getElementById('admin-users-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCardClick = (filter: FilterType) => {
    setStatusFilter(filter);
    scrollToUsersSection();
  };

  return (
    <div id="admin-panel" className="min-h-screen bg-[#030611] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-purple-500/20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#763cff] to-[#c022ff] shadow-[0_0_20px_rgba(180,30,255,0.35)]">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-wider text-white">
                  TRADE <span className="text-purple-400">LENS</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase">
                  Admin Console
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Payment clearance, license provisioning & user privileges
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              id="admin-to-user-portal-btn"
              onClick={() => onNavigate('dashboard')}
              className="px-3.5 py-2 rounded-xl bg-[#0e172e] hover:bg-[#162447] border border-cyan-500/30 text-xs font-semibold text-cyan-300 flex items-center gap-1.5 transition cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              User Portal
            </button>

            <button
              id="admin-logout-btn"
              onClick={onLogoutAdmin}
              className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-xs font-semibold text-rose-300 flex items-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Quick Summary Cards - Interactive filtering */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          {/* Card 1: Total Users */}
          <div
            id="stat-card-total-users"
            onClick={() => handleCardClick('all')}
            className={`p-4 rounded-xl cursor-pointer transition-all duration-200 select-none relative overflow-hidden group ${
              statusFilter === 'all'
                ? 'bg-[#121536] border-2 border-purple-400 shadow-[0_0_25px_rgba(156,40,237,0.35)] scale-[1.02]'
                : 'bg-[#090b1c] border border-purple-800/40 hover:border-purple-600/70 hover:bg-[#0e112c]'
            }`}
            title="Click to view all users"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                Total Users
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                All
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl md:text-3xl font-extrabold text-white">{users.length}</span>
              <span className="text-[11px] text-purple-300 font-semibold group-hover:underline">
                View List →
              </span>
            </div>
            {statusFilter === 'all' && (
              <div className="mt-2 pt-1.5 border-t border-purple-500/30 flex items-center gap-1 text-[10px] font-bold text-purple-300">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                Active Filter
              </div>
            )}
          </div>

          {/* Card 2: Pending Requests */}
          <div
            id="stat-card-pending-users"
            onClick={() => handleCardClick('pending')}
            className={`p-4 rounded-xl cursor-pointer transition-all duration-200 select-none relative overflow-hidden group ${
              statusFilter === 'pending'
                ? 'bg-[#261b0a] border-2 border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.35)] scale-[1.02]'
                : 'bg-[#140e06] border border-amber-500/40 hover:border-amber-500/80 hover:bg-[#1f1509]'
            }`}
            title="Click to view pending requests"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-amber-300 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Pending Requests
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300">
                Review
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl md:text-3xl font-extrabold text-amber-400">{pendingUsers.length}</span>
              <span className="text-[11px] text-amber-300 font-semibold group-hover:underline">
                {pendingUsers.length} awaiting →
              </span>
            </div>
            {statusFilter === 'pending' && (
              <div className="mt-2 pt-1.5 border-t border-amber-500/30 flex items-center gap-1 text-[10px] font-bold text-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Showing pending requests ({pendingUsers.length})
              </div>
            )}
          </div>

          {/* Card 3: Pro Active */}
          <div
            id="stat-card-approved-users"
            onClick={() => handleCardClick('approved')}
            className={`p-4 rounded-xl cursor-pointer transition-all duration-200 select-none relative overflow-hidden group ${
              statusFilter === 'approved'
                ? 'bg-[#0b281b] border-2 border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.35)] scale-[1.02]'
                : 'bg-[#06140e] border border-emerald-500/40 hover:border-emerald-500/80 hover:bg-[#0c2217]'
            }`}
            title="Click to view approved active users"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-emerald-300 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Pro Active
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300">
                  Active
                </span>
                {approvedUsers.length > 0 && (
                  <button
                    id="card-remove-all-approved-btn"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRemoveAllConfirm(true);
                    }}
                    title="Remove all Pro Active users"
                    className="px-2 py-0.5 rounded bg-rose-600/90 hover:bg-rose-500 text-white text-[10px] font-bold flex items-center gap-1 shadow transition cursor-pointer"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    Remove All
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl md:text-3xl font-extrabold text-emerald-400">
                {approvedUsers.length}
              </span>
              <span className="text-[11px] text-emerald-300 font-semibold group-hover:underline">
                {approvedUsers.length} active →
              </span>
            </div>
            {statusFilter === 'approved' ? (
              <div className="mt-2 pt-1.5 border-t border-emerald-500/30 flex items-center justify-between gap-1 text-[10px] font-bold text-emerald-300">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active Users ({approvedUsers.length})
                </span>
                {approvedUsers.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRemoveAllConfirm(true);
                    }}
                    className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-0.5 cursor-pointer bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-500/40"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    Remove All
                  </button>
                )}
              </div>
            ) : approvedUsers.length > 0 ? (
              <div className="mt-2 pt-1.5 border-t border-emerald-900/40 flex items-center justify-between text-[10px] text-emerald-400/80">
                <span>One-click bulk remove</span>
                <span className="text-rose-400 hover:underline flex items-center gap-0.5">
                  <Trash2 className="w-2.5 h-2.5" /> Manage
                </span>
              </div>
            ) : null}
          </div>

          {/* Card 4: Disabled Users */}
          <div
            id="stat-card-removed-users"
            onClick={() => handleCardClick('removed')}
            className={`p-4 rounded-xl cursor-pointer transition-all duration-200 select-none relative overflow-hidden group ${
              statusFilter === 'removed'
                ? 'bg-[#290d11] border-2 border-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.35)] scale-[1.02]'
                : 'bg-[#140608] border border-rose-500/40 hover:border-rose-500/80 hover:bg-[#20090d]'
            }`}
            title="Click to view removed users"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-rose-300 font-medium flex items-center gap-1.5">
                <UserX className="w-3.5 h-3.5 text-rose-400" />
                Disabled
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-400/20 text-rose-300">
                Revoked
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl md:text-3xl font-extrabold text-rose-400">
                {removedUsers.length}
              </span>
              <span className="text-[11px] text-rose-300 font-semibold group-hover:underline">
                {removedUsers.length} revoked →
              </span>
            </div>
            {statusFilter === 'removed' && (
              <div className="mt-2 pt-1.5 border-t border-rose-500/30 flex items-center gap-1 text-[10px] font-bold text-rose-300">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                Showing revoked users ({removedUsers.length})
              </div>
            )}
          </div>
        </div>

        {/* SECTION 1: PENDING REQUESTS */}
        <div
          id="admin-pending-section"
          className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-[#0c0824] to-[#040212] border border-purple-500/40 shadow-[0_0_30px_rgba(156,40,237,0.1)]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg md:text-xl font-bold text-white">Pending Requests</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-black">
                {pendingUsers.length}
              </span>
            </div>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Authorize payment to activate Pro Future
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#2a174c] bg-[#060312]">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-[#120926] text-purple-200 border-b border-[#2a174c]">
                <tr>
                  <th className="p-3.5">#</th>
                  <th className="p-3.5">User Email</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5">Trx Code / ID</th>
                  <th className="p-3.5">Date Submitted</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e0f36]">
                {pendingUsers.length > 0 ? (
                  pendingUsers.map((u, i) => (
                    <tr key={u.id ? `pending-${u.id}` : `pending-${u.email}-${i}`} className="hover:bg-purple-950/20 transition">
                      <td className="p-3.5 text-slate-400">{i + 1}</td>
                      <td className="p-3.5 font-medium text-white select-all">{u.email}</td>
                      <td className="p-3.5 font-bold text-emerald-400">
                        ${u.payment?.amount || 0} USD
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-purple-900/50 text-purple-200 border border-purple-700/50 text-xs">
                          {u.payment?.method || '-'}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-cyan-300 text-xs select-all">
                        {u.payment?.transactionId || '—'}
                      </td>
                      <td className="p-3.5 text-slate-400 text-xs">{u.payment?.date || '-'}</td>
                      <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                        <button
                          id={`approve-btn-${i}`}
                          onClick={() => onApproveUser(u.email)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow transition cursor-pointer"
                          title="Active this request"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Active
                        </button>
                        <button
                          id={`reject-btn-${i}`}
                          onClick={() => onRemoveUser(u.email)}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow transition cursor-pointer"
                          title="Remove this request"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                      No pending payment requests awaiting review.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 2: REGISTERED USERS - WITH INTERACTIVE FILTERING */}
        <div
          id="admin-users-section"
          className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-[#06142c] to-[#030919] border border-cyan-500/30 shadow-[0_0_30px_rgba(0,180,255,0.08)]"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-bold text-white">Registered Users</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {displayedUsers.length} / {users.length}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {statusFilter === 'all' && 'Showing all registered users'}
                {statusFilter === 'pending' && 'Showing pending payment verification requests'}
                {statusFilter === 'approved' && 'Showing Pro Active licensed users'}
                {statusFilter === 'removed' && 'Showing disabled & revoked access users'}
              </p>
            </div>

            {/* Quick Status Filter Tabs & Search */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Filter Tabs */}
              <div className="inline-flex rounded-lg bg-[#071936] p-1 border border-[#1d3d63] text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({users.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('pending')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                    statusFilter === 'pending'
                      ? 'bg-amber-500 text-black shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pending ({pendingUsers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('approved')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                    statusFilter === 'approved'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Active ({approvedUsers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('removed')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                    statusFilter === 'removed'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Disabled ({removedUsers.length})
                </button>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-search-users-input"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter by email..."
                  className="h-9 pl-9 pr-3 rounded-lg bg-[#071936] border border-[#1d3d63] text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 w-44 sm:w-52 transition"
                />
              </div>

              {statusFilter === 'approved' && approvedUsers.length > 0 && (
                <button
                  id="admin-remove-all-approved-action-btn"
                  type="button"
                  onClick={() => setShowRemoveAllConfirm(true)}
                  className="h-9 px-3 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer"
                  title="Remove all Pro Active users"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove All ({approvedUsers.length})</span>
                </button>
              )}

              <button
                id="admin-add-test-user-btn"
                onClick={onAddTestUser}
                title="Add sample user"
                className="h-9 px-3 rounded-lg bg-[#0b244d] hover:bg-[#123670] border border-cyan-500/40 text-cyan-300 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add Test</span>
              </button>

              <button
                id="admin-reset-demo-btn"
                onClick={onResetDemoData}
                title="Reset to default demo data"
                className="h-9 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#16365a] bg-[#020a16]">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-[#081b36] text-cyan-200 border-b border-[#16365a]">
                <tr>
                  <th className="p-3.5">#</th>
                  <th className="p-3.5">User Email</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Payment Detail</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#102742]">
                {displayedUsers.length > 0 ? (
                  displayedUsers.map((u, i) => (
                    <tr key={u.id ? `user-${u.id}` : `user-${u.email}-${i}`} className="hover:bg-cyan-950/20 transition">
                      <td className="p-3.5 text-slate-400">{i + 1}</td>
                      <td className="p-3.5 font-medium text-white select-all">{u.email}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            u.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : u.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : u.status === 'removed'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-300 text-xs">
                        {u.payment
                          ? `$${u.payment.amount} / ${u.payment.method}`
                          : '— No payment —'}
                      </td>
                      <td className="p-3.5 text-right">
                        {u.status !== 'removed' ? (
                          confirmingRemoveEmail === u.email ? (
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <span className="text-[11px] text-rose-300 font-semibold hidden sm:inline">Confirm?</span>
                              <button
                                id={`confirm-remove-btn-${i}`}
                                type="button"
                                onClick={() => {
                                  onRemoveUser(u.email);
                                  setConfirmingRemoveEmail(null);
                                }}
                                className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs inline-flex items-center gap-1 shadow transition cursor-pointer"
                                title="Confirm Remove"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmingRemoveEmail(null)}
                                className="px-2 py-1 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold text-xs transition cursor-pointer"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              id={`remove-user-btn-${i}`}
                              type="button"
                              onClick={() => setConfirmingRemoveEmail(u.email)}
                              className="px-2.5 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                              title="Remove user"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Remove
                            </button>
                          )
                        ) : (
                          <span className="text-rose-400 font-medium text-xs">
                            Access Disabled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                      {statusFilter !== 'all' ? (
                        <span>
                          No users found in the "{statusFilter}" category.{' '}
                          <button
                            onClick={() => setStatusFilter('all')}
                            className="text-cyan-400 underline font-semibold hover:text-cyan-300 ml-1 cursor-pointer"
                          >
                            View all users
                          </button>
                        </span>
                      ) : (
                        <span>No registered users found matching "{searchTerm}".</span>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Remove All Approved Users Confirmation Modal */}
      {showRemoveAllConfirm && (
        <div
          id="remove-all-confirm-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#0d1527] border border-rose-500/50 shadow-[0_0_40px_rgba(244,63,94,0.3)] text-white">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Remove all Pro Active users?
            </h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              This will revoke trading licenses and Pro Future access for all <strong className="text-emerald-400 font-bold">{approvedUsers.length} Pro Active</strong> users in this category.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRemoveAllConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-remove-all-approved-btn"
                type="button"
                onClick={() => {
                  setShowRemoveAllConfirm(false);
                  if (onRemoveAllApproved) {
                    onRemoveAllApproved();
                  } else {
                    approvedUsers.forEach((u) => onRemoveUser(u.email));
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Yes, Remove All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
