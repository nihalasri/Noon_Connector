import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { getCustomers } from '@/lib/store';

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error_code: 'AUTH_FAILED', message: auth.error },
      { status: 401 }
    );
  }

  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  const result = await getCustomers(limit, page);

  return NextResponse.json({
    success: true,
    data: {
      customers: result.customers,
      pagination: {
        total: result.total,
        page,
        limit,
        total_pages: Math.ceil(result.total / limit)
      }
    }
  });
}
