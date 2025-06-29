"use client";

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from './auth-context';
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
}

type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'UPDATE_ITEM'; payload: { id: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_CART' };

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
  isLoading: false,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_CART': {
      const items = action.payload;
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
      return { items, total, itemCount, isLoading: false };
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
  addItem: (item: Omit<CartItem, 'id' | 'quantity'> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  refreshCart: () => void;
} | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  // Load cart when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      loadCart();
    } else {
      dispatch({ type: 'CLEAR_CART' });
    }
  }, [isAuthenticated, user]);

  const loadCart = async () => {
    if (!user) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const cartData = await getCartItems(user.id);
      
      const cartItems: CartItem[] = cartData.map(item => ({
        id: item.id,
        product_id: item.product_id,
        name: item.product?.name || 'Unknown Product',
        price: item.product?.price || 0,
        image: item.product?.images?.[0] || '',
        quantity: item.quantity,
      }));

      dispatch({ type: 'SET_CART', payload: cartItems });
    } catch (error) {
      console.error('Error loading cart:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addItem = async (item: Omit<CartItem, 'id' | 'quantity'> & { quantity?: number }) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to cart.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addToCart({
        user_id: user.id,
        product_id: item.product_id,
        quantity: item.quantity || 1,
      });

      dispatch({ 
        type: 'ADD_ITEM', 
        payload: { 
          ...item, 
          id: `temp-${Date.now()}`, // Temporary ID, will be replaced on refresh
          quantity: item.quantity || 1 
        } 
      });

      toast({
        title: "Added to cart",
        description: `${item.name} has been added to your cart.`,
      });

      // Refresh cart to get correct IDs
      loadCart();
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart.",
        variant: "destructive",
      });
    }
  };

  const removeItem = async (id: string) => {
    try {
      await removeCartItem(id);
      dispatch({ type: 'REMOVE_ITEM', payload: id });
      
      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart.",
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast({
        title: "Error",
        description: "Failed to remove item from cart.",
        variant: "destructive",
      });
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        await removeItem(id);
        return;
      }

      await updateCartItem(id, quantity);
      dispatch({ type: 'UPDATE_ITEM', payload: { id, quantity } });
    } catch (error) {
      console.error('Error updating cart:', error);
      toast({
        title: "Error",
        description: "Failed to update cart item.",
        variant: "destructive",
      });
    }
  };

  const clearCartHandler = async () => {
    if (!user) return;

    try {
      await clearCart(user.id);
      dispatch({ type: 'CLEAR_CART' });
    } catch (error) {
      console.error('Error clearing cart:', error);
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