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
    
    // Use the same mock user ID as your POST function
    const mockUserId = 'e87c74f2-8275-4b90-a6f7-216cd1dbdd41';
    const mockEmail = 'event@gmail.com';
    
    console.log('🆔 Fetching orders for user:', mockUserId);

    // Fetch orders for this user
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .eq('user_id', mockUserId)
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
    
    // Use the mock user ID from your logs - this is working
    const mockUserId = 'e87c74f2-8275-4b90-a6f7-216cd1dbdd41';
    const mockEmail = 'event@gmail.com';

    console.log('🆔 Using mock user:', mockUserId);

    // Get user's cart items
    const { data: cartItems, error: cartError } = await supabaseAdmin
      .from('cart_items')
      .select(`
        *,
        product:products(*)
      `)
      .eq('user_id', mockUserId);
    
    if (cartError) {
      console.error('❌ Cart fetch error:', cartError);
      throw cartError;
    }

    // If no cart items, create a simple order from payment data
    let orderItems;
    if (!cartItems || cartItems.length === 0) {
      console.log('⚠️ No cart items found, creating with payment data');
      orderItems = [{
        product_id: 'mock-product',
        quantity: 1,
        product: {
          name: 'Test Product',
          price: body.total || body.subtotal || 1000
        }
      }];
    } else {
      orderItems = cartItems;
    }

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

    // Create shipping address
    const shippingAddress = body.shippingAddress || {
      name: 'Test Customer',
      email: mockEmail,
      phone: body.phone || '',
      address_line1: body.address || 'Default Address',
      city: body.city || 'Lagos',
      state: body.state || 'Lagos',
      country: 'Nigeria',
    };

    // Create order in database
    const { data: newOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert([{
        user_id: mockUserId,
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

    // 🔽 UPDATED: Create order items with image URLs and product slugs
    const orderItemsToInsert = orderItems.map(item => ({
      order_id: newOrder.id,
      product_id: item.product_id || 'mock-product',
      product_name: item.product?.name || 'Test Product',
      quantity: item.quantity || 1,
      price: item.product?.price || (body.total || 1000),
      image_url: item.product?.image_url || item.product?.images?.[0] || 'https://via.placeholder.com/300x300?text=No+Image', // 🔽 Added this
      product_slug: item.product?.slug || null, // 🔽 Added this for linking back to product
    }));

    console.log('📸 Order items with images:', orderItemsToInsert.map(item => ({
      name: item.product_name,
      image: item.image_url,
      slug: item.product_slug
    })));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItemsToInsert);

    if (itemsError) {
      console.error('❌ Order items error:', itemsError);
      // Try to delete the order if items failed
      await supabaseAdmin.from('orders').delete().eq('id', newOrder.id);
      throw itemsError;
    }

    console.log('✅ Order items created:', orderItemsToInsert.length);

    // IMPORTANT: Clear the cart
    const { error: clearError } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('user_id', mockUserId);

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
          image_url: item.image_url, // 🔽 Include in response
          product_slug: item.product_slug // 🔽 Include in response
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