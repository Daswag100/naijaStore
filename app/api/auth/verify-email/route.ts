import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailSchema } from '@/lib/validation';
import { users, updateUser } from '@/lib/database';
import { handleCors } from '@/lib/middleware';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = verifyEmailSchema.parse(body);

    // Find user with verification code
    const user = users.find(u => u.emailVerificationCode === validatedData.code);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Update user
    updateUser(user.id, {
      isEmailVerified: true,
      emailVerificationCode: undefined,
    });

    return NextResponse.json({
      message: 'Email verified successfully',
    });

  } catch (error) {
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