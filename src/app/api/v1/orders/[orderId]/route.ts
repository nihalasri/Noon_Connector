import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { getOrderById, deleteOrder } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

export async function DELETE(
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
  const deleted = await deleteOrder(orderId);

  if (!deleted) {
    return NextResponse.json(
      {
        success: false,
        error_code: 'ORDER_NOT_FOUND',
        message: `Order with ID '${orderId}' was not found or could not be deleted.`
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `Order '${orderId}' was permanently deleted.`
  });
}
