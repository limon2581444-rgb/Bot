import React, { useState, useEffect } from 'react';
import { User, Page, PaymentInfo, PaymentRequest, AdminAuditLog } from './types';
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
  acceptPaymentInFirebase,
  activateProUserInFirebase,
  approvePaymentInFirebase,
  rejectPaymentInFirebase,
  removeUserInFirebase,
  removeAllApprovedUsersInFirebase,
  subscribeToCurrentUser,
  subscribeToAllUsers,
  subscribeToPaymentRequests,
  subscribeToAuditLogs,
} from './lib/firebaseDb';
import { ShieldAlert } from 'lucide-react';
import { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_DEMO_PASS, ADMIN_NUMBER } from './data/constants';

export default function App() {
  // Shared real-time users from Firebase Firestore
  const [users, setUsers] = useState<User[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

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
        if (parsed?.role === 'admin' && sessionStorage.getItem('tl_admin_verified') === 'true') {
          return 'admin';
        }
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

  // Real-time listener for all users & requests when on Admin Panel
  useEffect(() => {
    if (page === 'admin' || currentUser?.role === 'admin') {
      const unsubUsers = subscribeToAllUsers((firestoreUsers) => {
        setUsers(firestoreUsers);
      });
      const unsubReqs = subscribeToPaymentRequests((reqs) => {
        setPaymentRequests(reqs);
      });
      const unsubLogs = subscribeToAuditLogs((logs) => {
        setAuditLogs(logs);
      });
      return () => {
        unsubUsers();
        unsubReqs();
        unsubLogs();
      };
    }
  }, [page, currentUser?.role]);

  // Real-time listener for current logged-in user (instant cross-device activation)
  useEffect(() => {
    if (!currentUser?.id && !currentUser?.email) return;

    const unsubscribe = subscribeToCurrentUser(
      currentUser.id || '',
      currentUser.email || '',
      (updated) => {
        setCurrentUser((prev) => {
          if (!prev) return updated as User;
          return {
            ...prev,
            ...updated,
          };
        });

        const isNowProActive =
          (updated.role === 'admin' || updated.proAccess === true) &&
          (updated.status === 'active' || updated.status === 'approved');

        if (isNowProActive && (page === 'pending' || page === 'paid')) {
          showToast('🎉 Your payment has been activated by Admin! Pro Feature UNLOCKED.');
          setPage('pro');
        } else if (updated.status === 'disabled' || updated.status === 'removed') {
          if (page === 'pro') {
            showToast('⚠️ Pro Feature license has been revoked.');
            setPage('denied');
          }
        }
      }
    );
    return () => unsubscribe();
  }, [currentUser?.id, currentUser?.email, page]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2500);
  };

  // Unified Login Handler: If admin credentials are provided, log in as Admin directly
  const handleLogin = async (email: string, pass: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();

    // Check if this is an Admin login attempt via Admin Gmail / ID and password
    const isAdminCredentials =
      (cleanEmail === ADMIN_EMAIL.toLowerCase() ||
        cleanEmail === 'limon2581444@gmail.com' ||
        cleanEmail === 'admin' ||
        cleanEmail === ADMIN_NUMBER.toLowerCase()) &&
      (pass === ADMIN_PASSWORD ||
        pass === '00000000' ||
        pass === 'limonAbc123' ||
        pass === ADMIN_DEMO_PASS);

    if (isAdminCredentials) {
      const adminRes = await adminLoginWithFirebase(cleanEmail, pass);
      if (adminRes.success && adminRes.user) {
        sessionStorage.setItem('tl_admin_verified', 'true');
        setCurrentUser(adminRes.user);
        setPage('admin');
        showToast('Admin access granted! Welcome Admin.');
        return true;
      }
    }

    // Standard user login via Firebase
    const res = await loginWithFirebase(cleanEmail, pass);
    if (!res.success || !res.user) {
      // Fallback check: if direct auth failed but it matches admin credentials
      const fallbackAdmin = await adminLoginWithFirebase(cleanEmail, pass);
      if (fallbackAdmin.success && fallbackAdmin.user) {
        sessionStorage.setItem('tl_admin_verified', 'true');
        setCurrentUser(fallbackAdmin.user);
        setPage('admin');
        showToast('Admin access granted! Welcome Admin.');
        return true;
      }

      showToast(res.error || 'Invalid Gmail or password');
      return false;
    }

    // If user has admin role in Firestore or admin email
    if (
      res.user.role === 'admin' ||
      cleanEmail === ADMIN_EMAIL.toLowerCase() ||
      cleanEmail === 'limon2581444@gmail.com'
    ) {
      sessionStorage.setItem('tl_admin_verified', 'true');
      const adminUser: User = {
        ...res.user,
        role: 'admin',
        status: 'active',
        proAccess: true,
      };
      setCurrentUser(adminUser);
      setPage('admin');
      showToast('Admin access granted! Welcome Admin.');
      return true;
    }

    sessionStorage.removeItem('tl_admin_verified');
    const loggedUser: User = { ...res.user, role: 'user' };
    setCurrentUser(loggedUser);

    if (loggedUser.status === 'disabled' || loggedUser.status === 'removed') {
      setPage('denied');
    } else {
      setPage('dashboard');
    }

    showToast(`Welcome back, ${loggedUser.email.split('@')[0]}`);
    return true;
  };

  // User Registration Handler (Strictly standard user session)
  const handleRegister = async (email: string, pass: string): Promise<boolean> => {
    const res = await registerWithFirebase(email, pass);
    if (!res.success || !res.user) {
      showToast(res.error || 'Registration failed');
      return false;
    }

    sessionStorage.removeItem('tl_admin_verified');
    const newUser: User = { ...res.user, role: 'user' };
    setCurrentUser(newUser);

    if (newUser.status === 'disabled' || newUser.status === 'removed') {
      setPage('denied');
    } else {
      setPage('dashboard');
    }

    if (res.alreadyRegistered) {
      showToast(`Welcome back, ${newUser.email.split('@')[0]}!`);
    } else {
      showToast('Registration successful! Welcome to Trade Lens');
    }
    return true;
  };

  // Admin Login Handler - Strictly requires Admin Number/Email and Secret Admin Password
  const handleAdminLogin = async (identifier: string, pass: string): Promise<boolean> => {
    const res = await adminLoginWithFirebase(identifier, pass);
    if (!res.success || !res.user) {
      showToast(res.error || 'ভুল অ্যাডমিন নাম্বার বা পাসওয়ার্ড!');
      return false;
    }

    sessionStorage.setItem('tl_admin_verified', 'true');
    setCurrentUser(res.user);
    setPage('admin');
    showToast('Admin access granted');
    return true;
  };

  // User Sign Out
  const handleLogout = async () => {
    sessionStorage.removeItem('tl_admin_verified');
    await logoutFromFirebase();
    setCurrentUser(null);
    setPage('login');
    showToast('Signed out successfully');
  };

  // Admin Logout
  const handleLogoutAdmin = async () => {
    sessionStorage.removeItem('tl_admin_verified');
    await logoutFromFirebase();
    setCurrentUser(null);
    setPage('login');
    showToast('অ্যাডমিন প্যানেল থেকে সাইন আউট করা হয়েছে');
  };

  // Submit Payment Request (Saves to Firestore for cross-device visibility)
  const handleSubmitPayment = async (payment: PaymentInfo) => {
    if (!currentUser) {
      showToast('অনুগ্রহ করে পেমেন্ট রিকোয়েস্ট পাঠাতে আগে লগইন করুন!');
      setPage('login');
      return;
    }

    try {
      const userId = currentUser.id || currentUser.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
      await submitPaymentToFirebase(userId, currentUser.email, payment);

      const updatedUser: User = {
        ...currentUser,
        status: 'pending',
        proAccess: false,
        payment,
      };

      setCurrentUser(updatedUser);
      try {
        localStorage.setItem('tl_current_session', JSON.stringify(updatedUser));
      } catch {}

      setPage('pending');
      showToast('🎉 আপনার রিকোয়েস্ট পেন্ডিং লিস্টে জমা হয়েছে! এডমিন অ্যাপ্রুভালের অপেক্ষায়।');
    } catch (err: any) {
      console.error('Failed to submit payment:', err);
      showToast('পেমেন্ট রিকোয়েস্ট পাঠাতে সমস্যা হয়েছে, আবার চেষ্টা করুন।');
    }
  };

  // Paid Bot Decision Flow
  const handlePaidAction = () => {
    if (!currentUser) {
      setPage('login');
      return;
    }

    if (currentUser.status === 'disabled' || currentUser.status === 'removed') {
      setPage('denied');
      return;
    }

    // STRICT PRO ACTIVE CHECK: Only admin or manually activated Pro users can access
    const isProActive =
      (currentUser.role === 'admin' || currentUser.proAccess === true) &&
      (currentUser.status === 'active' || currentUser.status === 'approved');

    if (isProActive) {
      setPage('pro');
      return;
    }

    // If pending or accepted, Pro Feature is LOCKED - show pending status
    if (currentUser.status === 'pending' || currentUser.status === 'accepted') {
      setPage('pending');
      return;
    }

    // Normal user: opens Payment Gateway
    setPage('paid');
  };

  // Admin: Step 1 - Accept User Payment (Sets status to 'accepted', proAccess remains FALSE)
  // CRITICAL: Does NOT activate user and does NOT unlock Pro Future yet!
  const handleAcceptUser = async (email: string, userName?: string) => {
    try {
      const adminEmail = currentUser?.email || 'limon2581444@gmail.com';
      await acceptPaymentInFirebase(email, adminEmail, userName);
      const nowReadable = new Date().toLocaleString();
      setUsers((prev) =>
        prev.map((u) =>
          u.email.toLowerCase() === email.toLowerCase()
            ? { ...u, status: 'accepted', proAccess: false, acceptedDate: nowReadable }
            : u
        )
      );
      if (currentUser && currentUser.email.toLowerCase() === email.toLowerCase()) {
        setCurrentUser({ ...currentUser, status: 'accepted', proAccess: false, acceptedDate: nowReadable });
      }
      showToast(`Payment for ${email} accepted! Ready to activate in Accepted tab.`);
    } catch (err) {
      console.error('Accept error', err);
      showToast('Error accepting payment in Firebase');
    }
  };

  // Admin: Step 2 - Manually Activate User for PRO ACTIVE
  // ONLY THIS action unlocks Pro Future and moves user to PRO ACTIVE!
  const handleActivateProUser = async (email: string, userName?: string) => {
    try {
      const adminEmail = currentUser?.email || 'limon2581444@gmail.com';
      await activateProUserInFirebase(email, adminEmail, userName);
      const nowReadable = new Date().toLocaleString();
      setUsers((prev) =>
        prev.map((u) =>
          u.email.toLowerCase() === email.toLowerCase()
            ? { ...u, status: 'active', proAccess: true, activeDate: nowReadable }
            : u
        )
      );
      if (currentUser && currentUser.email.toLowerCase() === email.toLowerCase()) {
        setCurrentUser({ ...currentUser, status: 'active', proAccess: true, activeDate: nowReadable });
      }
      showToast(`Activated Pro Future for ${email}! Access UNLOCKED.`);
    } catch (err) {
      console.error('Activate error', err);
      showToast('Error activating user in Firebase');
    }
  };

  // Backwards compatibility alias
  const handleApproveUser = handleAcceptUser;

  // Admin: Reject User Payment (Sets status to 'disabled')
  const handleRejectUser = async (email: string, userName?: string) => {
    try {
      const adminEmail = currentUser?.email || 'limon2581444@gmail.com';
      await rejectPaymentInFirebase(email, adminEmail, userName);
      setUsers((prev) =>
        prev.map((u) =>
          u.email.toLowerCase() === email.toLowerCase()
            ? { ...u, status: 'disabled', proAccess: false }
            : u
        )
      );
      if (currentUser && currentUser.email.toLowerCase() === email.toLowerCase()) {
        setCurrentUser({ ...currentUser, status: 'disabled', proAccess: false });
      }
      showToast(`Payment request for ${email} was rejected & disabled`);
    } catch (err) {
      console.error('Reject error', err);
      showToast('Error rejecting user in Firebase');
    }
  };

  // Admin: Remove Active User / Revoke Access (Sets status to 'disabled')
  const handleRemoveUser = async (email: string, userName?: string) => {
    try {
      const adminEmail = currentUser?.email || 'limon2581444@gmail.com';
      await removeUserInFirebase(email, adminEmail, userName);
      setUsers((prev) =>
        prev.map((u) =>
          u.email.toLowerCase() === email.toLowerCase()
            ? { ...u, status: 'disabled', proAccess: false }
            : u
        )
      );
      if (currentUser && currentUser.email.toLowerCase() === email.toLowerCase()) {
        setCurrentUser({ ...currentUser, status: 'disabled', proAccess: false });
      }
      showToast(`Access removed & disabled for ${email}`);
    } catch (err) {
      console.error('Remove error', err);
      showToast('Error removing user');
    }
  };

  // Admin: Remove All Approved Users
  const handleRemoveAllApproved = async () => {
    try {
      const adminEmail = currentUser?.email || 'limon2581444@gmail.com';
      const count = await removeAllApprovedUsersInFirebase(adminEmail);
      setUsers((prev) =>
        prev.map((u) =>
          (u.status === 'active' || u.status === 'approved') && u.role !== 'admin'
            ? { ...u, status: 'disabled', proAccess: false }
            : u
        )
      );
      showToast(`Revoked access for all ${count} active users`);
    } catch (err) {
      console.error('Remove all error', err);
      showToast('Error removing all approved users');
    }
  };

  // Route: Admin Panel with strict permission guard
  if (page === 'admin') {
    const isVerifiedAdmin =
      currentUser?.role === 'admin' &&
      sessionStorage.getItem('tl_admin_verified') === 'true';

    // If a normal logged-in user tries to enter admin area
    if (!isVerifiedAdmin) {
      if (currentUser && currentUser.role === 'user') {
        return (
          <div className="min-h-screen bg-[#030916] font-sans antialiased text-white selection:bg-cyan-500/30 flex items-center justify-center p-4">
            <Toast message={toastMessage} />
            <div className="max-w-md w-full p-8 rounded-2xl bg-[#0c0517] border border-rose-500/50 shadow-[0_0_40px_rgba(244,63,94,0.2)] text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">Access Denied</h2>
              <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                সাধারণ ইউজার একাউন্ট দিয়ে এডমিন প্যানেলে প্রবেশ করা নিষিদ্ধ। শুধুমাত্র অথোরাইজড এডমিন ক্রেডেনশিয়াল প্রয়োজন।
              </p>
              <button
                onClick={() => setPage('dashboard')}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-bold text-sm shadow-lg transition cursor-pointer"
              >
                Return to User Dashboard
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-[#030916] font-sans antialiased text-white selection:bg-cyan-500/30">
          <Toast message={toastMessage} />
          <AuthViews
            page="adminLogin"
            onNavigate={setPage}
            onLogin={handleLogin}
            onRegister={handleRegister}
            onAdminLogin={handleAdminLogin}
            showToast={showToast}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#030611] font-sans antialiased text-white selection:bg-purple-500/30">
        <Toast message={toastMessage} />
        <AdminPanel
          users={users}
          paymentRequests={paymentRequests}
          auditLogs={auditLogs}
          onAcceptUser={handleAcceptUser}
          onActivateProUser={handleActivateProUser}
          onApproveUser={handleApproveUser}
          onRejectUser={handleRejectUser}
          onRemoveUser={handleRemoveUser}
          onRemoveAllApproved={handleRemoveAllApproved}
          onNavigate={setPage}
          onLogoutAdmin={handleLogoutAdmin}
        />
      </div>
    );
  }

  // Auth screens (Login, Register, Admin Login)
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

      {/* Persistent Footer */}
      <footer className="w-full py-4 border-t border-slate-800/80 bg-[#020713]/80 backdrop-blur text-center text-xs text-slate-500 flex flex-wrap items-center justify-center gap-4 px-4">
        <span>TRADE LENS © 2026. All rights reserved.</span>
        {currentUser?.role !== 'user' && (
          <>
            <span className="hidden sm:inline">•</span>
            <button
              id="footer-admin-link"
              onClick={() => setPage('adminLogin')}
              className="text-purple-400 hover:text-purple-300 transition underline underline-offset-2 cursor-pointer"
            >
              Admin Portal
            </button>
          </>
        )}
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
