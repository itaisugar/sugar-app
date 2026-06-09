// Shared Hebrew localization for Sapience content.
//
// Produces editorial, idiomatic Hebrew that reads as if it was written in
// Hebrew — NOT a literal translation. This is the single source of Hebrew
// quality, used at content creation (translate-item, called right after a row
// is inserted) and by the backfill job, so every article exists in both
// languages with the same voice.

export type HebrewFields = {
  title_he: string;
  hook_he: string | null;
  summary_he: string;
};

// One paragraph-per-slide carousel + a long-read body depend on the blank-line
// structure, so paragraph breaks must survive verbatim.
const HEBREW_SYSTEM = `You are a senior Hebrew editor at Sapience, a premium app for intellectual reading. You take English editorial content and produce Hebrew that reads as if it was ORIGINALLY WRITTEN in Hebrew by a first-rate Hebrew journalist — never as a translation.

Hard rules:
- Write natural, fluent, literary Hebrew. Rebuild each sentence in correct Hebrew word order and syntax; never mirror the English structure.
- Eliminate translationese: no Anglicisms, no calques, no word-for-word renderings, no stilted phrasing. If a literal version sounds foreign, re-express the idea the way a Hebrew writer actually would.
- Register: calm, precise, intellectual, journalistic — the Hebrew of a quality long-read (think Haaretz / Alaxon), not marketing copy and not a dry textbook.
- Preserve meaning, facts, numbers, and logic EXACTLY. Add nothing, drop nothing, soften nothing.
- Keep proper names, brands, and established technical terms in the form Hebrew readers know (Latin script where that's standard; otherwise the accepted Hebrew form). Do not transliterate names that are normally left in English.
- Preserve paragraph structure EXACTLY: every blank line ("\\n\\n") in the source summary MUST appear as a blank line in the Hebrew. Never merge or split paragraphs.
- Keep sentences short and punchy — each paragraph is also shown as a single carousel slide. One idea per paragraph. Use natural Hebrew connectors (אך, ואולם, משום ש, ולכן…).
- Use Hebrew punctuation and quotation marks (גרשיים) naturally. No markdown, no headings, no notes to the reader.

Return STRICT JSON only — no preface, no code fences.`;

export async function localizeToHebrew(
  fields: { title: string; hook?: string | null; summary: string },
  apiKey: string,
): Promise<HebrewFields> {
  const payload = {
    title: fields.title,
    hook: fields.hook ?? '',
    summary: fields.summary,
  };
  const user = `Rewrite these fields in Hebrew per the rules. Return JSON with keys "title", "hook", "summary". If "hook" is empty, return "".

Source:
${JSON.stringify(payload, null, 2)}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: HEBREW_SYSTEM,
      messages: [{ role: 'user', content: user }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Hebrew localization failed: ${res.status} ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const text: string = data?.content?.[0]?.text ?? '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in Hebrew localization response.');
  const out = JSON.parse(match[0]) as { title: string; hook: string; summary: string };

  return {
    title_he: (out.title ?? '').trim(),
    hook_he: (out.hook ?? '').trim() ? out.hook.trim() : null,
    summary_he: (out.summary ?? '').trim(),
  };
}
