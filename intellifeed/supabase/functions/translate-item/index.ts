// Supabase Edge Function: translate-item
// Translates a content_items row's title / hook / summary into Hebrew using
// Claude, caches the result on the row, and returns { title_he, hook_he,
// summary_he }. Idempotent: if the row already has Hebrew text, returns it
// without calling the model.
//
// Auth: requires a valid Supabase JWT (any authenticated user).
//
// Secrets required:
//   ANTHROPIC_API_KEY=sk-ant-...

import { localizeToHebrew } from '../_shared/hebrew.ts';

// @ts-ignore — Deno globals
declare const Deno: { env: { get(key: string): string | undefined } };

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

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

type Row = {
  id: string;
  title: string;
  hook: string | null;
  summary: string;
  title_he: string | null;
  hook_he: string | null;
  summary_he: string | null;
};

async function fetchRow(id: string, jwt: string): Promise<Row | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/content_items?id=eq.${id}&select=id,title,hook,summary,title_he,hook_he,summary_he`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${jwt}`,
      },
    },
  );
  if (!res.ok) return null;
  const rows = (await res.json()) as Row[];
  return rows[0] ?? null;
}

async function saveTranslation(
  id: string,
  patch: { title_he: string; hook_he: string | null; summary_he: string },
): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/content_items?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(patch),
  });
}

async function translate(row: Row): Promise<{ title_he: string; hook_he: string | null; summary_he: string }> {
  return await localizeToHebrew(
    { title: row.title, hook: row.hook, summary: row.summary },
    ANTHROPIC_API_KEY!,
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const auth = req.headers.get('Authorization') ?? '';
  const jwt = auth.replace(/^Bearer\s+/i, '');
  if (!jwt) return json({ error: 'Missing auth token.' }, 401);
  if (!ANTHROPIC_API_KEY) return json({ error: 'Server missing ANTHROPIC_API_KEY.' }, 500);

  let body: { id?: string; force?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }
  const id = body.id?.trim();
  if (!id) return json({ error: 'Missing id.' }, 400);

  const row = await fetchRow(id, jwt);
  if (!row) return json({ error: 'Item not found.' }, 404);

  // Cache hit — return existing translation without calling the model. `force`
  // bypasses this so a low-quality cached translation can be regenerated.
  if (!body.force && row.title_he && row.summary_he) {
    return json({
      title_he: row.title_he,
      hook_he: row.hook_he,
      summary_he: row.summary_he,
    });
  }

  try {
    const translated = await translate(row);
    await saveTranslation(id, translated);
    return json(translated);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
