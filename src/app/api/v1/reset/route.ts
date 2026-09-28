import { NextResponse } from 'next/server';
import { resetStore } from '@/lib/store';

export async function POST() {
  resetStore();
  return NextResponse.json({
    success: true,
    message: 'Storefront, Orders, and Seller Lab data reset to initial seed state.'
  });
}
