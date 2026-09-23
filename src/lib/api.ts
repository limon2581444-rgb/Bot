/**
 * Trade Lens API Client
 * Secure server-side interactions for Admin verification, Pro access and Payments
 */

const getAdminToken = (): string | null => {
  return sessionStorage.getItem('tl_admin_token');
};

export const setAdminToken = (token: string | null) => {
  if (token) {
    sessionStorage.setItem('tl_admin_token', token);
  } else {
    sessionStorage.removeItem('tl_admin_token');
  }
};

/**
 * 1. Admin Login via Server API (Verifies credentials securely on backend)
 */
export async function loginAdminApi(email: string, pass: string): Promise<{
  success: boolean;
  token?: string;
  admin?: { email: string; role: string };
  error?: string;
}> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Invalid email or password' };
    }

    if (data.token) {
      setAdminToken(data.token);
    }
    return { success: true, token: data.token, admin: data.admin };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Server connection error' };
  }
}

/**
 * 2. Verify Admin Session with Server
 */
export async function verifyAdminApi(): Promise<boolean> {
  const token = getAdminToken();
  if (!token) return false;

  try {
    const res = await fetch('/api/admin/verify', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return res.ok && !!data.valid;
  } catch {
    return false;
  }
}

/**
 * 3. Admin Logout
 */
export async function logoutAdminApi(): Promise<void> {
  const token = getAdminToken();
  setAdminToken(null);
  sessionStorage.removeItem('tl_admin_verified');

  if (token) {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
  }
}

/**
 * 4. Admin Approve Pro Request
 */
export async function approveRequestApi(
  requestId: string,
  userEmail: string,
  userName?: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  const token = getAdminToken();
  if (!token) {
    return { success: false, error: 'Unauthorized: Admin session expired' };
  }

  try {
    const res = await fetch('/api/admin/approve-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ requestId, userEmail, userName }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to approve request' };
    }
    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Server connection error' };
  }
}

/**
 * 5. Admin Reject Pro Request
 */
export async function rejectRequestApi(
  requestId: string,
  userEmail: string,
  userName?: string,
  reason?: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  const token = getAdminToken();
  if (!token) {
    return { success: false, error: 'Unauthorized: Admin session expired' };
  }

  try {
    const res = await fetch('/api/admin/reject-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ requestId, userEmail, userName, reason }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to reject request' };
    }
    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Server connection error' };
  }
}

/**
 * 6. Admin User Action (REMOVE, DISABLE, RE-ACTIVATE)
 */
export async function userActionApi(
  action: 'REMOVE' | 'DISABLE' | 'RE-ACTIVATE',
  userEmail: string,
  userName?: string
): Promise<{ success: boolean; error?: string }> {
  const token = getAdminToken();
  if (!token) {
    return { success: false, error: 'Unauthorized: Admin session expired' };
  }

  try {
    const res = await fetch('/api/admin/user-action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action, userEmail, userName }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Action failed' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Server connection error' };
  }
}

/**
 * 7. Submit Payment Request (Backend-Verified)
 */
export async function submitPaymentRequestApi(payload: {
  userId?: string;
  userEmail: string;
  userName?: string;
  amount: number;
  method: string;
  transactionId?: string;
  plan?: string;
}): Promise<{ success: boolean; error?: string; message?: string; requestId?: string }> {
  try {
    const res = await fetch('/api/payment/submit-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Payment could not be verified.' };
    }
    return { success: true, message: data.message, requestId: data.requestId };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Server connection error' };
  }
}

/**
 * 8. Fetch Pro Bot Script (Protected: Server verifies Pro active state in DB)
 */
export async function fetchProBotScriptApi(
  userId?: string,
  userEmail?: string
): Promise<{ success: boolean; script?: string; error?: string }> {
  try {
    const res = await fetch('/api/pro/bot-script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userEmail }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Pro access is not active yet.' };
    }
    return { success: true, script: data.script };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Server connection error' };
  }
}
