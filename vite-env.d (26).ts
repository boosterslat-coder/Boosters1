import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function ensureProfile(currentUser: User) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .maybeSingle();

    if (existing) {
      setProfile(existing as Profile);
      return;
    }

    const fallbackUsername =
      (currentUser.user_metadata?.username as string | undefined) ||
      currentUser.email?.split('@')[0] ||
      'Member';

    const newProfile = {
      id: currentUser.id,
      username: fallbackUsername,
      avatar_url: '',
      balance: 0,
      fee_balance: 0,
      is_admin: false,
      losses_since_last_win: 0,
      total_wins: 0,
      total_losses: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: inserted } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select('*')
      .single();

    setProfile((inserted as Profile) || (newProfile as Profile));
  }

  async function refreshProfile() {
    if (!user) return;
    await ensureProfile(user);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await ensureProfile(session.user);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await ensureProfile(session.user);
        } else {
          setProfile(null);
        }

        setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signUp(email: string, password: string, username: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    return { error: error as Error | null };
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{ user, session, profile, loading, signUp, signIn, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
