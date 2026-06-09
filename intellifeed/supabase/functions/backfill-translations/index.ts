// Supabase Edge Function: backfill-translations
//
// Regenerates Hebrew (title_he / hook_he / summary_he) for existing
// content_items using the shared, high-quality localizer. Use it to upgrade
// the low-quality Hebrew on older rows, or to fill in rows that were never
// translated.
//
// Auth: header `X-Curator-Secret` matching the CURATOR_SECRET env var.
//
// Body (all optional):
//   mode:   "missing" (only rows without Hebrew) | "all" (re-do everything).
//           Default "missing".
//   limit:  rows per call (default 20, max 50). Each call is one batch.
//   before: ISO timestamp cursor — only rows with created_at < before. The
//           response returns `nextBefore`; pass it back to continue. When
//           `nextBefore` is null the backfill is complete.
//
// Secrets required: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
// CURATOR_SECRET.

import { localizeToHebrew } from '../_shared/hebrew.ts';

// @ts-ignore — Deno globals
declare const Deno: { env: { get(key: string): string | undefined } };

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const CURATOR_SECRET = Deno.env.get('CURATOR_SECRET');

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

type Row = {
  id: string;
  title: string;
  hook: string | null;
  summary: string;
  created_at: string;
};

async function fetchBatch(mode: 'missing' | 'all', limit: number, before?: string): Promise<Row[]> {
  const params = new URLSearchParams();
  params.set('select', 'id,title,hook,summary,created_at');
  params.set('order', 'created_at.desc');
  params.set('limit', String(limit));
  // Only translate items that actually have an English body to work from.
  params.append('summary', 'neq.');
  if (mode === 'missing') params.append('summary_he', 'is.null');
  if (before) params.append('created_at', `lt.${before}`);

  const res = await fetch(`${SUPABASE_URL}/rest/v1/content_items?${params.toString()}`, {
    headers: { apikey: SERVICE_ROLE_KEY!, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  });
  if (!res.ok) throw new Error(`fetch batch failed: ${res.status}`);
  return (await res.json()) as Row[];
}

async function patchHebrew(id: string, he: Record<string, unknown>): Promise<boolean> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/content_items?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(he),
  });
  return res.ok;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  if (!CURATOR_SECRET || req.headers.get('X-Curator-Secret') !== CURATOR_SECRET) {
    return json({ error: 'Unauthorized.' }, 401);
  }
  if (!ANTHROPIC_API_KEY || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json({ error: 'Server missing secrets.' }, 500);
  }

  let body: { mode?: string; limit?: number; before?: string } = {};
  try {
    body = await req.json();
  } catch {
    // empty body is fine — use defaults
  }
  const mode: 'missing' | 'all' = body.mode === 'all' ? 'all' : 'missing';
  const limit = Math.max(1, Math.min(50, body.limit ?? 20));
  const before = body.before?.trim() || undefined;

  let rows: Row[];
  try {
    rows = await fetchBatch(mode, limit, before);
  } catch (e) {
    return json({ error: (e as Error).message }, 502);
  }

  const results: { id: string; ok: boolean; error?: string }[] = [];
  for (const row of rows) {
    try {
      const he = await localizeToHebrew({ title: row.title, hook: row.hook, summary: row.summary }, ANTHROPIC_API_KEY);
      const ok = await patchHebrew(row.id, he);
      results.push({ id: row.id, ok });
    } catch (e) {
      results.push({ id: row.id, ok: false, error: (e as Error).message });
    }
  }

  // Cursor: when we filled the batch there may be more; continue from the
  // oldest row we just saw. A short batch means we've reached the end.
  const nextBefore = rows.length === limit ? rows[rows.length - 1].created_at : null;

  return json({
    mode,
    processed: results.filter((r) => r.ok).length,
    attempted: results.length,
    nextBefore,
    results,
  });
});
