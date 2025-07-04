// File: /app/api/addresses/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { withAuth, handleCors, AuthenticatedRequest } from '@/lib/middleware';

// Address schema for updates
const updateAddressSchema = z.object({
  name: z.string().optional(),
  street: z.string().min(1, 'Street address is required').optional(),
  city: z.string().min(1, 'City is required').optional(),
  state: z.string().min(1, 'State is required').optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export const PUT = withAuth(async (request: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  try {
    const body = await request.json();
    const userId = request.user!.userId;
    const addressId = params.id;
    
    console.log('📝 Updating address:', addressId, 'for user:', userId);
    console.log('📝 Update data:', body);
    
    const validatedData = updateAddressSchema.parse(body);

    // Verify the address belongs to the user
    const { data: existingAddress } = await supabaseAdmin
      .from('user_addresses')
      .select('*')
      .eq('id', addressId)
      .eq('user_id', userId)
      .single();

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Address not found or unauthorized' },
        { status: 404 }
      );
    }

    // If setting as default, unset other defaults first
    if (validatedData.isDefault) {
      console.log('🔄 Unsetting other default addresses...');
      await supabaseAdmin
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    // Update the address
    const updateData: any = {};

    if (validatedData.street) updateData.address_line1 = validatedData.street;
    if (validatedData.city) updateData.city = validatedData.city;
    if (validatedData.state) updateData.state = validatedData.state;
    if (validatedData.country) updateData.country = validatedData.country;
    if (validatedData.isDefault !== undefined) updateData.is_default = validatedData.isDefault;

    console.log('💾 Updating with data:', updateData);

    const { data: updatedAddress, error } = await supabaseAdmin
      .from('user_addresses')
      .update(updateData)
      .eq('id', addressId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating address:', error);
      return NextResponse.json(
        { error: 'Failed to update address', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Address updated successfully:', updatedAddress.id);
    return NextResponse.json({
      message: 'Address updated successfully',
      address: updatedAddress,
    });

  } catch (error) {
    console.error('❌ Error updating address:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (request: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  try {
    const userId = request.user!.userId;
    const addressId = params.id;
    
    console.log('🗑️ Deleting address:', addressId, 'for user:', userId);

    // Verify the address belongs to the user
    const { data: existingAddress } = await supabaseAdmin
      .from('user_addresses')
      .select('*')
      .eq('id', addressId)
      .eq('user_id', userId)
      .single();

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Address not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete the address
    const { error } = await supabaseAdmin
      .from('user_addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Error deleting address:', error);
      return NextResponse.json(
        { error: 'Failed to delete address', details: error.message },
        { status: 500 }
      );
    }

    // If we deleted the default address, make another one default if any exist
    if (existingAddress.is_default) {
      const { data: remainingAddresses } = await supabaseAdmin
        .from('user_addresses')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (remainingAddresses && remainingAddresses.length > 0) {
        await supabaseAdmin
          .from('user_addresses')
          .update({ is_default: true })
          .eq('id', remainingAddresses[0].id);
      }
    }

    console.log('✅ Address deleted successfully');
    return NextResponse.json({
      message: 'Address deleted successfully',
    });

  } catch (error) {
    console.error('❌ Error deleting address:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
});