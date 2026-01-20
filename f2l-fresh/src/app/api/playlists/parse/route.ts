import { NextRequest, NextResponse } from 'next/server';
import { parseM3U } from '@/lib/parsers/m3u-parser';

/**
 * Parse M3U playlist and return channel list
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playlistUrl, playlistContent } = body;

    if (!playlistUrl && !playlistContent) {
      return NextResponse.json(
        { error: 'Either playlistUrl or playlistContent is required' },
        { status: 400 }
      );
    }

    // Parse the playlist
    const parsedData = await parseM3U(playlistUrl || playlistContent);

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Error parsing playlist:', error);
    return NextResponse.json(
      { error: 'Failed to parse playlist' },
      { status: 500 }
    );
  }
}
