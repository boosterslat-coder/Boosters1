import { useEffect, useState, useCallback } from 'react';
import {
  Users as UsersIcon, Trophy, DollarSign, Settings, Shield,
  RefreshCw, Freeze, BarChart3, AlertTriangle
} from 'lucide-react';
import { supabase, Profile, LotteryGame } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type Props = { onNavigate: (page: 'dashboard' | 'match' | 'admin') => void };

export default function AdminPage({ onNavigate }: Props) {
  const { profile } = useAuth();
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [allGames, setAllGames] = useState<LotteryGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const loadData = useCallback(async () => {
    const [profilesRes, gamesRes, settingsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('lottery_games').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('app_settings').select('*'),
    ]);
    if (profilesRes.data) setAllProfiles(profilesRes.data as Profile[]);
    if (gamesRes.data) setAllGames(gamesRes.data as LotteryGame[]);
    if (settingsRes.data) {
      const map: Record<string, string> = {};
      (settingsRes.data as { key: string; value: string }[]).forEach(s => { map[s.key] = s.value; });
      setSettings(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center text-slate-400">
        <div className="text-center">
          <AlertTriangle size={48} className="mx-auto mb-4 text-red-400" />
          <p className="text-lg font-bold">Admin access required</p>
        </div>
      </div>
    );
  }

  const totalUsers = allProfiles.length;
  const totalMatches = allGames.length;
  const completedMatches = allGames.filter(g => g.status === 'completed').length;
  const totalPrizes = allGames.reduce((sum, g) => g.status === 'completed' ? sum + (g.prize_amount ?? 10) : sum, 0);
  const totalDeposits = allProfiles.reduce((sum, p) => sum + p.balance, 0);

  async function updateSetting(key: string, value: string) {
    await supabase.from('app_settings').update({ value }).eq('key', key);
    setSettings(s => ({ ...s, [key]: value }));
    setEditKey(null);
  }

  async function toggleFreeze(userId: string, currentBalance: number) {
    if (confirm('Freeze/unfreeze this account?')) {
      await supabase.from('profiles').update({ balance: currentBalance < 0 ? 0 : -999 }).eq('id', userId);
      await loadData();
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/6 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-slate-400 text-sm">Manage users, matches, and system settings</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><RefreshCw size={28} className="animate-spin text-slate-500" /></div>
        ) : (
          <>
            {/* Overview cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { icon: <UsersIcon size={18} className="text-blue-400" />, label: 'Total Users', value: totalUsers, grad: 'from-blue-500/10 to-cyan-500/10' },
                { icon: <Trophy size={18} className="text-amber-400" />, label: 'Matches', value: completedMatches, grad: 'from-amber-500/10 to-orange-500/10' },
                { icon: <DollarSign size={18} className="text-emerald-400" />, label: 'Prizes Paid', value: `€${totalPrizes.toFixed(0)}`, grad: 'from-emerald-500/10 to-teal-500/10' },
                { icon: <BarChart3 size={18} className="text-purple-400" />, label: 'Total Balances', value: `€${totalDeposits.toFixed(0)}`, grad: 'from-purple-500/10 to-pink-500/10' },
              ].map((s, i) => (
                <div key={i} className={`glass-card bg-gradient-to-br ${s.grad} p-4`}>
                  <div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-xs text-slate-400">{s.label}</span></div>
                  <p className="text-2xl font-black text-white">{s.value}</p>
                </div>
              ))}
            </div>

            {/* System Settings */}
            <div className="glass-card p-6 mb-8">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Settings size={18} className="text-slate-400" /> System Settings
              </h3>
              <div className="space-y-3">
                {[
                  { key: 'app_locked', label: 'App Locked', desc: 'Show waiting list to non-dev users' },
                  { key: 'match_size', label: 'Match Size', desc: 'Players per match' },
                  { key: 'entry_fee', label: 'Entry Fee (€)', desc: 'Cost per player' },
                  { key: 'weight_base', label: 'Weight Base', desc: 'Base weight for fairness' },
                  { key: 'weight_per_loss', label: 'Weight Per Loss', desc: 'Added weight per consecutive loss' },
                  { key: 'guaranteed_after', label: 'Guaranteed After', desc: 'Losses before guaranteed win' },
                ].map(s => (
                  <div key={s.key} className="flex items-center justify-between py-2 border-b border-white/5">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{s.label}</p>
                      <p className="text-xs text-slate-500">{s.desc}</p>
                    </div>
                    {editKey === s.key ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className="w-24 px-2 py-1 border border-white/10 rounded-lg bg-white/5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                        />
                        <button onClick={() => updateSetting(s.key, editValue)} className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-lg">Save</button>
                        <button onClick={() => setEditKey(null)} className="px-3 py-1 bg-white/5 text-slate-400 text-xs rounded-lg">Cancel</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditKey(s.key); setEditValue(settings[s.key] ?? ''); }}
                        className="px-3 py-1 bg-white/5 border border-white/10 text-blue-400 text-sm font-mono rounded-lg hover:bg-white/10 transition"
                      >
                        {settings[s.key] ?? '—'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Users table */}
            <div className="glass-card p-6 mb-8">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <UsersIcon size={18} className="text-slate-400" /> Users ({totalUsers})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 border-b border-white/5">
                      <th className="text-left py-2 font-medium">Username</th>
                      <th className="text-left py-2 font-medium">Balance</th>
                      <th className="text-left py-2 font-medium">Wins</th>
                      <th className="text-left py-2 font-medium">Losses</th>
                      <th className="text-left py-2 font-medium">Streak</th>
                      <th className="text-left py-2 font-medium">Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allProfiles.slice(0, 30).map(p => (
                      <tr key={p.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                        <td className="py-2 text-slate-200 font-medium">{p.username || 'Unnamed'}</td>
                        <td className="py-2 text-emerald-400">€{p.balance.toFixed(2)}</td>
                        <td className="py-2 text-amber-400">{p.total_wins}</td>
                        <td className="py-2 text-red-400">{p.total_losses}</td>
                        <td className="py-2">
                          <span className={`font-bold ${p.losses_since_last_win >= 7 ? 'text-amber-400' : 'text-slate-300'}`}>
                            {p.losses_since_last_win}
                          </span>
                        </td>
                        <td className="py-2">{p.is_admin ? <span className="text-purple-400">Yes</span> : <span className="text-slate-600">No</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent matches */}
            <div className="glass-card p-6">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Trophy size={18} className="text-slate-400" /> Match History ({totalMatches})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {allGames.slice(0, 20).map(g => (
                  <div key={g.id} className="flex items-center justify-between py-2 border-b border-white/[0.03]">
                    <div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        g.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400'
                        : g.status === 'refunded' ? 'bg-red-500/15 text-red-400'
                        : 'bg-blue-500/15 text-blue-400'
                      }`}>{g.status}</span>
                      <span className="text-xs text-slate-500 ml-2">{new Date(g.created_at).toLocaleDateString()}</span>
                    </div>
                    <span className="text-sm text-emerald-400 font-semibold">€{(g.prize_amount ?? 10).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
