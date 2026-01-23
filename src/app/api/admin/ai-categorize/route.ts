import { NextRequest, NextResponse } from 'next/server';

const CATEGORY_RULES: { category: string; keywords: string[] }[] = [
  { category: 'رياضة', keywords: ['sport', 'sports', 'football', 'soccer', 'tennis', 'nba'] },
  { category: 'أخبار', keywords: ['news', 'breaking', 'cnn', 'bbc', 'aljazeera'] },
  { category: 'أفلام', keywords: ['movie', 'movies', 'cinema', 'film'] },
  { category: 'كرتون', keywords: ['kids', 'cartoon', 'animation', 'anime'] },
  { category: 'موسيقى', keywords: ['music', 'radio', 'fm', 'hits'] },
];

const inferCategory = (title: string, description?: string | null) => {
  const haystack = `${title} ${description ?? ''}`.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => haystack.includes(keyword))) {
      return rule.category;
    }
  }
  return 'عام';
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const streams = (body?.streams ?? []) as { id: string; title: string; description?: string }[];

    if (!Array.isArray(streams) || streams.length === 0) {
      return NextResponse.json({ error: 'No streams provided' }, { status: 400 });
    }

    const results = streams.map((stream) => {
      const category = inferCategory(stream.title, stream.description);
      const confidence = category === 'عام' ? 0.42 : 0.78;
      return {
        id: stream.id,
        title: stream.title,
        category,
        confidence,
      };
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('AI categorize error:', error);
    return NextResponse.json({ error: 'Failed to categorize streams' }, { status: 500 });
  }
}
