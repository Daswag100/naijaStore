import { NextRequest, NextResponse } from 'next/server';
import { forgotPasswordSchema } from '@/lib/validation';
import { generateVerificationCode } from '@/lib/auth';
import { findUserByEmail, updateUser } from '@/lib/database';
import { sendEmail, generatePasswordResetEmailHtml } from '@/lib/email';
import { handleCors, rateLimit } from '@/lib/middleware';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export const POST = rateLimit(3, 15 * 60 * 1000)(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const validatedData = forgotPasswordSchema.parse(body);

    // Find user
    const user = findUserByEmail(validatedData.email);
    if (!user) {
      // Don't reveal if email exists
      return NextResponse.json({
        message: 'If an account with that email exists, we have sent a password reset link.',
      });
    }

    // Generate reset code
    const resetCode = generateVerificationCode();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user with reset code
    updateUser(user.id, {
      passwordResetCode: resetCode,
      passwordResetExpires: resetExpires,
    });

    // Send reset email
    await sendEmail({
      to: user.email,
      subject: 'Reset your password - NaijaStore',
      html: generatePasswordResetEmailHtml(user.name, resetCode),
    });

    return NextResponse.json({
      message: 'If an account with that email exists, we have sent a password reset link.',
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
});