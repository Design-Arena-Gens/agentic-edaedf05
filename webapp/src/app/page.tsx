'use client';

import { useMemo, useState } from 'react';
import type { ScriptResult, TopicIdea } from '@/lib/types';

interface FormState {
  niche: string;
  format: string;
  language: string;
  keywords: string;
}

const videoFormats = [
  { value: 'long-form', label: 'Long-Form YouTube' },
  { value: 'short-form', label: 'Short-Form YouTube / Reels' },
  { value: 'podcast', label: 'Podcast Episode' },
  { value: 'webinar', label: 'Live Webinar' },
];

const languageOptions = [
  'English',
  'Spanish',
  'German',
  'French',
  'Italian',
  'Portuguese',
  'Hindi',
  'Japanese',
];

function parseKeywords(input: string): string[] {
  return input
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

export default function Home() {
  const [form, setForm] = useState<FormState>({
    niche: '',
    format: 'long-form',
    language: 'English',
    keywords: '',
  });

  const [isResearching, setIsResearching] = useState(false);
  const [researchError, setResearchError] = useState<string | null>(null);
  const [topics, setTopics] = useState<TopicIdea[]>([]);

  const [selectedTopicIndex, setSelectedTopicIndex] = useState<number | null>(null);
  const selectedTopic = selectedTopicIndex != null ? topics[selectedTopicIndex] : null;

  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const [script, setScript] = useState<ScriptResult | null>(null);

  const keywordArray = useMemo(() => parseKeywords(form.keywords), [form.keywords]);

  const handleFormChange = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleResearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsResearching(true);
    setResearchError(null);
    setTopics([]);
    setSelectedTopicIndex(null);
    setScript(null);
    setScriptError(null);

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: form.niche,
          format: form.format,
          language: form.language,
          keywords: keywordArray,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.error || 'Unable to fetch research insights.');
      }

      const data = await response.json();
      setTopics(Array.isArray(data.topics) ? data.topics : []);
    } catch (error) {
      setResearchError(error instanceof Error ? error.message : 'Unexpected error.');
    } finally {
      setIsResearching(false);
    }
  };

  const handleCopyTopics = async () => {
    if (!topics.length) return;
    const payload = {
      topics,
      generatedAt: new Date().toISOString(),
      niche: form.niche,
      format: form.format,
      language: form.language,
    };
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
  };

  const handleScript = async () => {
    if (!selectedTopic) return;
    setIsGeneratingScript(true);
    setScriptError(null);
    setScript(null);

    try {
      const response = await fetch('/api/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTopic,
          niche: form.niche,
          format: form.format,
          language: form.language,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.error || 'Unable to build script.');
      }

      const data = await response.json();
      setScript(data);
    } catch (error) {
      setScriptError(error instanceof Error ? error.message : 'Unexpected error.');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 pb-20 pt-16 text-zinc-100">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6">
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl shadow-black/30 backdrop-blur">
          <header className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Agentic Content Lab</p>
            <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Research & Script Engine</h1>
            <p className="mt-3 max-w-2xl text-sm text-zinc-400">
              Feed the assistant with your niche, preferred format, and language. The engine researches fresh topic ideas and outputs production-ready scripts optimized for top-tier audiences.
            </p>
          </header>

          <form className="grid gap-6 md:grid-cols-2" onSubmit={handleResearch}>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-zinc-300">Niche / Topic Category</span>
              <input
                required
                value={form.niche}
                onChange={(event) => handleFormChange('niche', event.target.value)}
                placeholder="AI + personal finance + money psychology"
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-zinc-300">Video Format</span>
              <select
                value={form.format}
                onChange={(event) => handleFormChange('format', event.target.value)}
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
              >
                {videoFormats.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-zinc-300">Output Language</span>
              <select
                value={form.language}
                onChange={(event) => handleFormChange('language', event.target.value)}
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
              >
                {languageOptions.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-zinc-300">Keywords to Include (comma separated)</span>
              <input
                value={form.keywords}
                onChange={(event) => handleFormChange('keywords', event.target.value)}
                placeholder="behavioral economics, money mindset"
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
              />
            </label>

            <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-zinc-500">
                Keywords parsed:{' '}
                {keywordArray.length ? (
                  <span className="text-emerald-400">{keywordArray.join(', ')}</span>
                ) : (
                  <span className="text-zinc-400">Add comma separated keywords to refine research</span>
                )}
              </div>
              <button
                type="submit"
                disabled={isResearching}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-500/60"
              >
                {isResearching ? 'Researching…' : 'Research Trending Topics'}
              </button>
            </div>
          </form>

          {researchError && <p className="mt-4 text-sm text-rose-400">{researchError}</p>}
        </section>

        <section className="grid gap-10 md:grid-cols-[2fr_1fr]">
          <article className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6">
            <header className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Trending Topic Intelligence</h2>
                <p className="text-xs text-zinc-400">Structured output optimized for automations and dashboards.</p>
              </div>
              <button
                onClick={handleCopyTopics}
                disabled={!topics.length}
                className="rounded-full border border-emerald-500/60 px-4 py-2 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:border-zinc-700 disabled:text-zinc-500"
              >
                Copy JSON
              </button>
            </header>

            {!topics.length ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 text-center text-sm text-zinc-500">
                <p>No topics yet. Run research to populate the feed.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl border border-zinc-800">
                  <table className="min-w-full divide-y divide-zinc-800">
                    <thead className="bg-zinc-900/70 text-xs uppercase tracking-wide text-zinc-400">
                      <tr>
                        <th className="px-4 py-3 text-left">Title</th>
                        <th className="px-4 py-3 text-left">Trend Score</th>
                        <th className="px-4 py-3 text-left">Keywords</th>
                        <th className="px-4 py-3 text-left">Competitors</th>
                        <th className="px-4 py-3 text-left">Script</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-sm">
                      {topics.map((topic, index) => (
                        <tr key={topic.title} className={selectedTopicIndex === index ? 'bg-emerald-500/10' : undefined}>
                          <td className="px-4 py-4 align-top">
                            <div className="font-medium text-zinc-100">{topic.title}</div>
                            <p className="mt-1 text-xs text-zinc-400">{topic.description}</p>
                          </td>
                          <td className="px-4 py-4 align-top text-xs text-emerald-400">{topic.trendScore}</td>
                          <td className="px-4 py-4 align-top text-xs text-zinc-300">{topic.keywords.join(', ')}</td>
                          <td className="px-4 py-4 align-top text-xs text-sky-300">
                            <ul className="space-y-1">
                              {topic.competitorLinks.map((link) => (
                                <li key={link} className="truncate">
                                  <a href={link} target="_blank" rel="noreferrer" className="underline decoration-dotted hover:text-sky-200">
                                    {link.replace(/^https?:\/\//, '')}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <button
                              onClick={() => setSelectedTopicIndex(index)}
                              className="rounded-full border border-emerald-500/60 px-3 py-1 text-xs text-emerald-400 transition hover:bg-emerald-500/10"
                            >
                              Use Topic
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <pre className="max-h-[340px] overflow-auto rounded-2xl border border-zinc-800 bg-black/60 p-4 text-xs text-emerald-200">
                  {JSON.stringify(topics, null, 2)}
                </pre>
              </div>
            )}
          </article>

          <aside className="flex flex-col gap-4 rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Scriptwriter Stage</h3>
              <p className="mt-1 text-xs text-zinc-400">Select a topic to spin up a TTS-ready script.</p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4 text-xs text-zinc-400">
              <p>
                <span className="font-semibold text-emerald-400">Status:</span>{' '}
                {selectedTopic ? `Loaded "${selectedTopic.title}"` : 'Select a topic from the table.'}
              </p>
              {script && (
                <p className="mt-2 text-emerald-400">
                  Script generated • {script.estimatedDuration}
                </p>
              )}
            </div>

            <button
              onClick={handleScript}
              disabled={!selectedTopic || isGeneratingScript}
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-500/30 disabled:text-zinc-400"
            >
              {isGeneratingScript ? 'Generating Script…' : 'Generate Script'}
            </button>

            {scriptError && <p className="text-xs text-rose-400">{scriptError}</p>}

            {script && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-emerald-300">{script.title}</h4>
                <div className="space-y-2 rounded-2xl border border-zinc-800 bg-black/50 p-4 text-sm leading-relaxed text-zinc-200">
                  <section>
                    <h5 className="font-semibold text-emerald-400">Hook</h5>
                    <p className="mt-1 text-zinc-100">{script.hook}</p>
                  </section>
                  {script.sections.map((section) => (
                    <section key={section.heading}>
                      <h5 className="font-semibold text-emerald-400">{section.heading}</h5>
                      <p className="mt-1 text-zinc-100 whitespace-pre-line">{section.content}</p>
                    </section>
                  ))}
                  <section>
                    <h5 className="font-semibold text-emerald-400">Outro</h5>
                    <p className="mt-1 text-zinc-100">{script.outro}</p>
                  </section>
                  <section>
                    <h5 className="font-semibold text-emerald-400">Call To Action</h5>
                    <p className="mt-1 text-zinc-100">{script.callToAction}</p>
                  </section>
                  <section>
                    <h5 className="font-semibold text-emerald-400">Estimated Duration</h5>
                    <p className="mt-1 text-zinc-100">{script.estimatedDuration}</p>
                  </section>
                </div>
              </div>
            )}
          </aside>
        </section>
      </main>
    </div>
  );
}
