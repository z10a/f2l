import { NextRequest, NextResponse } from 'next/server';

const inferPreviewInfo = (url: string) => {
  const normalized = url.toLowerCase();
  if (normalized.includes('2160') || normalized.includes('4k')) {
    return { resolution: '3840x2160', bitrateKbps: 18000, codec: 'H.265' };
  }
  if (normalized.includes('1080') || normalized.includes('fhd')) {
    return { resolution: '1920x1080', bitrateKbps: 8000, codec: 'H.264' };
  }
  if (normalized.includes('720') || normalized.includes('hd')) {
    return { resolution: '1280x720', bitrateKbps: 4500, codec: 'H.264' };
  }
  return { resolution: '854x480', bitrateKbps: 1800, codec: 'H.264' };
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body as { url?: string };

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const start = Date.now();

    try {
      await fetch(url, { method: 'HEAD', signal: controller.signal });
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to reach stream URL' },
        { status: 502 }
      );
    } finally {
      clearTimeout(timeout);
    }

    const latencyMs = Date.now() - start;
    const info = inferPreviewInfo(url);

    return NextResponse.json({
      ...info,
      latencyMs,
    });
  } catch (error) {
    console.error('Error fetching preview info:', error);
    return NextResponse.json({ error: 'Failed to fetch preview info' }, { status: 500 });
  }
}
