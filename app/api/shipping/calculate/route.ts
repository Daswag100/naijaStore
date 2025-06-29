import { NextRequest, NextResponse } from 'next/server';
import { calculateShippingSchema } from '@/lib/validation';
import { shippingZones } from '@/lib/database';
import { handleCors } from '@/lib/middleware';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = calculateShippingSchema.parse(body);

    // Find shipping zone for the state
    const zone = shippingZones.find(z => 
      z.states.includes(validatedData.state)
    );

    if (!zone) {
      return NextResponse.json(
        { error: 'Shipping not available to this location' },
        { status: 400 }
      );
    }

    const shippingCost = zone.baseCost + (zone.perKgCost * validatedData.weight);
    const estimatedDelivery = new Date(Date.now() + zone.estimatedDays * 24 * 60 * 60 * 1000);

    return NextResponse.json({
      zone: zone.name,
      cost: shippingCost,
      estimatedDays: zone.estimatedDays,
      estimatedDelivery,
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
}