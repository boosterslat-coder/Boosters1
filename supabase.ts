import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import WaitingListPage from './pages/WaitingListPage';
import HomePage from './pages/HomePage';
import MatchPage from './pages/MatchPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import WalletPage from './pages/WalletPage';
import ProfilePage from './pages/ProfilePage';
import { Home, Clock, Wallet, User, Settings } from 'lucide-react';

type Tab = 'home' | 'history' | 'wallet' | 'profile' | 'settings';

function AppRouter() {
  const { user, profile, loading, signOut } = useAuth();
  const [appLocked, setAppLocked] = useState<boolean | null>(null);
  const [devBypass, setDevBypass] = useState(false);
  const [tab, setTab] = useState<Tab>('home');

  const isAdmin = profile?.is_admin ?? false;

  useEffect(() => {
    async function checkLock() {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'app_locked')
          .maybeSingle();
        setAppLocked(data?.value === 'true');
      } catch {
        // If DB call fails, default to locked (safe default)
        setAppLocked(true);
      }
    }
    checkLock();

    const ch = supabase
      .channel('app-settings')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_settings', filter: 'key=eq.app_locked' }, (payload) => {
        const newVal = (payload.new as { value: string }).value === 'true';
        setAppLocked(newVal);
        if (newVal) setDevBypass(false); // Re-lock if admin turns lock back on
      })
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, []);

  // Still loading app_locked setting — show waiting list as default, never a login form
  if (appLocked === null) {
    return <WaitingListPage onDevAccess={() => setDevBypass(true)} />;
  }

  // When app is locked and dev hasn't bypassed, always show WaitingListPage
  if (appLocked && !devBypass) {
    return <WaitingListPage onDevAccess={() => setDevBypass(true)} />;
  }

  // App is unlocked or dev bypassed: show login if no user
  if (!user) return <HomePage />;

  const tabs: { key: Tab; icon: typeof Home; label: string }[] = [
    { key: 'home', icon: Home, label: 'Home' },
    { key: 'history', icon: Clock, label: 'History' },
    { key: 'wallet', icon: Wallet, label: 'Wallet' },
    { key: 'profile', icon: User, label: 'Profile' },
    ...(isAdmin ? [{ key: 'settings' as Tab, icon: Settings, label: 'Admin' }] : []),
  ];

  return (
    <div className="min-h-screen relative pb-20">
      <div className="max-w-[320px] mx-auto px-4 py-6">
        {tab === 'home' && <MatchPage />}
        {tab === 'history' && <HistoryPage />}
        {tab === 'wallet' && <WalletPage />}
        {tab === 'profile' && <ProfilePage />}
        {tab === 'settings' && <DashboardPage />}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav">
        <div className="max-w-[320px] mx-auto flex items-center justify-around py-2">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                  active ? 'text-black' : 'text-black/30'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                <span className="text-[10px] font-semibold">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
