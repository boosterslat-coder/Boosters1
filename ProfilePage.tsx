import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

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

export type Transaction = {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'ticket_purchase' | 'win' | 'refund' | 'fee_withdrawal';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  created_at: string;
};

export type AppSetting = {
  key: string;
  value: string;
};
