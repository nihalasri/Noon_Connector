import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { getSellerConfig, updateSellerConfig, dispatchWebhook, getOrders } from '@/lib/store';

export const maxDuration = 60; // Allow webhook dispatch + Zoho Deluge cold start to complete

export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error_code: 'AUTH_FAILED', message: auth.error },
      { status: 401 }
    );
  }

  let bodyUrl = '';
  try {
    const body = await req.json();
    if (body && typeof body.url === 'string') {
      bodyUrl = body.url.trim();
    }
  } catch {
    // Body is empty or not JSON
  }

  const config = await getSellerConfig();
  const targetUrl = (bodyUrl && bodyUrl.startsWith('http')) ? bodyUrl : config.webhook_url;

  if (!targetUrl) {
    return NextResponse.json(
      {
        success: false,
        error_code: 'NO_WEBHOOK_URL',
        message: 'No webhook URL configured or provided. Please enter a Zoho CRM webhook endpoint URL.'
      },
      { status: 400 }
    );
  }

  // Ensure this URL is stored permanently in the database
  if (bodyUrl && bodyUrl.startsWith('http') && bodyUrl !== config.webhook_url) {
    try {
      await updateSellerConfig({ webhook_url: bodyUrl });
    } catch (saveErr) {
      console.error('Failed to auto-save webhook URL to DB during test:', saveErr);
    }
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

  const logResult = await dispatchWebhook('order.created', testPayload, targetUrl);

  return NextResponse.json({
    success: true,
    message: logResult?.success
      ? `Test webhook sent to ${targetUrl} with HTTP ${logResult.status_code}`
      : `Test webhook dispatched to ${targetUrl} (HTTP ${logResult?.status_code || 'error'})`,
    result: logResult
  });
}
