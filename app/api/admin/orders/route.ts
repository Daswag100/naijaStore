// app/api/admin/orders/route.ts - FIXED VERSION
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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    console.log('📋 Admin fetching orders:', { page, limit, status, search });

    // Build base query
    let query = supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        user_id,
        status,
        payment_status,
        total_amount,
        shipping_cost,
        shipping_address,
        tracking_number,
        notes,
        created_at,
        updated_at,
        users!left(id, email, name, phone),
        order_items(
          id,
          product_id,
          product_name,
          quantity,
          price,
          products(
            id,
            name,
            images
          )
        )
      `, { count: 'exact' });

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply search filter (search in order number only for now)
    if (search) {
      query = query.ilike('order_number', `%${search}%`);
    }

    // Apply pagination and sorting
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    query = query
      .order('created_at', { ascending: false })
      .range(from, to);

    const { data: orders, error, count } = await query;

    if (error) {
      console.error('❌ Error fetching admin orders:', error);
      throw error;
    }

    console.log('✅ Admin orders fetched:', orders?.length || 0);

    // Transform data to match expected format
    const transformedOrders = orders?.map(order => ({
      id: order.id,
      order_number: order.order_number,
      user_id: order.user_id,
      status: order.status,
      payment_status: order.payment_status,
      total_amount: order.total_amount,
      shipping_cost: order.shipping_cost,
      shipping_address: order.shipping_address,
      tracking_number: order.tracking_number,
      notes: order.notes,
      created_at: order.created_at,
      updated_at: order.updated_at,
      customer: {
        name: Array.isArray(order.users)
          ? (order.users[0]?.name || order.users[0]?.email?.split('@')[0] || 'Unknown Customer')
          : ((order.users as any)?.name || (order.users as any)?.email?.split('@')[0] || 'Unknown Customer'),
        email: Array.isArray(order.users)
          ? (order.users[0]?.email || 'Unknown Email')
          : ((order.users as any)?.email || 'Unknown Email'),
        phone: Array.isArray(order.users)
          ? (order.users[0]?.phone || null)
          : ((order.users as any)?.phone || null)
      },
      order_items: (order.order_items || []).map(item => ({
        ...item,
        product_image: (item.products as any)?.images?.[0] || null
      }))
    })) || [];

    return NextResponse.json({
      orders: transformedOrders,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
    
  } catch (error) {
    console.error('❌ Admin orders fetch error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch orders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}