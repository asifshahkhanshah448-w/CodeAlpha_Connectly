import { NextResponse } from 'next/server';
import { getDbStatus } from '@/lib/db';

export async function GET() {
  const db = getDbStatus();
  return NextResponse.json({
    status: 'ok',
    service: 'Connectly Social API',
    uptime: process.uptime(),
    database: {
      connected: db.connected,
      atlasConfigured: db.uriConfigured,
      readyState: db.readyState,
      error: db.error,
    },
    timestamp: new Date().toISOString(),
  });
}
