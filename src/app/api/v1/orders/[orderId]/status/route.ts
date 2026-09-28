import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { updateOrderStatus, getOrderById } from '@/lib/store';
import { OrderStatus } from '@/lib/types';

export async function PUT(
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
  const order = getOrderById(orderId);

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

  try {
    const body = await req.json();
    const validStatuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    const newStatus = (body.status || '').toUpperCase() as OrderStatus;

    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          error_code: 'INVALID_STATUS',
          message: `Invalid status '${body.status}'. Valid statuses are: ${validStatuses.join(', ')}`
        },
        { status: 400 }
      );
    }

    const updated = await updateOrderStatus(orderId, newStatus, {
      tracking_number: body.tracking_number || body.awb_number,
      carrier: body.carrier
    });

    return NextResponse.json({
      success: true,
      message: `Order ${orderId} status updated to ${newStatus}`,
      order: updated
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error_code: 'SERVER_ERROR', message: err.message },
      { status: 500 }
    );
  }
}
