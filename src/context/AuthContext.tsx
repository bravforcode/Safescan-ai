import {
  createContext, useContext, useEffect, useState, type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, safescanSelect, safescanUpdate, type Profile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, name: string) => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<Profile, 'display_name' | 'allergens' | 'dietary' | 'health_goals' | 'avatar_url'>>) => Promise<void>;
  addPoints: (amount: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    const data = await safescanSelect<Profile>('profiles', '*', { id: uid });
    setProfile(data?.[0] ?? null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return; // already fetched in getSession above
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } },
    });
    return error ? error.message : null;
  };

  const signInWithGoogle = async (): Promise<string | null> => {
    // skipBrowserRedirect lets us inspect errors before the browser navigates away
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        skipBrowserRedirect: true,
      },
    });
    if (error) return error.message;
    if (data?.url) { window.location.href = data.url; return null; }
    return 'ไม่สามารถเชื่อมต่อ Google ได้ กรุณาลองใหม่';
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateProfile = async (updates: Partial<Pick<Profile, 'display_name' | 'allergens' | 'dietary' | 'health_goals' | 'avatar_url'>>) => {
    if (!user || !profile) return;
    setProfile({ ...profile, ...updates });
    await safescanUpdate('profiles', { ...updates, updated_at: new Date().toISOString() }, { id: user.id });
  };

  const addPoints = async (amount: number) => {
    if (!user || !profile) return;
    const newPoints = (profile.points || 0) + amount;
    // Assuming calculateLevel exists in your gamification logic, we handle level upgrades there or here.
    // For now simply increment points, and level can be derived or explicitly set if threshold crossed.
    setProfile({ ...profile, points: newPoints });
    await safescanUpdate('profiles', { points: newPoints, updated_at: new Date().toISOString() }, { id: user.id });
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signInWithGoogle, signOut, updateProfile, addPoints }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
