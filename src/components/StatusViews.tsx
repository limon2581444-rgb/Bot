import React, { useState } from 'react';
import { Page, User } from '../types';
import { PAID_BOT_URL } from '../data/constants';
import { CheckCircle2, Lock, Crown, ArrowLeft, Copy, Check, Sparkles, Shield, Cpu, Clock } from 'lucide-react';

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

  // PENDING / ACCEPTED APPROVAL VIEW
  if (type === 'pending') {
    const isAccepted = currentUser.status === 'accepted';

    return (
      <div id="pending-view" className="w-full max-w-xl mx-auto px-4 py-12">
        <div
          className={`p-8 text-center rounded-2xl bg-gradient-to-br border shadow-xl ${
            isAccepted
              ? 'from-[#061d2d] to-[#040f1a] border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.15)]'
              : 'from-[#071a35] to-[#040a18] border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.15)]'
          }`}
        >
          <div
            className={`w-18 h-18 mx-auto mb-5 rounded-full border flex items-center justify-center ${
              isAccepted
                ? 'bg-cyan-500/10 border-cyan-400 text-cyan-400'
                : 'bg-amber-500/10 border-amber-400 text-amber-400'
            }`}
          >
            <Clock className="w-10 h-10 animate-pulse" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            {isAccepted ? 'Payment Accepted / Waiting for Activation' : 'Request Submitted to Pending List!'}
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            {isAccepted
              ? 'আপনার পেমেন্ট এডমিন সফলভাবে যাচাই ও অ্যাকসেপ্ট করেছেন। তবে Pro Future ফিচার ও কোড এখনও লক রয়েছে। এডমিন ম্যানুয়ালি "ACTIVATE PRO" করার সাথে সাথেই বট সম্পূর্ণ আনলক হবে।'
              : 'আপনার পেমেন্ট ট্রানজেকশন তথ্য এডমিন পেন্ডিং তালিকায় জমা হয়েছে। এডমিন ভেরিফাই করে অ্যাকসেপ্ট ও অ্যাক্টিভেট না করা পর্যন্ত রিকোয়েস্ট পেন্ডিং অবস্থায় থাকবে এবং বট লক থাকবে।'}
          </p>

          <div
            className={`inline-flex items-center gap-2 my-5 px-4 py-1.5 rounded-full border text-xs font-bold tracking-wider ${
              isAccepted
                ? 'bg-cyan-500/15 border-cyan-500/60 text-cyan-300'
                : 'bg-amber-500/15 border-amber-500/60 text-amber-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isAccepted ? 'bg-cyan-400' : 'bg-amber-400'
              } animate-ping`}
            />
            <span>
              {isAccepted
                ? '📋 ACCEPTED / READY TO ACTIVATE (এডমিন অ্যাক্টিভেশনের অপেক্ষায়)'
                : '⏳ PENDING ADMIN APPROVAL (এডমিন অ্যাকসেপ্টের অপেক্ষায়)'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-300 leading-relaxed text-left space-y-2">
            <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
              <span className="text-slate-400">Current Status:</span>
              <strong className={isAccepted ? 'text-cyan-300 font-bold' : 'text-amber-300 font-bold'}>
                {isAccepted ? 'ACCEPTED (Ready for Activation)' : 'PENDING'}
              </strong>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
              <span className="text-slate-400">Pro Future Access:</span>
              <strong className="text-rose-400 font-bold">
                🔒 LOCKED (Not Active Yet)
              </strong>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
              <span className="text-slate-400">Submitted Amount:</span>
              <strong className="text-cyan-300 font-mono text-sm">
                ${currentUser.payment?.amount || 30} USD
              </strong>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
              <span className="text-slate-400">Payment Method:</span>
              <strong className="text-cyan-300">
                {currentUser.payment?.method || 'Binance'}
              </strong>
            </div>
            {currentUser.payment?.transactionId && (
              <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                <span className="text-slate-400">Transaction ID / TrxID:</span>
                <strong className="text-amber-300 font-mono">
                  {currentUser.payment.transactionId}
                </strong>
              </div>
            )}
            {currentUser.acceptedDate && (
              <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                <span className="text-slate-400">Accepted Date:</span>
                <strong className="text-slate-300">
                  {currentUser.acceptedDate}
                </strong>
              </div>
            )}
            <p className="text-slate-400 pt-1 leading-relaxed text-[11px]">
              {isAccepted
                ? '💡 এডমিন প্যানেল থেকে "ACTIVATE PRO" বাটনে ক্লিক করার সাথে সাথে আপনার অ্যাকাউন্ট Pro Active হয়ে যাবে এবং Pro Future কোড আনলক হবে।'
                : '💡 এডমিন প্রথমে পেমেন্ট যাচাই করে Accept করবেন এবং পরবর্তীতে ম্যানুয়ালি Pro Future সক্রিয় করবেন।'}
            </p>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              id="pending-back-to-dashboard-btn"
              onClick={() => onNavigate('dashboard')}
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-[#00cfff] to-[#1976ff] hover:brightness-110 text-white font-bold text-sm shadow-[0_4px_20px_rgba(0,180,255,0.25)] transition cursor-pointer"
            >
              Back to Dashboard
            </button>
            <button
              id="pending-view-bot-btn"
              onClick={() => onNavigate('paid')}
              className="h-11 px-5 rounded-xl border border-purple-500/40 hover:bg-purple-950/30 text-purple-200 text-xs font-semibold transition cursor-pointer"
            >
              View Status on Bot Page
            </button>
          </div>
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
