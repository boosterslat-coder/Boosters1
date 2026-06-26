import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Loader, Clock, Sparkles } from 'lucide-react';
import { supabase, LotteryGame, LotteryGamePlayer, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const ENTRY_FEE = 1.0;
const SLOTS_PER_GAME = 10;

type GameWithPlayers = LotteryGame & {
  players: (LotteryGamePlayer & { profile?: Pick<Profile, 'username' | 'avatar_url' | 'losses_since_last_win'> })[];
};

export default function MatchPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [games, setGames] = useState<GameWithPlayers[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [joining, setJoining] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [showWinner, setShowWinner] = useState<{ userId: string; username: string } | null>(null);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const loadGames = useCallback(async () => {
    const { data: gamesData } = await supabase
      .from('lottery_games')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: true })
      .limit(5);
    if (!gamesData) { setLoadingGames(false); return; }

    const gameIds = gamesData.map(g => g.id);
    const { data: playersData } = await supabase
      .from('lottery_game_players')
      .select('*, profiles(username, avatar_url, losses_since_last_win)')
      .in('game_id', gameIds);

    const enriched: GameWithPlayers[] = gamesData.map(game => ({
      ...game,
      players: (playersData ?? [])
        .filter(p => p.game_id === game.id)
        .map(p => ({ ...p, profile: p.profiles as any })),
    }));

    setGames(enriched);
    setLoadingGames(false);
  }, []);

  useEffect(() => {
    loadGames();
    const ch = supabase.channel('match-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lottery_games' }, loadGames)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lottery_game_players' }, () => {
        loadGames();
        refreshProfile();
      })
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, [loadGames, refreshProfile]);

  // Poll for winner
  useEffect(() => {
    async function checkCompleted() {
      if (!user) return;
      const { data } = await supabase
        .from('lottery_games')
        .select('id, winner_user_id')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data && data.winner_user_id) {
        const { data: wp } = await supabase.from('profiles').select('username').eq('id', data.winner_user_id).maybeSingle();
        if (wp) {
          setShowWinner({ userId: data.winner_user_id, username: wp.username ?? 'Player' });
          setTimeout(() => setShowWinner(null), 3000);
        }
      }
    }
    const interval = setInterval(checkCompleted, 3000);
    return () => clearInterval(interval);
  }, [user]);

  async function ensureOpenGame() {
    const openCount = games.filter(g => g.status === 'open' && g.players.length < SLOTS_PER_GAME).length;
    if (openCount === 0) {
      await supabase.from('lottery_games').insert({
        status: 'open',
        prize_amount: 10,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
      await loadGames();
    }
  }

  async function joinGame(gameId: string) {
    if (!user || !profile) return;
    if ((profile.balance ?? 0) < ENTRY_FEE) {
      notify('Insufficient balance. Add funds in Wallet.');
      return;
    }

    setJoining(true);
    const game = games.find(g => g.id === gameId);
    if (!game) { setJoining(false); return; }
    if (game.players.some(p => p.user_id === user.id)) {
      notify('You already joined this match.');
      setJoining(false); return;
    }

    const takenSlots = game.players.map(p => p.slot);
    let nextSlot = 1;
    while (takenSlots.includes(nextSlot) && nextSlot <= SLOTS_PER_GAME) nextSlot++;
    if (nextSlot > SLOTS_PER_GAME) { notify('Match is full.'); setJoining(false); return; }

    const newBalance = (profile.balance ?? 0) - ENTRY_FEE;
    const { error: balErr } = await supabase.from('profiles').update({ balance: newBalance }).eq('id', user.id);
    if (balErr) { notify('Failed to join.'); setJoining(false); return; }

    const { error: joinErr } = await supabase.from('lottery_game_players').insert({
      game_id: gameId, user_id: user.id, slot: nextSlot,
    });
    if (joinErr) {
      await supabase.from('profiles').update({ balance: profile.balance }).eq('id', user.id);
      notify('Failed to join.'); setJoining(false); return;
    }

    await supabase.from('transactions').insert({
      user_id: user.id, type: 'ticket_purchase', amount: -ENTRY_FEE,
      description: 'Match entry (€1)', status: 'completed',
    });

    await refreshProfile();
    await loadGames();
    setJoining(false);

    const playerCountAfter = (game.players.length ?? 0) + 1;
    if (playerCountAfter >= SLOTS_PER_GAME) {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lottery-resolve`;
        await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ game_id: gameId }),
        });
      } catch {}
    }
    await ensureOpenGame();
  }

  const activeGame = games.find(g => g.status === 'open' && g.players.length < SLOTS_PER_GAME) ?? games[0];
  const userInGame = activeGame?.players.some(p => p.user_id === user?.id);
  const isFull = activeGame?.players.length >= SLOTS_PER_GAME;
  const filledSlots = activeGame?.players.length ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Notification toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
              padding: '8px 20px', borderRadius: 999, background: 'rgba(0,0,0,0.85)',
              color: '#fff', fontSize: 12, fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Winner animation overlay */}
      <AnimatePresence>
        {showWinner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
            }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.6 }}
              style={{
                padding: 32, borderRadius: 16, textAlign: 'center',
                background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(14px)',
                border: '1px solid rgba(255,255,255,0.35)',
                boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
              }}
            >
              <motion.div animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: 2 }}>
                <Trophy size={48} style={{ margin: '0 auto 12px', display: 'block', color: '#111' }} />
              </motion.div>
              <p style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>
                {showWinner.userId === user?.id ? 'You won!' : `${showWinner.username} won!`}
              </p>
              <p style={{ fontSize: 13, color: '#666', margin: 0 }}>€10 prize</p>
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ x: 0, y: 0, opacity: 1 }}
                  animate={{ x: (Math.random() - 0.5) * 200, y: (Math.random() - 0.5) * 200, opacity: 0 }}
                  transition={{ duration: 1.5, delay: 0.2 + i * 0.05 }}
                  style={{
                    position: 'absolute', top: '50%', left: '50%',
                    width: 6, height: 6, borderRadius: '50%',
                    background: ['#111', '#333', '#666', '#999'][i % 4],
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loadingGames ? (
        <div style={{ padding: 40, textAlign: 'center' }}><Loader size={24} className="animate-spin" style={{ color: 'rgba(0,0,0,0.15)' }} /></div>
      ) : !activeGame ? (
        <div style={{
          width: 520, maxWidth: '100%', padding: 24, borderRadius: 16, textAlign: 'center',
          background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(14px)',
          border: '1px solid rgba(255,255,255,0.35)',
          boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
        }}>
          <Trophy size={32} style={{ margin: '0 auto 8px', color: 'rgba(0,0,0,0.1)' }} />
          <p style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>No open matches</p>
          <button onClick={ensureOpenGame} style={{
            padding: '10px 24px', borderRadius: 999, border: 'none',
            background: '#000', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}>Start Match</button>
        </div>
      ) : (
        <>
          {/* ─── BANKNOTE TICKET (same design as waiting list) ────── */}
          <div style={{
            width: 520, height: 280, borderRadius: 24, overflow: 'hidden',
            position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', maxWidth: '100%',
          }}>
            <img
              src="https://i.ibb.co/sc9p4fr/10e.jpg"
              alt="banknote"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              justifyContent: 'space-between', padding: 24,
              background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(3px)',
            }}>
              {/* Top 5 avatars */}
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                {Array.from({ length: 5 }, (_, i) => {
                  const player = activeGame.players.find(p => p.slot === i + 1);
                  const isMe = player?.user_id === user?.id;
                  return (
                    <div key={i} style={{
                      width: 54, height: 54, borderRadius: '50%',
                      background: player
                        ? isMe ? 'rgba(255,200,0,0.7)' : 'rgba(255,255,255,0.65)'
                        : 'rgba(255,255,255,0.65)',
                      backdropFilter: 'blur(10px)',
                      border: player && isMe ? '2px solid rgba(255,180,0,0.6)' : '1px solid rgba(255,255,255,0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: player ? 16 : 20, color: '#111',
                      boxShadow: player && isMe ? '0 4px 14px rgba(255,180,0,0.3)' : '0 4px 10px rgba(0,0,0,0.08)',
                      overflow: 'hidden',
                    }}>
                      {player?.profile?.avatar_url ? (
                        <img src={player.profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : player ? (
                        (player.profile?.username ?? '?').charAt(0).toUpperCase()
                      ) : '+'}
                    </div>
                  );
                })}
              </div>

              {/* Center content */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div style={{
                  fontSize: 22, fontWeight: 700, color: '#111',
                  textShadow: '0 1px 2px rgba(255,255,255,0.5)',
                }}>
                  Win €10
                </div>

                {isFull ? (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{
                      padding: '10px 24px', borderRadius: 999, background: 'rgba(0,0,0,0.7)',
                      color: '#fff', fontWeight: 600, fontSize: 13,
                    }}
                  >
                    Drawing...
                  </motion.div>
                ) : userInGame ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '10px 24px', borderRadius: 999,
                    background: 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: 13, color: '#333',
                  }}>
                    <Sparkles size={14} /> You're in!
                  </div>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => joinGame(activeGame.id)}
                    disabled={joining}
                    style={{
                      border: 'none', borderRadius: 999, background: '#000', color: '#fff',
                      padding: '14px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                      display: 'flex', alignItems: 'center', gap: 8,
                      opacity: joining ? 0.6 : 1,
                    }}
                  >
                    {joining ? <Loader size={16} className="animate-spin" /> : <Trophy size={16} />}
                    JOIN €1
                  </motion.button>
                )}

                <div style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>
                  {filledSlots} / 10 Players Joined
                </div>
              </div>

              {/* Bottom 5 avatars */}
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                {Array.from({ length: 5 }, (_, i) => {
                  const player = activeGame.players.find(p => p.slot === i + 6);
                  const isMe = player?.user_id === user?.id;
                  return (
                    <div key={i + 5} style={{
                      width: 54, height: 54, borderRadius: '50%',
                      background: player
                        ? isMe ? 'rgba(255,200,0,0.7)' : 'rgba(255,255,255,0.65)'
                        : 'rgba(255,255,255,0.65)',
                      backdropFilter: 'blur(10px)',
                      border: player && isMe ? '2px solid rgba(255,180,0,0.6)' : '1px solid rgba(255,255,255,0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: player ? 16 : 20, color: '#111',
                      boxShadow: player && isMe ? '0 4px 14px rgba(255,180,0,0.3)' : '0 4px 10px rgba(0,0,0,0.08)',
                      overflow: 'hidden',
                    }}>
                      {player?.profile?.avatar_url ? (
                        <img src={player.profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : player ? (
                        (player.profile?.username ?? '?').charAt(0).toUpperCase()
                      ) : '+'}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Fairness Meter Card */}
          {profile && (
            <div style={{
              width: 520, maxWidth: '100%', marginTop: 14, padding: 14, borderRadius: 16,
              background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(14px)',
              border: '1px solid rgba(255,255,255,0.35)',
              boxShadow: '0 8px 20px rgba(0,0,0,0.08)', boxSizing: 'border-box',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: 1 }}>Fairness Progress</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>
                  {profile.losses_since_last_win} / 9
                </span>
              </div>
              <div style={{ height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99,
                  background: 'rgba(0,0,0,0.7)',
                  width: `${(profile.losses_since_last_win / 9) * 100}%`,
                  transition: 'width 0.7s',
                }} />
              </div>
              <p style={{ fontSize: 9, color: '#999', marginTop: 6, margin: '6px 0 0' }}>
                {profile.losses_since_last_win >= 9
                  ? 'Your next game is guaranteed to win!'
                  : `Guaranteed win in ${9 - profile.losses_since_last_win} games`}
              </p>
            </div>
          )}

          {/* Timer card */}
          {activeGame && (
            <div style={{
              width: 520, maxWidth: '100%', marginTop: 8, padding: '8px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(14px)',
              border: '1px solid rgba(255,255,255,0.25)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)', boxSizing: 'border-box',
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#666',
            }}>
              <Clock size={12} />
              {(() => {
                const diff = new Date(activeGame.expires_at).getTime() - Date.now();
                if (diff <= 0) return 'Expired';
                const h = Math.floor(diff / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                return `${h}h ${m}m remaining`;
              })()}
            </div>
          )}

          {/* Fairness messaging */}
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <p style={{ fontSize: 9, color: '#999' }}>Every loss increases your winning power.</p>
            <p style={{ fontSize: 9, color: '#999' }}>Nobody can lose more than 9 consecutive games.</p>
          </div>
        </>
      )}
    </div>
  );
}
