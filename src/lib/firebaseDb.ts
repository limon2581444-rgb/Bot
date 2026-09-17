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
import { User, PaymentInfo } from '../types';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../data/constants';

export const USERS_COLLECTION = 'users';
export const REQUESTS_COLLECTION = 'paymentRequests';

// Clean email key for Firestore document id
export const emailToDocId = (email: string) => {
  return email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
};

/**
 * Register user in Firebase Auth and Firestore.
 */
export async function registerWithFirebase(
  email: string,
  pass: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    
    // 1. Create User in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    const uid = userCredential.user.uid;

    // Determine initial role
    const isAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();

    // 2. Save user profile document in Firestore
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    const newUserData: User = {
      id: uid,
      email: cleanEmail,
      status: 'active',
      role: isAdmin ? 'admin' : 'user',
      created: new Date().toLocaleString(),
      payment: null,
    };

    await setDoc(userDocRef, {
      ...newUserData,
      createdAt: new Date().toISOString(),
    }, { merge: true });

    return { success: true, user: newUserData };
  } catch (err: any) {
    console.error('Firebase registration error:', err);
    if (err.code === 'auth/email-already-in-use') {
      return { success: false, error: 'Account already exists with this Gmail' };
    }
    if (err.code === 'auth/weak-password') {
      return { success: false, error: 'Password should be at least 6 characters' };
    }
    return { success: false, error: err.message || 'Registration failed' };
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
    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    } catch (authError: any) {
      // If user is admin logging in for the first time, auto-register
      if (
        (authError.code === 'auth/user-not-found' ||
          authError.code === 'auth/invalid-credential') &&
        (cleanEmail === ADMIN_EMAIL.toLowerCase() && pass === ADMIN_PASSWORD)
      ) {
        try {
          userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
        } catch (createErr) {
          userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
        }
      } else {
        throw authError;
      }
    }

    const uid = userCredential.user.uid;
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    const docSnap = await getDoc(userDocRef);

    let userData: User;
    if (docSnap.exists()) {
      const data = docSnap.data();
      userData = {
        id: uid,
        email: data.email || cleanEmail,
        status: data.status || 'active',
        role: data.role || (cleanEmail === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user'),
        payment: data.payment || null,
        created: data.created || new Date().toLocaleString(),
      };
    } else {
      // Create user document if missing
      userData = {
        id: uid,
        email: cleanEmail,
        status: 'active',
        role: cleanEmail === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user',
        payment: null,
        created: new Date().toLocaleString(),
      };
      await setDoc(userDocRef, {
        ...userData,
        createdAt: new Date().toISOString(),
      });
    }

    return { success: true, user: userData };
  } catch (err: any) {
    console.error('Firebase login error:', err);
    return { success: false, error: err.message || 'Invalid Gmail or password' };
  }
}

/**
 * Admin Login Verification
 */
export async function adminLoginWithFirebase(
  email: string,
  pass: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail !== ADMIN_EMAIL.toLowerCase() || pass !== ADMIN_PASSWORD) {
    return { success: false, error: 'Invalid admin credentials' };
  }

  try {
    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      } else {
        throw err;
      }
    }

    const uid = userCredential.user.uid;
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    await setDoc(
      userDocRef,
      {
        email: cleanEmail,
        role: 'admin',
        status: 'approved',
        created: new Date().toLocaleString(),
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );

    const adminUser: User = {
      id: uid,
      email: cleanEmail,
      status: 'approved',
      role: 'admin',
    };

    return { success: true, user: adminUser };
  } catch (err: any) {
    console.error('Admin Auth Error:', err);
    return {
      success: true,
      user: {
        id: 'admin_master',
        email: cleanEmail,
        status: 'approved',
        role: 'admin',
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

  // 1. Update User document with pending status and payment info
  if (userId) {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(
      userDocRef,
      {
        status: 'pending',
        payment: {
          amount: payment.amount,
          method: payment.method,
          transactionId: payment.transactionId || '',
          date: payment.date,
        },
      },
      { merge: true }
    );
  }

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
      createdAt: new Date().toISOString(),
      serverUpdated: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Admin: Approve User Payment (Sets status to 'approved' in Firestore)
 */
export async function approvePaymentInFirebase(userEmail: string): Promise<void> {
  const cleanEmail = userEmail.trim().toLowerCase();
  
  // Update request queue
  const reqDocRef = doc(db, REQUESTS_COLLECTION, emailToDocId(cleanEmail));
  try {
    await setDoc(reqDocRef, {
      status: 'approved',
      serverUpdated: serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    console.error('Error updating request doc', e);
  }

  // Find user by email and update user document
  const uid = await findUserIdByEmail(cleanEmail);
  if (uid) {
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userDocRef, {
      status: 'approved',
      serverUpdated: serverTimestamp(),
    });
  }
}

/**
 * Admin: Reject User Payment (Sets status to 'rejected' in Firestore)
 */
export async function rejectPaymentInFirebase(userEmail: string): Promise<void> {
  const cleanEmail = userEmail.trim().toLowerCase();

  // Update request queue
  const reqDocRef = doc(db, REQUESTS_COLLECTION, emailToDocId(cleanEmail));
  try {
    await setDoc(reqDocRef, {
      status: 'rejected',
      serverUpdated: serverTimestamp(),
    }, { merge: true });
  } catch (e) {}

  // Find user by email and update user document
  const uid = await findUserIdByEmail(cleanEmail);
  if (uid) {
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userDocRef, {
      status: 'rejected',
      serverUpdated: serverTimestamp(),
    });
  }
}

/**
 * Admin: Remove user / revoke privileges (Sets status to 'removed')
 */
export async function removeUserInFirebase(userEmail: string): Promise<void> {
  const cleanEmail = userEmail.trim().toLowerCase();

  // Update request queue
  const reqDocRef = doc(db, REQUESTS_COLLECTION, emailToDocId(cleanEmail));
  try {
    await setDoc(reqDocRef, {
      status: 'rejected',
      serverUpdated: serverTimestamp(),
    }, { merge: true });
  } catch (e) {}

  // Find user by email and update user document
  const uid = await findUserIdByEmail(cleanEmail);
  if (uid) {
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userDocRef, {
      status: 'removed',
      serverUpdated: serverTimestamp(),
    });
  }
}

/**
 * Real-time listener for current user document.
 */
export function subscribeToCurrentUser(
  userId: string,
  onUpdate: (user: User) => void
): () => void {
  const userDocRef = doc(db, USERS_COLLECTION, userId);
  return onSnapshot(
    userDocRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onUpdate({
          id: docSnap.id,
          email: data.email,
          status: data.status,
          role: data.role,
          payment: data.payment,
          created: data.created,
        });
      }
    },
    (err) => {
      console.warn('Current user subscription info:', err.message);
    }
  );
}

/**
 * Real-time listener for all users (for Admin Panel).
 */
export function subscribeToAllUsers(onUpdate: (users: User[]) => void): () => void {
  const usersRef = collection(db, USERS_COLLECTION);
  return onSnapshot(
    usersRef,
    (querySnapshot) => {
      const usersList: User[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        usersList.push({
          id: docSnap.id,
          email: data.email,
          status: data.status,
          role: data.role,
          payment: data.payment,
          created: data.created,
        });
      });
      onUpdate(usersList);
    },
    (err) => {
      console.warn('All users subscription notice:', err.message);
    }
  );
}
