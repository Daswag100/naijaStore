import { NextRequest, NextResponse } from 'next/server';
import { orders } from '@/lib/database';
import { handleCors } from '@/lib/middleware';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify webhook signature (in production, verify with Flutterwave secret)
    const signature = request.headers.get('verif-hash');
    
    if (body.event === 'charge.completed' && body.data.status === 'successful') {
      const reference = body.data.tx_ref;
      
      // Find and update order
      const orderIndex = orders.findIndex(o => o.paymentReference === reference);
      if (orderIndex !== -1) {
        orders[orderIndex].paymentStatus = 'paid';
        orders[orderIndex].status = 'confirmed';
        orders[orderIndex].updatedAt = new Date();
      }
    }

    return NextResponse.json({ status: 'success' });

  } catch (error) {
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}