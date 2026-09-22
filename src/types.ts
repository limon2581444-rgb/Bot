export type UserStatus = 'active' | 'pending' | 'approved' | 'rejected' | 'removed' | 'disabled';

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
  amount: number;
  method: string;
  transactionId?: string;
  status: 'pending' | 'approved' | 'rejected' | 'disabled';
  date: string;
  createdAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface User {
  id?: string;
  email: string;
  status: UserStatus;
  role?: 'admin' | 'user';
  payment?: PaymentInfo | null;
  created?: string;
  createdAt?: string;
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

