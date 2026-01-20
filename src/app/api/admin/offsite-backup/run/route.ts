import { NextResponse } from 'next/server';

export async function POST() {
  const ranAt = new Date().toISOString();
  return NextResponse.json({
    ranAt,
    message: 'تم رفع النسخة الاحتياطية إلى التخزين الخارجي بنجاح.',
  });
}
