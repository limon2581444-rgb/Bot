import React, { useState, useEffect } from 'react';
import { User, Page, PaymentInfo } from './types';
import { ADMIN_EMAIL, ADMIN_PASSWORD, INITIAL_USERS } from './data/constants';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import { AuthViews } from './components/AuthViews';
import { DashboardView } from './components/DashboardView';
import { FreeBotView } from './components/FreeBotView';
import { PaidBotView } from './components/PaidBotView';
import { PaymentView } from './components/PaymentView';
import { StatusViews } from './components/StatusViews';
import { AdminPanel } from './components/AdminPanel';

export default function App() {
  // Load users from localStorage or initial demo data
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('tl_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading users from storage', e);
    }
    return INITIAL_USERS;
  });

  // Load current active user
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('tl_currentUser');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading current user from storage', e);
    }
    return null;
  });

  // Active page route
  const [page, setPage] = useState<Page>(() => {
    try {
      const savedUser = localStorage.getItem('tl_currentUser');
      return savedUser ? 'dashboard' : 'login';
    } catch {
      return 'login';
    }
  });

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Synchronize users to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('tl_users', JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users', e);
    }
  }, [users]);

  // Synchronize currentUser to localStorage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('tl_currentUser', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('tl_currentUser');
      }
    } catch (e) {
      console.error('Failed to save current user', e);
    }
  }, [currentUser]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2500);
  };

  // User Login Handler
  const handleLogin = (email: string, pass: string): boolean => {
    const found = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === pass
    );

    if (!found) {
      return false;
    }

    const sessionUser: User = {
      email: found.email,
      status: found.status,
      payment: found.payment,
    };

    setCurrentUser(sessionUser);

    if (found.status === 'removed') {
      setPage('denied');
    } else {
      setPage('dashboard');
    }

    showToast(`Welcome back, ${found.email.split('@')[0]}`);
    return true;
  };

  // User Registration Handler
  const handleRegister = (email: string, pass: string): boolean => {
    const exists = users.some(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (exists) {
      return false;
    }

    const newUser: User = {
      email,
      password: pass,
      status: 'active',
      payment: null,
      created: new Date().toLocaleString(),
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUser({
      email: newUser.email,
      status: newUser.status,
      payment: null,
    });
    setPage('dashboard');
    return true;
  };

  // Admin Login Handler
  const handleAdminLogin = (email: string, pass: string): boolean => {
    if (email === ADMIN_EMAIL && pass === ADMIN_PASSWORD) {
      setPage('admin');
      return true;
    }
    return false;
  };

  // User Sign Out
  const handleLogout = () => {
    setCurrentUser(null);
    setPage('login');
    showToast('Signed out successfully');
  };

  // Admin Logout
  const handleLogoutAdmin = () => {
    setPage('adminLogin');
    showToast('Admin signed out');
  };

  // Submit Payment
  const handleSubmitPayment = (payment: PaymentInfo) => {
    if (!currentUser) return;

    const updatedUser: User = {
      ...currentUser,
      status: 'pending',
      payment,
    };

    setCurrentUser(updatedUser);

    setUsers((prev) =>
      prev.map((u) =>
        u.email.toLowerCase() === currentUser.email.toLowerCase()
          ? { ...u, status: 'pending', payment }
          : u
      )
    );

    setPage('pending');
  };

  // Paid Bot Decision Flow
  const handlePaidAction = () => {
    if (!currentUser) {
      setPage('login');
      return;
    }

    if (currentUser.status === 'removed') {
      setPage('denied');
      return;
    }

    if (currentUser.status === 'approved') {
      setPage('pro');
      return;
    }

    if (currentUser.status === 'pending') {
      setPage('pending');
      return;
    }

    setPage('paid');
  };

  // Admin: Approve User Payment
  const handleApproveUser = (email: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.email.toLowerCase() === email.toLowerCase()
          ? { ...u, status: 'approved' }
          : u
      )
    );

    if (currentUser && currentUser.email.toLowerCase() === email.toLowerCase()) {
      setCurrentUser((prev) => (prev ? { ...prev, status: 'approved' } : null));
    }

    showToast(`Approved Pro Future access for ${email}`);
  };

  // Admin: Reject User Payment
  const handleRejectUser = (email: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.email.toLowerCase() === email.toLowerCase()
          ? { ...u, status: 'rejected' }
          : u
      )
    );

    if (currentUser && currentUser.email.toLowerCase() === email.toLowerCase()) {
      setCurrentUser((prev) => (prev ? { ...prev, status: 'rejected' } : null));
    }

    showToast(`Payment request for ${email} was rejected`);
  };

  // Admin: Remove User / Revoke Access
  const handleRemoveUser = (email: string) => {
    if (!window.confirm(`Revoke and remove trading privileges for ${email}?`)) {
      return;
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.email.toLowerCase() === email.toLowerCase()
          ? { ...u, status: 'removed' }
          : u
      )
    );

    if (currentUser && currentUser.email.toLowerCase() === email.toLowerCase()) {
      setCurrentUser((prev) => (prev ? { ...prev, status: 'removed' } : null));
    }

    showToast(`Revoked access for ${email}`);
  };

  // Admin: Add sample test user
  const handleAddTestUser = () => {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const testEmail = `trader${randomId}@gmail.com`;
    const newUser: User = {
      email: testEmail,
      password: 'password123',
      status: 'pending',
      payment: {
        amount: 15,
        method: Math.random() > 0.5 ? 'Binance' : 'bKash',
        date: new Date().toLocaleString(),
      },
      created: new Date().toLocaleString(),
    };
    setUsers((prev) => [newUser, ...prev]);
    showToast(`Added test payment request for ${testEmail}`);
  };

  // Admin: Reset to default demo data
  const handleResetDemoData = () => {
    if (window.confirm('Reset all demo user records back to default?')) {
      setUsers(INITIAL_USERS);
      showToast('Demo users reset to default');
    }
  };

  // If on admin view, render Admin Panel directly
  if (page === 'admin') {
    return (
      <div className="min-h-screen bg-[#030611] font-sans antialiased text-white selection:bg-purple-500/30">
        <Toast message={toastMessage} />
        <AdminPanel
          users={users}
          onApproveUser={handleApproveUser}
          onRejectUser={handleRejectUser}
          onRemoveUser={handleRemoveUser}
          onAddTestUser={handleAddTestUser}
          onResetDemoData={handleResetDemoData}
          onNavigate={setPage}
          onLogoutAdmin={handleLogoutAdmin}
        />
      </div>
    );
  }

  // If on auth screens
  if (page === 'login' || page === 'register' || page === 'adminLogin') {
    return (
      <div className="min-h-screen bg-[#030916] font-sans antialiased text-white selection:bg-cyan-500/30">
        <Toast message={toastMessage} />
        <AuthViews
          page={page}
          onNavigate={setPage}
          onLogin={handleLogin}
          onRegister={handleRegister}
          onAdminLogin={handleAdminLogin}
          showToast={showToast}
        />
      </div>
    );
  }

  // Authenticated Portal Pages
  return (
    <div className="min-h-screen bg-[#030916] font-sans antialiased text-white selection:bg-cyan-500/30 flex flex-col justify-between">
      <div>
        <Toast message={toastMessage} />

        <Header
          currentUser={currentUser}
          page={page}
          onNavigate={setPage}
          onLogout={handleLogout}
        />

        <main className="w-full">
          {page === 'dashboard' && currentUser && (
            <DashboardView
              currentUser={currentUser}
              onNavigate={setPage}
              onPaidAction={handlePaidAction}
            />
          )}

          {page === 'free' && (
            <FreeBotView onNavigate={setPage} showToast={showToast} />
          )}

          {page === 'paid' && (
            <PaidBotView
              currentUser={currentUser}
              onNavigate={setPage}
              showToast={showToast}
            />
          )}

          {page === 'payment' && (
            <PaymentView
              onNavigate={setPage}
              onSubmitPayment={handleSubmitPayment}
              showToast={showToast}
            />
          )}

          {(page === 'pending' || page === 'denied' || page === 'pro') && currentUser && (
            <StatusViews
              type={page}
              currentUser={currentUser}
              onNavigate={setPage}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Persistent Quick Navigation Footer */}
      <footer className="w-full py-4 border-t border-slate-800/80 bg-[#020713]/80 backdrop-blur text-center text-xs text-slate-500 flex flex-wrap items-center justify-center gap-4 px-4">
        <span>TRADE LENS © 2026. All rights reserved.</span>
        <span className="hidden sm:inline">•</span>
        <button
          id="footer-admin-link"
          onClick={() => setPage('adminLogin')}
          className="text-purple-400 hover:text-purple-300 transition underline underline-offset-2"
        >
          Admin Portal (00000000)
        </button>
        <span className="hidden sm:inline">•</span>
        <button
          id="footer-free-bot-link"
          onClick={() => setPage('free')}
          className="text-cyan-400 hover:text-cyan-300 transition"
        >
          Free Bot
        </button>
        <button
          id="footer-pro-bot-link"
          onClick={handlePaidAction}
          className="text-purple-400 hover:text-purple-300 transition"
        >
          Paid Bot
        </button>
      </footer>
    </div>
  );
}
