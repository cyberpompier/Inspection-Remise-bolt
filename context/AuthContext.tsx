import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import type { UserProfile, UserProfileUpdate } from '../types';

interface AuthContextType {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  updateProfile: (updates: UserProfileUpdate) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChange handles initial session, sign in, and sign out.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setLoading(true); // Enter loading state whenever auth state changes.
        setSession(newSession);
        
        if (newSession?.user) {
          try {
            const { data, error, status } = await supabase
              .from('user_profile')
              .select('*')
              .eq('user_id', newSession.user.id)
              .single();
            
            if (error && status !== 406) throw error;
            setProfile(data);
          } catch (error) {
            console.error('Error fetching user profile:', error);
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
        
        // Exit loading state after all async work is done.
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const updateProfile = async (updates: UserProfileUpdate) => {
    if (!session?.user) throw new Error("Aucun utilisateur n'est connecté.");
    
    try {
      const { data, error } = await supabase
        .from('user_profile')
        .update(updates)
        .eq('user_id', session.user.id)
        .select()
        .single();
    
      if (error) throw error;

      setProfile(data as UserProfile);
    } catch (error) {
       console.error('Error updating profile:', error);
       throw error;
    }
  };

  const value = { session, profile, loading, updateProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
