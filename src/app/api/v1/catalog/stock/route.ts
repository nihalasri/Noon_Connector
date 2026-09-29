import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { updateProductStock, getProductBySku, dispatchWebhook } from '@/lib/store';

export const maxDuration = 60; // Allow webhook dispatch + Zoho Deluge cold start to complete

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

    // Support single update or batch updates
    const updates = Array.isArray(body.updates)
      ? body.updates
      : body.sku
      ? [{ sku: body.sku, stock: body.stock }]
      : null;

    if (!updates || updates.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error_code: 'INVALID_PAYLOAD',
          message: 'Please provide sku and stock, or an updates array [{ sku, stock }].'
        },
        { status: 400 }
      );
    }

    const results = [];
    for (const item of updates) {
      if (!item.sku || typeof item.stock !== 'number') {
        continue;
      }
      const existing = await getProductBySku(item.sku);
      if (existing) {
        const updated = await updateProductStock(item.sku, item.stock);
        results.push({
          sku: item.sku,
          updated: true,
          previous_stock: existing.stock,
          new_stock: updated?.stock
        });

        // Trigger stock updated event
        dispatchWebhook('inventory.stock_updated', {
          event: 'inventory.stock_updated',
          sku: item.sku,
          previous_stock: existing.stock,
          new_stock: updated?.stock,
          timestamp: new Date().toISOString()
        }).catch(console.error);
      } else {
        results.push({
          sku: item.sku,
          updated: false,
          error: 'SKU not found in catalog'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Stock updated for ${results.filter(r => r.updated).length} product(s).`,
      results
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error_code: 'SERVER_ERROR', message: err.message },
      { status: 500 }
    );
  }
}
