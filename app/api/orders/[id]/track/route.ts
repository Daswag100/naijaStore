import { NextRequest, NextResponse } from 'next/server';
import { orders } from '@/lib/database';
import { withAuth, handleCors, AuthenticatedRequest } from '@/lib/middleware';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export const GET = withAuth(async (request: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  try {
    const order = orders.find(
      o => o.id === params.id && o.userId === request.user!.userId
    );

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Mock tracking information
    const trackingInfo = {
      orderId: order.id,
      status: order.status,
      trackingNumber: order.trackingNumber,
      estimatedDelivery: order.estimatedDelivery,
      timeline: [
        {
          status: 'pending',
          description: 'Order placed',
          timestamp: order.createdAt,
          completed: true,
        },
        {
          status: 'confirmed',
          description: 'Order confirmed',
          timestamp: order.status !== 'pending' ? new Date(order.createdAt.getTime() + 60 * 60 * 1000) : null,
          completed: ['confirmed', 'processing', 'shipped', 'delivered'].includes(order.status),
        },
        {
          status: 'processing',
          description: 'Order being processed',
          timestamp: ['processing', 'shipped', 'delivered'].includes(order.status) ? new Date(order.createdAt.getTime() + 2 * 60 * 60 * 1000) : null,
          completed: ['processing', 'shipped', 'delivered'].includes(order.status),
        },
        {
          status: 'shipped',
          description: 'Order shipped',
          timestamp: ['shipped', 'delivered'].includes(order.status) ? new Date(order.createdAt.getTime() + 24 * 60 * 60 * 1000) : null,
          completed: ['shipped', 'delivered'].includes(order.status),
        },
        {
          status: 'delivered',
          description: 'Order delivered',
          timestamp: order.status === 'delivered' ? new Date(order.createdAt.getTime() + 3 * 24 * 60 * 60 * 1000) : null,
          completed: order.status === 'delivered',
        },
      ],
    };

    return NextResponse.json({ tracking: trackingInfo });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});