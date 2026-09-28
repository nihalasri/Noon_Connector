import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { getProducts, addProduct } from '@/lib/store';
import { Product } from '@/lib/types';

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

  let products = getProducts();

  if (category) {
    products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }
  if (search) {
    products = products.filter(
      p =>
        p.title.toLowerCase().includes(search) ||
        p.sku.toLowerCase().includes(search) ||
        p.brand.toLowerCase().includes(search)
    );
  }

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
    if (!body.title || !body.price) {
      return NextResponse.json(
        { success: false, message: 'Product title and price are required' },
        { status: 400 }
      );
    }

    const sku = body.sku || `N${Math.floor(10000000 + Math.random() * 90000000)}A`;
    const newProduct: Product = {
      sku,
      title: body.title,
      title_ar: body.title_ar || body.title,
      brand: body.brand || 'Generic',
      category: body.category || 'General',
      price: Number(body.price),
      original_price: Number(body.original_price || body.price),
      currency: body.currency || 'AED',
      stock: Number(body.stock ?? 10),
      image: body.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
      rating: 4.5,
      rating_count: 1,
      is_express: body.is_express ?? true,
      barcode: body.barcode || String(Date.now()),
      description: body.description || body.title
    };

    const created = addProduct(newProduct);

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
