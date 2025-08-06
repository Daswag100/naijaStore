// app/api/admin/orders/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { withAdminAuth, handleCors, AuthenticatedRequest } from '@/lib/middleware';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export const PUT = withAdminAuth(async (
  request: AuthenticatedRequest, 
  { params }: { params: { id: string } }
) => {
  try {
    const { status, notes, tracking_number } = await request.json();
    const orderId = params.id;
    const adminId = request.user?.userId;
    
    console.log('🔄 Admin updating order status:', { orderId, status, tracking_number });

    // Get current order with user info
    const { data: currentOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        user:users(id, name, email)
      `)
      .eq('id', orderId)
      .single();
    
    if (fetchError || !currentOrder) {
      console.error('❌ Order not found:', fetchError);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    const previousStatus = currentOrder.status;
    
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

    // Record status change history (optional - create table if needed)
    try {
      await supabaseAdmin
        .from('order_status_history')
        .insert([{
          order_id: orderId,
          previous_status: previousStatus,
          new_status: status,
          changed_by: adminId,
          notes: notes || null,
          created_at: new Date().toISOString()
        }]);
    } catch (historyError) {
      console.warn('⚠️ Could not record status history:', historyError);
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
});