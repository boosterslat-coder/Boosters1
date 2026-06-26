import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://zcjayatzfuueguxknxot.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjamF5YXR6ZnV1ZWd1eGtueG90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNzQxMDYsImV4cCI6MjA5Nzk1MDEwNn0.eNlvMEsifdZztDoNLNaLyup65lgmlUqex794htoPR-o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string;
  avatar_url: string;
  balance: number;
  fee_balance: number;
  is_admin: boolean;
  losses_since_last_win: number;
  total_wins: number;
  total_losses: number;
  created_at: string;
  updated_at: string;
};

export type LotteryGame = {
  id: string;
  status: 'open' | 'completed' | 'refunded';
  winner_user_id: string | null;
  prize_amount: number;
  created_at: string;
  completed_at: string | null;
  expires_at: string;
};

export type LotteryGamePlayer = {
  id: string;
  game_id: string;
  user_id: string;
  slot: number;
  joined_at: string;
};

export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'ticket_purchase'
  | 'win'
  | 'refund'
  | 'fee_withdrawal'
  | 'ticket_savings_credit'
  | 'safe_distribution_credit'
  | 'developer_fee';

export type TransactionStatus = 'pending' | 'completed' | 'failed';

export type Transaction = {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  description: string;
  created_at: string;
};

export type AppSetting = {
  key: string;
  value: string;
};
