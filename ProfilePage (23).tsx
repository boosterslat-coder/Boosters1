import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import WaitingListPage from './pages/WaitingListPage';
import HomePage from './pages/HomePage';
import BPage from './pages/BPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import WalletPage from './pages/WalletPage';
import ProfilePage from './pages/ProfilePage';
import MailPage from './pages/MailPage';
import SafePage from './pages/SafePage';
import { Home, Clock, Wallet, User, Settings, Mail, Shield, Ticket } from 'lucide-react';

type Tab = 'home' | 'b' | 'history' | 'wallet' | 'mail' | 'safe' | 'profile' | 'settings';

function AppRouter() {
  const { user, profile } = useAuth();
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
        setAppLocked(true);
      }
    }

    checkLock();

    const ch = supabase
      .channel('app-settings')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_settings', filter: 'key=eq.app_locked' },
        (payload) => {
          const newVal = (payload.new as { value: string }).value === 'true';
          setAppLocked(newVal);
          if (newVal) setDevBypass(false);
        }
      )
      .subscribe();

    return () => {
      ch.unsubscribe();
    };
  }, []);

  if ((appLocked && !devBypass) || !user) {
    return <WaitingListPage onDevAccess={() => setDevBypass(true)} />;
  }

  const tabs: { key: Tab; icon: any; label: string }[] = [
    { key: 'home', icon: Home, label: 'Home' },
    { key: 'b', icon: Ticket, label: 'B' },
    { key: 'history', icon: Clock, label: 'History' },
    { key: 'wallet', icon: Wallet, label: 'Wallet' },
    { key: 'mail', icon: Mail, label: 'Mail' },
    { key: 'safe', icon: Shield, label: 'Safe' },
    { key: 'profile', icon: User, label: 'Profile' },
    ...(isAdmin ? [{ key: 'settings' as Tab, icon: Settings, label: 'Admin' }] : []),
  ];

  return (
    <div className="app-screen">
      <div className="app-shell">
        <main className="app-content">
          {tab === 'home' && <HomePage onOpenB={() => setTab('b')} />}
          {tab === 'b' && <BPage />}
          {tab === 'history' && <HistoryPage />}
          {tab === 'wallet' && <WalletPage />}
          {tab === 'mail' && <MailPage />}
          {tab === 'safe' && <SafePage />}
          {tab === 'profile' && <ProfilePage />}
          {tab === 'settings' && <DashboardPage />}
        </main>

        <nav className="app-bottom-nav">
          <div className="app-bottom-nav-inner">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;

              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`app-tab-button ${active ? 'is-active' : ''}`}
                >
                  <Icon size={22} strokeWidth={active ? 2.6 : 1.9} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
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
