// app/api/admin/orders/[id]/status/route.ts

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

export async function PUT(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const { status, notes, tracking_number } = await request.json();
    const orderId = params.id;
    
    console.log('🔄 Admin updating order status:', { orderId, status, tracking_number });

    // Get current order
    const { data: currentOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (fetchError || !currentOrder) {
      console.error('❌ Order not found:', fetchError);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order status
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };
    
    if (tracking_number !== undefined) {
      updateData.tracking_number = tracking_number;
    }
    
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating order:', updateError);
      throw updateError;
    }

    console.log('✅ Order status updated successfully');
    
    return NextResponse.json({
      message: 'Order status updated successfully',
      order: {
        id: orderId,
        status,
        tracking_number,
        updated_at: updatedOrder.updated_at
      }
    });
    
  } catch (error) {
    console.error('❌ Status update error:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}