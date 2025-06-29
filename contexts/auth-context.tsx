"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { getUserAddresses, type UserAddress } from '@/lib/database';

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
} | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      // Get user profile from our users table
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
        return;
      }

      // Get user addresses
      const addresses = await getUserAddresses(supabaseUser.id);

      const user: User = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        phone: profile.phone,
        addresses: addresses || [],
      };

      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (data: { email: string; password: string; name: string; phone?: string }): Promise<boolean> => {
    try {
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
        return false;
      }

      if (authData.user && !authData.session) {
        // User created but needs email confirmation
        alert('Please check your email to confirm your account before logging in.');
        return true;
      }

      if (authData.user && authData.session) {
        // User created and logged in successfully
        // Create user profile in our users table
        const { error: profileError } = await supabase
          .from('users')
          .upsert([{
            id: authData.user.id,
            email: data.email,
            name: data.name,
            phone: data.phone || null,
            password_hash: '', // Not needed since we use Supabase Auth
            email_verified: true,
          }], {
            onConflict: 'id',
            ignoreDuplicates: false
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Don't return false here - auth worked, profile creation failed
        }
      }

      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!state.user) return;

    try {
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