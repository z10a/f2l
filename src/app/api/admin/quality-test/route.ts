import { NextRequest, NextResponse } from 'next/server';

const inferQuality = (url: string) => {
  const normalized = url.toLowerCase();
  if (normalized.includes('2160') || normalized.includes('4k')) {
    return { label: '4K', resolution: '3840x2160', bitrateKbps: 18000 };
  }
  if (normalized.includes('1080') || normalized.includes('fhd')) {
    return { label: 'FHD', resolution: '1920x1080', bitrateKbps: 8000 };
  }
  if (normalized.includes('720') || normalized.includes('hd')) {
    return { label: 'HD', resolution: '1280x720', bitrateKbps: 4500 };
  }
  return { label: 'SD', resolution: '854x480', bitrateKbps: 1800 };
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
    const { label, resolution, bitrateKbps } = inferQuality(url);
    const bufferMs = Math.min(3000, Math.max(450, Math.round(latencyMs * 1.4)));

    return NextResponse.json({
      qualityLabel: label,
      resolution,
      bitrateKbps,
      latencyMs,
      bufferMs,
    });
  } catch (error) {
    console.error('Error testing quality:', error);
    return NextResponse.json({ error: 'Failed to test quality' }, { status: 500 });
  }
}
