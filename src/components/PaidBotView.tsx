import React, { useState } from 'react';
import { Page, User } from '../types';
import { PAID_BOT_URL } from '../data/constants';
import { Crown, Copy, Check, ArrowLeft, ShieldCheck, Zap, Sparkles, Lock, Clock } from 'lucide-react';

interface PaidBotViewProps {
  currentUser: User | null;
  onNavigate: (page: Page) => void;
  showToast: (msg: string) => void;
}

export const PaidBotView: React.FC<PaidBotViewProps> = ({
  currentUser,
  onNavigate,
  showToast,
}) => {
  const [copied, setCopied] = useState(false);
  const isApproved = currentUser?.status === 'approved';
  const isPending = currentUser?.status === 'pending';

  const handleCopy = () => {
    if (!isApproved) {
      showToast('🔒 এডমিন প্যানেল থেকে অ্যাপ্রুভ না করা পর্যন্ত স্ক্রিপ্ট লক থাকবে!');
      return;
    }

    navigator.clipboard
      .writeText(PAID_BOT_URL)
      .then(() => {
        setCopied(true);
        showToast('Paid Bot Script preview copied!');
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        showToast('Failed to copy script');
      });
  };

  return (
    <div id="paid-bot-view" className="w-full max-w-3xl mx-auto px-4 py-8 md:py-12">
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#0c0824] to-[#040212] border border-[#9c28ed] shadow-[0_0_40px_rgba(156,40,237,0.15)] relative">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#6414a8] to-[#cc22ff] text-white shadow-md">
            <Crown className="w-7 h-7 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-white">Paid Bot</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-black">
                VIP
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              Pro Future Machine Learning Trading Bot
            </p>
          </div>
        </div>

        {/* Script Preview Box */}
        <div className="relative mb-5 p-4 rounded-xl bg-[#03010b] border border-[#3e1463] overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-purple-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Bookmarklet Engine Script
            </span>
            {isApproved ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Approved & Unlocked
              </span>
            ) : isPending ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Awaiting Admin Approval
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Locked (Admin Approval Required)
              </span>
            )}
          </div>

          {/* SCRIPT CODE CONTAINER */}
          <div className="relative">
            <code
              id="paid-bot-code-display"
              className={`block text-xs font-mono break-all pr-12 leading-relaxed transition-all duration-300 ${
                isApproved
                  ? 'text-purple-200 selection:bg-purple-500/40 select-all'
                  : 'text-slate-500 select-none filter blur-[5px] select-none pointer-events-none'
              }`}
            >
              {isApproved
                ? PAID_BOT_URL
                : 'javascript:(function(){/* LOCKED_BY_ADMIN_APPROVAL_REQUIRED: Pro Future Engine Hidden */})();'}
            </code>

            {/* OVERLAY IF NOT APPROVED */}
            {!isApproved && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px] rounded-lg border border-purple-500/30 p-3 text-center">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 shrink-0">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-rose-300">
                    এডমিন প্যানেল থেকে অ্যাপ্রুভ না করা পর্যন্ত স্ক্রিপ্ট কোড হাইড থাকবে
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            id="copy-paid-bot-inline-btn"
            onClick={handleCopy}
            className={`absolute right-3 bottom-3 w-9 h-9 rounded-lg border flex items-center justify-center transition ${
              isApproved
                ? 'bg-[#1a0c33] hover:bg-[#2c1356] border-[#4d1f7a] text-white cursor-pointer'
                : 'bg-[#0f071f] border-slate-800 text-slate-500 hover:text-rose-400 cursor-not-allowed'
            }`}
            title={isApproved ? 'Copy script' : 'Script is locked'}
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : isApproved ? (
              <Copy className="w-4 h-4 text-purple-200" />
            ) : (
              <Lock className="w-4 h-4 text-rose-400" />
            )}
          </button>
        </div>

        {/* Premium Highlights */}
        <div className="p-4 rounded-xl bg-purple-900/20 border border-purple-500/30 text-xs md:text-sm text-slate-300 leading-relaxed space-y-2">
          <strong className="text-purple-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            Premium Pro Features
          </strong>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
            <div className="p-2 rounded-lg bg-purple-950/40 border border-purple-800/40 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-xs">Advanced Signals</span>
            </div>
            <div className="p-2 rounded-lg bg-purple-950/40 border border-purple-800/40 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-xs">Higher Accuracy</span>
            </div>
            <div className="p-2 rounded-lg bg-purple-950/40 border border-purple-800/40 flex items-center gap-2">
              <Crown className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-xs">Priority Support</span>
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 items-stretch">
          {!isApproved ? (
            <button
              id="go-to-payment-btn"
              onClick={() => onNavigate('payment')}
              className="flex-1 h-14 md:h-16 py-4 px-6 rounded-2xl bg-gradient-to-r from-[#763cff] to-[#c022ff] hover:brightness-110 text-white font-black text-base md:text-lg tracking-wide shadow-[0_8px_30px_rgba(180,30,255,0.45)] border-2 border-purple-400/40 flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.98] cursor-pointer"
            >
              {isPending ? 'View Payment Status ⏳' : 'Go to Payment ($15 - $30)'}
            </button>
          ) : (
            <button
              id="go-to-payment-btn"
              onClick={handleCopy}
              className="flex-1 h-14 md:h-16 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white font-black text-base md:text-lg tracking-wide shadow-[0_8px_30px_rgba(16,185,129,0.45)] border-2 border-emerald-400/40 flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.98] cursor-pointer"
            >
              {copied ? '✓ Script Copied!' : '♛ Copy Pro Future Script'}
            </button>
          )}

          <button
            id="back-to-dash-from-paid-btn"
            onClick={() => onNavigate('dashboard')}
            className="h-14 md:h-16 px-6 rounded-2xl border border-[#3b2359] hover:bg-purple-950/40 text-purple-200 text-sm md:text-base font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
