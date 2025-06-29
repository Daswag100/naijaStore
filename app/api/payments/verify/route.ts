import { NextRequest, NextResponse } from 'next/server';
import { orders } from '@/lib/database';
import { withAuth, handleCors, AuthenticatedRequest } from '@/lib/middleware';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();
    const { reference, orderId } = body;

    // Mock payment verification
    const isPaymentSuccessful = Math.random() > 0.1; // 90% success rate for demo

    if (isPaymentSuccessful) {
      // Update order payment status
      const orderIndex = orders.findIndex(o => o.id === orderId);
      if (orderIndex !== -1) {
        orders[orderIndex].paymentStatus = 'paid';
        orders[orderIndex].status = 'confirmed';
        orders[orderIndex].paymentReference = reference;
        orders[orderIndex].updatedAt = new Date();
      }

      return NextResponse.json({
        status: 'success',
        message: 'Payment verified successfully',
        data: {
          reference,
          amount: orders[orderIndex]?.total || 0,
          currency: 'NGN',
          status: 'successful',
        },
      });
    } else {
      return NextResponse.json({
        status: 'error',
        message: 'Payment verification failed',
      }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
});