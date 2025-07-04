import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Categories API called...');
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }

    console.log('✅ Categories fetched from DB:', categories?.length || 0);

    return NextResponse.json({
      categories: categories || [],
    });

  } catch (error) {
    console.error('❌ Categories API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Creating new category...');
    
    const body = await request.json();
    
    const { data: newCategory, error } = await supabase
      .from('categories')
      .insert([{
        name: body.name,
        slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-'),
        description: body.description,
        image_url: body.image_url,
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }

    console.log('✅ Category created:', newCategory);

    return NextResponse.json({
      message: 'Category created successfully',
      category: newCategory,
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Category creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}