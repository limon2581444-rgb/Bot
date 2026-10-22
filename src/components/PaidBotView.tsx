import React, { useState, useRef } from 'react';
import { Page, User, PaymentInfo } from '../types';
import { PAID_BOT_URL, TELEGRAM_URL, TELEGRAM_USERNAME, BKASH_NUMBER } from '../data/constants';
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
  Clock,
  RefreshCw,
  MessageSquare,
  Image as ImageIcon,
  Upload,
  Trash2,
  Eye,
  Camera,
  X,
  Phone,
} from 'lucide-react';

// Lightweight in-browser image compression using HTML5 canvas
const compressImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        // Compressed JPEG under 70KB
        const compressed = canvas.toDataURL('image/jpeg', 0.78);
        resolve(compressed);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

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
  const [copiedBkash, setCopiedBkash] = useState(false);
  const [amount, setAmount] = useState<number>(30);
  const [selectedMethod, setSelectedMethod] = useState<'Binance' | 'bKash' | 'Nagad'>('Binance');
  const [transactionCode, setTransactionCode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // View mode allows accessing the Payment Gateway anytime even if pro active or pending
  const [viewMode, setViewMode] = useState<'gateway' | 'status'>('gateway');

  // 2 Proof Screenshots States
  const [proofImage1, setProofImage1] = useState<string | null>(null);
  const [proofImage2, setProofImage2] = useState<string | null>(null);
  const [previewingImage, setPreviewingImage] = useState<string | null>(null);
  const fileInput1Ref = useRef<HTMLInputElement>(null);
  const fileInput2Ref = useRef<HTMLInputElement>(null);

  const isProActive =
    (currentUser?.role === 'admin' || currentUser?.proAccess === true) &&
    (currentUser?.status === 'active' || currentUser?.status === 'approved');
  const isAccepted = currentUser?.status === 'accepted';
  const isPending = currentUser?.status === 'pending';
  const isCodeValid = transactionCode.trim().length > 0;

  const openTelegram = (methodName: 'Binance' | 'bKash' | 'Nagad') => {
    setSelectedMethod(methodName);
    showToast(`Opening Telegram (@${TELEGRAM_USERNAME}) for ${methodName} payment details...`);
    window.open(TELEGRAM_URL, '_blank', 'noopener,noreferrer');
  };

  const handleSelectBkash = () => {
    setSelectedMethod('bKash');
    navigator.clipboard?.writeText(BKASH_NUMBER).catch(() => {});
    setCopiedBkash(true);
    showToast(`bKash Personal নম্বর: ${BKASH_NUMBER} (কপি করা হয়েছে)`);
    setTimeout(() => setCopiedBkash(false), 2500);
  };

  const handleFileChange = async (index: 1 | 2, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('অনুগ্রহ করে ছবি (Image/Screenshot) ফাইল নির্বাচন করুন!');
      return;
    }

    try {
      const compressed = await compressImageFile(file);
      if (index === 1) {
        setProofImage1(compressed);
      } else {
        setProofImage2(compressed);
      }
      showToast(`ছবি ${index} সফলভাবে যোগ করা হয়েছে!`);
    } catch (err) {
      console.error('Image compression error', err);
      showToast('ছবি প্রসেস করতে সমস্যা হয়েছে, অন্য ছবি দিন');
    } finally {
      // Clear value so the user can re-select the same file if needed
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: 1 | 2, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index === 1) {
      setProofImage1(null);
    } else {
      setProofImage2(null);
    }
    showToast(`ছবি ${index} রিমুভ করা হয়েছে`);
  };

  const handleCopy = () => {
    if (!isProActive) {
      showToast('🔒 Script is locked until manually activated by Admin!');
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

  const handlePayNow = async () => {
    if (!currentUser) {
      showToast('অনুগ্রহ করে পেমেন্ট রিকোয়েস্ট পাঠাতে আগে লগইন করুন!');
      onNavigate('login');
      return;
    }

    if (!isCodeValid) {
      showToast('Please provide your Transaction Code / TrxID!');
      return;
    }
    if (amount < 30) {
      showToast('Minimum down payment is $30');
      return;
    }
    if (amount > 50) {
      showToast('Maximum payment is $50');
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadedImages = [proofImage1, proofImage2].filter(Boolean) as string[];

      let aiAnalysisResult = undefined;

      // Automatically run AI Payment Proof Analysis if screenshots are uploaded
      if (uploadedImages.length > 0) {
        showToast('🤖 AI দিয়ে পেমেন্ট প্রুফ ও TrxID বিশ্লেষণ করা হচ্ছে...');
        try {
          const res = await fetch('/api/analyze-payment-proof', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              proofImages: uploadedImages,
              method: selectedMethod,
              transactionId: transactionCode.trim(),
              amount: Number(amount),
              userEmail: currentUser.email,
            }),
          });
          if (res.ok) {
            aiAnalysisResult = await res.json();
          }
        } catch (aiErr) {
          console.warn('AI analysis error on submit:', aiErr);
        }
      }

      const newPayment: PaymentInfo = {
        amount: Number(amount),
        method: selectedMethod,
        transactionId: transactionCode.trim(),
        date: new Date().toLocaleString(),
        proofImages: uploadedImages,
        aiAnalysis: aiAnalysisResult,
      };

      await onSubmitPayment(newPayment);
    } catch (e) {
      console.error(e);
      showToast('Failed to submit payment request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="paid-bot-view" className="w-full max-w-2xl mx-auto px-4 py-8 md:py-12">
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#0c0824] to-[#040212] border border-[#9c28ed] shadow-[0_0_40px_rgba(156,40,237,0.2)] relative">
        {/* Switcher Tabs when user has special status */}
        {(isProActive || isAccepted || isPending) && (
          <div className="flex items-center justify-center gap-2 mb-6 p-1 rounded-xl bg-[#09051d] border border-purple-800/40">
            <button
              type="button"
              id="switch-to-gateway-btn"
              onClick={() => setViewMode('gateway')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                viewMode === 'gateway'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              পেমেন্ট গেটওয়ে (Payment Gateway)
            </button>
            <button
              type="button"
              id="switch-to-status-btn"
              onClick={() => setViewMode('status')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                viewMode === 'status'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              {isProActive ? 'আনলকড স্ক্রিপ্ট (Pro Script)' : 'রিকোয়েস্ট স্ট্যাটাস (Status)'}
            </button>
          </div>
        )}

        {/* 1. PRO ACTIVE: Show unlocked script interface */}
        {viewMode === 'status' && isProActive ? (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg">
                <Crown className="w-7 h-7 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-white">Pro Feature Bot</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-400 text-black">
                    ACTIVATED & UNLOCKED
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
                {copied ? '✓ Script Copied!' : '♛ Copy Pro Feature Script'}
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
        ) : viewMode === 'status' && isAccepted ? (
          /* 2. ACCEPTED / WAITING FOR ACTIVATION VIEW: Pro Feature remains strictly LOCKED */
          <div id="paid-bot-accepted-view" className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-cyan-600 to-blue-700 text-white shadow-[0_0_25px_rgba(6,182,212,0.35)]">
                <Clock className="w-7 h-7 text-cyan-200 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-white">Payment Accepted / Waiting for Activation</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    Waiting for Admin Activation
                  </span>
                </div>
                <p className="text-xs md:text-sm text-cyan-200/90 mt-0.5">
                  পেমেন্ট গ্রহণ করা হয়েছে • এডমিন অ্যাক্টিভেশনের অপেক্ষায় (Pro Feature LOCKED)
                </p>
              </div>
            </div>

            {/* Prominent Status Notice Card */}
            <div className="p-5 rounded-xl bg-[#061828] border-2 border-cyan-500/60 shadow-[0_0_30px_rgba(6,182,212,0.2)] space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs md:text-sm text-cyan-100 leading-relaxed">
                  <p className="font-bold text-cyan-300 text-sm mb-1">
                    পেমেন্ট ভেরিফাই হয়েছে, কিন্তু Pro Feature এখনও সক্রিয় (Active) করা হয়নি
                  </p>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    আপনার পেমেন্ট এডমিন সফলভাবে যাচাই ও এক্সেপ্ট করেছেন। নিয়ম অনুযায়ী, এডমিন যতক্ষণ না ম্যানুয়ালি <strong className="text-cyan-300">"ACTIVATE PRO"</strong> বাটনে ক্লিক করবেন, ততক্ষণ Pro Feature লক থাকবে। এডমিন অ্যাক্টিভেট করার সাথে সাথেই এটি আনলক হয়ে যাবে।
                  </p>
                </div>
              </div>

              {/* Submitted Details Box */}
              <div className="p-4 rounded-lg bg-[#040c16] border border-cyan-500/30 text-xs space-y-2">
                <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                  <span className="text-slate-400">Payment Status:</span>
                  <strong className="text-cyan-300 font-bold">ACCEPTED / WAITING FOR ACTIVATION</strong>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                  <span className="text-slate-400">Pro Feature Status:</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    🔒 LOCKED (Awaiting Admin Activation)
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                  <span className="text-slate-400">Submitted Amount:</span>
                  <strong className="text-white font-mono text-sm">${currentUser?.payment?.amount || amount || 30} USD</strong>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                  <span className="text-slate-400">Payment Method:</span>
                  <strong className="text-cyan-400 font-semibold">{currentUser?.payment?.method || selectedMethod}</strong>
                </div>
                {currentUser?.payment?.transactionId && (
                  <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                    <span className="text-slate-400">Transaction ID / TrxID:</span>
                    <strong className="text-amber-300 font-mono tracking-wider">{currentUser.payment.transactionId}</strong>
                  </div>
                )}
                {currentUser?.acceptedDate && (
                  <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                    <span className="text-slate-400">Accepted Date:</span>
                    <span className="text-slate-300 font-mono text-xs">{currentUser.acceptedDate}</span>
                  </div>
                )}
                {currentUser?.payment?.proofImages && currentUser.payment.proofImages.length > 0 && (
                  <div className="pt-2 border-t border-white/5 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                        <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                        Uploaded Proof Screenshots:
                      </span>
                      <span className="text-cyan-300 font-bold text-[11px]">
                        {currentUser.payment.proofImages.length} Photos Attached
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      {currentUser.payment.proofImages.map((img, idx) => (
                        <div
                          key={idx}
                          onClick={() => setPreviewingImage(img)}
                          className="relative group cursor-pointer overflow-hidden rounded-lg border border-cyan-500/40 w-16 h-16 bg-black shrink-0 hover:border-cyan-300 transition"
                          title="Click to view full photo"
                        >
                          <img src={img} alt={`Proof ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition" />
                          <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[9px] text-cyan-300 text-center py-0.5">
                            ছবি {idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/30 flex items-center gap-2.5 text-[11px] text-cyan-200">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>রিয়েল-টাইম সিঙ্ক সক্রিয়: এডমিন প্যানেল থেকে ACTIVATE PRO করার সাথে সাথেই আনলক হবে।</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 text-white font-bold text-xs md:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => window.open(TELEGRAM_URL, '_blank', 'noopener,noreferrer')}
                className="h-12 px-6 rounded-xl border border-cyan-800/60 hover:bg-cyan-950/40 text-cyan-200 text-xs md:text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Contact Admin (@{TELEGRAM_USERNAME})
              </button>
            </div>
          </div>
        ) : viewMode === 'status' && isPending ? (
          /* 3. PENDING APPROVAL VIEW */
          <div id="paid-bot-pending-view" className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-amber-500 to-yellow-600 text-white shadow-[0_0_25px_rgba(245,158,11,0.35)]">
                <Clock className="w-7 h-7 text-amber-100 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-white">Payment Request Pending</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    Pending Approval
                  </span>
                </div>
                <p className="text-xs md:text-sm text-amber-200/90 mt-0.5">
                  আপনার রিকোয়েস্ট পেন্ডিং লিস্টে জমা রয়েছে (Awaiting Admin Review)
                </p>
              </div>
            </div>

            {/* Prominent Status Notice Card */}
            <div className="p-5 rounded-xl bg-[#140e06] border-2 border-amber-500/60 shadow-[0_0_30px_rgba(245,158,11,0.2)] space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs md:text-sm text-amber-100 leading-relaxed">
                  <p className="font-bold text-amber-300 text-sm mb-1">
                    এডমিন অ্যাপ্রুভ না করা পর্যন্ত রিকোয়েস্ট পেন্ডিং অবস্থায় থাকবে
                  </p>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    আপনার দেওয়া ট্রানজেকশন তথ্য এডমিন প্যানেলের <strong className="text-amber-300">Pending Requests</strong> তালিকায় জমা রয়েছে। এডমিন ভেরিফাই করে অনুমোদন (Accept ও Activate) না করা পর্যন্ত Pro Feature সম্পূর্ণ লক থাকবে।
                  </p>
                </div>
              </div>

              {/* Submitted Details Box */}
              <div className="p-4 rounded-lg bg-[#070512] border border-amber-500/30 text-xs space-y-2">
                <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                  <span className="text-slate-400">Payment Amount:</span>
                  <strong className="text-white font-mono text-sm">${currentUser?.payment?.amount || amount || 30} USD</strong>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                  <span className="text-slate-400">Payment Method:</span>
                  <strong className="text-cyan-400 font-semibold">{currentUser?.payment?.method || selectedMethod}</strong>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                  <span className="text-slate-400">Transaction ID / TrxID:</span>
                  <strong className="text-amber-300 font-mono tracking-wider">{currentUser?.payment?.transactionId || transactionCode || 'Under Verification'}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Status in Database:</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    ⏳ In Admin Pending Queue
                  </span>
                </div>
                {currentUser?.payment?.proofImages && currentUser.payment.proofImages.length > 0 && (
                  <div className="pt-2 border-t border-white/5 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                        <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                        Uploaded Proof Screenshots:
                      </span>
                      <span className="text-amber-300 font-bold text-[11px]">
                        {currentUser.payment.proofImages.length} Photos Attached
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      {currentUser.payment.proofImages.map((img, idx) => (
                        <div
                          key={idx}
                          onClick={() => setPreviewingImage(img)}
                          className="relative group cursor-pointer overflow-hidden rounded-lg border border-amber-500/40 w-16 h-16 bg-black shrink-0 hover:border-amber-300 transition"
                          title="Click to view full photo"
                        >
                          <img src={img} alt={`Proof ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition" />
                          <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[9px] text-amber-300 text-center py-0.5">
                            ছবি {idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/20 flex items-center gap-2.5 text-[11px] text-cyan-200">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>রিয়েল-টাইম সিঙ্ক সক্রিয়: পেজ রিফ্রেশ ছাড়াই এডমিন প্রসেস করলে সাথে সাথে আপডেট হবে।</span>
              </div>
            </div>

            {/* Information card for user */}
            <div
              id="pending-request-info-card"
              className="p-4 rounded-xl bg-[#09152b] border border-cyan-500/30 text-left space-y-2"
            >
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs md:text-sm">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>রিকোয়েস্ট অ্যাডমিন প্যানেলে পাঠানো হয়েছে</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                আপনার পেমেন্ট ট্রানজেকশন রিকোয়েস্ট সফলভাবে অ্যাডমিন প্যানেলে জমা হয়েছে। অ্যাডমিন তার সিকিউর প্যানেল থেকে পেমেন্ট তথ্য যাচাই করে প্রথমে Accept করবেন এবং এরপর ACTIVATE PRO করে দিলেই Pro Feature আনলক হবে।
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                id="pending-contact-admin-btn"
                onClick={() => window.open(TELEGRAM_URL, '_blank', 'noopener,noreferrer')}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:brightness-110 text-white font-bold text-xs md:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Contact Admin on Telegram (@{TELEGRAM_USERNAME})
              </button>
              <button
                id="pending-back-dashboard-btn"
                onClick={() => onNavigate('dashboard')}
                className="h-12 px-6 rounded-xl border border-purple-800/60 hover:bg-purple-950/40 text-purple-200 text-xs md:text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
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
                  Complete your payment to unlock the Pro Future Trading Bot ($30 - $50)
                </p>
              </div>
            </div>

            {/* Price Overview Cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3.5 text-center rounded-xl bg-[#09152b] border border-[#1d3d62]">
                <small className="block text-xs text-slate-400 mb-0.5">Total Payment</small>
                <strong className="text-2xl md:text-3xl font-extrabold text-white">$50</strong>
                <span className="block text-[10px] text-cyan-400 mt-0.5">Full Lifetime License</span>
              </div>

              <div className="p-3.5 text-center rounded-xl bg-[#140b2a] border border-[#8e32e6] shadow-[0_0_15px_rgba(142,50,230,0.2)]">
                <small className="block text-xs text-purple-300 mb-0.5">Minimum Down Payment</small>
                <strong className="text-2xl md:text-3xl font-extrabold text-purple-300">$30</strong>
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
                <span className="text-[11px] font-bold text-purple-400">Min $30 — Max $50</span>
              </div>

              <div className="relative mb-2">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</div>
                <input
                  id="payment-amount-field"
                  type="number"
                  min={30}
                  max={50}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="30"
                  className="w-full h-11 pl-9 pr-4 rounded-xl bg-[#08152c] border border-[#21466e] focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white font-black text-base outline-none transition"
                />
              </div>

              {/* Quick Select Amount Pills */}
              <div className="flex items-center gap-2">
                {[30, 40, 50].map((val) => (
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
                  onClick={handleSelectBkash}
                  className={`h-12 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                    selectedMethod === 'bKash'
                      ? 'border-pink-400 bg-[#2d0922] text-white shadow-[0_0_15px_rgba(255,0,150,0.35)] ring-2 ring-pink-500/30'
                      : 'border-[#1b3d63] bg-[#071832] text-slate-300 hover:bg-[#0c2447]'
                  }`}
                  title="bKash Send Money: 01568760651"
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

              {/* Prominent bKash Number Box shown when bKash is selected */}
              {selectedMethod === 'bKash' && (
                <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-r from-[#2c0823] to-[#170518] border-2 border-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.3)] space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <span className="text-[11px] font-bold text-pink-300 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />
                        bKash Personal / Send Money নম্বর
                      </span>
                      <div className="text-2xl sm:text-3xl font-mono font-black text-white tracking-widest mt-0.5 select-all">
                        {BKASH_NUMBER}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(BKASH_NUMBER);
                        setCopiedBkash(true);
                        showToast(`bKash নম্বর ${BKASH_NUMBER} কপি হয়েছে!`);
                        setTimeout(() => setCopiedBkash(false), 2000);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 active:scale-95 text-white font-bold text-xs shadow-md transition cursor-pointer"
                    >
                      {copiedBkash ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedBkash ? 'কপি হয়েছে ✓' : 'Copy Number'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-pink-200/90 leading-relaxed border-t border-pink-500/30 pt-2">
                    💡 উপরের বিকাশ নম্বরে <strong className="text-white">Send Money</strong> করুন। এরপর নিচে আপনার TrxID লিখুন এবং স্ক্রিনশট আপলোড করে সাবমিট করুন।
                  </p>
                </div>
              )}

              <p className="text-[11px] text-purple-300/80 mt-2 flex items-center gap-1 flex-wrap">
                <span>💡</span> বিকাশ বাটনে ট্যাপ করলে বিকাশ নম্বর আসবে। Binance ও Nagad-এ ট্যাপ করলে Telegram <strong className="text-cyan-300">@{TELEGRAM_USERNAME}</strong> ওপেন হবে।
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
                <div className="space-y-2 py-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-pink-950/40 border border-pink-500/40">
                    <div>
                      <span className="text-[11px] text-pink-300 block font-medium">bKash Personal / Send Money Number:</span>
                      <strong className="text-xl font-mono text-white tracking-wider">{BKASH_NUMBER}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(BKASH_NUMBER);
                        setCopiedBkash(true);
                        showToast(`bKash নম্বর ${BKASH_NUMBER} কপি হয়েছে!`);
                        setTimeout(() => setCopiedBkash(false), 2000);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                    >
                      {copiedBkash ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedBkash ? 'Copied' : 'Copy Number'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Send Money সম্পন্ন করার পর ট্রানজেকশন কোড (TrxID) ও পেমেন্ট স্ক্রিনশট নিচে দিন।
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

            {/* 2-Picture Upload Section (Proof Screenshots) */}
            <div className="mb-5 p-4 rounded-xl bg-[#120a28] border border-purple-500/40 shadow-inner space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                  Upload Payment Proof / Screenshots (২টি ছবি আপলোড করুন)
                </label>
                <span className="text-[11px] font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span>📸</span>
                  {[proofImage1, proofImage2].filter(Boolean).length} / 2 Added
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                পেমেন্ট সম্পন্ন করার পর <strong className="text-purple-300">২টি ছবি</strong> (পেমেন্ট স্লিপ এবং ট্রানজেকশন প্রুফ) আপলোড করুন। সাবমিট করার পর রিকোয়েস্টটি অ্যাডমিন প্যানেলে ছবিসহ চলে যাবে।
              </p>

              {/* Hidden file inputs */}
              <input
                ref={fileInput1Ref}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(1, e)}
              />
              <input
                ref={fileInput2Ref}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(2, e)}
              />

              {/* 2 Picture Upload Slots Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Slot 1: Picture 1 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-purple-200 flex items-center gap-1">
                      <span>📸</span> ছবি ১: পেমেন্ট স্লিপ
                    </span>
                    {proofImage1 && (
                      <span className="text-emerald-400 font-bold flex items-center gap-0.5 text-[10px]">
                        <Check className="w-3 h-3" /> আপলোড হয়েছে
                      </span>
                    )}
                  </div>

                  {proofImage1 ? (
                    <div className="relative group rounded-xl overflow-hidden border-2 border-emerald-500/50 bg-black/60 h-28 flex items-center justify-center shadow-md">
                      <img
                        src={proofImage1}
                        alt="Screenshot 1"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300 cursor-pointer"
                        onClick={() => setPreviewingImage(proofImage1)}
                      />
                      <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewingImage(proofImage1)}
                          className="p-1.5 rounded-lg bg-cyan-500/80 hover:bg-cyan-500 text-white shadow transition cursor-pointer"
                          title="View Full Size"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInput1Ref.current?.click()}
                          className="p-1.5 rounded-lg bg-purple-600/80 hover:bg-purple-600 text-white shadow transition cursor-pointer"
                          title="Change Photo"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveImage(1, e)}
                          className="p-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white shadow transition cursor-pointer"
                          title="Remove Photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold text-emerald-300 border border-emerald-500/40 pointer-events-none">
                        ছবি ১
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInput1Ref.current?.click()}
                      className="w-full h-28 rounded-xl border-2 border-dashed border-purple-500/40 hover:border-cyan-400/80 bg-[#0a0518] hover:bg-[#0e0724] text-slate-400 hover:text-white flex flex-col items-center justify-center gap-1.5 transition cursor-pointer group shadow-inner"
                    >
                      <div className="w-9 h-9 rounded-full bg-purple-500/10 group-hover:bg-cyan-500/20 text-purple-400 group-hover:text-cyan-300 flex items-center justify-center transition">
                        <Upload className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-purple-200 group-hover:text-cyan-300">
                        ছবি ১ সিলেক্ট করুন
                      </span>
                      <span className="text-[10px] text-slate-500">
                        (Screenshot 1 / Payment Slip)
                      </span>
                    </button>
                  )}
                </div>

                {/* Slot 2: Picture 2 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-purple-200 flex items-center gap-1">
                      <span>📸</span> ছবি ২: ট্রানজেকশন প্রুফ
                    </span>
                    {proofImage2 && (
                      <span className="text-emerald-400 font-bold flex items-center gap-0.5 text-[10px]">
                        <Check className="w-3 h-3" /> আপলোড হয়েছে
                      </span>
                    )}
                  </div>

                  {proofImage2 ? (
                    <div className="relative group rounded-xl overflow-hidden border-2 border-emerald-500/50 bg-black/60 h-28 flex items-center justify-center shadow-md">
                      <img
                        src={proofImage2}
                        alt="Screenshot 2"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300 cursor-pointer"
                        onClick={() => setPreviewingImage(proofImage2)}
                      />
                      <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewingImage(proofImage2)}
                          className="p-1.5 rounded-lg bg-cyan-500/80 hover:bg-cyan-500 text-white shadow transition cursor-pointer"
                          title="View Full Size"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInput2Ref.current?.click()}
                          className="p-1.5 rounded-lg bg-purple-600/80 hover:bg-purple-600 text-white shadow transition cursor-pointer"
                          title="Change Photo"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveImage(2, e)}
                          className="p-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white shadow transition cursor-pointer"
                          title="Remove Photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold text-emerald-300 border border-emerald-500/40 pointer-events-none">
                        ছবি ২
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInput2Ref.current?.click()}
                      className="w-full h-28 rounded-xl border-2 border-dashed border-purple-500/40 hover:border-cyan-400/80 bg-[#0a0518] hover:bg-[#0e0724] text-slate-400 hover:text-white flex flex-col items-center justify-center gap-1.5 transition cursor-pointer group shadow-inner"
                    >
                      <div className="w-9 h-9 rounded-full bg-purple-500/10 group-hover:bg-cyan-500/20 text-purple-400 group-hover:text-cyan-300 flex items-center justify-center transition">
                        <Upload className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-purple-200 group-hover:text-cyan-300">
                        ছবি ২ সিলেক্ট করুন
                      </span>
                      <span className="text-[10px] text-slate-500">
                        (Screenshot 2 / Trx Confirmation)
                      </span>
                    </button>
                  )}
                </div>
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
                  Payment Transaction / TrxID
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
                placeholder="পেমেন্ট ট্রানজেকশন দিন (Payment Transaction ID)"
                className="w-full h-12 px-4 rounded-xl bg-[#0a0518] border border-purple-500/50 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 text-sm text-white placeholder:text-slate-400 font-mono outline-none transition"
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
                disabled={!isCodeValid || isSubmitting}
                onClick={handlePayNow}
                className={`w-full h-14 md:h-15 rounded-xl font-black text-base md:text-lg tracking-wide border-2 flex items-center justify-center gap-2.5 transition-all transform ${
                  isCodeValid && !isSubmitting
                    ? 'bg-gradient-to-r from-[#763cff] to-[#c022ff] hover:brightness-110 text-white shadow-[0_8px_30px_rgba(180,30,255,0.45)] border-purple-400/40 active:scale-[0.98] cursor-pointer'
                    : 'bg-[#150e26] border-purple-950 text-slate-500 cursor-not-allowed opacity-60 shadow-none'
                }`}
                title={!isCodeValid ? 'Enter transaction code first' : `SUBMIT PAYMENT REQUEST (${amount})`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-white shrink-0" />
                    <span>পেন্ডিং লিস্টে পাঠানো হচ্ছে... (Submitting...)</span>
                  </>
                ) : isCodeValid ? (
                  <>
                    <Clock className="w-5 h-5 text-amber-300 shrink-0" />
                    <span>
                      SUBMIT PAYMENT REQUEST (${amount})
                      {[proofImage1, proofImage2].filter(Boolean).length > 0 && (
                        <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-emerald-400 text-black font-extrabold">
                          +{[proofImage1, proofImage2].filter(Boolean).length} Pics
                        </span>
                      )}
                    </span>
                  </>
                ) : (
                  '🔒 ট্রানজেকশন আইডি দিন (Enter TrxID to Submit Request)'
                )}
              </button>

              <p className="text-center text-[11px] text-purple-300/80">
                💡 সাবমিট করার পর রিকোয়েস্ট PENDING অবস্থায় থাকবে। এডমিন রিভিউ করে Accept এবং ম্যানুয়ালি ACTIVATE PRO করার পর Pro Feature আনলক হবে।
              </p>

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

        {/* ========================================================================= */}
        {/* PREVIEW PROOF IMAGE MODAL (LIGHTBOX) */}
        {/* ========================================================================= */}
        {previewingImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setPreviewingImage(null)}
          >
            <div
              className="relative max-w-xl w-full p-4 rounded-2xl bg-[#0c061e] border border-purple-500/50 shadow-[0_0_50px_rgba(165,44,255,0.4)] text-center space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  Uploaded Screenshot Preview
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewingImage(null)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-[70vh] overflow-auto rounded-xl bg-black/60 p-1 flex items-center justify-center">
                <img
                  src={previewingImage}
                  alt="Full Proof Preview"
                  className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-lg"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setPreviewingImage(null)}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
