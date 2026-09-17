import React, { useState } from 'react';
import { Page, User } from '../types';
import { PAID_BOT_URL } from '../data/constants';
import { CheckCircle2, Lock, Crown, ArrowLeft, Copy, Check, Sparkles, Shield, Cpu } from 'lucide-react';

interface StatusViewsProps {
  type: 'pending' | 'denied' | 'pro';
  currentUser: User;
  onNavigate: (page: Page) => void;
  showToast: (msg: string) => void;
}

export const StatusViews: React.FC<StatusViewsProps> = ({
  type,
  currentUser,
  onNavigate,
  showToast,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyPro = () => {
    navigator.clipboard
      .writeText(PAID_BOT_URL)
      .then(() => {
        setCopied(true);
        showToast('Pro Future script copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        showToast('Failed to copy script');
      });
  };

  // PENDING APPROVAL VIEW
  if (type === 'pending') {
    return (
      <div id="pending-view" className="w-full max-w-xl mx-auto px-4 py-12">
        <div className="p-8 text-center rounded-2xl bg-gradient-to-br from-[#071a35] to-[#040a18] border border-emerald-500/50 shadow-[0_0_40px_rgba(0,220,160,0.12)]">
          <div className="w-18 h-18 mx-auto mb-5 rounded-full bg-emerald-500/10 border border-emerald-400 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>

          <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            Your payment request has been received. Your transaction details have been sent to the admin for verification and approval.
          </p>

          <div className="inline-flex items-center gap-2 my-5 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/50 text-amber-300 text-xs font-bold tracking-wider">
            <span>⏳ PENDING APPROVAL</span>
          </div>

          <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 text-xs text-slate-300 leading-relaxed text-left space-y-1">
            <p>
              Submitted Amount:{' '}
              <strong className="text-cyan-300">
                ${currentUser.payment?.amount || 15} USD
              </strong>
            </p>
            <p>
              Method:{' '}
              <strong className="text-cyan-300">
                {currentUser.payment?.method || 'Binance'}
              </strong>
            </p>
            <p className="text-slate-400 pt-1">
              You will automatically gain full access to <strong className="text-[#00e4ff]">Pro Future</strong> once the administrator confirms your transfer in the Admin Portal.
            </p>
          </div>

          <button
            id="pending-back-to-dashboard-btn"
            onClick={() => onNavigate('dashboard')}
            className="mt-6 w-full h-11 rounded-xl bg-gradient-to-r from-[#00cfff] to-[#1976ff] hover:brightness-110 text-white font-bold text-sm shadow-[0_4px_20px_rgba(0,180,255,0.25)] transition cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ACCESS DENIED VIEW
  if (type === 'denied') {
    return (
      <div id="denied-view" className="w-full max-w-xl mx-auto px-4 py-12">
        <div className="p-8 text-center rounded-2xl bg-gradient-to-br from-[#1a0812] to-[#0a0307] border border-rose-500/50 shadow-[0_0_40px_rgba(255,50,80,0.12)]">
          <div className="w-18 h-18 mx-auto mb-5 rounded-full bg-rose-500/10 border border-rose-500 flex items-center justify-center text-rose-400">
            <Lock className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-bold text-rose-400 mb-2">Access Denied</h2>

          <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            Your request is currently unverified or your account privileges have been restricted by the system administrator.
          </p>

          <div className="my-5 p-4 rounded-xl bg-rose-950/40 border border-rose-800/40 text-xs text-rose-200 text-left">
            <p className="font-semibold mb-1">Potential reasons:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Your payment request is still awaiting manual administrator clearance.</li>
              <li>The transaction identifier was invalid or rejected.</li>
              <li>Your account status was flagged or revoked.</li>
            </ul>
          </div>

          <button
            id="denied-back-to-dashboard-btn"
            onClick={() => onNavigate('dashboard')}
            className="w-full h-11 rounded-xl bg-[#26101c] hover:bg-[#381628] border border-rose-600/40 text-white font-bold text-sm transition cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // PRO FUTURE UNLOCKED VIEW
  return (
    <div id="pro-view" className="w-full max-w-3xl mx-auto px-4 py-8 md:py-12">
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#0e0828] via-[#09051d] to-[#04020e] border border-[#a52cff] shadow-[0_0_50px_rgba(165,44,255,0.22)] relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center gap-4 mb-6 relative z-10">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#6412a8] to-[#ca20ff] text-white shadow-[0_0_25px_rgba(202,32,255,0.4)]">
            <Crown className="w-8 h-8 text-amber-300" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-white tracking-wide">
                Pro Future
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-black tracking-wider shadow-sm">
                PREMIUM
              </span>
            </div>
            <p className="text-xs md:text-sm text-purple-300 mt-1">
              Advanced neural tools. Maximum algorithmic edge.
            </p>
          </div>
        </div>

        {/* Feature List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-6 relative z-10">
          <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/20 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Real-Time Signals</p>
              <p className="text-[11px] text-slate-400">Sub-second buy/sell confirmations</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/20 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">AI Market Analysis</p>
              <p className="text-[11px] text-slate-400">Deep pattern & volatility recognition</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/20 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Advanced Settings</p>
              <p className="text-[11px] text-slate-400">Custom sensitivity and timeframe toggles</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/20 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">VIP Priority Support</p>
              <p className="text-[11px] text-slate-400">Direct telegram & discord access</p>
            </div>
          </div>
        </div>

        {/* Script Codebox */}
        <div className="mb-6 p-4 rounded-xl bg-[#03010c] border border-purple-800/60 relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-300">
              Your Unlocked Pro Bookmarklet Script:
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">
              ● Active & Authorized
            </span>
          </div>

          <code
            id="pro-bot-code-display"
            className="block text-xs font-mono text-purple-200 break-all pr-12 leading-relaxed selection:bg-purple-500/50 select-all"
          >
            {PAID_BOT_URL}
          </code>

          <button
            id="copy-pro-bot-inline-btn"
            onClick={handleCopyPro}
            className="absolute right-3 bottom-3 w-9 h-9 rounded-lg bg-purple-950 hover:bg-purple-900 border border-purple-700/60 text-white flex items-center justify-center transition cursor-pointer"
            title="Copy script"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4 text-purple-200" />
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 relative z-10">
          <button
            id="access-pro-future-main-btn"
            onClick={handleCopyPro}
            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-[#763cff] to-[#c022ff] hover:brightness-110 text-white font-bold text-sm shadow-[0_4px_25px_rgba(180,30,255,0.4)] flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4" /> : <Crown className="w-4 h-4" />}
            {copied ? 'Script Copied to Clipboard!' : 'Access Pro Future Script'}
          </button>

          <button
            id="back-to-dash-from-pro-btn"
            onClick={() => onNavigate('dashboard')}
            className="h-11 px-5 rounded-xl border border-purple-900/60 hover:bg-purple-950/40 text-purple-200 text-sm font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
