import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { getSellerConfig, updateSellerConfig } from '@/lib/store';

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

  const config = await getSellerConfig();
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
    const updates: any = {};
    if (typeof body.webhook_url === 'string') updates.webhook_url = body.webhook_url.trim();
    if (typeof body.webhook_secret === 'string') updates.webhook_secret = body.webhook_secret;
    if (Array.isArray(body.webhook_events)) updates.webhook_events = body.webhook_events;
    if (typeof body.store_name === 'string') updates.store_name = body.store_name;
    if (typeof body.legal_name === 'string') updates.legal_name = body.legal_name;
    if (typeof body.email === 'string') updates.email = body.email;
    if (typeof body.phone === 'string') updates.phone = body.phone;
    if (typeof body.country === 'string') updates.country = body.country;
    if (typeof body.city === 'string') updates.city = body.city;
    if (typeof body.currency === 'string') updates.currency = body.currency;
    if (typeof body.vat_number === 'string') updates.vat_number = body.vat_number;
    if (typeof body.api_key === 'string') updates.api_key = body.api_key;
    if (typeof body.project_id === 'string') updates.project_id = body.project_id;
    if (typeof body.seller_identifier === 'string') updates.seller_identifier = body.seller_identifier;

    const updated = await updateSellerConfig(updates);

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
