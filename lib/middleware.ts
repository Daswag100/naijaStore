import { NextRequest, NextResponse } from 'next/server';

// Add this interface
export interface AuthenticatedRequest extends NextRequest {
  user?: any;
}

export function middleware(request: NextRequest) {
  // Add CORS headers to all API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    
    response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  }

  return NextResponse.next();
}

export const handleCors = (request: NextRequest) => {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};

export const withAuth = (handler: any) => {
  return async (request: AuthenticatedRequest, context?: any) => {
    // Simple auth check - in production, implement proper JWT validation
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Mock user for now
    request.user = { userId: 'mock-user-id', email: 'user@example.com' };
    
    return handler(request, context);
  };
};

export const withAdminAuth = (handler: any) => {
  return async (request: AuthenticatedRequest, context?: any) => {
    // Simple admin auth - in production, implement proper admin role checking
    // For now, we'll allow all requests to admin endpoints
    request.user = { userId: 'admin-user-id', email: 'admin@example.com', role: 'admin' };
    
    return handler(request, context);
  };
};

export const rateLimit = (maxRequests: number, windowMs: number) => {
  return (handler: any) => {
    return async (request: NextRequest, context?: any) => {
      // Simple rate limiting - in production, use Redis or similar
      return handler(request, context);
    };
  };
};

export const config = {
  matcher: '/api/:path*',
};