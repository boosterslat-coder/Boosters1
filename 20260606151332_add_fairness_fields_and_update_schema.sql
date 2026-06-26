import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Loader, AlertCircle, Code2 } from 'lucide-react';

type Mode = 'login' | 'signup' | 'dev';

export default function HomePage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [devKey, setDevKey] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'dev') {
      if (devKey === 'cc10-dev-2024') {
        const { error } = await signIn('dev@10eurobanknote.local', 'dev-preview-2024');
        if (error) {
          await signUp('dev@10eurobanknote.local', 'dev-preview-2024', 'Developer');
          await signIn('dev@10eurobanknote.local', 'dev-preview-2024');
        }
      } else {
        setError('Invalid developer key.');
        setLoading(false);
        return;
      }
    } else if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
    } else {
      if (username.trim().length < 3) {
        setError('Username must be at least 3 characters.');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, username.trim());
      if (error) setError(error.message);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      {/* Logo */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-black tracking-tight mb-1">
          10euro<span className="text-black/30">banknote</span>
        </h1>
        <p className="text-[11px] text-black/30">The fair community challenge</p>
      </div>

      {/* Mode toggles */}
      {mode !== 'dev' && (
        <div className="flex gap-1 glass-card p-1 mb-6">
          <button
            onClick={() => { setMode('signup'); setError(''); }}
            className={`text-[11px] font-semibold px-4 py-2 rounded-[8px] transition ${
              mode === 'signup' ? 'bg-black text-white' : 'text-black/30'
            }`}
          >
            Sign Up
          </button>
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className={`text-[11px] font-semibold px-4 py-2 rounded-[8px] transition ${
              mode === 'login' ? 'bg-black text-white' : 'text-black/30'
            }`}
          >
            Log In
          </button>
        </div>
      )}

      {/* Form */}
      <div className="glass-card p-5 w-full max-w-[280px]">
        <h2 className="text-[14px] font-semibold text-black mb-1 text-center">
          {mode === 'dev' ? 'Developer Preview' : mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-[10px] text-black/30 text-center mb-4">
          {mode === 'dev' ? 'Preview the app' : mode === 'login' ? 'Sign in to play' : 'Join 10eurobanknote'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'dev' && (
            <input
              type="password"
              value={devKey}
              onChange={e => setDevKey(e.target.value)}
              placeholder="Developer key"
              className="w-full px-3 py-2.5 glass-input text-[11px] text-black placeholder-black/25"
              required
            />
          )}
          {mode === 'signup' && (
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full px-3 py-2.5 glass-input text-[11px] text-black placeholder-black/25"
              required
            />
          )}
          {mode !== 'dev' && (
            <>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-3 py-2.5 glass-input text-[11px] text-black placeholder-black/25"
                required
              />
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-3 py-2.5 pr-9 glass-input text-[11px] text-black placeholder-black/25"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black/20 hover:text-black/40"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </>
          )}

          {error && (
            <div className="flex items-center gap-1.5 text-red-500 text-[10px]">
              <AlertCircle size={10} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {loading && <Loader size={12} className="animate-spin" />}
            {mode === 'dev' ? 'Enter Preview' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {mode !== 'dev' && (
          <>
            <p className="text-center text-[10px] text-black/25 mt-3">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
                className="text-black font-semibold hover:underline"
              >
                {mode === 'login' ? 'Sign up' : 'Log in'}
              </button>
            </p>
            <button
              onClick={() => { setMode('dev'); setError(''); }}
              className="block w-full text-center text-[9px] text-black/15 hover:text-black/30 transition mt-2 pt-2 border-t border-black/[0.04]"
            >
              Dev mode
            </button>
          </>
        )}
      </div>
    </div>
  );
}
