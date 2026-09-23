import React, { useState, useMemo } from 'react';
import { User, Page, PaymentRequest, AdminAuditLog, AuditActionType } from '../types';
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
  ShieldAlert,
  ArrowRight,
  Filter,
  ArrowUpDown,
  LayoutDashboard,
  Crown,
  Lock,
  Unlock,
  Copy,
  ExternalLink,
  Layers,
  Activity,
  UserCheck,
  ScrollText,
  History,
  FileText,
  Shield,
} from 'lucide-react';

interface AdminPanelProps {
  users: User[];
  paymentRequests?: PaymentRequest[];
  auditLogs?: AdminAuditLog[];
  onAcceptUser?: (email: string, userName?: string) => void;
  onActivateProUser?: (email: string, userName?: string) => void;
  onApproveUser: (email: string, userName?: string) => void;
  onRejectUser: (email: string, userName?: string) => void;
  onRemoveUser: (email: string, userName?: string) => void;
  onRemoveAllApproved?: () => void;
  onNavigate: (page: Page) => void;
  onLogoutAdmin: () => void;
}

type TabType = 'dashboard' | 'pending' | 'accepted' | 'proActive' | 'disabled' | 'all' | 'auditLogs';
type SortOrder = 'newest' | 'oldest';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  users,
  paymentRequests = [],
  auditLogs = [],
  onAcceptUser,
  onActivateProUser,
  onApproveUser,
  onRejectUser,
  onRemoveUser,
  onRemoveAllApproved,
  onNavigate,
  onLogoutAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [auditActionFilter, setAuditActionFilter] = useState<'ALL' | AuditActionType>('ALL');
  const [confirmingRemoveUser, setConfirmingRemoveUser] = useState<User | null>(null);
  const [actionLoadingEmail, setActionLoadingEmail] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [proActiveViewMode, setProActiveViewMode] = useState<'cards' | 'table'>('cards');

  // Helper to extract clean human-readable name
  const getUserDisplayName = (u: { name?: string; email: string }) => {
    if (u.name && u.name.trim()) return u.name.trim();
    const prefix = (u.email || '').split('@')[0] || 'User';
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  };

  // Copy to clipboard helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Deduplicate and sanitize user list from Firestore (by lowercase clean email)
  const sanitizedUsers = useMemo(() => {
    const map = new Map<string, User>();
    for (const u of users) {
      const email = (u.email || '').trim().toLowerCase();
      if (!email || email.includes('admin@tradelens') || email === 'limon2581444@gmail.com') continue;

      if (!map.has(email)) {
        map.set(email, { ...u, email });
      } else {
        const prev = map.get(email)!;
        const statusWeight: Record<string, number> = {
          active: 5,
          approved: 5,
          accepted: 4,
          pending: 3,
          disabled: 2,
          removed: 1,
          unpaid: 0,
        };
        const curScore = (statusWeight[u.status] ?? 0) + (u.payment ? 5 : 0);
        const prevScore = (statusWeight[prev.status] ?? 0) + (prev.payment ? 5 : 0);
        if (curScore >= prevScore) {
          map.set(email, { ...u, email });
        }
      }
    }
    return Array.from(map.values());
  }, [users]);

  // Merge paymentRequests collection data to ensure Transaction ID, amount, and date are always present
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
        name: u.name || pr.userName || getUserDisplayName(u),
        payment: u.payment || {
          amount: pr.amount,
          method: pr.method,
          transactionId: pr.transactionId,
          date: pr.date,
        },
      };
    });
  }, [sanitizedUsers, paymentRequests]);

  // Categorize user segments
  const pendingUsers = useMemo(() => {
    return enrichedUsers.filter((u) => u.status === 'pending');
  }, [enrichedUsers]);

  const acceptedUsers = useMemo(() => {
    return enrichedUsers.filter((u) => u.status === 'accepted');
  }, [enrichedUsers]);

  const proActiveUsers = useMemo(() => {
    return enrichedUsers.filter(
      (u) =>
        (u.status === 'active' || u.status === 'approved') &&
        u.status !== 'accepted' &&
        u.status !== 'pending' &&
        u.status !== 'disabled' &&
        u.status !== 'removed' &&
        u.status !== 'unpaid' &&
        u.proAccess === true
    );
  }, [enrichedUsers]);

  const disabledUsers = useMemo(() => {
    return enrichedUsers.filter((u) => u.status === 'disabled' || u.status === 'removed');
  }, [enrichedUsers]);

  const totalUsersCount = enrichedUsers.length;
  const pendingCount = pendingUsers.length;
  const acceptedCount = acceptedUsers.length;
  const proActiveCount = proActiveUsers.length;
  const disabledCount = disabledUsers.length;
  const totalPaymentRequestsCount = enrichedUsers.filter((u) => !!u.payment).length;

  // Search & Sorting filter logic
  const processList = (list: User[]) => {
    let result = [...list];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter((u) => {
        const email = u.email.toLowerCase();
        const name = getUserDisplayName(u).toLowerCase();
        const trx = (u.payment?.transactionId || '').toLowerCase();
        const method = (u.payment?.method || '').toLowerCase();
        return email.includes(term) || name.includes(term) || trx.includes(term) || method.includes(term);
      });
    }

    result.sort((a, b) => {
      const dateA = new Date(a.activeAt || a.createdAt || a.created || 0).getTime();
      const dateB = new Date(b.activeAt || b.createdAt || b.created || 0).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  };

  // Filtered and sorted Audit Logs
  const filteredAuditLogs = useMemo(() => {
    let list = [...(auditLogs || [])];
    if (auditActionFilter !== 'ALL') {
      list = list.filter((log) => log.action === auditActionFilter);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (log) =>
          (log.targetUserEmail || '').toLowerCase().includes(q) ||
          (log.targetUserName || '').toLowerCase().includes(q) ||
          (log.adminEmail || '').toLowerCase().includes(q) ||
          (log.action || '').toLowerCase().includes(q) ||
          (log.details || '').toLowerCase().includes(q)
      );
    }
    if (sortOrder === 'oldest') {
      list = [...list].reverse();
    }
    return list;
  }, [auditLogs, auditActionFilter, searchTerm, sortOrder]);

  // Handlers for approval, accept, activate pro, remove and re-activate
  const handleAccept = async (email: string, userName?: string) => {
    setActionLoadingEmail(email);
    try {
      if (onAcceptUser) {
        await onAcceptUser(email, userName);
      } else {
        await onApproveUser(email, userName);
      }
    } finally {
      setActionLoadingEmail(null);
    }
  };

  const handleActivatePro = async (email: string, userName?: string) => {
    setActionLoadingEmail(email);
    try {
      if (onActivateProUser) {
        await onActivateProUser(email, userName);
      } else {
        await onApproveUser(email, userName);
      }
    } finally {
      setActionLoadingEmail(null);
    }
  };

  const handleApprove = async (email: string, userName?: string) => {
    setActionLoadingEmail(email);
    try {
      await onApproveUser(email, userName);
    } finally {
      setActionLoadingEmail(null);
    }
  };

  const handleDisableOrReject = async (email: string, userName?: string) => {
    setActionLoadingEmail(email);
    try {
      await onRejectUser(email, userName);
    } finally {
      setActionLoadingEmail(null);
    }
  };

  const handleConfirmRemove = async (email: string, userName?: string) => {
    setActionLoadingEmail(email);
    try {
      await onRemoveUser(email, userName);
      setConfirmingRemoveUser(null);
    } finally {
      setActionLoadingEmail(null);
    }
  };

  return (
    <div id="admin-panel" className="min-h-screen bg-[#030611] text-white p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-purple-500/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#763cff] to-[#c022ff] shadow-[0_0_25px_rgba(180,30,255,0.4)]">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-2xl font-black tracking-wider text-white">
                  TRADE <span className="text-purple-400">LENS</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/50 uppercase tracking-wider">
                  Admin Panel
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Firebase Real-Time Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Centralized clearance, Pro Future bot activations, and real-time member governance
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

        {/* TOP SUMMARY CARDS (Clickable for instant navigation) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {/* 1. Total Users */}
          <button
            onClick={() => setActiveTab('all')}
            className={`p-4 md:p-5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
              activeTab === 'all'
                ? 'bg-[#12092a] border-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.25)]'
                : 'bg-[#090b1a] border-white/10 hover:border-purple-500/40'
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

          {/* 2. Pending Requests */}
          <button
            onClick={() => setActiveTab('pending')}
            className={`p-4 md:p-5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between relative overflow-hidden ${
              activeTab === 'pending'
                ? 'bg-[#1d1405] border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.25)]'
                : 'bg-[#090b1a] border-white/10 hover:border-amber-500/40'
            }`}
          >
            {pendingCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Pending Requests</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-amber-300">{pendingCount}</p>
              <p className="text-[11px] text-amber-200/70 mt-1">Awaiting verification</p>
            </div>
          </button>

          {/* 3. ACCEPTED / READY TO ACTIVATE (New 2-Step Stage) */}
          <button
            onClick={() => setActiveTab('accepted')}
            className={`p-4 md:p-5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between relative overflow-hidden ${
              activeTab === 'accepted'
                ? 'bg-[#06182c] border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.35)]'
                : 'bg-[#061220] border-cyan-500/30 hover:border-cyan-400/60'
            }`}
          >
            {acceptedCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            )}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                Accepted / Ready
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40">
                PENDING ACTIVATE
              </span>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-cyan-300">{acceptedCount}</p>
              <p className="text-[11px] text-cyan-200/70 mt-1">Waiting manual activation</p>
            </div>
          </button>

          {/* 4. PRO ACTIVE USERS (Highlighted) */}
          <button
            onClick={() => setActiveTab('proActive')}
            className={`p-4 md:p-5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between relative overflow-hidden ${
              activeTab === 'proActive'
                ? 'bg-[#061d15] border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.35)]'
                : 'bg-[#061410] border-emerald-500/30 hover:border-emerald-400/60'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                PRO ACTIVE
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-emerald-300">{proActiveCount}</p>
              <p className="text-[11px] text-emerald-200/70 mt-1">Pro Future unlocked</p>
            </div>
          </button>

          {/* 5. Disabled Users */}
          <button
            onClick={() => setActiveTab('disabled')}
            className={`p-4 md:p-5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
              activeTab === 'disabled'
                ? 'bg-[#1e0811] border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.25)]'
                : 'bg-[#090b1a] border-white/10 hover:border-rose-500/40'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Disabled Users</span>
              <UserX className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-rose-300">{disabledCount}</p>
              <p className="text-[11px] text-rose-200/70 mt-1">Access restricted</p>
            </div>
          </button>

          {/* 6. Admin Audit Log Events */}
          <button
            onClick={() => setActiveTab('auditLogs')}
            className={`p-4 md:p-5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
              activeTab === 'auditLogs'
                ? 'bg-[#041c2c] border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.3)]'
                : 'bg-[#090b1a] border-white/10 hover:border-cyan-500/40'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Audit Logs</span>
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-cyan-300">{(auditLogs || []).length}</p>
              <p className="text-[11px] text-cyan-200/70 mt-1">Recorded events</p>
            </div>
          </button>
        </div>

        {/* NAVIGATION SECTIONS (7 TABS) + SEARCH & SORT */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pt-2">
          {/* Tabs bar */}
          <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-[#090c1f] border border-white/10">
            {/* 1. Dashboard */}
            <button
              id="tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>

            {/* 2. Pending Requests */}
            <button
              id="tab-pending-requests"
              onClick={() => setActiveTab('pending')}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Clock className="w-4 h-4" />
              Pending ({pendingCount})
            </button>

            {/* 3. Accepted / Ready to Activate */}
            <button
              id="tab-accepted-users"
              onClick={() => setActiveTab('accepted')}
              className={`px-3.5 py-2 rounded-xl font-black text-xs md:text-sm flex items-center gap-2 transition cursor-pointer relative ${
                activeTab === 'accepted'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                  : 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/30 border border-cyan-500/20'
              }`}
            >
              <UserCheck className="w-4 h-4 text-cyan-300" />
              Accepted / Ready ({acceptedCount})
              {acceptedCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping ml-0.5" />
              )}
            </button>

            {/* 4. PRO ACTIVE */}
            <button
              id="tab-pro-active"
              onClick={() => setActiveTab('proActive')}
              className={`px-4 py-2 rounded-xl font-black text-xs md:text-sm flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'proActive'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30 border border-emerald-500/20'
              }`}
            >
              <Crown className="w-4 h-4 text-amber-300" />
              PRO ACTIVE ({proActiveCount})
            </button>

            {/* 5. Disabled Users */}
            <button
              id="tab-disabled-users"
              onClick={() => setActiveTab('disabled')}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'disabled'
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserX className="w-4 h-4" />
              Disabled ({disabledCount})
            </button>

            {/* 6. All Users */}
            <button
              id="tab-all-users"
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4" />
              All Users ({totalUsersCount})
            </button>

            {/* 7. Admin Audit Log */}
            <button
              id="tab-audit-logs"
              onClick={() => setActiveTab('auditLogs')}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'auditLogs'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                  : 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/30 border border-cyan-500/20'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-cyan-300" />
              Audit Logs ({(auditLogs || []).length})
            </button>
          </div>

          {/* Search box & Sort */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Name, Gmail, TrxID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#090c1f] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
              className="h-10 px-3 rounded-xl bg-[#090c1f] border border-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
              title="Toggle sorting order"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-purple-400" />
              <span>{sortOrder === 'newest' ? 'Newest' : 'Oldest'}</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 1: DASHBOARD OVERVIEW */}
        {/* ========================================================================= */}
        {activeTab === 'dashboard' && (
          <div id="admin-dashboard-view" className="space-y-6">
            {/* System Status Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0d1430] via-[#0b0f24] to-[#120826] border border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Trade Lens Management Engine
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      OPERATIONAL
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time cross-device sync active. Pro Future licenses automatically unlock upon admin verification.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                <button
                  onClick={() => setActiveTab('pending')}
                  className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Review Pending ({pendingCount})
                </button>
                <button
                  onClick={() => setActiveTab('accepted')}
                  className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                >
                  <UserCheck className="w-3.5 h-3.5 text-cyan-300" />
                  Ready to Activate ({acceptedCount})
                </button>
                <button
                  onClick={() => setActiveTab('proActive')}
                  className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-300" />
                  View PRO ACTIVE ({proActiveCount})
                </button>
              </div>
            </div>

            {/* Quick Overview Bento Grid: 3 Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Box 1: Recent Pending Requests */}
              <div className="p-5 rounded-2xl bg-[#070919] border border-amber-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-400" />
                    <h4 className="font-bold text-sm text-white">Pending Requests</h4>
                  </div>
                  <button
                    onClick={() => setActiveTab('pending')}
                    className="text-xs text-amber-300 hover:underline flex items-center gap-1 font-semibold"
                  >
                    View All ({pendingCount}) <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {pendingUsers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No pending payment requests right now
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {pendingUsers.slice(0, 3).map((user) => (
                      <div
                        key={user.id || user.email}
                        className="p-3 rounded-xl bg-[#0e122b] border border-white/5 flex items-center justify-between gap-3 hover:border-amber-500/30 transition"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{getUserDisplayName(user)}</p>
                          <p className="text-[11px] text-slate-400 font-mono truncate">{user.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-amber-300 font-mono">
                              Trx: {user.payment?.transactionId || '—'}
                            </span>
                            <span className="text-[10px] text-cyan-300 font-bold">
                              ${user.payment?.amount || 30} USD
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleAccept(user.email, getUserDisplayName(user))}
                            disabled={actionLoadingEmail === user.email}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
                            title="Accept payment proof & move to Ready to Activate"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDisableOrReject(user.email, getUserDisplayName(user))}
                            disabled={actionLoadingEmail === user.email}
                            className="px-2 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/40 text-xs font-semibold transition cursor-pointer"
                            title="Reject payment"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Box 2: Accepted / Ready to Activate (NEW) */}
              <div className="p-5 rounded-2xl bg-[#061220] border border-cyan-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-cyan-400" />
                    <h4 className="font-bold text-sm text-white">Ready to Activate</h4>
                  </div>
                  <button
                    onClick={() => setActiveTab('accepted')}
                    className="text-xs text-cyan-300 hover:underline flex items-center gap-1 font-semibold"
                  >
                    View All ({acceptedCount}) <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {acceptedUsers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No accepted users waiting for activation
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {acceptedUsers.slice(0, 3).map((user) => (
                      <div
                        key={user.id || user.email}
                        className="p-3 rounded-xl bg-[#041a2e] border border-cyan-500/20 flex items-center justify-between gap-3 hover:border-cyan-500/50 transition"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-white truncate">{getUserDisplayName(user)}</p>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              READY
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono truncate">{user.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-cyan-300 font-bold">
                              ${user.payment?.amount || 30} USD
                            </span>
                            <span className="text-[10px] text-rose-300 font-semibold">
                              🔒 Locked
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleActivatePro(user.email, getUserDisplayName(user))}
                            disabled={actionLoadingEmail === user.email}
                            className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-black text-xs transition cursor-pointer flex items-center gap-1"
                            title="Activate Pro Future license now"
                          >
                            <Crown className="w-3 h-3 text-amber-900" />
                            Activate
                          </button>
                          <button
                            onClick={() => handleDisableOrReject(user.email, getUserDisplayName(user))}
                            disabled={actionLoadingEmail === user.email}
                            className="px-2 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-semibold transition cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Box 3: Recent PRO ACTIVE Members */}
              <div className="p-5 rounded-2xl bg-[#070919] border border-emerald-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-emerald-400" />
                    <h4 className="font-bold text-sm text-white">Active Pro Future</h4>
                  </div>
                  <button
                    onClick={() => setActiveTab('proActive')}
                    className="text-xs text-emerald-300 hover:underline flex items-center gap-1 font-semibold"
                  >
                    View All ({proActiveCount}) <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {proActiveUsers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No active Pro Future members yet
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {proActiveUsers.slice(0, 3).map((user) => (
                      <div
                        key={user.id || user.email}
                        className="p-3 rounded-xl bg-[#071912] border border-emerald-500/20 flex items-center justify-between gap-3 hover:border-emerald-500/50 transition"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-white truncate">{getUserDisplayName(user)}</p>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              ACTIVE
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono truncate">{user.email}</p>
                          <p className="text-[10px] text-emerald-400 mt-0.5 font-semibold">
                            {calculateActiveDuration(user.activeAt, user.activeDate)}
                          </p>
                        </div>

                        <button
                          onClick={() => setConfirmingRemoveUser(user)}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold transition cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Third Box: Recent Security Audit Activity */}
            <div className="p-5 rounded-2xl bg-[#050e1f] border border-cyan-500/30 space-y-4 shadow-[0_0_35px_rgba(6,182,212,0.1)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      Recent Security Audit Events
                      <span className="px-2 py-0.5 rounded text-[9px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                        Real-Time
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Live immutable log of administrative access, approvals, removals, and license status modifications
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('auditLogs')}
                  className="text-xs text-cyan-300 hover:text-cyan-200 flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 transition cursor-pointer self-start sm:self-auto"
                >
                  View Full Audit Log ({(auditLogs || []).length}) <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {(auditLogs || []).length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 bg-[#091224] rounded-xl border border-white/5">
                  No administrative actions logged yet. Any actions like Accept, Remove, or Disable will automatically appear here.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(auditLogs || []).slice(0, 3).map((log, idx) => (
                    <div
                      key={log.id || idx}
                      className="p-3.5 rounded-xl bg-[#09152b] border border-cyan-500/20 space-y-2 hover:border-cyan-500/50 transition flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            log.action === 'ACCEPT' || log.action === 'RE-ACTIVATE'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : log.action === 'REMOVE' || log.action === 'BULK_REMOVE'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {log.action}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                      </div>
                      <div className="text-xs space-y-1">
                        <p className="text-slate-400 text-[11px] truncate">
                          Target: <span className="text-white font-mono font-medium">{log.targetUserEmail}</span>
                        </p>
                        <p className="text-slate-400 text-[10px] truncate">
                          Admin: <span className="text-cyan-300 font-mono">{log.adminEmail}</span>
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-300 font-sans italic line-clamp-2 border-t border-white/5 pt-2">
                        {log.details}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 2: PENDING REQUESTS */}
        {/* ========================================================================= */}
        {activeTab === 'pending' && (
          <div id="section-pending-requests" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  Pending Payment Requests
                </h3>
                <p className="text-xs text-amber-200/80 mt-0.5">
                  Users who submitted payment proof awaiting manual approval. Accepting automatically promotes user to PRO ACTIVE.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 self-start sm:self-auto">
                {pendingCount} Pending
              </span>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-[#070919] overflow-hidden shadow-[0_0_35px_rgba(245,158,11,0.12)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm border-collapse min-w-[950px]">
                  <thead>
                    <tr className="bg-[#1b1405] border-b border-amber-500/30 text-amber-300 uppercase text-[11px] font-bold tracking-wider">
                      <th className="py-3.5 px-4 w-12 text-center">#</th>
                      <th className="py-3.5 px-4">User Name</th>
                      <th className="py-3.5 px-4">Gmail</th>
                      <th className="py-3.5 px-4">Payment Method</th>
                      <th className="py-3.5 px-4">Transaction ID</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Request Date</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-sans">
                    {processList(pendingUsers).length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-500">
                          {searchTerm ? 'No pending requests match your search' : 'No pending payment requests right now'}
                        </td>
                      </tr>
                    ) : (
                      processList(pendingUsers).map((user, idx) => (
                        <tr key={user.id || user.email} className="hover:bg-amber-500/[0.04] transition">
                          {/* 1. Serial Number */}
                          <td className="py-3.5 px-4 text-center font-mono text-slate-400 text-xs font-bold">
                            {idx + 1}
                          </td>

                          {/* 2. User Name */}
                          <td className="py-3.5 px-4 font-bold text-white">
                            {getUserDisplayName(user)}
                          </td>

                          {/* 3. Gmail */}
                          <td className="py-3.5 px-4 font-mono text-slate-300">
                            {user.email}
                          </td>

                          {/* 4. Payment Method */}
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                              {user.payment?.method || 'Binance'}
                            </span>
                          </td>

                          {/* 5. Transaction ID */}
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-300">
                            <span className="flex items-center gap-1">
                              {user.payment?.transactionId || '—'}
                              {user.payment?.transactionId && (
                                <button
                                  onClick={() => handleCopy(user.payment!.transactionId!, `pending-${idx}`)}
                                  className="text-slate-400 hover:text-white ml-1"
                                  title="Copy TrxID"
                                >
                                  {copiedId === `pending-${idx}` ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </span>
                          </td>

                          {/* 6. Amount */}
                          <td className="py-3.5 px-4 font-extrabold text-cyan-300">
                            ${user.payment?.amount || 30} USD
                          </td>

                          {/* 7. Request Date */}
                          <td className="py-3.5 px-4 text-xs text-slate-300">
                            {user.payment?.date || user.created || 'Recent'}
                          </td>

                          {/* 8. Status */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                              PENDING
                            </span>
                          </td>

                          {/* 9. Actions: ACCEPT & REMOVE/REJECT */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleAccept(user.email, getUserDisplayName(user))}
                                disabled={actionLoadingEmail === user.email}
                                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                                title="Accept payment request (Moves to Accepted / Waiting for Activation without unlocking)"
                              >
                                <Check className="w-3.5 h-3.5" />
                                ACCEPT
                              </button>
                              <button
                                onClick={() => handleDisableOrReject(user.email, getUserDisplayName(user))}
                                disabled={actionLoadingEmail === user.email}
                                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 font-bold text-xs transition cursor-pointer flex items-center gap-1"
                                title="Reject payment request"
                              >
                                <X className="w-3.5 h-3.5" />
                                REMOVE / REJECT
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

        {/* ========================================================================= */}
        {/* SECTION 2.5: ACCEPTED / READY TO ACTIVATE (MANUAL 2-STEP ACTIVATION) */}
        {/* ========================================================================= */}
        {activeTab === 'accepted' && (
          <div id="section-accepted-users" className="space-y-5">
            {/* Header with glowing badge and controls */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-[#041224] via-[#071c36] to-[#041224] border border-cyan-400/40 shadow-[0_0_40px_rgba(6,182,212,0.2)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-[0_0_25px_rgba(6,182,212,0.5)]">
                  <UserCheck className="w-8 h-8 text-cyan-200" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-black tracking-wider text-white">
                      ACCEPTED / READY TO ACTIVATE
                    </h3>
                    <span className="px-3 py-0.5 rounded-full text-xs font-black bg-amber-400 text-black shadow-sm uppercase tracking-wider">
                      WAITING FOR ACTIVATION
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      PRO FUTURE LOCKED
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/50">
                      {acceptedCount} User{acceptedCount !== 1 ? 's' : ''} Ready
                    </span>
                  </div>
                  <p className="text-xs text-cyan-200/80 mt-1">
                    Payments verified and accepted by Admin. Pro Future access is <strong>NOT</strong> active yet. Click <strong className="text-emerald-300">&quot;ACTIVATE PRO&quot;</strong> to grant full access and start the user&apos;s Pro subscription.
                  </p>
                </div>
              </div>

              {pendingCount > 0 && (
                <button
                  onClick={() => setActiveTab('pending')}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Review Pending ({pendingCount})
                </button>
              )}
            </div>

            {/* Table Container */}
            <div className="rounded-2xl border border-cyan-500/30 bg-[#060e1d] overflow-hidden shadow-[0_0_35px_rgba(6,182,212,0.12)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-[#04182c] border-b border-cyan-500/30 text-cyan-300 uppercase text-[11px] font-bold tracking-wider">
                      <th className="py-3.5 px-4 w-12 text-center">#</th>
                      <th className="py-3.5 px-4">Name</th>
                      <th className="py-3.5 px-4">Gmail</th>
                      <th className="py-3.5 px-4">Transaction ID</th>
                      <th className="py-3.5 px-4">Payment Method</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Accepted Date</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-center">Pro Future</th>
                      <th className="py-3.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-sans">
                    {processList(acceptedUsers).length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-400">
                          <div className="space-y-2">
                            <UserCheck className="w-10 h-10 text-slate-600 mx-auto" />
                            <p className="text-sm font-semibold text-slate-300">
                              {searchTerm ? 'No accepted users match your search query' : 'No users currently waiting for activation'}
                            </p>
                            <p className="text-xs text-slate-500 max-w-md mx-auto">
                              When an Admin clicks &quot;Accept&quot; on a Pending Request, the user is moved here with Pro Future still locked. Click &quot;ACTIVATE PRO&quot; to give them full Pro Active status.
                            </p>
                            {pendingCount > 0 && (
                              <button
                                onClick={() => setActiveTab('pending')}
                                className="mt-3 px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs shadow hover:brightness-110 transition cursor-pointer"
                              >
                                Review Pending Requests ({pendingCount})
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      processList(acceptedUsers).map((user, idx) => (
                        <tr key={user.id || user.email} className="hover:bg-cyan-500/[0.04] transition">
                          {/* 1. Serial Number */}
                          <td className="py-3.5 px-4 text-center font-mono text-slate-400 text-xs font-bold">
                            {idx + 1}
                          </td>

                          {/* 2. Name */}
                          <td className="py-3.5 px-4 font-bold text-white">
                            {getUserDisplayName(user)}
                          </td>

                          {/* 3. Gmail */}
                          <td className="py-3.5 px-4 font-mono text-slate-300">
                            {user.email}
                          </td>

                          {/* 4. Transaction ID */}
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-300">
                            <span className="flex items-center gap-1">
                              {user.payment?.transactionId || '—'}
                              {user.payment?.transactionId && (
                                <button
                                  onClick={() => handleCopy(user.payment!.transactionId!, `accepted-${idx}`)}
                                  className="text-slate-400 hover:text-white ml-1"
                                  title="Copy TrxID"
                                >
                                  {copiedId === `accepted-${idx}` ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </span>
                          </td>

                          {/* 5. Payment Method */}
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                              {user.payment?.method || 'Binance'}
                            </span>
                          </td>

                          {/* 6. Amount */}
                          <td className="py-3.5 px-4 font-extrabold text-cyan-300">
                            ${user.payment?.amount || 30} USD
                          </td>

                          {/* 7. Accepted Date */}
                          <td className="py-3.5 px-4 text-xs text-slate-300">
                            {user.acceptedDate || user.payment?.date || user.created || 'Recently'}
                          </td>

                          {/* 8. Status */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                              ACCEPTED
                            </span>
                          </td>

                          {/* 9. Pro Future (LOCKED) */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              <Lock className="w-3 h-3" />
                              LOCKED
                            </span>
                          </td>

                          {/* 10. Actions: ACTIVATE PRO & REMOVE/REJECT */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleActivatePro(user.email, getUserDisplayName(user))}
                                disabled={actionLoadingEmail === user.email}
                                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:brightness-110 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)] transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                                title="Grant Pro Future License & Move to PRO ACTIVE"
                              >
                                <Crown className="w-3.5 h-3.5 text-amber-900" />
                                ACTIVATE PRO
                              </button>
                              <button
                                onClick={() => handleDisableOrReject(user.email, getUserDisplayName(user))}
                                disabled={actionLoadingEmail === user.email}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 font-bold text-xs transition cursor-pointer flex items-center gap-1"
                                title="Reject & Move to Disabled"
                              >
                                <X className="w-3.5 h-3.5" />
                                Reject
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

        {/* ========================================================================= */}
        {/* SECTION 3: PRO ACTIVE (NEW DEDICATED MANAGEMENT SECTION) */}
        {/* ========================================================================= */}
        {activeTab === 'proActive' && (
          <div id="section-pro-active" className="space-y-5">
            {/* Header with glowing badge and controls */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-[#041a12] via-[#062419] to-[#041a12] border border-emerald-400/40 shadow-[0_0_40px_rgba(16,185,129,0.2)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-[0_0_25px_rgba(16,185,129,0.5)]">
                  <Crown className="w-8 h-8 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-black tracking-wider text-white">
                      PRO ACTIVE SECTION
                    </h3>
                    <span className="px-3 py-0.5 rounded-full text-xs font-black bg-emerald-400 text-black shadow-sm uppercase tracking-wider">
                      PRO FUTURE UNLOCKED
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50">
                      {proActiveCount} Active Member{proActiveCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200/80 mt-1">
                    Verified traders with active Pro Future neural bot clearance. Removing a user here locks their license immediately.
                  </p>
                </div>
              </div>

              {/* View Switch & Mass action */}
              <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                <div className="p-1 rounded-xl bg-black/40 border border-emerald-500/30 flex items-center gap-1 text-xs">
                  <button
                    onClick={() => setProActiveViewMode('cards')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      proActiveViewMode === 'cards'
                        ? 'bg-emerald-500 text-black shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Cards View
                  </button>
                  <button
                    onClick={() => setProActiveViewMode('table')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      proActiveViewMode === 'table'
                        ? 'bg-emerald-500 text-black shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Table View
                  </button>
                </div>

                {proActiveCount > 0 && onRemoveAllApproved && (
                  <button
                    onClick={onRemoveAllApproved}
                    className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    Revoke All
                  </button>
                )}
              </div>
            </div>

            {/* Content: Cards View or Table View */}
            {processList(proActiveUsers).length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-[#070919] border border-white/10 space-y-3">
                <Crown className="w-12 h-12 text-slate-600 mx-auto" />
                <h4 className="text-base font-bold text-white">No PRO ACTIVE users found</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {searchTerm
                    ? 'No active users match your query. Try resetting the search filter.'
                    : 'When you accept pending payment requests, approved users will automatically appear in this PRO ACTIVE directory.'}
                </p>
                {pendingCount > 0 && (
                  <button
                    onClick={() => setActiveTab('pending')}
                    className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs shadow hover:brightness-110 transition cursor-pointer"
                  >
                    Go to Pending Requests ({pendingCount})
                  </button>
                )}
              </div>
            ) : proActiveViewMode === 'cards' ? (
              /* CARDS GRID VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {processList(proActiveUsers).map((user, idx) => {
                  const duration = calculateActiveDuration(user.activeAt, user.activeDate);
                  return (
                    <div
                      key={user.id || user.email}
                      className="p-5 rounded-2xl bg-gradient-to-b from-[#091b15] to-[#05110d] border border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.12)] hover:border-emerald-400/80 transition flex flex-col justify-between relative group"
                    >
                      {/* Top Row: Serial & Status Pills */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            #{idx + 1}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 uppercase tracking-wider flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              ACTIVE
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/50 uppercase tracking-wider">
                              UNLOCKED
                            </span>
                          </div>
                        </div>

                        {/* User Identity */}
                        <div className="mb-4">
                          <h4 className="text-base font-black text-white group-hover:text-emerald-300 transition">
                            {getUserDisplayName(user)}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5 text-xs font-mono text-slate-300">
                            <span className="truncate">{user.email}</span>
                            <button
                              onClick={() => handleCopy(user.email, `email-${idx}`)}
                              className="text-slate-500 hover:text-white"
                              title="Copy Email"
                            >
                              {copiedId === `email-${idx}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Key Attributes List */}
                        <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2 text-xs mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Payment:</span>
                            <span className="font-extrabold text-cyan-300">
                              ${user.payment?.amount || 30} USD
                              <span className="text-[10px] text-slate-400 font-normal ml-1">
                                ({user.payment?.method || 'Direct'})
                              </span>
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Transaction ID:</span>
                            <span className="font-mono text-amber-300 text-[11px] flex items-center gap-1">
                              {user.payment?.transactionId || '—'}
                              {user.payment?.transactionId && (
                                <button
                                  onClick={() => handleCopy(user.payment!.transactionId!, `trx-${idx}`)}
                                  className="text-slate-500 hover:text-white"
                                  title="Copy TrxID"
                                >
                                  {copiedId === `trx-${idx}` ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </span>
                          </div>

                          <div className="flex justify-between items-center border-t border-white/5 pt-1.5">
                            <span className="text-slate-400">Activated Date:</span>
                            <span className="text-slate-300 text-[11px]">
                              {user.activeDate || (user.activeAt ? new Date(user.activeAt).toLocaleDateString() : 'Active')}
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Active Duration:</span>
                            <span className="text-emerald-400 font-bold text-[11px]">
                              {duration}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* REMOVE BUTTON with Confirmation Modal trigger */}
                      <button
                        onClick={() => setConfirmingRemoveUser(user)}
                        disabled={actionLoadingEmail === user.email}
                        className="w-full py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <UserX className="w-4 h-4" />
                        Remove from PRO ACTIVE
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* TABLE VIEW */
              <div className="rounded-2xl border border-emerald-500/30 bg-[#070919] overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs md:text-sm border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="bg-[#072418] border-b border-emerald-500/30 text-emerald-300 uppercase text-[11px] font-bold tracking-wider">
                        <th className="py-3.5 px-4 w-12 text-center">#</th>
                        <th className="py-3.5 px-4">User Name</th>
                        <th className="py-3.5 px-4">Gmail</th>
                        <th className="py-3.5 px-4">Method</th>
                        <th className="py-3.5 px-4">Transaction ID</th>
                        <th className="py-3.5 px-4">Paid Amount</th>
                        <th className="py-3.5 px-4">Activated Date</th>
                        <th className="py-3.5 px-4">Active Duration</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                        <th className="py-3.5 px-4 text-center">Pro Future</th>
                        <th className="py-3.5 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-sans">
                      {processList(proActiveUsers).map((user, idx) => {
                        const duration = calculateActiveDuration(user.activeAt, user.activeDate);
                        return (
                          <tr key={user.id || user.email} className="hover:bg-emerald-500/[0.04] transition">
                            <td className="py-3.5 px-4 text-center font-mono text-slate-400 text-xs font-bold">
                              {idx + 1}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-white">
                              {getUserDisplayName(user)}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-300">
                              {user.email}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                {user.payment?.method || 'Direct'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-xs font-bold text-amber-300">
                              {user.payment?.transactionId || '—'}
                            </td>
                            <td className="py-3.5 px-4 font-extrabold text-cyan-300">
                              ${user.payment?.amount || 30} USD
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate-300">
                              {user.activeDate || (user.activeAt ? new Date(user.activeAt).toLocaleDateString() : 'Active')}
                            </td>
                            <td className="py-3.5 px-4 text-xs font-bold text-emerald-400">
                              {duration}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50">
                                <Check className="w-3 h-3" /> ACTIVE
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/50">
                                <Unlock className="w-3 h-3 text-cyan-300" /> UNLOCKED
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => setConfirmingRemoveUser(user)}
                                disabled={actionLoadingEmail === user.email}
                                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 font-bold text-xs transition cursor-pointer"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 4: DISABLED USERS */}
        {/* ========================================================================= */}
        {activeTab === 'disabled' && (
          <div id="section-disabled-users" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserX className="w-5 h-5 text-rose-400" />
                  Disabled Users Directory
                </h3>
                <p className="text-xs text-rose-200/80 mt-0.5">
                  Accounts whose Pro Future access was removed or rejected. They cannot use Pro Future unless re-activated by an administrator.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 self-start sm:self-auto">
                {disabledCount} Disabled
              </span>
            </div>

            <div className="rounded-2xl border border-rose-500/30 bg-[#070919] overflow-hidden shadow-[0_0_35px_rgba(244,63,94,0.12)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-[#240a13] border-b border-rose-500/30 text-rose-300 uppercase text-[11px] font-bold tracking-wider">
                      <th className="py-3.5 px-4 w-12 text-center">#</th>
                      <th className="py-3.5 px-4">User Name</th>
                      <th className="py-3.5 px-4">Gmail</th>
                      <th className="py-3.5 px-4">Transaction ID</th>
                      <th className="py-3.5 px-4">Previous Active Date</th>
                      <th className="py-3.5 px-4">Disabled Date</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-sans">
                    {processList(disabledUsers).length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500">
                          {searchTerm ? 'No disabled users match your search' : 'No disabled users in database'}
                        </td>
                      </tr>
                    ) : (
                      processList(disabledUsers).map((user, idx) => (
                        <tr key={user.id || user.email} className="hover:bg-rose-500/[0.04] transition">
                          <td className="py-3.5 px-4 text-center font-mono text-slate-400 text-xs font-bold">
                            {idx + 1}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-white">
                            {getUserDisplayName(user)}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-300">
                            {user.email}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-amber-300/80">
                            {user.payment?.transactionId || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-400">
                            {user.activeDate || (user.activeAt ? new Date(user.activeAt).toLocaleDateString() : '—')}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-rose-300">
                            {user.disabledDate || (user.disabledAt ? new Date(user.disabledAt).toLocaleDateString() : 'Recently')}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/50">
                              DISABLED
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleActivatePro(user.email, getUserDisplayName(user))}
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

        {/* ========================================================================= */}
        {/* SECTION 5: ALL USERS */}
        {/* ========================================================================= */}
        {activeTab === 'all' && (
          <div id="section-all-users" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  All Registered Users Directory
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete master database of all registered accounts, payment records, and privilege statuses.
                </p>
              </div>
              <span className="text-xs text-slate-400">
                Showing {processList(enrichedUsers).length} of {totalUsersCount} accounts
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#070919] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm border-collapse min-w-[1050px]">
                  <thead>
                    <tr className="bg-[#0e122b] border-b border-white/10 text-slate-400 uppercase text-[11px] font-bold tracking-wider">
                      <th className="py-3.5 px-4 w-12 text-center">#</th>
                      <th className="py-3.5 px-4">Name</th>
                      <th className="py-3.5 px-4">Gmail</th>
                      <th className="py-3.5 px-4">Password</th>
                      <th className="py-3.5 px-4">Created Date</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4">Payment</th>
                      <th className="py-3.5 px-4">Transaction ID</th>
                      <th className="py-3.5 px-4">Active Date</th>
                      <th className="py-3.5 px-4">Duration</th>
                      <th className="py-3.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-sans">
                    {processList(enrichedUsers).length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-slate-500">
                          No users found matching query
                        </td>
                      </tr>
                    ) : (
                      processList(enrichedUsers).map((user, idx) => {
                        const isActive = user.status === 'active' || user.status === 'approved';
                        const isAccepted = user.status === 'accepted';
                        const isPending = user.status === 'pending';
                        const isDisabled = user.status === 'disabled' || user.status === 'removed';
                        const duration = calculateActiveDuration(user.activeAt, user.activeDate);

                        return (
                          <tr key={user.id || user.email} className="hover:bg-white/[0.02] transition">
                            <td className="py-3.5 px-4 text-center font-mono text-slate-400 text-xs font-bold">
                              {idx + 1}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-white">
                              {getUserDisplayName(user)}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-300">
                              {user.email}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-800/80 text-slate-400 border border-slate-700/60">
                                🔒 Protected
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate-400">
                              {user.created || (user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—')}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {isActive ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 uppercase">
                                  ACTIVE
                                </span>
                              ) : isAccepted ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 uppercase">
                                  ACCEPTED
                                </span>
                              ) : isPending ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/50 uppercase">
                                  PENDING
                                </span>
                              ) : isDisabled ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/50 uppercase">
                                  DISABLED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-500/20 text-slate-300 border border-slate-500/50 uppercase">
                                  USER
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              {user.payment ? (
                                <div>
                                  <span className="font-bold text-cyan-300">${user.payment.amount}</span>
                                  <span className="text-[10px] text-slate-400 block">{user.payment.method}</span>
                                </div>
                              ) : (
                                <span className="text-slate-500 text-xs">Unpaid</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-xs text-amber-300/90">
                              {user.payment?.transactionId || '—'}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate-300">
                              {user.activeDate || (user.activeAt ? new Date(user.activeAt).toLocaleDateString() : '—')}
                            </td>
                            <td className="py-3.5 px-4 text-xs font-semibold text-emerald-400">
                              {isActive ? duration : '—'}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {isPending ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleAccept(user.email, getUserDisplayName(user))}
                                    disabled={actionLoadingEmail === user.email}
                                    className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition cursor-pointer"
                                    title="Accept payment proof & move to Ready to Activate"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleDisableOrReject(user.email, getUserDisplayName(user))}
                                    disabled={actionLoadingEmail === user.email}
                                    className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-semibold transition cursor-pointer"
                                  >
                                    Disable
                                  </button>
                                </div>
                              ) : isAccepted ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleActivatePro(user.email, getUserDisplayName(user))}
                                    disabled={actionLoadingEmail === user.email}
                                    className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-black text-xs shadow transition cursor-pointer flex items-center gap-1 whitespace-nowrap"
                                    title="Activate Pro Future license now"
                                  >
                                    <Crown className="w-3 h-3 text-amber-900" />
                                    Activate Pro
                                  </button>
                                  <button
                                    onClick={() => handleDisableOrReject(user.email, getUserDisplayName(user))}
                                    disabled={actionLoadingEmail === user.email}
                                    className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-semibold transition cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : isActive ? (
                                <button
                                  onClick={() => setConfirmingRemoveUser(user)}
                                  disabled={actionLoadingEmail === user.email}
                                  className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 font-bold text-xs transition cursor-pointer"
                                >
                                  Remove
                                </button>
                              ) : isDisabled ? (
                                <button
                                  onClick={() => handleActivatePro(user.email, getUserDisplayName(user))}
                                  disabled={actionLoadingEmail === user.email}
                                  className="px-3 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-bold transition cursor-pointer"
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

        {/* ========================================================================= */}
        {/* SECTION 6: ADMIN AUDIT LOG */}
        {/* ========================================================================= */}
        {activeTab === 'auditLogs' && (
          <div id="section-admin-audit-logs" className="space-y-4">
            {/* Header info bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-cyan-400" />
                  Admin Audit Log
                </h3>
                <p className="text-xs text-cyan-200/80 mt-0.5">
                  Permanent immutable security ledger recording all critical administrative actions (Accept, Remove, Disable, Re-activate) with timestamp, administrator ID, and target account.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  Firebase Audit Active ({(auditLogs || []).length} Recorded)
                </span>
              </div>
            </div>

            {/* Action Filter Pills Bar */}
            <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-[#070e1e] border border-cyan-500/20">
              <span className="text-xs font-bold text-slate-400 pl-2 pr-1 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-cyan-400" /> Filter Action:
              </span>

              {(['ALL', 'ACCEPT', 'ACTIVATE_PRO', 'REMOVE', 'DISABLE', 'RE-ACTIVATE', 'BULK_REMOVE'] as const).map((action) => {
                const count =
                  action === 'ALL'
                    ? (auditLogs || []).length
                    : (auditLogs || []).filter((l) => l.action === action).length;

                const isSelected = auditActionFilter === action;

                return (
                  <button
                    key={action}
                    onClick={() => setAuditActionFilter(action)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? action === 'ALL'
                          ? 'bg-cyan-600 text-white shadow-md'
                          : action === 'ACTIVATE_PRO' || action === 'RE-ACTIVATE'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : action === 'ACCEPT'
                          ? 'bg-cyan-600 text-white shadow-md'
                          : action === 'REMOVE' || action === 'BULK_REMOVE'
                          ? 'bg-rose-600 text-white shadow-md'
                          : 'bg-amber-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-white/5'
                    }`}
                  >
                    <span>{action === 'ALL' ? 'All Events' : action}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Table Container */}
            <div className="rounded-2xl border border-cyan-500/30 bg-[#060c1c] overflow-hidden shadow-[0_0_35px_rgba(6,182,212,0.1)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm border-collapse min-w-[950px]">
                  <thead>
                    <tr className="bg-[#041627] border-b border-cyan-500/30 text-cyan-300 uppercase text-[11px] font-bold tracking-wider">
                      <th className="py-3.5 px-4 w-12 text-center">#</th>
                      <th className="py-3.5 px-4">Action</th>
                      <th className="py-3.5 px-4">Timestamp</th>
                      <th className="py-3.5 px-4">Admin Email</th>
                      <th className="py-3.5 px-4">Target User Account</th>
                      <th className="py-3.5 px-4">Audit Details & License Impact</th>
                      <th className="py-3.5 px-4 text-center">Audit ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-sans">
                    {filteredAuditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center">
                          <div className="max-w-md mx-auto space-y-2">
                            <ShieldAlert className="w-10 h-10 text-cyan-400/40 mx-auto" />
                            <p className="text-sm font-bold text-slate-300">No audit records found</p>
                            <p className="text-xs text-slate-500">
                              {searchTerm || auditActionFilter !== 'ALL'
                                ? 'No logs match your current filter or search criteria. Try selecting "All Events" or clearing search.'
                                : 'Critical administrative operations (Accept, Activate Pro, Remove, Disable, Re-activate) will automatically be recorded here in real-time.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredAuditLogs.map((log, index) => {
                        const isActivatePro = log.action === 'ACTIVATE_PRO' || log.action === 'RE-ACTIVATE';
                        const isAccept = log.action === 'ACCEPT';
                        const isRemove = log.action === 'REMOVE' || log.action === 'BULK_REMOVE';
                        const isDisable = log.action === 'DISABLE';

                        return (
                          <tr
                            key={log.id || index}
                            className="hover:bg-white/[0.03] transition group"
                          >
                            {/* Serial Number */}
                            <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-xs">
                              #{index + 1}
                            </td>

                            {/* Action Badge */}
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black tracking-wide ${
                                  isActivatePro
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                                    : isAccept
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                                    : isRemove
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                }`}
                              >
                                {isActivatePro && <Crown className="w-3.5 h-3.5 text-amber-300" />}
                                {isAccept && <UserCheck className="w-3.5 h-3.5 text-cyan-300" />}
                                {isRemove && <UserX className="w-3.5 h-3.5" />}
                                {isDisable && <AlertCircle className="w-3.5 h-3.5" />}
                                {log.action}
                              </span>
                            </td>

                            {/* Timestamp */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-cyan-400/70" />
                                <div>
                                  <p className="font-mono text-xs text-white">{log.timestamp}</p>
                                </div>
                              </div>
                            </td>

                            {/* Admin Email */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-md bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <span className="font-mono text-xs text-purple-300 font-semibold">{log.adminEmail}</span>
                                  <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                    ADMIN
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Target User */}
                            <td className="py-3.5 px-4">
                              <div>
                                {log.targetUserName && (
                                  <p className="font-bold text-white text-xs">{log.targetUserName}</p>
                                )}
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-cyan-300 text-xs">{log.targetUserEmail}</span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard?.writeText(log.targetUserEmail);
                                      setCopiedId(`audit-${log.id || index}`);
                                      setTimeout(() => setCopiedId(null), 1500);
                                    }}
                                    className="text-slate-400 hover:text-white p-0.5 transition cursor-pointer"
                                    title="Copy target user email"
                                  >
                                    {copiedId === `audit-${log.id || index}` ? (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Details */}
                            <td className="py-3.5 px-4">
                              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                                {log.details}
                              </p>
                            </td>

                            {/* Audit ID */}
                            <td className="py-3.5 px-4 text-center">
                              <span className="font-mono text-[10px] text-slate-500 bg-white/5 px-2 py-1 rounded border border-white/5">
                                {log.id ? log.id.slice(0, 8) + '...' : 'auto-sync'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer with Summary Stats */}
              <div className="p-4 bg-[#041220] border-t border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Showing {filteredAuditLogs.length} of {(auditLogs || []).length} total audit log events</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Firebase Collection: <span className="font-mono text-cyan-300/80">auditLogs</span> (Real-Time Subscribed)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CONFIRMATION POPUP MODAL (FOR REMOVE FROM PRO ACTIVE) */}
        {/* ========================================================================= */}
        {confirmingRemoveUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="max-w-md w-full p-6 rounded-2xl bg-[#0e071e] border border-rose-500/50 shadow-[0_0_50px_rgba(244,63,94,0.3)] text-left space-y-4">
              <div className="flex items-center gap-3 text-rose-400">
                <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Remove User from PRO ACTIVE?</h4>
                  <p className="text-xs text-rose-300/80">Are you sure you want to remove this user?</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-300 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">User Name:</span>
                  <span className="font-bold text-white">{getUserDisplayName(confirmingRemoveUser)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Gmail:</span>
                  <span className="font-mono text-cyan-300">{confirmingRemoveUser.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Status:</span>
                  <span className="text-emerald-400 font-bold">ACTIVE (Pro Future Unlocked)</span>
                </div>
                <div className="pt-2 border-t border-white/10 text-[11px] text-rose-300/90 leading-relaxed">
                  ⚠️ <strong>Effect of removal:</strong> User status will become <strong>"Disabled"</strong>, Pro Future bot access will be <strong>immediately locked</strong>, and the user will be moved to the <strong>Disabled Users</strong> section. Their account record is safely preserved.
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmingRemoveUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmRemove(confirmingRemoveUser.email, getUserDisplayName(confirmingRemoveUser))}
                  disabled={actionLoadingEmail === confirmingRemoveUser.email}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:brightness-110 text-white text-xs font-bold shadow-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  <UserX className="w-4 h-4" />
                  Yes, Remove User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
