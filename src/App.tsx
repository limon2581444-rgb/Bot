import React, { useState, useEffect } from 'react';
import { User, Page, PaymentInfo } from './types';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from './data/constants';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import { AuthViews } from './components/AuthViews';
import { DashboardView } from './components/DashboardView';
import { FreeBotView } from './components/FreeBotView';
import { PaidBotView } from './components/PaidBotView';
import { PaymentView } from './components/PaymentView';
import { StatusViews } from './components/StatusViews';
import { AdminPanel } from './components/AdminPanel';
import {
  registerWithFirebase,
  loginWithFirebase,
  adminLoginWithFirebase,
  logoutFromFirebase,
  submitPaymentToFirebase,
  approvePaymentInFirebase,
  rejectPaymentInFirebase,
  removeUserInFirebase,
  subscribeToCurrentUser,
  subscribeToAllUsers,
} from './lib/firebaseDb';

export default function App() {
  // Shared real-time users from Firebase Firestore
  const [users, setUsers] = useState<User[]>([]);

  // Current authenticated user
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('tl_current_session');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading session cache', e);
    }
    return null;
  });

  // Active page route
  const [page, setPage] = useState<Page>(() => {
    try {
      const saved = localStorage.getItem('tl_current_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.role === 'admin') return 'admin';
        return 'dashboard';
      }
    } catch {}
    return 'login';
  });

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync session cache
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('tl_current_session', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('tl_current_session');
      }
    } catch (e) {
      console.error('Failed to sync session', e);
    }
  }, [currentUser]);

  // Real-time listener for all users (ensures Phone A payment request instantly shows on Phone B Admin Panel)
  useEffect(() => {
    // Only subscribe to all users if current user is admin or on admin page
    if (page === 'admin' || currentUser?.role === 'admin') {
      const unsubscribe = subscribeToAllUsers((firestoreUsers) => {
        setUsers(firestoreUsers);
      });
      return () => unsubscribe();
    }
  }, [page, currentUser?.role]);

  // Real-time listener for current logged-in user
  // When Admin on Phone B approves, Phone A user's status updates in real-time and unlocks Pro Future
  useEffect(() => {
    if (!currentUser?.id && !currentUser?.email) return;

    // Listen by ID if available
    if (currentUser.id && currentUser.id !== 'admin_master') {
      const unsubscribe = subscribeToCurrentUser(currentUser.id, (updated) => {
        setCurrentUser((prev) => {
          if (!prev) return updated;
          return {
            ...prev,
            ...updated,
          };
        });

        // If status changed to approved and user was waiting on pending screen, notify and unlock
        if (updated.status === 'approved' && page === 'pending') {
          showToast('🎉 Your payment has been approved! Pro Future unlocked.');
          setPage('pro');
        } else if (updated.status === 'removed') {
          setPage('denied');
        }
      });
      return () => unsubscribe();
    }
  }, [currentUser?.id, page]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2500);
  };

  // User Login Handler (Cross-device Firebase Auth & Firestore)
  const handleLogin = async (email: string, pass: string): Promise<boolean> => {
    const res = await loginWithFirebase(email, pass);
    if (!res.success || !res.user) {
      showToast(res.error || 'Invalid Gmail or password');
      return false;
    }

    const loggedUser = res.user;
    setCurrentUser(loggedUser);

    if (loggedUser.status === 'removed') {
      setPage('denied');
    } else {
      setPage('dashboard');
    }

    showToast(`Welcome back, ${loggedUser.email.split('@')[0]}`);
    return true;
  };

  // User Registration Handler (Cross-device Firebase Auth & Firestore)
  const handleRegister = async (email: string, pass: string): Promise<boolean> => {
    const res = await registerWithFirebase(email, pass);
    if (!res.success || !res.user) {
      showToast(res.error || 'Registration failed');
      return false;
    }

    setCurrentUser(res.user);
    if (res.user.status === 'removed') {
      setPage('denied');
    } else {
      setPage('dashboard');
    }

    if (res.alreadyRegistered) {
      showToast(`Welcome back, ${res.user.email.split('@')[0]}!`);
    } else {
      showToast('Registration successful! Welcome to Trade Lens');
    }
    return true;
  };

  // Admin Login Handler
  const handleAdminLogin = async (email: string, pass: string): Promise<boolean> => {
    const res = await adminLoginWithFirebase(email, pass);
    if (!res.success || !res.user) {
      showToast(res.error || 'Invalid admin credentials');
      return false;
    }

    setCurrentUser(res.user);
    setPage('admin');
    showToast('Admin access granted');
    return true;
  };

  // User Sign Out
  const handleLogout = async () => {
    await logoutFromFirebase();
    setCurrentUser(null);
    setPage('login');
    showToast('Signed out successfully');
  };

  // Admin Logout
  const handleLogoutAdmin = async () => {
    await logoutFromFirebase();
    setCurrentUser(null);
    setPage('adminLogin');
    showToast('Admin signed out');
  };

  // Submit Payment Request (Saves directly to Firebase Firestore for cross-device visibility)
  const handleSubmitPayment = async (payment: PaymentInfo) => {
    if (!currentUser) return;

    try {
      const userId = currentUser.id || currentUser.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
      await submitPaymentToFirebase(userId, currentUser.email, payment);

      // Optimistically update current local state while Firestore listener confirms
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              status: 'pending',
              payment,
            }
          : null
      );

      setPage('pending');
      showToast('Payment request submitted to Firebase! Awaiting admin approval.');
    } catch (err: any) {
      console.error('Failed to submit payment:', err);
      showToast('Failed to send payment request to cloud database.');
    }
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

  // Admin: Approve User Payment (Updates Firebase in real-time)
  const handleApproveUser = async (email: string) => {
    try {
      await approvePaymentInFirebase(email);
      showToast(`Approved Pro Future access for ${email}`);
    } catch (err) {
      console.error('Approve error', err);
      showToast('Error approving user in Firebase');
    }
  };

  // Admin: Reject User Payment (Updates Firebase in real-time)
  const handleRejectUser = async (email: string) => {
    try {
      await rejectPaymentInFirebase(email);
      showToast(`Payment request for ${email} was rejected`);
    } catch (err) {
      console.error('Reject error', err);
      showToast('Error rejecting user in Firebase');
    }
  };

  // Admin: Remove User / Revoke Access (Updates Firebase in real-time)
  const handleRemoveUser = async (email: string) => {
    if (!window.confirm(`Revoke and remove trading privileges for ${email}?`)) {
      return;
    }

    try {
      await removeUserInFirebase(email);
      showToast(`Revoked access for ${email}`);
    } catch (err) {
      console.error('Remove error', err);
      showToast('Error removing user');
    }
  };

  // Admin: Add sample test user in cloud
  const handleAddTestUser = async () => {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const testEmail = `trader${randomId}_${Date.now()}@gmail.com`;
    const payment: PaymentInfo = {
      amount: 15,
      method: Math.random() > 0.5 ? 'Binance' : 'bKash',
      transactionId: `TRX${randomId}`,
      date: new Date().toLocaleString(),
    };

    try {
      const regRes = await registerWithFirebase(testEmail, 'password123');
      if (regRes.user?.id) {
        await submitPaymentToFirebase(regRes.user.id, testEmail, payment);
      }
      showToast(`Added test payment request for ${testEmail}`);
    } catch (e) {
      console.error(e);
    }
  };

  // Admin: Reset to default demo data (cleans local view)
  const handleResetDemoData = () => {
    showToast('Database is synchronized in real-time with Firebase');
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
              onSubmitPayment={handleSubmitPayment}
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
          className="text-purple-400 hover:text-purple-300 transition underline underline-offset-2 cursor-pointer"
        >
          Admin Portal
        </button>
        <span className="hidden sm:inline">•</span>
        <button
          id="footer-free-bot-link"
          onClick={() => setPage('free')}
          className="text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
        >
          Free Bot
        </button>
        <button
          id="footer-pro-bot-link"
          onClick={handlePaidAction}
          className="text-purple-400 hover:text-purple-300 transition cursor-pointer"
        >
          Paid Bot
        </button>
      </footer>
    </div>
  );
}
