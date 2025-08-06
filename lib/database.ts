// lib/database.ts - Replace your existing functions with these optimized versions
import { supabase, supabaseAdmin } from './supabase';
import type { Database } from './supabase';

// Enhanced Type definitions with guest support
export type User = Database['public']['Tables']['users']['Row'] & {
  is_guest?: boolean;
  guest_session_id?: string;
};

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

// Enhanced User functions with guest support (keep existing - these are fine)
export async function createUser(userData: {
  email: string;
  password_hash: string;
  name: string;
  phone?: string;
  is_guest?: boolean;
  guest_session_id?: string;
}) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert([{
      ...userData,
      is_guest: userData.is_guest || false,
      guest_session_id: userData.guest_session_id || null,
    }])
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

export async function findGuestBySessionId(sessionId: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('guest_session_id', sessionId)
    .eq('is_guest', true)
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

// OPTIMIZED Category functions using supabaseAdmin
export async function getCategories() {
  try {
    console.log('🔍 Fetching categories from database...');
    const startTime = Date.now();
    
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('name');

    const endTime = Date.now();
    console.log(`⏱️ Categories query completed in ${endTime - startTime}ms`);

    if (error) {
      console.error('❌ Database error fetching categories:', error);
      return []; // Return empty array instead of throwing
    }
    
    console.log('✅ Categories fetched from DB:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('❌ Error in getCategories:', error);
    return []; // Return empty array instead of throwing
  }
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

// OPTIMIZED Product functions using supabaseAdmin
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

  try {
    console.log('🔍 Fetching products with options:', options);
    const startTime = Date.now();

    // Use supabaseAdmin for better performance
    let query = supabaseAdmin
      .from('products')
      .select(`
        id,
        name,
        slug,
        description,
        price,
        compare_price,
        images,
        status,
        inventory_quantity,
        category_id,
        created_at,
        updated_at,
        category:categories(
          id,
          name,
          slug,
          description
        )
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

    console.log('📊 Executing products query...');
    const { data, error, count } = await query;
    
    const endTime = Date.now();
    console.log(`⏱️ Products query completed in ${endTime - startTime}ms`);

    if (error) {
      console.error('❌ Products query error:', error);
      // Return empty result instead of throwing to prevent app crashes
      return {
        products: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0,
        },
      };
    }

    console.log('✅ Products fetched successfully:', {
      count: data?.length || 0,
      total: count,
      page,
      limit
    });

    return {
      products: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    };
  } catch (error) {
    console.error('❌ Error in getProducts:', error);
    
    // Return empty result instead of throwing to prevent app crashes
    return {
      products: [],
      pagination: {
        page,
        limit,
        total: 0,
        pages: 0,
      },
    };
  }
}

export async function getProductById(id: string) {
  try {
    console.log('🔍 Fetching product by ID:', id);
    const startTime = Date.now();
    
    const { data, error } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('id', id)
      .eq('status', 'active')
      .single();

    const endTime = Date.now();
    console.log(`⏱️ Product by ID query completed in ${endTime - startTime}ms`);

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Product by ID query error:', error);
      return null;
    }
    
    console.log('✅ Product fetched by ID:', data?.name || 'Not found');
    return data;
  } catch (error) {
    console.error('❌ Error in getProductById:', error);
    return null;
  }
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

// OPTIMIZED Cart functions using supabaseAdmin
export async function getCartItems(userId: string) {
  try {
    console.log('🛒 Fetching cart items for user:', userId);
    const startTime = Date.now();
    
    const { data, error } = await supabaseAdmin
      .from('cart_items')
      .select(`
        *,
        product:products(*)
      `)
      .eq('user_id', userId);

    const endTime = Date.now();
    console.log(`⏱️ Cart items query completed in ${endTime - startTime}ms`);

    if (error) {
      console.error('❌ Error fetching cart items:', error);
      return [];
    }

    console.log('✅ Cart items fetched:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('❌ Cart fetch error:', error);
    return [];
  }
}

export async function addToCart(cartData: {
  user_id: string;
  product_id: string;
  quantity: number;
  size?: string;
  color?: string;
}) {
  try {
    console.log('➕ Adding to cart:', { 
      userId: cartData.user_id, 
      productId: cartData.product_id, 
      quantity: cartData.quantity 
    });

    // Check if item already exists with same attributes
    const { data: existingItem } = await supabaseAdmin
      .from('cart_items')
      .select('*')
      .eq('user_id', cartData.user_id)
      .eq('product_id', cartData.product_id)
      .eq('size', cartData.size || '')
      .eq('color', cartData.color || '')
      .single();

    if (existingItem) {
      // Update quantity
      console.log('🔄 Updating existing cart item quantity');
      const { data, error } = await supabaseAdmin
        .from('cart_items')
        .update({ 
          quantity: existingItem.quantity + cartData.quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Cart item quantity updated');
      return data;
    } else {
      // Insert new item
      console.log('🆕 Creating new cart item');
      const { data, error } = await supabaseAdmin
        .from('cart_items')
        .insert([{
          ...cartData,
          size: cartData.size || '',
          color: cartData.color || '',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      console.log('✅ New cart item created');
      return data;
    }
  } catch (error) {
    console.error('❌ Error adding to cart:', error);
    throw error;
  }
}

export async function updateCartItem(id: string, quantity: number) {
  if (quantity <= 0) {
    return removeCartItem(id);
  }

  try {
    console.log('📝 Updating cart item:', { id, quantity });
    
    const { data, error } = await supabaseAdmin
      .from('cart_items')
      .update({ 
        quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    console.log('✅ Cart item updated');
    return data;
  } catch (error) {
    console.error('❌ Error updating cart item:', error);
    throw error;
  }
}

export async function removeCartItem(id: string) {
  try {
    console.log('🗑️ Removing cart item:', id);
    
    const { error } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
    console.log('✅ Cart item removed');
    return true;
  } catch (error) {
    console.error('❌ Error removing cart item:', error);
    throw error;
  }
}

export async function clearCart(userId: string) {
  try {
    console.log('🧹 Clearing cart for user:', userId);
    
    const { error } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    console.log('✅ Cart cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing cart:', error);
    throw error;
  }
}

// OPTIMIZED Order functions using supabaseAdmin
export async function createOrder(orderData: {
  user_id: string;
  order_number: string;
  total_amount: number;
  shipping_cost: number;
  discount_amount?: number;
  shipping_address: any;
  billing_address?: any;
  payment_reference?: string;
  payment_status?: string;
  is_guest_order?: boolean;
  items: {
    product_id: string;
    quantity: number;
    price: number;
    product_name: string;
  }[];
}) {
  const { items, ...order } = orderData;

  try {
    console.log('📦 Creating order:', order.order_number);
    
    // Create order
    const { data: newOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert([{
        ...order,
        status: 'pending',
        payment_status: orderData.payment_status || 'pending',
        discount_amount: orderData.discount_amount || 0,
        is_guest_order: orderData.is_guest_order || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = items.map(item => ({
      ...item,
      order_id: newOrder.id,
    }));

    const { data: newOrderItems, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems)
      .select();

    if (itemsError) throw itemsError;

    console.log('✅ Order created successfully:', newOrder.id);
    return { ...newOrder, order_items: newOrderItems };
  } catch (error) {
    console.error('❌ Error creating order:', error);
    throw error;
  }
}

export async function getOrders(userId: string, options: {
  page?: number;
  limit?: number;
} = {}) {
  const { page = 1, limit = 10 } = options;

  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabaseAdmin
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
      orders: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    };
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    throw error;
  }
}

export async function getOrderById(id: string, userId?: string) {
  try {
    let query = supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items(*),
        user:users(id, name, email, phone)
      `)
      .eq('id', id);

    // If userId provided, filter by user (for security)
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('❌ Error fetching order by ID:', error);
    throw error;
  }
}

// Keep all your existing address and utility functions unchanged...
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

// Add this to the END of your lib/database.ts file (after all existing code)

// Shipping zones export that was missing
export const shippingZones = [
  {
    name: 'Lagos Zone',
    states: ['Lagos'],
    baseCost: 2000,
    perKgCost: 500,
    estimatedDays: 1
  },
  {
    name: 'FCT Zone', 
    states: ['FCT'],
    baseCost: 2000,
    perKgCost: 500,
    estimatedDays: 1
  },
  {
    name: 'South West',
    states: ['Ogun', 'Oyo', 'Osun', 'Ondo', 'Ekiti'],
    baseCost: 3000,
    perKgCost: 700,
    estimatedDays: 2
  },
  {
    name: 'South East',
    states: ['Anambra', 'Enugu', 'Abia', 'Imo', 'Ebonyi'],
    baseCost: 4000,
    perKgCost: 800,
    estimatedDays: 3
  },
  {
    name: 'South South',
    states: ['Delta', 'Rivers', 'Cross River', 'Akwa Ibom', 'Bayelsa', 'Edo'],
    baseCost: 4500,
    perKgCost: 900,
    estimatedDays: 3
  },
  {
    name: 'North Central',
    states: ['Plateau', 'Nasarawa', 'Niger', 'Kwara', 'Kogi', 'Benue'],
    baseCost: 5000,
    perKgCost: 1000,
    estimatedDays: 4
  },
  {
    name: 'North West',
    states: ['Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Sokoto', 'Zamfara', 'Jigawa'],
    baseCost: 6000,
    perKgCost: 1200,
    estimatedDays: 5
  },
  {
    name: 'North East',
    states: ['Bauchi', 'Borno', 'Gombe', 'Adamawa', 'Taraba', 'Yobe'],
    baseCost: 6500,
    perKgCost: 1300,
    estimatedDays: 5
  }
];

