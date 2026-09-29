import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { getOrders, createOrder } from '@/lib/store';

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
  const status = searchParams.get('status') || undefined;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  const result = await getOrders({ status, page, limit });

  return NextResponse.json({
    success: true,
    data: {
      orders: result.orders,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: Math.ceil(result.total / result.limit)
      }
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.customer || !body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error_code: 'INVALID_PAYLOAD',
          message: 'Order must contain customer details and at least one item.'
        },
        { status: 400 }
      );
    }

    const order = await createOrder({
      customer: body.customer,
      items: body.items,
      payment_method: body.payment_method || 'CARD'
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Order created successfully on Noon marketplace.',
        order
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error_code: 'SERVER_ERROR', message: err.message },
      { status: 500 }
    );
  }
}
