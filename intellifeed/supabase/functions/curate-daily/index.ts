// Supabase Edge Function: curate-daily
//
// Once-a-day curator. Pulls recent items from a curated set of RSS feeds,
// asks Claude to pick the most Sapience-worthy 3-5, runs each through the
// existing summarize-url Edge Function, and inserts the resulting rows into
// content_items.
//
// Authorization: requires header `X-Curator-Secret` matching the
// CURATOR_SECRET env var (also set on summarize-url).
//
// Secrets required:
//   ANTHROPIC_API_KEY
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   CURATOR_SECRET           (your own random string, also set on summarize-url)

// @ts-ignore — Deno globals
declare const Deno: { env: { get(key: string): string | undefined } };

const ANTHROPIC_API_KEY    = Deno.env.get('ANTHROPIC_API_KEY');
const SUPABASE_URL         = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const CURATOR_SECRET       = Deno.env.get('CURATOR_SECRET');

// Tuned for editorial fit: long-form journalism, peer-reviewed research,
// and intellectually serious podcast feeds. Mix is intentional.
const FEEDS: { url: string; source: string; kind: 'article' | 'podcast' }[] = [
  { url: 'https://www.nature.com/nature.rss',                          source: 'Nature',              kind: 'article' },
  { url: 'https://api.quantamagazine.org/feed/',                       source: 'Quanta Magazine',     kind: 'article' },
  { url: 'https://aeon.co/feed.rss',                                   source: 'Aeon',                kind: 'article' },
  { url: 'https://www.science.org/blogs/news/feed',                    source: 'Science News',        kind: 'article' },
  { url: 'https://marginalrevolution.com/feed',                        source: 'Marginal Revolution', kind: 'article' },
  { url: 'https://www.astralcodexten.com/feed',                        source: 'Astral Codex Ten',    kind: 'article' },
  { url: 'https://stratechery.com/feed/',                              source: 'Stratechery',         kind: 'article' },
  { url: 'https://lexfridman.com/feed/podcast/',                       source: 'Lex Fridman Podcast', kind: 'podcast' },
  { url: 'https://feeds.megaphone.fm/hubermanlab',                     source: 'Huberman Lab',        kind: 'podcast' },
  { url: 'https://peterattiamd.com/category/podcast/feed/',            source: 'The Drive',           kind: 'podcast' },
  { url: 'https://feeds.transistor.fm/acquired',                       source: 'Acquired',            kind: 'podcast' },
];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-curator-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// ─── RSS parsing (minimal, regex-based — robust enough for major feeds) ─────

type Candidate = {
  source: string;
  kind: 'article' | 'podcast';
  title: string;
  link: string;
  published: string | null;
};

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'");
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, '').trim();
}

function parseFeed(xml: string, feed: typeof FEEDS[number]): Candidate[] {
  const items: Candidate[] = [];
  const itemRe = /<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null) {
    const body = m[2];
    const titleMatch = body.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    let linkMatch = body.match(/<link[^>]*href=["']([^"']+)["']/i);
    if (!linkMatch) linkMatch = body.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
    const dateMatch = body.match(/<(pubDate|published|updated)[^>]*>([\s\S]*?)<\/\1>/i);
    const title = titleMatch ? decodeEntities(stripTags(titleMatch[1])).trim() : '';
    const link  = linkMatch  ? decodeEntities(linkMatch[1]).trim() : '';
    const published = dateMatch ? dateMatch[2].trim() : null;
    if (title && link.startsWith('http')) {
      items.push({ source: feed.source, kind: feed.kind, title, link, published });
    }
    if (items.length >= 8) break; // keep only ~8 most-recent per feed
  }
  return items;
}

async function fetchFeed(feed: typeof FEEDS[number]): Promise<Candidate[]> {
  try {
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'SapienceCurator/1.0' },
    });
    if (!res.ok) return [];
    const text = await res.text();
    return parseFeed(text, feed);
  } catch {
    return [];
  }
}

// ─── De-dupe against content_items (by title) ───────────────────────────────

async function existingTitles(candidates: Candidate[]): Promise<Set<string>> {
  if (candidates.length === 0) return new Set();
  // Pull the last 500 titles; cheap, simple, avoids per-row queries.
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/content_items?select=title&order=created_at.desc&limit=500`,
    { headers: { apikey: SERVICE_ROLE_KEY!, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } },
  );
  if (!res.ok) return new Set();
  const rows = await res.json() as { title: string }[];
  return new Set(rows.map(r => r.title.toLowerCase()));
}

// ─── Ranking by Claude ──────────────────────────────────────────────────────

type Pick = { link: string; reason: string };

async function pickTop(cands: Candidate[], n: number): Promise<Pick[]> {
  if (cands.length === 0) return [];
  const list = cands
    .map((c, i) => `${i + 1}. [${c.source} · ${c.kind}] ${c.title}\n   ${c.link}`)
    .join('\n');

  const prompt = `You are the editor-in-chief of Sapience — a premium intellectual content app.
Tone: editorial, calm, third-person; readers expect long-form science, philosophy,
strategy, and longevity-grade health journalism. NO clickbait, listicles, partisan
politics, low-signal industry blog posts, or routine product news.

From the list of recent items below, pick the ${n} that most deserve a place on
Sapience today. Prefer: major peer-reviewed findings, important essays, deep podcast
interviews. Avoid duplicate topics; favour diversity of category.

Return STRICT JSON with this shape (no markdown, no preface):
{ "picks": [ { "link": "<url>", "reason": "<one short sentence>" }, ... ] }

Candidates:
${list}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  const text: string = data?.content?.[0]?.text ?? '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]) as { picks: Pick[] };
    return (parsed.picks ?? []).filter(p => p.link?.startsWith('http')).slice(0, n);
  } catch {
    return [];
  }
}

// ─── Summarize via the existing Edge Function and insert ────────────────────

type AISummary = {
  title: string;
  hook?: string;
  summary: string;
  source: string;
  category: string;
  category_color: string;
  read_time: number;
  image_url: string;
  content_url: string;
  audio_url?: string | null;
  tags: string[];
};

async function summarizeUrl(url: string): Promise<{ summary?: AISummary; error?: string; status?: number }> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/summarize-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Curator-Secret': CURATOR_SECRET!,
      apikey: SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ url }),
  });
  let body: any = null;
  try { body = await res.json(); } catch { body = { error: 'non-JSON response' }; }
  if (!res.ok) return { error: body?.error ?? body?.message ?? 'unknown', status: res.status };
  if (body?.error) return { error: body.error, status: res.status };
  return { summary: body as AISummary };
}

async function insertItem(s: AISummary, kind: 'article' | 'podcast'): Promise<boolean> {
  const contentType = /spotify\.com/i.test(s.content_url) ? 'podcast'
    : /amazon\.[a-z.]+\/|^https?:\/\/a\.co\/|read\.amazon\.com/i.test(s.content_url) ? 'book'
    : kind;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/content_items`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      title: s.title,
      hook: s.hook ?? null,
      summary: s.summary,
      source: s.source,
      source_avatar: '◆',
      category: s.category,
      category_color: s.category_color,
      read_time: s.read_time || 6,
      image_url: s.image_url,
      content_url: s.content_url,
      audio_url: s.audio_url ?? null,
      content_source: 'curated',
      content_type: contentType,
      tags: s.tags ?? [],
    }),
  });
  return res.ok;
}

// ─── Handler ────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  if (!CURATOR_SECRET || req.headers.get('X-Curator-Secret') !== CURATOR_SECRET) {
    return json({ error: 'Unauthorized.' }, 401);
  }
  if (!ANTHROPIC_API_KEY || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json({ error: 'Server missing secrets.' }, 500);
  }

  // 1. Fan-out fetch all feeds
  const feedResults = await Promise.all(FEEDS.map(fetchFeed));
  const candidates = feedResults.flat();
  if (candidates.length === 0) return json({ error: 'No candidates found.' }, 502);

  // 2. Drop anything already in content_items
  const taken = await existingTitles(candidates);
  const fresh = candidates.filter(c => !taken.has(c.title.toLowerCase()));
  if (fresh.length === 0) return json({ added: 0, note: 'All recent items already present.' });

  // 3. Ask Claude for the top 4
  const picks = await pickTop(fresh, 4);
  if (picks.length === 0) return json({ added: 0, note: 'No picks returned by model.' });

  // 4. Summarize + insert each (sequential — keeps API and DB load polite)
  const results: { link: string; ok: boolean; title?: string; error?: string }[] = [];
  for (const pick of picks) {
    const cand = fresh.find(c => c.link === pick.link);
    const kind: 'article' | 'podcast' = cand?.kind ?? 'article';
    try {
      const r = await summarizeUrl(pick.link);
      if (!r.summary) {
        results.push({ link: pick.link, ok: false, error: `summarize ${r.status ?? ''}: ${r.error}` });
        continue;
      }
      const ok = await insertItem(r.summary, kind);
      results.push({ link: pick.link, ok, title: r.summary.title });
    } catch (e) {
      results.push({ link: pick.link, ok: false, error: (e as Error).message });
    }
  }

  return json({
    added: results.filter(r => r.ok).length,
    attempted: results.length,
    results,
  });
});
