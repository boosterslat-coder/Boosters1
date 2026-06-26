import { useEffect, useState, useCallback } from 'react';
import {
  Users as UsersIcon, Trophy, DollarSign, Settings, Shield,
  RefreshCw, BarChart3
} from 'lucide-react';
import { supabase, Profile, LotteryGame } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardPage() {
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
      <div className="glass-card p-8 text-center">
        <Shield size={32} className="mx-auto mb-2 text-black/10" />
        <p className="text-xs text-black/30">Admin access required</p>
      </div>
    );
  }

  const totalUsers = allProfiles.length;
  const completedMatches = allGames.filter(g => g.status === 'completed').length;
  const totalPrizes = allGames.reduce((sum, g) => g.status === 'completed' ? sum + (g.prize_amount ?? 10) : sum, 0);

  async function updateSetting(key: string, value: string) {
    await supabase.from('app_settings').update({ value }).eq('key', key);
    setSettings(s => ({ ...s, [key]: value }));
    setEditKey(null);
  }

  return (
    <div>
      <h1 className="text-[18px] font-semibold text-black mb-4">Admin</h1>

      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw size={20} className="animate-spin text-black/15" /></div>
      ) : (
        <>
          {/* Overview */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="glass-card p-3">
              <div className="flex items-center gap-1.5 mb-1"><UsersIcon size={12} className="text-black/25" /><span className="text-[9px] text-black/30">Users</span></div>
              <p className="text-lg font-bold text-black">{totalUsers}</p>
            </div>
            <div className="glass-card p-3">
              <div className="flex items-center gap-1.5 mb-1"><Trophy size={12} className="text-black/25" /><span className="text-[9px] text-black/30">Matches</span></div>
              <p className="text-lg font-bold text-black">{completedMatches}</p>
            </div>
            <div className="glass-card p-3">
              <div className="flex items-center gap-1.5 mb-1"><DollarSign size={12} className="text-black/25" /><span className="text-[9px] text-black/30">Prizes Paid</span></div>
              <p className="text-lg font-bold text-black">€{totalPrizes.toFixed(0)}</p>
            </div>
            <div className="glass-card p-3">
              <div className="flex items-center gap-1.5 mb-1"><BarChart3 size={12} className="text-black/25" /><span className="text-[9px] text-black/30">Open Games</span></div>
              <p className="text-lg font-bold text-black">{allGames.filter(g => g.status === 'open').length}</p>
            </div>
          </div>

          {/* Settings */}
          <div className="glass-card p-4 mb-4">
            <div className="flex items-center gap-1.5 mb-3">
              <Settings size={12} className="text-black/25" />
              <p className="text-[10px] font-semibold text-black/40 uppercase tracking-wider">Settings</p>
            </div>
            <div className="space-y-2">
              {[
                { key: 'app_locked', label: 'App Locked', desc: 'Show waiting list' },
                { key: 'match_size', label: 'Match Size', desc: 'Players per match' },
                { key: 'entry_fee', label: 'Entry Fee (€)', desc: 'Cost per player' },
                { key: 'weight_base', label: 'Weight Base', desc: 'Base weight' },
                { key: 'weight_per_loss', label: 'Weight Per Loss', desc: '+25 per loss' },
                { key: 'guaranteed_after', label: 'Guaranteed After', desc: 'Losses before guarantee' },
              ].map(s => (
                <div key={s.key} className="flex items-center justify-between py-1.5 border-b border-black/[0.04] last:border-0">
                  <div>
                    <p className="text-[11px] font-medium text-black/60">{s.label}</p>
                    <p className="text-[9px] text-black/25">{s.desc}</p>
                  </div>
                  {editKey === s.key ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="w-16 px-2 py-1 glass-input text-[10px] text-black"
                        autoFocus
                      />
                      <button onClick={() => updateSetting(s.key, editValue)} className="text-[9px] font-semibold text-black px-2 py-1 bg-black/5 rounded">Save</button>
                      <button onClick={() => setEditKey(null)} className="text-[9px] text-black/30 px-1">X</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditKey(s.key); setEditValue(settings[s.key] ?? ''); }}
                      className="px-2 py-1 bg-black/[0.03] border border-black/[0.06] text-[10px] font-mono text-black/50 rounded"
                    >
                      {settings[s.key] ?? '—'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Users */}
          <div className="glass-card p-4 mb-4">
            <p className="text-[10px] font-semibold text-black/40 uppercase tracking-wider mb-3">Users</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {allProfiles.slice(0, 20).map(p => (
                <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-black/[0.03]">
                  <div>
                    <span className="text-[11px] font-medium text-black/60">{p.username || 'Unnamed'}</span>
                    {p.is_admin && <span className="text-[8px] text-black/20 ml-1">admin</span>}
                  </div>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="text-black/30">€{p.balance.toFixed(2)}</span>
                    <span className="text-black/20">W{p.total_wins}</span>
                    <span className="text-black/20">L{p.total_losses}</span>
                    <span className={`font-medium ${p.losses_since_last_win >= 7 ? 'text-black/50' : 'text-black/15'}`}>
                      {p.losses_since_last_win}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent matches */}
          <div className="glass-card p-4">
            <p className="text-[10px] font-semibold text-black/40 uppercase tracking-wider mb-3">Recent Matches</p>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {allGames.slice(0, 15).map(g => (
                <div key={g.id} className="flex items-center justify-between py-1 border-b border-black/[0.03]">
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${
                      g.status === 'completed' ? 'bg-black/5 text-black/40'
                      : 'bg-black/[0.02] text-black/20'
                    }`}>{g.status}</span>
                    <span className="text-[9px] text-black/20">{new Date(g.created_at).toLocaleDateString()}</span>
                  </div>
                  <span className="text-[10px] text-black/30 font-medium">€{(g.prize_amount ?? 10).toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
