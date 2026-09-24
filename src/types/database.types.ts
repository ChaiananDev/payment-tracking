export type MemberPaymentStatus = 'Paid' | 'Due Soon' | 'Overdue' | 'Prepaid' | 'Inactive';

export interface UserProfile {
  id: string;
  display_name: string;
  promptpay_no: string | null;
  bank_info: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  user_id?: string;
  member_code: string;
  full_name: string;
  nickname: string;
  phone: string | null;
  email: string | null;
  joined_date: string;
  status: 'ACTIVE' | 'INACTIVE';
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id?: string;
  name: string;
  category: string;
  master_cost: number;
  master_billing_day: number;
  default_price: number;
  billing_cycle: string;
  icon_color: string;
  created_at: string;
  updated_at?: string;
}

export interface SubscriptionMember {
  id: string;
  user_id?: string;
  member_id: string;
  subscription_id: string;
  package_price: number;
  billing_day: number;
  paid_until: string;
  credit_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joins
  members?: Member;
  subscriptions?: Subscription;
}

export interface Payment {
  id: string;
  user_id?: string;
  subscription_member_id: string;
  amount_paid: number;
  deducted_to_package: number;
  added_to_credit: number;
  months_advanced: number;
  receipt_no: string | null;
  slip_url: string | null;
  payment_method: string;
  note: string | null;
  payment_date: string;
  created_at: string;
}

export interface MemberSummaryView {
  id: string; // subscription_member_id
  memberId: string;
  memberCode: string;
  fullName: string;
  nickname: string;
  phone: string | null;
  email: string | null;
  subscriptionId: string;
  subscriptionName: string;
  packagePrice: number;
  billingDay: number;
  paidUntil: string;
  creditBalance: number;
  status: MemberPaymentStatus;
  daysRemaining: number;
  isActive: boolean;
  note: string | null;
}
