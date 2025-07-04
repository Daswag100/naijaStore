import { NextRequest, NextResponse } from 'next/server';
import { getCartItems, addToCart, getProductById } from '@/lib/database';
import { withAuth, handleCors, AuthenticatedRequest } from '@/lib/middleware';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    console.log('🛒 Loading cart for user:', request.user!.userId);
    
    const cartItems = await getCartItems(request.user!.userId);
    
    // Map to CartItem structure expected by frontend
    const mappedItems = cartItems.map(item => ({
      id: item.id,
      name: item.product?.name || 'Unknown Product',
      price: item.product?.price || 0,
      image: item.product?.images?.[0] || '/placeholder-image.jpg',
      quantity: item.quantity,
      size: item.size || undefined,
      color: item.color || undefined,
      product_id: item.product_id,
    }));

    const total = mappedItems.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );

    const itemCount = mappedItems.reduce((sum, item) => 
      sum + item.quantity, 0
    );

    console.log('✅ Cart loaded successfully:', mappedItems.length, 'items');

    return NextResponse.json({
      items: mappedItems,
      total,
      itemCount,
      isGuest: request.user!.isGuest || false,
    });

  } catch (error) {
    console.error('❌ Error loading cart:', error);
    return NextResponse.json(
      { error: 'Failed to load cart items' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();
    
    console.log('➕ Adding item to cart:', body);
    
    // Validate required fields
    if (!body.product_id || !body.quantity) {
      return NextResponse.json(
        { error: 'Product ID and quantity are required' },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await getProductById(body.product_id);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (product.inventory_quantity < body.quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock' },
        { status: 400 }
      );
    }

    await addToCart({
      user_id: request.user!.userId,
      product_id: body.product_id,
      quantity: body.quantity,
      size: body.size,
      color: body.color,
    });

    console.log('✅ Item added to cart successfully');

    return NextResponse.json({
      message: 'Item added to cart successfully',
    });

  } catch (error) {
    console.error('❌ Error adding to cart:', error);
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
});