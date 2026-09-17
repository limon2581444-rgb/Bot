export type UserStatus = 'active' | 'pending' | 'approved' | 'rejected' | 'removed';

export interface PaymentInfo {
  amount: number;
  method: 'Binance' | 'bKash' | 'Nagad' | string;
  transactionId?: string;
  date: string;
}

export interface User {
  email: string;
  password?: string;
  status: UserStatus;
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
