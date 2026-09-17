export type UserStatus = 'active' | 'pending' | 'approved' | 'rejected' | 'removed';

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
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  createdAt?: string;
}

export interface User {
  id?: string;
  email: string;
  password?: string;
  status: UserStatus;
  role?: 'admin' | 'user';
  payment?: PaymentInfo | null;
  created?: string;
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

