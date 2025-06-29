import { NextRequest, NextResponse } from 'next/server';
import { withAuth, handleCors, AuthenticatedRequest } from '@/lib/middleware';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();
    const { orderId, amount, currency = 'NGN' } = body;

    // Mock Flutterwave payment initialization
    const paymentData = {
      status: 'success',
      message: 'Payment link generated',
      data: {
        link: `https://checkout.flutterwave.com/v3/hosted/pay/${Math.random().toString(36).substring(7)}`,
        reference: `FLW_${Date.now()}`,
      },
    };

    return NextResponse.json(paymentData);

  } catch (error) {
    return NextResponse.json(
      { error: 'Payment initialization failed' },
      { status: 500 }
    );
  }
});