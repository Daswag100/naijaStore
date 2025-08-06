"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { getUserAddresses, type UserAddress } from '@/lib/database';
import { SessionManager } from '@/lib/session-manager'; // Import SessionManager

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  addresses: UserAddress[];
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<{
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: { email: string; password: string; name: string; phone?: string }) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  addAddress: (address: Omit<UserAddress, 'id' | 'user_id' | 'created_at'>) => void;
  updateAddress: (id: string, address: Partial<UserAddress>) => void;
  deleteAddress: (id: string) => void;
  refreshUser: () => Promise<void>;
} | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Force re-render counter for components using useAuth
  const [renderKey, setRenderKey] = useState(0);

  // Get SessionManager instance
  const [sessionManager, setSessionManager] = useState<SessionManager | null>(null);

  useEffect(() => {
    // Initialize SessionManager on client side
    if (typeof window !== 'undefined') {
      setSessionManager(SessionManager.getInstance());
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing auth state...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          if (mounted) {
            setState({
              user: null,
              isLoading: false,
              isAuthenticated: false,
            });
          }
          return;
        }

        console.log('📍 Session check result:', session?.user?.email || 'No session');

        if (session?.user && mounted) {
          console.log('✅ Found existing session, loading user profile...');
          await loadUserProfile(session.user);
        } else if (mounted) {
          console.log('❌ No existing session found');
          setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
          });
          setRenderKey(prev => prev + 1);
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
        if (mounted) {
          setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      }
    };

    // Initialize immediately - no delay needed
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email || 'No session');
      
      if (!mounted) return;

      if (event === 'SIGNED_OUT' || !session?.user) {
        console.log('👤 User signed out or session lost');
        // FIXED: Clear SessionManager on logout
        if (sessionManager) {
          sessionManager.clearSession();
        }
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
        setRenderKey(prev => prev + 1);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        console.log('✅ User signed in or token refreshed');
        if (session?.user) {
          await loadUserProfile(session.user);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [sessionManager]);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    console.log('✅ Loading user profile for:', supabaseUser.email);
    
    try {
      // FIXED: Upgrade SessionManager to real user FIRST
      if (sessionManager) {
        console.log('🔄 Upgrading SessionManager to real user:', supabaseUser.id);
        sessionManager.upgradeToRealUser(supabaseUser.id);
      }

      // Create basic user first from Supabase auth data
      const basicUser: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
        phone: supabaseUser.user_metadata?.phone || '',
        addresses: [],
      };

      // Set user immediately with basic data to prevent logout
      console.log('⚡ Setting user immediately:', basicUser.email);
      setState({
        user: basicUser,
        isLoading: false,
        isAuthenticated: true,
      });
      setRenderKey(prev => prev + 1);

      // Try to get enhanced profile data, but don't fail if it doesn't work
      try {
        // First, ensure user exists in our users table
        const { data: existingProfile, error: selectError } = await supabase
          .from('users')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();

        let profile = existingProfile;

        // If user doesn't exist in our table, create them
        if (selectError && selectError.code === 'PGRST116') {
          console.log('Creating user profile in database...');
          const { data: newProfile, error: insertError } = await supabase
            .from('users')
            .insert([{
              id: supabaseUser.id,
              email: supabaseUser.email || '',
              name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
              phone: supabaseUser.user_metadata?.phone || null,
              email_verified: true,
              is_guest: false, // FIXED: Ensure this is set to false for real users
            }])
            .select()
            .single();

          if (insertError) {
            console.error('Error creating user profile:', insertError);
            // Don't fail - use basic user data
          } else {
            profile = newProfile;
          }
        } else if (selectError) {
          console.error('Error fetching user profile:', selectError);
          // Don't fail - use basic user data
        }

        // Get user addresses (optional enhancement)
        let addresses: UserAddress[] = [];
        try {
          addresses = await getUserAddresses(supabaseUser.id) || [];
        } catch (error) {
          console.error('Error loading addresses:', error);
          // Don't fail - just use empty addresses
        }

        // Update user with enhanced data if available
        const enhancedUser: User = {
          id: supabaseUser.id,
          email: profile?.email || supabaseUser.email || '',
          name: profile?.name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
          phone: profile?.phone || supabaseUser.user_metadata?.phone || '',
          addresses,
        };

        setState({
          user: enhancedUser,
          isLoading: false,
          isAuthenticated: true,
        });
        setRenderKey(prev => prev + 1);

        console.log('✅ User profile loaded successfully');

      } catch (enhancementError) {
        console.error('Error enhancing user profile:', enhancementError);
        // Keep the basic user - don't logout due to enhancement failures
      }

    } catch (error) {
      console.error('Critical error loading user profile:', error);
      // Only logout if there's a critical error with basic auth
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await loadUserProfile(session.user);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 Attempting login for:', email);
      setState(prev => ({ ...prev, isLoading: true }));
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Login error:', error.message);
        setState(prev => ({ ...prev, isLoading: false }));
        return false;
      }

      if (!data.user || !data.session) {
        console.error('❌ Login failed: No user or session returned');
        setState(prev => ({ ...prev, isLoading: false }));
        return false;
      }

      console.log('✅ Login successful for:', email, '- User ID:', data.user.id);
      // The auth state change handler will update the state with user data
      return true;
    } catch (error) {
      console.error('❌ Login error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  const register = async (data: { email: string; password: string; name: string; phone?: string }): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            phone: data.phone || null,
          }
        }
      });

      if (authError) {
        console.error('Registration error:', authError);
        setState(prev => ({ ...prev, isLoading: false }));
        return false;
      }

      if (authData.user && !authData.session) {
        // User created but needs email confirmation
        setState(prev => ({ ...prev, isLoading: false }));
        alert('Please check your email to confirm your account before logging in.');
        return true;
      }

      console.log('✅ Registration successful for:', data.email);
      // Don't set loading to false here - let the auth state change handler do it
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  const logout = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // FIXED: Clear SessionManager first
      if (sessionManager) {
        console.log('🔄 Clearing SessionManager on logout');
        sessionManager.clearSession();
      }
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
      }
      
      console.log('✅ Logout successful');
      // The auth state change handler will update the state
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if there's an error
      if (sessionManager) {
        sessionManager.clearSession();
      }
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!state.user) return;

    try {
      // Update in Supabase auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          name: data.name,
          phone: data.phone,
        }
      });

      if (authError) {
        console.error('Auth profile update error:', authError);
      }

      // Update in our users table
      const { error } = await supabase
        .from('users')
        .update({
          name: data.name,
          phone: data.phone,
        })
        .eq('id', state.user.id);

      if (error) {
        console.error('Profile update error:', error);
        return;
      }

      setState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...data } : null,
      }));

      console.log('✅ Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
    }
  };

  const addAddress = async (address: Omit<UserAddress, 'id' | 'user_id' | 'created_at'>) => {
    if (!state.user) return;

    try {
      const { data: newAddress, error } = await supabase
        .from('user_addresses')
        .insert([{
          ...address,
          user_id: state.user.id,
        }])
        .select()
        .single();

      if (error) {
        console.error('Address creation error:', error);
        return;
      }

      setState(prev => ({
        ...prev,
        user: prev.user ? {
          ...prev.user,
          addresses: [...prev.user.addresses, newAddress],
        } : null,
      }));

      console.log('✅ Address added successfully');
    } catch (error) {
      console.error('Address creation error:', error);
    }
  };

  const updateAddress = async (id: string, addressData: Partial<UserAddress>) => {
    if (!state.user) return;

    try {
      const { error } = await supabase
        .from('user_addresses')
        .update(addressData)
        .eq('id', id);

      if (error) {
        console.error('Address update error:', error);
        return;
      }

      setState(prev => ({
        ...prev,
        user: prev.user ? {
          ...prev.user,
          addresses: prev.user.addresses.map(addr =>
            addr.id === id ? { ...addr, ...addressData } : addr
          ),
        } : null,
      }));

      console.log('✅ Address updated successfully');
    } catch (error) {
      console.error('Address update error:', error);
    }
  };

  const deleteAddress = async (id: string) => {
    if (!state.user) return;

    try {
      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Address deletion error:', error);
        return;
      }

      setState(prev => ({
        ...prev,
        user: prev.user ? {
          ...prev.user,
          addresses: prev.user.addresses.filter(addr => addr.id !== id),
        } : null,
      }));

      console.log('✅ Address deleted successfully');
    } catch (error) {
      console.error('Address deletion error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      register,
      logout,
      updateProfile,
      addAddress,
      updateAddress,
      deleteAddress,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Auth guard component for protecting pages
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Please sign in</h2>
          <p className="text-gray-600">You need to be logged in to view this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}