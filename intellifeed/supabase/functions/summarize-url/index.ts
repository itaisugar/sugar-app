// Supabase Edge Function: summarize-url
// Receives a URL, scrapes its content, and asks Claude to produce a
// premium editorial summary suitable for the Sapiens feed.
//
// Auth: requires a valid Supabase JWT. Verifies the caller is an admin
// (profiles.is_admin = true) before doing any work.
//
// Secrets required (set with `supabase secrets set ...`):
//   ANTHROPIC_API_KEY=sk-ant-...

// @ts-ignore — Deno globals (Edge Function runtime)
declare const Deno: { env: { get(key: string): string | undefined } };

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const ALLOWED_CATEGORIES = [
  'Science', 'AI', 'Business', 'Performance', 'Philosophy',
  'Geopolitics', 'Health', 'Psychology', 'Longevity', 'Literature',
  'Economics', 'History',
];

const CATEGORY_COLORS: Record<string, string> = {
  Science: '#0E7490',
  AI: '#1E40AF',
  Business: '#7C3AED',
  Performance: '#B91C1C',
  Philosophy: '#B45309',
  Geopolitics: '#15803D',
  Health: '#059669',
  Psychology: '#A16207',
  Longevity: '#059669',
  Literature: '#7C3AED',
  Economics: '#0E7490',
  History: '#A16207',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

// ─── HTML helpers ────────────────────────────────────────────────────────────

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function extractMeta(html: string, property: string): string | null {
  // <meta property="og:title" content="..."> or <meta name="title" content="...">
  const patterns = [
    new RegExp(`<meta\\s+(?:property|name)=["']${property}["']\\s+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta\\s+content=["']([^"']+)["']\\s+(?:property|name)=["']${property}["']`, 'i'),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return decodeEntities(m[1].trim());
  }
  return null;
}

function extractBodyText(html: string): string {
  // Remove script, style, nav, footer, aside, header
  let cleaned = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<aside\b[^>]*>[\s\S]*?<\/aside>/gi, ' ')
    .replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

  // Prefer <article> or <main> if present
  const articleMatch = cleaned.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  const mainMatch = cleaned.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  if (articleMatch) cleaned = articleMatch[1];
  else if (mainMatch) cleaned = mainMatch[1];

  const text = cleaned
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return decodeEntities(text).slice(0, 12000);
}

function deriveSourceFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return host.split('.').slice(0, -1).join('.') || host;
  } catch {
    return 'Unknown Source';
  }
}

// ─── Claude call ─────────────────────────────────────────────────────────────

type AISummary = {
  title: string;
  summary: string;
  category: string;
  tags: string[];
  read_time_minutes: number;
};

async function summarizeWithClaude(args: {
  url: string;
  pageTitle: string;
  bodyText: string;
}): Promise<AISummary> {
  if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not configured.');

  const prompt = `You are a senior editor at Sapiens — a premium app for cognitive consumption. Your tone is intellectual, calm, and editorial.

Given the article below, produce a JSON object with these fields:
- "title": a clean, polished headline (use the original title if it's already strong; otherwise refine it). No clickbait.
- "summary": 2-3 sentences (60-90 words) capturing the most important insight or finding, in the editorial voice of The New Yorker or Aeon.
- "category": ONE value from this list ONLY: ${ALLOWED_CATEGORIES.join(', ')}
- "tags": 3-5 short keyword tags (capitalized, single or two-word, no hashtag)
- "read_time_minutes": estimated reading time as an integer

Return ONLY valid JSON, no preamble, no markdown fences.

ARTICLE URL: ${args.url}
ARTICLE TITLE: ${args.pageTitle}
ARTICLE TEXT:
${args.bodyText}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text: string = data?.content?.[0]?.text ?? '';

  // Try to extract JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Model did not return JSON.');

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    title: String(parsed.title ?? args.pageTitle).slice(0, 300),
    summary: String(parsed.summary ?? '').slice(0, 1000),
    category: ALLOWED_CATEGORIES.includes(parsed.category) ? parsed.category : 'Science',
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 6).map(String) : [],
    read_time_minutes: Math.max(1, Math.min(60, parseInt(parsed.read_time_minutes, 10) || 5)),
  };
}

// ─── Auth check ──────────────────────────────────────────────────────────────

async function verifyAdmin(authHeader: string | null): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  if (!authHeader) return { ok: false, status: 401, message: 'Missing Authorization header.' };
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, status: 500, message: 'Supabase service credentials are not configured.' };
  }
  const token = authHeader.replace(/^Bearer\s+/i, '');

  // Verify JWT by asking Supabase Auth for the user
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!userRes.ok) return { ok: false, status: 401, message: 'Invalid session.' };
  const user = await userRes.json();
  if (!user?.id) return { ok: false, status: 401, message: 'Invalid user.' };

  // Check admin flag in profiles via PostgREST + service role
  const profRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=is_admin`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  if (!profRes.ok) return { ok: false, status: 500, message: 'Could not read profile.' };
  const rows = await profRes.json();
  if (!rows?.[0]?.is_admin) {
    return { ok: false, status: 403, message: 'Only editors may summarize content.' };
  }
  return { ok: true };
}

// ─── Handler ─────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  // Auth
  const authCheck = await verifyAdmin(req.headers.get('Authorization'));
  if (!authCheck.ok) return json({ error: authCheck.message }, authCheck.status);

  // Parse body
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Request body must be JSON.' }, 400);
  }
  const url = (body.url ?? '').trim();
  if (!url || !/^https?:\/\//i.test(url)) {
    return json({ error: 'Please provide a valid http(s) URL.' }, 400);
  }

  // Fetch the page
  let html = '';
  try {
    const pageRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SapiensBot/1.0; +https://sapiens.app)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    if (!pageRes.ok) {
      return json({ error: `The source returned ${pageRes.status}. It may be blocking automated readers.` }, 422);
    }
    html = await pageRes.text();
  } catch (e) {
    return json({ error: `Could not reach the source: ${(e as Error).message}` }, 422);
  }

  // Extract metadata
  const ogTitle = extractMeta(html, 'og:title') ?? extractMeta(html, 'twitter:title');
  const ogImage = extractMeta(html, 'og:image') ?? extractMeta(html, 'twitter:image');
  const ogSite = extractMeta(html, 'og:site_name');
  const docTitleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const docTitle = docTitleMatch ? decodeEntities(docTitleMatch[1]).trim() : '';
  const pageTitle = ogTitle ?? docTitle ?? url;
  const source = ogSite ?? deriveSourceFromUrl(url);

  const bodyText = extractBodyText(html);
  if (bodyText.length < 200) {
    return json({ error: 'The article body could not be extracted (the page may require JavaScript).' }, 422);
  }

  // Summarize via Claude
  let ai: AISummary;
  try {
    ai = await summarizeWithClaude({ url, pageTitle, bodyText });
  } catch (e) {
    return json({ error: `Summarization failed: ${(e as Error).message}` }, 502);
  }

  return json({
    title: ai.title,
    summary: ai.summary,
    source,
    category: ai.category,
    category_color: CATEGORY_COLORS[ai.category] ?? '#1D4ED8',
    read_time: ai.read_time_minutes,
    image_url: ogImage ?? '',
    content_url: url,
    tags: ai.tags,
  });
});
