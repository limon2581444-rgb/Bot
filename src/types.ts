export type UserStatus = 'active' | 'pending' | 'accepted' | 'approved' | 'rejected' | 'removed' | 'disabled';

export interface PaymentInfo {
  amount: number;
  method: 'Binance' | 'bKash' | 'Nagad' | string;
  transactionId?: string;
  date: string;
}

export interface PaymentRequest {
  id?: string;
  userId?: string;
  userEmail: string;
  userName?: string;
  amount: number;
  method: string;
  transactionId?: string;
  status: 'pending' | 'accepted' | 'approved' | 'rejected' | 'disabled';
  date: string;
  createdAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface User {
  id?: string;
  name?: string;
  email: string;
  status: UserStatus;
  role?: 'admin' | 'user';
  payment?: PaymentInfo | null;
  created?: string;
  createdAt?: string;
  acceptedAt?: string;
  acceptedDate?: string;
  activeAt?: string;
  activeDate?: string;
  disabledAt?: string;
  disabledDate?: string;
  proAccess?: boolean;
}

export type Page =
  | 'login'
  | 'register'
  | 'dashboard'
  | 'free'
  | 'paid'
  | 'payment'
  | 'pending'
  | 'pro'
  | 'denied'
  | 'adminLogin'
  | 'admin';

export type AuditActionType = 'ACCEPT' | 'ACTIVATE_PRO' | 'REMOVE' | 'DISABLE' | 'RE-ACTIVATE' | 'BULK_REMOVE';

export interface AdminAuditLog {
  id?: string;
  action: AuditActionType;
  adminEmail: string;
  targetUserEmail: string;
  targetUserName?: string;
  details?: string;
  timestamp: string;
  createdAt?: string;
}


