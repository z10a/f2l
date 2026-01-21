import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, zoneId, cacheTtl, enabled } = body as {
      provider?: string;
      zoneId?: string;
      cacheTtl?: number;
      enabled?: boolean;
    };

    if (!provider || !zoneId) {
      return NextResponse.json({ error: 'Provider and Zone ID are required' }, { status: 400 });
    }

    const message = enabled
      ? `تم تفعيل ${provider} مع مدة كاش ${cacheTtl ?? 3600} ثانية.`
      : `تم حفظ إعدادات ${provider} بدون تفعيل النشر.`;

    return NextResponse.json({ message });
  } catch (error) {
    console.error('CDN config error:', error);
    return NextResponse.json({ error: 'Failed to save CDN config' }, { status: 500 });
  }
}
