import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { User, PaymentInfo, PaymentRequest, AdminAuditLog, AuditActionType } from '../types';
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ADMIN_NUMBER,
  ADMIN_DEMO_ID,
  ADMIN_DEMO_PASS,
} from '../data/constants';

export const USERS_COLLECTION = 'users';
export const REQUESTS_COLLECTION = 'paymentRequests';
export const AUDIT_LOGS_COLLECTION = 'auditLogs';

// Clean email key for Firestore document id
export const emailToDocId = (email: string) => {
  return email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
};

/**
 * Calculates human-readable active duration
 * Example: "Active for 2 days", "Active for 15 days", "Active for 1 month"
 */
export function calculateActiveDuration(activeAt?: string | null, activeDate?: string | null): string {
  if (!activeAt && !activeDate) return '—';
  try {
    const start = new Date(activeAt || activeDate!).getTime();
    if (isNaN(start)) return '—';
    const now = Date.now();
    const diffMs = Math.max(0, now - start);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMins < 2) return 'Just activated';
    if (diffMins < 60) return `Active for ${diffMins} min${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Active for ${diffHours} hr${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 30) return `Active for ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    return `Active for ${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
  } catch {
    return '—';
  }
}

/**
 * Register user in Firebase Auth and Firestore.
 */
export async function registerWithFirebase(
  email: string,
  pass: string
): Promise<{ success: boolean; error?: string; user?: User; alreadyRegistered?: boolean }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    
    // 1. Attempt to create User in Firebase Auth
    let uid: string;
    let isExisting = false;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      uid = userCredential.user.uid;
    } catch (authErr: any) {
      if (authErr.code === 'auth/email-already-in-use') {
        // If email already exists, try to log in seamlessly with the provided password
        try {
          const loginCred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
          uid = loginCred.user.uid;
          isExisting = true;
        } catch (signInErr: any) {
          // Password doesn't match the existing account
          return {
            success: false,
            error: 'Account already exists with this Gmail. Please sign in or check your password.',
          };
        }
      } else if (authErr.code === 'auth/weak-password') {
        return { success: false, error: 'Password should be at least 6 characters' };
      } else {
        return { success: false, error: authErr.message || 'Registration failed' };
      }
    }

    // All public user registrations are standard users (role: 'user')
    // 2. Fetch or save user profile document in Firestore
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    const docSnap = await getDoc(userDocRef);

    let newUserData: User;
    if (docSnap.exists()) {
      const data = docSnap.data();
      newUserData = {
        id: uid,
        email: data.email || cleanEmail,
        status: data.status || 'active',
        role: 'user',
        payment: data.payment || null,
        created: data.created || new Date().toLocaleString(),
        createdAt: data.createdAt || new Date().toISOString(),
        activeAt: data.activeAt,
        activeDate: data.activeDate,
        disabledAt: data.disabledAt,
        disabledDate: data.disabledDate,
        proAccess: data.proAccess ?? (data.status === 'active' || data.status === 'approved'),
      };
    } else {
      newUserData = {
        id: uid,
        email: cleanEmail,
        status: 'active',
        role: 'user',
        created: new Date().toLocaleString(),
        createdAt: new Date().toISOString(),
        payment: null,
        proAccess: false,
      };
      await setDoc(
        userDocRef,
        {
          ...newUserData,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    return { success: true, user: newUserData, alreadyRegistered: isExisting };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Registration failed' };
  }
}

/**
 * Login user via Firebase Auth and fetch Firestore profile.
 */
export async function loginWithFirebase(
  email: string,
  pass: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();

    // Sign in with Firebase Auth
    let userCredential: any = null;
    let uid: string | null = null;

    try {
      userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      uid = userCredential.user.uid;
    } catch (authError: any) {
      if (
        authError.code === 'auth/invalid-credential' ||
        authError.code === 'auth/user-not-found' ||
        authError.code === 'auth/wrong-password'
      ) {
        return { success: false, error: 'Invalid Gmail or password' };
      }
      return { success: false, error: authError.message || 'Login failed' };
    }

    if (!uid && userCredential?.user?.uid) {
      uid = userCredential.user.uid;
    }
    if (!uid) {
      uid = (await findUserIdByEmail(cleanEmail)) || emailToDocId(cleanEmail);
    }

    const userDocRef = doc(db, USERS_COLLECTION, uid);
    const docSnap = await getDoc(userDocRef);

    let userData: User;
    if (docSnap.exists()) {
      const data = docSnap.data();
      const isActive = data.status === 'active' || data.status === 'approved';
      userData = {
        id: uid,
        email: data.email || cleanEmail,
        status: data.status || 'active',
        role: 'user',
        payment: data.payment || null,
        created: data.created || new Date().toLocaleString(),
        createdAt: data.createdAt,
        acceptedAt: data.acceptedAt,
        acceptedDate: data.acceptedDate,
        activeAt: data.activeAt,
        activeDate: data.activeDate,
        disabledAt: data.disabledAt,
        disabledDate: data.disabledDate,
        proAccess: isActive ? (data.proAccess ?? true) : false,
      };
    } else {
      userData = {
        id: uid,
        email: cleanEmail,
        status: 'active',
        role: 'user',
        created: new Date().toLocaleString(),
        createdAt: new Date().toISOString(),
        payment: null,
        proAccess: false,
      };
      await setDoc(userDocRef, userData, { merge: true });
    }

    return { success: true, user: userData };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Login failed' };
  }
}

/**
 * Admin Login Verification
 * Only accessible via authorized Admin credentials (demo 00000000 / 00000000 or official admin credentials)
 */
export async function adminLoginWithFirebase(
  identifier: string,
  pass: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  const cleanId = (identifier || '').trim().toLowerCase();
  const cleanNumber = cleanId.replace(/[^0-9]/g, '');

  const isDemoAdmin = (cleanId === ADMIN_DEMO_ID || cleanId === '00000000') && (pass === ADMIN_DEMO_PASS || pass === '00000000');
  const isOfficialAdmin =
    (cleanId === ADMIN_EMAIL.toLowerCase() ||
      cleanId === 'limon2581444@gmail.com' ||
      cleanId === ADMIN_NUMBER.toLowerCase() ||
      (cleanNumber.length >= 10 && ADMIN_NUMBER.includes(cleanNumber)) ||
      cleanId === 'admin' ||
      cleanId.includes('limon')) &&
    (pass === ADMIN_PASSWORD || pass === '00000000' || pass === 'limonAbc123' || pass === ADMIN_DEMO_PASS);

  if (!isDemoAdmin && !isOfficialAdmin) {
    return {
      success: false,
      error: 'ভুল অ্যাডমিন নাম্বার বা পাসওয়ার্ড! (Invalid Admin Credentials)',
    };
  }

  const adminEmail = ADMIN_EMAIL.toLowerCase();

  try {
    let uid: string | null = null;

    // Check if auth.currentUser is already this admin
    if (auth.currentUser && (auth.currentUser.email || '').toLowerCase() === adminEmail) {
      uid = auth.currentUser.uid;
    } else {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, adminEmail, ADMIN_PASSWORD);
        uid = userCredential.user.uid;
      } catch (err: any) {
        try {
          const newCred = await createUserWithEmailAndPassword(auth, adminEmail, ADMIN_PASSWORD);
          uid = newCred.user.uid;
        } catch {
          uid = (await findUserIdByEmail(adminEmail)) || emailToDocId(adminEmail);
        }
      }
    }

    if (!uid) {
      uid = (await findUserIdByEmail(adminEmail)) || emailToDocId(adminEmail);
    }

    // Update admin document in Firestore
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    await setDoc(
      userDocRef,
      {
        email: adminEmail,
        role: 'admin',
        status: 'active',
        proAccess: true,
        created: new Date().toLocaleString(),
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );

    const adminUser: User = {
      id: uid,
      email: adminEmail,
      status: 'active',
      role: 'admin',
      proAccess: true,
    };

    return { success: true, user: adminUser };
  } catch (err: any) {
    const fallbackUid = (await findUserIdByEmail(adminEmail).catch(() => null)) || emailToDocId(adminEmail);
    return {
      success: true,
      user: {
        id: fallbackUid,
        email: adminEmail,
        status: 'active',
        role: 'admin',
        proAccess: true,
      },
    };
  }
}

/**
 * Sign out from Firebase
 */
export async function logoutFromFirebase(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (e) {
    console.error('Sign out error', e);
  }
}

/**
 * Helper to find user document ID by email in Firestore
 */
async function findUserIdByEmail(email: string): Promise<string | null> {
  const cleanEmail = email.trim().toLowerCase();
  const usersRef = collection(db, USERS_COLLECTION);
  const q = query(usersRef, where('email', '==', cleanEmail));
  const snap = await getDocs(q);
  if (!snap.empty) {
    return snap.docs[0].id;
  }
  return null;
}

/**
 * Submit payment request to Firestore (both in user document and paymentRequests collection).
 */
export async function submitPaymentToFirebase(
  userId: string,
  userEmail: string,
  payment: PaymentInfo
): Promise<void> {
  const cleanEmail = userEmail.trim().toLowerCase();
  const nowIso = new Date().toISOString();

  // 1. Update User document with pending status and payment info
  if (userId) {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(
      userDocRef,
      {
        id: userId,
        email: cleanEmail,
        status: 'pending',
        proAccess: false,
        payment: {
          amount: payment.amount,
          method: payment.method,
          transactionId: payment.transactionId || '',
          date: payment.date,
        },
        serverUpdated: serverTimestamp(),
      },
      { merge: true }
    );
  }

  // Also query other docs by email to ensure complete consistency
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const snap = await getDocs(query(usersRef, where('email', '==', cleanEmail)));
    for (const d of snap.docs) {
      await updateDoc(doc(db, USERS_COLLECTION, d.id), {
        status: 'pending',
        proAccess: false,
        payment: {
          amount: payment.amount,
          method: payment.method,
          transactionId: payment.transactionId || '',
          date: payment.date,
        },
        serverUpdated: serverTimestamp(),
      });
    }
  } catch (e) {}

  // 2. Also save to paymentRequests collection with deterministic docId
  const reqDocRef = doc(db, REQUESTS_COLLECTION, emailToDocId(cleanEmail));
  await setDoc(
    reqDocRef,
    {
      userId,
      userEmail: cleanEmail,
      amount: payment.amount,
      method: payment.method,
      transactionId: payment.transactionId || '',
      status: 'pending',
      date: payment.date,
      createdAt: nowIso,
      serverUpdated: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Record an Admin action in the audit log collection
 */
export async function recordAuditLogInFirebase(
  action: AuditActionType,
  adminEmail: string,
  targetUserEmail: string,
  details?: string,
  targetUserName?: string
): Promise<void> {
  try {
    const now = new Date();
    const nowReadable = now.toLocaleString();
    const nowIso = now.toISOString();
    const logDoc = doc(collection(db, AUDIT_LOGS_COLLECTION));
    await setDoc(logDoc, {
      action,
      adminEmail: adminEmail || ADMIN_EMAIL,
      targetUserEmail: (targetUserEmail || '').trim().toLowerCase(),
      targetUserName: targetUserName || '',
      details: details || '',
      timestamp: nowReadable,
      createdAt: nowIso,
      serverUpdated: serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

/**
 * Real-time listener for Admin Audit Logs
 */
export function subscribeToAuditLogs(onUpdate: (logs: AdminAuditLog[]) => void): () => void {
  const logsRef = collection(db, AUDIT_LOGS_COLLECTION);
  return onSnapshot(
    logsRef,
    (querySnapshot) => {
      const logs: AdminAuditLog[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        logs.push({
          id: docSnap.id,
          action: (data.action as AuditActionType) || 'ACCEPT',
          adminEmail: data.adminEmail || ADMIN_EMAIL,
          targetUserEmail: data.targetUserEmail || '',
          targetUserName: data.targetUserName || '',
          details: data.details || '',
          timestamp: data.timestamp || new Date().toLocaleString(),
          createdAt: data.createdAt || '',
        });
      });

      // Sort newest first
      logs.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.timestamp).getTime();
        const timeB = new Date(b.createdAt || b.timestamp).getTime();
        return timeB - timeA;
      });

      onUpdate(logs);
    },
    (err) => {
      console.warn('Audit logs subscription notice:', err.message);
    }
  );
}

/**
 * Admin: Accept User Payment Request (Step 1 of 2)
 * CRITICAL DIRECTIVE: DO NOT automatically activate the user!
 * ACCEPT only moves the status from PENDING -> ACCEPTED / WAITING FOR ACTIVATION.
 * User does NOT get Pro Future access yet (proAccess: false).
 * User does NOT appear in PRO ACTIVE.
 * Admin must subsequently click ACTIVATE PRO manually to unlock Pro Future.
 */
export async function acceptPaymentInFirebase(
  userEmail: string,
  adminEmail?: string,
  targetUserName?: string
): Promise<void> {
  const cleanEmail = userEmail.trim().toLowerCase();
  const nowIso = new Date().toISOString();
  const nowReadable = new Date().toLocaleString();
  const cleanId = emailToDocId(cleanEmail);
  
  // 1. Update request queue in paymentRequests collection to 'accepted'
  const reqDocRef = doc(db, REQUESTS_COLLECTION, cleanId);
  try {
    await setDoc(reqDocRef, {
      status: 'accepted',
      reviewedAt: nowIso,
      reviewedBy: adminEmail || 'Admin',
      serverUpdated: serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    console.error('Error updating request doc', e);
  }

  // 2. Update user document to status: 'accepted', proAccess: false (LOCKED)
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const snap = await getDocs(usersRef);
    for (const d of snap.docs) {
      const data = d.data();
      if ((data.email || '').trim().toLowerCase() === cleanEmail) {
        await updateDoc(doc(db, USERS_COLLECTION, d.id), {
          status: 'accepted',
          proAccess: false,
          acceptedAt: nowIso,
          acceptedDate: nowReadable,
          serverUpdated: serverTimestamp(),
        });
      }
    }

    // Always ensure deterministic doc is also marked accepted (proAccess: false)
    await setDoc(
      doc(db, USERS_COLLECTION, cleanId),
      {
        email: cleanEmail,
        status: 'accepted',
        proAccess: false,
        acceptedAt: nowIso,
        acceptedDate: nowReadable,
        serverUpdated: serverTimestamp(),
      },
      { merge: true }
    );

    // Record Audit Log entry
    await recordAuditLogInFirebase(
      'ACCEPT',
      adminEmail || ADMIN_EMAIL,
      cleanEmail,
      'Accepted payment request - moved to Accepted / Ready to Activate (Pro Future remains locked)',
      targetUserName
    );
  } catch (e) {
    console.error('Error updating user status in Firestore:', e);
  }
}

/**
 * Admin: Manually Activate User for PRO ACTIVE (Step 2 of 2)
 * ONLY when Admin clicks ACTIVATE PRO does the user:
 * - Become status: "active"
 * - Get Pro Future: UNLOCKED (proAccess: true)
 * - Enter PRO ACTIVE section
 * - Start active duration tracking
 */
export async function activateProUserInFirebase(
  userEmail: string,
  adminEmail?: string,
  targetUserName?: string
): Promise<void> {
  const cleanEmail = userEmail.trim().toLowerCase();
  const nowIso = new Date().toISOString();
  const nowReadable = new Date().toLocaleString();
  const cleanId = emailToDocId(cleanEmail);
  
  // 1. Update request queue in paymentRequests collection
  const reqDocRef = doc(db, REQUESTS_COLLECTION, cleanId);
  try {
    await setDoc(reqDocRef, {
      status: 'approved',
      activatedAt: nowIso,
      activatedBy: adminEmail || 'Admin',
      serverUpdated: serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    console.error('Error updating request doc', e);
  }

  // 2. Update user documents: status: 'active', proAccess: true, activeAt: nowIso, activeDate: nowReadable
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const snap = await getDocs(usersRef);
    for (const d of snap.docs) {
      const data = d.data();
      if ((data.email || '').trim().toLowerCase() === cleanEmail) {
        await updateDoc(doc(db, USERS_COLLECTION, d.id), {
          status: 'active',
          proAccess: true,
          activeAt: nowIso,
          activeDate: nowReadable,
          serverUpdated: serverTimestamp(),
        });
      }
    }

    await setDoc(
      doc(db, USERS_COLLECTION, cleanId),
      {
        email: cleanEmail,
        status: 'active',
        proAccess: true,
        activeAt: nowIso,
        activeDate: nowReadable,
        serverUpdated: serverTimestamp(),
      },
      { merge: true }
    );

    // Record Audit Log entry
    await recordAuditLogInFirebase(
      'ACTIVATE_PRO',
      adminEmail || ADMIN_EMAIL,
      cleanEmail,
      'Manually activated user for PRO ACTIVE - Pro Future bot access UNLOCKED',
      targetUserName
    );
  } catch (e) {
    console.error('Error activating user in Firestore:', e);
  }
}

/**
 * Backwards-compatible alias for existing callers
 */
export const approvePaymentInFirebase = acceptPaymentInFirebase;

/**
 * Admin: Reject / Disable User Payment Request
 */
export async function rejectPaymentInFirebase(
  userEmail: string,
  adminEmail?: string,
  targetUserName?: string
): Promise<void> {
  const cleanEmail = userEmail.trim().toLowerCase();
  const nowIso = new Date().toISOString();
  const nowReadable = new Date().toLocaleString();
  const cleanId = emailToDocId(cleanEmail);

  // Update request queue
  const reqDocRef = doc(db, REQUESTS_COLLECTION, cleanId);
  try {
    await setDoc(reqDocRef, {
      status: 'disabled',
      reviewedAt: nowIso,
      reviewedBy: adminEmail || 'Admin',
      serverUpdated: serverTimestamp(),
    }, { merge: true });
  } catch (e) {}

  // Update user document
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const snap = await getDocs(usersRef);
    for (const d of snap.docs) {
      const data = d.data();
      if ((data.email || '').trim().toLowerCase() === cleanEmail) {
        await updateDoc(doc(db, USERS_COLLECTION, d.id), {
          status: 'disabled',
          proAccess: false,
          disabledAt: nowIso,
          disabledDate: nowReadable,
          serverUpdated: serverTimestamp(),
        });
      }
    }

    await setDoc(
      doc(db, USERS_COLLECTION, cleanId),
      {
        email: cleanEmail,
        status: 'disabled',
        proAccess: false,
        disabledAt: nowIso,
        disabledDate: nowReadable,
        serverUpdated: serverTimestamp(),
      },
      { merge: true }
    );

    // Record Audit Log entry
    await recordAuditLogInFirebase(
      'DISABLE',
      adminEmail || ADMIN_EMAIL,
      cleanEmail,
      'Rejected payment request & disabled access',
      targetUserName
    );
  } catch (e) {}
}

/**
 * Admin: Remove Active user / Disable user access (Sets status to 'disabled', locks Pro Future)
 */
export async function removeUserInFirebase(
  userEmail: string,
  adminEmail?: string,
  targetUserName?: string
): Promise<void> {
  const cleanEmail = userEmail.trim().toLowerCase();
  const nowIso = new Date().toISOString();
  const nowReadable = new Date().toLocaleString();
  const cleanId = emailToDocId(cleanEmail);

  // Update request queue
  const reqDocRef = doc(db, REQUESTS_COLLECTION, cleanId);
  try {
    await setDoc(reqDocRef, {
      status: 'disabled',
      reviewedAt: nowIso,
      reviewedBy: adminEmail || 'Admin',
      serverUpdated: serverTimestamp(),
    }, { merge: true });
  } catch (e) {}

  // Update all user documents matching this email
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const snap = await getDocs(usersRef);
    for (const d of snap.docs) {
      const data = d.data();
      if ((data.email || '').trim().toLowerCase() === cleanEmail) {
        await updateDoc(doc(db, USERS_COLLECTION, d.id), {
          status: 'disabled',
          proAccess: false,
          disabledAt: nowIso,
          disabledDate: nowReadable,
          serverUpdated: serverTimestamp(),
        });
      }
    }

    await setDoc(
      doc(db, USERS_COLLECTION, cleanId),
      {
        email: cleanEmail,
        status: 'disabled',
        proAccess: false,
        disabledAt: nowIso,
        disabledDate: nowReadable,
        serverUpdated: serverTimestamp(),
      },
      { merge: true }
    );

    // Record Audit Log entry
    await recordAuditLogInFirebase(
      'REMOVE',
      adminEmail || ADMIN_EMAIL,
      cleanEmail,
      'Removed user from PRO ACTIVE & locked Pro Future bot license',
      targetUserName
    );
  } catch (e) {
    console.error('Error disabling user in Firestore:', e);
  }
}

/**
 * Admin: Remove all active users
 */
export async function removeAllApprovedUsersInFirebase(adminEmail?: string): Promise<number> {
  let count = 0;
  const nowIso = new Date().toISOString();
  const nowReadable = new Date().toLocaleString();
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const snap = await getDocs(usersRef);
    for (const d of snap.docs) {
      const data = d.data();
      if ((data.status === 'active' || data.status === 'approved') && data.role !== 'admin') {
        await updateDoc(doc(db, USERS_COLLECTION, d.id), {
          status: 'disabled',
          proAccess: false,
          disabledAt: nowIso,
          disabledDate: nowReadable,
          serverUpdated: serverTimestamp(),
        });
        count++;

        const cleanEmail = (data.email || '').trim().toLowerCase();
        if (cleanEmail) {
          const reqDocRef = doc(db, REQUESTS_COLLECTION, emailToDocId(cleanEmail));
          await setDoc(reqDocRef, {
            status: 'disabled',
            serverUpdated: serverTimestamp(),
          }, { merge: true });
        }
      }
    }

    if (count > 0) {
      await recordAuditLogInFirebase(
        'BULK_REMOVE',
        adminEmail || ADMIN_EMAIL,
        'all_active_users',
        `Revoked Pro Future license for all ${count} active users`
      );
    }
  } catch (e) {
    console.error('Error removing all approved users from Firestore:', e);
  }
  return count;
}

/**
 * Real-time listener for current user document.
 * Listens by userId and/or email query for cross-device updates.
 */
export function subscribeToCurrentUser(
  userId: string,
  userEmail: string,
  onUpdate: (user: Partial<User>) => void
): () => void {
  const unsubs: Array<() => void> = [];

  // Listen by docId
  if (userId) {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    const unsubDoc = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const isActive = data.status === 'active' || data.status === 'approved';
          onUpdate({
            id: docSnap.id,
            email: data.email,
            status: data.status,
            role: data.role,
            payment: data.payment,
            created: data.created,
            createdAt: data.createdAt,
            acceptedAt: data.acceptedAt,
            acceptedDate: data.acceptedDate,
            activeAt: data.activeAt,
            activeDate: data.activeDate,
            disabledAt: data.disabledAt,
            disabledDate: data.disabledDate,
            proAccess: isActive ? (data.proAccess ?? true) : false,
          });
        }
      },
      (err) => {
        console.warn('User doc subscription info:', err.message);
      }
    );
    unsubs.push(unsubDoc);
  }

  // Also listen by email in case another document id was updated by admin
  const cleanEmail = (userEmail || '').trim().toLowerCase();
  if (cleanEmail) {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('email', '==', cleanEmail));
    const unsubQuery = onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          const data = snap.docs[0].data();
          const isActive = data.status === 'active' || data.status === 'approved';
          onUpdate({
            id: snap.docs[0].id,
            email: data.email || cleanEmail,
            status: data.status,
            role: data.role,
            payment: data.payment,
            created: data.created,
            createdAt: data.createdAt,
            acceptedAt: data.acceptedAt,
            acceptedDate: data.acceptedDate,
            activeAt: data.activeAt,
            activeDate: data.activeDate,
            disabledAt: data.disabledAt,
            disabledDate: data.disabledDate,
            proAccess: isActive ? (data.proAccess ?? true) : false,
          });
        }
      },
      (err) => {
        console.warn('User query subscription info:', err.message);
      }
    );
    unsubs.push(unsubQuery);
  }

  return () => {
    unsubs.forEach((fn) => fn());
  };
}

/**
 * Real-time listener for all users (for Admin Panel).
 */
export function subscribeToAllUsers(onUpdate: (users: User[]) => void): () => void {
  const usersRef = collection(db, USERS_COLLECTION);
  return onSnapshot(
    usersRef,
    (querySnapshot) => {
      const usersMap = new Map<string, User>();
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const rawEmail = (data.email || '').trim();
        const cleanEmail = rawEmail.toLowerCase();
        if (!cleanEmail) return;

        const isActive = data.status === 'active' || data.status === 'approved';
        const candidateUser: User = {
          id: docSnap.id,
          email: rawEmail,
          status: data.status || 'active',
          role: data.role || 'user',
          payment: data.payment || null,
          created: data.created || '',
          createdAt: data.createdAt || '',
          acceptedAt: data.acceptedAt || '',
          acceptedDate: data.acceptedDate || '',
          activeAt: data.activeAt || '',
          activeDate: data.activeDate || '',
          disabledAt: data.disabledAt || '',
          disabledDate: data.disabledDate || '',
          proAccess: isActive ? (data.proAccess ?? true) : false,
        };

        if (usersMap.has(cleanEmail)) {
          const existing = usersMap.get(cleanEmail)!;
          const statusPriority: Record<string, number> = {
            active: 5,
            approved: 5,
            accepted: 4,
            pending: 3,
            disabled: 2,
            removed: 1,
          };
          const candidateScore =
            (statusPriority[candidateUser.status] ?? 1) +
            (candidateUser.payment ? 5 : 0);
          const existingScore =
            (statusPriority[existing.status] ?? 1) +
            (existing.payment ? 5 : 0);

          if (candidateScore >= existingScore) {
            usersMap.set(cleanEmail, candidateUser);
          }
        } else {
          usersMap.set(cleanEmail, candidateUser);
        }
      });
      onUpdate(Array.from(usersMap.values()));
    },
    (err) => {
      console.warn('All users subscription notice:', err.message);
    }
  );
}

/**
 * Real-time listener for all payment requests (for Admin Panel).
 */
export function subscribeToPaymentRequests(
  onUpdate: (requests: PaymentRequest[]) => void
): () => void {
  const reqsRef = collection(db, REQUESTS_COLLECTION);
  return onSnapshot(
    reqsRef,
    (querySnapshot) => {
      const list: PaymentRequest[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          userId: data.userId,
          userEmail: data.userEmail || '',
          amount: data.amount || 0,
          method: data.method || '',
          transactionId: data.transactionId || '',
          status: data.status || 'pending',
          date: data.date || '',
          createdAt: data.createdAt || '',
          reviewedAt: data.reviewedAt,
          reviewedBy: data.reviewedBy,
        });
      });
      onUpdate(list);
    },
    (err) => {
      console.warn('Payment requests subscription notice:', err.message);
    }
  );
}
