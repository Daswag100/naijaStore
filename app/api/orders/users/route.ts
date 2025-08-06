// app/api/orders/user/route.ts - CREATE THIS FILE FOR USER ORDERS
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
    // Get auth token from headers
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    console.log('📋 User fetching orders:', { userId: user.id, page, limit });

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Get user's orders
    const { data: orders, error: orderError, count } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        payment_status,
        total_amount,
        shipping_cost,
        shipping_address,
        tracking_number,
        created_at,
        updated_at
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (orderError) {
      console.error('❌ User orders fetch error:', orderError);
      throw orderError;
    }

    // Get order items for these orders
    let orderItems: any[] = [];
    if (orders && orders.length > 0) {
      const orderIds = orders.map(order => order.id);
      const { data: items, error: itemsError } = await supabaseAdmin
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);

      if (itemsError) {
        console.warn('⚠️ Error fetching order items:', itemsError);
      } else {
        orderItems = items || [];
      }
    }

    // Group items by order_id
    const itemsByOrder: Record<string, any[]> = {};
    orderItems.forEach(item => {
      if (!itemsByOrder[item.order_id]) {
        itemsByOrder[item.order_id] = [];
      }
      itemsByOrder[item.order_id].push(item);
    });

    // Add items to orders
    const ordersWithItems = (orders || []).map(order => ({
      ...order,
      order_items: itemsByOrder[order.id] || []
    }));

    console.log('✅ User orders fetched:', ordersWithItems.length);
    
    return NextResponse.json({
      orders: ordersWithItems,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      }
    });
    
  } catch (error) {
    console.error('❌ User orders fetch error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch orders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}