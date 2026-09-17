import React, { useState } from 'react';
import { Page } from '../types';
import { FREE_BOT_URL } from '../data/constants';
import { Gift, Copy, Check, ArrowLeft, Bookmark, HelpCircle } from 'lucide-react';

interface FreeBotViewProps {
  onNavigate: (page: Page) => void;
  showToast: (msg: string) => void;
}

export const FreeBotView: React.FC<FreeBotViewProps> = ({
  onNavigate,
  showToast,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(FREE_BOT_URL)
      .then(() => {
        setCopied(true);
        showToast('Free Bot Bookmarklet URL copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        showToast('Failed to copy bookmarklet');
      });
  };

  return (
    <div id="free-bot-view" className="w-full max-w-3xl mx-auto px-4 py-8 md:py-12">
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#061a35] to-[#040a19] border border-[#087cb9] shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#004d83] to-[#00b8ff] text-white shadow-md">
            <Gift className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Free Bot</h2>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              Your Browser Bookmarklet Script URL
            </p>
          </div>
        </div>

        {/* URL Box */}
        <div className="relative mb-5 p-4 rounded-xl bg-[#020a17] border border-[#245179]">
          <code
            id="free-bot-code-display"
            className="block text-xs font-mono text-[#75ddff] break-all pr-12 leading-relaxed selection:bg-cyan-500/30 select-all"
          >
            {FREE_BOT_URL}
          </code>

          <button
            id="copy-free-bot-inline-btn"
            onClick={handleCopy}
            className="absolute right-3 top-3 w-9 h-9 rounded-lg bg-[#0b1d36] hover:bg-[#132c52] border border-[#245179] text-white flex items-center justify-center transition"
            title="Copy script"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4 text-slate-300" />
            )}
          </button>
        </div>

        {/* Info Box */}
        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs md:text-sm text-slate-300 leading-relaxed space-y-1">
          <strong className="text-[#00e4ff] flex items-center gap-1.5">
            <Bookmark className="w-4 h-4" />
            Free Bot Access Activated
          </strong>
          <p>
            No payment required. Copy the bookmarklet script above, create a new bookmark in your browser with any name (e.g. "Trade Lens Free"), and paste the code into the URL field.
          </p>
        </div>

        {/* Step by step guide */}
        <div className="mt-5 p-4 rounded-xl bg-[#061427] border border-slate-800 text-xs text-slate-300">
          <p className="font-semibold text-white mb-2 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            How to use on your chart:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
            <li>Click <span className="text-cyan-300 font-medium">"Copy Script URL"</span> below.</li>
            <li>Press <span className="text-cyan-300 font-medium">Ctrl+D</span> (or Cmd+D) to bookmark any page, then click "More / Edit".</li>
            <li>Replace the bookmark's address with the copied <span className="text-cyan-300 font-mono">javascript:...</span> code.</li>
            <li>Open your broker chart (Binance, TradingView, Pocket Option, etc.) and click the bookmarklet!</li>
          </ol>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            id="copy-free-url-main-btn"
            onClick={handleCopy}
            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-[#00cfff] to-[#1976ff] hover:brightness-110 text-white font-bold text-sm shadow-[0_4px_20px_rgba(0,180,255,0.25)] flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied to Clipboard!' : 'Copy Script URL'}
          </button>

          <button
            id="back-to-dash-from-free-btn"
            onClick={() => onNavigate('dashboard')}
            className="h-11 px-5 rounded-xl border border-[#2b4e72] hover:bg-slate-800/40 text-slate-300 text-sm font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
