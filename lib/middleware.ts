// lib/middleware.ts - Fixed to properly handle real users
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from './supabase';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
    name?: string;
    isGuest: boolean;
    sessionId?: string;
    role?: string;
  };
}

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    
    response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-ID');
    
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-ID',
    },
  });
};

// Get session ID from header consistently
function getSessionIdFromRequest(request: NextRequest): string {
  const sessionIdHeader = request.headers.get('x-session-id');
  
  if (sessionIdHeader) {
    console.log('📨 Using session ID from header:', sessionIdHeader);
    return sessionIdHeader;
  }
  
  // Fallback: generate based on user agent (consistent)
  const userAgent = request.headers.get('user-agent') || '';
  const fingerprint = userAgent.slice(0, 50);
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const fallbackSessionId = `guest_${Math.abs(hash).toString(36)}_fallback`;
  console.log('🔄 Generated fallback session ID:', fallbackSessionId);
  return fallbackSessionId;
}

// FIXED: Check if user is authenticated with real account
async function checkRealUserAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  console.log('🔍 Checking real user auth with token:', token);

  try {
    // Look up user by ID (assuming the token is the user ID for now)
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, is_guest')
      .eq('id', token)
      .eq('is_guest', false)
      .single();

    if (error || !user) {
      console.log('❌ Real user not found or is guest');
      return null;
    }

    console.log('✅ Found real authenticated user:', user.email);
    
    return {
      userId: user.id,
      email: user.email,
      name: user.name || 'User',
      isGuest: false,
      role: 'user',
    };
  } catch (error) {
    console.error('❌ Error checking real user auth:', error);
    return null;
  }
}

// Simplified guest user management
async function getOrCreateGuestUser(sessionId: string) {
  try {
    console.log('🔍 Looking for guest user with session:', sessionId);
    
    // First try to find by session ID
    const { data: existingUser, error: findError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, is_guest, guest_session_id')
      .eq('guest_session_id', sessionId)
      .eq('is_guest', true)
      .maybeSingle();

    if (findError && findError.code !== 'PGRST116') {
      console.error('❌ Error finding user:', findError);
    }

    if (existingUser) {
      console.log('✅ Found existing guest user:', existingUser.id);
      return {
        userId: existingUser.id,
        email: existingUser.email,
        name: existingUser.name || 'Guest User',
        isGuest: true,
        sessionId: sessionId,
      };
    }

    // Create new guest user with unique email
    const guestEmail = `guest_${sessionId.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}@naijastore.local`;
    
    console.log('🆕 Creating new guest user with email:', guestEmail);
    
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert([{
        email: guestEmail,
        password_hash: null,
        name: 'Guest User',
        is_guest: true,
        guest_session_id: sessionId,
        email_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select('id, email, name, is_guest, guest_session_id')
      .single();

    if (createError) {
      console.error('❌ Error creating guest user:', createError);
      
      // If email already exists, try to find that user
      if (createError.code === '23505') {
        console.log('🔄 Email exists, trying to find existing user...');
        const { data: fallbackUser } = await supabaseAdmin
          .from('users')
          .select('id, email, name, is_guest, guest_session_id')
          .eq('email', guestEmail)
          .single();

        if (fallbackUser) {
          // Update session ID for existing user
          await supabaseAdmin
            .from('users')
            .update({ guest_session_id: sessionId })
            .eq('id', fallbackUser.id);

          return {
            userId: fallbackUser.id,
            email: fallbackUser.email,
            name: fallbackUser.name || 'Guest User',
            isGuest: true,
            sessionId: sessionId,
          };
        }
      }
      
      throw createError;
    }

    console.log('✅ Created new guest user:', newUser.id);
    return {
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name || 'Guest User',
      isGuest: true,
      sessionId: sessionId,
    };

  } catch (error) {
    console.error('❌ Guest user management failed:', error);
    throw error;
  }
}

export const withAuth = (handler: any) => {
  return async (request: AuthenticatedRequest, context?: any) => {
    try {
      // FIXED: Check for real user authentication first
      const realUser = await checkRealUserAuth(request);
      
      if (realUser) {
        console.log('👤 Using real authenticated user:', realUser.email);
        request.user = realUser;
        return handler(request, context);
      }

      // Fall back to guest user system
      console.log('👻 Using guest user system');
      const sessionId = getSessionIdFromRequest(request);
      const guestUser = await getOrCreateGuestUser(sessionId);
      
      request.user = guestUser;
      
      return handler(request, context);
      
    } catch (error) {
      console.error('❌ Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
};

export const withAdminAuth = (handler: any) => {
  return async (request: AuthenticatedRequest, context?: any) => {
    try {
      const sessionId = getSessionIdFromRequest(request);
      const user = await getOrCreateGuestUser(sessionId);
      
      request.user = {
        ...user,
        role: 'admin'
      };
      
      return handler(request, context);
      
    } catch (error) {
      console.error('❌ Admin auth error:', error);
      return NextResponse.json(
        { error: 'Admin authentication failed' },
        { status: 401 }
      );
    }
  };
};

export const rateLimit = (maxRequests: number, windowMs: number) => {
  return (handler: any) => {
    return async (request: NextRequest, context?: any) => {
      return handler(request, context);
    };
  };
};

export const config = {
  matcher: '/api/:path*',
};