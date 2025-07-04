// File: /app/api/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { withAuth, handleCors, AuthenticatedRequest } from '@/lib/middleware';

// Profile update schema
const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().optional(),
});

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = request.user!.userId;
    console.log('🔍 Fetching profile for user:', userId);

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, phone, is_guest, guest_session_id, created_at')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ Error fetching user profile:', error);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ Profile fetched successfully:', user.name);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        isGuest: user.is_guest,
        createdAt: user.created_at,
      },
    });

  } catch (error) {
    console.error('❌ Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const PUT = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();
    const userId = request.user!.userId;
    
    console.log('📝 Updating profile for user:', userId);
    console.log('📝 Update data:', body);

    const validatedData = updateProfileSchema.parse(body);

    // Remove undefined values to avoid updating with null
    const updateData: any = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.email !== undefined) updateData.email = validatedData.email;
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone;

    // Update user in database
    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, email, name, phone, is_guest, created_at')
      .single();

    if (error) {
      console.error('❌ Error updating user profile:', error);
      
      // Handle specific errors
      if (error.code === '23505' && error.message.includes('email')) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to update profile', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Profile updated successfully:', updatedUser.name);

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone,
        isGuest: updatedUser.is_guest,
        createdAt: updatedUser.created_at,
      },
    });

  } catch (error) {
    console.error('❌ Profile update error:', error);
    
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