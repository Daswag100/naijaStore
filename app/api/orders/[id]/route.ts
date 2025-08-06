// app/api/orders/[id]/route.ts
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
    // Extract order ID from URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const orderId = pathParts[pathParts.length - 1];
    
    console.log('📋 Fetching order:', orderId);

    // Get order with items (no auth for testing)
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('❌ Order not found:', orderError);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    console.log('✅ Order found:', order.order_number);

    return NextResponse.json({
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        payment_status: order.payment_status,
        total_amount: order.total_amount,
        shipping_cost: order.shipping_cost,
        shipping_address: order.shipping_address,
        tracking_number: order.tracking_number,
        created_at: order.created_at,
        updated_at: order.updated_at,
        order_items: order.order_items || []
      }
    });

  } catch (error) {
    console.error('❌ Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Extract order ID from URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const orderId = pathParts[pathParts.length - 1];
    
    const body = await request.json();
    console.log('📝 Updating order:', orderId, body);

    // Update order in database
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: body.status,
        tracking_number: body.tracking_number,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError || !updatedOrder) {
      console.error('❌ Order update failed:', updateError);
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 400 }
      );
    }

    console.log('✅ Order updated:', updatedOrder.order_number);

    return NextResponse.json({
      message: 'Order updated successfully',
      order: updatedOrder
    });

  } catch (error) {
    console.error('❌ Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}