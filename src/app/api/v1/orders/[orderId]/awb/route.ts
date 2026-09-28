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
  const order = getOrderById(orderId);

  if (!order) {
    return NextResponse.json(
      { success: false, error_code: 'ORDER_NOT_FOUND', message: `Order ${orderId} not found` },
      { status: 404 }
    );
  }

  const { searchParams } = req.nextUrl;
  const format = searchParams.get('format');

  if (format === 'html') {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Noon Shipping Label - ${order.fulfillment.awb_number}</title>
  <style>
    body { font-family: monospace, sans-serif; padding: 20px; max-width: 500px; margin: 0 auto; border: 2px solid #000; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px; }
    .logo { font-size: 24px; font-weight: bold; background: #feee00; padding: 4px 10px; display: inline-block; }
    .awb { font-size: 18px; font-weight: bold; margin: 15px 0 5px; }
    .barcode { background: repeating-linear-gradient(90deg, #000, #000 3px, #fff 3px, #fff 6px); height: 50px; margin: 10px 0; }
    .section { border-bottom: 1px dashed #000; padding: 8px 0; font-size: 13px; }
    .badge { display: inline-block; background: #38ae04; color: #fff; font-size: 11px; padding: 2px 6px; font-weight: bold; border-radius: 3px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">noon express</div>
    <div><strong>STANDARD EXPRESS</strong><br>UAE DOMESTIC</div>
  </div>
  <div class="awb">AWB: ${order.fulfillment.awb_number}</div>
  <div class="barcode"></div>
  <div class="section">
    <strong>ORDER ID:</strong> ${order.order_id} (Ref: ${order.order_nr})<br>
    <strong>DATE:</strong> ${order.order_date.slice(0, 10)} | <strong>PAYMENT:</strong> ${order.payment_method} (${order.payment_status})
  </div>
  <div class="section">
    <strong>SHIP TO:</strong><br>
    ${order.customer.name}<br>
    ${order.customer.phone}<br>
    ${order.customer.address_line1}, ${order.customer.city}<br>
    ${order.customer.country}
  </div>
  <div class="section">
    <strong>ITEMS (${order.items.length}):</strong><br>
    ${order.items.map(it => `- ${it.quantity}x [${it.sku}] ${it.title.slice(0, 35)}...`).join('<br>')}
  </div>
  <div style="margin-top: 15px; text-align: center; font-size: 11px;">
    Carrier: ${order.fulfillment.carrier} | Powered by Noon Logistics Emulator
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  return NextResponse.json({
    success: true,
    data: {
      order_id: order.order_id,
      awb_number: order.fulfillment.awb_number,
      carrier: order.fulfillment.carrier,
      tracking_url: order.fulfillment.tracking_url,
      label_url: `/api/v1/orders/${order.order_id}/awb?format=html&demo=true`,
      customer: order.customer,
      items_count: order.items.length
    }
  });
}
