import { NextRequest, NextResponse } from 'next/server';
import { handleCors } from '@/lib/middleware';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function POST(request: NextRequest) {
  // In a real implementation, you would invalidate the refresh token
  // For now, we'll just return a success message
  return NextResponse.json({
    message: 'Logged out successfully',
  });
}