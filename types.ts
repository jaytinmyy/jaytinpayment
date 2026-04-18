
export type PaymentType = 'Installment' | 'Delayed';
export type PaymentMethod = 'Cash' | 'BANK' | 'E-Wallet';

export interface PurchaseItem {
  id: string;
  name: string;
  amount: number;
  date: string;
  note?: string;
  attachment?: Attachment;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  note?: string;
  attachment?: Attachment;
}

export interface SystemNote {
  id: string;
  timestamp: string;
  content: string;
  isPinned?: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  data: string; // Base64 or URL
  type: 'image' | 'document';
  description?: string;
  fileSize?: number;
}

export interface LedgerRecord {
  id: string; 
  shareKey: string; // 混淆加密共享密钥
  userName: string;
  type: PaymentType;
  totalAmount: number;
  paidAmount: number;
  paymentCycle?: 'Day' | 'Weekly' | 'Monthly';
  cycleCount?: number;
  startDate: string;
  endDate?: string;
  nextPaymentDate?: string;
  items: PurchaseItem[];
  payments: PaymentRecord[];
  notes: SystemNote[];
  attachments: Attachment[];
  status: 'Active' | 'Settled' | 'Overdue';
  ownerId?: string;
  updatedAt?: any; // Firestore serverTimestamp
}

export interface MonthlyTrend {
  month: string;
  amount: number;
}

export interface DashboardStats {
  totalValuation: number;
  totalOutstanding: number;
  activeCustomers: number;
  collectedThisMonth: number;
  collectionRate: number;
  overdueAmount: number;
  monthlyTrend: MonthlyTrend[];
}
