import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { getSellerConfig, dispatchWebhook, getOrders } from '@/lib/store';

export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error_code: 'AUTH_FAILED', message: auth.error },
      { status: 401 }
    );
  }

  const config = await getSellerConfig();
  if (!config.webhook_url) {
    return NextResponse.json(
      {
        success: false,
        error_code: 'NO_WEBHOOK_URL',
        message: 'No webhook URL configured. Please set a Zoho CRM webhook endpoint in the Seller Lab Developer settings.'
      },
      { status: 400 }
    );
  }

  const orderResult = await getOrders({ limit: 1 });
  const sampleOrder = orderResult.orders[0] || null;

  const testPayload = {
    event: 'order.created',
    event_id: 'evt_test_' + Date.now(),
    timestamp: new Date().toISOString(),
    seller_identifier: config.seller_identifier,
    data: sampleOrder || {
      order_id: 'NON-2026-TEST01',
      order_nr: 'TEST01',
      status: 'CONFIRMED',
      total_amount: 4799,
      currency: 'AED',
      customer: {
        name: 'Zoho Test Customer',
        email: 'test@zoho-noon-demo.com',
        phone: '+971 50 123 4567'
      }
    }
  };

  const logResult = await dispatchWebhook('order.created', testPayload);

  return NextResponse.json({
    success: true,
    message: logResult?.success
      ? `Test webhook sent to ${config.webhook_url} with HTTP ${logResult.status_code}`
      : `Test webhook dispatched to ${config.webhook_url} (HTTP ${logResult?.status_code || 'error'})`,
    result: logResult
  });
}
