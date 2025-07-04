// File: /app/api/addresses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { withAuth, handleCors, AuthenticatedRequest } from '@/lib/middleware';

// Address schema
const addressSchema = z.object({
  name: z.string().optional(),
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().optional(),
  country: z.string().default('Nigeria'),
  isDefault: z.boolean().default(false),
});

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = request.user!.userId;
    console.log('🔍 Fetching addresses for user:', userId);

    const { data: addresses, error } = await supabaseAdmin
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });

    if (error) {
      console.error('Error fetching addresses:', error);
      return NextResponse.json({ addresses: [] });
    }

    console.log('✅ Found addresses:', addresses?.length || 0);
    return NextResponse.json({ addresses: addresses || [] });

  } catch (error) {
    console.error('Address fetch error:', error);
    return NextResponse.json({ addresses: [] });
  }
});

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();
    const userId = request.user!.userId;
    
    console.log('📝 Creating address for user:', userId);
    console.log('📝 Address data:', body);
    
    const addressData = {
      street: body.street || '',
      city: body.city || '',
      state: body.state || '',
      country: body.country || 'Nigeria',
      isDefault: body.isDefault || false,
    };

    const validatedData = addressSchema.parse(addressData);

    // Check if this is the user's first address - if so, make it default
    const { data: userAddresses } = await supabaseAdmin
      .from('user_addresses')
      .select('id')
      .eq('user_id', userId);

    const isFirstAddress = !userAddresses || userAddresses.length === 0;
    const shouldBeDefault = validatedData.isDefault || isFirstAddress;

    // If this is set as default, unset other defaults first
    if (shouldBeDefault) {
      console.log('🔄 Unsetting other default addresses...');
      await supabaseAdmin
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    // Create the address with only the fields that exist in your table
    console.log('💾 Inserting new address...');
    const insertData = {
      user_id: userId,
      address_line1: validatedData.street,
      city: validatedData.city,
      state: validatedData.state,
      country: validatedData.country,
      is_default: shouldBeDefault,
    };
    
    console.log('📝 Insert data:', insertData);
    
    const { data: address, error } = await supabaseAdmin
      .from('user_addresses')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating address:', error);
      return NextResponse.json(
        { 
          error: 'Failed to create address', 
          details: error.message
        },
        { status: 500 }
      );
    }

    console.log('✅ Address created successfully:', address);
    return NextResponse.json({
      message: 'Address created successfully',
      address,
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error in POST:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
});