import { NextRequest, NextResponse } from 'next/server';
import { handleCors } from '@/lib/middleware';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify webhook signature (IMPORTANT for production)
    const signature = request.headers.get('verif-hash');
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
    
    if (!signature || signature !== secretHash) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle successful payment webhook
    if (body.event === 'charge.completed' && body.data.status === 'successful') {
      const paymentData = body.data;
      
      console.log('Payment webhook received:', {
        tx_ref: paymentData.tx_ref,
        amount: paymentData.amount,
        customer: paymentData.customer.email,
      });

      // Here you can update order status, send confirmation emails, etc.
      // The order should already be created from the frontend
      
      return NextResponse.json({ status: 'success' });
    }

    return NextResponse.json({ status: 'success' });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}