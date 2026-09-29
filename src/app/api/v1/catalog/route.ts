import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { getProducts, addProduct, updateProduct } from '@/lib/store';
import { Product } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error_code: 'AUTH_FAILED', message: auth.error },
      { status: 401 }
    );
  }

  const { searchParams } = req.nextUrl;
  const category = searchParams.get('category');
  const search = searchParams.get('search')?.toLowerCase();

  const products = await getProducts({
    category: category || undefined,
    search: search || undefined
  });

  return NextResponse.json({
    success: true,
    data: {
      products,
      total_count: products.length
    }
  });
}

export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error_code: 'AUTH_FAILED', message: auth.error },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    if (!body.title || body.price === undefined || body.price === null || body.price === '') {
      return NextResponse.json(
        { success: false, message: 'Product title and price are required' },
        { status: 400 }
      );
    }

    const sku = body.sku?.trim() || `N${Math.floor(10000000 + Math.random() * 90000000)}A`;
    const newProduct: Product = {
      sku,
      title: String(body.title).trim(),
      title_ar: body.title_ar?.trim() || String(body.title).trim(),
      brand: body.brand?.trim() || 'Generic',
      category: body.category?.trim() || 'General',
      price: Number(body.price),
      original_price: Number(body.original_price || body.price),
      currency: body.currency?.trim() || 'AED',
      stock: Number(body.stock ?? 10),
      image: body.image?.trim() || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
      rating: body.rating ? Number(body.rating) : 4.5,
      rating_count: body.rating_count ? Number(body.rating_count) : 5,
      is_express: body.is_express !== undefined ? Boolean(body.is_express) : true,
      barcode: body.barcode?.trim() || String(Math.floor(1000000000000 + Math.random() * 9000000000000)),
      description: body.description?.trim() || String(body.title).trim()
    };

    const created = await addProduct(newProduct);

    return NextResponse.json({
      success: true,
      message: 'Product added to Noon catalog successfully',
      product: created
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error_code: 'SERVER_ERROR', message: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error_code: 'AUTH_FAILED', message: auth.error },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    if (!body.sku) {
      return NextResponse.json(
        { success: false, message: 'Product SKU is required for updates' },
        { status: 400 }
      );
    }

    const updates: Partial<Product> = {};
    if (body.title !== undefined) updates.title = String(body.title).trim();
    if (body.title_ar !== undefined) updates.title_ar = String(body.title_ar).trim();
    if (body.brand !== undefined) updates.brand = String(body.brand).trim();
    if (body.category !== undefined) updates.category = String(body.category).trim();
    if (body.price !== undefined) updates.price = Number(body.price);
    if (body.original_price !== undefined) updates.original_price = Number(body.original_price);
    if (body.stock !== undefined) updates.stock = Number(body.stock);
    if (body.image !== undefined) updates.image = String(body.image).trim();
    if (body.barcode !== undefined) updates.barcode = String(body.barcode).trim();
    if (body.description !== undefined) updates.description = String(body.description).trim();
    if (body.is_express !== undefined) updates.is_express = Boolean(body.is_express);

    const updated = await updateProduct(body.sku, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: `Product with SKU ${body.sku} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product: updated
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error_code: 'SERVER_ERROR', message: err.message },
      { status: 500 }
    );
  }
}
