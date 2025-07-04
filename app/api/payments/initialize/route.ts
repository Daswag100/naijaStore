import { NextRequest, NextResponse } from 'next/server';
import { withAuth, handleCors, AuthenticatedRequest } from '@/lib/middleware';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();
    const { amount, currency = 'NGN', tx_ref, customer } = body;

    if (!amount || !tx_ref || !customer) {
      return NextResponse.json(
        { status: 'error', message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Initialize payment with Flutterwave
    const paymentData = {
      tx_ref,
      amount,
      currency,
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
      customer,
      customizations: {
        title: 'NaijaStore Payment',
        description: `Payment for order ${tx_ref}`,
        logo: '', // Add your logo URL
      },
      payment_options: 'card,mobilemoney,ussd,banktransfer',
    };

    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    const result = await response.json();

    if (result.status === 'success') {
      return NextResponse.json({
        status: 'success',
        message: 'Payment link generated',
        data: {
          link: result.data.link,
          reference: tx_ref,
        },
      });
    } else {
      return NextResponse.json({
        status: 'error',
        message: 'Payment initialization failed',
        data: result,
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Payment initialization error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Payment initialization failed' },
      { status: 500 }
    );
  }
});