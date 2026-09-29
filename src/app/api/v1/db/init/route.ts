import { NextResponse } from 'next/server';
import { ensureDatabaseReady, getDatabaseStatus } from '@/lib/store';

export async function POST() {
  try {
    const isReady = await ensureDatabaseReady();
    const status = await getDatabaseStatus();

    return NextResponse.json({
      success: true,
      ready: isReady,
      message: isReady
        ? 'Vercel Postgres tables verified and seeded successfully.'
        : 'Running in Local Fallback mode (no POSTGRES_URL detected).',
      status
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to initialize database'
      },
      { status: 500 }
    );
  }
}
