import { NextRequest, NextResponse } from 'next/server';
import { addToCartSchema, updateCartSchema } from '@/lib/validation';
import { cartItems, products, generateId } from '@/lib/database';
import { withAuth, handleCors, AuthenticatedRequest } from '@/lib/middleware';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userCartItems = cartItems.filter(item => item.userId === request.user!.userId);
    
    // Populate with product details
    const populatedItems = userCartItems.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        ...item,
        product,
      };
    }).filter(item => item.product); // Remove items with deleted products

    const total = populatedItems.reduce((sum, item) => 
      sum + (item.product!.price * item.quantity), 0
    );

    return NextResponse.json({
      items: populatedItems,
      total,
      itemCount: populatedItems.reduce((sum, item) => sum + item.quantity, 0),
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
    const validatedData = addToCartSchema.parse(body);

    // Check if product exists
    const product = products.find(p => p.id === validatedData.productId);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (!product.inStock || product.stockQuantity < validatedData.quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock' },
        { status: 400 }
      );
    }

    // Check if item already exists in cart
    const existingItemIndex = cartItems.findIndex(item =>
      item.userId === request.user!.userId &&
      item.productId === validatedData.productId &&
      item.size === validatedData.size &&
      item.color === validatedData.color
    );

    if (existingItemIndex !== -1) {
      // Update quantity
      cartItems[existingItemIndex].quantity += validatedData.quantity;
    } else {
      // Add new item
      const newItem = {
        id: generateId(),
        userId: request.user!.userId,
        ...validatedData,
        createdAt: new Date(),
      };
      cartItems.push(newItem);
    }

    return NextResponse.json({
      message: 'Item added to cart successfully',
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