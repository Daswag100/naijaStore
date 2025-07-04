// app/api/cart/[id]/route.ts - Fixed with proper types
import { NextRequest, NextResponse } from 'next/server';
import { updateCartItem, removeCartItem } from '@/lib/database';
import { withAuth, handleCors, AuthenticatedRequest } from '@/lib/middleware';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export const PUT = withAuth(async (request: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  try {
    const body = await request.json();
    const { quantity } = body;

    if (!quantity || quantity < 0) {
      return NextResponse.json(
        { error: 'Valid quantity is required' },
        { status: 400 }
      );
    }

    console.log('📝 Updating cart item:', params.id, 'quantity:', quantity);

    if (quantity === 0) {
      // Remove item if quantity is 0
      await removeCartItem(params.id);
      console.log('🗑️ Cart item removed');
    } else {
      // Update quantity
      await updateCartItem(params.id, quantity);
      console.log('✅ Cart item quantity updated');
    }

    return NextResponse.json({
      message: 'Cart updated successfully',
    });

  } catch (error) {
    console.error('❌ Error updating cart item:', error);
    return NextResponse.json(
      { error: 'Failed to update cart item' },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (request: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  try {
    console.log('🗑️ Removing cart item:', params.id);
    
    await removeCartItem(params.id);

    console.log('✅ Cart item removed successfully');
    return NextResponse.json({
      message: 'Item removed from cart successfully',
    });

  } catch (error) {
    console.error('❌ Error removing cart item:', error);
    return NextResponse.json(
      { error: 'Failed to remove cart item' },
      { status: 500 }
    );
  }
});