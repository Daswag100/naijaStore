import { NextRequest, NextResponse } from 'next/server';
import { productSchema } from '@/lib/validation';
import { getProducts, createProduct } from '@/lib/database';
import { withAdminAuth, handleCors, AuthenticatedRequest } from '@/lib/middleware';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Products API called...');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    
    console.log('📊 Query params:', { page, limit, category, search });

    // Use Supabase function
    const result = await getProducts({
      page,
      limit,
      category,
      search,
    });

    console.log('✅ Database result:', result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withAdminAuth(async (request: AuthenticatedRequest) => {
  try {
    console.log('📝 Creating new product...');
    
    const body = await request.json();
    const validatedData = productSchema.parse(body);

    const newProduct = await createProduct({
      name: validatedData.name,
      slug: validatedData.name.toLowerCase().replace(/\s+/g, '-'),
      description: validatedData.description,
      price: validatedData.price,
      compare_price: validatedData.originalPrice,
      sku: `SKU-${Date.now()}`,
      inventory_quantity: validatedData.stockQuantity,
      category_id: validatedData.category,
      images: validatedData.images || [],
    });

    console.log('✅ Product created:', newProduct);

    return NextResponse.json({
      message: 'Product created successfully',
      product: newProduct,
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Product creation error:', error);
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