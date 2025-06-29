import { NextRequest, NextResponse } from 'next/server';
import { createOrderSchema } from '@/lib/validation';
import { orders, products, addresses, cartItems, generateId } from '@/lib/database';
import { withAuth, handleCors, AuthenticatedRequest } from '@/lib/middleware';
import { sendEmail, generateOrderConfirmationEmailHtml } from '@/lib/email';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const userOrders = orders.filter(order => order.userId === request.user!.userId);
    
    // Sort by creation date (newest first)
    userOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = userOrders.slice(startIndex, endIndex);

    return NextResponse.json({
      orders: paginatedOrders,
      pagination: {
        page,
        limit,
        total: userOrders.length,
        pages: Math.ceil(userOrders.length / limit),
      },
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
    const validatedData = createOrderSchema.parse(body);

    // Get shipping address
    const shippingAddress = addresses.find(
      addr => addr.id === validatedData.shippingAddressId && addr.userId === request.user!.userId
    );

    if (!shippingAddress) {
      return NextResponse.json(
        { error: 'Shipping address not found' },
        { status: 404 }
      );
    }

    // Validate and calculate order items
    const orderItems = [];
    let subtotal = 0;

    for (const item of validatedData.items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found` },
          { status: 404 }
        );
      }

      if (!product.inStock || product.stockQuantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}` },
          { status: 400 }
        );
      }

      const orderItem = {
        id: generateId(),
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      };

      orderItems.push(orderItem);
      subtotal += product.price * item.quantity;

      // Update product stock
      product.stockQuantity -= item.quantity;
      if (product.stockQuantity === 0) {
        product.inStock = false;
      }
    }

    // Calculate shipping cost (simplified)
    const shippingCost = subtotal > 100000 ? 0 : 5000;
    const tax = 0; // No tax for now
    const total = subtotal + shippingCost + tax;

    // Create order
    const newOrder = {
      id: 'NS' + generateId().toUpperCase(),
      userId: request.user!.userId,
      items: orderItems,
      subtotal,
      shippingCost,
      tax,
      total,
      status: 'pending' as const,
      paymentStatus: 'pending' as const,
      paymentMethod: validatedData.paymentMethod,
      shippingAddress,
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    orders.push(newOrder);

    // Clear cart items for this user
    const userCartItemIndices = cartItems
      .map((item, index) => item.userId === request.user!.userId ? index : -1)
      .filter(index => index !== -1)
      .reverse(); // Reverse to remove from end first

    userCartItemIndices.forEach(index => cartItems.splice(index, 1));

    // Send confirmation email
    try {
      await sendEmail({
        to: request.user!.email,
        subject: `Order Confirmation - ${newOrder.id}`,
        html: generateOrderConfirmationEmailHtml(request.user!.email, newOrder),
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    return NextResponse.json({
      message: 'Order created successfully',
      order: newOrder,
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