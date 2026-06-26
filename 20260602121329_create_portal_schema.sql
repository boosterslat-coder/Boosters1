import { useEffect, useState, useCallback } from 'react';
import { Trophy, Clock, RefreshCw } from 'lucide-react';
import { supabase, Transaction } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function HistoryPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setTransactions(data as Transaction[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <div>
      <h1 className="text-[18px] font-semibold text-black mb-4">History</h1>

      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw size={20} className="animate-spin text-black/15" /></div>
      ) : transactions.length === 0 ? (
        <div className="glass-card p-6 text-center">
          <Trophy size={24} className="mx-auto mb-2 text-black/15" />
          <p className="text-[11px] text-black/30">No history yet. Join a match to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map(tx => (
            <div key={tx.id} className="glass-card p-3.5 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                tx.type === 'win' ? 'bg-black/5' : tx.type === 'ticket_purchase' ? 'bg-black/[0.02]' : 'bg-black/[0.03]'
              }`}>
                {tx.type === 'win' ? (
                  <Trophy size={14} className="text-black" />
                ) : (
                  <Clock size={14} className="text-black/30" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-black truncate capitalize">
                  {tx.type === 'win' ? `Won €${tx.amount.toFixed(0)}` :
                   tx.type === 'ticket_purchase' ? 'Entry fee' :
                   tx.type === 'deposit' ? 'Deposit' :
                   tx.type === 'withdrawal' ? 'Withdrawal' :
                   tx.type.replace('_', ' ')}
                </p>
                <p className="text-[10px] text-black/30">
                  {new Date(tx.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </p>
              </div>
              <span className={`text-[11px] font-semibold ${
                tx.amount > 0 ? 'text-black' : 'text-black/30'
              }`}>
                {tx.amount > 0 ? '+' : ''}€{Math.abs(tx.amount).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
