import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { updateProductPrice, getProductBySku } from '@/lib/store';

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
    if (!body.sku || typeof body.price !== 'number') {
      return NextResponse.json(
        { success: false, message: 'Both sku and numeric price are required' },
        { status: 400 }
      );
    }

    const existing = getProductBySku(body.sku);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: `SKU ${body.sku} not found` },
        { status: 404 }
      );
    }

    const updated = updateProductPrice(body.sku, body.price);

    return NextResponse.json({
      success: true,
      message: `Price for ${body.sku} updated to ${body.price} AED`,
      product: updated
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error_code: 'SERVER_ERROR', message: err.message },
      { status: 500 }
    );
  }
}
