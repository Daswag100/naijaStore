// app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { withAdminAuth, handleCors, AuthenticatedRequest } from '@/lib/middleware';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export const GET = withAdminAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    console.log('📋 Admin fetching orders:', { page, limit, status, search });

    // Build query for orders with user info and order items
    let query = supabaseAdmin
      .from('orders')
      .select(`
        *,
        user:users!inner(id, name, email, phone),
        order_items(
          id,
          product_id,
          product_name,
          quantity,
          price
        )
      `, { count: 'exact' });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      // Search in order number, customer name, or email
      query = query.or(
        `order_number.ilike.%${search}%,` +
        `user.name.ilike.%${search}%,` +
        `user.email.ilike.%${search}%`
      );
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
        name: order.user?.name || 'Unknown',
        email: order.user?.email || 'Unknown',
        phone: order.user?.phone
      },
      order_items: order.order_items || []
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
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
});