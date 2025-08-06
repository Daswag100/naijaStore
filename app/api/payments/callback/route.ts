import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Simple webhook handler
  console.log('Flutterwave webhook received');
  return NextResponse.json({ status: 'received' });
}