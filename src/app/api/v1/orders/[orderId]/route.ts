import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { getOrderById } from '@/lib/store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error_code: 'AUTH_FAILED', message: auth.error },
      { status: 401 }
    );
  }

  const { orderId } = await params;
  const order = await getOrderById(orderId);

  if (!order) {
    return NextResponse.json(
      {
        success: false,
        error_code: 'ORDER_NOT_FOUND',
        message: `Order with ID '${orderId}' was not found.`
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      order
    }
  });
}
