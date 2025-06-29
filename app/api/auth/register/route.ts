import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validation';
import { createUser, findUserByEmail } from '@/lib/database';
import { handleCors } from '@/lib/middleware';
import bcrypt from 'bcryptjs';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Registration attempt...');
    
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    console.log('📧 Checking if user exists:', validatedData.email);

    // Check if user already exists (add await!)
    const existingUser = await findUserByEmail(validatedData.email);
    if (existingUser) {
      console.log('❌ User already exists');
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    console.log('🔐 Creating user with hashed password');

    // Create user (add await!)
    const user = await createUser({
      email: validatedData.email,
      password_hash: hashedPassword, // Use correct field name
      name: validatedData.name,
      phone: validatedData.phone,
    });

    console.log('✅ User created successfully:', user.id);

    return NextResponse.json({
      message: 'User created successfully. Please check your email to verify your account.',
      userId: user.id,
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Registration error:', error);
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