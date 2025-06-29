import { NextRequest, NextResponse } from 'next/server';
import { shippingZones } from '@/lib/database';
import { handleCors } from '@/lib/middleware';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      zones: shippingZones,
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}