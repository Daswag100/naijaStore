import { NextRequest, NextResponse } from 'next/server';
import { updateCartSchema } from '@/lib/validation';
import { cartItems } from '@/lib/database';
import { withAuth, handleCors, AuthenticatedRequest } from '@/lib/middleware';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export const PUT = withAuth(async (request: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  try {
    const body = await request.json();
    const validatedData = updateCartSchema.parse(body);

    const itemIndex = cartItems.findIndex(
      item => item.id === params.id && item.userId === request.user!.userId
    );

    if (itemIndex === -1) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }

    if (validatedData.quantity === 0) {
      // Remove item
      cartItems.splice(itemIndex, 1);
    } else {
      // Update quantity
      cartItems[itemIndex].quantity = validatedData.quantity;
    }

    return NextResponse.json({
      message: 'Cart updated successfully',
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
    const itemIndex = cartItems.findIndex(
      item => item.id === params.id && item.userId === request.user!.userId
    );

    if (itemIndex === -1) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }

    cartItems.splice(itemIndex, 1);

    return NextResponse.json({
      message: 'Item removed from cart successfully',
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});