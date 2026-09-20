import React, { useState } from 'react';
import { Page, PaymentInfo } from '../types';
import { Crown, ArrowLeft, DollarSign, Wallet, ShieldCheck, Send, ExternalLink } from 'lucide-react';
import { TELEGRAM_URL, TELEGRAM_USERNAME } from '../data/constants';

interface PaymentViewProps {
  onNavigate: (page: Page) => void;
  onSubmitPayment: (payment: PaymentInfo) => void;
  showToast: (msg: string) => void;
}

export const PaymentView: React.FC<PaymentViewProps> = ({
  onNavigate,
  onSubmitPayment,
  showToast,
}) => {
  const [amount, setAmount] = useState<number>(15);
  const [selectedMethod, setSelectedMethod] = useState<'Binance' | 'bKash' | 'Nagad'>('Binance');
  const [transactionId, setTransactionId] = useState<string>('');

  const openTelegram = (methodName: 'Binance' | 'bKash' | 'Nagad') => {
    setSelectedMethod(methodName);
    showToast(`Opening Telegram (@${TELEGRAM_USERNAME}) for ${methodName} payment...`);
    // Open Telegram in a new tab/window
    window.open(TELEGRAM_URL, '_blank', 'noopener,noreferrer');
  };

  const handlePayNow = () => {
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
      transactionId: transactionId.trim() || undefined,
      date: new Date().toLocaleString(),
    };

    onSubmitPayment(newPayment);
    showToast('Payment request submitted! Awaiting admin approval.');
  };

  return (
    <div id="payment-view" className="w-full max-w-2xl mx-auto px-4 py-8 md:py-12">
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#0a0820] to-[#040210] border border-[#8f27e8] shadow-[0_0_40px_rgba(170,0,255,0.15)] relative">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#6414a8] to-[#cc22ff] text-white shadow-md">
            <Crown className="w-7 h-7 text-amber-300" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Complete Your Payment</h2>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              Unlock Pro Features and get full lifetime bot access.
            </p>
          </div>
        </div>

        {/* Price Row */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-4 text-center rounded-xl bg-[#09152b] border border-[#1d3d62]">
            <small className="block text-xs text-slate-400 mb-1">Total Payment</small>
            <strong className="text-2xl md:text-3xl font-extrabold text-white">$30</strong>
            <span className="block text-[10px] text-cyan-400 mt-0.5">Full Lifetime License</span>
          </div>

          <div className="p-4 text-center rounded-xl bg-[#140b2a] border border-[#8e32e6]">
            <small className="block text-xs text-purple-300 mb-1">Minimum Down Payment</small>
            <strong className="text-2xl md:text-3xl font-extrabold text-purple-300">$15</strong>
            <span className="block text-[10px] text-purple-400 mt-0.5">Instant Pro Activation</span>
          </div>
        </div>

        {/* Payment Amount Input */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
            <span>Payment Amount ($ USD)</span>
            <span className="text-purple-400 text-[11px] font-semibold">Min $15 — Max $30</span>
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <input
              id="payment-amount-input"
              type="number"
              min={15}
              max={30}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="Enter amount ($15 - $30)"
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#08152c] border border-[#21466e] focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white font-bold text-base outline-none transition"
            />
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-slate-300">
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
              id="method-binance-btn"
              onClick={() => openTelegram('Binance')}
              className={`h-12 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                selectedMethod === 'Binance'
                  ? 'border-cyan-400 bg-[#0d274c] text-white shadow-[0_0_15px_rgba(0,220,255,0.2)]'
                  : 'border-[#1b3d63] bg-[#071832] text-slate-300 hover:bg-[#0c2447]'
              }`}
              title="Tap to pay via Binance on Telegram @dropper_sabbir"
            >
              <span>🟡</span> Binance
            </button>

            <button
              type="button"
              id="method-bkash-btn"
              onClick={() => openTelegram('bKash')}
              className={`h-12 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                selectedMethod === 'bKash'
                  ? 'border-pink-400 bg-[#2d0922] text-white shadow-[0_0_15px_rgba(255,0,150,0.2)]'
                  : 'border-[#1b3d63] bg-[#071832] text-slate-300 hover:bg-[#0c2447]'
              }`}
              title="Tap to pay via bKash on Telegram @dropper_sabbir"
            >
              <span>🟣</span> bKash
            </button>

            <button
              type="button"
              id="method-nagad-btn"
              onClick={() => openTelegram('Nagad')}
              className={`h-12 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                selectedMethod === 'Nagad'
                  ? 'border-amber-400 bg-[#301602] text-white shadow-[0_0_15px_rgba(255,140,0,0.2)]'
                  : 'border-[#1b3d63] bg-[#071832] text-slate-300 hover:bg-[#0c2447]'
              }`}
              title="Tap to pay via Nagad on Telegram @dropper_sabbir"
            >
              <span>🟠</span> Nagad
            </button>
          </div>
          <p className="text-[11px] text-purple-300/80 mt-1.5 flex items-center gap-1">
            <span>💡</span> Clicking a payment method directly opens Telegram <strong className="text-cyan-300">@{TELEGRAM_USERNAME}</strong>
          </p>
        </div>

        {/* Method Specific Details */}
        <div className="p-4 rounded-xl bg-[#081226] border border-[#1f3f66] text-xs text-slate-300 space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-cyan-300 flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" />
              Transfer Information:
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50">
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
                <span>bKash Personal / Send Money:</span>
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
                <span>Nagad Personal / Send Money:</span>
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
              <span>Message directly on Telegram for payment details and verification.</span>
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

        {/* Optional Reference or TrxID input */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Transaction ID / Reference (Optional)
          </label>
          <input
            id="transaction-ref-input"
            type="text"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="e.g. 9F3B1A28 or Binance Order ID"
            className="w-full h-10 px-3 rounded-lg bg-[#061021] border border-[#1b3452] text-xs text-white placeholder:text-slate-600 outline-none focus:border-purple-400 transition"
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            id="submit-pay-now-btn"
            onClick={handlePayNow}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-[#763cff] to-[#c022ff] hover:brightness-110 text-white font-bold text-sm tracking-wide shadow-[0_4px_25px_rgba(180,30,255,0.35)] active:scale-[0.99] transition cursor-pointer"
          >
            Pay Now (${amount})
          </button>

          <button
            id="back-from-payment-btn"
            onClick={() => onNavigate('dashboard')}
            className="w-full h-10 rounded-xl border border-[#2e1d4d] hover:bg-purple-950/30 text-slate-400 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
