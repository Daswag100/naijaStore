import { supabase, supabaseAdmin } from './supabase';
import type { Database } from './supabase';

// Type definitions
export type User = Database['public']['Tables']['users']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type CartItem = Database['public']['Tables']['cart_items']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];
export type UserAddress = Database['public']['Tables']['user_addresses']['Row'];

// Add these missing exports for backward compatibility
export const products = [];
export const generateId = () => Math.random().toString(36).substring(2);

export interface ProductWithCategory extends Product {
  category?: Category;
}

export interface CartItemWithProduct extends CartItem {
  product?: Product;
}

export interface OrderWithItems extends Order {
  order_items?: OrderItem[];
}

// User functions
export async function createUser(userData: {
  email: string;
  password_hash: string;
  name: string;
  phone?: string;
}) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert([userData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function findUserByEmail(email: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function findUserById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function updateUser(id: string, updates: Partial<User>) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Category functions
export async function getCategories() {
  console.log('🔍 Fetching categories from database...');
  
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) {
    console.error('❌ Database error fetching categories:', error);
    throw error;
  }
  
  console.log('✅ Categories fetched from DB:', data?.length || 0);
  return data;
}

export async function createCategory(categoryData: {
  name: string;
  slug: string;
  description: string;
  image_url: string;
}) {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .insert([categoryData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Product functions
export async function getProducts(options: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} = {}) {
  const {
    page = 1,
    limit = 20,
    category,
    search,
    minPrice,
    maxPrice,
    inStock,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = options;

  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories(*)
    `, { count: 'exact' })
    .eq('status', 'active');

  // Apply filters
  if (category) {
    query = query.eq('category_id', category);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (minPrice !== undefined) {
    query = query.gte('price', minPrice);
  }

  if (maxPrice !== undefined) {
    query = query.lte('price', maxPrice);
  }

  if (inStock) {
    query = query.gt('inventory_quantity', 0);
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    products: data,
    pagination: {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit),
    },
  };
}

export async function getProductById(id: string) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('id', id)
    .eq('status', 'active')
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createProduct(productData: {
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_price?: number;
  sku: string;
  inventory_quantity: number;
  category_id: string;
  images: string[];
}) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .insert([productData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProduct(id: string, updates: Partial<Product>) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Cart functions
export async function getCartItems(userId: string) {
  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      *,
      product:products(*)
    `)
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}

export async function addToCart(cartData: {
  user_id: string;
  product_id: string;
  quantity: number;
}) {
  // Check if item already exists
  const { data: existingItem } = await supabase
    .from('cart_items')
    .select('*')
    .eq('user_id', cartData.user_id)
    .eq('product_id', cartData.product_id)
    .single();

  if (existingItem) {
    // Update quantity
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity: existingItem.quantity + cartData.quantity })
      .eq('id', existingItem.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Insert new item
    const { data, error } = await supabase
      .from('cart_items')
      .insert([cartData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export async function updateCartItem(id: string, quantity: number) {
  if (quantity <= 0) {
    return removeCartItem(id);
  }

  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeCartItem(id: string) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function clearCart(userId: string) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
  return true;
}

// Order functions
export async function createOrder(orderData: {
  user_id: string;
  order_number: string;
  total_amount: number;
  shipping_cost: number;
  shipping_address: any;
  billing_address?: any;
  items: {
    product_id: string;
    quantity: number;
    price: number;
    product_name: string;
  }[];
}) {
  const { items, ...order } = orderData;

  // Create order
  const { data: newOrder, error: orderError } = await supabase
    .from('orders')
    .insert([order])
    .select()
    .single();

  if (orderError) throw orderError;

  // Create order items
  const orderItems = items.map(item => ({
    ...item,
    order_id: newOrder.id,
  }));

  const { data: newOrderItems, error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)
    .select();

  if (itemsError) throw itemsError;

  return { ...newOrder, order_items: newOrderItems };
}

export async function getOrders(userId: string, options: {
  page?: number;
  limit?: number;
} = {}) {
  const { page = 1, limit = 10 } = options;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(*)
    `, { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    orders: data,
    pagination: {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit),
    },
  };
}

export async function getOrderById(id: string, userId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(*)
    `)
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// Address functions
export async function getUserAddresses(userId: string) {
  const { data, error } = await supabase
    .from('user_addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createAddress(addressData: {
  user_id: string;
  address_line1: string;
  city: string;
  state: string;
  country?: string;
  is_default?: boolean;
}) {
  // If this is set as default, unset other defaults
  if (addressData.is_default) {
    await supabase
      .from('user_addresses')
      .update({ is_default: false })
      .eq('user_id', addressData.user_id);
  }

  const { data, error } = await supabase
    .from('user_addresses')
    .insert([addressData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAddress(id: string, updates: Partial<UserAddress>) {
  // If this is set as default, unset other defaults
  if (updates.is_default && updates.user_id) {
    await supabase
      .from('user_addresses')
      .update({ is_default: false })
      .eq('user_id', updates.user_id);
  }

  const { data, error } = await supabase
    .from('user_addresses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAddress(id: string) {
  const { error } = await supabase
    .from('user_addresses')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

// Utility functions
export function generateOrderNumber(): string {
  return 'NS' + Date.now().toString() + Math.random().toString(36).substring(2, 5).toUpperCase();
}

export function calculateShipping(state: string, weight: number = 1): {
  cost: number;
  estimatedDays: number;
} {
  const shippingZones = {
    'Lagos': { baseCost: 2000, perKg: 500, days: 1 },
    'FCT': { baseCost: 2000, perKg: 500, days: 1 },
    'Ogun': { baseCost: 3000, perKg: 700, days: 2 },
    'Oyo': { baseCost: 3000, perKg: 700, days: 2 },
    'Osun': { baseCost: 3000, perKg: 700, days: 2 },
    'Ondo': { baseCost: 3000, perKg: 700, days: 2 },
    'Ekiti': { baseCost: 3000, perKg: 700, days: 2 },
  };

  const zone = shippingZones[state as keyof typeof shippingZones] || { baseCost: 5000, perKg: 1000, days: 5 };
  
  return {
    cost: zone.baseCost + (zone.perKg * weight),
    estimatedDays: zone.days,
  };
}