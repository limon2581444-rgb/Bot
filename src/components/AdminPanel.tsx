import React, { useState } from 'react';
import { User, Page } from '../types';
import { TrendingUp, ShieldCheck, LogOut, Check, X, Trash2, Search, ArrowLeft, RefreshCw, PlusCircle } from 'lucide-react';

interface AdminPanelProps {
  users: User[];
  onApproveUser: (email: string) => void;
  onRejectUser: (email: string) => void;
  onRemoveUser: (email: string) => void;
  onAddTestUser: () => void;
  onResetDemoData: () => void;
  onNavigate: (page: Page) => void;
  onLogoutAdmin: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  users,
  onApproveUser,
  onRejectUser,
  onRemoveUser,
  onAddTestUser,
  onResetDemoData,
  onNavigate,
  onLogoutAdmin,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const pendingUsers = users.filter((u) => u.status === 'pending');
  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              className="px-3.5 py-2 rounded-xl bg-[#0e172e] hover:bg-[#162447] border border-cyan-500/30 text-xs font-semibold text-cyan-300 flex items-center gap-1.5 transition"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              User Portal
            </button>

            <button
              id="admin-logout-btn"
              onClick={onLogoutAdmin}
              className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-xs font-semibold text-rose-300 flex items-center gap-1.5 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          <div className="p-4 rounded-xl bg-[#090b1c] border border-purple-800/40">
            <span className="text-xs text-slate-400 block mb-1">Total Users</span>
            <span className="text-2xl font-bold text-white">{users.length}</span>
          </div>

          <div className="p-4 rounded-xl bg-[#140e06] border border-amber-500/40">
            <span className="text-xs text-amber-300 block mb-1">Pending Requests</span>
            <span className="text-2xl font-bold text-amber-400">{pendingUsers.length}</span>
          </div>

          <div className="p-4 rounded-xl bg-[#06140e] border border-emerald-500/40">
            <span className="text-xs text-emerald-300 block mb-1">Pro Active</span>
            <span className="text-2xl font-bold text-emerald-400">
              {users.filter((u) => u.status === 'approved').length}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#140608] border border-rose-500/40">
            <span className="text-xs text-rose-300 block mb-1">Disabled</span>
            <span className="text-2xl font-bold text-rose-400">
              {users.filter((u) => u.status === 'removed').length}
            </span>
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
                  <th className="p-3.5">Date Submitted</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e0f36]">
                {pendingUsers.length > 0 ? (
                  pendingUsers.map((u, i) => (
                    <tr key={u.email} className="hover:bg-purple-950/20 transition">
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
                      <td className="p-3.5 text-slate-400 text-xs">{u.payment?.date || '-'}</td>
                      <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                        <button
                          id={`approve-btn-${i}`}
                          onClick={() => onApproveUser(u.email)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1 shadow transition cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          id={`reject-btn-${i}`}
                          onClick={() => onRejectUser(u.email)}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs inline-flex items-center gap-1 shadow transition cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                      No pending payment requests awaiting review.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 2: REGISTERED USERS */}
        <div
          id="admin-users-section"
          className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-[#06142c] to-[#030919] border border-cyan-500/30 shadow-[0_0_30px_rgba(0,180,255,0.08)]"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white">Registered Users</h2>
              <p className="text-xs text-slate-400">All registered traders and licensing states</p>
            </div>

            {/* Search and Quick Tools */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-search-users-input"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter users..."
                  className="h-9 pl-9 pr-3 rounded-lg bg-[#071936] border border-[#1d3d63] text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 w-44 sm:w-56 transition"
                />
              </div>

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
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u, i) => (
                    <tr key={u.email} className="hover:bg-cyan-950/20 transition">
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
                          <button
                            id={`remove-user-btn-${i}`}
                            onClick={() => onRemoveUser(u.email)}
                            className="px-2.5 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </button>
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
                      No registered users found matching "{searchTerm}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
