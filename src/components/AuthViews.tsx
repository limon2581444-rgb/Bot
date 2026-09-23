import React, { useState } from 'react';
import { Page } from '../types';
import { TrendingUp, Eye, EyeOff, ShieldCheck, KeyRound, Mail, Lock } from 'lucide-react';

interface AuthViewsProps {
  page: 'login' | 'register' | 'adminLogin';
  onNavigate: (page: Page) => void;
  onLogin: (email: string, pass: string) => Promise<boolean>;
  onRegister: (email: string, pass: string) => Promise<boolean>;
  onAdminLogin: (email: string, pass: string) => Promise<boolean>;
  showToast: (msg: string) => void;
}

export const AuthViews: React.FC<AuthViewsProps> = ({
  page,
  onNavigate,
  onLogin,
  onRegister,
  onAdminLogin,
  showToast,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle User Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      showToast('Please fill in all fields');
      return;
    }
    setIsSubmitting(true);
    try {
      await onLogin(cleanEmail, password);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle User Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith('@gmail.com')) {
      showToast('Please use a valid Gmail address (@gmail.com)');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters');
      return;
    }
    setIsSubmitting(true);
    try {
      await onRegister(cleanEmail, password);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Admin Login
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onAdminLogin(email.trim(), password.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="auth-wrapper"
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
    >
      {/* Background ambient neon glows */}
      <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-purple-600/10 blur-[130px] pointer-events-none" />

      <div
        id="auth-card"
        className={`w-full max-w-[440px] p-7 sm:p-9 rounded-2xl border backdrop-blur-xl relative z-10 transition-all ${
          page === 'adminLogin'
            ? 'border-purple-500/40 bg-gradient-to-b from-[#0e0c24]/95 to-[#040412]/95 shadow-[0_0_50px_rgba(150,0,255,0.15)]'
            : 'border-cyan-500/30 bg-gradient-to-b from-[#05132a]/95 to-[#020816]/95 shadow-[0_0_50px_rgba(0,180,255,0.12)]'
        }`}
      >
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div
            className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 ${
              page === 'adminLogin'
                ? 'bg-gradient-to-br from-[#763cff] to-[#c022ff] shadow-purple-500/30'
                : 'bg-gradient-to-br from-[#00f2fe] to-[#2377ff] shadow-cyan-500/30'
            }`}
          >
            {page === 'adminLogin' ? (
              <ShieldCheck className="w-8 h-8 text-white" />
            ) : (
              <TrendingUp className="w-8 h-8 text-black" />
            )}
          </div>

          <h1 className="mt-3.5 text-2xl font-black tracking-wider text-white">
            TRADE{' '}
            <span className={page === 'adminLogin' ? 'text-purple-400' : 'text-[#00eaff]'}>
              LENS
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {page === 'adminLogin' ? 'Admin Control Portal' : 'Smarter Tools. Better Trades.'}
          </p>
        </div>

        {/* View Heading */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {page === 'login' && 'Welcome Back'}
            {page === 'register' && 'Create Your Account'}
            {page === 'adminLogin' && 'Admin Verification'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {page === 'login' && 'Sign in to access your trading bots'}
            {page === 'register' && 'Register with your Gmail and a secure password'}
            {page === 'adminLogin' && 'Authorized personnel only'}
          </p>
        </div>

        {/* Forms */}
        {page === 'login' && (
          <form id="form-login" onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                Gmail Address
              </label>
              <div className="relative">
                <input
                  id="login-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  required
                  className="w-full h-11 px-3.5 rounded-xl bg-[#081a35] border border-[#21466e] focus:border-[#00dfff] focus:ring-2 focus:ring-cyan-400/20 text-sm text-white placeholder:text-slate-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full h-11 px-3.5 pr-11 rounded-xl bg-[#081a35] border border-[#21466e] focus:border-[#00dfff] focus:ring-2 focus:ring-cyan-400/20 text-sm text-white placeholder:text-slate-500 outline-none transition"
                />
                <button
                  type="button"
                  id="toggle-login-pass-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="submit-login-btn"
              type="submit"
              className="w-full h-11 mt-2 rounded-xl bg-gradient-to-r from-[#00cfff] to-[#1976ff] hover:brightness-110 text-white font-bold text-sm tracking-wide shadow-[0_4px_20px_rgba(0,160,255,0.25)] active:scale-[0.99] transition"
            >
              Sign In
            </button>
          </form>
        )}

        {page === 'register' && (
          <form id="form-register" onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                Gmail Address
              </label>
              <div className="relative">
                <input
                  id="register-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  required
                  className="w-full h-11 px-3.5 rounded-xl bg-[#081a35] border border-[#21466e] focus:border-[#00dfff] focus:ring-2 focus:ring-cyan-400/20 text-sm text-white placeholder:text-slate-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                Password (min. 6 characters)
              </label>
              <div className="relative">
                <input
                  id="register-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create strong password"
                  minLength={6}
                  required
                  className="w-full h-11 px-3.5 pr-11 rounded-xl bg-[#081a35] border border-[#21466e] focus:border-[#00dfff] focus:ring-2 focus:ring-cyan-400/20 text-sm text-white placeholder:text-slate-500 outline-none transition"
                />
                <button
                  type="button"
                  id="toggle-reg-pass-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="submit-register-btn"
              type="submit"
              className="w-full h-11 mt-2 rounded-xl bg-gradient-to-r from-[#00cfff] to-[#1976ff] hover:brightness-110 text-white font-bold text-sm tracking-wide shadow-[0_4px_20px_rgba(0,160,255,0.25)] active:scale-[0.99] transition"
            >
              Create Account
            </button>
          </form>
        )}

        {page === 'adminLogin' && (
          <form id="form-admin-login" onSubmit={handleAdminSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                Email / Admin ID
              </label>
              <div className="relative">
                <input
                  id="admin-email-input"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=""
                  autoComplete="off"
                  required
                  className="w-full h-11 px-3.5 rounded-xl bg-[#140f2e] border border-purple-800/60 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-sm text-white placeholder:text-slate-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-purple-400" />
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=""
                  autoComplete="off"
                  required
                  className="w-full h-11 px-3.5 pr-11 rounded-xl bg-[#140f2e] border border-purple-800/60 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-sm text-white placeholder:text-slate-500 outline-none transition"
                />
                <button
                  type="button"
                  id="toggle-admin-pass-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-300 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="submit-admin-login-btn"
              type="submit"
              className="w-full h-11 mt-2 rounded-xl bg-gradient-to-r from-[#763cff] to-[#c022ff] hover:brightness-110 text-white font-bold text-sm tracking-wide shadow-[0_4px_20px_rgba(180,30,255,0.3)] active:scale-[0.99] transition cursor-pointer"
            >
              Verify Admin Access
            </button>
          </form>
        )}

        {/* Footer Navigation Switch */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400 space-y-2">
          {page === 'login' && (
            <div>
              Don't have an account?{' '}
              <button
                id="switch-to-register-btn"
                onClick={() => {
                  setEmail('');
                  setPassword('');
                  onNavigate('register');
                }}
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition"
              >
                Register
              </button>
            </div>
          )}

          {page === 'register' && (
            <div>
              Already have an account?{' '}
              <button
                id="switch-to-login-btn"
                onClick={() => {
                  setEmail('');
                  setPassword('');
                  onNavigate('login');
                }}
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition"
              >
                Sign In
              </button>
            </div>
          )}

          {page === 'adminLogin' && (
            <div>
              <button
                id="switch-to-user-portal-btn"
                onClick={() => {
                  setEmail('');
                  setPassword('');
                  onNavigate('login');
                }}
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition"
              >
                ← Back to User Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
