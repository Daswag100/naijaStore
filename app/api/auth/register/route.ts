
import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase';
import { handleCors } from '@/lib/middleware';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Registration attempt...');
    
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    console.log('📧 Creating user in Supabase Auth:', validatedData.email);

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: true, // Auto-confirm email for simplicity, you might want to change this
      user_metadata: {
        name: validatedData.name,
        phone: validatedData.phone,
      }
    });

    if (authError) {
      console.error('❌ Supabase registration error:', authError.message);
      if (authError.message.includes('unique constraint')) {
        return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
        return NextResponse.json({ error: 'User creation failed, please try again.' }, { status: 500 });
    }

    console.log('✅ User created in Supabase Auth, ID:', authData.user.id);
    console.log('✍️ Inserting user into public.users table');

    // Also insert into the public users table
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: validatedData.email,
        name: validatedData.name,
        phone: validatedData.phone,
      });

    if (dbError) {
        console.error('❌ Database insert error:', dbError.message);
        // This is a problem, the user exists in auth but not in our public table.
        // You might want to add more robust error handling here, like deleting the auth user.
        return NextResponse.json({ error: 'Failed to save user profile information.' }, { status: 500 });
    }
    
    console.log('✅ User profile created successfully in public.users');

    return NextResponse.json({
      message: 'User created successfully.',
      userId: authData.user.id,
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Registration error:', error);
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
