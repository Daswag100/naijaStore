// app/api/orders/route.ts - Updated version
import { NextRequest, NextResponse } from 'next/server';
import { createOrderSchema } from '@/lib/validation';
import { createOrder, generateOrderNumber, getCartItems, clearCart } from '@/lib/database';
import { withAuth, handleCors, AuthenticatedRequest } from '@/lib/middleware';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();
    
    // Extended validation to include payment data
    const orderData = {
      ...body,
      items: body.items || [],
      shippingAddressId: body.shippingAddressId || 'default-address',
      paymentMethod: body.paymentMethod || 'flutterwave',
    };

    const validatedData = createOrderSchema.parse(orderData);

    // Get user's cart items to create order
    const cartItems = await getCartItems(request.user!.userId);
    
    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'No items in cart' },
        { status: 400 }
      );
    }

    // Prepare order items from cart
    const orderItems = cartItems.map(cartItem => ({
      product_id: cartItem.product_id,
      quantity: cartItem.quantity,
      price: cartItem.product?.price || 0,
      product_name: cartItem.product?.name || 'Unknown Product',
    }));

    // Calculate totals
    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingCost = body.shippingCost || (subtotal > 100000 ? 0 : 5000);
    const discount = body.discount || 0;
    const total = subtotal - discount + shippingCost;

    // Create order number
    const orderNumber = generateOrderNumber();

    // Prepare shipping address (simplified for now)
    const shippingAddress = {
      name: request.user!.name || 'Customer',
      email: request.user!.email,
      phone: request.user!.phone || '',
      address_line1: 'Default Address', // Replace with actual address selection
      city: 'Lagos',
      state: 'Lagos',
      country: 'Nigeria',
    };

    // Create order in database
    const newOrder = await createOrder({
      user_id: request.user!.userId,
      order_number: orderNumber,
      total_amount: total,
      shipping_cost: shippingCost,
      shipping_address: shippingAddress,
      billing_address: shippingAddress,
      items: orderItems,
    });

    // If payment reference is provided, update order with payment info
    if (body.paymentReference) {
      // In a real implementation, you'd update the order with payment details
      console.log('Order created with payment reference:', body.paymentReference);
    }

    // Clear user's cart after successful order creation
    await clearCart(request.user!.userId);

    return NextResponse.json({
      message: 'Order created successfully',
      order: {
        id: newOrder.id,
        order_number: newOrder.order_number,
        total: newOrder.total_amount,
        status: 'pending',
        payment_status: body.paymentReference ? 'paid' : 'pending',
        created_at: newOrder.created_at,
        items: orderItems,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Order creation error:', error);
    
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