import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validation';
import { findUserByEmail } from '@/lib/database';
import { handleCors } from '@/lib/middleware';
import bcrypt from 'bcryptjs';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Login attempt...');
    
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    console.log('📧 Looking for user:', validatedData.email);

    // Find user (add await!)
    const user = await findUserByEmail(validatedData.email);
    if (!user) {
      console.log('❌ User not found');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('✅ User found:', user.name);

    // Check password (simple comparison for now)
    const isValidPassword = await bcrypt.compare(validatedData.password, user.password_hash);
    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('✅ Password valid, login successful');

    // Simple response (no JWT for now)
    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
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