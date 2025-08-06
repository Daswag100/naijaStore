
import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase';
import { handleCors } from '@/lib/middleware';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Login attempt...');
    
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    console.log('📧 Attempting to sign in with Supabase for:', validatedData.email);

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
    });

    if (error) {
        console.error('❌ Supabase login error:', error.message);
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!data.user || !data.session) {
        return NextResponse.json({ error: 'Login failed, please try again.' }, { status: 500 });
    }

    console.log('✅ Login successful, user ID:', data.user.id);

    // The session object contains the JWT (access_token) and refresh_token
    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata.name,
      },
      session: data.session,
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
