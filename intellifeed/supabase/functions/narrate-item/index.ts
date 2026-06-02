// Supabase Edge Function: narrate-item
//
// Takes a single content_item id, narrates its summary via OpenAI TTS,
// uploads the MP3 to Supabase Storage, caches the URL on the row
// (content_items.audio_url), and returns { audio_url }.
//
// If the item already has an audio_url, it's returned immediately — narration
// is generated once per article and reused thereafter.
//
// Auth: any signed-in user (no admin flag required).

// @ts-ignore — Deno globals
declare const Deno: { env: { get(key: string): string | undefined } };

const OPENAI_API_KEY            = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL              = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const SUMMARIES_BUCKET          = 'summaries';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

type Item = {
  id: string;
  title: string;
  summary: string;
  hook: string | null;
  audio_url: string | null;
};

async function fetchItem(id: string): Promise<Item | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/content_items?id=eq.${id}&select=id,title,summary,hook,audio_url`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    },
  );
  if (!res.ok) return null;
  const rows = await res.json() as Item[];
  return rows[0] ?? null;
}

function buildScript(item: Item): string {
  const headline = item.title.replace(/\s+—\s*/g, ', ').trim();
  const body = (item.summary || item.hook || '').replace(/\s+/g, ' ').trim();
  return `${headline}.\n\n${body}`;
}

async function tts(text: string): Promise<ArrayBuffer | null> {
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      voice: 'onyx',
      input: text.slice(0, 4000),
      response_format: 'mp3',
      speed: 0.95,
    }),
  });
  if (!res.ok) return null;
  return await res.arrayBuffer();
}

async function upload(bytes: ArrayBuffer): Promise<{ url?: string; error?: string }> {
  const filename = `narration-${crypto.randomUUID()}.mp3`;
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${SUMMARIES_BUCKET}/${filename}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'audio/mpeg',
        apikey: SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'x-upsert': 'true',
      },
      body: bytes,
    },
  );
  if (!res.ok) {
    let detail = '';
    try { detail = await res.text(); } catch {}
    return { error: `storage ${res.status}: ${detail.slice(0, 200)}` };
  }
  return { url: `${SUPABASE_URL}/storage/v1/object/public/${SUMMARIES_BUCKET}/${filename}` };
}

async function cacheUrl(id: string, url: string): Promise<void> {
  // Best-effort write-back so the next listen is instant. Failure is non-fatal.
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/content_items?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ audio_url: url }),
    });
  } catch { /* ignore */ }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  if (!OPENAI_API_KEY) return json({ error: 'OPENAI_API_KEY not configured. Set it via supabase secrets.' }, 500);
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'Server missing Supabase credentials.' }, 500);

  let body: { id?: string };
  try { body = await req.json(); } catch { return json({ error: 'Body must be JSON.' }, 400); }
  const id = (body.id ?? '').trim();
  if (!id) return json({ error: 'Provide a content_item id.' }, 400);

  const item = await fetchItem(id);
  if (!item) return json({ error: 'No item found for that id.' }, 404);

  // Cached — return the existing narration.
  if (item.audio_url) return json({ audio_url: item.audio_url, cached: true });

  const script = buildScript(item);
  if (!script.trim()) return json({ error: 'Item has no text to narrate.' }, 422);

  const audioBytes = await tts(script);
  if (!audioBytes) return json({ error: 'TTS generation failed (check OPENAI_API_KEY).' }, 502);

  const up = await upload(audioBytes);
  if (!up.url) return json({ error: `Audio upload failed — ${up.error ?? 'unknown'}` }, 502);

  await cacheUrl(id, up.url);

  return json({ audio_url: up.url, cached: false });
});
