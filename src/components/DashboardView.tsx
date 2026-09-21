import React from 'react';
import { User, Page } from '../types';
import { Gift, Crown, Clock, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

interface DashboardViewProps {
  currentUser: User;
  onNavigate: (page: Page) => void;
  onPaidAction: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  onNavigate,
  onPaidAction,
}) => {
  const isPending = currentUser.status === 'pending';
  const isApproved = currentUser.status === 'approved';
  const isRemoved = currentUser.status === 'removed';

  return (
    <div id="dashboard-view" className="w-full max-w-5xl mx-auto px-4 py-8 md:py-12">
      {/* Title */}
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-wide text-white">
          Choose Your Bot
        </h2>
        <p className="text-sm md:text-base text-slate-400 mt-2">
          Pick your trading automation tool and elevate your strategy today.
        </p>
      </div>

      {/* Bot Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Free Bot Card */}
        <div
          id="free-bot-card"
          className="relative p-7 rounded-2xl bg-gradient-to-br from-[#061a38] to-[#050b1b] border border-[#0879b7] hover:border-cyan-400 hover:-translate-y-1 transition-all duration-200 overflow-hidden group shadow-lg hover:shadow-[0_0_30px_rgba(0,200,255,0.15)] flex flex-col justify-between"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-cyan-400/15 blur-2xl pointer-events-none group-hover:bg-cyan-400/25 transition-all" />

          <div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#004d83] to-[#00b8ff] text-white shadow-md mb-5">
              <Gift className="w-7 h-7 text-white" />
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Free Bot</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                STARTER
              </span>
            </div>

            <p
              id="free-bot-activation-notice"
              className="text-xs sm:text-sm font-bold text-amber-300 mt-3 p-2.5 rounded-xl bg-gradient-to-r from-amber-950/70 via-amber-900/40 to-amber-950/70 border border-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.4),inset_0_0_14px_rgba(245,158,11,0.2)] leading-relaxed flex items-center gap-2.5 min-h-[48px]"
            >
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-90"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-300 shadow-[0_0_10px_#fbbf24]"></span>
              </span>
              <span className="drop-shadow-[0_0_10px_rgba(251,191,36,0.95)] drop-shadow-[0_0_20px_rgba(245,158,11,0.6)] tracking-wide">
                এক্টিভ করা ছাড়া বটে ট্যাপ করলে কাজ করবে না
              </span>
            </p>

            <ul className="mt-4 space-y-2 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
              <li className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                Standard Indicator Triggers
              </li>
              <li className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                Browser Bookmarklet Integration
              </li>
            </ul>
          </div>

          <button
            id="get-free-bot-btn"
            onClick={() => onNavigate('free')}
            className="mt-6 w-full h-12 md:h-13 rounded-xl font-extrabold text-sm md:text-base bg-gradient-to-r from-[#00cfff] to-[#1479ff] hover:brightness-110 text-white shadow-[0_6px_22px_rgba(0,180,255,0.3)] transition cursor-pointer"
          >
            Get Free Bot
          </button>
        </div>

        {/* Paid Bot Card */}
        <div
          id="paid-bot-card"
          className="relative p-7 rounded-2xl bg-gradient-to-br from-[#0e0a29] to-[#060414] border border-[#8b27e8] hover:border-purple-400 hover:-translate-y-1 transition-all duration-200 overflow-hidden group shadow-lg hover:shadow-[0_0_35px_rgba(180,30,255,0.18)] flex flex-col justify-between"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-purple-500/20 blur-2xl pointer-events-none group-hover:bg-purple-500/30 transition-all" />

          <div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#6414a8] to-[#cc22ff] text-white shadow-md mb-5">
              <Crown className="w-7 h-7 text-amber-300" />
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Paid Bot</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                PRO FUTURE
              </span>
            </div>

            <p className="text-sm text-slate-300 mt-3 leading-relaxed min-h-[48px]">
              Unlock high-frequency algorithmic accuracy, AI market analysis, and VIP support.
            </p>

            <ul className="mt-4 space-y-2 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                High Win-Rate Real-Time Signals
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                Deep Machine Learning Trend Engine
              </li>
            </ul>
          </div>

          <button
            id="get-paid-bot-btn"
            onClick={onPaidAction}
            className={`mt-6 w-full h-12 md:h-13 rounded-xl font-extrabold text-sm md:text-base transition cursor-pointer ${
              isApproved
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-white shadow-[0_6px_25px_rgba(16,185,129,0.35)]'
                : isPending
                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:brightness-110 text-white shadow-[0_6px_25px_rgba(245,158,11,0.35)]'
                : 'bg-gradient-to-r from-[#7525ff] to-[#c022ff] hover:brightness-110 text-white shadow-[0_6px_25px_rgba(180,30,255,0.35)]'
            }`}
          >
            {isApproved ? 'Open Pro Future ♛' : isPending ? '⏳ Awaiting Admin Approval (Pending)' : 'Get Paid Bot'}
          </button>
        </div>
      </div>

      {/* Status Banners */}
      <div className="max-w-3xl mx-auto mt-8 space-y-4">
        {isPending && (
          <div
            id="pending-status-banner"
            className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm flex items-start gap-3 shadow-md"
          >
            <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">Payment Request Pending</p>
              <p className="text-xs text-slate-300 mt-0.5">
                Your payment request is undergoing admin verification. Once verified, Pro Future will activate automatically.
              </p>
            </div>
          </div>
        )}

        {isApproved && (
          <div
            id="approved-status-banner"
            className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-sm flex items-center justify-between shadow-md"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-semibold text-emerald-300">Pro License Active</p>
                <p className="text-xs text-slate-300">You have full access to Pro Future trading tools.</p>
              </div>
            </div>
            <button
              id="open-pro-future-btn"
              onClick={() => onNavigate('pro')}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#7525ff] to-[#c022ff] hover:brightness-110 text-xs font-bold text-white transition shrink-0"
            >
              ♛ Open Pro Future
            </button>
          </div>
        )}

        {isRemoved && (
          <div
            id="removed-status-banner"
            className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm flex items-start gap-3 shadow-md"
          >
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-300">Access Disabled</p>
              <p className="text-xs text-slate-300 mt-0.5">
                Your account access has been revoked by the system administrator. Contact support for assistance.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
