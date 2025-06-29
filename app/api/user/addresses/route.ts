import { NextRequest, NextResponse } from 'next/server';
import { addressSchema } from '@/lib/validation';
import { addresses, generateId } from '@/lib/database';
import { withAuth, handleCors, AuthenticatedRequest } from '@/lib/middleware';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userAddresses = addresses.filter(addr => addr.userId === request.user!.userId);
    
    return NextResponse.json({
      addresses: userAddresses,
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();
    const validatedData = addressSchema.parse(body);

    // If this is set as default, unset other default addresses
    if (validatedData.isDefault) {
      addresses.forEach(addr => {
        if (addr.userId === request.user!.userId && addr.isDefault) {
          addr.isDefault = false;
        }
      });
    }

    const newAddress = {
      id: generateId(),
      userId: request.user!.userId,
      ...validatedData,
      createdAt: new Date(),
    };

    addresses.push(newAddress);

    return NextResponse.json({
      message: 'Address created successfully',
      address: newAddress,
    }, { status: 201 });

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