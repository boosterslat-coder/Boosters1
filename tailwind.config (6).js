import { useState, useRef } from 'react';
import { Camera, Loader, Trophy, TrendingDown, Shield, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function ProfilePage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [username, setUsername] = useState(profile?.username ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  if (!profile) return null;

  const totalMatches = profile.total_wins + profile.total_losses;
  const winPct = totalMatches > 0 ? ((profile.total_wins / totalMatches) * 100).toFixed(1) : '0.0';

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (username.trim().length < 3) { setError('Min 3 characters'); return; }
    setSaving(true);
    setError('');
    const { error: err } = await supabase
      .from('profiles')
      .update({ username: username.trim(), updated_at: new Date().toISOString() })
      .eq('id', user!.id);
    if (err) { setError('Failed to save'); setSaving(false); return; }
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError('Max 2MB'); return; }
    setSaving(true);
    const ext = file.name.split('.').pop();
    const path = `avatars/${user!.id}.${ext}`;
    await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user!.id);
    await refreshProfile();
    setSaving(false);
  }

  return (
    <div>
      <h1 className="text-[18px] font-semibold text-black mb-4">Profile</h1>

      {/* Avatar + username */}
      <div className="glass-card p-5 mb-3">
        <div className="flex flex-col items-center mb-4">
          <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
            <div className="w-16 h-16 rounded-full border-2 border-white/60 shadow-lg overflow-hidden bg-black/5 flex items-center justify-center">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-black/20 font-bold text-xl">
                  {profile.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <Camera size={16} className="text-white" />
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
          <p className="text-[9px] text-black/25 mt-1">Tap to change</p>
        </div>

        <form onSubmit={handleSave} className="space-y-2">
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full px-3 py-2.5 glass-input text-[11px] text-black"
            minLength={3}
          />
          <input
            type="email"
            value={user?.email ?? ''}
            disabled
            className="w-full px-3 py-2.5 glass-input text-[11px] text-black/30 cursor-not-allowed"
          />
          {error && <p className="text-red-500 text-[10px]">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full py-2.5 text-xs disabled:opacity-50"
          >
            {saving ? <Loader size={12} className="animate-spin inline" /> : saved ? 'Saved!' : 'Save'}
          </button>
        </form>
      </div>

      {/* Statistics */}
      <div className="glass-card p-4 mb-3">
        <p className="text-[10px] font-semibold text-black/40 uppercase tracking-wider mb-3">Statistics</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-black/30" />
            <div>
              <p className="text-[9px] text-black/30">Wins</p>
              <p className="text-[14px] font-bold text-black">{profile.total_wins}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown size={14} className="text-black/30" />
            <div>
              <p className="text-[9px] text-black/30">Losses</p>
              <p className="text-[14px] font-bold text-black">{profile.total_losses}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-black/30" />
            <div>
              <p className="text-[9px] text-black/30">Win Rate</p>
              <p className="text-[14px] font-bold text-black">{winPct}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-black/30" />
            <div>
              <p className="text-[9px] text-black/30">Matches</p>
              <p className="text-[14px] font-bold text-black">{totalMatches}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fairness Progress */}
      <div className="glass-card p-4 mb-3">
        <p className="text-[10px] font-semibold text-black/40 uppercase tracking-wider mb-2">Fairness Progress</p>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-black/30">Consecutive losses</span>
          <span className="font-bold text-black">{profile.losses_since_last_win} / 9</span>
        </div>
        <div className="h-2 bg-black/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-black/70 rounded-full transition-all duration-700"
            style={{ width: `${(profile.losses_since_last_win / 9) * 100}%` }}
          />
        </div>
        <p className="text-[9px] text-black/25 mt-1">
          {profile.losses_since_last_win >= 9
            ? 'Guaranteed win next game!'
            : `Guaranteed win in ${9 - profile.losses_since_last_win} games`}
        </p>
      </div>

      {/* Logout */}
      <button
        onClick={signOut}
        className="w-full py-3 text-xs font-semibold text-black/30 flex items-center justify-center gap-1.5 hover:text-black/50 transition"
      >
        <LogOut size={14} /> Sign Out
      </button>
    </div>
  );
}
