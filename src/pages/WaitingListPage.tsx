import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader, CheckCircle, Code2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function WaitingListPage({ onDevAccess }: { onDevAccess?: () => void }) {
  const { signIn, signUp } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [waitCount, setWaitCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Dev access state
  const [showDevModal, setShowDevModal] = useState(false);
  const [devKey, setDevKey] = useState('');
  const [devLoading, setDevLoading] = useState(false);
  const [devError, setDevError] = useState('');

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchCount() {
    const { count } = await supabase
      .from('waiting_list')
      .select('*', { count: 'exact', head: true });
    if (count !== null) setWaitCount(count);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setError('');

    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);

    // Add to waiting list
    await supabase
      .from('waiting_list')
      .insert({ email: form.email.toLowerCase().trim() });

    // Also create account so they're ready when unlocked
    const { error: signUpErr } = await signUp(form.email, form.password, form.name || form.email.split('@')[0]);
    if (signUpErr && !signUpErr.message.includes('already registered')) {
      setError(signUpErr.message);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setSubmitted(true);
    setWaitCount(c => c + 1);
  }

  async function handleDevLogin(e: React.FormEvent) {
    e.preventDefault();
    setDevError('');
    setDevLoading(true);

    if (devKey !== 'cc10-dev-2024') {
      setDevError('Invalid developer key.');
      setDevLoading(false);
      return;
    }

    const { error } = await signIn('dev@10eurobanknote.local', 'dev-preview-2024');
    if (error) {
      await signUp('dev@10eurobanknote.local', 'dev-preview-2024', 'Developer');
      await signIn('dev@10eurobanknote.local', 'dev-preview-2024');
    }
    setDevLoading(false);
    onDevAccess?.();
  }

  const participants = Array.from({ length: 10 });

  return (
    <div style={styles.page}>
      {/* Dev Preview button */}
      <button
        onClick={() => setShowDevModal(true)}
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 14px',
          borderRadius: 999,
          background: '#000',
          color: '#fff',
          border: 'none',
          fontSize: 11,
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        <Code2 size={12} /> Dev Preview
      </button>

      <div style={styles.counter}>
        {waitCount.toLocaleString()} people joined the waiting list
      </div>

      <div style={styles.content}>
        {/* Lottery Ticket */}
        <div style={styles.ticket}>
          <img
            src="https://i.ibb.co/sc9p4fr/10e.jpg"
            alt="banknote"
            style={styles.ticketImage}
          />

          <div style={styles.overlay}>
            {/* Top avatars */}
            <div style={styles.avatarRow}>
              {participants.slice(0, 5).map((_, i) => (
                <div key={i} style={styles.avatar}>+</div>
              ))}
            </div>

            {/* Center content */}
            <div style={styles.centerContent}>
              <div style={styles.prize}>Win €10</div>
              <button style={styles.joinButton} onClick={() => !submitted && handleSubmit()}>
                JOIN
              </button>
              <div style={styles.players}>0 / 10 Players Joined</div>
            </div>

            {/* Bottom avatars */}
            <div style={styles.avatarRow}>
              {participants.slice(5).map((_, i) => (
                <div key={i} style={styles.avatar}>+</div>
              ))}
            </div>
          </div>
        </div>

        {/* Form Card */}
        {!submitted ? (
          <form onSubmit={handleSubmit} style={styles.formCard}>
            <p style={styles.subtitle}>Join the waiting list</p>

            <input
              name="name"
              placeholder="Name"
              value={form.name}
              onChange={handleChange}
              style={styles.input}
            />

            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              style={styles.input}
              required
            />

            <input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              style={styles.input}
              required
              minLength={6}
            />

            {error && (
              <p style={{ color: '#dc2626', fontSize: 11, margin: 0 }}>{error}</p>
            )}

            <button type="submit" disabled={submitting} style={styles.formButton}>
              {submitting ? <Loader size={14} className="animate-spin" style={{ display: 'inline' }} /> : 'Join Waiting List'}
            </button>
          </form>
        ) : (
          <div style={styles.formCard}>
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <CheckCircle size={28} style={{ margin: '0 auto 8px', color: '#16a34a' }} />
              <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>You're on the list!</p>
              <p style={{ fontSize: 11, color: '#666', margin: 0 }}>We'll notify you when the app launches.</p>
            </div>
          </div>
        )}

        {/* Story */}
        <div style={styles.storyContainer}>
          <p>
            I spent a lot of time thinking about how to help people earn money
            so they don't have to struggle and can have enough for food and
            other basic needs.
          </p>

          <p>
            So I created a simple community challenge where 10 people join and
            one player wins €10.
          </p>

          <p>
            Every time you don't win, your chances increase. If luck doesn't
            find you first, your 10th game becomes guaranteed.
          </p>

          <p>
            Our goal is simple: create a fair system where nobody can lose
            forever and everyone gets a chance to receive support.
          </p>
        </div>

        <img
          src="https://i.ibb.co/kgcKV6pp/head1.png"
          alt="10euro.one"
          style={styles.bottomImage}
        />
      </div>

      {/* Dev Preview Modal */}
      {showDevModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, boxSizing: 'border-box',
        }}>
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(4px)' }}
            onClick={() => { setShowDevModal(false); setDevKey(''); setDevError(''); }}
          />
          <div style={{
            position: 'relative', width: '100%', maxWidth: 280, padding: 20,
            borderRadius: 16, background: 'rgba(255,255,255,0.25)',
            backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.35)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', background: '#000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Code2 size={12} style={{ color: '#fff' }} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Developer Preview</p>
            </div>

            <form onSubmit={handleDevLogin} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="password"
                value={devKey}
                onChange={e => setDevKey(e.target.value)}
                placeholder="Developer key"
                style={styles.input}
                required
                autoFocus
              />
              {devError && <p style={{ color: '#dc2626', fontSize: 10, margin: 0 }}>{devError}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => { setShowDevModal(false); setDevKey(''); setDevError(''); }}
                  style={{ ...styles.formButton, background: 'rgba(255,255,255,0.45)', color: '#333', flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={devLoading}
                  style={{ ...styles.formButton, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                >
                  {devLoading ? <Loader size={12} className="animate-spin" /> : <Code2 size={12} />}
                  Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 20,
    boxSizing: 'border-box',
    background: 'linear-gradient(135deg, #ffffff, #f2f2f2)',
    fontFamily: 'Arial, sans-serif',
  },

  counter: {
    fontSize: 13,
    fontWeight: 600,
    padding: '8px 16px',
    borderRadius: 999,
    background: 'rgba(0,0,0,0.85)',
    color: '#fff',
    marginBottom: 20,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },

  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },

  ticket: {
    width: 520,
    height: 280,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
    maxWidth: '100%',
  },

  ticketImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: 24,
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(3px)',
  },

  avatarRow: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
  },

  avatar: {
    width: 54,
    height: 54,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.65)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 20,
    color: '#111',
    boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
  },

  centerContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },

  prize: {
    fontSize: 26,
    fontWeight: 700,
    color: '#111',
    textShadow: '0 1px 2px rgba(255,255,255,0.5)',
  },

  joinButton: {
    border: 'none',
    borderRadius: 999,
    background: '#000',
    color: '#fff',
    padding: '14px 28px',
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
    boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
  },

  players: {
    fontSize: 12,
    fontWeight: 600,
    color: '#111',
  },

  formCard: {
    width: 520,
    maxWidth: '100%',
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
    background: 'rgba(255,255,255,0.25)',
    backdropFilter: 'blur(14px)',
    border: '1px solid rgba(255,255,255,0.35)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    boxSizing: 'border-box',
    boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
  },

  subtitle: {
    textAlign: 'center',
    margin: 0,
    fontSize: 13,
    fontWeight: 600,
  },

  input: {
    width: '100%',
    padding: 10,
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'rgba(255,255,255,0.45)',
    outline: 'none',
    boxSizing: 'border-box',
    fontSize: 13,
  },

  formButton: {
    padding: 12,
    borderRadius: 10,
    border: 'none',
    background: '#000',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
  },

  storyContainer: {
    width: 520,
    maxWidth: '100%',
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
    background: 'rgba(255,255,255,0.25)',
    backdropFilter: 'blur(14px)',
    border: '1px solid rgba(255,255,255,0.35)',
    fontSize: 12,
    lineHeight: 1.7,
    color: '#222',
    boxSizing: 'border-box',
    boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
  },

  bottomImage: {
    width: 300,
    marginTop: 24,
    height: 'auto',
    objectFit: 'contain',
  },
};
