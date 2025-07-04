// app/api/auth/guest-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { handleCors } from '@/lib/middleware';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // The middleware will automatically create a guest user
    // We just need to make a request that triggers it
    const middlewareResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cart`, {
      method: 'GET',
      headers: {
        'X-Session-ID': sessionId,
        'Content-Type': 'application/json',
      },
    });

    // The middleware has now created the guest user
    // We can return the session info
    return NextResponse.json({
      success: true,
      sessionId: sessionId,
      userId: sessionId, // For now, use sessionId as userId
      message: 'Guest session created',
    });

  } catch (error) {
    console.error('Guest session error:', error);
    return NextResponse.json(
      { error: 'Failed to create guest session' },
      { status: 500 }
    );
  }
}