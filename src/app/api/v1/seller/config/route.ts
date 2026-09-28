import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { getSellerConfig, updateSellerConfig } from '@/lib/store';

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error_code: 'AUTH_FAILED', message: auth.error },
      { status: 401 }
    );
  }

  const config = getSellerConfig();
  return NextResponse.json({
    success: true,
    config
  });
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
    const updated = updateSellerConfig({
      webhook_url: body.webhook_url,
      webhook_secret: body.webhook_secret,
      webhook_events: body.webhook_events,
      store_name: body.store_name,
      email: body.email,
      phone: body.phone,
      api_key: body.api_key
    });

    return NextResponse.json({
      success: true,
      message: 'Seller configuration updated successfully.',
      config: updated
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error_code: 'SERVER_ERROR', message: err.message },
      { status: 500 }
    );
  }
}
