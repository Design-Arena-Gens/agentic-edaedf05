import { NextResponse } from 'next/server';
import { buildMockScript } from '@/lib/mock';
import { requestScript } from '@/lib/ai';
import type { ScriptPayload, TopicIdea } from '@/lib/types';

function isTopicIdea(value: unknown): value is TopicIdea {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.title === 'string' &&
    typeof candidate.description === 'string' &&
    typeof candidate.trendScore === 'string' &&
    Array.isArray(candidate.keywords) &&
    Array.isArray(candidate.competitorLinks)
  );
}

function sanitizeRequest(body: unknown): ScriptPayload | null {
  if (!body || typeof body !== 'object') return null;
  const payload = body as Record<string, unknown>;

  const topic = payload.topic;
  const niche = typeof payload.niche === 'string' ? payload.niche.trim() : '';
  const format = typeof payload.format === 'string' ? payload.format.trim() : '';
  const language = typeof payload.language === 'string' ? payload.language.trim() : '';

  if (!isTopicIdea(topic) || !niche || !format || !language) {
    return null;
  }

  return { topic, niche, format, language };
}

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const sanitized = sanitizeRequest(raw);

    if (!sanitized) {
      return NextResponse.json({ error: 'Invalid script payload.' }, { status: 400 });
    }

    const [aiResponse, mockResponse] = await Promise.all([requestScript(sanitized), Promise.resolve(buildMockScript(sanitized))]);

    if (aiResponse.data) {
      return NextResponse.json({ ...aiResponse.data, source: 'openai' });
    }

    console.warn('[script-fallback]', aiResponse.error);
    return NextResponse.json({ ...mockResponse, source: 'mock-data' });
  } catch (error) {
    console.error('[script-error]', error);
    return NextResponse.json({ error: 'Unable to generate script.' }, { status: 500 });
  }
}
