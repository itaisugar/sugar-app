// Supabase Edge Function: send-notification
// Sends transactional email notifications via Resend. Invoked by Postgres
// triggers (see db/migrations_v7.sql) — NOT by the app client.
//
// Event payloads:
//   { "type": "new_follower", "follower_id": "...", "followed_id": "..." }
//   { "type": "new_content",  "content_id": "..." }
//
// Auth: the caller must present the service-role key as a Bearer token. This
// keeps the function internal (only the DB triggers / privileged callers).
//
// Secrets required (set with `supabase secrets set ...`):
//   RESEND_API_KEY=re_...
//   NOTIFY_FROM_EMAIL="Sapience <notifications@yourdomain.com>"   (optional)
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected automatically.

// @ts-ignore — Deno globals (Edge Function runtime)
declare const Deno: { env: { get(key: string): string | undefined } };

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = Deno.env.get('NOTIFY_FROM_EMAIL') ?? 'Sapience <onboarding@resend.dev>';
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

// ── Supabase REST helpers (service-role) ──────────────────────────────────────
async function rest<T>(path: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`REST ${path} → ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  notify_new_follower?: boolean;
  notify_new_content?: boolean;
};

type ContentRow = {
  id: string;
  title: string;
  category: string;
  tags: string[] | null;
};

// ── Email ─────────────────────────────────────────────────────────────────────
const APP_NAME = 'Sapience';

function shell(title: string, body: string, cta?: { label: string; note: string }): string {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1a1a1a">
  <p style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#9a8348;margin:0 0 16px">${APP_NAME}</p>
  <h1 style="font-size:20px;line-height:1.3;margin:0 0 12px">${title}</h1>
  <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 20px">${body}</p>
  ${cta ? `<p style="font-size:13px;color:#777;margin:0">${cta.note}</p>` : ''}
  <hr style="border:none;border-top:1px solid #eee;margin:28px 0 14px" />
  <p style="font-size:12px;color:#aaa;margin:0">You're receiving this because of your notification settings in ${APP_NAME}. You can turn these off in Profile → Email notifications.</p>
</div>`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) {
    console.error(`Resend error → ${res.status} ${await res.text()}`);
  }
}

// ── Event handlers ────────────────────────────────────────────────────────────
async function handleNewFollower(followerId: string, followedId: string): Promise<number> {
  const [followed] = await rest<ProfileRow[]>(
    `profiles?id=eq.${followedId}&select=id,email,full_name,notify_new_follower`,
  );
  if (!followed?.email || followed.notify_new_follower === false) return 0;

  const [follower] = await rest<ProfileRow[]>(
    `profiles?id=eq.${followerId}&select=id,full_name`,
  );
  const who = follower?.full_name?.trim() || 'A reader';

  await sendEmail(
    followed.email,
    `${who} started following you on ${APP_NAME}`,
    shell(
      `${who} started following you`,
      `${who} is now following your reading on ${APP_NAME}. Open the app to see their profile and follow back.`,
    ),
  );
  return 1;
}

async function handleNewContent(contentId: string): Promise<number> {
  const [item] = await rest<ContentRow[]>(
    `content_items?id=eq.${contentId}&select=id,title,category,tags`,
  );
  if (!item) return 0;

  // Match readers whose interests overlap the article's category or tags.
  const topics = [item.category, ...(item.tags ?? [])].filter(Boolean);
  if (topics.length === 0) return 0;
  // PostgREST array-overlap literal: {"Artificial Intelligence",Science}
  const arrayLiteral = `{${topics.map((t) => `"${String(t).replace(/"/g, '\\"')}"`).join(',')}}`;
  const filter = `interests=ov.${encodeURIComponent(arrayLiteral)}`;

  const recipients = await rest<ProfileRow[]>(
    `profiles?notify_new_content=eq.true&email=not.is.null&${filter}&select=id,email,full_name`,
  );

  let sent = 0;
  for (const r of recipients) {
    if (!r.email) continue;
    await sendEmail(
      r.email,
      `New in ${item.category}: ${item.title}`,
      shell(
        item.title,
        `A new piece just landed in <strong>${item.category}</strong> — a domain you follow on ${APP_NAME}. Open the app to read or listen.`,
      ),
    );
    sent++;
  }
  return sent;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: 'Server missing Supabase env.' }, 500);
  }
  if (!RESEND_API_KEY) return json({ error: 'Server missing RESEND_API_KEY.' }, 500);

  // Internal-only: require the service-role key as the bearer token.
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (token !== SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'Unauthorized.' }, 401);

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  try {
    if (body.type === 'new_follower') {
      if (!body.follower_id || !body.followed_id) return json({ error: 'Missing ids.' }, 400);
      const sent = await handleNewFollower(body.follower_id, body.followed_id);
      return json({ ok: true, sent });
    }
    if (body.type === 'new_content') {
      if (!body.content_id) return json({ error: 'Missing content_id.' }, 400);
      const sent = await handleNewContent(body.content_id);
      return json({ ok: true, sent });
    }
    return json({ error: `Unknown event type: ${body.type}` }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
