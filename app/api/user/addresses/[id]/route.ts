import { NextRequest, NextResponse } from 'next/server';
import { addressSchema } from '@/lib/validation';
import { addresses } from '@/lib/database';
import { withAuth, handleCors, AuthenticatedRequest } from '@/lib/middleware';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export const PUT = withAuth(async (request: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  try {
    const body = await request.json();
    const validatedData = addressSchema.parse(body);

    const addressIndex = addresses.findIndex(
      addr => addr.id === params.id && addr.userId === request.user!.userId
    );

    if (addressIndex === -1) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    // If this is set as default, unset other default addresses
    if (validatedData.isDefault) {
      addresses.forEach(addr => {
        if (addr.userId === request.user!.userId && addr.isDefault && addr.id !== params.id) {
          addr.isDefault = false;
        }
      });
    }

    addresses[addressIndex] = {
      ...addresses[addressIndex],
      ...validatedData,
    };

    return NextResponse.json({
      message: 'Address updated successfully',
      address: addresses[addressIndex],
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

export const DELETE = withAuth(async (request: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  try {
    const addressIndex = addresses.findIndex(
      addr => addr.id === params.id && addr.userId === request.user!.userId
    );

    if (addressIndex === -1) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    addresses.splice(addressIndex, 1);

    return NextResponse.json({
      message: 'Address deleted successfully',
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});