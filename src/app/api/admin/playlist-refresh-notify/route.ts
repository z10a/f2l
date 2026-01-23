import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, playlistName, playlistUrl, error } = body;

    if (!email || !playlistName || !playlistUrl) {
      return NextResponse.json(
        { error: 'Missing required notification fields' },
        { status: 400 }
      );
    }

    console.warn('Playlist refresh notification queued', {
      email,
      playlistName,
      playlistUrl,
      error,
    });

    return NextResponse.json({ status: 'queued' });
  } catch (notifyError) {
    console.error('Failed to queue playlist refresh notification:', notifyError);
    return NextResponse.json(
      { error: 'Failed to queue notification' },
      { status: 500 }
    );
  }
}
