// app/api/orders/route.ts - FIXED VERSION WITH IMAGES
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetching user orders...');
    
    // Get Authorization header with real user ID
    const authHeader = request.headers.get('Authorization');
    let userId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      userId = authHeader.substring(7); // Remove 'Bearer ' prefix
      console.log('🔐 Using authenticated user:', userId);
    } else {
      console.log('❌ No valid authentication found');
      return NextResponse.json({
        error: 'Authentication required',
        orders: [],
        total: 0
      }, { status: 401 });
    }
    
    console.log('🆔 Fetching orders for user:', userId);

    // Fetch orders for this user
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (ordersError) {
      console.error('❌ Orders fetch error:', ordersError);
      throw ordersError;
    }

    console.log('✅ Orders fetched:', orders?.length || 0);

    return NextResponse.json({
      orders: orders || [],
      total: orders?.length || 0
    });

  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    
    return NextResponse.json({
      error: 'Failed to fetch orders',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📦 Creating order with data:', body);
    
    // Get Authorization header with real user ID
    const authHeader = request.headers.get('Authorization');
    let userId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      userId = authHeader.substring(7); // Remove 'Bearer ' prefix
      console.log('🔐 Using authenticated user:', userId);
    } else {
      console.log('❌ No valid authentication found');
      return NextResponse.json({
        error: 'Authentication required'
      }, { status: 401 });
    }

    console.log('🆔 Using authenticated user:', userId);

    // Get user's cart items with detailed logging
    console.log('🛒 Fetching cart items for user:', userId);
    const { data: cartItems, error: cartError } = await supabaseAdmin
      .from('cart_items')
      .select(`
        *,
        product:products(*)
      `)
      .eq('user_id', userId);
    
    if (cartError) {
      console.error('❌ Cart fetch error:', cartError);
      return NextResponse.json({
        error: 'Failed to fetch cart items',
        details: cartError.message
      }, { status: 500 });
    }

    console.log('🔍 Raw cart items from database:', cartItems?.length || 0, 'items');
    console.log('🔍 Cart items details:', cartItems?.map(item => ({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      has_product: !!item.product,
      product_name: item.product?.name || 'NO PRODUCT DATA'
    })));

    // Ensure we have cart items to create an order
    if (!cartItems || cartItems.length === 0) {
      console.error('❌ No cart items found for order creation');
      return NextResponse.json({
        error: 'No cart items found. Please add items to cart before creating an order.'
      }, { status: 400 });
    }

    // Validate cart items have associated products
    const invalidItems = cartItems.filter(item => !item.product || !item.product_id);
    if (invalidItems.length > 0) {
      console.error('❌ Cart items with missing product data:', invalidItems.map(item => ({
        id: item.id,
        product_id: item.product_id,
        has_product: !!item.product
      })));
      
      return NextResponse.json({
        error: 'Some items in your cart are no longer available. Please refresh your cart and try again.',
        invalid_items: invalidItems.length
      }, { status: 400 });
    }

    const orderItems = cartItems;

    console.log('🛒 Found/Created cart items:', orderItems.length);

    // Calculate totals
    const subtotal = orderItems.reduce((sum, item) => {
      const price = item.product?.price || 0;
      return sum + (price * item.quantity);
    }, 0);

    const shippingCost = body.shippingCost || (subtotal > 100000 ? 0 : 5000);
    const discount = body.discount || 0;
    const total = subtotal - discount + shippingCost;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Get user profile for shipping address
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('email, name, phone')
      .eq('id', userId)
      .single();

    // Create shipping address
    const shippingAddress = body.shippingAddress || {
      name: userProfile?.name || 'Customer',
      email: userProfile?.email || '',
      phone: userProfile?.phone || body.phone || '',
      address_line1: body.address || 'Default Address',
      city: body.city || 'Lagos',
      state: body.state || 'Lagos',
      country: 'Nigeria',
    };

    // Create order in database
    const { data: newOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert([{
        user_id: userId,
        order_number: orderNumber,
        status: 'pending',
        payment_status: body.paymentReference ? 'paid' : 'pending',
        total_amount: total,
        shipping_cost: shippingCost,
        shipping_address: shippingAddress,
        billing_address: body.billingAddress || shippingAddress,
        payment_reference: body.paymentReference || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (orderError || !newOrder) {
      console.error('❌ Order creation error:', orderError);
      throw orderError;
    }

    console.log('✅ Order created:', newOrder.id);

    // Create order items with real product data
    const orderItemsToInsert = orderItems.map(item => {
      // Ensure we have a valid product_id
      if (!item.product_id) {
        throw new Error(`Missing product_id for cart item: ${item.product?.name || 'Unknown'}`);
      }
      
      // Ensure we have product data
      if (!item.product) {
        throw new Error(`Missing product data for product_id: ${item.product_id}`);
      }

      return {
        order_id: newOrder.id,
        product_id: item.product_id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        image_url: item.product.image_url || item.product.images?.[0] || '/placeholder-product.jpg',
        product_slug: item.product.slug || null,
      };
    });

    console.log('📦 Order items to create:', orderItemsToInsert.map(item => ({
      product_id: item.product_id,
      name: item.product_name,
      quantity: item.quantity,
      price: item.price,
      image: item.image_url,
      slug: item.product_slug
    })));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItemsToInsert);

    if (itemsError) {
      console.error('❌ Order items creation failed:', itemsError);
      console.error('📋 Failed order items data:', orderItemsToInsert);
      
      // Try to delete the order if items failed
      await supabaseAdmin.from('orders').delete().eq('id', newOrder.id);
      
      // Return more specific error message
      return NextResponse.json({
        error: 'Failed to create order items',
        details: itemsError.message,
        hint: itemsError.code === '23503' ? 'One or more products in your cart no longer exist. Please refresh your cart and try again.' : itemsError.message
      }, { status: 400 });
    }

    console.log('✅ Order items created:', orderItemsToInsert.length);

    // IMPORTANT: Clear the cart
    const { error: clearError } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    if (clearError) {
      console.error('⚠️ Cart clear error:', clearError);
      // Don't fail the order if cart clearing fails
    } else {
      console.log('✅ Cart cleared successfully');
    }

    // Return success response
    return NextResponse.json({
      message: 'Order created successfully',
      order: {
        id: newOrder.id,
        order_number: newOrder.order_number,
        total_amount: total,
        shipping_cost: shippingCost,
        discount_amount: discount,
        status: 'pending',
        payment_status: body.paymentReference ? 'paid' : 'pending',
        created_at: newOrder.created_at,
        items: orderItemsToInsert.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price: item.price,
          image_url: item.image_url,
          product_slug: item.product_slug
        })),
        shipping_address: shippingAddress,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Order creation error:', error);
    
    return NextResponse.json({
      error: 'Failed to create order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}