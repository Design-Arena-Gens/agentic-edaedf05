import { NextResponse } from 'next/server';
import { buildMockResearch } from '@/lib/mock';
import { requestResearch } from '@/lib/ai';
import type { ResearchPayload } from '@/lib/types';

function parseKeywords(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => Boolean(entry && typeof entry === 'string')).map((entry) => entry.trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean);
  }
  return [];
}

function sanitizeRequest(body: unknown): ResearchPayload | null {
  if (!body || typeof body !== 'object') return null;
  const payload = body as Record<string, unknown>;

  const niche = typeof payload.niche === 'string' ? payload.niche.trim() : '';
  const format = typeof payload.format === 'string' ? payload.format.trim() : '';
  const language = typeof payload.language === 'string' ? payload.language.trim() : '';
  const keywords = parseKeywords(payload.keywords);

  if (!niche || !format || !language) {
    return null;
  }

  return { niche, format, language, keywords };
}

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const sanitized = sanitizeRequest(raw);

    if (!sanitized) {
      return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 });
    }

    const [aiResponse, mockResponse] = await Promise.all([requestResearch(sanitized), Promise.resolve(buildMockResearch(sanitized))]);

    if (aiResponse.data) {
      return NextResponse.json({ ...aiResponse.data, source: 'openai' });
    }

    console.warn('[research-fallback]', aiResponse.error);
    return NextResponse.json(mockResponse, { status: 200 });
  } catch (error) {
    console.error('[research-error]', error);
    return NextResponse.json({ error: 'Unable to process research request.' }, { status: 500 });
  }
}
