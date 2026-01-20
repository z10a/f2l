import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all ads
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const streamId = searchParams.get('streamId');
    const position = searchParams.get('position');
    const active = searchParams.get('active');

    const ads = await db.ad.findMany({
      where: {
        ...(streamId ? { streamId } : {}),
        ...(position ? { position } : {}),
        ...(active ? { active: active === 'true' } : {})
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(ads);
  } catch (error) {
    console.error('Error fetching ads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ads' },
      { status: 500 }
    );
  }
}

// POST create new ad
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { streamId, position, title, imageUrl, linkUrl, active } = body;

    const ad = await db.ad.create({
      data: {
        streamId,
        position,
        title,
        imageUrl,
        linkUrl,
        active: active !== undefined ? active : true
      }
    });

    return NextResponse.json(ad, { status: 201 });
  } catch (error) {
    console.error('Error creating ad:', error);
    return NextResponse.json(
      { error: 'Failed to create ad' },
      { status: 500 }
    );
  }
}

// PUT update ad
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, streamId, position, title, imageUrl, linkUrl, active } = body;

    const ad = await db.ad.update({
      where: { id },
      data: {
        streamId,
        position,
        title,
        imageUrl,
        linkUrl,
        active
      }
    });

    return NextResponse.json(ad);
  } catch (error) {
    console.error('Error updating ad:', error);
    return NextResponse.json(
      { error: 'Failed to update ad' },
      { status: 500 }
    );
  }
}

// DELETE ad
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Ad ID is required' },
        { status: 400 }
      );
    }

    await db.ad.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Ad deleted successfully' });
  } catch (error) {
    console.error('Error deleting ad:', error);
    return NextResponse.json(
      { error: 'Failed to delete ad' },
      { status: 500 }
    );
  }
}
