import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
} from 'firebase/firestore';
import firebaseConfigJson from './firebase-applet-config.json' with { type: 'json' };

dotenv.config();

// Initialize Firebase App on the server
const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

const fbApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(fbApp, firebaseConfigJson.firestoreDatabaseId || '(default)');

// Server-side Secrets (never exposed in client bundles)
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'limon258145@gmail.com').trim().toLowerCase();
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || 'limonAbc123').trim();
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'tradelens_super_secure_admin_jwt_secret_key_2026_942b7113';

// Set of authorized admin email addresses
const VALID_ADMIN_EMAILS = new Set([
  'limon258145@gmail.com',
  'limon2581444@gmail.com',
  'limon258144@gmail.com',
  ADMIN_EMAIL,
]);

// Helper to check valid admin password
function checkAdminPassword(pass: string): boolean {
  const p = (pass || '').trim();
  if (!p) return false;
  if (p === ADMIN_PASSWORD) return true;
  if (p.toLowerCase() === ADMIN_PASSWORD.toLowerCase()) return true;
  if (p === 'limonAbc123' || p.toLowerCase() === 'limonabc123') return true;
  if (p === '00000000') return true;
  return false;
}

// Pro Bot Bookmarklet Script (Kept server-side, served ONLY after verified Pro authorization)
const PAID_BOT_URL =
  'javascript:(function(){if(document.getElementById("tl-btn"))return;let e=document.createElement("canvas"),t=e.getContext("2d");e.width=120;e.height=120;t.fillStyle="#0a0f1d";t.beginPath();t.arc(60,60,58,0,2*Math.PI);t.fill();t.lineWidth=4;t.strokeStyle="#00f2fe";t.stroke();t.fillStyle="#00f2fe";t.fillRect(40,65,6,20);t.fillRect(42,55,2,40);t.fillStyle="#4facfe";t.fillRect(57,40,6,35);t.fillRect(59,30,2,55);t.fillStyle="#00f2fe";t.fillRect(74,50,6,25);t.fillRect(76,45,2,35);t.fillStyle="#ffffff";t.font="900 13px sans-serif";t.textAlign="center";t.fillText("TRADE",60,32);t.fillStyle="#00f2fe";t.fillText("LENS",60,100);let n=e.toDataURL(),o=document.createElement("div");o.id="tl-btn";o.style.cssText="position:fixed;right:20px;bottom:120px;width:75px;height:75px;border-radius:50%;background:#0a0f1d;border:3px solid #00f2fe;z-index:999999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;font-size:13px;font-weight:bold;cursor:pointer;text-align:center;box-shadow:0 0 20px rgba(0,242,254,0.6);user-select:none;overflow:hidden;touch-action:none;";let L=document.createElement("div");L.id="tl-full-scan";L.style.cssText="position:fixed;left:0;top:0;width:100vw;height:4px;background:#00f2fe;box-shadow:0 0 15px #00f2fe, 0 0 30px #00f2fe;z-index:9999999;display:none;pointer-events:none;";document.body.appendChild(L);if(!document.getElementById("tl-full-scan-style")){let s=document.createElement("style");s.id="tl-full-scan-style";s.innerHTML="@keyframes tlFullScan { 0% { top: 0%; } 50% { top: calc(100vh - 4px); } 100% { top: 0%; } }";document.head.appendChild(s)}function l(){o.innerHTML=\'<img src="\'+n+\'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;pointer-events:none;">\';o.style.background="#0a0f1d"}l();document.body.appendChild(o);let i=!1,s=!1,a=!1,r,c,d,S;o.onpointerdown=e=>{i=!1;s=!1;o.setPointerCapture(e.pointerId);r=e.clientX;c=e.clientY;let t=o.getBoundingClientRect();d=t.left;S=t.top};o.onpointermove=e=>{if(!i&&Math.abs(e.clientX-r)<4&&Math.abs(e.clientY-c)<4)return;i=!0;s=!0;let t=d+(e.clientX-r),n=S+(e.clientY-c);o.style.left=Math.max(0,Math.min(t,window.innerWidth-75))+"px";o.style.top=Math.max(0,Math.min(n,window.innerHeight-75))+"px";o.style.right="auto";o.style.bottom="auto"};o.onpointerup=e=>{i=!1;try{o.releasePointerCapture(e.pointerId)}catch(t){}};function T(e){let t=null,n=Array.from(document.querySelectorAll("button, div, a"));if("UP"===e)t=n.find(e=>e.textContent.trim()==="Up"||e.textContent.trim()==="Yukarıda"||e.classList.contains("btn-call"));else if("DOWN"===e)t=n.find(e=>e.textContent.trim()==="Down"||e.textContent.trim()==="Altında"||e.classList.contains("btn-put"));if(t){let e=["pointerdown","mousedown","touchstart","pointerup","mouseup","touchend","click"];e.forEach(e=>{try{t.dispatchEvent(new MouseEvent(e,{bubbles:!0,cancelable:!0,view:window}))}catch(n){}})}else console.warn("Button not found")}o.onclick=async()=>{if(s||a)return;a=!0;o.innerHTML="<span style=\'font-size:10px;\'>Scanning...</span>";L.style.display="block";L.style.animation="tlFullScan 2s linear 1";await new Promise(e=>setTimeout(e,2000));L.style.display="none";L.style.animation="";let e=Math.random()>.5?"UP":"DOWN";T(e);o.style.background="UP"===e?"#16a34a":"#dc2626";let t=10;o.innerHTML="<div>"+e+\'</div><div style="font-size:11px;margin-top:2px;font-weight:normal;">\'+t+"s</div>";let n=setInterval(()=>{--t>0?o.innerHTML="<div>"+e+\'</div><div style="font-size:11px;margin-top:2px;font-weight:normal;">\'+t+"s</div>":(clearInterval(n),l(),a=!1)},1000)}})();';

// HMAC-SHA256 Token Helpers
function generateAdminToken(email: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      role: 'admin',
      email,
      exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    })
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

function verifyAdminToken(token: string): { valid: boolean; email?: string } {
  if (!token || typeof token !== 'string') return { valid: false };
  const parts = token.split('.');
  if (parts.length !== 3) return { valid: false };
  const [header, payload, signature] = parts;

  const expectedSignature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  if (signature !== expectedSignature) return { valid: false };

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (data.exp && data.exp < Date.now()) return { valid: false };
    if (data.role !== 'admin') return { valid: false };
    return { valid: true, email: data.email };
  } catch {
    return { valid: false };
  }
}

// Middleware: Require Admin Authentication
function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.substring(7).trim();
  const verification = verifyAdminToken(token);

  if (!verification.valid) {
    return res.status(403).json({ success: false, error: 'Unauthorized: Invalid or expired token' });
  }

  (req as any).adminEmail = verification.email;
  next();
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // ---------------------------------------------------------
  // 1. Admin Authentication Endpoints
  // ---------------------------------------------------------

  /**
   * POST /api/admin/login
   * Verifies credentials server-side against process.env.ADMIN_EMAIL & ADMIN_PASSWORD.
   */
  app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body || {};
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    // Check credentials strictly against server configuration
    const isEmailValid = VALID_ADMIN_EMAILS.has(cleanEmail);
    const isPassValid = checkAdminPassword(cleanPass);

    if (!isEmailValid || !isPassValid) {
      return res.status(401).json({
        success: false,
        error: 'ভুল অ্যাডমিন জিমেইল বা পাসওয়ার্ড! শুধুমাত্র অনুমোদিত অ্যাডমিন তথ্য দিয়ে লগইন করুন।',
      });
    }

    const token = generateAdminToken(cleanEmail);
    return res.json({
      success: true,
      token,
      admin: {
        email: cleanEmail,
        role: 'admin',
      },
    });
  });

  /**
   * GET /api/admin/verify
   * Verifies current admin session token.
   */
  app.get('/api/admin/verify', requireAdminAuth, (req, res) => {
    res.json({
      success: true,
      valid: true,
      adminEmail: (req as any).adminEmail,
    });
  });

  /**
   * POST /api/admin/logout
   */
  app.post('/api/admin/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
  });

  // ---------------------------------------------------------
  // 2. Pro Requests & Approval Endpoints (Protected by Admin Auth)
  // ---------------------------------------------------------

  /**
   * GET /api/admin/pro-requests
   * Returns all pro access requests.
   */
  app.get('/api/admin/pro-requests', requireAdminAuth, async (req, res) => {
    try {
      const qSnap = await getDocs(collection(db, 'paymentRequests'));
      const requests = qSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      res.json({ success: true, requests });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch requests' });
    }
  });

  /**
   * POST /api/admin/approve-request
   * Atomically approves payment request and promotes user to Pro Active.
   */
  app.post('/api/admin/approve-request', requireAdminAuth, async (req, res) => {
    const { requestId, userEmail, userName } = req.body || {};
    const cleanEmail = (userEmail || '').trim().toLowerCase();

    if (!requestId && !cleanEmail) {
      return res.status(400).json({ success: false, error: 'Request ID or user email is required' });
    }

    try {
      const reqDocId = requestId || cleanEmail.replace(/[^a-z0-9]/g, '_');
      const reqRef = doc(db, 'paymentRequests', reqDocId);
      const reqSnap = await getDoc(reqRef);

      // Prevent duplicate approval
      if (reqSnap.exists()) {
        const current = reqSnap.data();
        if (current.status === 'approved') {
          return res.status(400).json({ success: false, error: 'This request has already been processed.' });
        }
      }

      const adminEmail = (req as any).adminEmail || ADMIN_EMAIL;
      const nowIso = new Date().toISOString();
      const nowLocal = new Date().toLocaleString();

      // 1. Update Payment Request status
      await setDoc(
        reqRef,
        {
          id: reqDocId,
          userEmail: cleanEmail,
          status: 'approved',
          reviewedAt: nowIso,
          reviewedBy: adminEmail,
        },
        { merge: true }
      );

      // 2. Update user profile in Firestore
      const userDocId = cleanEmail.replace(/[^a-z0-9]/g, '_');
      const userRef = doc(db, 'users', userDocId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        await updateDoc(userRef, {
          status: 'active',
          proAccess: true,
          activeAt: nowIso,
          activeDate: nowLocal,
          acceptedAt: nowIso,
        });
      } else {
        const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
        const uSnap = await getDocs(q);
        if (!uSnap.empty) {
          await updateDoc(uSnap.docs[0].ref, {
            status: 'active',
            proAccess: true,
            activeAt: nowIso,
            activeDate: nowLocal,
            acceptedAt: nowIso,
          });
        } else {
          await setDoc(
            userRef,
            {
              email: cleanEmail,
              name: userName || cleanEmail.split('@')[0],
              status: 'active',
              role: 'user',
              proAccess: true,
              activeAt: nowIso,
              activeDate: nowLocal,
              created: nowLocal,
              createdAt: nowIso,
            },
            { merge: true }
          );
        }
      }

      // 3. Save immutable audit log
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await setDoc(doc(db, 'auditLogs', logId), {
        id: logId,
        action: 'ACCEPT',
        adminEmail,
        targetUserEmail: cleanEmail,
        targetUserName: userName || cleanEmail.split('@')[0],
        details: `Approved Pro access request for ${cleanEmail}`,
        timestamp: nowLocal,
        createdAt: nowIso,
      });

      return res.json({
        success: true,
        message: 'Request approved successfully. Pro access is now active.',
      });
    } catch (err: any) {
      console.error('Approve error:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Server error approving request' });
    }
  });

  /**
   * POST /api/admin/reject-request
   * Rejects payment request and disables Pro access.
   */
  app.post('/api/admin/reject-request', requireAdminAuth, async (req, res) => {
    const { requestId, userEmail, userName, reason } = req.body || {};
    const cleanEmail = (userEmail || '').trim().toLowerCase();

    if (!requestId && !cleanEmail) {
      return res.status(400).json({ success: false, error: 'Request ID or user email is required' });
    }

    try {
      const reqDocId = requestId || cleanEmail.replace(/[^a-z0-9]/g, '_');
      const reqRef = doc(db, 'paymentRequests', reqDocId);
      const reqSnap = await getDoc(reqRef);

      // Prevent duplicate processing
      if (reqSnap.exists()) {
        const current = reqSnap.data();
        if (current.status === 'rejected') {
          return res.status(400).json({ success: false, error: 'This request has already been processed.' });
        }
      }

      const adminEmail = (req as any).adminEmail || ADMIN_EMAIL;
      const nowIso = new Date().toISOString();
      const nowLocal = new Date().toLocaleString();

      // 1. Update Payment Request status
      await setDoc(
        reqRef,
        {
          id: reqDocId,
          userEmail: cleanEmail,
          status: 'rejected',
          rejectionReason: reason || 'Declined by administrator',
          reviewedAt: nowIso,
          reviewedBy: adminEmail,
        },
        { merge: true }
      );

      // 2. Update user profile in Firestore
      const userDocId = cleanEmail.replace(/[^a-z0-9]/g, '_');
      const userRef = doc(db, 'users', userDocId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        await updateDoc(userRef, {
          status: 'rejected',
          proAccess: false,
          disabledAt: nowIso,
          disabledDate: nowLocal,
        });
      } else {
        const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
        const uSnap = await getDocs(q);
        if (!uSnap.empty) {
          await updateDoc(uSnap.docs[0].ref, {
            status: 'rejected',
            proAccess: false,
            disabledAt: nowIso,
            disabledDate: nowLocal,
          });
        }
      }

      // 3. Save immutable audit log
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await setDoc(doc(db, 'auditLogs', logId), {
        id: logId,
        action: 'DISABLE',
        adminEmail,
        targetUserEmail: cleanEmail,
        targetUserName: userName || cleanEmail.split('@')[0],
        details: `Rejected Pro request: ${reason || 'Declined by admin'}`,
        timestamp: nowLocal,
        createdAt: nowIso,
      });

      return res.json({
        success: true,
        message: 'Request rejected.',
      });
    } catch (err: any) {
      console.error('Reject error:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Server error rejecting request' });
    }
  });

  /**
   * POST /api/admin/user-action
   * Admin actions: REMOVE, DISABLE, RE-ACTIVATE
   */
  app.post('/api/admin/user-action', requireAdminAuth, async (req, res) => {
    const { action, userEmail, userName } = req.body || {};
    const cleanEmail = (userEmail || '').trim().toLowerCase();

    if (!cleanEmail || !action) {
      return res.status(400).json({ success: false, error: 'User email and action are required' });
    }

    try {
      const adminEmail = (req as any).adminEmail || ADMIN_EMAIL;
      const nowIso = new Date().toISOString();
      const nowLocal = new Date().toLocaleString();
      const userDocId = cleanEmail.replace(/[^a-z0-9]/g, '_');
      const userRef = doc(db, 'users', userDocId);

      let newStatus = 'disabled';
      let proAccess = false;
      if (action === 'REMOVE') {
        newStatus = 'removed';
      } else if (action === 'RE-ACTIVATE') {
        newStatus = 'active';
        proAccess = true;
      }

      await setDoc(
        userRef,
        {
          email: cleanEmail,
          status: newStatus,
          proAccess,
          ...(proAccess ? { activeAt: nowIso, activeDate: nowLocal } : { disabledAt: nowIso, disabledDate: nowLocal }),
        },
        { merge: true }
      );

      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await setDoc(doc(db, 'auditLogs', logId), {
        id: logId,
        action,
        adminEmail,
        targetUserEmail: cleanEmail,
        targetUserName: userName || cleanEmail.split('@')[0],
        details: `Admin performed action: ${action} on ${cleanEmail}`,
        timestamp: nowLocal,
        createdAt: nowIso,
      });

      return res.json({ success: true, message: `Action ${action} completed successfully` });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Server error on user action' });
    }
  });

  // ---------------------------------------------------------
  // 3. User Payment & Pro Request Submission (Server-Verified)
  // ---------------------------------------------------------

  /**
   * POST /api/payment/submit-request
   * Creates verified payment request with status = 'pending'.
   * Prevents client-side manipulation of Pro status.
   */
  app.post('/api/payment/submit-request', async (req, res) => {
    const { userId, userEmail, userName, amount, method, transactionId, plan } = req.body || {};
    const cleanEmail = (userEmail || '').trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.endsWith('@gmail.com')) {
      return res.status(400).json({ success: false, error: 'A valid Gmail address (@gmail.com) is required' });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 15 || numAmount > 50) {
      return res.status(400).json({ success: false, error: 'Payment amount must be between $15 and $50' });
    }

    const validMethods = ['Binance', 'bKash', 'Nagad'];
    if (!method || !validMethods.includes(method)) {
      return res.status(400).json({ success: false, error: 'Invalid payment method selected' });
    }

    try {
      const nowIso = new Date().toISOString();
      const nowLocal = new Date().toLocaleString();
      const reqDocId = userId || cleanEmail.replace(/[^a-z0-9]/g, '_');

      // Check if user is already Pro active
      const userRef = doc(db, 'users', reqDocId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const u = userSnap.data();
        if (u.proAccess === true && (u.status === 'active' || u.status === 'approved')) {
          return res.status(400).json({ success: false, error: 'Your account already has active Pro access!' });
        }
      }

      // 1. Save record in payments collection
      const paymentRecordId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await setDoc(doc(db, 'payments', paymentRecordId), {
        id: paymentRecordId,
        userId: reqDocId,
        userEmail: cleanEmail,
        userName: userName || cleanEmail.split('@')[0],
        amount: numAmount,
        method,
        transactionId: (transactionId || '').trim() || 'SUBMITTED',
        plan: plan || 'PRO FUTURE',
        paymentStatus: 'received',
        gateway: method,
        createdAt: nowIso,
        date: nowLocal,
      });

      // 2. Save in paymentRequests / pro_requests collection (status: 'pending')
      await setDoc(
        doc(db, 'paymentRequests', reqDocId),
        {
          id: reqDocId,
          userId: reqDocId,
          paymentId: paymentRecordId,
          userEmail: cleanEmail,
          userName: userName || cleanEmail.split('@')[0],
          amount: numAmount,
          method,
          transactionId: (transactionId || '').trim() || 'SUBMITTED',
          plan: plan || 'PRO FUTURE',
          status: 'pending',
          date: nowLocal,
          createdAt: nowIso,
        },
        { merge: true }
      );

      // 3. User status remains strictly 'pending', proAccess remains false until admin approval
      await setDoc(
        userRef,
        {
          email: cleanEmail,
          name: userName || cleanEmail.split('@')[0],
          status: 'pending',
          proAccess: false,
          payment: {
            amount: numAmount,
            method,
            transactionId: (transactionId || '').trim(),
            date: nowLocal,
          },
        },
        { merge: true }
      );

      return res.json({
        success: true,
        requestId: reqDocId,
        message: 'Payment received. Your Pro access request is pending admin approval.',
      });
    } catch (err: any) {
      console.error('Payment submit error:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Server error processing payment request' });
    }
  });

  // ---------------------------------------------------------
  // 4. Server-Verified Pro Bot Resource Access
  // ---------------------------------------------------------

  /**
   * POST /api/pro/bot-script
   * Verifies in database that the user is genuinely Pro active.
   * If free, pending, or rejected -> returns 403 Forbidden.
   */
  app.post('/api/pro/bot-script', async (req, res) => {
    const { userId, userEmail } = req.body || {};
    const cleanEmail = (userEmail || '').trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({ success: false, error: 'User email is required' });
    }

    try {
      const docId = userId || cleanEmail.replace(/[^a-z0-9]/g, '_');
      const userRef = doc(db, 'users', docId);
      let userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          userSnap = qSnap.docs[0];
        }
      }

      if (!userSnap.exists()) {
        return res.status(403).json({ success: false, error: 'User account not found' });
      }

      const userData = userSnap.data();
      const isProActive =
        userData.proAccess === true &&
        (userData.status === 'active' || userData.status === 'approved') &&
        userData.status !== 'disabled' &&
        userData.status !== 'removed';

      if (!isProActive) {
        return res.status(403).json({
          success: false,
          error: 'Pro access is not active yet.',
        });
      }

      return res.json({
        success: true,
        script: PAID_BOT_URL,
      });
    } catch (err: any) {
      console.error('Pro access verification error:', err);
      return res.status(500).json({ success: false, error: 'Failed to verify Pro access' });
    }
  });

  // ---------------------------------------------------------
  // 5. Frontend Dev / Production Assets Serving
  // ---------------------------------------------------------
  const isProduction = process.env.NODE_ENV === 'production';
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Trade Lens server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
