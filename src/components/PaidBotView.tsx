import React, { useState } from 'react';
import { Page, User, PaymentInfo } from '../types';
import { PAID_BOT_URL, TELEGRAM_URL, TELEGRAM_USERNAME } from '../data/constants';
import {
  Crown,
  Copy,
  Check,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Lock,
  DollarSign,
  Wallet,
  Send,
  ExternalLink,
  Hash,
  AlertCircle,
} from 'lucide-react';

interface PaidBotViewProps {
  currentUser: User | null;
  onNavigate: (page: Page) => void;
  onSubmitPayment: (payment: PaymentInfo) => void;
  showToast: (msg: string) => void;
}

export const PaidBotView: React.FC<PaidBotViewProps> = ({
  currentUser,
  onNavigate,
  onSubmitPayment,
  showToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState<number>(15);
  const [selectedMethod, setSelectedMethod] = useState<'Binance' | 'bKash' | 'Nagad'>('Binance');
  const [transactionCode, setTransactionCode] = useState<string>('');

  const isApproved = currentUser?.status === 'approved';
  const isCodeValid = transactionCode.trim().length > 0;

  const openTelegram = (methodName: 'Binance' | 'bKash' | 'Nagad') => {
    setSelectedMethod(methodName);
    showToast(`Opening Telegram (@${TELEGRAM_USERNAME}) for ${methodName} payment details...`);
    window.open(TELEGRAM_URL, '_blank', 'noopener,noreferrer');
  };

  const handleCopy = () => {
    if (!isApproved) {
      showToast('🔒 Script is locked until approved by an administrator!');
      return;
    }

    navigator.clipboard
      .writeText(PAID_BOT_URL)
      .then(() => {
        setCopied(true);
        showToast('Pro Future Bot script copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        showToast('Failed to copy script');
      });
  };

  const handlePayNow = () => {
    if (!isCodeValid) {
      showToast('Please provide your Transaction Code / TrxID!');
      return;
    }
    if (amount < 15) {
      showToast('Minimum down payment is $15');
      return;
    }
    if (amount > 30) {
      showToast('Maximum payment is $30');
      return;
    }

    const newPayment: PaymentInfo = {
      amount: Number(amount),
      method: selectedMethod,
      transactionId: transactionCode.trim(),
      date: new Date().toLocaleString(),
    };

    onSubmitPayment(newPayment);
  };

  return (
    <div id="paid-bot-view" className="w-full max-w-2xl mx-auto px-4 py-8 md:py-12">
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#0c0824] to-[#040212] border border-[#9c28ed] shadow-[0_0_40px_rgba(156,40,237,0.2)] relative">
        {/* If user is ALREADY APPROVED, show the unlocked script interface */}
        {isApproved ? (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg">
                <Crown className="w-7 h-7 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-white">Pro Future Bot</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-400 text-black">
                    APPROVED & ACTIVE
                  </span>
                </div>
                <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                  Your VIP Lifetime License is active. Copy your bot script below.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#03010b] border border-emerald-500/40 relative mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Unlocked Bookmarklet Script
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Ready to Run
                </span>
              </div>
              <code className="block text-xs font-mono break-all text-purple-200 select-all leading-relaxed pr-12">
                {PAID_BOT_URL}
              </code>
              <button
                onClick={handleCopy}
                className="absolute right-3 bottom-3 w-9 h-9 rounded-lg bg-[#1a0c33] hover:bg-[#2c1356] border border-[#4d1f7a] flex items-center justify-center text-white transition cursor-pointer"
                title="Copy script"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-purple-200" />}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCopy}
                className="flex-1 h-14 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white font-bold text-base shadow-[0_4px_25px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {copied ? '✓ Script Copied!' : '♛ Copy Pro Future Script'}
              </button>
              <button
                onClick={() => onNavigate('dashboard')}
                className="h-14 px-6 rounded-xl border border-[#3b2359] hover:bg-purple-950/40 text-purple-200 text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* PAYMENT GATEWAY */
          <div>
            {/* Gateway Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#6414a8] to-[#cc22ff] text-white shadow-lg">
                <Crown className="w-7 h-7 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-white">Payment Gateway</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-black uppercase tracking-wider">
                    VIP Access
                  </span>
                </div>
                <p className="text-xs md:text-sm text-purple-300/90 mt-0.5">
                  Complete your payment to unlock the Pro Future Trading Bot ($15 - $30)
                </p>
              </div>
            </div>

            {/* Price Overview Cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3.5 text-center rounded-xl bg-[#09152b] border border-[#1d3d62]">
                <small className="block text-xs text-slate-400 mb-0.5">Total Payment</small>
                <strong className="text-2xl md:text-3xl font-extrabold text-white">$30</strong>
                <span className="block text-[10px] text-cyan-400 mt-0.5">Full Lifetime License</span>
              </div>

              <div className="p-3.5 text-center rounded-xl bg-[#140b2a] border border-[#8e32e6] shadow-[0_0_15px_rgba(142,50,230,0.2)]">
                <small className="block text-xs text-purple-300 mb-0.5">Minimum Down Payment</small>
                <strong className="text-2xl md:text-3xl font-extrabold text-purple-300">$15</strong>
                <span className="block text-[10px] text-purple-400 mt-0.5">Instant Pro Activation</span>
              </div>
            </div>

            {/* Payment Amount Input & Quick Select */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="payment-amount-field" className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
                  Payment Amount ($ USD)
                </label>
                <span className="text-[11px] font-bold text-purple-400">Min $15 — Max $30</span>
              </div>

              <div className="relative mb-2">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</div>
                <input
                  id="payment-amount-field"
                  type="number"
                  min={15}
                  max={30}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="15"
                  className="w-full h-11 pl-9 pr-4 rounded-xl bg-[#08152c] border border-[#21466e] focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white font-black text-base outline-none transition"
                />
              </div>

              {/* Quick Select Amount Pills */}
              <div className="flex items-center gap-2">
                {[15, 20, 25, 30].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                      amount === val
                        ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                        : 'bg-[#0e0722] text-slate-400 border-purple-900/40 hover:bg-purple-950/40 hover:text-white'
                    }`}
                  >
                    ${val}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Methods Selection */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                  Select Payment Method
                </label>
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
                >
                  <Send className="w-3 h-3" />
                  @{TELEGRAM_USERNAME}
                </a>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <button
                  type="button"
                  id="paid-method-binance-btn"
                  onClick={() => openTelegram('Binance')}
                  className={`h-12 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                    selectedMethod === 'Binance'
                      ? 'border-cyan-400 bg-[#0d274c] text-white shadow-[0_0_15px_rgba(0,220,255,0.25)]'
                      : 'border-[#1b3d63] bg-[#071832] text-slate-300 hover:bg-[#0c2447]'
                  }`}
                  title="Binance Pay / USDT"
                >
                  <span>🟡</span> Binance
                </button>

                <button
                  type="button"
                  id="paid-method-bkash-btn"
                  onClick={() => openTelegram('bKash')}
                  className={`h-12 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                    selectedMethod === 'bKash'
                      ? 'border-pink-400 bg-[#2d0922] text-white shadow-[0_0_15px_rgba(255,0,150,0.25)]'
                      : 'border-[#1b3d63] bg-[#071832] text-slate-300 hover:bg-[#0c2447]'
                  }`}
                  title="bKash Send Money"
                >
                  <span>🟣</span> bKash
                </button>

                <button
                  type="button"
                  id="paid-method-nagad-btn"
                  onClick={() => openTelegram('Nagad')}
                  className={`h-12 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                    selectedMethod === 'Nagad'
                      ? 'border-amber-400 bg-[#301602] text-white shadow-[0_0_15px_rgba(255,140,0,0.25)]'
                      : 'border-[#1b3d63] bg-[#071832] text-slate-300 hover:bg-[#0c2447]'
                  }`}
                  title="Nagad Send Money"
                >
                  <span>🟠</span> Nagad
                </button>
              </div>

              <p className="text-[11px] text-purple-300/80 mt-1.5 flex items-center gap-1">
                <span>💡</span> Clicking a payment method directly opens Telegram <strong className="text-cyan-300">@{TELEGRAM_USERNAME}</strong>
              </p>
            </div>

            {/* Method Specific Transfer Info */}
            <div className="p-4 rounded-xl bg-[#081226] border border-[#1f3f66] text-xs text-slate-300 space-y-2 mb-5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-cyan-300 flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5" />
                  Account / Transfer Details:
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50 font-bold">
                  {selectedMethod}
                </span>
              </div>

              {selectedMethod === 'Binance' && (
                <div className="space-y-1.5 text-slate-300 text-xs py-1">
                  <p className="flex items-center gap-1.5">
                    <span>Binance Pay ID / USDT Address:</span>
                    <a
                      href={TELEGRAM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 font-bold underline flex items-center gap-1"
                    >
                      Get address on Telegram (@{TELEGRAM_USERNAME})
                    </a>
                  </p>
                </div>
              )}

              {selectedMethod === 'bKash' && (
                <div className="space-y-1.5 text-slate-300 text-xs py-1">
                  <p className="flex items-center gap-1.5">
                    <span>bKash Personal / Send Money Number:</span>
                    <a
                      href={TELEGRAM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 font-bold underline flex items-center gap-1"
                    >
                      Get number on Telegram (@{TELEGRAM_USERNAME})
                    </a>
                  </p>
                </div>
              )}

              {selectedMethod === 'Nagad' && (
                <div className="space-y-1.5 text-slate-300 text-xs py-1">
                  <p className="flex items-center gap-1.5">
                    <span>Nagad Personal / Send Money Number:</span>
                    <a
                      href={TELEGRAM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 font-bold underline flex items-center gap-1"
                    >
                      Get number on Telegram (@{TELEGRAM_USERNAME})
                    </a>
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Chat on Telegram to receive payment address and submit proof.</span>
                </div>
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0088cc] hover:bg-[#0099e6] text-white font-bold text-xs transition shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  Chat on Telegram
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Transaction Code / Trx ID Input Field */}
            <div className="mb-6 p-4 rounded-xl bg-[#140b2b] border border-purple-600/40 shadow-inner space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="gateway-transaction-code-input"
                  className="text-xs font-bold text-purple-200 flex items-center gap-1.5"
                >
                  <Hash className="w-3.5 h-3.5 text-cyan-400" />
                  Transaction Code / TrxID
                </label>
                <span className="text-[11px] font-semibold text-rose-400">
                  * Required
                </span>
              </div>

              <input
                id="gateway-transaction-code-input"
                type="text"
                value={transactionCode}
                onChange={(e) => setTransactionCode(e.target.value)}
                placeholder="Enter your transaction ID or reference code (e.g. 9F3B1A28)"
                className="w-full h-12 px-4 rounded-xl bg-[#0a0518] border border-purple-500/50 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 text-sm text-white placeholder:text-slate-500 font-mono outline-none transition"
              />

              {!isCodeValid ? (
                <p className="text-[11px] text-amber-300/90 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  Please enter the transaction code above to enable the "Pay Now" button.
                </p>
              ) : (
                <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  Transaction code entered. Click "Pay Now" below to submit.
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                id="gateway-pay-now-btn"
                disabled={!isCodeValid}
                onClick={handlePayNow}
                className={`w-full h-14 md:h-15 rounded-xl font-black text-base md:text-lg tracking-wide border-2 flex items-center justify-center gap-2.5 transition-all transform ${
                  isCodeValid
                    ? 'bg-gradient-to-r from-[#763cff] to-[#c022ff] hover:brightness-110 text-white shadow-[0_8px_30px_rgba(180,30,255,0.45)] border-purple-400/40 active:scale-[0.98] cursor-pointer'
                    : 'bg-[#150e26] border-purple-950 text-slate-500 cursor-not-allowed opacity-60 shadow-none'
                }`}
                title={!isCodeValid ? 'Enter transaction code first' : `Pay Now ($${amount})`}
              >
                {isCodeValid ? `Pay Now ($${amount}) — Submit Request` : '🔒 Enter Transaction Code to Unlock Pay Now'}
              </button>

              <button
                id="gateway-back-dash-btn"
                onClick={() => onNavigate('dashboard')}
                className="w-full h-11 rounded-xl border border-[#2e1d4d] hover:bg-purple-950/30 text-slate-400 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
