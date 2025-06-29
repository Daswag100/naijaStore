import { NextRequest, NextResponse } from 'next/server';
import { categorySchema } from '@/lib/validation';
import { categories, generateId } from '@/lib/database';
import { withAdminAuth, handleCors, AuthenticatedRequest } from '@/lib/middleware';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      categories,
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withAdminAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();
    const validatedData = categorySchema.parse(body);

    const newCategory = {
      id: generateId(),
      ...validatedData,
      createdAt: new Date(),
    };

    categories.push(newCategory);

    return NextResponse.json({
      message: 'Category created successfully',
      category: newCategory,
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