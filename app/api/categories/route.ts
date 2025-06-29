import { NextRequest, NextResponse } from 'next/server';
import { getCategories, createCategory } from '@/lib/database';
import { withAdminAuth, handleCors, AuthenticatedRequest } from '@/lib/middleware';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Categories API called...');
    
    const categories = await getCategories();
    
    console.log('✅ Categories fetched:', categories?.length || 0);

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

export const POST = withAdminAuth(async (request: AuthenticatedRequest) => {
  try {
    console.log('📝 Creating new category...');
    
    const body = await request.json();
    
    const newCategory = await createCategory({
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-'),
      description: body.description,
      image_url: body.image_url,
    });

    console.log('✅ Category created:', newCategory);

    return NextResponse.json({
      message: 'Category created successfully',
      category: newCategory,
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Category creation error:', error);
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