// ════════════════════════════════════════════════════════════
//  Sapience — User Simulation Edge Function (v2)
//  מסע משתמש מרובה-שלבים + שאלות מעקב חכמות
//  מיקום: supabase/functions/simulate-users/index.ts
// ════════════════════════════════════════════════════════════

import { createClient } from "npm:@supabase/supabase-js";

// .trim() strips a stray newline/space from the stored secret. (A non-ASCII
// char in the key — e.g. pasted Hebrew — will still fail; the key must be ASCII.)
const ANTHROPIC_API_KEY = (Deno.env.get("ANTHROPIC_API_KEY") ?? "").trim();

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

const MODEL = "claude-sonnet-4-6";
// סוכן עם ציון נמוך מהסף יקבל שאלת מעקב
const FOLLOWUP_THRESHOLD = 8;

// ── 10 פרסונות ──────────────────────────────────────────────
const PERSONAS = [
  { name: "Maya", age: 28, occupation: "UX Designer", personality: "curious, visual thinker, skims quickly", readingHabits: "design & psychology, 20min/day", painPoints: "too much noise, wants quality over quantity", techLevel: "high" },
  { name: "Daniel", age: 35, occupation: "Startup Founder", personality: "busy, skeptical, results-oriented", readingHabits: "business, tech, strategy — only if actionable", painPoints: "no time, hates fluff", techLevel: "high" },
  { name: "Noa", age: 22, occupation: "University Student (Philosophy)", personality: "idealistic, deep thinker, easily distracted", readingHabits: "philosophy, ethics, long reads on weekends", painPoints: "shallow content, clickbait", techLevel: "medium" },
  { name: "Oren", age: 45, occupation: "Senior Engineer", personality: "analytical, introverted, high standards", readingHabits: "technical papers, AI, science", painPoints: "oversimplification, inaccuracy", techLevel: "very high" },
  { name: "Shira", age: 31, occupation: "Journalist", personality: "critical, fast reader, opinionated", readingHabits: "news, media criticism, politics", painPoints: "bias, lack of sources, slow UX", techLevel: "medium" },
  { name: "Tom", age: 26, occupation: "Product Manager", personality: "pragmatic, data-driven, impatient", readingHabits: "product, growth, newsletters", painPoints: "too many apps, wants one place for everything", techLevel: "high" },
  { name: "Ruth", age: 52, occupation: "Professor (Economics)", personality: "traditional, thorough, values credibility", readingHabits: "academic papers, long journalism", painPoints: "gimmicks, AI-generated content", techLevel: "low" },
  { name: "Amit", age: 19, occupation: "Gap Year Student", personality: "curious but easily bored, social, trend-aware", readingHabits: "short content, podcasts, social media", painPoints: "boring UI, too much text", techLevel: "high" },
  { name: "Lior", age: 38, occupation: "Therapist", personality: "empathetic, reflective, privacy-conscious", readingHabits: "psychology, wellbeing, human behavior", painPoints: "addictive design, data collection concerns", techLevel: "medium" },
  { name: "Yael", age: 29, occupation: "Investor (VC)", personality: "sharp, competitive, trend-spotter", readingHabits: "tech, finance, startups", painPoints: "wants exclusivity, hates generic content", techLevel: "high" },
];

// ── שלבי המסע ────────────────────────────────────────────────
// כל שלב מתאר מסך שהמשתמש רואה ומבקש תגובה קצרה בדמות
const JOURNEY_STEPS = [
  {
    id: "onboarding",
    label: "Onboarding",
    screen: `מסך הפתיחה של Sapience: רקע כמעט-שחור, כותרת בפונט Space Grotesk, אקצנט אדום ארגמן. הצעת ערך: "תוכן אינטלקטואלי, מזוקק עבורך". לאחר מכן מסך בחירת תחומי עניין (AI, פילוסופיה, מדע, עסקים, פסיכולוגיה ועוד), מסך בחירת תדירות קריאה, ולבסוף יצירת חשבון / התחברות.`,
  },
  {
    id: "feed",
    label: "Feed",
    screen: `אתה בפיד הראשי. כרטיסי כתבות עם תמונת hero גדולה, באדג' קטגוריה, באדג' "Trending" על חלק מהכתבות, וסיכום AI קצר מתחת לכותרת. יש social-proof ("1.2k קוראים השבוע"). הכל בערכת הנושא הכהה.`,
  },
  {
    id: "article",
    label: "Article + Audio",
    screen: `פתחת כתבה. למעלה תמונת hero, אחר כך סיכום AI של הכתבה, ואז הטקסט המלא. בראש המסך יש כפתור "האזן" שמפעיל נרציית קול (OpenAI TTS, קול עמוק בשם onyx) שמקריא את הכתבה.`,
  },
  {
    id: "briefing",
    label: "Today's Briefing",
    screen: `חזרת לפיד ולחצת על "Today's Briefing" — פיצ'ר שלוקח 3 כתבות נבחרות של היום, מחבר מהן סקריפט, ומקריא אותן ברצף כמו פודקאסט קצר (5-7 דקות) בקול onyx. נגן אודיו מופיע בתחתית המסך.`,
  },
];

type JourneyStep = { step: string; reaction: string };
type AgentResult = {
  persona: string;
  journey: JourneyStep[];
  experience: string;
  onboardingFeedback: string;
  feedFeedback: string;
  wouldReturn: boolean;
  score: number;
  topIssue: string;
  topPraise: string;
  followupQ: string | null;
  followupA: string | null;
};

type Msg = { role: "user" | "assistant"; content: string };

// קריאה בודדת ל-Claude עם זיכרון — fetch ישיר, זהה לפונקציות הקיימות
async function ask(system: string, memory: Msg[], maxTokens = 600): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: memory }),
  });
  if (res.status === 429) {
    // Respect the rate limit: wait and retry a few times.
    const retryAfter = Number(res.headers.get("retry-after")) || 25;
    await new Promise((r) => setTimeout(r, retryAfter * 1000));
    return ask(system, memory, maxTokens);
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Anthropic ${res.status}: ${detail.slice(0, 300)}`);
  }
  const data = await res.json();
  return data?.content?.[0]?.type === "text" ? data.content[0].text : "";
}

// ── סוכן בודד: עובר את כל המסע ────────────────────────────────
async function runAgent(persona: (typeof PERSONAS)[0]): Promise<AgentResult> {
  const system = `You are ${persona.name}, ${persona.age}, a ${persona.occupation}.
Personality: ${persona.personality}
Reading habits: ${persona.readingHabits}
Pain points: ${persona.painPoints}
Tech level: ${persona.techLevel}

You are walking through a new app called Sapience for the first time, screen by screen. React honestly and in-character at each step — with your real impatience, biases and expectations. Do NOT be generically positive.

IMPORTANT: Always write in natural, fluent, native-sounding Hebrew (עברית).`;

  const memory: Msg[] = [];
  const journey: JourneyStep[] = [];

  // 1) מעבר שלב-אחר-שלב
  for (const step of JOURNEY_STEPS) {
    memory.push({
      role: "user",
      content: `מסך נוכחי — ${step.label}:\n${step.screen}\n\nתגיב בקצרה (1-2 משפטים) בגוף ראשון על מה שאתה רואה ומרגיש כרגע. רק התגובה, בלי הקדמות.`,
    });
    const reaction = (await ask(system, memory, 400)).trim();
    memory.push({ role: "assistant", content: reaction });
    journey.push({ step: step.label, reaction });
  }

  // 2) סיכום מובנה של כל המסע
  memory.push({
    role: "user",
    content: `סיימת לעבור על האפליקציה. עכשיו סכם את החוויה הכוללת שלך.
החזר אך ורק JSON תקין (ללא markdown), כל הטקסטים בעברית:
{
  "experience": "תיאור עשיר בגוף ראשון של החוויה הכוללת — מה אהבת, מה הפריע, האם תחזור (4-6 משפטים)",
  "onboardingFeedback": "משפט-שניים על ה-onboarding",
  "feedFeedback": "משפט-שניים על הפיד והתוכן",
  "wouldReturn": true או false,
  "score": מספר 1-10,
  "topIssue": "הבעיה הכי גדולה עבורך (משפט)",
  "topPraise": "הדבר הכי טוב עבורך (משפט)"
}`,
  });
  const summaryRaw = await ask(system, memory, 1200);
  const summary = JSON.parse(summaryRaw.replace(/```json|```/g, "").trim());
  memory.push({ role: "assistant", content: summaryRaw });

  // 3) שאלת מעקב חכמה — רק אם הציון נמוך מהסף
  let followupQ: string | null = null;
  let followupA: string | null = null;
  if (summary.score < FOLLOWUP_THRESHOLD) {
    followupQ = `נתת ציון ${summary.score}/10. מה ספציפית היה צריך להשתנות כדי שתיתן 9 או 10? תן 1-2 דברים קונקרטיים.`;
    memory.push({ role: "user", content: followupQ });
    followupA = (await ask(system, memory, 500)).trim();
  }

  return {
    persona: `${persona.name} (${persona.occupation})`,
    journey,
    ...summary,
    followupQ,
    followupA,
  };
}

// ── בניית הדוח בעברית ────────────────────────────────────────
function buildReport(results: AgentResult[]): string {
  const avg = (results.reduce((s, r) => s + r.score, 0) / results.length).toFixed(1);
  const ret = results.filter((r) => r.wouldReturn).length;

  const L: string[] = [
    "═══════════════════════════════════════",
    "       SAPIENCE — דוח סימולציית משתמשים",
    "═══════════════════════════════════════",
    `📊 ציון ממוצע: ${avg}/10`,
    `🔄 יחזרו לאפליקציה: ${ret}/${results.length} משתמשים`,
    "",
  ];

  for (const r of results) {
    L.push(
      "═══════════════════════════════════════",
      `👤 ${r.persona}`,
      `   ציון: ${"★".repeat(r.score)}${"☆".repeat(10 - r.score)} (${r.score}/10) | חוזר: ${r.wouldReturn ? "✅ כן" : "❌ לא"}`,
      "",
      "   ── המסע שלב-אחר-שלב ──",
    );
    for (const j of r.journey) {
      L.push(`   [${j.step}] ${j.reaction}`);
    }
    L.push(
      "",
      "   ── סיכום החוויה ──",
      `   "${r.experience}"`,
      "",
      `   ⚠️  בעיה עיקרית: ${r.topIssue}`,
      `   ✨ שבח עיקרי: ${r.topPraise}`,
    );
    if (r.followupQ) {
      L.push(
        "",
        `   🔁 שאלת מעקב: ${r.followupQ}`,
        `   💬 ${r.followupA}`,
      );
    }
    L.push("");
  }

  // ריכוז דפוסים
  L.push("───────────────────────────────────────", "  כל הבעיות (לזיהוי דפוסים)", "───────────────────────────────────────");
  results.forEach((r) => L.push(`• [${r.persona.split(" ")[0]}] ${r.topIssue}`));
  L.push("", "───────────────────────────────────────", "  כל השבחים", "───────────────────────────────────────");
  results.forEach((r) => L.push(`• [${r.persona.split(" ")[0]}] ${r.topPraise}`));
  L.push("", "═══════════════════════════════════════");
  return L.join("\n");
}

// ── שמירה ל-DB ───────────────────────────────────────────────
let lastSaveError: string | null = null;
async function saveToDb(results: AgentResult[], report: string): Promise<string | null> {
  const avg = Number((results.reduce((s, r) => s + r.score, 0) / results.length).toFixed(1));
  const ret = results.filter((r) => r.wouldReturn).length;

  const { data: run, error: runErr } = await supabase
    .from("simulation_runs")
    .insert({ avg_score: avg, would_return: ret, total_agents: results.length, report_text: report, raw_results: results })
    .select("id").single();

  if (runErr || !run) { console.error("Failed to save run:", runErr); lastSaveError = runErr?.message ?? "unknown"; return null; }

  const rows = results.map((r) => ({
    run_id: run.id,
    persona: r.persona,
    experience: r.experience,
    onboarding_fb: r.onboardingFeedback,
    feed_fb: r.feedFeedback,
    would_return: r.wouldReturn,
    score: r.score,
    top_issue: r.topIssue,
    top_praise: r.topPraise,
    journey: r.journey,
    followup_q: r.followupQ,
    followup_a: r.followupA,
  }));
  const { error: agentsErr } = await supabase.from("simulation_agents").insert(rows);
  if (agentsErr) console.error("Failed to save agents:", agentsErr);

  return run.id;
}

// ── Handler ──────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Optional ?personas=N (or body { personas }) to keep within the Anthropic
    // tier rate limit. Default: all. Agents run SEQUENTIALLY (not in parallel)
    // so cumulative token throughput stays under the per-minute cap.
    let count = PERSONAS.length;
    let only: string | null = null;
    try {
      const url = new URL(req.url);
      only = url.searchParams.get("persona");
      const qp = Number(url.searchParams.get("personas"));
      if (qp) count = qp;
      if (req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        if (body?.persona) only = body.persona;
        if (body?.personas) count = Number(body.personas);
      }
    } catch { /* ignore */ }

    // ?persona=Name → run just that one; otherwise first N (sequential).
    const list = only
      ? PERSONAS.filter((p) => p.name.toLowerCase() === only!.toLowerCase())
      : PERSONAS.slice(0, Math.max(1, Math.min(count, PERSONAS.length)));
    if (list.length === 0) {
      return new Response(JSON.stringify({ error: `Unknown persona "${only}"` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: AgentResult[] = [];
    for (const p of list) {
      results.push(await runAgent(p));
    }
    const report = buildReport(results);
    const runId = await saveToDb(results, report);

    return new Response(JSON.stringify({ runId, saveError: lastSaveError, report, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
