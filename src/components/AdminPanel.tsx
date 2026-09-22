import React, { useState, useMemo } from 'react';
import { User, Page, PaymentRequest } from '../types';
import { calculateActiveDuration } from '../lib/firebaseDb';
import {
  ShieldCheck,
  LogOut,
  Check,
  X,
  Search,
  Users,
  Clock,
  CheckCircle2,
  UserX,
  CreditCard,
  RotateCcw,
  Sparkles,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface AdminPanelProps {
  users: User[];
  paymentRequests?: PaymentRequest[];
  onApproveUser: (email: string) => void;
  onRejectUser: (email: string) => void;
  onRemoveUser: (email: string) => void;
  onRemoveAllApproved?: () => void;
  onNavigate: (page: Page) => void;
  onLogoutAdmin: () => void;
}

type TabType = 'all' | 'pending' | 'active' | 'disabled';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  users,
  paymentRequests = [],
  onApproveUser,
  onRejectUser,
  onRemoveUser,
  onRemoveAllApproved,
  onNavigate,
  onLogoutAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmingRemoveEmail, setConfirmingRemoveEmail] = useState<string | null>(null);
  const [actionLoadingEmail, setActionLoadingEmail] = useState<string | null>(null);

  // Deduplicate and sanitize user list from Firestore
  const sanitizedUsers = useMemo(() => {
    const map = new Map<string, User>();
    for (const u of users) {
      const email = (u.email || '').trim().toLowerCase();
      if (!email || email.includes('admin@tradelens') || email === 'limon2581444@gmail.com') continue;

      if (!map.has(email)) {
        map.set(email, u);
      } else {
        const prev = map.get(email)!;
        const statusWeight: Record<string, number> = {
          active: 4,
          approved: 4,
          pending: 3,
          disabled: 2,
          removed: 1,
        };
        const curScore = (statusWeight[u.status] ?? 1) + (u.payment ? 5 : 0);
        const prevScore = (statusWeight[prev.status] ?? 1) + (prev.payment ? 5 : 0);
        if (curScore >= prevScore) {
          map.set(email, u);
        }
      }
    }
    return Array.from(map.values());
  }, [users]);

  // Merge paymentRequests collection info with user records
  const enrichedUsers = useMemo(() => {
    const reqMap = new Map<string, PaymentRequest>();
    for (const req of paymentRequests) {
      const email = (req.userEmail || '').trim().toLowerCase();
      if (email) reqMap.set(email, req);
    }

    return sanitizedUsers.map((u) => {
      const email = u.email.trim().toLowerCase();
      const pr = reqMap.get(email);
      if (!pr) return u;

      return {
        ...u,
        payment: u.payment || {
          amount: pr.amount,
          method: pr.method,
          transactionId: pr.transactionId,
          date: pr.date,
        },
      };
    });
  }, [sanitizedUsers, paymentRequests]);

  // Categorize users
  const pendingUsers = useMemo(() => {
    return enrichedUsers.filter((u) => u.status === 'pending');
  }, [enrichedUsers]);

  const activeUsers = useMemo(() => {
    return enrichedUsers.filter((u) => u.status === 'active' || u.status === 'approved');
  }, [enrichedUsers]);

  const disabledUsers = useMemo(() => {
    return enrichedUsers.filter((u) => u.status === 'disabled' || u.status === 'removed');
  }, [enrichedUsers]);

  const totalUsersCount = enrichedUsers.length;
  const pendingCount = pendingUsers.length;
  const activeCount = activeUsers.length;
  const disabledCount = disabledUsers.length;
  const totalPaymentRequestsCount = enrichedUsers.filter((u) => !!u.payment).length;

  // Filter users for search
  const filterList = (list: User[]) => {
    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase().trim();
    return list.filter((u) => {
      const email = u.email.toLowerCase();
      const trx = u.payment?.transactionId?.toLowerCase() || '';
      const method = u.payment?.method?.toLowerCase() || '';
      return email.includes(term) || trx.includes(term) || method.includes(term);
    });
  };

  const handleApprove = async (email: string) => {
    setActionLoadingEmail(email);
    try {
      await onApproveUser(email);
    } finally {
      setActionLoadingEmail(null);
    }
  };

  const handleDisablePending = async (email: string) => {
    setActionLoadingEmail(email);
    try {
      await onRejectUser(email);
    } finally {
      setActionLoadingEmail(null);
    }
  };

  const handleRemoveActive = async (email: string) => {
    setActionLoadingEmail(email);
    try {
      await onRemoveUser(email);
      setConfirmingRemoveEmail(null);
    } finally {
      setActionLoadingEmail(null);
    }
  };

  return (
    <div id="admin-panel" className="min-h-screen bg-[#030611] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-purple-500/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#763cff] to-[#c022ff] shadow-[0_0_25px_rgba(180,30,255,0.4)]">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-wider text-white">
                  TRADE <span className="text-purple-400">LENS</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/50 uppercase tracking-wider">
                  Admin Panel
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Centralized role-based clearance, instant license activation & account management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              id="admin-logout-btn"
              onClick={onLogoutAdmin}
              className="h-10 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out Admin
            </button>
          </div>
        </div>

        {/* Top Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          {/* Total Users */}
          <button
            onClick={() => setActiveTab('all')}
            className={`p-4 md:p-5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
              activeTab === 'all'
                ? 'bg-[#12092a] border-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.25)]'
                : 'bg-[#090b1a] border-white/10 hover:border-purple-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-white">{totalUsersCount}</p>
              <p className="text-[11px] text-slate-400 mt-1">All registered accounts</p>
            </div>
          </button>

          {/* Pending Requests */}
          <button
            onClick={() => setActiveTab('pending')}
            className={`p-4 md:p-5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
              activeTab === 'pending'
                ? 'bg-[#1d1405] border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.25)]'
                : 'bg-[#090b1a] border-white/10 hover:border-amber-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Pending</span>
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-amber-300">{pendingCount}</p>
              <p className="text-[11px] text-amber-200/70 mt-1">Awaiting approval</p>
            </div>
          </button>

          {/* Active Users */}
          <button
            onClick={() => setActiveTab('active')}
            className={`p-4 md:p-5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
              activeTab === 'active'
                ? 'bg-[#061c14] border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.25)]'
                : 'bg-[#090b1a] border-white/10 hover:border-emerald-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Active Users</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-emerald-300">{activeCount}</p>
              <p className="text-[11px] text-emerald-200/70 mt-1">Pro Future unlocked</p>
            </div>
          </button>

          {/* Disabled Users */}
          <button
            onClick={() => setActiveTab('disabled')}
            className={`p-4 md:p-5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
              activeTab === 'disabled'
                ? 'bg-[#1e0811] border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.25)]'
                : 'bg-[#090b1a] border-white/10 hover:border-rose-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Disabled</span>
              <UserX className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-rose-300">{disabledCount}</p>
              <p className="text-[11px] text-rose-200/70 mt-1">Access revoked</p>
            </div>
          </button>

          {/* Total Payment Requests */}
          <div className="p-4 md:p-5 rounded-2xl border border-white/10 bg-[#090b1a] flex flex-col justify-between col-span-2 md:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Total Payments</span>
              <CreditCard className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-cyan-300">{totalPaymentRequestsCount}</p>
              <p className="text-[11px] text-cyan-200/70 mt-1">Submitted payments</p>
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-2">
          {/* Section Tabs */}
          <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-[#090c1f] border border-white/10">
            <button
              id="tab-all-users"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4" />
              All Users ({totalUsersCount})
            </button>

            <button
              id="tab-pending-requests"
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Clock className="w-4 h-4" />
              Pending Requests ({pendingCount})
            </button>

            <button
              id="tab-active-users"
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'active'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Active Users ({activeCount})
            </button>

            <button
              id="tab-disabled-users"
              onClick={() => setActiveTab('disabled')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'disabled'
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserX className="w-4 h-4" />
              Disabled Users ({disabledCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Gmail or TrxID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#090c1f] border border-white/10 text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
            />
          </div>
        </div>

        {/* TAB 1: ALL USERS SECTION */}
        {activeTab === 'all' && (
          <div id="section-all-users" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  All Registered Users
                </h3>
                <p className="text-xs text-slate-400">Complete serial list of all registered Trade Lens users</p>
              </div>
              <span className="text-xs text-slate-400">
                Showing {filterList(enrichedUsers).length} of {totalUsersCount} users
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#070919] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-[#0e122b] border-b border-white/10 text-slate-400 uppercase text-[11px] font-bold tracking-wider">
                      <th className="py-3.5 px-4 w-12 text-center">#</th>
                      <th className="py-3.5 px-4">Gmail</th>
                      <th className="py-3.5 px-4">Password</th>
                      <th className="py-3.5 px-4">Account Created</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4">Payment</th>
                      <th className="py-3.5 px-4">Transaction ID</th>
                      <th className="py-3.5 px-4">Active Date</th>
                      <th className="py-3.5 px-4">Active Duration</th>
                      <th className="py-3.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-sans">
                    {filterList(enrichedUsers).length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-500">
                          No users found matching query
                        </td>
                      </tr>
                    ) : (
                      filterList(enrichedUsers).map((user, idx) => {
                        const isActive = user.status === 'active' || user.status === 'approved';
                        const isPending = user.status === 'pending';
                        const isDisabled = user.status === 'disabled' || user.status === 'removed';
                        const duration = calculateActiveDuration(user.activeAt, user.activeDate);

                        return (
                          <tr key={user.id || user.email} className="hover:bg-white/[0.02] transition">
                            {/* 1. Serial Number */}
                            <td className="py-3.5 px-4 text-center font-mono text-slate-400 text-xs font-bold">
                              {idx + 1}
                            </td>

                            {/* 2. Gmail */}
                            <td className="py-3.5 px-4 font-semibold text-white">
                              {user.email}
                            </td>

                            {/* 3. Password (Strictly Protected) */}
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-800/80 text-slate-400 border border-slate-700/60">
                                🔒 Protected
                              </span>
                            </td>

                            {/* 4. Created Date */}
                            <td className="py-3.5 px-4 text-xs text-slate-400">
                              {user.created || (user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—')}
                            </td>

                            {/* 5. Current Status */}
                            <td className="py-3.5 px-4 text-center">
                              {isActive ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 uppercase">
                                  ACTIVE
                                </span>
                              ) : isPending ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/50 uppercase">
                                  PENDING
                                </span>
                              ) : isDisabled ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/50 uppercase">
                                  DISABLED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-500/20 text-slate-300 border border-slate-500/50 uppercase">
                                  USER
                                </span>
                              )}
                            </td>

                            {/* 6. Payment Status & Amount */}
                            <td className="py-3.5 px-4">
                              {user.payment ? (
                                <div>
                                  <span className="font-bold text-cyan-300">${user.payment.amount} USD</span>
                                  <span className="text-[11px] text-slate-400 block">{user.payment.method}</span>
                                </div>
                              ) : (
                                <span className="text-slate-500 text-xs">Unpaid</span>
                              )}
                            </td>

                            {/* 7. Transaction ID */}
                            <td className="py-3.5 px-4 font-mono text-xs text-amber-300/90">
                              {user.payment?.transactionId || '—'}
                            </td>

                            {/* 8. Active Date */}
                            <td className="py-3.5 px-4 text-xs text-slate-300">
                              {user.activeDate || (user.activeAt ? new Date(user.activeAt).toLocaleDateString() : '—')}
                            </td>

                            {/* 9. Active Duration */}
                            <td className="py-3.5 px-4 text-xs font-semibold text-emerald-400">
                              {isActive ? duration : '—'}
                            </td>

                            {/* 10. Action Buttons */}
                            <td className="py-3.5 px-4 text-center">
                              {isPending ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleApprove(user.email)}
                                    disabled={actionLoadingEmail === user.email}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition cursor-pointer"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleDisablePending(user.email)}
                                    disabled={actionLoadingEmail === user.email}
                                    className="px-2.5 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 text-xs font-semibold transition cursor-pointer"
                                  >
                                    Disable
                                  </button>
                                </div>
                              ) : isActive ? (
                                <button
                                  onClick={() => handleRemoveActive(user.email)}
                                  disabled={actionLoadingEmail === user.email}
                                  className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 font-bold text-xs transition cursor-pointer"
                                >
                                  Remove
                                </button>
                              ) : isDisabled ? (
                                <button
                                  onClick={() => handleApprove(user.email)}
                                  disabled={actionLoadingEmail === user.email}
                                  className="px-3 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-bold transition cursor-pointer"
                                >
                                  Re-activate
                                </button>
                              ) : (
                                <span className="text-slate-500 text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PENDING REQUESTS SECTION */}
        {activeTab === 'pending' && (
          <div id="section-pending-requests" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  Pending Payment Requests
                </h3>
                <p className="text-xs text-amber-200/80">
                  Users awaiting administrator verification to unlock Pro Future bot access
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {pendingCount} Pending Requests
              </span>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-[#070919] overflow-hidden shadow-[0_0_35px_rgba(245,158,11,0.15)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-[#1b1405] border-b border-amber-500/30 text-amber-300 uppercase text-[11px] font-bold tracking-wider">
                      <th className="py-3.5 px-4 w-12 text-center">#</th>
                      <th className="py-3.5 px-4">User Gmail</th>
                      <th className="py-3.5 px-4">Transaction ID</th>
                      <th className="py-3.5 px-4">Payment Method</th>
                      <th className="py-3.5 px-4">Payment Amount</th>
                      <th className="py-3.5 px-4">Request Date</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-sans">
                    {filterList(pendingUsers).length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500">
                          No pending payment requests right now
                        </td>
                      </tr>
                    ) : (
                      filterList(pendingUsers).map((user, idx) => (
                        <tr key={user.id || user.email} className="hover:bg-amber-500/[0.04] transition">
                          {/* 1. Serial Number */}
                          <td className="py-3.5 px-4 text-center font-mono text-slate-400 text-xs font-bold">
                            {idx + 1}
                          </td>

                          {/* 2. User Gmail */}
                          <td className="py-3.5 px-4 font-bold text-white">
                            {user.email}
                          </td>

                          {/* 3. Transaction ID */}
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-300">
                            {user.payment?.transactionId || '—'}
                          </td>

                          {/* 4. Payment Method */}
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                              {user.payment?.method || 'Binance'}
                            </span>
                          </td>

                          {/* 5. Payment Amount */}
                          <td className="py-3.5 px-4 font-extrabold text-cyan-300">
                            ${user.payment?.amount || 30} USD
                          </td>

                          {/* 6. Request Date */}
                          <td className="py-3.5 px-4 text-xs text-slate-300">
                            {user.payment?.date || user.created || 'Recently'}
                          </td>

                          {/* 7. Status */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                              PENDING
                            </span>
                          </td>

                          {/* 8. Action: Accept and Disable */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleApprove(user.email)}
                                disabled={actionLoadingEmail === user.email}
                                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Accept
                              </button>
                              <button
                                onClick={() => handleDisablePending(user.email)}
                                disabled={actionLoadingEmail === user.email}
                                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 font-bold text-xs transition cursor-pointer flex items-center gap-1"
                              >
                                <X className="w-3.5 h-3.5" />
                                Disable
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ACTIVE USERS SECTION */}
        {activeTab === 'active' && (
          <div id="section-active-users" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Active Approved Users
                </h3>
                <p className="text-xs text-emerald-200/80">
                  Users with unlocked Pro Future license and lifetime bot access
                </p>
              </div>

              {activeUsers.length > 0 && onRemoveAllApproved && (
                <button
                  onClick={() => onRemoveAllApproved()}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
                >
                  <UserX className="w-3.5 h-3.5" />
                  Revoke All Active Users
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-[#070919] overflow-hidden shadow-[0_0_35px_rgba(16,185,129,0.15)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm border-collapse min-w-[950px]">
                  <thead>
                    <tr className="bg-[#072418] border-b border-emerald-500/30 text-emerald-300 uppercase text-[11px] font-bold tracking-wider">
                      <th className="py-3.5 px-4 w-12 text-center">#</th>
                      <th className="py-3.5 px-4">Gmail</th>
                      <th className="py-3.5 px-4">Transaction ID</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Method</th>
                      <th className="py-3.5 px-4">Active Date</th>
                      <th className="py-3.5 px-4">Active Duration</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-sans">
                    {filterList(activeUsers).length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-500">
                          No active users found
                        </td>
                      </tr>
                    ) : (
                      filterList(activeUsers).map((user, idx) => {
                        const duration = calculateActiveDuration(user.activeAt, user.activeDate);
                        const isConfirming = confirmingRemoveEmail === user.email;

                        return (
                          <tr key={user.id || user.email} className="hover:bg-emerald-500/[0.04] transition">
                            {/* 1. Serial Number */}
                            <td className="py-3.5 px-4 text-center font-mono text-slate-400 text-xs font-bold">
                              {idx + 1}
                            </td>

                            {/* 2. Gmail */}
                            <td className="py-3.5 px-4 font-bold text-white">
                              {user.email}
                            </td>

                            {/* 3. Transaction ID */}
                            <td className="py-3.5 px-4 font-mono font-bold text-amber-300">
                              {user.payment?.transactionId || '—'}
                            </td>

                            {/* 4. Payment Amount */}
                            <td className="py-3.5 px-4 font-extrabold text-cyan-300">
                              ${user.payment?.amount || 30} USD
                            </td>

                            {/* 5. Payment Method */}
                            <td className="py-3.5 px-4 text-slate-300">
                              {user.payment?.method || 'Direct'}
                            </td>

                            {/* 6. Active Date */}
                            <td className="py-3.5 px-4 text-xs text-slate-300">
                              {user.activeDate || (user.activeAt ? new Date(user.activeAt).toLocaleDateString() : '—')}
                            </td>

                            {/* 7. Active Duration */}
                            <td className="py-3.5 px-4 text-xs font-bold text-emerald-400">
                              {duration}
                            </td>

                            {/* 8. Status */}
                            <td className="py-3.5 px-4 text-center">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50">
                                <Check className="w-3.5 h-3.5" />
                                ACTIVE
                              </span>
                            </td>

                            {/* 9. Action: Remove Button */}
                            <td className="py-3.5 px-4 text-center">
                              {isConfirming ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleRemoveActive(user.email)}
                                    className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold shadow hover:bg-rose-500 transition cursor-pointer"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => setConfirmingRemoveEmail(null)}
                                    className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmingRemoveEmail(user.email)}
                                  disabled={actionLoadingEmail === user.email}
                                  className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 font-bold text-xs transition cursor-pointer flex items-center gap-1 mx-auto"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  Remove
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DISABLED USERS SECTION */}
        {activeTab === 'disabled' && (
          <div id="section-disabled-users" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserX className="w-5 h-5 text-rose-400" />
                  Disabled & Revoked Users
                </h3>
                <p className="text-xs text-rose-200/80">
                  Accounts whose Pro Future permissions have been removed or rejected
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                {disabledCount} Disabled
              </span>
            </div>

            <div className="rounded-2xl border border-rose-500/30 bg-[#070919] overflow-hidden shadow-[0_0_35px_rgba(244,63,94,0.15)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm border-collapse min-w-[850px]">
                  <thead>
                    <tr className="bg-[#240a13] border-b border-rose-500/30 text-rose-300 uppercase text-[11px] font-bold tracking-wider">
                      <th className="py-3.5 px-4 w-12 text-center">#</th>
                      <th className="py-3.5 px-4">Gmail</th>
                      <th className="py-3.5 px-4">Transaction ID</th>
                      <th className="py-3.5 px-4">Previous Active Date</th>
                      <th className="py-3.5 px-4">Disabled Date</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-sans">
                    {filterList(disabledUsers).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          No disabled users
                        </td>
                      </tr>
                    ) : (
                      filterList(disabledUsers).map((user, idx) => (
                        <tr key={user.id || user.email} className="hover:bg-rose-500/[0.04] transition">
                          {/* 1. Serial Number */}
                          <td className="py-3.5 px-4 text-center font-mono text-slate-400 text-xs font-bold">
                            {idx + 1}
                          </td>

                          {/* 2. Gmail */}
                          <td className="py-3.5 px-4 font-bold text-white">
                            {user.email}
                          </td>

                          {/* 3. Transaction ID */}
                          <td className="py-3.5 px-4 font-mono text-amber-300/80">
                            {user.payment?.transactionId || '—'}
                          </td>

                          {/* 4. Previous Active Date */}
                          <td className="py-3.5 px-4 text-xs text-slate-400">
                            {user.activeDate || (user.activeAt ? new Date(user.activeAt).toLocaleDateString() : '—')}
                          </td>

                          {/* 5. Disabled Date */}
                          <td className="py-3.5 px-4 text-xs text-rose-300">
                            {user.disabledDate || (user.disabledAt ? new Date(user.disabledAt).toLocaleDateString() : '—')}
                          </td>

                          {/* 6. Status */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/50">
                              DISABLED
                            </span>
                          </td>

                          {/* 7. Action: Restore / Re-activate */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleApprove(user.email)}
                              disabled={actionLoadingEmail === user.email}
                              className="px-3.5 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-bold transition cursor-pointer flex items-center gap-1 mx-auto"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Re-activate
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
