import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { getSellerConfig } from '@/lib/store';

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return NextResponse.json(
      {
        success: false,
        error_code: 'AUTH_FAILED',
        message: auth.error
      },
      { status: 401 }
    );
  }

  const config = getSellerConfig();
  return NextResponse.json({
    success: true,
    message: 'Noon Partner API connection established successfully.',
    partner: {
      seller_identifier: config.seller_identifier,
      project_id: config.project_id,
      store_name: config.store_name,
      legal_name: config.legal_name,
      country: config.country,
      currency: config.currency,
      email: config.email,
      phone: config.phone,
      vat_number: config.vat_number,
      fulfillment_model: 'FBP',
      status: 'ACTIVE'
    }
  });
}
