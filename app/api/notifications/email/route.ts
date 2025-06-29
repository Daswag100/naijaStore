import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { withAdminAuth, handleCors, AuthenticatedRequest } from '@/lib/middleware';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export const POST = withAdminAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();
    const { to, subject, html, text } = body;

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      );
    }

    const success = await sendEmail({ to, subject, html, text });

    if (success) {
      return NextResponse.json({
        message: 'Email sent successfully',
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});