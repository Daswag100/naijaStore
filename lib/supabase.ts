import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vyhzakusxrpylvdwbegz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5aHpha3VzeHJweWx2ZHdiZWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzU2NDcsImV4cCI6MjA2NjcxMTY0N30.OfMehgMAfhlVZiAKUlvQ-rbJESTbKhotMlFPp02UwHA';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5aHpha3VzeHJweWx2ZHdiZWd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTEzNTY0NywiZXhwIjoyMDY2NzExNjQ3fQ.6lpiCeeHHoXRel_zq_lKKn6MvbZ9emHj2oTUiXtfoLk';

// Client for browser/frontend use
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database types with guest support and cart enhancements
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string | null;
          name: string;
          phone: string | null;
          email_verified: boolean;
          is_guest: boolean;
          guest_session_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash?: string | null;
          name: string;
          phone?: string | null;
          email_verified?: boolean;
          is_guest?: boolean;
          guest_session_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string | null;
          name?: string;
          phone?: string | null;
          email_verified?: boolean;
          is_guest?: boolean;
          guest_session_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          image_url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description: string;
          image_url: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string;
          image_url?: string;
          created_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          price: number;
          compare_price: number | null;
          sku: string;
          inventory_quantity: number;
          category_id: string;
          images: string[];
          status: 'active' | 'draft' | 'archived';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description: string;
          price: number;
          compare_price?: number | null;
          sku: string;
          inventory_quantity: number;
          category_id: string;
          images: string[];
          status?: 'active' | 'draft' | 'archived';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string;
          price?: number;
          compare_price?: number | null;
          sku?: string;
          inventory_quantity?: number;
          category_id?: string;
          images?: string[];
          status?: 'active' | 'draft' | 'archived';
          created_at?: string;
          updated_at?: string;
        };
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          quantity: number;
          size: string | null;
          color: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          quantity: number;
          size?: string | null;
          color?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          quantity?: number;
          size?: string | null;
          color?: string | null;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          order_number: string;
          status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
          total_amount: number;
          shipping_cost: number;
          shipping_address: any;
          billing_address: any;
          payment_reference: string | null;
          payment_status: 'pending' | 'paid' | 'failed' | 'cancelled';
          is_guest_order: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          order_number: string;
          status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
          total_amount: number;
          shipping_cost: number;
          shipping_address: any;
          billing_address: any;
          payment_reference?: string | null;
          payment_status?: 'pending' | 'paid' | 'failed' | 'cancelled';
          is_guest_order?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          order_number?: string;
          status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
          total_amount?: number;
          shipping_cost?: number;
          shipping_address?: any;
          billing_address?: any;
          payment_reference?: string | null;
          payment_status?: 'pending' | 'paid' | 'failed' | 'cancelled';
          is_guest_order?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          price: number;
          product_name: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          quantity: number;
          price: number;
          product_name: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          quantity?: number;
          price?: number;
          product_name?: string;
        };
      };
      user_addresses: {
        Row: {
          id: string;
          user_id: string;
          address_line1: string;
          city: string;
          state: string;
          country: string;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          address_line1: string;
          city: string;
          state: string;
          country?: string;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          address_line1?: string;
          city?: string;
          state?: string;
          country?: string;
          is_default?: boolean;
          created_at?: string;
        };
      };
    };
  };
}