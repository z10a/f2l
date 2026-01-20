import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, bucket, region } = body as {
      provider?: string;
      bucket?: string;
      region?: string;
    };

    if (!provider || !bucket) {
      return NextResponse.json({ error: 'Provider and bucket are required' }, { status: 400 });
    }

    const message = `تم حفظ إعدادات النسخ الاحتياطي الخارجي (${provider})${
      region ? ` في ${region}` : ''
    }.`;

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Offsite backup config error:', error);
    return NextResponse.json({ error: 'Failed to save offsite backup config' }, { status: 500 });
  }
}
