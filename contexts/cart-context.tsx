"use client";

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { SessionManager } from '@/lib/session-manager';
import { getCartItems, addToCart, updateCartItem, removeCartItem, clearCart } from '@/lib/database';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
  product_id: string;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  isLoading: boolean;
  isGuestUser: boolean;
}

type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'UPDATE_ITEM'; payload: { id: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_GUEST_MODE'; payload: boolean };

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
  isLoading: false,
  isGuestUser: true,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_GUEST_MODE':
      return { ...state, isGuestUser: action.payload };

    case 'SET_CART': {
      const items = action.payload;
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
      return { ...state, items, total, itemCount, isLoading: false };
    }

    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(item => 
        item.product_id === action.payload.product_id && 
        item.size === action.payload.size && 
        item.color === action.payload.color
      );

      let newItems;
      if (existingItemIndex >= 0) {
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
      } else {
        newItems = [...state.items, action.payload];
      }

      const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return { ...state, items: newItems, total, itemCount };
    }

    case 'UPDATE_ITEM': {
      const newItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      ).filter(item => item.quantity > 0);

      const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return { ...state, items: newItems, total, itemCount };
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload);
      const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return { ...state, items: newItems, total, itemCount };
    }

    case 'CLEAR_CART':
      return { ...state, items: [], total: 0, itemCount: 0 };

    default:
      return state;
  }
}

const CartContext = createContext<{
  state: CartState;
  addItem: (item: Omit<CartItem, 'id' | 'quantity'> & { quantity?: number }) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
} | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { toast } = useToast();
  const sessionManager = SessionManager.getInstance();

  // Get user ID through API call (works for both guest and authenticated users)
  const getEffectiveUserId = async (): Promise<string> => {
    try {
      // Make API call to get/create user (guest or authenticated)
      const response = await fetch('/api/cart', {
        method: 'GET',
        headers: sessionManager.getApiHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'SET_GUEST_MODE', payload: data.isGuest || false });
        // The API call will have triggered user creation if needed
        // For now, we'll get the user ID from the middleware
      }
      
      // Return session ID as fallback
      return sessionManager.getSessionId();
    } catch (error) {
      console.error('Error getting user ID:', error);
      dispatch({ type: 'SET_GUEST_MODE', payload: true });
      return sessionManager.getSessionId();
    }
  };

  // Load cart on component mount and when needed
  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      console.log('🛒 Loading cart...');
      
      // Get cart through API (middleware will handle user creation)
      const response = await fetch('/api/cart', {
        method: 'GET',
        headers: sessionManager.getApiHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to load cart');
      }

      const data = await response.json();
      
      const cartItems: CartItem[] = data.items || [];
      dispatch({ type: 'SET_CART', payload: cartItems });
      dispatch({ type: 'SET_GUEST_MODE', payload: data.isGuest || false });
      
      console.log('✅ Cart loaded:', cartItems.length, 'items');
    } catch (error) {
      console.error('❌ Error loading cart:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      // Don't show error toast for cart loading - just log it
    }
  };

  const addItem = async (item: Omit<CartItem, 'id' | 'quantity'> & { quantity?: number }) => {
    try {
      console.log('➕ Adding item to cart:', item.name);

      // Optimistic update - show immediately in UI
      const newItem: CartItem = {
        ...item,
        id: `temp-${Date.now()}`,
        quantity: item.quantity || 1
      };

      dispatch({ type: 'ADD_ITEM', payload: newItem });

      // Show success in console (no toast for better UX)
      console.log('🎉 Item added to cart UI:', item.name);

      // Sync with database through API
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: sessionManager.getApiHeaders(),
        body: JSON.stringify({
          product_id: item.product_id,
          quantity: item.quantity || 1,
          size: item.size,
          color: item.color,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add item to cart');
      }

      // Refresh cart to get correct data from database
      await loadCart();

      console.log('✅ Item successfully synced with database');
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      
      // Revert optimistic update on error
      await loadCart();
      
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  const removeItem = async (id: string) => {
    const itemToRemove = state.items.find(item => item.id === id);
    
    try {
      // Optimistic update
      dispatch({ type: 'REMOVE_ITEM', payload: id });
      
      const response = await fetch(`/api/cart/${id}`, {
        method: 'DELETE',
        headers: sessionManager.getApiHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to remove item');
      }
      
      console.log('✅ Item removed from cart');
    } catch (error) {
      console.error('❌ Error removing from cart:', error);
      
      // Revert on error
      if (itemToRemove) {
        dispatch({ type: 'ADD_ITEM', payload: itemToRemove });
      }
      
      toast({
        title: "Error",
        description: "Failed to remove item from cart.",
        variant: "destructive",
      });
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(id);
      return;
    }

    const originalItem = state.items.find(item => item.id === id);
    
    try {
      // Optimistic update
      dispatch({ type: 'UPDATE_ITEM', payload: { id, quantity } });
      
      const response = await fetch(`/api/cart/${id}`, {
        method: 'PUT',
        headers: sessionManager.getApiHeaders(),
        body: JSON.stringify({ quantity }),
      });

      if (!response.ok) {
        throw new Error('Failed to update quantity');
      }
    } catch (error) {
      console.error('❌ Error updating cart:', error);
      
      // Revert on error
      if (originalItem) {
        dispatch({ type: 'UPDATE_ITEM', payload: { id, quantity: originalItem.quantity } });
      }
      
      toast({
        title: "Error",
        description: "Failed to update cart item.",
        variant: "destructive",
      });
    }
  };

  const clearCartHandler = async () => {
    const originalItems = [...state.items];

    try {
      // Optimistic update
      dispatch({ type: 'CLEAR_CART' });
      
      // Clear through API
      const userId = await getEffectiveUserId();
      await clearCart(userId);
      
      console.log('✅ Cart cleared');
    } catch (error) {
      console.error('❌ Error clearing cart:', error);
      
      // Revert on error
      dispatch({ type: 'SET_CART', payload: originalItems });
    }
  };

  return (
    <CartContext.Provider value={{ 
      state, 
      addItem, 
      removeItem, 
      updateQuantity, 
      clearCart: clearCartHandler,
      refreshCart: loadCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}