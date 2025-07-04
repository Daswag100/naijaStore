import { NextRequest, NextResponse } from 'next/server';
import { withAuth, handleCors, AuthenticatedRequest } from '@/lib/middleware';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();
    const { reference, transaction_id } = body;

    if (!transaction_id) {
      return NextResponse.json(
        { status: 'error', message: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Verify payment with Flutterwave
    const verifyResponse = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const verifyData = await verifyResponse.json();

    if (verifyData.status === 'success' && verifyData.data.status === 'successful') {
      // Payment verified successfully
      return NextResponse.json({
        status: 'success',
        message: 'Payment verified successfully',
        data: {
          reference: verifyData.data.tx_ref,
          amount: verifyData.data.amount,
          currency: verifyData.data.currency,
          status: verifyData.data.status,
          customer: verifyData.data.customer,
          transaction_id: verifyData.data.id,
        },
      });
    } else {
      return NextResponse.json({
        status: 'error',
        message: 'Payment verification failed',
        data: verifyData,
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Payment verification failed' },
      { status: 500 }
    );
  }
});