import { NextRequest, NextResponse } from 'next/server';
import { resetPasswordSchema } from '@/lib/validation';
import { hashPassword } from '@/lib/auth';
import { users, updateUser } from '@/lib/database';
import { handleCors } from '@/lib/middleware';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = resetPasswordSchema.parse(body);

    // Find user with reset code
    const user = users.find(u => 
      u.passwordResetCode === validatedData.code &&
      u.passwordResetExpires &&
      u.passwordResetExpires > new Date()
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset code' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(validatedData.password);

    // Update user
    updateUser(user.id, {
      password: hashedPassword,
      passwordResetCode: undefined,
      passwordResetExpires: undefined,
    });

    return NextResponse.json({
      message: 'Password reset successfully',
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